import { ref } from 'vue'
import { apiRequest, dataErrors, registerDataLoader } from './api.js'

const settings = ref(null)
export async function loadContactSettings() {
  try {
    const value = await apiRequest('/api/contact-settings')
    if (!value?.contact || !Array.isArray(value.subsidiaries) || !value.form || !value.upload || !Array.isArray(value.upload.allowedExtensions)) throw new Error('Invalid contact settings')
    settings.value = value
    return true
  } catch (error) {
    settings.value = null
    dataErrors.set('/api/contact-settings', error.message)
    return false
  }
}
registerDataLoader('/api/contact-settings', loadContactSettings)
export function useContactSettings() { return { contactSettings: settings, loadContactSettings } }
export async function saveContactSettings(value) {
  const body = Object.fromEntries(['contact', 'subsidiaries', 'form', 'upload'].map(key => [key, value[key]]))
  const saved = await apiRequest('/api/contact-settings/admin', { method: 'PUT', body })
  const { notification, ...publicSettings } = saved
  settings.value = publicSettings
  dataErrors.delete('/api/contact-settings')
  return saved
}
export const contactText = (value, locale) => value?.[locale] || value?.en || ''
export const contactWebsiteUrl = value => value ? (/^https?:\/\//i.test(value) ? value : `https://${value}`) : ''
export const inquiryFieldLabels = { name: 'site.name', company: 'site.company', country: 'site.country', email: 'site.email', phone: 'site.phone', industry: 'site.industry', requirements: 'site.projectRequirements' }
export const attachmentTypes = ['pdf', 'dwg', 'dxf', 'xls', 'xlsx', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp', 'zip', 'txt']
