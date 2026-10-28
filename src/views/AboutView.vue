<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ZoomIn } from "@element-plus/icons-vue";
import { useDesignPage } from "../composables/useDesignPage.js";
import SiteFooter from "../components/SiteFooter.vue";
import SeoKnowledgeSection from "../components/SeoKnowledgeSection.vue";
import SiteNav from "../components/SiteNav.vue";
import GlobalReachSection from "../components/GlobalReachSection.vue";
import AboutCompanyIntro from "../components/AboutCompanyIntro.vue";
import ManufacturingQuality from "../components/ManufacturingQuality.vue";
import PdfFirstPage from "../components/PdfFirstPage.vue";
import CertificateDetailsDialog from "../components/CertificateDetailsDialog.vue";
import SubsidiaryCards from "../components/SubsidiaryCards.vue";
import { useCapabilities } from "../services/capabilities.js";
import { useAboutTzme } from "../services/aboutTzme.js";
import { useContactSettings } from "../services/contactSettings.js";
import { useCertificationCatalog } from "../services/certifications.js";
import { useGlobalReach } from "../services/globalReach.js";
import { trackEvent } from "../services/analytics.js";
import ManufacturingFilm from "../components/ManufacturingFilm.vue";
import PartnersSection from "../components/PartnersSection.vue";
import { usePartners } from "../services/partners.js";
import { isPdf } from "../data/jDesign.js";
import { jCompany } from "../data/jCompany.js";
const page = ref(null);
useDesignPage("hc-about", page);
const { locale } = useI18n({ useScope: "global" });
const { contactSettings } = useContactSettings();
const { capabilities, loadCapabilities } = useCapabilities();
const { aboutTzme, loadAboutTzme } = useAboutTzme();
const { globalReach, loadGlobalReach } = useGlobalReach();
const { certifications, loadCertifications } = useCertificationCatalog();
const { partners, loadPartners } = usePartners();
onMounted(loadPartners);
const hasCertificateImage = (item) =>
  typeof item.image === "string" && Boolean(item.image.trim());
const publishedCertifications = computed(() =>
  certifications.value.filter(
    (item) => item.status === "published" && hasCertificateImage(item),
  ),
);
const certificateLayouts = [
  { media: window.matchMedia("(min-width: 1280px)"), columns: 6 },
  { media: window.matchMedia("(min-width: 1000px)"), columns: 4 },
  { media: window.matchMedia("(min-width: 600px)"), columns: 3 },
];
const resolveCertificateColumns = () =>
  certificateLayouts.find((layout) => layout.media.matches)?.columns || 2;
const certificateColumns = ref(resolveCertificateColumns());
const certificatePage = ref(1);
const certificatePageSize = computed(() => certificateColumns.value * 2);
const certificatePageStart = computed(
  () => (certificatePage.value - 1) * certificatePageSize.value,
);
const certificatePageEnd = computed(() =>
  Math.min(
    certificatePageStart.value + certificatePageSize.value,
    publishedCertifications.value.length,
  ),
);
const visibleCertificates = computed(() =>
  publishedCertifications.value.slice(
    certificatePageStart.value,
    certificatePageEnd.value,
  ),
);
const updateCertificateLayout = () => {
  certificateColumns.value = resolveCertificateColumns();
};
onMounted(() =>
  certificateLayouts.forEach((layout) =>
    layout.media.addEventListener("change", updateCertificateLayout),
  ),
);
onUnmounted(() =>
  certificateLayouts.forEach((layout) =>
    layout.media.removeEventListener("change", updateCertificateLayout),
  ),
);
watch([() => publishedCertifications.value.length, certificatePageSize], () => {
  const maxPage = Math.max(
    1,
    Math.ceil(publishedCertifications.value.length / certificatePageSize.value),
  );
  certificatePage.value = Math.min(certificatePage.value, maxPage);
});
async function changeCertificatePage(value) {
  certificatePage.value = value;
  trackEvent("pagination", `certifications:${value}`);
  await nextTick();
  document.getElementById("certificates-title")?.focus({ preventScroll: true });
}
const certificateDetailsId = ref("");
watch(certificateDetailsId, (id) => {
  if (id) trackEvent("certificate_view", id);
});
const certificateDetails = computed(() =>
  publishedCertifications.value.find(
    (item) => item.id === certificateDetailsId.value,
  ),
);
const certificateDetailsOpen = computed({
  get: () => Boolean(certificateDetails.value),
  set: (value) => {
    if (!value) certificateDetailsId.value = "";
  },
});
const certificatePreviewSources = computed(() =>
  publishedCertifications.value
    .filter((item) => !isPdf(item.image))
    .map((item) => item.image),
);
const certificateImageRefs = new Map();
function setCertificateImageRef(id, instance) {
  if (instance) certificateImageRefs.set(id, instance);
  else certificateImageRefs.delete(id);
}
function previewCertificate(id) {
  const item = publishedCertifications.value.find((item) => item.id === id);
  if (isPdf(item?.image)) certificateDetailsId.value = id;
  else certificateImageRefs.get(id)?.showPreview();
}
const certificationField = (item, name) =>
  locale.value === "zh"
    ? item[`${name}Zh`] || item[`${name}En`] || ""
    : item[`${name}En`] || "";
