<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDesignPage } from '../composables/useDesignPage.js'
import { localizedField } from '../services/catalog.js'
import { articleCategoryKey, articleDate, articlePath, useArticleCatalog } from '../services/articles.js'
import { sanitizeRichText } from '../utils/richText.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const page = ref(null)
const route = useRoute()
const { locale } = useI18n({ useScope: 'global' })
const { drawerOpen, goTo, menuItems, isMenuActive, navigateLink } = useDesignPage('hc-news-detail', page)
const { publishedArticles, loadArticles } = useArticleCatalog()
const loading = ref(true)
const field = (item, name) => localizedField(item, name, locale.value)
const articleIndex = computed(() => publishedArticles.value.findIndex((item) => item.id === route.params.id))
const article = computed(() => publishedArticles.value[articleIndex.value])
const selectedCategory = computed(() => typeof route.query.category === 'string' ? route.query.category : '')
const navigationArticles = computed(() => selectedCategory.value
  ? publishedArticles.value.filter((item) => articleCategoryKey(item) === selectedCategory.value)
  : publishedArticles.value)
const navigationIndex = computed(() => navigationArticles.value.findIndex((item) => item.id === route.params.id))
const previous = computed(() => navigationIndex.value > 0 ? navigationArticles.value[navigationIndex.value - 1] : null)
const next = computed(() => navigationIndex.value >= 0 ? navigationArticles.value[navigationIndex.value + 1] : null)
const listQuery = computed(() => ({
  ...(route.query.page ? { page: route.query.page } : {}),
  ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
}))
const listLink = computed(() => ({ path: '/insights', query: listQuery.value }))
const detailLink = (id) => ({ path: articlePath(id), query: listQuery.value })
const body = computed(() => {
  const template = document.createElement('template')
  template.innerHTML = sanitizeRichText(field(article.value, 'content') || field(article.value, 'summary'))
  const headings = [...template.content.querySelectorAll('h1, h2, h3')].map((heading, index) => {
    heading.id = `article-heading-${index}`
    return { id: heading.id, text: heading.textContent }
  })
  return { html: template.innerHTML, headings }
})
function scrollToHeading(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
onMounted(async () => { await loadArticles(); loading.value = false })
watch(() => route.params.id, () => window.scrollTo({ top: 0, behavior: 'instant' }))
</script>

<template>
  <main ref="page" class="design-site news-detail">
    <div class="hc-page">
      <header class="hc-nav"><div class="hc-nav-in">
        <span class="hc-logo"><i></i>TZME</span>
        <nav class="hc-menu"><a v-for="item in menuItems" :key="item.key" :href="item.path" :class="{ on: isMenuActive(item) }"
          :aria-current="isMenuActive(item) ? 'page' : undefined" @click="navigateLink($event, item.path)">{{ item.label }}</a></nav>
        <div class="hc-nav-r">
          <el-button class="hc-mobile-menu" text :aria-label="$t('site.openNavigation')" @click="drawerOpen = true">☰</el-button>
          <LanguageSwitcher /><el-button class="hc-btn solid sm">{{ $t('site.contactUs') }}<i>→</i></el-button>
        </div>
      </div></header>
      <template v-if="article">
        <section id="article-overview" class="hc-sec article-intro"><div class="hc-w">
          <router-link class="news-text-link article-back" :to="listLink">← {{ $t('site.backToNews') }}</router-link>
          <div class="news-meta"><el-tag effect="plain">{{ field(article, 'category') }}</el-tag><time :datetime="article.date">{{ articleDate(article.date) }}</time></div>
          <h1>{{ field(article, 'title') }}</h1><p v-if="field(article, 'summary')" class="article-lead">{{ field(article, 'summary') }}</p>
        </div></section>
        <div v-if="article.image" class="hc-w article-cover"><img :src="article.image" :alt="field(article, 'title')" /></div>
        <section class="hc-sec article-content-section"><div class="hc-w article-layout">
          <article>
            <div class="article-body" v-html="body.html"></div>
            <nav class="article-pagination" :aria-label="$t('site.newsroom')">
              <router-link v-if="previous" :to="detailLink(previous.id)"><span>← {{ $t('site.previousArticle') }}</span><strong>{{ field(previous, 'title') }}</strong></router-link>
              <div v-else></div>
              <router-link v-if="next" :to="detailLink(next.id)"><span>{{ $t('site.nextArticle') }} →</span><strong>{{ field(next, 'title') }}</strong></router-link>
            </nav>
            <router-link class="news-text-link" :to="listLink">← {{ $t('site.backToNews') }}</router-link>
          </article>
          <aside class="article-sidebar">
            <div class="article-toc"><span class="hc-kick">{{ $t('site.articleContents') }}</span>
              <a href="#article-overview" @click.prevent="scrollToHeading('article-overview')">{{ $t('site.articleOverview') }}</a>
              <a v-for="heading in body.headings" :key="heading.id" :href="`#${heading.id}`" @click.prevent="scrollToHeading(heading.id)">{{ heading.text }}</a>
            </div>
            <div class="article-contact"><h2>{{ $t('site.newsContactTitle') }}</h2><p>{{ $t('site.newsContactText') }}</p>
              <el-button type="primary" @click="goTo('/contact')">{{ $t('site.contactUs') }} →</el-button></div>
          </aside>
        </div></section>
      </template>
      <section v-else class="hc-sec article-unavailable hc-w">
        <el-skeleton v-if="loading" :rows="8" animated />
        <el-empty v-else :description="$t('site.newsNotFound')"><el-button type="primary" @click="goTo('/insights')">{{ $t('site.backToNews') }}</el-button></el-empty>
      </section>
      <footer class="hc-foot"><div class="hc-foot-in">
        <span class="hc-logo" style="font-size:19px"><i></i>TZME</span><span class="tag">{{ $t('site.newsroom') }}</span>
        <LanguageSwitcher style="margin-left:auto;color:var(--txt-2)" />
      </div></footer>
    </div>
    <el-drawer v-model="drawerOpen" title="TZME" direction="rtl" size="min(320px, 85vw)" class="hc-mobile-drawer">
      <nav class="hc-mobile-links"><el-button v-for="item in menuItems" :key="item.key" text :type="isMenuActive(item) ? 'primary' : 'default'" @click="goTo(item.path)">{{ item.label }}</el-button></nav>
      <LanguageSwitcher mobile />
    </el-drawer>
  </main>
</template>
