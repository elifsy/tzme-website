import { ref } from 'vue'
import { apiRequest } from './api.js'

export const currentSeoPage = ref(null)
export const seoSettings = ref(null)
export async function loadSeoSettings() {
  if (seoSettings.value) return seoSettings.value
  return seoSettings.value = await apiRequest('/api/seo/settings')
}
function meta(attribute, name, value) {
  let node = document.head.querySelector(`meta[${attribute}="${name}"]`)
  if (!node) { node = document.createElement('meta'); node.setAttribute(attribute, name); document.head.append(node) }
  node.content = value || ''
}
function apply(page) {
  currentSeoPage.value = page
  document.title = page.title; document.documentElement.lang = 'zh-CN'
  meta('name','description',page.description); meta('name','robots',page.robots)
  let canonical = document.head.querySelector('link[rel=canonical]')
  if (page.status === 200 && page.kind !== 'admin') {
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical) }
    canonical.href = page.url
  } else canonical?.remove()
  for (const [key,value] of Object.entries({ title:page.title,description:page.description,url:page.url,locale:'zh_CN',type:page.kind === 'article' ? 'article' : 'website' })) meta('property','og:'+key,value)
  const image = page.image?.startsWith('/') ? new URL(page.image,page.url).href : page.image
  meta('property','og:image',image)
  let schema = document.getElementById('site-structured-data')
  if (page.structuredData?.['@graph']?.length) {
    if (!schema) { schema = document.createElement('script'); schema.type = 'application/ld+json'; schema.id = 'site-structured-data'; document.head.append(schema) }
    schema.textContent = JSON.stringify(page.structuredData).replaceAll('<','\\u003c')
  } else schema?.remove()
}
export function installSeo(router) {
  let pending, sequence = 0
  router.afterEach(async (to, from, failure) => {
    if (failure) return
    pending?.abort(); const controller = new AbortController(); pending = controller; const request = ++sequence
    if (/^\/admin(?:\/|$)/.test(to.path)) {
      apply({ title:'管理后台 - TZME 重钢机械',description:'TZME 网站管理后台',robots:'noindex,nofollow,noarchive',kind:'admin',status:200,faqs:[] }); return
    }
    try {
      const response = await fetch('/api/seo/page?' + new URLSearchParams({ path:to.fullPath }), { signal:controller.signal,cache:'no-store' })
      if (!response.ok) throw Error('Page metadata is unavailable')
      const page = await response.json()
      if (request === sequence) apply(page)
    } catch (error) {
      if (error.name === 'AbortError') return
      apply({ title:'TZME 重钢机械｜非标机械装备制造',description:'天津重钢机械装备股份有限公司，提供非标机械装备制造、质量检验与交付服务。',robots:'noindex,follow',kind:'unavailable',status:503,faqs:[] })
    }
  })
  loadSeoSettings().then(settings => {
    const names = {baidu:'baidu-site-verification',bing:'msvalidate.01',so360:'360-site-verification',sogou:'sogou_site_verification'}
    for (const [key,name] of Object.entries(names)) if (settings.verification[key]) meta('name',name,settings.verification[key])
    meta('property','og:site_name',settings.siteName)
  }).catch(() => {})
}
