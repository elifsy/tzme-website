import { ref } from 'vue'
import { products as productSeed } from '../data/content.js'

export const MAX_HOME_PRODUCTS = 5

export function localizedField(item, name, locale) {
  if (!item) return ''
  return locale === 'zh'
    ? item[`${name}Zh`] || item[`${name}En`] || item[name] || ''
    : item[`${name}En`] || item[name] || ''
}

function normalize(item, base = {}) {
  const merged = { ...base, ...item }
  for (const name of ['title', 'category', 'summary', 'content', 'features', 'specifications']) {
    merged[`${name}En`] = item[`${name}En`] ?? item[name] ?? base[`${name}En`] ?? base[name] ?? ''
    merged[`${name}Zh`] = item[`${name}Zh`] ?? base[`${name}Zh`] ?? ''
  }
  merged.showOnHome = item.showOnHome ?? base.showOnHome ?? false
  merged.homeOrder = item.homeOrder ?? base.homeOrder ?? null
  const selectedIndustries = Array.isArray(item.industries) && item.industries.length
    ? item.industries
    : item.industry ? [item.industry] : base.industries ?? (base.industry ? [base.industry] : [])
  merged.industries = [...new Set(Array.isArray(selectedIndustries) ? selectedIndustries : [])]
  merged.industry = merged.industries[0] || ''
  return merged
}

export function mergeManagedContent(type, seed, remote = []) {
  let edits = {}
  let local = []
  try { edits = JSON.parse(localStorage.getItem('tzme-content-edits'))?.[type] || {} } catch { /* Use the seed. */ }
  try { local = JSON.parse(localStorage.getItem(`tzme-${type}`)) || [] } catch { /* Use the seed. */ }
  const seedById = new Map(seed.map((item) => [item.id, item]))
  const byId = new Map()
  for (const item of seed) if (edits[item.id] !== 'delete') byId.set(item.id, normalize(item))
  for (const item of local) {
    if (edits[item.id] === 'save' || edits[item.id] === 'synced')
      byId.set(item.id, normalize(item, seedById.get(item.id)))
  }
  for (const item of remote) {
    if (edits[item.id] !== 'delete' && edits[item.id] !== 'save')
      byId.set(item.id, normalize(item, seedById.get(item.id)))
  }
  return [...byId.values()]
}

const catalog = ref(mergeManagedContent('products', productSeed))

export function useProductCatalog() {
  async function loadProducts() {
    let remote = []
    try {
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      remote = await response.json()
    } catch { /* Local edits and seed remain available. */ }
    catalog.value = mergeManagedContent('products', productSeed, remote)
    return catalog.value
  }
  return { products: catalog, loadProducts }
}
