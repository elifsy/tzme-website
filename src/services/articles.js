import { computed, ref } from 'vue'
import { articles as articleSeed } from '../data/content.js'
import { mergeManagedContent } from './catalog.js'

const articles = ref(mergeManagedContent('articles', articleSeed))
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
  async function loadArticles() {
    let remote = []
    try {
      const response = await fetch('/api/articles')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const records = await response.json()
      if (Array.isArray(records)) remote = records
    } catch { /* Keep local edits and sample articles when the backend is unavailable. */ }
    articles.value = mergeManagedContent('articles', articleSeed, remote)
    return articles.value
  }
  return { articles, publishedArticles, newsCategories, loadArticles }
}