onMounted(() => {
  loadGlobalReach();
  loadCertifications();
  loadAboutTzme();
  loadCapabilities();
});
</script>

<template>
  <main ref="page" class="design-site site-refined refined-about">
    <div class="hc-page">
      <SiteNav />

      <AboutCompanyIntro
        v-if="aboutTzme"
        :configuration="aboutTzme.about"
        :locale-code="locale"
      />
      <nav
        v-if="aboutTzme"
        class="company-section-nav hc-w"
        aria-label="关于我们页面导航"
      >
        <span>继续了解</span
        ><a v-if="capabilities?.enabled" href="#manufacturing-quality"
          >制造与质量 <i aria-hidden="true">↗</i></a
        ><a href="#manufacturing-bases">制造基地 <i aria-hidden="true">↗</i></a
        ><a href="#certificates-title">资质认证 <i aria-hidden="true">↗</i></a
        ><a v-if="globalReach?.enabled" href="#global-reach"
          >全球业务 <i aria-hidden="true">↗</i></a
        >
      </nav>
      <div
        v-if="capabilities?.enabled"
        id="manufacturing-quality"
        class="refine-section hc-w"
      >
        <ManufacturingQuality />
      </div>
      <section id="manufacturing-bases" class="refine-section refine-soft">
        <div class="hc-w">
          <header class="refine-section-head">
            <div>
              <span class="refine-eyebrow">{{ $t("site.facilities") }}</span>
              <h2>{{ $t("contactUi.facilitiesTitle") }}</h2>
            </div>
            <router-link class="refine-link" to="/contact"
              >{{ $t("site.bookAFactoryVisit")
              }}<span aria-hidden="true">↗</span></router-link
            >
          </header>
          <SubsidiaryCards
            v-if="contactSettings"
            include-headquarters
            about-only
            show-media
            collapsible-details
          />
          <div class="j-about-film"><ManufacturingFilm /></div>
        </div>
      </section>
      <section
        class="refine-section certifications-section"
        aria-labelledby="certificates-title"
      >
        <div class="hc-w">
          <div class="hc-shead">
            <div class="l">
              <span class="hc-kick">{{ $t("site.certification") }}</span>
              <h2
                id="certificates-title"
                class="hc-h2"
                tabindex="-1"
                style="margin-top: 18px"
              >
                {{ $t("site.auditedAndCertified") }}
              </h2>
              <p class="hc-p certificate-introduction">
                {{
                  $t(
                    "site.ourQualityManagementSystemAndWeldingCertificationWereIssuedByAccreditedThird",
                  )
                }}
              </p>
            </div>
            <span class="hc-lnk"
              >{{ $t("site.requestCertificates") }}<i>→</i></span
            >
          </div>
          <div
            v-if="publishedCertifications.length"
            class="certificate-collection"
          >
            <div class="certificate-collection-heading">
              <span>{{
                $t("certificationUi.count", {
                  count: publishedCertifications.length,
                })
              }}</span>
              <p>
                <el-icon aria-hidden="true"><ZoomIn /></el-icon
                >{{ $t("certificationUi.previewHint") }}
              </p>
            </div>
            <div
              class="certificate-gallery"
              :class="{
                'certificate-gallery-paged':
                  publishedCertifications.length > certificatePageSize,
              }"
              :style="{ '--certificate-columns': certificateColumns }"
            >
              <article
                v-for="certificate in visibleCertificates"
                :key="certificate.id"
                class="certificate-card"
              >
                <div class="certificate-preview">
                  <button
                    v-if="isPdf(certificate.image)"
                    type="button"
                    class="certificate-document-cover j-pdf-cover"
                    :aria-label="
                      $t('certificationUi.previewCertificate', {
                        title: certificationField(certificate, 'title'),
                      })
                    "
                    @click="previewCertificate(certificate.id)"
                  >
                    <PdfFirstPage
                      :source="certificate.image"
                      :label="
                        certificationField(certificate, 'title') + ' · 第一页'
                      "
                    />
                  </button>
                  <el-image
                    v-else
                    :ref="
                      (instance) =>
                        setCertificateImageRef(certificate.id, instance)
                    "
                    class="certificate-preview-image"
                    :src="certificate.image"
                    :alt="certificationField(certificate, 'title')"
                    :preview-src-list="certificatePreviewSources"
                    :initial-index="
                      certificatePreviewSources.indexOf(certificate.image)
                    "
                    preview-teleported
                    hide-on-click-modal
                  >
                    <template #viewer-error
                      ><div class="certificate-viewer-error">
                        {{ $t("certificationUi.imageUnavailable") }}
                      </div></template
                    >
                  </el-image>
                </div>
                <div class="certificate-card-body">
                  <h3>{{ certificationField(certificate, "title") }}</h3>
                  <p
                    v-if="certificationField(certificate, 'summary')"
                    class="certificate-summary"
                  >
                    {{ certificationField(certificate, "summary") }}
                  </p>
                  <p
                    v-else-if="certificationField(certificate, 'issuer')"
                    class="certificate-summary"
                  >
                    {{ certificationField(certificate, "issuer") }}
                  </p>
                  <div class="certificate-card-footer">
                    <p
                      v-if="certificate.expiresAt || certificate.certificateNo"
                      class="certificate-meta"
                    >
                      <span v-if="certificate.expiresAt"
                        >{{ $t("site.certValidThrough") }}
                        {{ certificate.expiresAt }}</span
                      >
                      <span v-else>{{ certificate.certificateNo }}</span>
                    </p>
                    <el-button
                      class="certificate-details-button"
                      text
                      :aria-label="
                        $t('certificationUi.detailsLabel', {
                          title: certificationField(certificate, 'title'),
                        })
                      "
                      @click.stop="certificateDetailsId = certificate.id"
                      >{{ $t("certificationUi.viewDetails")
                      }}<span aria-hidden="true">→</span></el-button
                    >
                  </div>
                </div>
              </article>
            </div>
            <div class="certificate-pagination-row">
              <p role="status" aria-live="polite" aria-atomic="true">
                {{
                  $t("certificationUi.pageRange", {
                    start: certificatePageStart + 1,
                    end: certificatePageEnd,
                    total: publishedCertifications.length,
                  })
                }}
              </p>
              <el-pagination
                v-if="publishedCertifications.length > certificatePageSize"
                class="certificate-pagination"
                background
                :current-page="certificatePage"
                :page-size="certificatePageSize"
                :total="publishedCertifications.length"
                :pager-count="5"
                layout="prev, pager, next"
                :aria-label="$t('certificationUi.paginationLabel')"
                @current-change="changeCertificatePage"
              />
            </div>
          </div>
          <el-empty v-else :description="$t('certificationUi.emptyGallery')" />
        </div>
      </section>

      <section class="refine-values hc-w">
        <div>
          <span class="refine-eyebrow">企业愿景</span>
          <h3>{{ locale === "zh" ? jCompany.visionZh : jCompany.visionEn }}</h3>
        </div>
        <div>
          <span class="refine-eyebrow">我们的使命</span>
          <h3>
            {{ locale === "zh" ? jCompany.missionZh : jCompany.missionEn }}
          </h3>
        </div>
        <p class="refine-company-values">
          {{
            locale === "zh"
              ? "价值观 / " + jCompany.valuesZh
              : "Values / " + jCompany.valuesEn
          }}
        </p>
      </section>
      <GlobalReachSection :configuration="globalReach" />

      <SeoKnowledgeSection />
      <PartnersSection :configuration="partners" placement="about" />
      <SiteFooter />
    </div>

    <CertificateDetailsDialog
      v-model="certificateDetailsOpen"
      :certificate="certificateDetails"
      :certificates="publishedCertifications"
      @select="certificateDetailsId = $event"
    />
  </main>
