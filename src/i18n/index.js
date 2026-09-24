import { createI18n } from 'vue-i18n'
import { siteMessages } from './site.js'
import { adminMessages } from './admin.js'

const storedLocale = localStorage.getItem('tzme-locale')
const initialLocale = storedLocale === 'zh' ? 'zh' : 'en'

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: {
    en: { site: siteMessages.en, admin: adminMessages.en },
    zh: { site: siteMessages.zh, admin: adminMessages.zh },
  },
})

document.documentElement.lang = initialLocale === 'zh' ? 'zh-CN' : 'en'

export function setLocale(value) {
  const next = value === 'zh' ? 'zh' : 'en'
  i18n.global.locale.value = next
  localStorage.setItem('tzme-locale', next)
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
}
