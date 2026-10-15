<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SiteNav from '../components/SiteNav.vue'
import SiteFooter from '../components/SiteFooter.vue'
import ProjectCard from '../components/ProjectCard.vue'
import IndustryIcon from '../components/IndustryIcon.vue'
import WorldReachMap from '../components/WorldReachMap.vue'
import InquiryForm from '../components/InquiryForm.vue'
import AboutTzmeContent from '../components/AboutTzmeContent.vue'
import HomeCapabilitiesSection from '../components/HomeCapabilitiesSection.vue'
import ManufacturingFilm from '../components/ManufacturingFilm.vue'
import { useAboutTzme } from '../services/aboutTzme.js'
import { useCapabilities } from '../services/capabilities.js'
import { localizedField, MAX_HOME_PRODUCTS, useProductCatalog } from '../services/catalog.js'
import { useProjectCatalog } from '../services/projects.js'
import { useArticleCatalog, articlePath } from '../services/articles.js'
import { useIndustryCatalog, industryField } from '../services/industries.js'
import { useGlobalReach } from '../services/globalReach.js'
import { globalReachText, isGlobalReachUrl } from '../data/globalReach.js'
import { useContactSettings } from '../services/contactSettings.js'
import { jAssets, jBanners } from '../data/jDesign.js'
import { trackEvent } from '../services/analytics.js'
const { locale } = useI18n({ useScope: 'global' })
const text = (zh, en) => locale.value === 'zh' ? zh : en
const field = (item, name) => localizedField(item, name, locale.value)
const slide = ref(0)
const banner = computed(() => jBanners[slide.value])
function changeSlide(value) { slide.value = (value + jBanners.length) % jBanners.length; trackEvent('cta_click', 'banner-' + (slide.value + 1)) }
const { products, loadProducts } = useProductCatalog()
const { homeProjects, loadProjects } = useProjectCatalog()
const { industries, loadIndustries } = useIndustryCatalog()
const { publishedArticles, loadArticles } = useArticleCatalog()
const { capabilities, loadCapabilities } = useCapabilities()
const { aboutTzme, loadAboutTzme } = useAboutTzme()
const { globalReach, loadGlobalReach } = useGlobalReach()
const { contactSettings } = useContactSettings()
const activeIndustries = computed(() => industries.value.filter(item => item.status === 'published'))
const quickIndustries = computed(() => ['ports', 'mining', 'metallurgy'].map(id => activeIndustries.value.find(item => item.id === id)).filter(Boolean))
const featuredProducts = computed(() => products.value.filter(item => item.status === 'published' && item.showOnHome)
  .sort((a,b) => (Number(a.homeOrder) || 999) - (Number(b.homeOrder) || 999)).slice(0, MAX_HOME_PRODUCTS))
const latestNews = computed(() => [...publishedArticles.value].sort((a,b) => Number(['canada-energy','annual-gala'].includes(b.id)) - Number(['canada-energy','annual-gala'].includes(a.id))).slice(0,3))
const globalField = name => globalReachText(globalReach.value?.[name], locale.value)
onMounted(() => { loadProducts(); loadIndustries(); loadProjects(); loadArticles(); loadCapabilities(); loadAboutTzme(); loadGlobalReach() })
</script>

