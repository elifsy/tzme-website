<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import ProjectCard from '../components/ProjectCard.vue'
import { useProjectCatalog } from '../services/projects.js'
import { localizedField, MAX_HOME_PRODUCTS, useProductCatalog } from '../services/catalog.js'
import { industryField, useIndustryCatalog } from '../services/industries.js'
const page = ref(null)
const { drawerOpen, goTo, menuItems, isMenuActive, navigateLink } = useDesignPage('hc-home', page)
const { locale } = useI18n({ useScope: 'global' })
const { products, loadProducts } = useProductCatalog()
const { homeProjects, loadProjects } = useProjectCatalog()
const { industries, loadIndustries } = useIndustryCatalog()
const publishedIndustries = computed(() => industries.value.filter((item) => item.status === 'published'))
const featuredProducts = computed(() => products.value
  .filter((item) => item.status === 'published' && item.showOnHome)
  .sort((a, b) => (Number(a.homeOrder) || 999) - (Number(b.homeOrder) || 999))
  .slice(0, MAX_HOME_PRODUCTS))
const productField = (item, name) => localizedField(item, name, locale.value)
const displayIndustry = (item, name) => industryField(item, name, locale.value)
onMounted(() => { loadProducts(); loadIndustries(); loadProjects() })
</script>

