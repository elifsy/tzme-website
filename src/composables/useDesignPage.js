import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { localeMessages } from '../i18n/locales/index.js'

const navigationItems = [
  { key: 'navHome', path: '/' },
  { key: 'navAbout', path: '/about' },
  { key: 'navProducts', path: '/solutions' },
  { key: 'navNews', path: '/insights' },
  { key: 'navContact', path: '/contact' },
]

const englishCopyByLocale = Object.fromEntries(Object.entries(localeMessages).map(([code, messages]) => [
  code,
  new Map(Object.entries(messages.site).map(([key, translated]) => [translated, localeMessages.en.site[key]])),
]))

export function useDesignPage(pageKey, page) {
  const route = useRoute()
  const router = useRouter()
  const { t, locale } = useI18n({ useScope: 'global' })
  const drawerOpen = ref(false)
  const menuItems = computed(() => navigationItems.map(({ key, path }) => ({
    key,
    label: t(`site.${key}`),
    path,
  })))
  function isMenuActive(item) {
    if (item.key === 'navHome') return route.path === '/'
    if (item.key === 'navProducts') return route.path.startsWith('/solutions')
    if (item.key === 'navNews') return route.path.startsWith('/insights')
    return route.path === item.path
  }
  async function goTo(path) {
    drawerOpen.value = false
    const [pathname, hash] = path.split('#')
    await router.push({ path: pathname || '/', hash: hash ? `#${hash}` : '' })
    await nextTick()
    if (hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  function navigateLink(event, path) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    goTo(path)
  }

  async function submitInquiry(form) {
    const values = {}
    const fieldNames = ['name', 'company', 'country', 'email', 'phone', 'industry', 'requirements']
    for (const [index, field] of [...form.querySelectorAll('.hc-f')].entries()) {
      const name = fieldNames[index]
      const input = field.querySelector('input,textarea')
      if (name && input) values[name] = input.value.trim()
    }
    const required = ['name', 'company', 'country', 'email', 'industry', 'requirements']
    const missing = required.find((name) => !values[name])
    if (missing) {
      ElMessage.warning(t('site.inquiryMissing', { field: missing === 'requirements' ? t('site.projectRequirements') : missing }))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      ElMessage.warning(t('site.inquiryInvalidEmail'))
      return
    }
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      form.querySelectorAll('input,textarea').forEach((input) => {
        input.value = ''
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      ElMessage.success(t('site.inquirySent'))
    } catch {
      ElMessage.error(t('site.inquiryFailed'))
    }
  }

  function onClick(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    const root = page.value
    const target = event.target instanceof Element ? event.target : null
    if (!root || !target) return
    const control = target.closest('.hc-logo,.hc-btn,.hc-lnk,.hc-ico,.hc-upload,.hc-soc>span')
    if (!control || !root.contains(control)) return
    event.preventDefault()

    if (control.matches('.hc-logo')) return goTo('/')
    if (control.matches('.hc-ico')) return goTo('/solutions')
    if (control.matches('.hc-soc>span')) {
      ElMessage.info(t('site.contactEmailNotice'))
      return
    }
    if (control.matches('.hc-upload')) {
      ElMessage.info(t('site.attachmentEmailNotice'))
      return
    }

    const label = (control.dataset.action || control.textContent).replace(/→/g, '').trim().toLowerCase()
    if (label === 'send inquiry') return submitInquiry(control.closest('.hc-form'))
    if (label.includes('all project')) return goTo('/#projects')
    if (label.includes('industr')) return goTo('/#industries')
    if (label.includes('contact') || label.includes('project') || label.includes('quote') || label.includes('certificate') || label.includes('factory visit') || label.includes('subscribe')) return goTo('/contact')
    if (label.includes('datasheet')) {
      ElMessage.info(t('site.datasheetEmailNotice'))
      return
    }
    if (label.includes('facility') || label.includes('global reach')) return goTo('/about')
    if (label.includes('solution') || label.includes('product list') || label.includes('port equipment')) return goTo('/solutions')
  }

  function onKeydown(event) {
    if (!['Enter', ' '].includes(event.key)) return
    if (event.target.matches('.hc-logo,.hc-lnk,.hc-ico,.hc-upload,.hc-soc>span')) onClick(event)
  }

  onMounted(() => {
    const root = page.value
    root?.querySelectorAll('.hc-btn,.hc-lnk').forEach((control) => {
      const label = control.textContent.replace(/→/g, '').trim()
      control.dataset.action = englishCopyByLocale[locale.value]?.get(label) || label
    })
    root?.addEventListener('click', onClick)
    root?.addEventListener('keydown', onKeydown)
    root?.querySelectorAll('.hc-logo,.hc-lnk,.hc-ico,.hc-upload,.hc-soc>span').forEach((control) => {
      control.tabIndex = 0
      control.setAttribute('role', 'link')
    })
  })
  onUnmounted(() => {
    page.value?.removeEventListener('click', onClick)
    page.value?.removeEventListener('keydown', onKeydown)
  })

  return { drawerOpen, goTo, menuItems, isMenuActive, navigateLink }
}
