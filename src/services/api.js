import { reactive, ref } from 'vue'

export const dataErrors = reactive(new Map())
const retries = new Map()

export function registerDataLoader(path, loader) { retries.set(path, loader) }
export async function retryFailedData() {
  await Promise.allSettled([...dataErrors.keys()].map((path) => retries.get(path)?.()))
}
export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  try {
    const response = await fetch(path, {
      method, signal, cache: 'no-store', headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`)
      error.status = response.status
      throw error
    }
    const value = response.status === 204 ? null : await response.json()
    if (method === 'GET') dataErrors.delete(path)
    return value
  } catch (error) {
    if (method === 'GET' && error.name !== 'AbortError') dataErrors.set(path, error.message)
    throw error
  }
}
export function createCollection(path, normalize = (item) => item) {
  const records = ref([])
  const loading = ref(false)
  let pending
  function load() {
    if (pending) return pending
    loading.value = true
    pending = (async () => {
      try {
        const response = await apiRequest(path)
        if (!Array.isArray(response)) throw new Error('Invalid data response')
        records.value = response.filter((item) => item.status !== 'deleted').map(normalize)
        dataErrors.delete(path)
      } catch (error) {
        records.value = []
        dataErrors.set(path, error.message)
      } finally { loading.value = false; pending = undefined }
      return records.value
    })()
    return pending
  }
  registerDataLoader(path, load)
  return { records, loading, load }
}
