<script setup>
import { useSiteContent } from '../services/website.js'
const { siteAsset, siteValue } = useSiteContent()
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Picture, ZoomIn } from '@element-plus/icons-vue'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import SocialLinks from '../components/SocialLinks.vue'
import SiteNav from '../components/SiteNav.vue'
import WorldReachMap from '../components/WorldReachMap.vue'
import SubsidiaryCards from '../components/SubsidiaryCards.vue'
import { useContactSettings } from '../services/contactSettings.js'
import { useCertificationCatalog } from '../services/certifications.js'
import { useGlobalReach } from '../services/globalReach.js'
import { globalReachText } from '../data/globalReach.js'
import { trackEvent } from '../services/analytics.js'
const page = ref(null)
useDesignPage('hc-about', page)
const { locale } = useI18n({ useScope: 'global' })
const { contactSettings } = useContactSettings()
const { globalReach, loadGlobalReach } = useGlobalReach()
const globalField = (name) => globalReachText(globalReach.value?.[name], locale.value)
const { certifications, loadCertifications } = useCertificationCatalog()
const hasCertificateImage = (item) => typeof item.image === 'string' && Boolean(item.image.trim())
const publishedCertifications = computed(() => certifications.value.filter((item) => item.status === 'published' && hasCertificateImage(item)))
const certificateMedia = window.matchMedia('(max-width: 1100px)')
const compactCertificates = ref(certificateMedia.matches)
const certificatePage = ref(1)
const certificatePageSize = computed(() => compactCertificates.value ? 2 : 4)
const certificatePageStart = computed(() => (certificatePage.value - 1) * certificatePageSize.value)
const certificatePageEnd = computed(() => Math.min(certificatePageStart.value + certificatePageSize.value, publishedCertifications.value.length))
const visibleCertificates = computed(() => publishedCertifications.value.slice(certificatePageStart.value, certificatePageEnd.value))
const updateCertificateLayout = (event) => { compactCertificates.value = event.matches }
onMounted(() => certificateMedia.addEventListener('change', updateCertificateLayout))
onUnmounted(() => certificateMedia.removeEventListener('change', updateCertificateLayout))
watch([() => publishedCertifications.value.length, certificatePageSize], () => {
  const maxPage = Math.max(1, Math.ceil(publishedCertifications.value.length / certificatePageSize.value))
  certificatePage.value = Math.min(certificatePage.value, maxPage)
})
async function changeCertificatePage(value) {
  certificatePage.value = value
  trackEvent('pagination', `certifications:${value}`)
  await nextTick()
  document.getElementById('certificates-title')?.focus({ preventScroll: true })
}
const certificateDetailsId = ref('')
const certificateDetailsImage = ref(null)
const certificateDetails = computed(() => publishedCertifications.value.find((item) => item.id === certificateDetailsId.value))
const certificateDetailsOpen = computed({
  get: () => Boolean(certificateDetails.value),
  set: (value) => { if (!value) certificateDetailsId.value = '' },
})
const certificatePreviewSources = computed(() => publishedCertifications.value.map((item) => item.image))
const certificateImageRefs = new Map()
function setCertificateImageRef(id, instance) {
  if (instance) certificateImageRefs.set(id, instance)
  else certificateImageRefs.delete(id)
}
function previewCertificate(id) { certificateImageRefs.get(id)?.showPreview() }
const certificationField = (item, name) => locale.value === 'zh'
  ? item[`${name}Zh`] || item[`${name}En`] || ''
  : item[`${name}En`] || ''
onMounted(() => { loadGlobalReach(); loadCertifications() })
</script>

