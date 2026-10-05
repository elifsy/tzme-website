import { computed, ref } from 'vue'
import { projectSeed } from '../data/projects.js'

export const MAX_HOME_PROJECTS = 3
export const projectTextFields = [
  'title', 'industry', 'location', 'imageAlt', 'summary', 'content',
  'capacityLabel', 'capacity', 'technologyLabel', 'technology', 'scopeLabel', 'scope',
]
const listKey = 'tzme-projects'
const editsKey = 'tzme-project-edits'
let lastRemote = null

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function remember(id, action) {
  localStorage.setItem(editsKey, JSON.stringify({ ...read(editsKey, {}), [id]: action }))
}
export function normalizeProject(item) {
  const result = { ...item }
  for (const name of projectTextFields) {
    result[`${name}En`] = item[`${name}En`] ?? ''
    result[`${name}Zh`] = item[`${name}Zh`] ?? ''
  }
  result.image = item.image ?? ''
  result.status = item.status ?? 'draft'
  result.showOnHome = item.showOnHome === true
  result.sortOrder = Number(item.sortOrder) || 0
  result.homeOrder = Number(item.homeOrder) || 0
  return result
}
function merge(remote = lastRemote) {
  const changes = read(editsKey, {})
  const byId = new Map((remote ?? projectSeed).map((item) => [item.id, normalizeProject(item)]))
  for (const item of read(listKey, [])) {
    if (changes[item.id] === 'save' || (remote === null && changes[item.id] === 'synced')) {
      byId.set(item.id, normalizeProject(item))
    }
  }
  for (const [id, action] of Object.entries(changes)) {
    if (action === 'delete') byId.delete(id)
  }
  return [...byId.values()].filter((item) => item.status !== 'deleted')
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
}
const projects = ref(merge())
const publishedProjects = computed(() => projects.value.filter((item) => item.status === 'published'))
const homeProjects = computed(() => publishedProjects.value.filter((item) => item.showOnHome)
  .sort((a, b) => a.homeOrder - b.homeOrder || a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
  .slice(0, MAX_HOME_PROJECTS))

export const projectPath = (id) => `/projects/${encodeURIComponent(id)}`
export async function loadProjects() {
  try {
    const response = await fetch('/api/projects')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const remote = await response.json()
    if (!Array.isArray(remote)) throw new Error('Invalid project response')
    lastRemote = remote
  } catch { /* Keep the last known data and pending local changes. */ }
  projects.value = merge()
  return projects.value
}
export function saveProjectLocally(record, synced = false) {
  const local = read(listKey, []).filter((item) => item.id !== record.id)
  local.push(normalizeProject(record))
  localStorage.setItem(listKey, JSON.stringify(local))
  remember(record.id, synced ? 'synced' : 'save')
  if (synced && lastRemote !== null) {
    lastRemote = [...lastRemote.filter((item) => item.id !== record.id), record]
  }
  projects.value = merge()
}
export function deleteProjectLocally(id) {
  localStorage.setItem(listKey, JSON.stringify(read(listKey, []).filter((item) => item.id !== id)))
  remember(id, 'delete')
  projects.value = merge()
}
export function useProjectCatalog() {
  return { projects, publishedProjects, homeProjects, loadProjects }
}
