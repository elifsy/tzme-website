<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search } from '@element-plus/icons-vue'
import { useDesignPage } from '../composables/useDesignPage.js'
import { focusProjectContent } from '../utils/projectNavigation.js'
import { localizedField } from '../services/catalog.js'
import { projectPath, useProjectCatalog } from '../services/projects.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import ProjectCard from '../components/ProjectCard.vue'

const page = ref(null)
const route = useRoute()
const router = useRouter()
const { locale } = useI18n({ useScope: 'global' })
const { drawerOpen, goTo, menuItems, isMenuActive, navigateLink } = useDesignPage('hc-projects', page)
const { publishedProjects, loadProjects } = useProjectCatalog()
const loading = ref(true)
const pageSize = 6
const search = computed({
  get: () => typeof route.query.q === 'string' ? route.query.q : '',
  set: (q) => router.replace({ path: '/projects', query: q.trim() ? { q, page: 1 } : {} }),
})
const filtered = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return keyword ? publishedProjects.value.filter((item) => ['title', 'industry', 'location', 'capacity', 'technology', 'scope']
    .some((name) => localizedField(item, name, locale.value).toLocaleLowerCase().includes(keyword))) : publishedProjects.value
})
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const currentPage = computed(() => Math.min(pageCount.value, Math.max(1, Math.floor(Number(route.query.page) || 1))))
const pageProjects = computed(() => filtered.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
const detailLink = (id) => ({ path: projectPath(id), query: { page: currentPage.value, ...(search.value ? { q: search.value } : {}) } })
async function changePage(value) {
  await router.replace({ path: '/projects', query: { ...route.query, page: value } })
  await nextTick()
  focusProjectContent('project-list')
}
async function clearSearch() {
  await router.replace({ path: '/projects', query: {} })
  await nextTick()
  document.getElementById('project-search')?.focus({ preventScroll: true })
}
onMounted(async () => { await loadProjects(); loading.value = false })
</script>

<template>
  <div ref="page" class="design-site projects-page project-site">
    <a class="project-skip-link" href="#projects-main" @click.prevent="focusProjectContent('projects-main')">{{ $t('site.skipToProjectContent') }}</a>
    <div class="hc-page">
      <header class="hc-nav"><div class="hc-nav-in">
        <router-link class="hc-logo" to="/" :aria-label="$t('site.brandHome')"><i aria-hidden="true"></i>TZME</router-link>
        <nav class="hc-menu" :aria-label="$t('site.primaryNavigation')"><a v-for="item in menuItems" :key="item.key" :href="item.path" :class="{ on: isMenuActive(item) }"
          :aria-current="isMenuActive(item) ? 'page' : undefined" @click="navigateLink($event, item.path)">{{ item.label }}</a></nav>
        <div class="hc-nav-r">
          <el-button class="hc-mobile-menu" text :aria-label="$t('site.openNavigation')" :aria-expanded="drawerOpen" @click="drawerOpen = true">☰</el-button>
          <LanguageSwitcher />
          <span class="hc-ico" :aria-label="$t('site.productCenter')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg></span>
          <el-button class="hc-btn solid sm" style="height:34px" @click.stop="goTo('/contact')">{{ $t('site.contactUs') }}<i aria-hidden="true">→</i></el-button>
        </div>
      </div></header>

      <main id="projects-main" tabindex="-1" aria-labelledby="projects-page-title">
        <section class="hc-sec projects-intro" aria-labelledby="projects-page-title"><div class="hc-w projects-intro-heading">
          <div class="projects-intro-copy">
            <span class="hc-kick">{{ $t('site.projectCount', { count: publishedProjects.length }) }}</span>
            <h1 id="projects-page-title" class="hc-h2">{{ $t('site.realProjectsLastingValue') }}</h1>
          </div>
          <el-button type="primary" class="site-filter-button" @click="focusProjectContent('project-list')">{{ $t('site.browseProjects') }}<el-icon aria-hidden="true"><ArrowRight /></el-icon></el-button>
        </div></section>

        <section id="project-list" class="hc-sec project-list-section" tabindex="-1" aria-labelledby="projects-list-title" :aria-busy="loading"><div class="hc-w">
          <div class="projects-section-heading">
            <div><span class="hc-kick">{{ $t('site.allProjects') }}</span><h2 id="projects-list-title">{{ $t('site.projects') }}</h2></div>
            <p role="status" aria-live="polite" aria-atomic="true">{{ $t('site.projectCount', { count: filtered.length }) }}</p>
          </div>
          <div class="projects-list-toolbar">
            <div class="projects-search-field">
              <label for="project-search">{{ $t('site.searchProjectsLabel') }}</label>
              <div class="projects-search-row">
                <el-input id="project-search" v-model="search" class="projects-search" aria-describedby="project-search-hint" :placeholder="$t('site.searchProjects')">
                  <template #prefix><el-icon aria-hidden="true"><Search /></el-icon></template>
                </el-input>
                <el-button v-if="search" class="site-filter-button" @click="clearSearch">{{ $t('site.clearProjectSearch') }}</el-button>
              </div>
              <p id="project-search-hint">{{ $t('site.projectSearchHint') }}</p>
            </div>
          </div>
          <el-skeleton v-if="loading && !pageProjects.length" :rows="6" animated />
          <div v-else-if="pageProjects.length" class="hc-proj projects-catalog-grid">
            <ProjectCard v-for="project in pageProjects" :key="project.id" :project="project" :to="detailLink(project.id)" />
          </div>
          <el-empty v-else :description="$t(search ? 'site.projectSearchEmpty' : 'site.projectsEmpty')">
            <el-button v-if="search" type="primary" class="site-filter-button" @click="clearSearch">{{ $t('site.allProjects') }}</el-button>
          </el-empty>
          <el-pagination v-if="filtered.length > pageSize" class="projects-pagination" background :current-page="currentPage"
            :aria-label="$t('site.projects')" :page-size="pageSize" :total="filtered.length" :pager-count="5" layout="prev, pager, next" @current-change="changePage" />
        </div></section>
      </main>

      <footer class="hc-foot project-footer"><div class="hc-foot-in">
        <div class="project-footer-brand"><router-link class="hc-logo" to="/" :aria-label="$t('site.brandHome')"><i aria-hidden="true"></i>TZME</router-link>
          <p>{{ $t('site.engineeredInChina') }} {{ $t('site.builtForTheWorld') }}</p></div>
        <nav class="project-footer-links" :aria-label="$t('site.footerNavigation')"><router-link v-for="item in menuItems" :key="item.key" :to="item.path" :aria-current="isMenuActive(item) ? 'page' : undefined">{{ item.label }}</router-link></nav>
        <LanguageSwitcher />
      </div></footer>
    </div>
    <el-drawer v-model="drawerOpen" title="TZME" direction="rtl" size="min(320px, 85vw)" class="hc-mobile-drawer project-mobile-drawer">
      <nav class="hc-mobile-links" :aria-label="$t('site.primaryNavigation')"><el-button v-for="item in menuItems" :key="item.key" text :type="isMenuActive(item) ? 'primary' : 'default'" :aria-current="isMenuActive(item) ? 'page' : undefined" @click="goTo(item.path)">{{ item.label }}</el-button></nav>
      <LanguageSwitcher mobile />
    </el-drawer>
  </div>
</template>
