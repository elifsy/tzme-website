import { ref } from 'vue'
import { apiRequest, dataErrors, registerDataLoader } from './api.js'
import { isCapabilitiesSettings } from '../data/capabilities.js'

const path = '/api/home-capabilities'
const settings = ref(null)
let pending
export function loadCapabilities() {
  if (pending) return pending
  pending = (async () => {
    try {
      const value = await apiRequest(path)
      if (!isCapabilitiesSettings(value)) throw new Error('Invalid homepage capabilities settings')
      settings.value = value
      dataErrors.delete(path)
      return value
    } catch (error) {
      settings.value = null
      dataErrors.set(path, error.message)
      return null
    } finally { pending = undefined }
  })()
  return pending
}
export async function saveCapabilities(value) {
  const saved = await apiRequest(path, { method: 'PUT', body: value })
  if (!isCapabilitiesSettings(saved)) throw new Error('Invalid saved capabilities settings')
  settings.value = saved
  dataErrors.delete(path)
  return saved
}
registerDataLoader(path, loadCapabilities)
export function useCapabilities() { return { capabilities: settings, loadCapabilities } }
