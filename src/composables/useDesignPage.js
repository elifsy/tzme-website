import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { localeMessages } from '../i18n/locales/index.js'
import { useSiteNavigation } from './useSiteNavigation.js'
import { useContactSettings } from '../services/contactSettings.js'
import { i18n } from '../i18n/index.js'

function englishCopy(locale) {
  const messages = i18n.global.getLocaleMessage(locale).site || {}
  return new Map(Object.entries(messages).map(([key, translated]) => [translated, localeMessages.en.site[key]]))
}

export function useDesignPage(pageKey, page) {
  const { t, locale } = useI18n({ useScope: 'global' })
  const { contactSettings } = useContactSettings()
  const contactEmail = () => contactSettings.value?.contact.emails.join(' / ') || contactSettings.value?.contact.phone || ''
  const { goTo, menuItems, isMenuActive, navigateLink } = useSiteNavigation()

  function onClick(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    const root = page.value
    const target = event.target instanceof Element ? event.target : null
    if (!root || !target || target.closest('[data-site-nav]')) return
    const control = target.closest('.hc-logo,.hc-btn,.hc-lnk,.hc-ico,.hc-soc>span')
    if (!control || !root.contains(control)) return
    event.preventDefault()

    if (control.matches('.hc-logo')) return goTo('/')
    if (control.matches('.hc-ico')) return goTo('/solutions')
    if (control.matches('.hc-soc>span')) {
      ElMessage.info(t('contactUi.contactEmailNotice', { email: contactEmail() }))
      return
    }

    const label = (control.dataset.action || control.textContent).replace(/→/g, '').trim().toLowerCase()
    if (label.includes('all project')) return goTo('/projects')
    if (label.includes('industr')) return goTo('/#industries')
    if (label.includes('contact') || label.includes('project') || label.includes('quote') || label.includes('certificate') || label.includes('factory visit') || label.includes('subscribe')) return goTo('/contact')
    if (label.includes('datasheet')) {
      ElMessage.info(t('contactUi.datasheetEmailNotice', { email: contactEmail() }))
      return
    }
    if (label.includes('facility') || label.includes('global reach')) return goTo('/about')
    if (label.includes('solution') || label.includes('product list') || label.includes('port equipment')) return goTo('/solutions')
  }

  function onKeydown(event) {
    if (!['Enter', ' '].includes(event.key)) return
    if (!(event.target instanceof Element) || event.target.closest('[data-site-nav],a,button,input,textarea,select')) return
    if (event.target.matches('.hc-logo,.hc-lnk,.hc-ico,.hc-soc>span')) onClick(event)
  }

  onMounted(() => {
    const root = page.value
    root?.querySelectorAll('.hc-btn,.hc-lnk').forEach((control) => {
      if (control.closest('[data-site-nav]')) return
      const label = control.textContent.replace(/→/g, '').trim()
      control.dataset.action = englishCopy(locale.value).get(label) || label
    })
    root?.addEventListener('click', onClick)
    root?.addEventListener('keydown', onKeydown)
    root?.querySelectorAll('.hc-logo,.hc-lnk,.hc-ico,.hc-soc>span').forEach((control) => {
      if (control.closest('[data-site-nav]') || control.matches('a,button')) return
      control.tabIndex = 0
      control.setAttribute('role', 'link')
    })
  })
  onUnmounted(() => {
    page.value?.removeEventListener('click', onClick)
    page.value?.removeEventListener('keydown', onKeydown)
  })

  return { goTo, menuItems, isMenuActive, navigateLink }
}
