<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import SiteNav from '../components/SiteNav.vue'
import WorldReachMap from '../components/WorldReachMap.vue'
import { certificationSeed } from '../data/certifications.js'
import { loadCertifications } from '../services/certifications.js'
import { useGlobalReach } from '../services/globalReach.js'
import { globalReachText } from '../data/globalReach.js'
const page = ref(null)
useDesignPage('hc-about', page)
const { locale } = useI18n({ useScope: 'global' })
const { globalReach, loadGlobalReach } = useGlobalReach()
const globalField = (name) => globalReachText(globalReach.value[name], locale.value)
const certifications = ref(certificationSeed)
const publishedCertifications = computed(() => certifications.value.filter((item) => item.status === 'published'))
const featuredCertificate = computed(() => publishedCertifications.value.find((item) => item.image))
const certificationField = (item, name) => locale.value === 'zh'
  ? item[`${name}Zh`] || item[`${name}En`] || ''
  : item[`${name}En`] || ''
onMounted(async () => { loadGlobalReach(); certifications.value = await loadCertifications() })
</script>

<template>
  <main ref="page" class="design-site">
    <div class="hc-page">

      <SiteNav />

      <section class="hc-sec about-intro">
        <div class="hc-w about-intro-layout">
          <div class="about-intro-copy">
            <span class="hc-kick">{{ $t('site.aboutTzme') }}</span>
            <h2 class="hc-h2" style="margin-top:18px">{{ $t('site.engineering') }}<br />{{ $t('site.withoutLimits') }}
            </h2>
            <p class="hc-p" style="margin-top:20px;max-width:540px">
              {{ $t('site.tianjinHeavySteelMachineryEquipmentCoLtdDesignsFabricatesAndDeliversEngineered') }}</p>
            <p class="hc-p" style="margin-top:18px;max-width:540px">
              {{ $t('site.roughly90OfOurOutputIsExportedMainlyToMiningHousesPort') }}</p>
            <div class="hc-band about-intro-stats">
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
          <div class="about-intro-image"><el-image src="/assets/rnd-2.jpg" alt="" fit="cover" /></div>
        </div>
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

      <section class="hc-sec about-global" style="padding:0 0 96px" aria-labelledby="about-global-title">
        <div class="hc-w hc-global">
          <div>
            <span class="hc-kick">{{ globalField('kicker') }}</span>
            <h2 id="about-global-title" class="hc-h2" style="margin-top:18px;color:#fff">
              {{ globalField('titleLine1') }}<template v-if="globalField('titleLine2')"><br />{{ globalField('titleLine2') }}</template></h2>
            <p class="hc-p" style="margin-top:20px;max-width:520px">{{ globalField('description') }}</p>
            <div class="hc-map" style="margin-top:34px">
              <WorldReachMap v-if="globalReach.mapMode === 'points'" :points="globalReach.mapPoints"
                :description="globalField('imageAlt')" :locale-code="locale" />
              <el-image v-else :src="globalReach.image" :alt="globalField('imageAlt')" fit="contain" style="width:100%">
                <template #error><div class="about-global-image-error">{{ globalField('imageAlt') }}</div></template>
              </el-image>
            </div>
          </div>
          <div class="hc-gstats">
            <div v-for="(statistic, index) in globalReach.statistics" :key="index">
              <div class="hc-stat">{{ statistic.value }}<u v-if="statistic.suffix">{{ statistic.suffix }}</u></div>
              <div class="hc-stat-cap">{{ globalReachText(statistic.label, locale) }}</div>
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

  </main>
</template>

<style scoped>
.about-global .hc-global > div { min-width: 0; }
.about-global .hc-h2, .about-global .hc-p, .about-global .hc-stat, .about-global .hc-stat-cap { overflow-wrap: anywhere; }
.about-global .hc-p { white-space: pre-line; }
.about-global-image-error { display: grid; place-items: center; min-height: 150px; color: #bccddb; }
.about-intro { padding: 72px 0 56px; }
.about-intro-layout { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: 48px; align-items: center; }
.about-intro-copy { min-width: 0; }
.about-intro .hc-h2 { color: var(--txt); }
.about-intro-image { position: relative; align-self: stretch; min-width: 0; min-height: 360px; overflow: hidden; border: 1px solid var(--line-d); border-radius: 4px; }
.about-intro-image .el-image { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.about-intro-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 40px; }
.about-intro-stats > div, .about-intro-stats > div + div { min-width: 0; padding: 24px 10px 4px; }
.about-intro-stats > div:first-child { padding-left: 0; }
.about-intro-stats > div:last-child { padding-right: 0; }
.about-intro-stats .hc-stat { font-size: clamp(22px, 2vw, 30px); white-space: nowrap; }
.about-intro-stats .hc-stat u { font-size: 12px; }
.about-intro-stats .hc-stat-cap { color: #bccddb; font-size: 12px; }
@media (max-width: 960px) {
  .about-intro-layout { grid-template-columns: minmax(0, 1fr); gap: 32px; }
  .about-intro-image { min-height: 0; aspect-ratio: 16 / 9; }
}
@media (max-width: 700px) {
  .about-global .hc-gstats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .about-intro-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 12px; }
  .about-intro-stats > div:nth-child(2n) { border-right: 0; }
  .about-intro-stats > div:nth-child(2n + 1) { padding-left: 0; }
}
</style>
