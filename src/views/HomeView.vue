<script setup>
import { ref } from 'vue'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
const page = ref(null)
const { drawerOpen, goTo, menuItems } = useDesignPage('hc-home', page)
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
                    <a class="on">{{ $t('site.solutions') }}</a><a>{{ $t('site.industries') }}</a><a>{{ $t('site.capabilities') }}</a>
                    <a>{{ $t('site.projects') }}</a><a>{{ $t('site.aboutTzme') }}</a><a>{{ $t('site.insights') }}</a>
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
                <a class="hc-card">
                  <div class="im"><img src="/assets/p-mining-2.jpg" alt="" /></div>
                  <div class="bd">
                    <span class="no">01</span>
                    <h3>{{ $t('site.materialHandling') }}</h3>
                    <p>{{ $t('site.movingMoreMovingSmarter') }}</p>
                    <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                  </div>
                </a>
                <a class="hc-card">
                  <div class="im"><img src="/assets/p-mining-1.jpg" alt="" /></div>
                  <div class="bd">
                    <span class="no">02</span>
                    <h3>{{ $t('site.mining') }}</h3>
                    <p>{{ $t('site.builtForExtremeConditions') }}</p>
                    <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                  </div>
                </a>
                <a class="hc-card">
                  <div class="im"><img src="/assets/p-port-1.jpg" alt="" /></div>
                  <div class="bd">
                    <span class="no">03</span>
                    <h3>{{ $t('site.portsAndTerminals') }}</h3>
                    <p>{{ $t('site.engineeredForGlobalTrade') }}</p>
                    <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                  </div>
                </a>
                <a class="hc-card">
                  <div class="im"><img src="/assets/p-metal-1.jpg" alt="" /></div>
                  <div class="bd">
                    <span class="no">04</span>
                    <h3>{{ $t('site.metallurgy') }}</h3>
                    <p>{{ $t('site.precisionBuiltForHeavyIndustry') }}</p>
                    <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                  </div>
                </a>
                <a class="hc-card">
                  <div class="im"><img src="/assets/p-bridge-1.jpg" alt="" /></div>
                  <div class="bd">
                    <span class="no">05</span>
                    <h3>{{ $t('site.infrastructure') }}</h3>
                    <p>{{ $t('site.engineeringAtScale') }}</p>
                    <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                  </div>
                </a>
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
                      <div style="margin-top:30px"><span class="hc-lnk">{{ $t('site.exploreAllIndustries') }}<i>→</i></span></div>
                    </div>
                    <div class="hc-ind">
                  <div><span class="ic"></span>
                    <div><b>{{ $t('site.mining') }}</b><u>{{ $t('site.miningAndBulkMaterials') }}</u></div></div>
                  <div><span class="ic"></span>
                    <div><b>{{ $t('site.ports') }}</b><u>{{ $t('site.portsAndTerminals') }}</u></div></div>
                  <div><span class="ic"></span>
                    <div><b>{{ $t('site.metallurgy') }}</b><u>{{ $t('site.steelAndMetallurgy') }}</u></div></div>
                  <div><span class="ic"></span>
                    <div><b>{{ $t('site.energy') }}</b><u>{{ $t('site.energyAndIndustrialInfrastructure') }}</u></div></div>
                  <div><span class="ic"></span>
                    <div><b>{{ $t('site.construction') }}</b><u>{{ $t('site.constructionAndHeavyInfrastructure') }}</u></div></div>
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
              <section id="projects" class="hc-sec hc-white">
                <div class="hc-w">
                  <div class="hc-shead">
                    <div class="l">
                      <span class="hc-kick">{{ $t('site.selectedProjects') }}</span>
                      <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.realProjectsLastingValue') }}</h2>
                    </div>
                    <span class="hc-lnk">{{ $t('site.viewAllProjects') }}<i>→</i></span>
                  </div>
                  <div class="hc-proj">
                <div class="c">
                  <div class="im"><img src="/assets/p-port-1.jpg" alt="" /></div>
                  <div class="bd">
                    <h3>{{ $t('site.portMaterialHandlingSystem') }}</h3>
                    <div class="tg"><span class="hc-tag l">{{ $t('site.portInfrastructure') }}</span><span class="hc-tag l">{{ $t('site.chile') }}</span></div>
                    <div class="meta">
                      <div><b>{{ $t('site.capacity') }}</b><span>3,000 t/h</span></div>
                      <div><b>{{ $t('site.technology') }}</b><span>{{ $t('site.stackerReclaimer') }}</span></div>
                      <div><b>{{ $t('site.scope') }}</b><span>EP + MC</span></div>
                    </div>
                  </div>
                </div>
                <div class="c">
                  <div class="im"><img src="/assets/p-mining-2.jpg" alt="" /></div>
                  <div class="bd">
                    <h3>{{ $t('site.miningMaterialHandling') }}</h3>
                    <div class="tg"><span class="hc-tag l">{{ $t('site.miningIndustry') }}</span><span class="hc-tag l">{{ $t('site.australia') }}</span></div>
                    <div class="meta">
                      <div><b>{{ $t('site.capacity') }}</b><span>5,000 t/h</span></div>
                      <div><b>{{ $t('site.technology') }}</b><span>{{ $t('site.beltConveyor') }}</span></div>
                      <div><b>{{ $t('site.scope') }}</b><span>EP + MC</span></div>
                    </div>
                  </div>
                </div>
                <div class="c">
                  <div class="im"><img src="/assets/p-metal-1.jpg" alt="" /></div>
                  <div class="bd">
                    <h3>{{ $t('site.heavyIndustrialEquipment') }}</h3>
                    <div class="tg"><span class="hc-tag l">{{ $t('site.metallurgy') }}</span><span class="hc-tag l">{{ $t('site.middleEast') }}</span></div>
                    <div class="meta">
                      <div><b>{{ $t('site.capacity') }}</b><span>1,200 t/h</span></div>
                      <div><b>{{ $t('site.technology') }}</b><span>{{ $t('site.blastFurnaceEq') }}</span></div>
                      <div><b>{{ $t('site.scope') }}</b><span>EP + MC</span></div>
                    </div>
                  </div>
                </div>
                  </div>
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
                    <a>{{ $t('site.solutions') }}</a><a>{{ $t('site.industries') }}</a><a>{{ $t('site.capabilities') }}</a>
                    <a>{{ $t('site.projects') }}</a><a>{{ $t('site.aboutTzme') }}</a><a>{{ $t('site.insights') }}</a>
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
      <el-button v-for="item in menuItems" :key="item.key" text @click="goTo(item.path)">{{ item.label }}</el-button>
    </nav>
    <LanguageSwitcher mobile />
  </el-drawer></main>
</template>
