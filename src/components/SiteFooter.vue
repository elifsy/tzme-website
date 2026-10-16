<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSiteNavigation } from '../composables/useSiteNavigation.js'
import { contactText, useContactSettings } from '../services/contactSettings.js'
import LanguageSwitcher from './LanguageSwitcher.vue'
import SocialLinks from './SocialLinks.vue'
import SiteLogo from './SiteLogo.vue'

const { locale } = useI18n({ useScope: 'global' })
const { menuItems, isMenuActive, navigateLink } = useSiteNavigation()
const { contactSettings } = useContactSettings()
const address = computed(() => contactText(contactSettings.value?.contact.address, locale.value))
</script>

<template>
  <section class="j-footer-cta"><div class="hc-w"><div><h2>{{ locale === 'zh' ? '交流您的制造需求' : 'Talk to our engineering team' }}</h2><p>{{ locale === 'zh' ? '围绕客户图纸、质量要求和交付计划，交流装备制造与供货需求。' : 'Explore equipment and engineering shaped around your project.' }}</p></div><router-link class="j-button" to="/contact">{{ $t('site.contactUs') }}<span>→</span></router-link></div></section>
  <footer class="site-footer" role="contentinfo" data-site-nav>
    <div class="site-footer-inner">
      <div class="site-footer-main">
        <div class="site-footer-brand">
          <el-link class="site-footer-logo" href="/" :underline="false" :aria-label="$t('site.brandHome')" @click="navigateLink($event, '/')">
            <SiteLogo />
          </el-link>
          <p>{{ $t('site.heavyEngineeringBuiltAroundYourChallenge') }}</p>
        </div>
        <nav class="site-footer-navigation" :aria-label="$t('site.footerNavigation')">
          <el-link v-for="item in menuItems" :key="item.key" :href="item.path" :underline="false"
            :aria-current="isMenuActive(item) ? 'page' : undefined" @click="navigateLink($event, item.path)">{{ item.label }}</el-link>
        </nav>
        <div class="site-footer-tools">
          <a v-for="email in contactSettings?.contact.emails" :key="email" :href="`mailto:${email}`">{{ email }}</a>
          <p>{{ contactSettings?.contact.phone }}</p>
          <p class="site-footer-address">{{ address }}</p>
          <LanguageSwitcher />
          <SocialLinks />
        </div>
      </div>
      <div class="site-footer-bottom">
        <span class="site-footer-copyright">{{ $t('site.copyright') }}</span>
        <div class="site-footer-information">
          <span>{{ $t('contactUi.footerTerms') }}</span>
          <span v-if="address" class="site-footer-address">{{ address }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer { border-top: 1px solid #2e4658; padding: 36px 0 24px; background: #020c13; color: #c1cfdb; font-family: var(--f-ui); font-size: 13px; line-height: 1.7; }
.site-footer-inner { width: min(1240px, calc(100% - 48px)); margin: 0 auto; }
.site-footer-main { display: flex; align-items: center; flex-wrap: wrap; gap: 24px 32px; }
.site-footer-brand { flex: 1 1 220px; min-width: 0; }
.site-footer-logo.el-link { min-height: 48px; color: #fff; }
.site-footer-logo :deep(.el-link__inner) { gap: 9px; }
.site-footer-brand p { max-width: 300px; margin: 6px 0 0; color: #c1cfdb; font-size: 12px; line-height: 1.7; }
.site-footer-navigation { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 4px 22px; }
.site-footer-navigation .el-link { min-height: 44px; color: #dce6ef; font-size: 13px; font-weight: 600; line-height: 1.5; }
.site-footer-navigation .el-link:hover,
.site-footer-navigation .el-link[aria-current="page"] { color: var(--accent); text-decoration: underline; text-underline-offset: 6px; }
.site-footer-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 18px; }
.site-footer-tools :deep(.hc-lang) { display: inline-flex; align-items: center; gap: 4px; color: #c1cfdb; font-size: 12px; line-height: 1.5; white-space: nowrap; }
.site-footer-tools :deep(.hc-lang-option) { display: inline-flex; align-items: center; justify-content: center; min-width: 36px; min-height: 40px; border-radius: 3px; color: #c1cfdb; font-family: inherit; font-size: 12px; font-weight: 600; letter-spacing: .06em; }
.site-footer-tools :deep(.hc-lang-option.active) { color: #fff; text-decoration: underline; text-decoration-color: var(--accent); text-underline-offset: 6px; }
.site-footer-tools :deep(.hc-lang-option:hover) { color: #fff; }
.site-footer .site-footer-tools :deep(.social-link) { width: 36px; height: 36px; }
.site-footer :deep(a:focus-visible),
.site-footer :deep(button:focus-visible) { outline: 2px solid var(--accent); outline-offset: 4px; box-shadow: none; }
.site-footer-bottom { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px 32px; margin-top: 26px; padding-top: 20px; border-top: 1px solid #2e4658; color: #b7c8d5; font-size: 12px; line-height: 1.8; }
.site-footer-copyright { flex: 1 1 240px; }
.site-footer-information { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px 24px; max-width: 780px; }
.site-footer-address { white-space: pre-line; overflow-wrap: anywhere; }
@media (max-width: 1100px) {
  .site-footer-navigation { flex-basis: 100%; justify-content: flex-start; order: 3; }
  .site-footer-tools { margin-left: auto; }
}
@media (max-width: 680px) {
  .site-footer { padding: 28px 0 22px; }
  .site-footer-inner { width: calc(100% - 32px); }
  .site-footer-main { align-items: flex-start; gap: 18px; }
  .site-footer-brand { flex-basis: 100%; }
  .site-footer-navigation { order: 0; gap: 4px 20px; }
  .site-footer-tools { margin-left: 0; }
  .site-footer-bottom { gap: 12px; margin-top: 22px; padding-top: 18px; }
  .site-footer-copyright { flex-basis: 100%; }
  .site-footer-information { justify-content: flex-start; }
}
</style>
