<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSiteContent } from '../services/website.js'
import { contactText, contactWebsiteUrl, useContactSettings } from '../services/contactSettings.js'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import SocialLinks from '../components/SocialLinks.vue'
import SiteNav from '../components/SiteNav.vue'
import InquiryForm from '../components/InquiryForm.vue'
import SubsidiaryCards from '../components/SubsidiaryCards.vue'
const { siteValue } = useSiteContent()
const { locale } = useI18n({ useScope: 'global' })
const { contactSettings } = useContactSettings()
const contact = computed(() => contactSettings.value?.contact)
const page = ref(null)
useDesignPage('hc-contact', page)
</script>

<template>
  <main ref="page" class="design-site">
    <div class="hc-page">
      <SiteNav />
      <section class="hc-sec contact-intro">
        <div class="hc-w contact-intro-layout">
          <div><span class="hc-kick">{{ $t('site.getInTouchReplyWithin2WorkingDays') }}</span><h2 class="hc-h2">{{ $t('site.contactUs') }}</h2></div>
          <p class="hc-p">{{ $t('site.sendADutyStatementADrawingSetOrJustACapacityRequirement') }}</p>
        </div>
      </section>
      <section class="contact-main">
        <div class="hc-w contact-layout" :class="{ 'contact-layout-single': !contactSettings?.form.showOnContact }">
          <div v-if="contact">
            <span class="hc-kick">{{ $t('site.01DirectContact') }}</span>
            <dl class="contact-details">
              <div><dt>{{ $t('site.address') }}</dt><dd>{{ contactText(contact.address, locale) }}</dd></div>
              <div v-if="contact.phone"><dt>{{ $t('site.telephone') }}</dt><dd>{{ contact.phone }}</dd></div>
              <div v-if="contact.fax"><dt>{{ $t('site.fax') }}</dt><dd>{{ contact.fax }}</dd></div>
              <div v-if="contact.emails.length"><dt>{{ $t('site.email') }}</dt><dd><a v-for="email in contact.emails" :key="email" :href="`mailto:${email}`">{{ email }}</a></dd></div>
              <div v-if="contact.website"><dt>{{ $t('site.website') }}</dt><dd><a :href="contactWebsiteUrl(contact.website)" target="_blank" rel="noopener noreferrer">{{ contact.website }}</a></dd></div>
              <div v-if="contactText(contact.port, locale)"><dt>{{ $t('site.port') }}</dt><dd>{{ contactText(contact.port, locale) }}</dd></div>
            </dl>
            <template v-if="contactSettings.subsidiaries.some(item => item.enabled)">
              <span class="hc-kick contact-subsidiaries-title">{{ $t('site.02Subsidiaries') }}</span>
              <SubsidiaryCards />
            </template>
          </div>
          <InquiryForm placement="contact" />
        </div>
      </section>
      <footer class="hc-foot"><div class="hc-foot-in">
        <span class="hc-logo" style="font-size:19px"><i></i>{{ siteValue('text_8920f3d022b5') }}</span>
        <span v-if="contact" class="tag">{{ contact.phone }} · {{ contact.emails.join(' · ') }}</span>
        <LanguageSwitcher style="margin-left:auto;color:var(--txt-2)" />
        <SocialLinks />
      </div></footer>
    </div>
  </main>
</template>

<style scoped>
.contact-intro { padding: 72px 0 56px; }
.contact-intro-layout { display: flex; justify-content: space-between; align-items: flex-end; gap: 60px; }
.contact-intro .hc-h2 { margin-top: 18px; color: #fff; font-size: 52px; }
.contact-intro .hc-p { max-width: 400px; }
.contact-main { border-top: 1px solid var(--line-d2); }
.contact-layout { padding-top: 64px; padding-bottom: 96px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 600px); gap: 64px; align-items: start; }
.contact-layout-single { grid-template-columns: 1fr; }
.contact-details { margin: 26px 0 0; }
.contact-details > div { display: flex; justify-content: space-between; gap: 24px; padding: 15px 0; border-bottom: 1px solid var(--line-d2); }
.contact-details dt { font-size: 12px; color: #b9cad7; flex: 0 0 100px; }
.contact-details dd { margin: 0; font-size: 13px; color: #e3edf5; text-align: right; line-height: 1.8; white-space: pre-line; overflow-wrap: anywhere; }
.contact-details a { display: block; color: #a8d1f3; }
.contact-subsidiaries-title { display: block; margin-top: 46px; }
@media (max-width: 1050px) { .contact-layout { grid-template-columns: 1fr; gap: 40px; } }
@media (max-width: 700px) { .contact-intro-layout { align-items: flex-start; flex-direction: column; gap: 20px; } .contact-intro .hc-h2 { font-size: 38px; } }
</style>
