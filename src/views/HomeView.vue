<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import SiteNav from '../components/SiteNav.vue'
import SiteFooter from '../components/SiteFooter.vue'
import HomeIndustryNavigation from '../components/HomeIndustryNavigation.vue'
import GlobalReachSection from '../components/GlobalReachSection.vue'
import InquiryForm from '../components/InquiryForm.vue'
import CompanyStatistics from '../components/CompanyStatistics.vue'
import AboutTzmeContent from '../components/AboutTzmeContent.vue'
import HomeCapabilitiesSection from '../components/HomeCapabilitiesSection.vue'
import ManufacturingFilm from '../components/ManufacturingFilm.vue'
import HomeSolutionsSection from '../components/HomeSolutionsSection.vue'
import { useAboutTzme } from '../services/aboutTzme.js'
import { useCapabilities } from '../services/capabilities.js'
import { useHomeSolutions } from '../services/homeSolutions.js'
import { MAX_HOME_PRODUCTS, useProductCatalog } from '../services/catalog.js'
import { useIndustryCatalog } from '../services/industries.js'
import { useGlobalReach } from '../services/globalReach.js'
import { useContactSettings } from '../services/contactSettings.js'
import { jAssets, jBanner as banner } from '../data/jDesign.js'
import '../style/home-first-screen.css'
const { locale } = useI18n({ useScope: 'global' })
const text = (zh, en) => locale.value === 'zh' ? zh : en
const { products, loadProducts } = useProductCatalog()
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
onMounted(() => { loadProducts(); loadIndustries(); loadCapabilities(); loadHomeSolutions(); loadAboutTzme(); loadGlobalReach() })
</script>

<template>
  <div class="design-site j-home site-refined"><div class="hc-page">
    <SiteNav />
    <main id="main-content">
      <div class="j-home-first-screen">
        <section class="j-hero" :aria-label="text('首页横幅','Homepage banner')">
          <img class="j-hero-photo" :src="banner.image" :alt="text('重钢机械港口、制造与装备现场','TZME port equipment and manufacturing')" fetchpriority="high" />
          <div class="j-hero-copy"><h1 class="site-page-title">{{ banner.title[locale] || banner.title.en }}</h1><span class="j-rule"></span><router-link :to="banner.to" class="j-button" data-analytics-event="cta_click" data-analytics-target="banner-1">{{ banner.button[locale] || banner.button.en }}<span aria-hidden="true">→</span></router-link></div>
        </section>
        <HomeIndustryNavigation :industries="activeIndustries" />
      </div>
      <section v-if="aboutTzme" class="refine-section refine-home-manufacturing"><div class="hc-w refine-factory-grid"><div><AboutTzmeContent :configuration="aboutTzme.home" :locale-code="locale" :show-statistics="false" /><router-link class="refine-link" to="/about">{{ text('走进重钢机械','Discover TZME') }}<span aria-hidden="true">↗</span></router-link><CompanyStatistics :entries="aboutTzme.home.entries" compact /></div><figure class="refine-factory-photo"><div class="refine-factory-image"><img :src="aboutTzme.home.image || jAssets.factory" :alt="text('格林兰制造基地实景','Greenland manufacturing base')" loading="lazy"/><ManufacturingFilm /></div><figcaption><span>制造现场 / 格林兰基地</span><router-link to="/about#manufacturing-bases">了解制造基地 ↗</router-link></figcaption></figure></div></section>
      <HomeSolutionsSection v-if="homeSolutions" :configuration="homeSolutions" :products="featuredProducts" :industries="activeIndustries" />
      <HomeCapabilitiesSection :configuration="capabilities" :locale-code="locale" />
      <section class="j-quality-strip hc-w" aria-labelledby="home-certifications-title">
        <header class="j-quality-heading">
          <h2 id="home-certifications-title">我们目前拥有的资质</h2>
          <router-link class="j-link" to="/about#certificates-title">查看全部<span aria-hidden="true">↗</span></router-link>
        </header>
        <ul class="j-quality-certifications"><li v-for="title in ['ISO 9001','ISO 14001','ISO 45001','EN 1090','ISO 3834']" :key="title"><router-link to="/about#certificates-title">{{ title }}</router-link></li></ul>
      </section>
      <GlobalReachSection :configuration="globalReach" />
      <section class="refine-section j-home-contact"><div class="hc-w refine-contact-grid" :class="{'j-contact-single':!contactSettings?.form.showOnHome}"><div><span class="hc-kick">LET’S BUILD TOGETHER</span><h2 class="hc-h2">{{ text('下一项制造需求，\n从交流开始。','Your next project\nstarts with a conversation.') }}</h2><span class="j-rule"></span><p class="hc-p">{{ text('告诉我们您的图纸、工况、质量要求和交付计划。我们将与您确认设备制造、检验与供货需求。','Tell us about your materials, operating conditions and delivery requirements. Explore an equipment solution with our engineering team.') }}</p><div class="j-direct-contact"><a v-for="email in contactSettings?.contact.emails" :key="email" :href="`mailto:${email}`">{{ email }}</a><p>{{ contactSettings?.contact.phone }}</p></div></div><InquiryForm placement="home" compact /></div></section>
    </main><SiteFooter :show-contact-cta="false" />
  </div></div>
</template>

<style scoped>
.j-quality-strip { display: block; padding: 24px 0 28px; }
.j-quality-heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.j-quality-heading h2 { margin: 0; color: #123a50; font-size: 18px; font-weight: 600; line-height: 1.5; }
.j-quality-heading .j-link { flex-shrink: 0; min-height: 32px; padding: 0; }
.j-quality-certifications { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 24px; margin: 18px 0 0; padding: 0; list-style: none; }
.j-quality-certifications li { min-width: 0; }
.j-quality-certifications a { display: inline-block; padding-block: 6px; }
.j-quality-certifications a:hover { color: #087f91; }
@media (max-width: 700px) {
  .j-quality-strip { padding-block: 20px 22px; }
  .j-quality-heading { gap: 14px; }
  .j-quality-heading h2 { font-size: 16px; }
  .j-quality-heading .j-link { gap: 10px; font-size: 12px; }
  .j-quality-certifications { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 14px; margin-top: 14px; }
}
</style>
