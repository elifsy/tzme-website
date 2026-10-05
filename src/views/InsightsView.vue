<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDesignPage } from '../composables/useDesignPage.js'
import { localizedField } from '../services/catalog.js'
import { articleCategoryKey, articleDate, articlePath, useArticleCatalog } from '../services/articles.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const page = ref(null)
const route = useRoute()
const router = useRouter()
const { locale } = useI18n({ useScope: 'global' })
const { drawerOpen, goTo, menuItems, isMenuActive, navigateLink } = useDesignPage('hc-news', page)
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
const featured = computed(() => visibleArticles.value[0])
const pageArticles = computed(() => visibleArticles.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
const rangeStart = computed(() => visibleArticles.value.length ? (currentPage.value - 1) * pageSize + 1 : 0)
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize, visibleArticles.value.length))
const field = (item, name) => localizedField(item, name, locale.value)
const selectedCategoryLabel = computed(() => field(newsCategories.value.find((item) => item.id === selectedCategory.value), 'title') || selectedCategory.value)
const detailLink = (id) => ({ path: articlePath(id), query: {
  page: currentPage.value,
  ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
} })
function setCategory(id) {
  if (id === selectedCategory.value) return
  const query = { ...route.query, page: 1 }
  if (id) query.category = id
  else delete query.category
  router.push({ path: '/insights', query })
}
async function changePage(value) {
  await router.replace({ path: '/insights', query: { ...route.query, page: Math.min(pageCount.value, value) } })
  await nextTick()
  document.getElementById('news-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
onMounted(async () => { await loadArticles(); loading.value = false })
</script>

<template>
  <main ref="page" class="design-site news-page">
    <div class="hc-page">
      <header class="hc-nav"><div class="hc-nav-in">
        <span class="hc-logo"><i></i>TZME</span>
        <nav class="hc-menu"><a v-for="item in menuItems" :key="item.key" :href="item.path" :class="{ on: isMenuActive(item) }"
          :aria-current="isMenuActive(item) ? 'page' : undefined" @click="navigateLink($event, item.path)">{{ item.label }}</a></nav>
        <div class="hc-nav-r">
          <el-button class="hc-mobile-menu" text :aria-label="$t('site.openNavigation')" @click="drawerOpen = true">☰</el-button>
          <LanguageSwitcher />
          <span class="hc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg></span>
          <el-button class="hc-btn solid sm">{{ $t('site.contactUs') }}<i>→</i></el-button>
        </div>
      </div></header>
      <section class="hc-sec news-intro"><div class="hc-w news-section-heading">
        <div><span class="hc-kick">{{ $t('site.newsCount', { count: publishedArticles.length }) }}</span><h1 class="hc-h2">{{ $t('site.newsAndInsights') }}</h1></div>
        <router-link class="news-text-link" to="/contact">{{ $t('site.subscribeToUpdates') }} →</router-link>
      </div></section>
      <section class="news-filter-section"><div class="hc-w news-category-filter">
        <span class="hc-kick">{{ $t('site.filterNewsByCategory') }}</span>
        <div class="news-category-options" role="group" :aria-label="$t('site.filterNewsByCategory')">
          <el-button class="site-filter-button" :type="!selectedCategory ? 'primary' : 'default'" :aria-pressed="!selectedCategory"
            @click="setCategory('')">{{ $t('site.allNewsCategories') }}</el-button>
          <el-button v-for="category in newsCategories" :key="category.id" class="site-filter-button"
            :type="selectedCategory === category.id ? 'primary' : 'default'"
            :aria-pressed="selectedCategory === category.id" @click="setCategory(category.id)">{{ field(category, 'title') }}</el-button>
        </div>
        <span class="news-result-count">{{ $t('site.filteredNewsCount', { count: visibleArticles.length }) }}</span>
      </div></section>
      <section v-if="featured" class="news-featured-section"><div class="hc-w">
        <router-link :to="detailLink(featured.id)" class="news-featured">
          <div class="news-featured-image"><img :src="featured.image || '/assets/rnd-1.jpg'" :alt="field(featured, 'title')" /></div>
          <div class="news-featured-content">
            <div class="news-meta"><el-tag effect="plain">{{ field(featured, 'category') }}</el-tag><time :datetime="featured.date">{{ articleDate(featured.date) }}</time></div>
            <h2>{{ field(featured, 'title') }}</h2><p class="hc-p">{{ field(featured, 'summary') }}</p><span class="news-text-link">{{ $t('site.readNotice') }} →</span>
          </div>
        </router-link>
      </div></section>
      <section id="news-list" class="hc-sec news-list-section"><div class="hc-w">
        <div class="news-section-heading news-list-heading"><span class="hc-kick">{{ selectedCategory ? selectedCategoryLabel : $t('site.allNotices') }}</span>
          <span class="news-count">{{ $t('site.newsPageRange', { start: rangeStart, end: rangeEnd, total: visibleArticles.length }) }}</span></div>
        <el-skeleton v-if="loading && !pageArticles.length" :rows="5" animated />
        <div v-else-if="pageArticles.length" class="news-rows">
          <router-link v-for="article in pageArticles" :key="article.id" :to="detailLink(article.id)" class="news-row">
            <time :datetime="article.date">{{ articleDate(article.date) }}</time>
            <div class="news-row-copy"><h2>{{ field(article, 'title') }}</h2><p>{{ field(article, 'summary') }}</p></div>
            <span class="news-row-category">{{ field(article, 'category') }}</span><span class="news-row-arrow" aria-hidden="true">↗</span>
          </router-link>
        </div>
        <el-empty v-else :description="$t(selectedCategory ? 'site.noNewsForCategory' : 'site.newsEmpty')">
          <el-button v-if="selectedCategory" type="primary" class="site-filter-button" @click="setCategory('')">{{ $t('site.allNewsCategories') }}</el-button>
        </el-empty>
        <el-pagination v-if="!loading && visibleArticles.length" class="news-pagination" background :current-page="currentPage"
          :page-size="pageSize" :total="visibleArticles.length" :pager-count="5" layout="prev, pager, next" @current-change="changePage" />
      </div></section>
      <footer class="hc-foot"><div class="hc-foot-in">
        <span class="hc-logo" style="font-size:19px"><i></i>TZME</span><span class="tag">{{ $t('site.newsroom') }}</span>
        <LanguageSwitcher style="margin-left:auto;color:var(--txt-2)" /><span class="hc-soc"><span>in</span><span>▶</span><span>✕</span></span>
      </div></footer>
    </div>
    <el-drawer v-model="drawerOpen" title="TZME" direction="rtl" size="min(320px, 85vw)" class="hc-mobile-drawer">
      <nav class="hc-mobile-links"><el-button v-for="item in menuItems" :key="item.key" text :type="isMenuActive(item) ? 'primary' : 'default'" @click="goTo(item.path)">{{ item.label }}</el-button></nav>
      <LanguageSwitcher mobile />
    </el-drawer>
  </main>
</template>
