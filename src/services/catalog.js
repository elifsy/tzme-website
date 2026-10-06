import { createCollection } from './api.js'

export const MAX_HOME_PRODUCTS = 5

export function localizedField(item, name, locale) {
  if (!item) return ''
  return locale === 'zh'
    ? item[`${name}Zh`] || item[`${name}En`] || item[name] || ''
    : item[`${name}En`] || item[name] || ''
}
export function normalizeContent(item) {
  const record = { ...item }
  for (const name of ['title', 'category', 'summary', 'content', 'features', 'specifications']) {
    record[`${name}En`] = item[`${name}En`] ?? item[name] ?? ''
    record[`${name}Zh`] = item[`${name}Zh`] ?? ''
  }
  record.industries = Array.isArray(item.industries) ? [...item.industries] : item.industry ? [item.industry] : []
  record.showOnHome = item.showOnHome === true
  return record
}
const catalog = createCollection('/api/products', normalizeContent)
export function useProductCatalog() {
  return { products: catalog.records, loading: catalog.loading, loadProducts: catalog.load }
}
