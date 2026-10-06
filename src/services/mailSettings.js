import { ref } from 'vue'
import { apiRequest, registerDataLoader } from './api.js'

const settings = ref(null)
export async function loadMailSettings() {
  const value = await apiRequest('/api/mail-settings')
  if (!value?.smtp || !Array.isArray(value.recipients)) throw new Error('Invalid mail settings')
  settings.value = value
  return value
}
export async function saveMailSettings(value) {
  const saved = await apiRequest('/api/mail-settings', { method: 'PUT', body: value })
  settings.value = saved
  return saved
}
registerDataLoader('/api/mail-settings', loadMailSettings)
export function useMailSettings() { return { mailSettings: settings } }
