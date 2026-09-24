import { createI18n } from 'vue-i18n'
import { availableLocales, defaultLocale, localeMessages } from './locales/index.js'

const storedLocale = localStorage.getItem('tzme-locale')
const initialLocale = Object.hasOwn(localeMessages, storedLocale) ? storedLocale : defaultLocale

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: defaultLocale,
  messages: localeMessages,
})

document.documentElement.lang = availableLocales.find(({ code }) => code === initialLocale).htmlLang

export function setLocale(value) {
  if (!Object.hasOwn(localeMessages, value)) return
  const next = value
  i18n.global.locale.value = next
  localStorage.setItem('tzme-locale', next)
  document.documentElement.lang = availableLocales.find(({ code }) => code === next).htmlLang
}
