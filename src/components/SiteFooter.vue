<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSiteNavigation } from '../composables/useSiteNavigation.js'
import { contactText, useContactSettings } from '../services/contactSettings.js'
import LanguageSwitcher from './LanguageSwitcher.vue'
import SocialLinks from './SocialLinks.vue'
import SiteLogo from './SiteLogo.vue'

defineProps({ showContactCta: { type: Boolean, default: true } })

const { locale } = useI18n({ useScope: 'global' })
const { menuItems, isMenuActive, navigateLink } = useSiteNavigation()
const { contactSettings } = useContactSettings()
const address = computed(() => contactText(contactSettings.value?.contact.address, locale.value))
</script>

<template>
  <section v-if="showContactCta" class="j-footer-cta">
    <div class="hc-w">
      <div>
        <h2>{{ locale === 'zh' ? '交流您的制造需求' : 'Discuss your manufacturing needs' }}</h2>
        <p>{{ locale === 'zh' ? '围绕客户图纸、质量要求和交付计划，交流装备制造与供货需求。' : 'Discuss equipment manufacturing and supply around your drawings, quality requirements and delivery schedule.' }}</p>
      </div>
      <router-link class="j-button" to="/contact">{{ $t('site.contactUs') }}<span>→</span></router-link>
    </div>
  </section>
  <footer class="site-footer" role="contentinfo" data-site-nav>
    <div class="site-footer-coast" aria-hidden="true">
      <img src="/assets/tzme-j/backgrounds/footer-coast.webp" alt="" width="1983" height="793" loading="lazy" decoding="async" />
    </div>
    <div class="site-footer-inner">
      <div class="site-footer-main">
        <div class="site-footer-brand">
          <el-link class="site-footer-logo" href="/" :underline="false" :aria-label="$t('site.brandHome')" @click="navigateLink($event, '/')">
            <SiteLogo />
          </el-link>
          <p>{{ $t('site.heavyEngineeringBuiltAroundYourChallenge') }}</p>
          <div class="site-footer-connect">
            <LanguageSwitcher />
            <SocialLinks />
          </div>
        </div>
        <nav class="site-footer-navigation" :aria-label="$t('site.footerNavigation')">
          <h2 class="site-footer-heading">{{ locale === 'zh' ? '网站导航' : 'Explore' }}</h2>
          <div class="site-footer-links">
            <el-link v-for="item in menuItems" :key="item.key" :href="item.path" :underline="false"
              :aria-current="isMenuActive(item) ? 'page' : undefined" @click="navigateLink($event, item.path)">{{ item.label }}</el-link>
          </div>
        </nav>
        <div class="site-footer-contact">
          <h2 class="site-footer-heading">{{ $t('site.contactUs') }}</h2>
          <div class="site-footer-contact-details">
            <a v-for="email in contactSettings?.contact.emails" :key="email" class="site-footer-email" :href="'mailto:' + email">{{ email }}<span aria-hidden="true">↗</span></a>
            <p v-if="contactSettings?.contact.phone" class="site-footer-phone">{{ contactSettings.contact.phone }}</p>
            <p v-if="address" class="site-footer-address">{{ address }}</p>
          </div>
        </div>
      </div>
      <div class="site-footer-bottom">
        <span class="site-footer-copyright">{{ $t('site.copyright') }}</span>
        <span>{{ $t('contactUi.footerTerms') }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-top: 1px solid #dce9e9;
  background: #f2f9f9;
  color: #456675;
  font: 13px/1.8 var(--f-ui);
}
.site-footer-coast { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.site-footer-coast img { width: 100%; height: 100%; object-fit: cover; object-position: right center; }
.site-footer-coast::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(90deg, #f5fafb 0%, rgba(245, 250, 251, .98) 25%, rgba(245, 250, 251, .94) 47%, rgba(245, 250, 251, .86) 65%, rgba(245, 250, 251, .48) 80%, rgba(245, 250, 251, .05) 100%);
}
.site-footer-inner { width: var(--site-content-width, 87.6%); margin-inline: auto; }
.site-footer-main {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(24px, 2vw, 36px);
  width: 78%;
  padding-block: 60px 50px;
}
.site-footer-brand, .site-footer-navigation, .site-footer-contact { min-width: 0; }
.site-footer-logo.el-link { max-width: 100%; min-height: 60px; }
.site-footer .site-footer-logo :deep(.j-brand) { gap: 13px; min-width: 0; }
.site-footer .site-footer-logo :deep(.j-brand .site-logo) { width: 54px; height: 60px; flex: 0 0 54px; transform: none; mix-blend-mode: multiply; }
.site-footer .site-footer-logo :deep(.j-brand strong) { white-space: normal; color: #123a50; font-size: 14px; line-height: 1.6; }
.site-footer .site-footer-logo :deep(.j-brand small) { margin-top: 3px; font-size: 11px; line-height: 1.5; letter-spacing: .1px; }
.site-footer-brand > p { margin: 20px 0 22px; font-size: 13px; color: #456675; }
.site-footer-connect { display: flex; align-items: center; flex-wrap: wrap; gap: 14px 22px; }
.site-footer-connect :deep(.hc-lang) { display: inline-flex; align-items: center; gap: 5px; padding: 0; color: #587784; font-size: 12px; }
.site-footer-connect :deep(.hc-lang-option) { display: inline-flex; align-items: center; min-height: 36px; color: #456675; font-size: 12px; font-weight: 500; }
.site-footer-connect :deep(.hc-lang-option.active), .site-footer-connect :deep(.hc-lang-option:hover) { color: #087f91; }
.site-footer-connect :deep(.social-links) { gap: 9px; }
.site-footer .site-footer-connect :deep(.social-link) { width: 32px; height: 32px; border: 1px solid #bdd5da; border-radius: 50%; background: rgba(255, 255, 255, .32); color: #277184; transition: background .2s, border-color .2s; }
.site-footer .site-footer-connect :deep(.social-link:hover) { border-color: #087f91; background: #e2f1f3; color: #087f91; }
.site-footer-heading { margin: 5px 0 22px; color: #123a50; font-size: 14px; line-height: 1.6; font-weight: 650; }
.site-footer-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 20px; }
.site-footer-links .el-link { justify-content: flex-start; min-height: 32px; color: #456675; font-size: 13px; font-weight: 400; line-height: 1.5; }
.site-footer-links .el-link:hover, .site-footer-links .el-link[aria-current="page"] { color: #087f91; text-decoration: underline; text-underline-offset: 5px; }
.site-footer-contact-details { display: grid; gap: 9px; }
.site-footer-email { display: flex; align-items: center; gap: 18px; width: fit-content; max-width: 100%; color: #08748a; font-size: 17px; font-weight: 550; line-height: 1.6; overflow-wrap: anywhere; }
.site-footer-email span { flex: 0 0 auto; font-size: 15px; transition: transform .2s; }
.site-footer-email:hover { color: #075a6c; }
.site-footer-email:hover span { transform: translate(2px, -2px); }
.site-footer-phone, .site-footer-address { margin: 0; color: #456675; font-size: 12px; line-height: 1.9; overflow-wrap: anywhere; }
.site-footer-phone { font-variant-numeric: tabular-nums; }
.site-footer-address { white-space: pre-line; }
.site-footer-bottom { display: flex; align-items: center; flex-wrap: wrap; justify-content: space-between; gap: 5px 24px; padding-block: 19px 21px; border-top: 1px solid rgba(75, 126, 140, .2); color: #486775; font-size: 11px; }
.site-footer :deep(a:focus-visible), .site-footer :deep(button:focus-visible) { outline: 2px solid #087f91; outline-offset: 4px; box-shadow: none; }
@media (min-width: 1101px) {
  .site-footer { --site-content-width: min(1740px, 92%); }
}
@media (max-width: 1100px) {
  .site-footer-main { width: 100%; gap: 28px; padding-block: 44px 38px; }
  .site-footer-coast::after { background: linear-gradient(90deg, #f5fafb 5%, rgba(245, 250, 251, .96) 45%, rgba(245, 250, 251, .86) 80%, rgba(245, 250, 251, .55)); }
}
@media (min-width: 701px) and (max-width: 900px) {
  .site-footer-main { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); row-gap: 30px; }
  .site-footer-navigation { grid-column: 1; grid-row: 2; }
  .site-footer-contact { grid-column: 2; grid-row: 1 / 3; }
  .site-footer-heading { margin-bottom: 16px; }
  .site-footer-brand > p { margin-block: 14px; }
}
@media (max-width: 700px) {
  .site-footer-main { grid-template-columns: 1fr; gap: 24px; padding-block: 30px 27px; }
  .site-footer-coast img { object-position: 72% center; }
  .site-footer-coast::after { background: linear-gradient(110deg, rgba(245, 250, 251, .98) 5%, rgba(245, 250, 251, .94) 46%, rgba(245, 250, 251, .72) 100%); }
  .site-footer .site-footer-logo :deep(.j-brand) { gap: 11px; }
  .site-footer .site-footer-logo :deep(.j-brand .site-logo) { width: 46px; height: 49px; flex-basis: 46px; }
  .site-footer .site-footer-logo :deep(.j-brand strong) { font-size: 12px; }
  .site-footer .site-footer-logo :deep(.j-brand small) { font-size: 10px; }
  .site-footer-logo.el-link { min-height: 49px; }
  .site-footer-brand > p { margin: 12px 0 9px; font-size: 12px; }
  .site-footer-connect { gap: 10px 18px; }
  .site-footer-heading { margin: 0 0 10px; font-size: 13px; }
  .site-footer-links { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px 14px; }
  .site-footer-links .el-link { min-height: 34px; font-size: 12px; }
  .site-footer-contact-details { gap: 5px; }
  .site-footer-email { gap: 13px; font-size: 16px; }
  .site-footer-phone, .site-footer-address { font-size: 11px; }
  .site-footer-bottom { align-items: flex-start; justify-content: flex-start; gap: 3px 18px; padding-block: 15px 18px; font-size: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .site-footer :deep(.social-link), .site-footer-email span { transition: none; }
}
</style>
