<script setup>
import { ref } from 'vue'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
const page = ref(null)
const { drawerOpen, goTo, menuItems } = useDesignPage('hc-products', page)
</script>

<template>
<main ref="page" class="design-site">
<div class="hc-page">

              <header class="hc-nav">
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
                    <el-button class="hc-btn solid sm" style="height:34px">{{ $t('site.contactUs') }}<i>→</i></el-button>
                  </div>
                </div>
              </header>

              <section class="hc-sec" style="padding:72px 0 60px">
                <div class="hc-w" style="display:grid;grid-template-columns:1fr 380px;gap:80px;
                     align-items:flex-end">
                  <div>
                    <span class="hc-kick">{{ $t('site.solutions31ProductsIn8Categories') }}</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff;font-size:52px">
                      {{ $t('site.whatWeEngineer') }}</h2>
                  </div>
                  <p class="hc-p">
                    {{ $t('site.everyUnitIsEngineeredToOrderCapacityGeometryAndDriveConfigurationAre') }}</p>
                </div>
              </section>

              <section style="border-top:1px solid var(--line-d2)">
                <div class="hc-w" style="padding:56px 0 96px">
                  <div class="hc-cards" style="grid-template-columns:repeat(4,1fr)">
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-mining-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">01</span>
                      <h3>{{ $t('site.miningMachinery') }}</h3>
                      <p>{{ $t('site.excavatorsCrushersSpreaders') }}</p>
                      <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-mining-2.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">02</span>
                      <h3>{{ $t('site.materialHandling') }}</h3>
                      <p>{{ $t('site.stackersAndReclaimers') }}</p>
                      <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-convey-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">03</span>
                      <h3>{{ $t('site.conveying') }}</h3>
                      <p>{{ $t('site.beltTubularAndPipeConveyors') }}</p>
                      <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-port-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">04</span>
                      <h3>{{ $t('site.portsAndTerminals') }}</h3>
                      <p>{{ $t('site.shipLoadersAndUnloaders') }}</p>
                      <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-bridge-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">05</span>
                      <h3>{{ $t('site.bridgeBuilding') }}</h3>
                      <p>{{ $t('site.launchingGirdersMssTravellers') }}</p>
                      <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-metal-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">06</span>
                      <h3>{{ $t('site.metallurgy') }}</h3>
                      <p>{{ $t('site.ladleTurretsFurnaceStructures') }}</p>
                      <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-env-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">07</span>
                      <h3>{{ $t('site.environment') }}</h3>
                      <p>{{ $t('site.wasteHandlingFlueGasDucting') }}</p>
                      <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-tour-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">08</span>
                      <h3>{{ $t('site.tourismFacilities') }}</h3>
                      <p>{{ $t('site.ferrisWheelsRopeways') }}</p>
                      <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                    </div>
                  </a>
                  </div>
                </div>
              </section>

              <section class="hc-sec hc-white">
                <div class="hc-w">
                  <div class="hc-shead">
                    <div class="l">
                      <span class="hc-kick">{{ $t('site.selectedEquipment') }}</span>
                      <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.typicalConfigurations') }}</h2>
                    </div>
                    <span class="hc-lnk">{{ $t('site.fullProductList') }}<i>→</i></span>
                  </div>
                  <div class="hc-proj">
                  <div class="c">
                    <div class="im"><img src="/assets/p-mining-2.jpg" alt="" /></div>
                    <div class="bd">
                      <h3>{{ $t('site.stackerReclaimer2') }}</h3>
                      <div class="tg"><span class="hc-tag l">{{ $t('site.mining') }}</span><span class="hc-tag l">{{ $t('site.australia') }}</span></div>
                      <div class="meta">
                        <div><b>{{ $t('site.capacity') }}</b><span>6,000 t/h</span></div>
                        <div><b>{{ $t('site.technology') }}</b><span>{{ $t('site.railMounted') }}</span></div>
                        <div><b>{{ $t('site.scope') }}</b><span>EP + MC</span></div>
                      </div>
                    </div>
                  </div>
                  <div class="c">
                    <div class="im"><img src="/assets/p-convey-2.jpg" alt="" /></div>
                    <div class="bd">
                      <h3>{{ $t('site.pipeConveyorSystem') }}</h3>
                      <div class="tg"><span class="hc-tag l">{{ $t('site.conveying') }}</span><span class="hc-tag l">{{ $t('site.chile') }}</span></div>
                      <div class="meta">
                        <div><b>{{ $t('site.capacity') }}</b><span>600 t/h</span></div>
                        <div><b>{{ $t('site.technology') }}</b><span>{{ $t('site.tubularBelt') }}</span></div>
                        <div><b>{{ $t('site.scope') }}</b><span>EP + MC</span></div>
                      </div>
                    </div>
                  </div>
                  <div class="c">
                    <div class="im"><img src="/assets/p-port-2.png" alt="" /></div>
                    <div class="bd">
                      <h3>{{ $t('site.travellingShipUnloader') }}</h3>
                      <div class="tg"><span class="hc-tag l">{{ $t('site.port') }}</span><span class="hc-tag l">{{ $t('site.india') }}</span></div>
                      <div class="meta">
                        <div><b>{{ $t('site.capacity') }}</b><span>1,800 t/h</span></div>
                        <div><b>{{ $t('site.technology') }}</b><span>{{ $t('site.grabType') }}</span></div>
                        <div><b>{{ $t('site.scope') }}</b><span>EP + MC</span></div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </section>

              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>TZME</span>
                  <span class="tag">{{ $t('site.solutions8Categories31Products') }}</span>
                  <LanguageSwitcher style="margin-left:auto;color:var(--txt-2)" />
                  <span class="hc-soc"><span>in</span><span>▶</span><span>✕</span></span>
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
