import { watch } from 'vue'

const ENDPOINT = '/api/analytics/events'
const SESSION_TIMEOUT = 30 * 60 * 1000
const uuid = () => {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
let enabled = false, router, locale, visitorId, session, page, flushing = false
let queue = []
let storageAvailable = true
const read = (storage, key) => { try { return window[storage].getItem(key) } catch { storageAvailable = false; return null } }
const write = (storage, key, value) => { try { window[storage].setItem(key, value) } catch { storageAvailable = false } }
function device() {
  const width = window.screen.width
  return width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
}
function publicPath(path) { return path === '/' || /^\/(about|contact|solutions|projects|insights)(\/[^?#]+)?$/.test(path) }
function source() {
  try { const url = new URL(document.referrer); return url.origin === location.origin ? 'direct' : url.hostname }
  catch { return 'direct' }
}
function identify(touch = true) {
  if (!visitorId) {
    visitorId = read('localStorage', 'tzme-analytics-visitor')
    if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(visitorId || '')) { visitorId = uuid(); write('localStorage', 'tzme-analytics-visitor', visitorId) }
  }
  if (!session) {
    try { session = JSON.parse(read('sessionStorage', 'tzme-analytics-session')) } catch { session = null }
  }
  if (!session?.id || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(session.id) || !Number.isFinite(session.last) || !/^[a-zA-Z0-9.-]{1,255}$/.test(session.source || '') || Date.now() - session.last > SESSION_TIMEOUT) {
    session = { id: uuid(), last: Date.now(), source: source() }
  }
  if (touch) session.last = Date.now()
  if (storageAvailable) write('sessionStorage', 'tzme-analytics-session', JSON.stringify(session))
}
function context() {
  return { visitorId, sessionId: session.id, path: router.currentRoute.value.path,
    locale: locale.value, device: device(), referrerHost: session.source || 'direct' }
}
function enqueue(event) {
  if (queue.length >= 100) queue.shift()
  // Replace repeated engagement updates in the queue instead of adding duplicates.
  const existing = queue.findIndex(item => item.id === event.id)
  if (existing >= 0) queue[existing] = event
  else queue.push(event)
}
export function trackEvent(name, target = '') {
  if (!enabled || !router || !publicPath(router.currentRoute.value.path)) return
  const previousSession = session?.id
  identify()
  if (page && previousSession && previousSession !== session.id) { finishPage(); beginPage() }
  enqueue({ id: uuid(), ...context(), name, target: String(target).slice(0, 255), duration: 0, scrollDepth: 0 })
}
export function inquiryAnalyticsContext() {
  if (!enabled || !router || !publicPath(router.currentRoute.value.path)) return undefined
  const previousSession = session?.id
  identify()
  if (page && previousSession && previousSession !== session.id) { finishPage(); beginPage() }
  return context()
}
function accumulate() {
  if (!page) return
  if (page.activeSince != null) page.elapsed += performance.now() - page.activeSince
  page.activeSince = document.visibilityState === 'visible' ? performance.now() : null
}
function engagement() {
  if (!page) return
  accumulate()
  enqueue({ id: page.engagementId, ...page.context, name: 'page_engagement', target: '',
    duration: Math.min(86400, Math.round(page.elapsed / 1000)), scrollDepth: page.scrollDepth })
}
function finishPage() { engagement(); page = null }
function beginPage() {
  if (!enabled || !publicPath(router.currentRoute.value.path)) return
  identify()
  page = { engagementId: uuid(), context: context(), elapsed: 0,
    activeSince: document.visibilityState === 'visible' ? performance.now() : null, scrollDepth: 0 }
  enqueue({ id: uuid(), ...page.context, name: 'page_view', target: '', duration: 0, scrollDepth: 0 })
  updateScroll()
}
function updateScroll() {
  if (!page || !document.querySelector('.design-site')) return
  const height = document.documentElement.scrollHeight
  if (height <= 0) return
  page.scrollDepth = Math.max(page.scrollDepth, Math.min(100, Math.round((window.scrollY + window.innerHeight) / height * 100)))
}
let lastActivityWrite = 0
function markActivity() {
  if (!enabled || !session || !publicPath(router.currentRoute.value.path)) return
  const now = Date.now()
  if (now - session.last > SESSION_TIMEOUT || now - lastActivityWrite < 5000) return
  session.last = now; lastActivityWrite = now
  if (storageAvailable) write('sessionStorage', 'tzme-analytics-session', JSON.stringify(session))
}
async function flush(beacon = false) {
  if (!enabled || !queue.length || (flushing && !beacon)) return
  if (beacon && navigator.sendBeacon) {
    while (queue.length) {
      const items = queue.slice(0, 20)
      if (!navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify({ events: items })], { type: 'application/json' }))) break
      queue.splice(0, items.length)
    }
    if (!queue.length) return
  }
  flushing = true
  const items = queue.splice(0, 20)
  try {
    const response = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: items }), keepalive: true })
    if (!response.ok && response.status !== 400 && response.status !== 413) queue = [...items, ...queue].slice(-100)
  } catch { queue = [...items, ...queue].slice(-100) }
  finally { flushing = false }
}
function captureClick(event) {
  if (!enabled || !publicPath(router.currentRoute.value.path) || !(event.target instanceof Element)) return
  const control = event.target.closest('[data-analytics-event],a[href],.hc-btn,.hc-lnk')
  if (!control || control.closest('.inquiry-form') || control.matches(':disabled,[aria-disabled="true"]')) return
  if (control.dataset.analyticsEvent) { trackEvent(control.dataset.analyticsEvent, control.dataset.analyticsTarget || ''); return }
  const href = control.getAttribute('href')
  if (href?.startsWith('mailto:') || href?.startsWith('tel:')) { trackEvent('contact_click', href.startsWith('tel:') ? 'phone' : 'email'); return }
  if (href) {
    try {
      const url = new URL(href, location.origin)
      if (!['http:', 'https:'].includes(url.protocol)) return
      if (url.origin !== location.origin) { trackEvent('cta_click', `external:${url.hostname}`); return }
      if (!publicPath(url.pathname)) return
      const type = control.closest('[data-site-nav],.hc-foot') ? 'navigation_click'
        : /^\/(solutions|projects|insights)\/.+/.test(url.pathname) ? 'content_click' : 'cta_click'
      trackEvent(type, url.pathname)
      return
    } catch { return }
  }
  trackEvent('cta_click', control.dataset.action || 'website-button')
}
export function installAnalytics(siteRouter, currentLocale) {
  router = siteRouter; locale = currentLocale
  router.afterEach((to, from, failure) => {
    if (!enabled || failure || to.path === from.path) return
    finishPage(); beginPage(); flush()
  })
  watch(locale, value => trackEvent('language_change', value))
  document.addEventListener('click', captureClick, true)
  document.addEventListener('visibilitychange', () => { engagement(); if (document.visibilityState === 'hidden') flush(true) })
  window.addEventListener('pagehide', () => { engagement(); flush(true) })
  window.addEventListener('pageshow', event => { if (event.persisted && page) page.activeSince = performance.now() })
  window.addEventListener('scroll', () => { updateScroll(); markActivity() }, { passive: true })
  document.addEventListener('pointerdown', markActivity, { passive: true })
  document.addEventListener('keydown', markActivity, { passive: true })
  document.addEventListener('keydown', event => { if (event.key === 'Enter' && event.target instanceof Element && event.target.matches('[role="link"]')) captureClick(event) }, true)
  setInterval(() => { engagement(); flush() }, 30000)
  setInterval(() => flush(), 5000)
  const configure = async () => {
    try {
      const response = await fetch('/api/analytics/config', { cache: 'no-store' })
      if (!response.ok) return
      const config = await response.json()
      const next = config.enabled === true && navigator.doNotTrack !== '1' && !navigator.globalPrivacyControl
      if (next === enabled) return
      if (next) { await router.isReady(); enabled = true; if (!page) beginPage(); flush() }
      else { page = null; queue = []; enabled = false }
    } catch { /* Analytics availability never blocks the website. */ }
  }
  configure()
  setInterval(configure, 60000)
}
