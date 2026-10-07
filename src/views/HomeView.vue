<script setup>
import { useSiteContent } from '../services/website.js'
const { siteAsset, siteValue } = useSiteContent()
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import SocialLinks from '../components/SocialLinks.vue'
import SiteNav from '../components/SiteNav.vue'
import ProjectCard from '../components/ProjectCard.vue'
import WorldReachMap from '../components/WorldReachMap.vue'
import InquiryForm from '../components/InquiryForm.vue'
import IndustryIcon from '../components/IndustryIcon.vue'
import HomeCapabilitiesSection from '../components/HomeCapabilitiesSection.vue'
import { useCapabilities } from '../services/capabilities.js'
import { contactText, useContactSettings } from '../services/contactSettings.js'
import { useProjectCatalog } from '../services/projects.js'
import { localizedField, MAX_HOME_PRODUCTS, useProductCatalog } from '../services/catalog.js'
import { industryField, useIndustryCatalog } from '../services/industries.js'
import { useGlobalReach } from '../services/globalReach.js'
import { globalReachText, isGlobalReachUrl } from '../data/globalReach.js'
const page = ref(null)
const { menuItems, isMenuActive, navigateLink } = useDesignPage('hc-home', page)
const { locale } = useI18n({ useScope: 'global' })
const { contactSettings } = useContactSettings()
const router = useRouter()
const { globalReach, loadGlobalReach } = useGlobalReach()
const globalField = (name) => globalReachText(globalReach.value?.[name], locale.value)
function navigateGlobalLink(event) {
  const path = globalReach.value.buttonLink
  if (!isGlobalReachUrl(path)) return
  if (event.ctrlKey || event.metaKey || event.shiftKey) {
    window.open(path.startsWith('/') ? router.resolve(path).href : path, '_blank', 'noopener,noreferrer')
    return
  }
  if (path.startsWith('/')) router.push(path)
  else window.location.assign(path)
}
const { products, loadProducts } = useProductCatalog()
const { homeProjects, loadProjects } = useProjectCatalog()
const { industries, loadIndustries } = useIndustryCatalog()
const { capabilities, loadCapabilities } = useCapabilities()
const publishedIndustries = computed(() => industries.value.filter((item) => item.status === 'published'))
const featuredProducts = computed(() => products.value
  .filter((item) => item.status === 'published' && item.showOnHome)
  .sort((a, b) => (Number(a.homeOrder) || 999) - (Number(b.homeOrder) || 999))
  .slice(0, MAX_HOME_PRODUCTS))
const productField = (item, name) => localizedField(item, name, locale.value)
const displayIndustry = (item, name) => industryField(item, name, locale.value)
onMounted(() => { loadProducts(); loadIndustries(); loadProjects(); loadGlobalReach(); loadCapabilities() })
</script>

