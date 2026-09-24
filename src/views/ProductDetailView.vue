<script setup>
import { ref } from 'vue'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
const page = ref(null)
const { drawerOpen, goTo, menuItems } = useDesignPage('hc-detail', page)
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

              <section class="hc-hero">
                <div class="hc-bleed"><img src="/assets/p-port-1.jpg" alt="" /></div>
                <span class="hc-scrim"></span>
                <div class="hc-hero-in" style="bottom:74px"><div class="hc-w">
                  <span class="hc-kick">{{ $t('site.portsAndTerminalsDwgTzmeHm0412') }}</span>
                  <h2 class="hc-h1" style="margin-top:20px;font-size:52px">
                    {{ $t('site.shipLoader') }}<br />2,500 t/h</h2>
                  <p class="hc-p" style="margin-top:20px;max-width:520px">
                    {{ $t('site.railMountedTravellingShipLoaderBoomLuffsAndSlewsIndependentlyToTrim') }}</p>
                  <div style="display:flex;gap:14px;margin-top:30px">
                    <el-button class="hc-btn solid">{{ $t('site.requestAQuote') }}<i>→</i></el-button>
                    <el-button class="hc-btn ghost">{{ $t('site.downloadDatasheet') }}</el-button>
                  </div>
                </div></div>
              </section>

              <section class="hc-sec">
                <div class="hc-w" style="display:grid;grid-template-columns:1fr 480px;gap:88px">
                  <div>
                    <span class="hc-kick">{{ $t('site.01Description') }}</span>
                    <h3 class="hc-h3" style="margin-top:16px;color:#fff;font-size:24px">
                      {{ $t('site.continuousLoadingOfIronOreAndCoal') }}</h3>
                    <p class="hc-p" style="margin-top:18px">
                      {{ $t('site.structureMachineryHouseAndBoomAreFabricatedInOurOwnWorkshopsTo') }}</p>
                    <span class="hc-kick" style="margin-top:44px;display:block">{{ $t('site.02TechnicalNotes') }}</span>
                    <div style="margin-top:22px">
                    <div style="display:flex;gap:20px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <span style="font-family:var(--f-din);font-size:11px;font-weight:700;color:var(--blue-2);flex:0 0 24px">01</span>
                      <span style="font-size:13px;line-height:1.7;color:var(--txt-2)">{{ $t('site.weldingToEn10902Exc4InAnIso38342Certified') }}</span>
                    </div>
                    <div style="display:flex;gap:20px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <span style="font-family:var(--f-din);font-size:11px;font-weight:700;color:var(--blue-2);flex:0 0 24px">02</span>
                      <span style="font-size:13px;line-height:1.7;color:var(--txt-2)">{{ $t('site.fatigueAssessmentToEn199319ForBoomAndSlewStructure') }}</span>
                    </div>
                    <div style="display:flex;gap:20px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <span style="font-family:var(--f-din);font-size:11px;font-weight:700;color:var(--blue-2);flex:0 0 24px">03</span>
                      <span style="font-size:13px;line-height:1.7;color:var(--txt-2)">{{ $t('site.surfacePreparationToSa25CoatingSystemC5MForMarine') }}</span>
                    </div>
                    <div style="display:flex;gap:20px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <span style="font-family:var(--f-din);font-size:11px;font-weight:700;color:var(--blue-2);flex:0 0 24px">04</span>
                      <span style="font-size:13px;line-height:1.7;color:var(--txt-2)">{{ $t('site.trialAssemblyAndFunctionalTestRecordedBeforeShipment') }}</span>
                    </div>
                    </div>
                  </div>
                  <div>
                    <span class="hc-kick">{{ $t('site.03Specification') }}</span>
                    <div style="margin-top:22px">
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">{{ $t('site.ratedCapacity') }}</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">2 500 t/h</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">{{ $t('site.outreach') }}</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">78 m</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">{{ $t('site.boomLength') }}</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">92 m</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">{{ $t('site.totalMass') }}</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">1 850 t</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">{{ $t('site.steelGrade') }}</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">S355J2 · S690QL</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">{{ $t('site.weldingStandard') }}</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">EN 1090-2 EXC4</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">{{ $t('site.coating') }}</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">C5-M · Sa 2.5</dd>
                      </div>
                    </div>
                    <div style="margin-top:34px;padding:26px 26px 24px;border-radius:6px;
                         background:var(--navy-2);border:1px solid var(--line-d)">
                      <span class="hc-kick">{{ $t('site.indicativeDelivery') }}</span>
                      <div style="font-size:38px;font-weight:700;color:#fff;margin-top:14px;
                           letter-spacing:-.01em">Q3 · 2027</div>
                      <div style="font-size:11px;color:var(--txt-3);margin-top:12px;
                           letter-spacing:.06em">{{ $t('site.1518MonthsFromPo') }}</div>
                      <div style="display:flex;gap:10px;margin-top:22px">
                        <span class="hc-tag d">EN 1090-2 EXC4</span>
                        <span class="hc-tag d">ISO 3834-2</span>
                        <span class="hc-tag d">CWB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="hc-sec hc-light" style="padding:72px 0">
                <div class="hc-w">
                  <span class="hc-kick">{{ $t('site.04ManufacturingRoute') }}</span>
                  <div class="hc-steps" style="margin-top:40px">
                    <div><span class="ic"><i></i></span><div class="no">01</div>
                      <div class="lb">{{ $t('site.concept') }}</div></div>
                    <div><span class="ic"><i></i></span><div class="no">02</div>
                      <div class="lb">{{ $t('site.engineering') }}</div></div>
                    <div><span class="ic"><i></i></span><div class="no">03</div>
                      <div class="lb">{{ $t('site.design') }}</div></div>
                    <div><span class="ic"><i></i></span><div class="no">04</div>
                      <div class="lb">{{ $t('site.fabrication') }}</div></div>
                    <div><span class="ic"><i></i></span><div class="no">05</div>
                      <div class="lb">{{ $t('site.assembly') }}</div></div>
                    <div><span class="ic"><i></i></span><div class="no">06</div>
                      <div class="lb">{{ $t('site.delivery') }}</div></div>
                  </div>
                </div>
              </section>

              <section class="hc-sec">
                <div class="hc-w">
                  <div class="hc-shead">
                    <div class="l">
                      <span class="hc-kick">{{ $t('site.05RelatedEquipment') }}</span>
                      <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.sameCategory') }}</h2>
                    </div>
                    <span class="hc-lnk">{{ $t('site.allPortEquipment') }}<i>→</i></span>
                  </div>
                  <div class="hc-cards" style="grid-template-columns:repeat(3,1fr)">
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-port-2.png" alt="" /></div>
                    <div class="bd">
                      <h3>{{ $t('site.shipUnloader') }}</h3>
                      <p>{{ $t('site.capacity1800THGrabType') }}</p>
                      <span class="go">{{ $t('site.view') }}<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-convey-1.jpg" alt="" /></div>
                    <div class="bd">
                      <h3>{{ $t('site.beltConveyor') }}</h3>
                      <p>{{ $t('site.capacity1200THLongDistance') }}</p>
                      <span class="go">{{ $t('site.view') }}<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-mining-2.jpg" alt="" /></div>
                    <div class="bd">
                      <h3>{{ $t('site.stackerReclaimer2') }}</h3>
                      <p>{{ $t('site.capacity6000THRailMounted') }}</p>
                      <span class="go">{{ $t('site.view') }}<i>→</i></span>
                    </div>
                  </a>
                  </div>
                </div>
              </section>

              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>TZME</span>
                  <span class="tag">TZME-HM-0412 · Rev 1.0</span>
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
