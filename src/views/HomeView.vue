<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import SiteNav from '../components/SiteNav.vue'
import SiteFooter from '../components/SiteFooter.vue'
import ProjectCard from '../components/ProjectCard.vue'
import IndustryIcon from '../components/IndustryIcon.vue'
import GlobalReachSection from '../components/GlobalReachSection.vue'
import InquiryForm from '../components/InquiryForm.vue'
import AboutTzmeContent from '../components/AboutTzmeContent.vue'
import HomeCapabilitiesSection from '../components/HomeCapabilitiesSection.vue'
import ManufacturingFilm from '../components/ManufacturingFilm.vue'
import HomeSolutionsSection from '../components/HomeSolutionsSection.vue'
import { useAboutTzme } from '../services/aboutTzme.js'
import { useCapabilities } from '../services/capabilities.js'
import { useHomeSolutions } from '../services/homeSolutions.js'
import { MAX_HOME_PRODUCTS, useProductCatalog } from '../services/catalog.js'
import { useProjectCatalog } from '../services/projects.js'
import { useIndustryCatalog, industryField } from '../services/industries.js'
import { useGlobalReach } from '../services/globalReach.js'
import { useContactSettings } from '../services/contactSettings.js'
import { jAssets, jBanner as banner } from '../data/jDesign.js'
const { locale } = useI18n({ useScope: 'global' })
const text = (zh, en) => locale.value === 'zh' ? zh : en
const { products, loadProducts } = useProductCatalog()
const { homeProjects, loadProjects } = useProjectCatalog()
const { industries, loadIndustries } = useIndustryCatalog()
const { capabilities, loadCapabilities } = useCapabilities()
const { homeSolutions, loadHomeSolutions } = useHomeSolutions()
const { aboutTzme, loadAboutTzme } = useAboutTzme()
const { globalReach, loadGlobalReach } = useGlobalReach()
const { contactSettings } = useContactSettings()
const activeIndustries = computed(() => industries.value.filter(item => item.status === 'published')
  .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)))
const featuredProducts = computed(() => products.value.filter(item => item.status === 'published' && item.showOnHome)
  .sort((a,b) => (Number(a.homeOrder) || 999) - (Number(b.homeOrder) || 999)).slice(0, MAX_HOME_PRODUCTS))
onMounted(() => { loadProducts(); loadIndustries(); loadProjects(); loadCapabilities(); loadHomeSolutions(); loadAboutTzme(); loadGlobalReach() })
</script>

<template>
  <div class="design-site j-home"><div class="hc-page">
    <SiteNav />
    <main id="main-content">
      <section class="j-hero" :aria-label="text('首页横幅','Homepage banner')">
        <img class="j-hero-photo" :src="banner.image" :alt="text('重钢机械港口、制造与装备现场','TZME port equipment and manufacturing')" fetchpriority="high" />
        <div class="j-hero-copy"><h1>{{ banner.title[locale] || banner.title.en }}</h1><span class="j-rule"></span><router-link :to="banner.to" class="j-button" data-analytics-event="cta_click" data-analytics-target="banner-1">{{ banner.button[locale] || banner.button.en }}<span aria-hidden="true">→</span></router-link></div>
      </section>
      <section v-if="activeIndustries.length" id="industries" class="j-industry-strip" :aria-label="text('服务行业','Industries we serve')"><div class="hc-w"><router-link v-for="industry in activeIndustries" :key="industry.id" :to="{ path:'/solutions',query:{industry:industry.id} }" data-analytics-event="industry_filter" :data-analytics-target="industry.id"><IndustryIcon :icon="industry.icon"/><div><strong>{{ industryField(industry,'title',locale) }}</strong><small>{{ industryField(industry,'subtitle',locale) }}</small></div><span aria-hidden="true">→</span></router-link></div></section>
      <section v-if="aboutTzme" class="hc-sec j-manufacturing"><div class="hc-w j-split"><div><AboutTzmeContent :configuration="aboutTzme.home" :locale-code="locale" /><router-link class="j-link" to="/about">{{ text('走进重钢机械','Discover TZME') }}<span>→</span></router-link></div><figure><div class="j-factory-photo"><img :src="aboutTzme.home.image || jAssets.factory" :alt="text('格林兰制造基地实景','Greenland manufacturing base')" loading="lazy"/><ManufacturingFilm /></div><figcaption>TIANJIN / FABRICATION · QUALITY · DELIVERY</figcaption></figure></div></section>
      <HomeSolutionsSection v-if="homeSolutions" :configuration="homeSolutions" :products="featuredProducts" :industries="activeIndustries" />
      <HomeCapabilitiesSection :configuration="capabilities" :locale-code="locale" />
      <section id="projects" class="hc-sec"><div class="hc-w"><div class="hc-shead"><div><span class="hc-kick">SELECTED PROJECTS</span><h2 class="hc-h2">{{ text('真实项目，持久价值。','Real projects. Lasting value.') }}</h2></div><router-link class="j-link" to="/projects">{{ $t('site.viewAllProjects') }}<span>→</span></router-link></div><div v-if="homeProjects.length" class="hc-proj"><ProjectCard v-for="project in homeProjects" :key="project.id" :project="project"/></div><el-empty v-else :description="$t('site.projectsEmpty')"/></div></section>
      <section class="j-quality-strip hc-w"><router-link v-for="title in ['ISO 9001','ISO 14001','ISO 45001','EN 1090','ISO 3834']" :key="title" to="/about#certificates-title">{{ title }}</router-link><router-link class="j-link" to="/about#certificates-title">{{ text('资质与质量体系','Quality & certifications') }} ↗</router-link></section>
      <GlobalReachSection :configuration="globalReach" />
      <section class="hc-sec j-home-contact"><div class="hc-w j-contact-layout" :class="{'j-contact-single':!contactSettings?.form.showOnHome}"><div><span class="hc-kick">LET’S BUILD TOGETHER</span><h2 class="hc-h2">{{ text('下一项制造需求，\n从交流开始。','Your next project\nstarts with a conversation.') }}</h2><span class="j-rule"></span><p class="hc-p">{{ text('告诉我们您的图纸、工况、质量要求和交付计划。我们将与您确认设备制造、检验与供货需求。','Tell us about your materials, operating conditions and delivery requirements. Explore an equipment solution with our engineering team.') }}</p><div class="j-direct-contact"><a v-for="email in contactSettings?.contact.emails" :key="email" :href="`mailto:${email}`">{{ email }}</a><p>{{ contactSettings?.contact.phone }}</p></div></div><InquiryForm placement="home"/></div></section>
    </main><SiteFooter :show-contact-cta="false" />
  </div></div>
</template>
