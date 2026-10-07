import { ref } from 'vue'
import { apiRequest, dataErrors, registerDataLoader } from './api.js'
import { isAboutSettings } from '../data/aboutTzme.js'

const path = '/api/about-tzme'
const settings = ref(null)
let pending
export function loadAboutTzme() {
  if (pending) return pending
  pending = (async () => {
    try {
      const value = await apiRequest(path)
      if (!isAboutSettings(value)) throw new Error('Invalid About TZME settings')
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
export async function saveAboutTzme(value) {
  const saved = await apiRequest(path, { method: 'PUT', body: value })
  if (!isAboutSettings(saved)) throw new Error('Invalid saved About TZME settings')
  settings.value = saved
  dataErrors.delete(path)
  return saved
}
registerDataLoader(path, loadAboutTzme)
export function useAboutTzme() { return { aboutTzme: settings, loadAboutTzme } }