<template>
  <main ref="page" class="design-site">
    <div class="hc-page">

      <SiteNav />

      <section class="hc-sec about-intro catalog-intro catalog-intro-about" aria-labelledby="about-page-title">
        <el-image v-if="siteAsset('/assets/hero-03.jpg')" class="catalog-intro-image"
          :src="siteAsset('/assets/hero-03.jpg')" fit="cover" alt="" aria-hidden="true">
          <template #error><div class="catalog-intro-image-fallback"></div></template>
        </el-image>
        <div class="hc-w catalog-intro-foreground">
          <div class="about-intro-copy">
            <span class="hc-kick">{{ $t('site.aboutTzme') }}</span>
            <h1 id="about-page-title" class="hc-h2">{{ $t('site.engineering') }}<br />{{ $t('site.withoutLimits') }}
            </h1>
            <p class="hc-p catalog-intro-description" style="margin-top:20px;max-width:540px">
              {{ $t('site.tianjinHeavySteelMachineryEquipmentCoLtdDesignsFabricatesAndDeliversEngineered') }}</p>
            <p class="hc-p catalog-intro-description" style="margin-top:18px;max-width:540px">
              {{ $t('site.roughly90OfOurOutputIsExportedMainlyToMiningHousesPort') }}</p>
            <div class="hc-band about-intro-stats">
              <div>
                <div class="hc-stat">{{ siteValue('text_6f7af8cfeebd') }}<u>{{ siteValue('text_8efd86fb78a5') }}</u></div>
                <div class="hc-stat-cap">{{ $t('site.annualOutput') }}</div>
              </div>
              <div>
                <div class="hc-stat">{{ siteValue('text_3957f15e6313') }}<u>{{ siteValue('text_6f6f0f6a0fb3') }}</u></div>
                <div class="hc-stat-cap">{{ $t('site.siteArea5Bases') }}</div>
              </div>
              <div>
                <div class="hc-stat">{{ siteValue('text_af3e133428b9') }}<u>+</u></div>
                <div class="hc-stat-cap">{{ $t('site.exportCountries') }}</div>
              </div>
              <div>
                <div class="hc-stat">{{ siteValue('text_2e8c0277e396') }}</div>
                <div class="hc-stat-cap">{{ $t('site.foundedInTianjin') }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="hc-sec hc-light certifications-section" aria-labelledby="certificates-title">
        <div class="hc-w">
          <div class="hc-shead">
            <div class="l">
              <span class="hc-kick">{{ $t('site.certification') }}</span>
              <h2 id="certificates-title" class="hc-h2" tabindex="-1" style="margin-top:18px">{{ $t('site.auditedAndCertified') }}</h2>
              <p class="hc-p certificate-introduction">{{ $t('site.ourQualityManagementSystemAndWeldingCertificationWereIssuedByAccreditedThird') }}</p>
            </div>
            <span class="hc-lnk">{{ $t('site.requestCertificates') }}<i>→</i></span>
          </div>
          <div v-if="publishedCertifications.length" class="certificate-collection">
            <div class="certificate-collection-heading">
              <span>{{ $t('certificationUi.count', { count: publishedCertifications.length }) }}</span>
              <p><el-icon aria-hidden="true"><ZoomIn /></el-icon>{{ $t('certificationUi.previewHint') }}</p>
            </div>
            <div class="certificate-gallery" :class="{ 'certificate-gallery-paged': publishedCertifications.length > certificatePageSize }">
              <article v-for="certificate in visibleCertificates" :key="certificate.id" class="certificate-card">
                <div class="certificate-preview">
                  <el-image :ref="(instance) => setCertificateImageRef(certificate.id, instance)"
                    class="certificate-preview-image" :src="certificate.image" fit="contain"
                    :alt="certificationField(certificate, 'title')" :preview-src-list="certificatePreviewSources"
                    :initial-index="publishedCertifications.findIndex((item) => item.id === certificate.id)"
                    preview-teleported hide-on-click-modal>
                    <template #error><div class="certificate-image-error"><el-icon aria-hidden="true"><Picture /></el-icon><span>{{ $t('certificationUi.imageUnavailable') }}</span></div></template>
                    <template #viewer-error><div class="certificate-viewer-error">{{ $t('certificationUi.imageUnavailable') }}</div></template>
                  </el-image>
                  <el-button class="certificate-preview-button" :icon="ZoomIn"
                    :aria-label="$t('certificationUi.previewCertificate', { title: certificationField(certificate, 'title') })"
                    @click.stop="previewCertificate(certificate.id)">{{ $t('certificationUi.viewImage') }}</el-button>
                </div>
                <div class="certificate-card-body">
                  <h3>{{ certificationField(certificate, 'title') }}</h3>
                  <p v-if="certificationField(certificate, 'summary')" class="certificate-summary">{{ certificationField(certificate, 'summary') }}</p>
                  <p v-else-if="certificationField(certificate, 'issuer')" class="certificate-summary">{{ certificationField(certificate, 'issuer') }}</p>
                  <div class="certificate-card-footer">
                    <p v-if="certificate.expiresAt || certificate.certificateNo" class="certificate-meta">
                      <span v-if="certificate.expiresAt">{{ $t('site.certValidThrough') }} {{ certificate.expiresAt }}</span>
                      <span v-else>{{ certificate.certificateNo }}</span>
                    </p>
                    <el-button class="certificate-details-button" text
                      :aria-label="$t('certificationUi.detailsLabel', { title: certificationField(certificate, 'title') })"
                      @click.stop="certificateDetailsId = certificate.id">{{ $t('certificationUi.viewDetails') }}<span aria-hidden="true">→</span></el-button>
                  </div>
                </div>
              </article>
            </div>
            <div class="certificate-pagination-row">
              <p role="status" aria-live="polite" aria-atomic="true">{{ $t('certificationUi.pageRange', { start: certificatePageStart + 1, end: certificatePageEnd, total: publishedCertifications.length }) }}</p>
              <el-pagination v-if="publishedCertifications.length > certificatePageSize" class="certificate-pagination" background
                :current-page="certificatePage" :page-size="certificatePageSize" :total="publishedCertifications.length"
                :pager-count="5" layout="prev, pager, next"
                :aria-label="$t('certificationUi.paginationLabel')"
                @current-change="changeCertificatePage" />
            </div>
          </div>
          <el-empty v-else :description="$t('certificationUi.emptyGallery')" />
        </div>
      </section>

      <section class="hc-sec">
        <div class="hc-w">
          <div class="hc-shead">
            <div class="l">
              <span class="hc-kick">{{ $t('site.facilities') }}</span>
              <h2 class="hc-h2" style="margin-top:18px">{{ $t('contactUi.facilitiesTitle') }}</h2>
            </div>
            <span class="hc-lnk">{{ $t('site.bookAFactoryVisit') }}<i>→</i></span>
          </div>
          <SubsidiaryCards v-if="contactSettings" include-headquarters about-only />
        </div>
      </section>

      <section v-if="globalReach" class="hc-sec about-global" style="padding:0 0 96px" aria-labelledby="about-global-title">
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
          <span class="hc-logo" style="font-size:19px"><i></i>{{ siteValue('text_8920f3d022b5') }}</span>
          <span class="tag">{{ $t('site.tianjinHeavySteelMachineryEquipmentCoLtd') }}</span>
          <LanguageSwitcher style="margin-left:auto;color:var(--txt-2)" />
          <SocialLinks />
        </div>
      </footer>

    </div>

    <el-dialog v-model="certificateDetailsOpen" class="certificate-details-dialog" append-to-body
      :title="$t('certificationUi.detailsTitle')" width="min(680px, calc(100vw - 32px))">
      <div v-if="certificateDetails" class="certificate-details-content">
        <h3>{{ certificationField(certificateDetails, 'title') }}</h3>
        <p v-if="certificationField(certificateDetails, 'summary')" class="certificate-details-summary">{{ certificationField(certificateDetails, 'summary') }}</p>
        <dl class="certificate-details-meta">
          <div v-if="certificationField(certificateDetails, 'issuer')"><dt>{{ $t('certificationUi.issuer') }}</dt><dd>{{ certificationField(certificateDetails, 'issuer') }}</dd></div>
          <div v-if="certificateDetails.certificateNo"><dt>{{ $t('certificationUi.number') }}</dt><dd>{{ certificateDetails.certificateNo }}</dd></div>
          <div v-if="certificateDetails.issuedAt"><dt>{{ $t('certificationUi.issuedAt') }}</dt><dd>{{ certificateDetails.issuedAt }}</dd></div>
          <div v-if="certificateDetails.expiresAt"><dt>{{ $t('site.certValidThrough') }}</dt><dd>{{ certificateDetails.expiresAt }}</dd></div>
        </dl>
        <el-image v-if="hasCertificateImage(certificateDetails)" ref="certificateDetailsImage" class="certificate-details-image"
          :src="certificateDetails.image" :alt="certificationField(certificateDetails, 'title')" fit="contain"
          :preview-src-list="certificatePreviewSources"
          :initial-index="publishedCertifications.findIndex((item) => item.id === certificateDetails.id)"
          preview-teleported hide-on-click-modal>
          <template #error><div class="certificate-image-error">{{ $t('certificationUi.imageUnavailable') }}</div></template>
          <template #viewer-error><div class="certificate-viewer-error">{{ $t('certificationUi.imageUnavailable') }}</div></template>
        </el-image>
        <el-button v-if="hasCertificateImage(certificateDetails)" class="certificate-details-image-button" text :icon="ZoomIn"
          :aria-label="$t('certificationUi.previewCertificate', { title: certificationField(certificateDetails, 'title') })"
          @click.stop="certificateDetailsImage?.showPreview()">{{ $t('certificationUi.viewImage') }}</el-button>
      </div>
    </el-dialog>

  </main>
</template>

<style scoped>
.certifications-section { padding: 64px 0; }
.certifications-section .hc-shead { margin-bottom: 28px; }
.certifications-section .certificate-introduction { max-width: 700px; margin-top: 16px; color: #435b70; font-size: 14px; line-height: 1.8; }
#certificates-title:focus-visible { outline: 2px solid #075cac; outline-offset: 5px; }
.certificate-collection-heading { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px 20px; margin-bottom: 16px; padding-top: 16px; border-top: 1px solid #cbd8e2; }
.certificate-collection-heading > span { color: #15354d; font-size: 13px; font-weight: 600; }
.certificate-collection-heading > p { display: flex; align-items: center; gap: 6px; color: #435b70; font-size: 12px; line-height: 1.6; }
.certificate-collection-heading .el-icon { color: #075cac; font-size: 16px; }
.certificate-gallery { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; min-height: 320px; align-content: start; }
.certificate-card { display: flex; flex-direction: column; height: 320px; min-width: 0; overflow: hidden; border: 1px solid #c9d7e2; border-radius: 6px; background: #fff; box-shadow: 0 3px 14px rgb(15 44 66 / 4%); box-sizing: border-box; transition: border-color .18s ease, box-shadow .18s ease; }
.certificate-card:hover, .certificate-card:focus-within { border-color: #7b9fbd; box-shadow: 0 6px 20px rgb(15 44 66 / 9%); }
.certificate-preview { position: relative; flex-shrink: 0; height: 164px; overflow: hidden; border-bottom: 1px solid #d9e3eb; background: #e9eef3; }
.certificate-preview-image.el-image { display: block; width: 100%; height: 100%; cursor: zoom-in; }
.certificate-preview-image :deep(.el-image__inner) { padding: 14px 18px; box-sizing: border-box; }
.certificate-preview-button.el-button { position: absolute; right: 10px; bottom: 10px; height: 36px; margin: 0; padding: 0 10px; border: 1px solid #bacddb; border-radius: 4px; background: #fff; color: #075cac; font-size: 12px; box-shadow: 0 2px 6px rgb(15 44 66 / 8%); }
.certificate-preview-button.el-button:hover { color: #fff; border-color: #075cac; background: #075cac; }
.certificate-preview-button.el-button:focus-visible { outline: 3px solid #075cac; outline-offset: 2px; }
.certificate-card-body { display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; padding: 14px 16px 8px; }
.certificate-card h3 { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; min-width: 0; color: #15354d; font-family: var(--f-ui); font-size: 17px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
.certificate-card-body p { color: #435b70; font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }
.certificate-card-body .certificate-summary { overflow: hidden; margin-top: 6px; white-space: nowrap; text-overflow: ellipsis; }
.certificate-card-footer { display: flex; align-items: center; justify-content: flex-end; flex-shrink: 0; gap: 8px; margin-top: auto; padding-top: 4px; border-top: 1px solid #e0e8ef; }
.certificate-card-body .certificate-meta { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; flex: 1; min-width: 0; margin: 0; font-size: 12px; line-height: 1.45; }
.certificate-details-button.el-button { flex-shrink: 0; height: 40px; margin: 0; padding: 0 4px; color: #075cac; font-size: 13px; }
.certificate-details-button :deep(> span) { gap: 6px; }
.certificate-details-button.el-button:focus-visible { outline: 2px solid #075cac; outline-offset: 2px; }
.certificate-image-error { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 5px; height: 100%; padding: 6px; color: #435b70; font-size: 11px; line-height: 1.5; text-align: center; }
.certificate-image-error .el-icon { font-size: 20px; }
.certificate-viewer-error { padding: 20px; color: #fff; font-size: 14px; }
.certificate-pagination-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px 12px; min-height: 44px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #cbd8e2; }
.certificate-pagination-row > p { color: #435b70; font-size: 12px; line-height: 1.6; }
.certificate-pagination { --el-color-primary: #075cac; --el-fill-color: #fff; --el-text-color-primary: #15354d; --el-text-color-regular: #435b70; --el-text-color-placeholder: #6a7f90; flex-wrap: wrap; }
.certificate-pagination :deep(button), .certificate-pagination :deep(.el-pager li) { min-width: 36px; height: 40px; border: 1px solid #b5c8d8; border-radius: 4px; font-size: 13px; margin: 0 2px; }
.certificate-pagination :deep(.el-pager li.is-active) { color: #fff; background: #075cac; border-color: #075cac; }
.certificate-pagination :deep(button:focus-visible), .certificate-pagination :deep(.el-pager li:focus-visible) { outline: 2px solid #075cac; outline-offset: 2px; }
.certificate-details-content { max-height: min(65vh, 600px); overflow-y: auto; padding: 4px 6px; color: #203548; overscroll-behavior: contain; }
.certificate-details-content h3 { color: #15354d; font-size: 20px; line-height: 1.5; overflow-wrap: anywhere; }
.certificate-details-summary { margin-top: 14px; color: #435b70; font-size: 14px; line-height: 1.85; white-space: pre-line; overflow-wrap: anywhere; }
.certificate-details-meta { margin: 18px 0; }
.certificate-details-meta > div { display: grid; grid-template-columns: 100px minmax(0, 1fr); gap: 16px; padding: 10px 0; border-bottom: 1px solid #dce5ed; font-size: 13px; line-height: 1.7; }
.certificate-details-meta dt { color: #536b7e; }
.certificate-details-meta dd { margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
.certificate-details-image.el-image { display: block; width: 100%; height: 260px; background: #f4f7fa; cursor: zoom-in; }
.certificate-details-image-button.el-button { height: 44px; margin-top: 8px; color: #075cac; }
.certificate-details-image-button.el-button:focus-visible { outline: 2px solid #075cac; outline-offset: 2px; }
@media (max-width: 1100px) {
  .certificate-gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .certifications-section { padding: 44px 0; }
  .certificate-gallery { grid-template-columns: minmax(0, 1fr); gap: 16px; min-height: 192px; }
  .certificate-gallery-paged { min-height: 400px; }
  .certificate-card { display: grid; grid-template-columns: 112px minmax(0, 1fr); height: 192px; }
  .certificate-preview { height: 100%; border-right: 1px solid #d9e3eb; border-bottom: 0; }
  .certificate-preview-image :deep(.el-image__inner) { padding: 10px; }
  .certificate-preview-button.el-button { right: 6px; bottom: 8px; left: 6px; height: 40px; padding: 0 4px; font-size: 11px; }
  .certificate-card-body { padding: 14px 12px 8px; }
  .certificate-card h3 { font-size: 16px; }
  .certificate-card-body .certificate-summary { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; white-space: pre-line; }
  .certificate-pagination-row { gap: 12px; }
  .certificate-pagination :deep(button), .certificate-pagination :deep(.el-pager li) { min-width: 32px; margin: 0 1px; }
}
@media (prefers-reduced-motion: reduce) {
  .certificate-card { transition: none; }
}
.about-global .hc-global > div { min-width: 0; }
.about-global .hc-h2, .about-global .hc-p, .about-global .hc-stat, .about-global .hc-stat-cap { overflow-wrap: anywhere; }
.about-global .hc-p { white-space: pre-line; }
.about-global-image-error { display: grid; place-items: center; min-height: 150px; color: #bccddb; }
.about-intro-copy { min-width: 0; width: min(100%, 720px); }
.about-intro-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 40px; }
.about-intro-stats > div, .about-intro-stats > div + div { min-width: 0; padding: 24px 10px 4px; }
.about-intro-stats > div:first-child { padding-left: 0; }
.about-intro-stats > div:last-child { padding-right: 0; }
.about-intro-stats .hc-stat { font-size: clamp(22px, 2vw, 30px); white-space: nowrap; }
.about-intro-stats .hc-stat u { font-size: 12px; }
.about-intro-stats .hc-stat-cap { color: #bccddb; font-size: 12px; }
@media (max-width: 700px) {
  .about-global .hc-gstats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .about-intro-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 12px; }
  .about-intro-stats > div:nth-child(2n) { border-right: 0; }
  .about-intro-stats > div:nth-child(2n + 1) { padding-left: 0; }
}
</style>
