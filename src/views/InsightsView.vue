<script setup>
import { ref } from 'vue'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
const page = ref(null)
const { drawerOpen, goTo, menuItems, isMenuActive, navigateLink } = useDesignPage('hc-news', page)
</script>

<template>
<main ref="page" class="design-site">
<div class="hc-page">

              <header class="hc-nav">
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
                    <el-button class="hc-btn solid sm" style="height:34px">{{ $t('site.contactUs') }}<i>→</i></el-button>
                  </div>
                </div>
              </header>

              <section class="hc-sec" style="padding:72px 0 56px">
                <div class="hc-w" style="display:flex;justify-content:space-between;
                     align-items:flex-end;gap:60px">
                  <div>
                    <span class="hc-kick">{{ $t('site.insights48Notices') }}</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff;font-size:52px">
                      {{ $t('site.newsAndInsights') }}</h2>
                  </div>
                  <span class="hc-lnk">{{ $t('site.subscribeToUpdates') }}<i>→</i></span>
                </div>
              </section>

              <section style="border-top:1px solid var(--line-d2)">
                <div class="hc-w" style="padding:56px 0 0">
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;
                       background:var(--navy-2);border:1px solid var(--line-d);
                       border-radius:6px;overflow:hidden">
                    <div style="position:relative;min-height:330px">
                      <img src="/assets/rnd-1.jpg" style="position:absolute;inset:0;width:100%;
                           height:100%;object-fit:cover" alt="" />
                    </div>
                    <div style="padding:38px 38px 34px">
                      <div style="display:flex;gap:18px;align-items:center">
                        <span class="hc-tag d">{{ $t('site.company2') }}</span>
                        <span style="font-family:var(--f-din);font-size:11.5px;
                              color:var(--txt-3)">2026.03.14</span>
                      </div>
                      <h3 class="hc-h3" style="margin-top:20px;color:#fff;font-size:24px;
                          line-height:1.25">
                        {{ $t('site.frameworkAgreementSignedOnRotorSailStructures') }}</h3>
                      <p class="hc-p" style="margin-top:16px">
                        {{ $t('site.rotorSailsForWindAssistedShipPropulsionRequireTallSlenderWeldedStructures') }}</p>
                      <div style="margin-top:26px"><span class="hc-lnk">{{ $t('site.readNotice') }}<i>→</i></span></div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="hc-sec" style="padding:56px 0 96px">
                <div class="hc-w">
                  <div style="display:flex;justify-content:space-between;align-items:baseline;
                       margin-bottom:22px">
                    <span class="hc-kick">{{ $t('site.allNotices') }}</span>
                    <span style="font-size:10.5px;color:var(--txt-3)">{{ $t('site.showing6Of48NewestFirst') }}</span>
                  </div>
                  <div style="border-top:1px solid var(--line-d)">
                  <a style="display:grid;grid-template-columns:150px 1fr 190px 30px;gap:34px;
                       align-items:center;padding:26px 0;border-bottom:1px solid var(--line-d2);
                       transition:.2s">
                    <span style="font-family:var(--f-din);font-size:11.5px;color:var(--txt-3);
                          letter-spacing:.06em">2026.03.14</span>
                    <span style="font-size:15px;font-weight:600;color:var(--txt);line-height:1.4">{{ $t('site.frameworkAgreementSignedOnRotorSailStructures') }}</span>
                    <span style="font-size:10px;font-weight:600;letter-spacing:.14em;
                          text-transform:uppercase;color:var(--blue-2);text-align:right">{{ $t('site.company2') }}</span>
                    <span style="font-size:15px;color:var(--txt-3);text-align:right">→</span>
                  </a>
                  <a style="display:grid;grid-template-columns:150px 1fr 190px 30px;gap:34px;
                       align-items:center;padding:26px 0;border-bottom:1px solid var(--line-d2);
                       transition:.2s">
                    <span style="font-family:var(--f-din);font-size:11.5px;color:var(--txt-3);
                          letter-spacing:.06em">2026.02.06</span>
                    <span style="font-size:15px;font-weight:600;color:var(--txt);line-height:1.4">{{ $t('site.1800TConveyorSteelStructureCompletedForWestAngelasAustralia') }}</span>
                    <span style="font-size:10px;font-weight:600;letter-spacing:.14em;
                          text-transform:uppercase;color:var(--blue-2);text-align:right">{{ $t('site.project') }}</span>
                    <span style="font-size:15px;color:var(--txt-3);text-align:right">→</span>
                  </a>
                  <a style="display:grid;grid-template-columns:150px 1fr 190px 30px;gap:34px;
                       align-items:center;padding:26px 0;border-bottom:1px solid var(--line-d2);
                       transition:.2s">
                    <span style="font-family:var(--f-din);font-size:11.5px;color:var(--txt-3);
                          letter-spacing:.06em">2026.01.22</span>
                    <span style="font-size:15px;font-weight:600;color:var(--txt);line-height:1.4">{{ $t('site.roboticWeldingLaboratoryPutIntoOperationInTianjin') }}</span>
                    <span style="font-size:10px;font-weight:600;letter-spacing:.14em;
                          text-transform:uppercase;color:var(--blue-2);text-align:right">{{ $t('site.technology') }}</span>
                    <span style="font-size:15px;color:var(--txt-3);text-align:right">→</span>
                  </a>
                  <a style="display:grid;grid-template-columns:150px 1fr 190px 30px;gap:34px;
                       align-items:center;padding:26px 0;border-bottom:1px solid var(--line-d2);
                       transition:.2s">
                    <span style="font-family:var(--f-din);font-size:11.5px;color:var(--txt-3);
                          letter-spacing:.06em">2025.11.18</span>
                    <span style="font-size:15px;font-weight:600;color:var(--txt);line-height:1.4">{{ $t('site.tzmeExhibitsAtBaumaChina2026StandE6410') }}</span>
                    <span style="font-size:10px;font-weight:600;letter-spacing:.14em;
                          text-transform:uppercase;color:var(--blue-2);text-align:right">{{ $t('site.exhibition') }}</span>
                    <span style="font-size:15px;color:var(--txt-3);text-align:right">→</span>
                  </a>
                  <a style="display:grid;grid-template-columns:150px 1fr 190px 30px;gap:34px;
                       align-items:center;padding:26px 0;border-bottom:1px solid var(--line-d2);
                       transition:.2s">
                    <span style="font-family:var(--f-din);font-size:11.5px;color:var(--txt-3);
                          letter-spacing:.06em">2025.10.09</span>
                    <span style="font-size:15px;font-weight:600;color:var(--txt);line-height:1.4">{{ $t('site.cwbCertificationExtendedToCoverBridgeLaunchingGirders') }}</span>
                    <span style="font-size:10px;font-weight:600;letter-spacing:.14em;
                          text-transform:uppercase;color:var(--blue-2);text-align:right">{{ $t('site.company2') }}</span>
                    <span style="font-size:15px;color:var(--txt-3);text-align:right">→</span>
                  </a>
                  <a style="display:grid;grid-template-columns:150px 1fr 190px 30px;gap:34px;
                       align-items:center;padding:26px 0;border-bottom:1px solid var(--line-d2);
                       transition:.2s">
                    <span style="font-family:var(--f-din);font-size:11.5px;color:var(--txt-3);
                          letter-spacing:.06em">2025.08.25</span>
                    <span style="font-size:15px;font-weight:600;color:var(--txt);line-height:1.4">{{ $t('site.twoGrabTypeShipUnloadersHandedOverInSouthAmerica') }}</span>
                    <span style="font-size:10px;font-weight:600;letter-spacing:.14em;
                          text-transform:uppercase;color:var(--blue-2);text-align:right">{{ $t('site.project') }}</span>
                    <span style="font-size:15px;color:var(--txt-3);text-align:right">→</span>
                  </a>
                  </div>
                  <div style="display:flex;gap:8px;margin-top:32px">
                    <span style="width:36px;height:36px;border-radius:3px;background:#fff;
                          color:var(--ink);display:flex;align-items:center;justify-content:center;
                          font-size:11.5px;font-weight:700">1</span>
                    <span style="width:36px;height:36px;border-radius:3px;
                          border:1px solid var(--line-d);color:var(--txt-2);display:flex;
                          align-items:center;justify-content:center;font-size:11.5px">2</span>
                    <span style="width:36px;height:36px;border-radius:3px;
                          border:1px solid var(--line-d);color:var(--txt-2);display:flex;
                          align-items:center;justify-content:center;font-size:11.5px">3</span>
                  </div>
                </div>
              </section>

              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>TZME</span>
                  <span class="tag">{{ $t('site.newsroom') }}</span>
                  <LanguageSwitcher style="margin-left:auto;color:var(--txt-2)" />
                  <span class="hc-soc"><span>in</span><span>▶</span><span>✕</span></span>
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
