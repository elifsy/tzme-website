import { ref } from 'vue'
import { industrySeed } from '../data/industries.js'

const listKey = 'tzme-industries'
const editsKey = 'tzme-content-edits'

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

function changes() {
  return readJson(editsKey, {}).industries || {}
}

function remember(id, action) {
  const edits = readJson(editsKey, {})
  edits.industries ||= {}
  edits.industries[id] = action
  localStorage.setItem(editsKey, JSON.stringify(edits))
}

function sortIndustries(records) {
  return records.sort((a, b) =>
    (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)
    || (a.titleEn || '').localeCompare(b.titleEn || ''))
}

export function industryField(item, name, locale) {
  if (!item) return ''
  return locale === 'zh'
    ? item[`${name}Zh`] || item[`${name}En`] || ''
    : item[`${name}En`] || ''
}

export function mergeIndustries(remote = null) {
  const edits = changes()
  const byId = new Map(industrySeed.map((item) => [item.id, { ...item }]))
  if (Array.isArray(remote)) {
    for (const item of remote) {
      if (item.status === 'deleted') byId.delete(item.id)
      else byId.set(item.id, item)
    }
  }
  for (const item of readJson(listKey, [])) {
    if (edits[item.id] === 'save' || (remote === null && edits[item.id] === 'synced')) byId.set(item.id, item)
  }
  for (const [id, action] of Object.entries(edits)) if (action === 'delete') byId.delete(id)
  return sortIndustries([...byId.values()])
}

const records = ref(mergeIndustries())

export async function loadIndustries() {
  let remote = null
  try {
    const response = await fetch('/api/industries')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    remote = await response.json()
    if (!Array.isArray(remote)) throw new Error('Invalid industry response')
    for (const item of remote) if (item.status === 'deleted') remember(item.id, 'delete')
  } catch { /* Seed and local edits remain available. */ }
  records.value = mergeIndustries(remote)
  return records.value
}

export function saveIndustryLocally(record) {
  const local = readJson(listKey, [])
  const index = local.findIndex((item) => item.id === record.id)
  if (index < 0) local.unshift(record)
  else local[index] = record
  localStorage.setItem(listKey, JSON.stringify(local))
  remember(record.id, 'save')
  records.value = mergeIndustries()
}

export function markIndustrySynced(id) {
  remember(id, 'synced')
}

export function deleteIndustryLocally(id) {
  localStorage.setItem(listKey, JSON.stringify(readJson(listKey, []).filter((item) => item.id !== id)))
  remember(id, 'delete')
  records.value = mergeIndustries()
}

export function useIndustryCatalog() {
  return { industries: records, loadIndustries }
}