</template>

<style scoped>
.company-section-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px 42px;
  padding-block: 21px;
  border-block: 1px solid #d7e5e9;
}
.company-section-nav > span {
  margin-right: auto;
  color: #78909b;
  font-size: 11px;
}
.company-section-nav > a {
  display: inline-flex;
  align-items: center;
  gap: 25px;
  color: #315c6e;
  font-size: 12px;
  text-decoration: none;
}
.company-section-nav i {
  color: #087f91;
  font-style: normal;
}
.company-section-nav > a:hover {
  color: #087f91;
}
.company-section-nav > a:focus-visible {
  outline: 2px solid #087f91;
  outline-offset: 5px;
}
@media (max-width: 700px) {
  .company-section-nav {
    gap: 16px;
    justify-content: space-between;
    padding-block: 18px;
  }
  .company-section-nav > span {
    display: none;
  }
  .company-section-nav > a {
    gap: 7px;
    font-size: 10px;
  }
}
.certifications-section {
  padding: 64px 0;
}
.certifications-section .hc-shead {
  margin-bottom: 28px;
}
.certifications-section .certificate-introduction {
  max-width: 700px;
  margin-top: 16px;
  color: #435b70;
  font-size: 14px;
  line-height: 1.8;
}
#certificates-title:focus-visible {
  outline: 2px solid #075cac;
  outline-offset: 5px;
}
.certificate-collection-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-bottom: 16px;
  padding-top: 16px;
  border-top: 1px solid #cbd8e2;
}
.certificate-collection-heading > span {
  color: #15354d;
  font-size: 13px;
  font-weight: 600;
}
.certificate-collection-heading > p {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #435b70;
  font-size: 12px;
  line-height: 1.6;
}
.certificate-collection-heading .el-icon {
  color: #075cac;
  font-size: 16px;
}
.certificate-gallery {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  min-height: 320px;
  align-content: start;
}
.certificate-card {
  display: flex;
  flex-direction: column;
  height: 320px;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #c9d7e2;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 3px 14px rgb(15 44 66 / 4%);
  box-sizing: border-box;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.certificate-card:hover,
.certificate-card:focus-within {
  border-color: #7b9fbd;
  box-shadow: 0 6px 20px rgb(15 44 66 / 9%);
}
.certificate-preview {
  position: relative;
  flex-shrink: 0;
  height: 164px;
  overflow: hidden;
  border-bottom: 1px solid #d9e3eb;
  background: #e9eef3;
}
.certificate-preview-image.el-image {
  display: block;
  width: 100%;
  height: 100%;
  cursor: zoom-in;
}
.certificate-preview-image :deep(.el-image__inner) {
  padding: 14px 18px;
  box-sizing: border-box;
}
.certificate-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 14px 16px 8px;
}
.certificate-card h3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  min-width: 0;
  color: #15354d;
  font-family: var(--f-ui);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.certificate-card-body p {
  color: #435b70;
  font-size: 13px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}
