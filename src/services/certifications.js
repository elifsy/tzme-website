import { certificationSeed } from '../data/certifications.js'

const listKey = 'tzme-certifications'
const editsKey = 'tzme-content-edits'

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function sortRecords(records) {
  return records.sort((a, b) =>
    (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)
    || (a.titleEn || '').localeCompare(b.titleEn || ''),
  )
}

function edits() {
  return readJson(editsKey, {}).certifications || {}
}

function remember(id, action) {
  const all = readJson(editsKey, {})
  all.certifications ||= {}
  all.certifications[id] = action
  localStorage.setItem(editsKey, JSON.stringify(all))
}

export function mergeCertifications(remote = null) {
  const changes = edits()
  const byId = new Map(certificationSeed.map((item) => [item.id, { ...item }]))
  if (Array.isArray(remote)) {
    for (const item of remote) {
      if (item.status === 'deleted') byId.delete(item.id)
      else byId.set(item.id, item)
    }
  }
  for (const item of readJson(listKey, [])) {
    if (changes[item.id] === 'save' || (remote === null && changes[item.id] === 'synced')) {
      byId.set(item.id, item)
    }
  }
  for (const [id, action] of Object.entries(changes)) {
    if (action === 'delete') byId.delete(id)
  }
  return sortRecords([...byId.values()])
}

export async function loadCertifications() {
  try {
    const response = await fetch('/api/certifications')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const remote = await response.json()
    if (!Array.isArray(remote)) throw new Error('Invalid certifications response')
    for (const item of remote) {
      if (item.status === 'deleted') remember(item.id, 'delete')
    }
    return mergeCertifications(remote)
  } catch {
    return mergeCertifications()
  }
}

export function saveCertificationLocally(record) {
  const local = readJson(listKey, [])
  const index = local.findIndex((item) => item.id === record.id)
  if (index < 0) local.unshift(record)
  else local[index] = record
  localStorage.setItem(listKey, JSON.stringify(local))
  remember(record.id, 'save')
}

export function markCertificationSynced(id) {
  remember(id, 'synced')
}

export function deleteCertificationLocally(id) {
  const local = readJson(listKey, []).filter((item) => item.id !== id)
  localStorage.setItem(listKey, JSON.stringify(local))
  remember(id, 'delete')
}
