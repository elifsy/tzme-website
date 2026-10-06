import { createCollection } from './api.js'

const catalog = createCollection('/api/certifications')
export const loadCertifications = catalog.load
export function useCertificationCatalog() {
  return { certifications: catalog.records, loadCertifications, loading: catalog.loading }
}
