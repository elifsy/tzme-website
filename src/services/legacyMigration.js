// Reads legacy storage only for the explicit one-time import, never for page data.
import { apiRequest } from './api.js'

const types = ['industries', 'products', 'articles', 'certifications', 'projects']
function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
export function legacyChanges() {
  const all = read('tzme-content-edits', {})
  return types.flatMap((type) => {
    const edits = type === 'projects' ? read('tzme-project-edits', {}) : all[type] || {}
    const records = read(`tzme-${type}`, [])
    return Object.entries(edits).filter(([, action]) => ['save', 'delete'].includes(action)).map(([id, action]) => ({
      type, id, action, record: Array.isArray(records) ? records.find((record) => record.id === id) : undefined,
    }))
  })
}
export function exportLegacyData() {
  const keys = ['tzme-content-edits', 'tzme-project-edits', 'tzme-home-global-cache', ...types.map((type) => `tzme-${type}`)]
  const backup = Object.fromEntries(keys.map((key) => [key, read(key, null)]))
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = 'tzme-legacy-browser-data.json'; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function complete(change) {
  const key = change.type === 'projects' ? 'tzme-project-edits' : 'tzme-content-edits'
  const edits = read(key, {})
  if (change.type === 'projects') edits[change.id] = 'migrated'
  else { edits[change.type] ||= {}; edits[change.type][change.id] = 'migrated' }
  localStorage.setItem(key, JSON.stringify(edits))
}
export async function migrateLegacyData() {
  const changes = legacyChanges()
  const remote = Object.fromEntries(await Promise.all(types.map(async (type) => {
    const records = await apiRequest(`/api/${type}`)
    if (!Array.isArray(records)) throw new Error('Invalid data response')
    return [type, new Map(records.map((record) => [record.id, record]))]
  })))
  // Create industries before linked products; deselect cards before selecting new ones.
  function priority(change) {
    if (change.type === 'industries') return change.action === 'save' ? 0 : 4
    if (change.action === 'delete') return 1
    return change.record?.showOnHome ? 3 : 2
  }
  let imported = 0
  const failed = []
  for (const change of changes.sort((a, b) => priority(a) - priority(b))) {
    try {
      const path = `/api/${change.type}`
      const existing = remote[change.type].get(change.id)
      if (change.action === 'delete') {
        if (existing && existing.status !== 'deleted') await apiRequest(`${path}/${encodeURIComponent(change.id)}`, { method: 'DELETE' })
      } else {
        if (!change.record) throw new Error('Missing legacy record')
        const { dbId: ignored, ...record } = change.record
        if (change.type === 'certifications') {
          record.issuedAt ||= null; record.expiresAt ||= null
        }
        if (['products', 'articles'].includes(change.type)) record.date ||= null
        await apiRequest(path + (existing ? `/${encodeURIComponent(change.id)}` : ''), { method: existing ? 'PUT' : 'POST', body: record })
      }
      complete(change); imported++
    } catch (error) { failed.push({ ...change, error: error.message }) }
  }
  return { imported, failed }
}
