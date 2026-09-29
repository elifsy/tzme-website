<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import { certificationSeed } from '../data/certifications.js'
import { loadCertifications } from '../services/certifications.js'
const page = ref(null)
const { drawerOpen, goTo, menuItems, isMenuActive, navigateLink } = useDesignPage('hc-about', page)
const { locale } = useI18n({ useScope: 'global' })
const certifications = ref(certificationSeed)
const publishedCertifications = computed(() => certifications.value.filter((item) => item.status === 'published'))
const featuredCertificate = computed(() => publishedCertifications.value.find((item) => item.image))
const certificationField = (item, name) => locale.value === 'zh'
  ? item[`${name}Zh`] || item[`${name}En`] || ''
  : item[`${name}En`] || ''
onMounted(async () => { certifications.value = await loadCertifications() })
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
            <el-button class="hc-mobile-menu" text :aria-label="$t('site.openNavigation')"
              @click="drawerOpen = true">☰</el-button>
            <LanguageSwitcher />
            <span class="hc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.8-3.8" />
              </svg></span>
            <el-button class="hc-btn solid sm" style="height:34px">{{ $t('site.contactUs') }}<i>→</i></el-button>
          </div>
        </div>
      </header>

      <section class="hc-about">
        <div class="hc-about-l">
          <div class="hc-w">
            <span class="hc-kick">{{ $t('site.aboutTzme') }}</span>
            <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.engineering') }}<br />{{ $t('site.withoutLimits') }}
            </h2>
            <p class="hc-p" style="margin-top:20px;max-width:540px">
              {{ $t('site.tianjinHeavySteelMachineryEquipmentCoLtdDesignsFabricatesAndDeliversEngineered') }}</p>
            <p class="hc-p" style="margin-top:18px;max-width:540px">
              {{ $t('site.roughly90OfOurOutputIsExportedMainlyToMiningHousesPort') }}</p>
            <div class="hc-band" style="margin-top:48px;grid-template-columns:repeat(4,1fr)">
              <div>
                <div class="hc-stat">30,000<u>t</u></div>
                <div class="hc-stat-cap">{{ $t('site.annualOutput') }}</div>
              </div>
              <div>
                <div class="hc-stat">220,000<u>m²</u></div>
                <div class="hc-stat-cap">{{ $t('site.siteArea5Bases') }}</div>
              </div>
              <div>
                <div class="hc-stat">40<u>+</u></div>
                <div class="hc-stat-cap">{{ $t('site.exportCountries') }}</div>
              </div>
              <div>
                <div class="hc-stat">2002</div>
                <div class="hc-stat-cap">{{ $t('site.foundedInTianjin') }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="hc-about-r"><img src="/assets/rnd-2.jpg" alt="" /></div>
      </section>

      <section class="hc-sec hc-light">
        <div class="hc-w">
          <div class="hc-shead">
            <div class="l">
              <span class="hc-kick">{{ $t('site.certification') }}</span>
              <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.auditedAndCertified') }}</h2>
            </div>
            <span class="hc-lnk">{{ $t('site.requestCertificates') }}<i>→</i></span>
          </div>
          <div class="hc-cert-layout" :class="{ 'hc-cert-layout-single': !featuredCertificate }">
            <div>
              <div class="hc-cert-grid">
                <div v-for="certificate in publishedCertifications" :key="certificate.id"
                  style="padding:26px 24px;background:#fff;border:1px solid var(--line-l);border-radius:6px">
                  <div style="font-family:var(--f-din);font-size:20px;font-weight:700;color:var(--blue)">
                    {{ certificationField(certificate, 'title') }}</div>
                  <div style="font-size:11.5px;color:var(--mut);margin-top:10px;line-height:1.7;white-space:pre-line">
                    {{ certificationField(certificate, 'summary') }}</div>
                  <div v-if="certificationField(certificate, 'issuer')"
                    style="font-size:10.5px;color:var(--mut);margin-top:9px">
                    {{ certificationField(certificate, 'issuer') }}</div>
                  <div v-if="certificate.certificateNo || certificate.expiresAt"
                    style="font-size:10.5px;color:var(--mut);margin-top:8px">
                    <span v-if="certificate.certificateNo">{{ certificate.certificateNo }}</span>
                    <span v-if="certificate.expiresAt"><span v-if="certificate.certificateNo"> · </span>{{ $t('site.certValidThrough') }} {{ certificate.expiresAt }}</span>
                  </div>
                </div>
              </div>
              <el-empty v-if="!publishedCertifications.length" :description="$t('site.certEmpty')" />
              <p v-if="publishedCertifications.length" class="hc-p" style="margin-top:26px;max-width:640px">
                {{ $t('site.ourQualityManagementSystemAndWeldingCertificationWereIssuedByAccreditedThird') }}</p>
            </div>
            <div v-if="featuredCertificate">
              <img :src="featuredCertificate.image" style="width:100%;border-radius:6px;
                           border:1px solid var(--line-l)" :alt="certificationField(featuredCertificate, 'title')" />
              <div style="font-size:10.5px;letter-spacing:.1em;color:var(--mut);
                           margin-top:14px;text-transform:uppercase">{{ certificationField(featuredCertificate, 'title') }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="hc-sec">
        <div class="hc-w">
          <div class="hc-shead">
            <div class="l">
              <span class="hc-kick">{{ $t('site.facilities') }}</span>
              <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.threeSitesInTianjin') }}</h2>
            </div>
            <span class="hc-lnk">{{ $t('site.bookAFactoryVisit') }}<i>→</i></span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
            <div style="padding:26px 26px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
              <div style="font-size:14px;font-weight:700;color:#fff;letter-spacing:.02em">{{
                $t('site.headquartersTanggu') }}</div>
              <div style="font-size:12.5px;color:var(--txt-2);margin-top:12px;line-height:1.8">{{
                $t('site.no139XiamenRoadBinhaiNewArea') }}<br />{{ $t('site.tangguTianjin300459China') }}</div>
            </div>
            <div style="padding:26px 26px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
              <div style="font-size:14px;font-weight:700;color:#fff;letter-spacing:.02em">{{
                $t('site.tianjinZhenhanMechanicalEquipment') }}</div>
              <div style="font-size:12.5px;color:var(--txt-2);margin-top:12px;line-height:1.8">{{
                $t('site.no9XuriStreetYingchengIndustrialPark') }}<br />{{ $t('site.hanguBinhai300840') }}</div>
            </div>
            <div style="padding:26px 26px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
              <div style="font-size:14px;font-weight:700;color:#fff;letter-spacing:.02em">{{
                $t('site.tianjinGreenlandMechanicalEquipment') }}</div>
              <div style="font-size:12.5px;color:var(--txt-2);margin-top:12px;line-height:1.8">{{
                $t('site.lingangPortArea') }}<br />{{ $t('site.tianjinFreeTradeZone') }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="hc-sec" style="padding:0 0 96px">
        <div class="hc-w hc-global">
          <div>
            <span class="hc-kick">{{ $t('site.globalReach') }}</span>
            <h2 class="hc-h2" style="margin-top:18px;color:#fff">
              {{ $t('site.engineeredInChina') }}<br />{{ $t('site.builtForTheWorld') }}</h2>
            <div class="hc-map" style="margin-top:30px">
              <img src="/assets/worldmap.png" alt="" />
            </div>
          </div>
          <div class="hc-gstats">
            <div>
              <div class="hc-stat">60<u>+</u></div>
              <div class="hc-stat-cap">{{ $t('site.countriesAndRegions') }}</div>
            </div>
            <div>
              <div class="hc-stat">100<u>+</u></div>
              <div class="hc-stat-cap">{{ $t('site.globalProjects') }}</div>
            </div>
            <div>
              <div class="hc-stat">5</div>
              <div class="hc-stat-cap">{{ $t('site.continents') }}</div>
            </div>
          </div>
        </div>
      </section>

      <footer class="hc-foot">
        <div class="hc-foot-in">
          <span class="hc-logo" style="font-size:19px"><i></i>TZME</span>
          <span class="tag">{{ $t('site.tianjinHeavySteelMachineryEquipmentCoLtd') }}</span>
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
    </el-drawer>
  </main>
</template>