<template>
<main ref="page" class="design-site">
<div class="hc-page">

              <!-- Hero -->
              <section class="hc-hero hc-home-hero">
                <div class="hc-bleed"><img :src="siteAsset('/assets/hero-01.jpg')" alt="" /></div>
                <span class="hc-scrim"></span>
              <SiteNav overlay />
                <div class="hc-hero-in"><div class="hc-w">
                  <span class="hc-kick">{{ $t('site.heavyEngineeringBuiltAroundYourChallenge') }}</span>
                  <h1 class="hc-h1" style="margin-top:22px;max-width:820px">
                    {{ $t('site.engineeredFor') }}<br />{{ $t('site.theWorldSToughest') }}<br />{{ $t('site.challenges') }}</h1>
                  <p class="hc-p" style="margin-top:22px;max-width:520px">
                    {{ $t('site.customBuiltHeavyMachineryAndIndustrialEquipmentEngineeredForDemandingApplicationsWorl') }}</p>
                  <div style="display:flex;gap:14px;margin-top:34px">
                    <el-button class="hc-btn solid">{{ $t('site.exploreSolutions') }}<i>→</i></el-button>
                    <el-button class="hc-btn ghost">{{ $t('site.startAProject') }}</el-button>
                  </div>
                </div></div>
              </section>

              <!-- 02 简介 -->
              <section class="hc-sec home-about">
                <div class="hc-w home-about-layout">
                  <div class="home-about-copy">
                  <span class="hc-kick">{{ $t('site.aboutTzme') }}</span>
                  <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.engineering') }}<br />{{ $t('site.withoutLimits') }}</h2>
                  <p class="hc-p" style="margin-top:20px;max-width:520px">
                    {{ $t('site.tzmeDeliversEngineeredEquipmentAndCustomisedIndustrialSolutionsForSomeOfThe') }}</p>
                  <div class="hc-band home-about-stats">
                    <div><div class="hc-stat">{{ siteValue('text_91032ad7bbcb') }}<u>+</u></div>
                      <div class="hc-stat-cap">{{ $t('site.yearsOfExperience') }}</div></div>
                    <div><div class="hc-stat">{{ $t('site.global') }}</div>
                      <div class="hc-stat-cap">{{ $t('site.projectCapability') }}</div></div>
                    <div><div class="hc-stat">{{ $t('site.endToEnd') }}</div>
                      <div class="hc-stat-cap">{{ $t('site.engineeringAndManufacturing') }}</div></div>
                  </div>
                  </div>
                  <div class="home-about-image"><el-image :src="siteAsset('/assets/rnd-2.jpg')" alt="" fit="cover" /></div>
                </div>
              </section>

              <!-- 03 服务分类 -->
              <section class="hc-sec">
                <div class="hc-w">
                  <div class="hc-shead">
                    <div class="l">
                      <span class="hc-kick">{{ $t('site.ourSolutions') }}</span>
                      <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.whatWeEngineer') }}</h2>
                    </div>
                    <span class="hc-lnk">{{ $t('site.allSolutions') }}<i>→</i></span>
                  </div>
                  <div class="hc-cards">
                    <router-link v-for="(item, index) in featuredProducts" :key="item.id" class="hc-card" :to="`/solutions/${item.id}`">
                      <div class="im"><img :src="item.image || siteAsset('/assets/p-other-1.jpg')" :alt="productField(item, 'title')" /></div>
                      <div class="bd">
                        <span class="no">{{ String(index + 1).padStart(2, '0') }}</span>
                        <h3>{{ productField(item, 'title') }}</h3>
                        <p>{{ productField(item, 'summary') }}</p>
                        <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                      </div>
                    </router-link>
                  </div>
                </div>
              </section>

              <!-- 04 行业 -->
              <section id="industries" class="hc-ind-sec">
                <div class="hc-bleed"><img :src="siteAsset('/assets/p-mining-4.jpg')" alt="" /></div>
                <span class="hc-scrim"></span>
                <div class="hc-ind-in">
                  <div class="hc-ind-grid">
                    <div>
                      <span class="hc-kick">{{ $t('site.industries') }}</span>
                      <h2 class="hc-h2" style="margin-top:18px;color:#fff">{{ $t('site.engineeredFor') }}<br />{{ $t('site.yourIndustry') }}</h2>
                      <p class="hc-p" style="margin-top:20px;max-width:420px;color:var(--txt-2)">
                        {{ $t('site.weUnderstandTheUniqueChallengesOfYourIndustryAndDeliverSolutionsThat') }}</p>
                      <div style="margin-top:30px"><router-link class="hc-lnk" to="/solutions" @click.stop>{{ $t('site.exploreAllIndustries') }}<i>→</i></router-link></div>
                    </div>
                    <div class="hc-ind">
                      <router-link v-for="industry in publishedIndustries" :key="industry.id" class="hc-ind-item"
                        :to="{ path: '/solutions', query: { industry: industry.id } }">
                        <span class="ic home-industry-icon"><IndustryIcon :icon="industry.icon || ''" /></span>
                        <div><b>{{ displayIndustry(industry, 'title') }}</b><u>{{ displayIndustry(industry, 'subtitle') }}</u></div>
                      </router-link>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 05 流程 -->
              <HomeCapabilitiesSection :configuration="capabilities" :locale-code="locale" />

              <!-- 06 制造能力 -->
              <section class="hc-sec hc-deep">
                <div class="hc-w hc-scale">
                  <div>
                    <span class="hc-kick">{{ $t('site.manufacturing') }}</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff">{{ $t('site.builtForScale') }}</h2>
                    <p class="hc-p" style="margin-top:20px;max-width:420px">
                      {{ $t('site.largeScaleEngineeringRequiresMoreThanDesignItRequiresManufacturingCapabilityPrecision') }}</p>
                    <div style="margin-top:30px"><el-button class="hc-btn ghost">{{ $t('site.ourFacilities') }}<i>→</i></el-button></div>
                  </div>
                  <div class="hc-tiles">
                <div class="hc-tile"><img :src="siteAsset('/assets/rnd-2.jpg')" alt="" />
                  <span class="lb">{{ $t('site.largeScaleFabrication') }}</span></div>
                <div class="hc-tile"><img :src="siteAsset('/assets/rnd-1.jpg')" alt="" />
                  <span class="lb">{{ $t('site.3dDesignAndSimulation') }}</span></div>
                <div class="hc-tile"><img :src="siteAsset('/assets/p-metal-1.jpg')" alt="" />
                  <span class="lb">{{ $t('site.weldingAndNdt') }}</span></div>
                <div class="hc-tile"><img :src="siteAsset('/assets/p-port-2.png')" alt="" />
                  <span class="lb">{{ $t('site.assemblyAndTesting') }}</span></div>
                  </div>
                </div>
              </section>

              <!-- 07 案例 -->
              <section id="projects" class="hc-sec hc-white home-selected-projects">
                <div class="hc-w">
                  <div class="hc-shead">
                    <div class="l">
                      <span class="hc-kick">{{ $t('site.selectedProjects') }}</span>
                      <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.realProjectsLastingValue') }}</h2>
                    </div>
                    <router-link class="hc-lnk" to="/projects">{{ $t('site.viewAllProjects') }}<i>→</i></router-link>
                  </div>
                  <div v-if="homeProjects.length" class="hc-proj">
                    <ProjectCard v-for="project in homeProjects" :key="project.id" :project="project" />
                  </div>
                  <el-empty v-else :description="$t('site.projectsEmpty')" />
                </div>
              </section>

              <!-- 08 全球 -->
              <section v-if="globalReach?.enabled" class="hc-sec home-global" aria-labelledby="home-global-title">
                <div class="hc-w hc-global">
                  <div>
                    <span class="hc-kick">{{ globalField('kicker') }}</span>
                    <h2 id="home-global-title" class="hc-h2" style="margin-top:18px;color:#fff">
                      {{ globalField('titleLine1') }}<template v-if="globalField('titleLine2')"><br />{{ globalField('titleLine2') }}</template></h2>
                    <p class="hc-p" style="margin-top:20px;max-width:520px">
                      {{ globalField('description') }}</p>
                    <div class="hc-map" style="margin-top:34px">
                      <WorldReachMap v-if="globalReach.mapMode === 'points'" :points="globalReach.mapPoints"
                        :description="globalField('imageAlt')" :locale-code="locale" />
                      <el-image v-else :src="globalReach.image" :alt="globalField('imageAlt')" fit="contain" style="width:100%">
                        <template #error><div class="home-global-image-error">{{ globalField('imageAlt') }}</div></template>
                      </el-image>
                    </div>
                  </div>
                  <div class="hc-gstats">
                    <div v-for="(statistic, index) in globalReach.statistics" :key="index">
                      <div class="hc-stat">{{ statistic.value }}<u v-if="statistic.suffix">{{ statistic.suffix }}</u></div>
                      <div class="hc-stat-cap">{{ globalReachText(statistic.label, locale) }}</div>
                    </div>
                    <div v-if="globalReach.showButton && isGlobalReachUrl(globalReach.buttonLink)" style="padding-top:26px">
                      <el-button native-type="button" class="hc-btn ghost sm" @click.stop="navigateGlobalLink">
                        {{ globalField('buttonText') }}<i aria-hidden="true">→</i>
                      </el-button>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 09 询价 -->
              <section class="hc-cta">
                <div class="hc-bleed"><img :src="siteAsset('/assets/video-poster.jpg')" alt="" /></div>
                <span class="hc-scrim"></span>
                <div class="hc-w hc-cta-in" :class="{ 'home-contact-single': !contactSettings?.form.showOnHome }">
                  <div>
                    <span class="hc-kick">{{ $t('site.getInTouch') }}</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff">
                      {{ $t('site.haveAChallenge') }}<br />{{ $t('site.thatNeedsEngineering') }}</h2>
                    <p class="hc-p" style="margin-top:20px;max-width:420px">
                      {{ $t('site.tellUsWhatYouReTryingToBuildMoveOrSolve') }}</p>
                    <div style="margin-top:30px"><el-button class="hc-btn solid">{{ $t('site.startAProject') }}<i>→</i></el-button></div>
                    <div class="hc-cinfo">
                      <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>{{ contactSettings?.contact.emails.join(' · ') }}</div>
                      <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 5h4l2 5-2.5 1.5a12 12 0 0 0 5 5L14 14l5 2v4a15 15 0 0 1-15-15Z"/></svg>{{ contactSettings?.contact.phone }}</div>
                    </div>
                  </div>
                  <InquiryForm placement="home" />
                </div>
              </section>

              <!-- 10 页脚 -->
              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>{{ siteValue('text_8920f3d022b5') }}</span>
                  <span class="tag">{{ $t('site.heavyEngineeringBuiltAroundYourChallenge') }}</span>
                  <nav class="hc-foot-nav">
                    <a v-for="item in menuItems" :key="item.key" :href="item.path"
                      :aria-current="isMenuActive(item) ? 'page' : undefined"
                      @click="navigateLink($event, item.path)">{{ item.label }}</a>
                  </nav>
                  <LanguageSwitcher style="color:var(--txt-2)" />
                  <SocialLinks />
                </div>
                <div class="hc-foot-bot">
                  <span>{{ $t('site.copyright') }}</span>
                  <span>{{ $t('contactUi.footerTerms') }} · {{ contactText(contactSettings?.contact.address, locale) }}</span>
                </div>
              </footer>

            </div>
