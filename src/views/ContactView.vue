<script setup>
import { computed, ref } from 'vue'
import { useContactSettings } from '../services/contactSettings.js'
import { useDesignPage } from '../composables/useDesignPage.js'
import SiteFooter from '../components/SiteFooter.vue'
import SiteNav from '../components/SiteNav.vue'
import InquiryForm from '../components/InquiryForm.vue'
import SubsidiaryCards from '../components/SubsidiaryCards.vue'
import ContactDetails from '../components/ContactDetails.vue'
import ContactIntro from '../components/ContactIntro.vue'
const { contactSettings } = useContactSettings()
const contact = computed(() => contactSettings.value?.contact)
const page = ref(null)
useDesignPage('hc-contact', page)
</script>

<template>
  <main ref="page" class="design-site contact-page">
    <div class="hc-page">
      <SiteNav />
      <ContactIntro />
      <section class="contact-main">
        <div class="hc-w contact-layout" :class="{ 'contact-layout-single': !contactSettings?.form.showOnContact }">
          <div v-if="contact">
            <span class="hc-kick">{{ $t('site.01DirectContact') }}</span>
            <ContactDetails :contact="contact" />
            <template v-if="contactSettings.subsidiaries.some(item => item.enabled)">
              <span class="hc-kick contact-subsidiaries-title">{{ $t('site.02Subsidiaries') }}</span>
              <SubsidiaryCards />
            </template>
          </div>
          <InquiryForm placement="contact" />
        </div>
      </section>
      <SiteFooter :show-contact-cta="false" />
    </div>
  </main>
</template>

<style scoped>
.contact-main { border-top: 1px solid var(--line-d2); }
.contact-layout { padding-top: 64px; padding-bottom: 96px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 600px); gap: 64px; align-items: start; }
.contact-layout-single { grid-template-columns: 1fr; }
.contact-details { margin: 26px 0 0; }
.contact-details > div { display: flex; justify-content: space-between; gap: 24px; padding: 15px 0; border-bottom: 1px solid var(--line-d2); }
.contact-details dt { font-size: 12px; color: #b9cad7; flex: 0 0 100px; }
.contact-details dd { margin: 0; font-size: 13px; color: #e3edf5; text-align: right; line-height: 1.8; white-space: pre-line; overflow-wrap: anywhere; }
.contact-details a { display: block; color: #a8d1f3; }
.contact-subsidiaries-title { display: block; margin-top: 46px; }
.design-site.contact-page .contact-layout { padding-top: 54px; grid-template-columns: .84fr 1.16fr; gap: 54px; }
.design-site.contact-page .contact-layout-single { grid-template-columns: 1fr; }
.contact-layout > div > .hc-kick { display: block; color: #123a50; font-size: clamp(22px, 1.675vw, 30px); font-weight: 700; line-height: 1.5; letter-spacing: 0; }
.contact-page :deep(.inquiry-form) { padding: 30px clamp(28px, 2.63vw, 44px); background: #eaf6f9; }
.contact-page :deep(.inquiry-form-title) { font-size: clamp(22px, 1.675vw, 30px); line-height: 1.45; margin-bottom: 24px; }
@media (min-width: 1440px) {
  .design-site.contact-page :deep(.contact-details) { margin-top: 10px; }
  .design-site.contact-page :deep(.contact-details dt), .design-site.contact-page :deep(.contact-details dd) { font-size: 18px; }
  .design-site.contact-page :deep(.contact-details dt) { flex-basis: 130px; }
  .design-site.contact-page :deep(.inquiry-form .el-form-item__label) { font-size: 15px; }
  .design-site.contact-page :deep(.inquiry-form .el-input__wrapper), .design-site.contact-page :deep(.inquiry-form .el-select__wrapper) { min-height: 48px; }
}
@media (max-width: 1050px) { .design-site.contact-page .contact-layout { grid-template-columns: 1fr; gap: 40px; } }
@media (max-width: 700px) {
  .design-site.contact-page .contact-layout { padding-top: 36px; padding-bottom: 60px; }
  .contact-page :deep(.inquiry-form) { padding: 25px 20px; }
}
</style>