<template>
  <div class="design-site j-home"><div class="hc-page">
    <SiteNav />
    <main id="main-content">
      <section class="j-hero" aria-roledescription="carousel" :aria-label="text('首页横幅','Homepage banners')" :data-slide="slide">
        <img class="j-hero-photo" :src="banner.image" :alt="text('重钢机械港口、制造与装备现场','TZME port equipment and manufacturing')" fetchpriority="high" />
        <div class="j-hero-copy" aria-live="polite"><h1>{{ banner.title[locale] || banner.title.en }}</h1><span class="j-rule"></span><p v-if="banner.subtitle">{{ banner.subtitle[locale] || banner.subtitle.en }}</p><router-link :to="banner.to" class="j-button" data-analytics-event="cta_click" :data-analytics-target="`banner-${slide + 1}`">{{ banner.button[locale] || banner.button.en }}<span aria-hidden="true">→</span></router-link></div>
        <div class="j-hero-controls"><button type="button" :aria-label="text('上一张横幅','Previous banner')" @click="changeSlide(slide - 1)">←</button><button v-for="(item,index) in jBanners" :key="index" type="button" :aria-label="text('切换横幅','Select banner') + ' ' + (index+1)" :aria-pressed="slide === index" @click="changeSlide(index)">{{ String(index+1).padStart(2,'0') }}</button><button type="button" :aria-label="text('下一张横幅','Next banner')" @click="changeSlide(slide + 1)">→</button></div>
      </section>
      <section class="j-industry-strip"><div class="hc-w"><router-link v-for="industry in quickIndustries" :key="industry.id" :to="{ path:'/solutions',query:{industry:industry.id} }" data-analytics-event="industry_filter" :data-analytics-target="industry.id"><IndustryIcon :icon="industry.icon"/><div><strong>{{ industryField(industry,'title',locale) }}</strong><small>{{ industryField(industry,'subtitle',locale) }}</small></div><span aria-hidden="true">→</span></router-link></div></section>
      <section v-if="aboutTzme" class="hc-sec j-manufacturing"><div class="hc-w j-split"><div><AboutTzmeContent :configuration="aboutTzme.home" :locale-code="locale" /><router-link class="j-link" to="/about">{{ text('走进重钢机械','Discover TZME') }}<span>→</span></router-link></div><figure><div class="j-factory-photo"><img :src="aboutTzme.home.image || jAssets.factory" :alt="text('格林兰制造基地实景','Greenland manufacturing base')" loading="lazy"/><ManufacturingFilm /></div><figcaption>TIANJIN / ENGINEERING · FABRICATION · DELIVERY</figcaption></figure></div></section>
      <section class="hc-sec j-port-feature"><div class="hc-w j-split reverse"><img :src="jAssets.harbor" :alt="text('港口装卸设备实景','Port material handling')" loading="lazy"/><div><span class="hc-kick">PORT MATERIAL HANDLING</span><h2 class="hc-h2">{{ text('让每一次搬运，\n更稳妥。','Move every load\nwith confidence.') }}</h2><span class="j-rule"></span><p class="hc-p">{{ text('面向港口物料搬运的实际需求，提供定制化的卸船机、装船机、堆取料机及相关配套设备，衔接装备制造与现场作业。','Custom ship unloaders, ship loaders, stackers, reclaimers and supporting equipment shaped around real port handling requirements.') }}</p><router-link class="j-button" :to="{path:'/solutions',query:{industry:'ports'}}">{{ text('港口物料搬运','Port material handling') }}<span>→</span></router-link></div></div></section>
      <section class="hc-sec j-soft"><div class="hc-w"><div class="hc-shead"><div><span class="hc-kick">OUR EQUIPMENT</span><h2 class="hc-h2">{{ text('为复杂工况，\n打造适用的装备。','Equipment shaped\nfor demanding applications.') }}</h2></div><router-link class="j-link" to="/solutions">{{ text('全部产品与方案','All products & solutions') }}<span>→</span></router-link></div><div class="hc-cards"><router-link v-for="item in featuredProducts" :key="item.id" class="hc-card" :to="`/solutions/${item.id}`"><div class="im"><img :src="item.image" :alt="field(item,'title')" loading="lazy"/></div><div class="bd"><span class="j-card-meta">{{ field(item,'category') }}</span><h3>{{ field(item,'title') }}</h3><p>{{ field(item,'summary') }}</p><span class="go">{{ text('了解产品与方案','Explore equipment') }}<i>→</i></span></div></router-link></div></div></section>
      <section id="industries" class="hc-sec"><div class="hc-w"><span class="hc-kick">INDUSTRIES WE SERVE</span><h2 class="hc-h2">{{ text('理解行业，回应挑战。','Understanding industries. Engineering solutions.') }}</h2><div class="j-industry-grid"><router-link v-for="industry in activeIndustries" :key="industry.id" :to="{path:'/solutions',query:{industry:industry.id}}" data-analytics-event="industry_filter" :data-analytics-target="industry.id"><IndustryIcon :icon="industry.icon"/><strong>{{ industryField(industry,'title',locale) }} ↗</strong><small>{{ industryField(industry,'subtitle',locale) }}</small></router-link></div></div></section>
      <HomeCapabilitiesSection :configuration="capabilities" :locale-code="locale" />
      <section id="projects" class="hc-sec"><div class="hc-w"><div class="hc-shead"><div><span class="hc-kick">SELECTED PROJECTS</span><h2 class="hc-h2">{{ text('真实项目，持久价值。','Real projects. Lasting value.') }}</h2></div><router-link class="j-link" to="/projects">{{ $t('site.viewAllProjects') }}<span>→</span></router-link></div><div v-if="homeProjects.length" class="hc-proj"><ProjectCard v-for="project in homeProjects" :key="project.id" :project="project"/></div><el-empty v-else :description="$t('site.projectsEmpty')"/></div></section>
      <section class="j-quality-strip hc-w"><router-link v-for="title in ['ISO 9001','ISO 14001','ISO 45001','EN 1090','ISO 3834']" :key="title" to="/about#certificates-title">{{ title }}</router-link><router-link class="j-link" to="/about#certificates-title">{{ text('资质与质量体系','Quality & certifications') }} ↗</router-link></section>
      <section v-if="globalReach?.enabled" class="hc-sec j-global j-soft"><div class="hc-w hc-global"><div><span class="hc-kick">{{ globalField('kicker') }}</span><h2 class="hc-h2">{{ globalField('titleLine1') }}<br v-if="globalField('titleLine2')"/>{{ globalField('titleLine2') }}</h2><div class="hc-map"><WorldReachMap v-if="globalReach.mapMode === 'points'" :points="globalReach.mapPoints" :description="globalField('imageAlt')" :locale-code="locale"/><el-image v-else :src="globalReach.image" :alt="globalField('imageAlt')" fit="contain"/></div></div><div><p class="hc-p">{{ globalField('description') }}</p><div class="hc-gstats"><div v-for="(stat,index) in globalReach.statistics" :key="index"><div class="hc-stat">{{ stat.value }}<u v-if="stat.suffix">{{ stat.suffix }}</u></div><div class="hc-stat-cap">{{ globalReachText(stat.label,locale) }}</div></div></div><component :is="globalReach.buttonLink.startsWith('/') ? 'router-link' : 'a'" v-if="globalReach.showButton && isGlobalReachUrl(globalReach.buttonLink)" class="j-link" :to="globalReach.buttonLink" :href="globalReach.buttonLink">{{ globalField('buttonText') }}<span>→</span></component></div></div></section>
      <section v-if="latestNews.length" class="hc-sec"><div class="hc-w"><div class="hc-shead"><div><span class="hc-kick">NEWS & INSIGHTS</span><h2 class="hc-h2">{{ text('来自制造与工程一线。','From engineering and manufacturing.') }}</h2></div><router-link class="j-link" to="/insights">{{ text('全部资讯','All news') }}<span>→</span></router-link></div><div class="hc-cards"><router-link v-for="article in latestNews" :key="article.id" class="hc-card" :to="articlePath(article.id)"><div class="im"><img :src="article.image" :alt="field(article,'title')" loading="lazy"/></div><div class="bd"><span class="j-card-meta">{{ field(article,'category') }}<template v-if="article.date"> · {{ article.date }}</template></span><h3>{{ field(article,'title') }}</h3><span class="go">{{ text('阅读全文','Read article') }}<i>→</i></span></div></router-link></div></div></section>
      <section class="hc-sec j-home-contact"><div class="hc-w j-contact-layout" :class="{'j-contact-single':!contactSettings?.form.showOnHome}"><div><span class="hc-kick">LET’S BUILD TOGETHER</span><h2 class="hc-h2">{{ text('下一项工程，\n从交流开始。','Your next project\nstarts with a conversation.') }}</h2><span class="j-rule"></span><p class="hc-p">{{ text('告诉我们您的物料、工况和交付需求。我们的工程团队将与您一起探讨适用的设备与制造方案。','Tell us about your materials, operating conditions and delivery requirements. Explore an equipment solution with our engineering team.') }}</p><div class="j-direct-contact"><a v-for="email in contactSettings?.contact.emails" :key="email" :href="`mailto:${email}`">{{ email }}</a><p>{{ contactSettings?.contact.phone }}</p></div></div><InquiryForm placement="home"/></div></section>
    </main><SiteFooter />
  </div></div>
</template>