<template>
<main ref="page" class="design-site">
<div class="hc-page">

              <!-- Hero -->
              <section class="hc-hero hc-home-hero">
                <div class="hc-bleed"><img src="/assets/hero-01.jpg" alt="" /></div>
                <span class="hc-scrim"></span>
              <header class="hc-nav over">
                <div class="hc-nav-in">
                  <span class="hc-logo"><i></i>TZME</span>
                  <nav class="hc-menu">
                    <a v-for="item in menuItems" :key="item.key" :href="item.path" :class="{ on: isMenuActive(item) }"
                      :aria-current="isMenuActive(item) ? 'page' : undefined"
                      @click="navigateLink($event, item.path)">{{ item.label }}</a>
                  </nav>
                  <div class="hc-nav-r">
                    <el-button class="hc-mobile-menu" text :aria-label="$t('site.openNavigation')" @click="drawerOpen = true">☰</el-button>
                    <LanguageSwitcher />
                    <span class="hc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg></span>
                    <el-button class="hc-btn ghost sm" style="height:34px">{{ $t('site.contactUs') }}<i>→</i></el-button>
                  </div>
                </div>
              </header>
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
              <section class="hc-about">
                <div class="hc-about-l"><div class="hc-w">
                  <span class="hc-kick">{{ $t('site.aboutTzme') }}</span>
                  <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.engineering') }}<br />{{ $t('site.withoutLimits') }}</h2>
                  <p class="hc-p" style="margin-top:20px;max-width:520px">
                    {{ $t('site.tzmeDeliversEngineeredEquipmentAndCustomisedIndustrialSolutionsForSomeOfThe') }}</p>
                  <div class="hc-band" style="margin-top:52px">
                    <div><div class="hc-stat">20<u>+</u></div>
                      <div class="hc-stat-cap">{{ $t('site.yearsOfExperience') }}</div></div>
                    <div><div class="hc-stat">{{ $t('site.global') }}</div>
                      <div class="hc-stat-cap">{{ $t('site.projectCapability') }}</div></div>
                    <div><div class="hc-stat">{{ $t('site.endToEnd') }}</div>
                      <div class="hc-stat-cap">{{ $t('site.engineeringAndManufacturing') }}</div></div>
                  </div>
                </div></div>
                <div class="hc-about-r"><img src="/assets/rnd-2.jpg" alt="" /></div>
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
                      <div class="im"><img :src="item.image || '/assets/p-other-1.jpg'" :alt="productField(item, 'title')" /></div>
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
                <div class="hc-bleed"><img src="/assets/p-mining-4.jpg" alt="" /></div>
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
                        <span class="ic"></span>
                        <div><b>{{ displayIndustry(industry, 'title') }}</b><u>{{ displayIndustry(industry, 'subtitle') }}</u></div>
                      </router-link>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 05 流程 -->
              <section id="capabilities" class="hc-sec hc-light hc-cap">
                <div class="hc-cap-bg"><img src="/assets/hero-03.jpg" alt="" /></div>
                <div class="hc-w hc-cap-in">
                  <span class="hc-kick">{{ $t('site.ourCapabilities') }}</span>
                  <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.fromConcept') }}<br />{{ $t('site.toReality') }}</h2>
                  <p class="hc-p" style="margin-top:20px;max-width:440px">
                    {{ $t('site.fromInitialConceptToFinalCommissioningOurEngineeringAndManufacturingCapabilitiesAre') }}</p>
                  <div class="hc-steps">
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">01</div>
                  <div class="lb">{{ $t('site.concept') }}</div>
                </div>
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">02</div>
                  <div class="lb">{{ $t('site.engineering') }}</div>
                </div>
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">03</div>
                  <div class="lb">{{ $t('site.design') }}</div>
                </div>
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">04</div>
                  <div class="lb">{{ $t('site.fabrication') }}</div>
                </div>
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">05</div>
                  <div class="lb">{{ $t('site.assembly') }}</div>
                </div>
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">06</div>
                  <div class="lb">{{ $t('site.delivery') }}</div>
                </div>
                  </div>
                </div>
              </section>

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
                <div class="hc-tile"><img src="/assets/rnd-2.jpg" alt="" />
                  <span class="lb">{{ $t('site.largeScaleFabrication') }}</span></div>
                <div class="hc-tile"><img src="/assets/rnd-1.jpg" alt="" />
                  <span class="lb">{{ $t('site.3dDesignAndSimulation') }}</span></div>
                <div class="hc-tile"><img src="/assets/p-metal-1.jpg" alt="" />
                  <span class="lb">{{ $t('site.weldingAndNdt') }}</span></div>
                <div class="hc-tile"><img src="/assets/p-port-2.png" alt="" />
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
              <section class="hc-sec">
                <div class="hc-w hc-global">
                  <div>
                    <span class="hc-kick">{{ $t('site.global') }}</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff">
                      {{ $t('site.engineeredInChina') }}<br />{{ $t('site.builtForTheWorld') }}</h2>
                    <p class="hc-p" style="margin-top:20px;max-width:520px">
                      {{ $t('site.workingWithIndustrialCustomersAndPartnersAcrossInternationalMarkets') }}</p>
                    <div class="hc-map" style="margin-top:34px">
                      <img src="/assets/worldmap.png" alt="" />
                    </div>
                  </div>
                  <div class="hc-gstats">
                    <div><div class="hc-stat">60<u>+</u></div>
                      <div class="hc-stat-cap">{{ $t('site.countriesAndRegions') }}</div></div>
                    <div><div class="hc-stat">100<u>+</u></div>
                      <div class="hc-stat-cap">{{ $t('site.globalProjects') }}</div></div>
                    <div><div class="hc-stat">5</div>
                      <div class="hc-stat-cap">{{ $t('site.continents') }}</div></div>
                    <div style="padding-top:26px"><el-button class="hc-btn ghost sm">{{ $t('site.ourGlobalReach') }}<i>→</i></el-button></div>
                  </div>
                </div>
              </section>

              <!-- 09 询价 -->
              <section class="hc-cta">
                <div class="hc-bleed"><img src="/assets/video-poster.jpg" alt="" /></div>
                <span class="hc-scrim"></span>
                <div class="hc-w hc-cta-in">
                  <div>
                    <span class="hc-kick">{{ $t('site.getInTouch') }}</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff">
                      {{ $t('site.haveAChallenge') }}<br />{{ $t('site.thatNeedsEngineering') }}</h2>
                    <p class="hc-p" style="margin-top:20px;max-width:420px">
                      {{ $t('site.tellUsWhatYouReTryingToBuildMoveOrSolve') }}</p>
                    <div style="margin-top:30px"><el-button class="hc-btn solid">{{ $t('site.startAProject') }}<i>→</i></el-button></div>
                    <div class="hc-cinfo">
                      <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>tzme@tzme.net</div>
                      <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 5h4l2 5-2.5 1.5a12 12 0 0 0 5 5L14 14l5 2v4a15 15 0 0 1-15-15Z"/></svg>+86 22 2521 4991</div>
                    </div>
                  </div>
                  <div class="hc-form">
                    <div class="g2">
                      <div class="hc-f"><label>{{ $t('site.name') }}</label><el-input :placeholder="$t('site.johnMiller')" /></div>
                      <div class="hc-f"><label>{{ $t('site.company') }}</label><el-input :placeholder="$t('site.companyName')" /></div>
                      <div class="hc-f"><label>{{ $t('site.country') }}</label><el-input :placeholder="$t('site.australia')" /></div>
                      <div class="hc-f"><label>{{ $t('site.email') }}</label><el-input :placeholder="$t('site.youCompanyCom')" /></div>
                      <div class="hc-f"><label>{{ $t('site.phone') }}</label><el-input :placeholder="$t('site.phonePlaceholder')" /></div>
                      <div class="hc-f"><label>{{ $t('site.industry') }}</label><el-input :placeholder="$t('site.mining')" /></div>
                    </div>
                    <div class="hc-f"><label>{{ $t('site.projectRequirements') }}</label>
                      <el-input type="textarea" :rows="3" :placeholder="$t('site.capacityMaterialHandledSiteConditionsRequiredDeliveryDate')" /></div>
                    <div class="hc-upload">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 16V6m0 0L8.5 9.5M12 6l3.5 3.5M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/></svg>
                      <div>
                        <div style="font-size:12px;color:var(--txt)">{{ $t('site.dragAndDropOrClickToUpload') }}</div>
                        <div style="font-size:10.5px;color:var(--txt-3);margin-top:4px">
                          {{ $t('site.max20MbPdfDwgXlsJpgPng') }}</div>
                      </div>
                    </div>
                    <div style="display:flex;justify-content:flex-end">
                      <el-button class="hc-btn solid">{{ $t('site.sendInquiry') }}<i>→</i></el-button>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 10 页脚 -->
              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>TZME</span>
                  <span class="tag">{{ $t('site.heavyEngineeringBuiltAroundYourChallenge') }}</span>
                  <nav class="hc-foot-nav">
                    <a v-for="item in menuItems" :key="item.key" :href="item.path"
                      :aria-current="isMenuActive(item) ? 'page' : undefined"
                      @click="navigateLink($event, item.path)">{{ item.label }}</a>
                  </nav>
                  <LanguageSwitcher style="color:var(--txt-2)" />
                  <span class="hc-soc"><span>in</span><span>▶</span><span>✕</span></span>
                </div>
                <div class="hc-foot-bot">
                  <span>{{ $t('site.copyright') }}</span>
                  <span>{{ $t('site.privacyPolicyTermsOfUseNo139XiamenRoadBinhaiNewArea') }}</span>
                </div>
              </footer>

            </div>
  <el-drawer v-model="drawerOpen" title="TZME" direction="rtl" size="min(320px, 85vw)" class="hc-mobile-drawer">
    <nav class="hc-mobile-links">
      <el-button v-for="item in menuItems" :key="item.key" text
        :type="isMenuActive(item) ? 'primary' : 'default'" @click="goTo(item.path)">{{ item.label }}</el-button>
    </nav>
    <LanguageSwitcher mobile />
  </el-drawer></main>
</template>
