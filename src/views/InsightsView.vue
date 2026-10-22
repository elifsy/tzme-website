<script setup>
import { useSiteContent } from '../services/website.js'
const { siteAsset, siteValue } = useSiteContent()
import { computed, nextTick, onMounted, ref } from 'vue'
import { trackEvent } from '../services/analytics.js'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDesignPage } from '../composables/useDesignPage.js'
import { localizedField } from '../services/catalog.js'
import { articleCategoryKey, articleDate, articlePath, useArticleCatalog } from '../services/articles.js'
import SiteFooter from '../components/SiteFooter.vue'
import SiteNav from '../components/SiteNav.vue'
import NewsIntro from '../components/NewsIntro.vue'
import '../style/news-list.css'

const page = ref(null)
const route = useRoute()
const router = useRouter()
const { locale } = useI18n({ useScope: 'global' })
useDesignPage('hc-news', page)
const { publishedArticles, newsCategories, loadArticles } = useArticleCatalog()
const loading = ref(true)
const pageSize = 6
const requestedPage = () => Math.max(1, Math.floor(Number(route.query.page) || 1))
const selectedCategory = computed(() => typeof route.query.category === 'string' ? route.query.category : '')
const visibleArticles = computed(() => selectedCategory.value
  ? publishedArticles.value.filter((item) => articleCategoryKey(item) === selectedCategory.value)
  : publishedArticles.value)
const pageCount = computed(() => Math.max(1, Math.ceil(visibleArticles.value.length / pageSize)))
const currentPage = computed(() => Math.min(pageCount.value, requestedPage()))
const featured = computed(() => currentPage.value === 1 ? visibleArticles.value[0] : null)
const pageArticles = computed(() => visibleArticles.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
const listArticles = computed(() => featured.value ? pageArticles.value.slice(1) : pageArticles.value)
const rangeStart = computed(() => visibleArticles.value.length ? (currentPage.value - 1) * pageSize + 1 : 0)
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize, visibleArticles.value.length))
const field = (item, name) => localizedField(item, name, locale.value)
const articleImage = (item) => item.image || siteAsset('/assets/rnd-1.jpg') || '/assets/rnd-1.jpg'
const selectedCategoryLabel = computed(() => field(newsCategories.value.find((item) => item.id === selectedCategory.value), 'title') || selectedCategory.value)
const detailLink = (id) => ({ path: articlePath(id), query: {
  page: currentPage.value,
  ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
} })
function setCategory(id) {
  if (id === selectedCategory.value) return
  trackEvent('news_filter', id || 'all')
  const query = { ...route.query, page: 1 }
  if (id) query.category = id
  else delete query.category
  router.push({ path: '/insights', query })
}
async function changePage(value) {
  trackEvent('pagination', `news:${value}`)
  await router.replace({ path: '/insights', query: { ...route.query, page: Math.min(pageCount.value, value) } })
  await nextTick()
  document.getElementById('news-list')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
}
onMounted(async () => { await loadArticles(); loading.value = false })
</script>

<template>
  <div ref="page" class="design-site news-page">
    <div class="hc-page">
      <SiteNav />
      <main id="main-content">
      <NewsIntro />
      <section class="news-filter-section"><div class="hc-w news-category-filter">
        <span class="news-filter-label">资讯分类</span>
        <div class="news-category-options" role="group" :aria-label="$t('site.filterNewsByCategory')">
          <button type="button" class="news-category-button" :aria-pressed="!selectedCategory" @click="setCategory('')">全部资讯</button>
          <button v-for="category in newsCategories" :key="category.id" type="button" class="news-category-button"
            :aria-pressed="selectedCategory === category.id" @click="setCategory(category.id)">{{ field(category, 'title') }}</button>
        </div>
        <span class="news-result-count">{{ $t('site.filteredNewsCount', { count: visibleArticles.length }) }}</span>
      </div></section>
      <section v-if="featured" class="news-featured-section"><div class="hc-w">
        <div class="news-section-heading"><h2>重点关注</h2><span>制造 · 质量 · 交付</span></div>
        <router-link :to="detailLink(featured.id)" class="news-featured">
          <div class="news-featured-image"><img :src="articleImage(featured)" :alt="field(featured, 'title')" decoding="async"/><span class="news-image-label">重钢动态</span></div>
          <div class="news-featured-content">
            <div class="news-featured-meta"><span>{{ field(featured, 'category') }}</span><time v-if="featured.date" :datetime="featured.date">{{ articleDate(featured.date) }}</time></div>
            <h3>{{ field(featured, 'title') }}</h3><p>{{ field(featured, 'summary') }}</p><span class="news-text-link">阅读全文<span aria-hidden="true">→</span></span>
          </div>
        </router-link>
      </div></section>
      <section v-if="loading || listArticles.length || !featured || pageCount > 1" id="news-list" class="news-list-section"><div class="hc-w">
        <div class="news-section-heading news-list-heading"><h2>{{ selectedCategory ? selectedCategoryLabel : '最新资讯' }}</h2>
          <span>持续记录每一步前行</span></div>
        <el-skeleton v-if="loading && !pageArticles.length" :rows="5" animated />
        <div v-else-if="listArticles.length" class="news-rows">
          <router-link v-for="article in listArticles" :key="article.id" :to="detailLink(article.id)" class="news-row">
            <time v-if="article.date" class="news-row-date" :datetime="article.date"><strong>{{ article.date.slice(-2) }}</strong><span>{{ article.date.slice(0, 7).replace('-', '.') }}</span></time>
            <span v-else class="news-row-date news-row-undated" aria-label="未注明日期">—</span>
            <div class="news-row-copy"><span class="news-row-category">{{ field(article, 'category') }}</span><h3>{{ field(article, 'title') }}</h3><p>{{ field(article, 'summary') }}</p></div>
            <img class="news-row-image" :src="articleImage(article)" :alt="field(article, 'title')" width="148" height="84" loading="lazy" decoding="async"/>
            <span class="news-row-arrow" aria-hidden="true">{{ siteValue('text_6564582d822d') || '↗' }}</span>
          </router-link>
        </div>
        <el-empty v-else-if="!visibleArticles.length" :description="$t(selectedCategory ? 'site.noNewsForCategory' : 'site.newsEmpty')">
          <el-button v-if="selectedCategory" type="primary" @click="setCategory('')">全部资讯</el-button>
        </el-empty>
        <div v-if="!loading && visibleArticles.length" class="news-pagination-summary">{{ $t('site.newsPageRange', { start: rangeStart, end: rangeEnd, total: visibleArticles.length }) }}</div>
        <el-pagination v-if="!loading && visibleArticles.length" class="news-pagination" :current-page="currentPage"
          :page-size="pageSize" :total="visibleArticles.length" :pager-count="5" layout="prev, pager, next" @current-change="changePage" />
      </div></section>
      </main>
      <SiteFooter />
    </div>

  </div>
</template>
