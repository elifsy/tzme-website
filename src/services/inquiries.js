import { createCollection } from './api.js'

const catalog = createCollection('/api/inquiries')
export function useInquiryCatalog() { return { inquiries: catalog.records, loadInquiries: catalog.load } }
