<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDesignPage } from '../composables/useDesignPage.js'
import { focusProjectContent } from '../utils/projectNavigation.js'
import { localizedField } from '../services/catalog.js'
import { useProjectCatalog } from '../services/projects.js'
import { sanitizeRichText } from '../utils/richText.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import ProjectCard from '../components/ProjectCard.vue'

const page = ref(null)
const route = useRoute()
const { t, locale } = useI18n({ useScope: 'global' })
const { drawerOpen, goTo, menuItems, isMenuActive, navigateLink } = useDesignPage('hc-project-detail', page)
const { publishedProjects, loadProjects } = useProjectCatalog()
const loading = ref(true)
const project = computed(() => publishedProjects.value.find((item) => item.id === route.params.id))
const field = (name) => localizedField(project.value, name, locale.value)
const metrics = computed(() => ['capacity', 'technology', 'scope'].map((name) => ({ name, label: field(`${name}Label`), value: field(name) })))
const body = computed(() => {
  const template = document.createElement('template')
  template.innerHTML = sanitizeRichText(field('content') || field('summary'))
  // Apply the readable page typography to CMS text while keeping its structure and emphasis.
  template.content.querySelectorAll('[style]').forEach((element) => {
    for (const property of ['color', 'background-color', 'font-size', 'font-family', 'line-height', 'text-indent']) element.style.removeProperty(property)
    if (Number(element.style.fontWeight) > 0 && Number(element.style.fontWeight) < 400) element.style.fontWeight = '400'
    if (!element.style.length) element.removeAttribute('style')
  })
  template.content.querySelectorAll('[color], [bgcolor], [size], [face]').forEach((element) => {
    for (const attribute of ['color', 'bgcolor', 'size', 'face']) element.removeAttribute(attribute)
  })
  const headings = [...template.content.querySelectorAll('h1, h2, h3, h4, h5, h6')]
  const firstLevel = Math.min(...headings.map((heading) => Number(heading.tagName.slice(1))))
  for (const heading of headings) {
    const level = Math.min(6, Number(heading.tagName.slice(1)) + 3 - firstLevel)
    const normalized = document.createElement(`h${level}`)
    for (const attribute of [...heading.attributes]) normalized.setAttribute(attribute.name, attribute.value)
    normalized.append(...heading.childNodes)
    heading.replaceWith(normalized)
  }
  template.content.querySelectorAll('table').forEach((table) => {
    const region = document.createElement('div')
    region.className = 'project-rich-table'
    region.tabIndex = 0
    region.setAttribute('role', 'region')
    region.setAttribute('aria-label', table.querySelector('caption')?.textContent || t('site.projectDataTable'))
    table.replaceWith(region)
    region.append(table)
  })
  return template.innerHTML
})
const related = computed(() => {
  const others = publishedProjects.value.filter((item) => item.id !== project.value?.id)
  const industry = project.value?.industryEn || project.value?.industryZh
  return others.sort((a, b) => Number((b.industryEn || b.industryZh) === industry)
    - Number((a.industryEn || a.industryZh) === industry)).slice(0, 3)
})
const listLink = computed(() => ({ path: '/projects', query: {
  ...(typeof route.query.page === 'string' ? { page: route.query.page } : {}),
  ...(typeof route.query.q === 'string' ? { q: route.query.q } : {}),
} }))
onMounted(async () => { await loadProjects(); loading.value = false })
watch(() => route.params.id, async () => { await nextTick(); focusProjectContent('project-main') })
</script>

<template>
  <div ref="page" class="design-site project-detail project-site">
    <a class="project-skip-link" href="#project-main" @click.prevent="focusProjectContent('project-main')">{{ $t('site.skipToProjectContent') }}</a>
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

      <main id="project-main" tabindex="-1" :aria-label="$t('site.navProjects')">
        <template v-if="project">
          <section class="project-detail-intro" aria-labelledby="project-title"><div class="hc-w">
            <div class="project-detail-topbar">
              <router-link class="project-back" :to="listLink"><span aria-hidden="true">←</span>{{ $t('site.backToProjects') }}</router-link>
            </div>
            <div class="project-detail-hero-grid" :class="{ 'project-detail-hero-no-image': !project.image }">
              <div class="project-detail-hero-copy">
                <span class="hc-kick">{{ $t('site.navProjects') }}</span>
                <h1 id="project-title">{{ field('title') }}</h1>
                <div class="project-detail-tags">
                  <el-tag v-if="field('industry')" effect="plain" round>{{ field('industry') }}</el-tag>
                  <el-tag v-if="field('location')" effect="plain" round>{{ field('location') }}</el-tag>
                </div>
                <p v-if="field('summary')" class="project-detail-lead">{{ field('summary') }}</p>
              </div>
              <div v-if="project.image" class="project-detail-cover">
                <el-image :src="project.image" :alt="field('imageAlt') || field('title')" fit="cover">
                  <template #error><div class="project-image-fallback"><el-icon><Picture /></el-icon></div></template>
                </el-image>
              </div>
            </div>
            <dl class="project-detail-metrics" :aria-label="$t('site.projectKeyFacts')">
              <div v-for="metric in metrics" :key="metric.name"><dt>{{ metric.label }}</dt><dd>{{ metric.value }}</dd></div>
            </dl>
          </div></section>

          <section class="hc-sec project-detail-content" aria-labelledby="project-overview-title"><div class="hc-w project-detail-layout">
            <article>
              <div class="project-article-heading"><span class="hc-kick">{{ $t('site.navProjects') }}</span><h2 id="project-overview-title">{{ $t('site.projectOverview') }}</h2></div>
              <div class="article-body" v-html="body"></div>
              <router-link class="project-back project-article-back" :to="listLink"><span aria-hidden="true">←</span>{{ $t('site.backToProjects') }}</router-link>
            </article>
            <aside class="project-contact-panel" aria-labelledby="project-contact-title">
              <span class="project-contact-marker" aria-hidden="true"></span>
              <h2 id="project-contact-title">{{ $t('site.projectContactTitle') }}</h2><p>{{ $t('site.projectContactText') }}</p>
              <el-button type="primary" class="site-filter-button" @click="goTo('/contact')">{{ $t('site.contactUs') }}<el-icon aria-hidden="true"><ArrowRight /></el-icon></el-button>
            </aside>
          </div></section>

          <section v-if="related.length" class="hc-sec projects-related" aria-labelledby="related-projects-title"><div class="hc-w">
            <div class="projects-section-heading"><div><span class="hc-kick">{{ $t('site.selectedProjects') }}</span><h2 id="related-projects-title">{{ $t('site.moreProjects') }}</h2></div>
              <router-link class="project-back" to="/projects">{{ $t('site.viewAllProjects') }}<span aria-hidden="true">→</span></router-link>
            </div>
            <div class="hc-proj projects-catalog-grid"><ProjectCard v-for="item in related" :key="item.id" :project="item" /></div>
          </div></section>
        </template>
        <section v-else class="hc-sec project-unavailable hc-w" :aria-busy="loading">
          <el-skeleton v-if="loading" :rows="8" animated />
          <el-empty v-else :description="$t('site.projectNotFound')"><el-button type="primary" class="site-filter-button" @click="goTo('/projects')">{{ $t('site.backToProjects') }}</el-button></el-empty>
        </section>
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
