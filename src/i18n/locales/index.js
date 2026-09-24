import en from './en.js'
import zh from './zh.js'

// Add another language file and one entry here to make it available everywhere.
export const availableLocales = [
  { code: 'en', label: 'English', shortLabel: 'EN', htmlLang: 'en', messages: en },
  { code: 'zh', label: '中文', shortLabel: '中', htmlLang: 'zh-CN', messages: zh },
]

export const defaultLocale = 'en'
export const localeMessages = Object.fromEntries(
  availableLocales.map(({ code, messages }) => [code, messages]),
)
