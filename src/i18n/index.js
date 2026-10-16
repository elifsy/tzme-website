import { createI18n } from 'vue-i18n'
import { availableLocales, defaultLocale, englishSiteUrl, localeMessages } from './locales/index.js'

const initialLocale = defaultLocale
try { localStorage.setItem('tzme-locale', defaultLocale) } catch { /* Browsing remains available without storage. */ }

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: defaultLocale,
  messages: localeMessages,
})

document.documentElement.lang = availableLocales.find(({ code }) => code === initialLocale).htmlLang

export function setLocale(value) {
  if (value === 'en') { window.location.assign(englishSiteUrl); return }
  if (value !== defaultLocale) return
  const next = defaultLocale
  i18n.global.locale.value = next
  try { localStorage.setItem('tzme-locale', next) } catch { /* Storage is optional. */ }
  document.documentElement.lang = availableLocales.find(({ code }) => code === next).htmlLang
}
