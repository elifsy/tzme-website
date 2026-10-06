import { computed } from 'vue'
import { createCollection } from './api.js'

export const MAX_HOME_PROJECTS = 3
export const projectTextFields = [
  'title', 'industry', 'location', 'imageAlt', 'summary', 'content',
  'capacityLabel', 'capacity', 'technologyLabel', 'technology', 'scopeLabel', 'scope',
]
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
const catalog = createCollection('/api/projects', normalizeProject)
const projects = catalog.records
const publishedProjects = computed(() => projects.value.filter((item) => item.status === 'published'))
const homeProjects = computed(() => publishedProjects.value.filter((item) => item.showOnHome)
  .sort((a, b) => a.homeOrder - b.homeOrder || a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
  .slice(0, MAX_HOME_PROJECTS))
export const projectPath = (id) => `/projects/${encodeURIComponent(id)}`
export const loadProjects = catalog.load
export function useProjectCatalog() { return { projects, publishedProjects, homeProjects, loadProjects, loading: catalog.loading } }