</main>
</template>

<style scoped>
.hc-ind .home-industry-icon { display: inline-flex; align-items: center; justify-content: center; }
.hc-ind .home-industry-icon::before { content: none; }
.home-contact-single { grid-template-columns: 1fr; }
.home-global .hc-global > div { min-width: 0; }
.home-global .hc-h2, .home-global .hc-p, .home-global .hc-stat, .home-global .hc-stat-cap { overflow-wrap: anywhere; }
.home-global .hc-p { white-space: pre-line; }
.home-global .hc-gstats .hc-btn { max-width: 100%; min-height: 38px; height: auto; padding: 10px 17px; white-space: normal; text-align: left; }
.home-global .hc-gstats .hc-btn :deep(> span) { min-width: 0; max-width: 100%; line-height: 1.4; }
.home-global-image-error { display: grid; place-items: center; min-height: 150px; color: #bccddb; }
.home-about { padding: 72px 0 56px; }
.home-about-layout { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: 48px; align-items: center; }
.home-about-copy { min-width: 0; }
.home-about .hc-h2 { color: var(--txt); }
.home-about-image { position: relative; align-self: stretch; min-width: 0; min-height: 360px; overflow: hidden; border: 1px solid var(--line-d); border-radius: 4px; }
.home-about-image .el-image { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.home-about-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 40px; }
.home-about-stats > div, .home-about-stats > div + div { min-width: 0; padding: 24px 10px 4px; }
.home-about-stats > div:first-child { padding-left: 0; }
.home-about-stats > div:last-child { padding-right: 0; }
.home-about-stats .hc-stat { font-size: clamp(22px, 2vw, 30px); }
.home-about-stats .hc-stat-cap { color: #bccddb; font-size: 12px; }
@media (max-width: 960px) {
  .home-about-layout { grid-template-columns: minmax(0, 1fr); gap: 32px; }
  .home-about-image { min-height: 0; aspect-ratio: 16 / 9; }
}
@media (max-width: 700px) {
  .home-global .hc-gstats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .home-global .hc-gstats > div:last-child:has(.hc-btn) { grid-column: 1 / -1; }
  .home-about-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 12px; }
  .home-about-stats > div:nth-child(2n) { border-right: 0; }
  .home-about-stats > div:last-child { grid-column: 1 / -1; padding-left: 0; }
}
</style>