.certificate-card-body .certificate-summary {
  overflow: hidden;
  margin-top: 6px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.certificate-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 8px;
  margin-top: auto;
  padding-top: 4px;
  border-top: 1px solid #e0e8ef;
}
.certificate-card-body .certificate-meta {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
}
.certificate-details-button.el-button {
  flex-shrink: 0;
  height: 40px;
  margin: 0;
  padding: 0 4px;
  color: #075cac;
  font-size: 13px;
}
.certificate-details-button :deep(> span) {
  gap: 6px;
}
.certificate-details-button.el-button:focus-visible {
  outline: 2px solid #075cac;
  outline-offset: 2px;
}
.certificate-viewer-error {
  padding: 20px;
  color: #fff;
  font-size: 14px;
}
.certificate-pagination-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-height: 44px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #cbd8e2;
}
.certificate-pagination-row > p {
  color: #435b70;
  font-size: 12px;
  line-height: 1.6;
}
.certificate-pagination {
  --el-color-primary: #075cac;
  --el-fill-color: #fff;
  --el-text-color-primary: #15354d;
  --el-text-color-regular: #435b70;
  --el-text-color-placeholder: #6a7f90;
  flex-wrap: wrap;
}
.certificate-pagination :deep(button),
.certificate-pagination :deep(.el-pager li) {
  min-width: 36px;
  height: 40px;
  border: 1px solid #b5c8d8;
  border-radius: 4px;
  font-size: 13px;
  margin: 0 2px;
}
.certificate-pagination :deep(.el-pager li.is-active) {
  color: #fff;
  background: #075cac;
  border-color: #075cac;
}
.certificate-pagination :deep(button:focus-visible),
.certificate-pagination :deep(.el-pager li:focus-visible) {
  outline: 2px solid #075cac;
  outline-offset: 2px;
}
@media (max-width: 1100px) {
  .certificate-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .certifications-section {
    padding: 44px 0;
  }
  .certificate-gallery {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    min-height: 192px;
  }
  .certificate-gallery-paged {
    min-height: 400px;
  }
  .certificate-card {
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
    height: 192px;
  }
  .certificate-preview {
    height: 100%;
    border-right: 1px solid #d9e3eb;
    border-bottom: 0;
  }
  .certificate-preview-image :deep(.el-image__inner) {
    padding: 10px;
  }
  .certificate-card-body {
    padding: 14px 12px 8px;
  }
  .certificate-card h3 {
    font-size: 16px;
  }
  .certificate-card-body .certificate-summary {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    white-space: pre-line;
  }
  .certificate-pagination-row {
    gap: 12px;
  }
  .certificate-pagination :deep(button),
  .certificate-pagination :deep(.el-pager li) {
    min-width: 32px;
    margin: 0 1px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .certificate-card {
    transition: none;
  }
}
</style>
