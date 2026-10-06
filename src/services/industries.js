import { createCollection } from './api.js'
import { localizedField } from './catalog.js'

export const industryField = localizedField
const catalog = createCollection('/api/industries')
export function useIndustryCatalog() {
  return { industries: catalog.records, loadIndustries: catalog.load, loading: catalog.loading }
}
