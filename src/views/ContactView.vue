<script setup>
import { ref } from 'vue'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
const page = ref(null)
const { drawerOpen, goTo, menuItems } = useDesignPage('hc-contact', page)
</script>

<template>
<main ref="page" class="design-site">
<div class="hc-page">

              <header class="hc-nav">
                <div class="hc-nav-in">
                  <span class="hc-logo"><i></i>TZME</span>
                  <nav class="hc-menu"><a>{{ $t('site.solutions') }}</a><a>{{ $t('site.industries') }}</a><a>{{ $t('site.capabilities') }}</a><a>{{ $t('site.projects') }}</a><a>{{ $t('site.aboutTzme') }}</a><a class="on">{{ $t('site.contact') }}</a></nav>
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
                    <span class="hc-kick">{{ $t('site.getInTouchReplyWithin2WorkingDays') }}</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff;font-size:52px">
                      {{ $t('site.contactUs') }}</h2>
                  </div>
                  <p class="hc-p" style="max-width:400px">
                    {{ $t('site.sendADutyStatementADrawingSetOrJustACapacityRequirement') }}</p>
                </div>
              </section>

              <section style="border-top:1px solid var(--line-d2)">
                <div class="hc-w" style="padding:64px 0 96px;display:grid;
                     grid-template-columns:1fr 600px;gap:88px;align-items:start">
                  <div>
                    <span class="hc-kick">{{ $t('site.01DirectContact') }}</span>
                    <div style="margin-top:26px">
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">{{ $t('site.address') }}</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">{{ $t('site.no139XiamenRoadBinhaiNewArea') }}<br />{{ $t('site.tangguTianjin300459China') }}</dd>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">{{ $t('site.telephone') }}</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">+86 22 2521 4991 / 2521 1565</dd>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">{{ $t('site.fax') }}</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">+86 22 2521 1535</dd>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">{{ $t('site.email2') }}</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">tzme@tzme.net · jyb@tzme.net</dd>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">{{ $t('site.website') }}</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">www.tzme.net</dd>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">{{ $t('site.port') }}</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">{{ $t('site.10KmFromTianjinPort') }}</dd>
                    </div>
                    </div>
                    <span class="hc-kick" style="margin-top:46px;display:block">{{ $t('site.02Subsidiaries') }}</span>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px">
                    <div style="padding:24px 24px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
                      <div style="font-size:13.5px;font-weight:700;color:#fff">{{ $t('site.tianjinZhenhanMechanicalEquipment') }}</div>
                      <div style="font-size:12px;color:var(--txt-2);margin-top:10px;line-height:1.8">{{ $t('site.no9XuriStreetYingchengIndustrialParkHanguBinhai300840') }}</div>
                    </div>
                    <div style="padding:24px 24px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
                      <div style="font-size:13.5px;font-weight:700;color:#fff">{{ $t('site.tianjinGreenlandMechanicalEquipment') }}</div>
                      <div style="font-size:12px;color:var(--txt-2);margin-top:10px;line-height:1.8">{{ $t('site.lingangPortAreaTianjinFreeTradeZone') }}</div>
                    </div>
                    <div style="padding:24px 24px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
                      <div style="font-size:13.5px;font-weight:700;color:#fff">{{ $t('site.manufacturingEnquiries') }}</div>
                      <div style="font-size:12px;color:var(--txt-2);margin-top:10px;line-height:1.8">{{ $t('site.engineeringReviewWithinTwoWorkingDays') }}</div>
                    </div>
                    </div>
                  </div>
                  <div class="hc-form">
                    <span class="hc-kick">{{ $t('site.03EnquiryForm') }}</span>
                    <div style="margin-top:24px">
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             stroke-width="1.6" stroke-linecap="round"><path d="M12 16V6m0 0L8.5 9.5M12 6l3.5 3.5M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/></svg>
                        <div>
                          <div style="font-size:12px;color:var(--txt)">{{ $t('site.dragAndDropOrClickToUpload') }}</div>
                          <div style="font-size:10.5px;color:var(--txt-3);margin-top:4px">
                            {{ $t('site.max20MbPdfDwgXlsJpgPng') }}</div>
                        </div>
                      </div>
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:20px">
                        <span style="font-size:10.5px;color:var(--txt-3)">
                          {{ $t('site.bySendingYouAgreeToOurPrivacyPolicy') }}</span>
                        <el-button class="hc-btn solid">{{ $t('site.sendInquiry') }}<i>→</i></el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>TZME</span>
                  <span class="tag">+86 22 2521 4991 · tzme@tzme.net</span>
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
