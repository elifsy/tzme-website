import { ref } from 'vue'
import { i18n } from '../i18n/index.js'
import { localeMessages } from '../i18n/locales/index.js'
import { apiRequest, dataErrors, registerDataLoader } from './api.js'

const content = ref(null)
export async function loadWebsiteContent() {
  try {
    const value = await apiRequest('/api/site-settings')
    if (!value?.translations?.en || !value.translations.zh || !value.assets || !value.values || !Array.isArray(value.mapCountries)) {
      throw new Error('Invalid website settings')
    }
    for (const [code, messages] of Object.entries(value.translations)) {
      i18n.global.setLocaleMessage(code, { ...(localeMessages[code] || localeMessages.en), site: messages })
    }
    content.value = value
    return true
  } catch (error) {
    content.value = null
    dataErrors.set('/api/site-settings', error.message)
    return false
  }
}
registerDataLoader('/api/site-settings', loadWebsiteContent)
export function useSiteContent() {
  return {
    siteContent: content,
    siteAsset: (key) => content.value?.assets?.[key] ?? '',
    siteValue: (key) => content.value?.values?.[key] ?? '',
  }
}
