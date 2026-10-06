import { computed } from 'vue'
import { createCollection } from './api.js'
import { normalizeContent } from './catalog.js'

const catalog = createCollection('/api/articles', normalizeContent)
const articles = catalog.records
const publishedArticles = computed(() => articles.value
  .filter((item) => item.status === 'published')
  .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || a.id.localeCompare(b.id)))

// Use the same category key in both languages, so changing language keeps the filter.
export const articleCategoryKey = (item) => [item.categoryEn, item.category, item.categoryZh]
  .map((value) => String(value || '').trim()).find(Boolean) || ''

const newsCategories = computed(() => {
  const categories = new Map()
  for (const item of publishedArticles.value) {
    const id = articleCategoryKey(item)
    if (!id) continue
    const category = categories.get(id) || { id, titleEn: id, titleZh: '' }
    if (!category.titleZh) category.titleZh = String(item.categoryZh || '').trim()
    categories.set(id, category)
  }
  return [...categories.values()]
})

export const articlePath = (id) => `/insights/${encodeURIComponent(id)}`
export const articleDate = (date) => String(date || '').replaceAll('-', '.')

export function useArticleCatalog() {
  return { articles, publishedArticles, newsCategories, loadArticles: catalog.load, loading: catalog.loading }
}
