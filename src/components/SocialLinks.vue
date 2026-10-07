<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SocialLinkIcon from './SocialLinkIcon.vue'
import { useContactSettings } from '../services/contactSettings.js'
import { socialPlatforms, validSocialUrl } from '../data/socialLinks.js'

const props = defineProps({ links: { type: Array, default: null }, localeCode: { type: String, default: '' }, preview: Boolean })
const { locale, t } = useI18n({ useScope: 'global' })
const { contactSettings } = useContactSettings()
const displayLocale = computed(() => props.localeCode || locale.value)
// Each language uses its own list, including an explicitly empty list.
const visibleLinks = computed(() => (props.links ?? contactSettings.value?.contact.socialLinks?.[displayLocale.value] ?? [])
  .filter(item => item.enabled && socialPlatforms.includes(item.platform) && validSocialUrl(item.url)))
const label = item => item.label?.trim() || t(`contactAdmin.socialPlatforms.${item.platform}`, {}, { locale: displayLocale.value })
</script>

<template>
  <div v-if="visibleLinks.length" class="hc-soc social-links" role="group" :aria-label="$t('contactUi.socialLinks')">
    <el-tooltip v-for="item in visibleLinks" :key="item.id" :content="label(item)" :trigger="['hover', 'focus']" placement="top">
      <el-button :tag="preview ? 'button' : 'a'" :href="preview ? undefined : item.url" :target="preview ? undefined : '_blank'" :rel="preview ? undefined : 'noopener noreferrer'" :aria-label="label(item)" class="social-link">
        <SocialLinkIcon :platform="item.platform" :icon="item.icon || ''" />
      </el-button>
    </el-tooltip>
  </div>
</template>

<style scoped>
.social-links { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.social-links .social-link { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; margin: 0; border: 1px solid #476276; border-radius: 3px; background: transparent; color: #c1cfdb; }
.social-links .social-link:hover, .social-links .social-link:focus-visible { color: #fff; border-color: #9cc9ef; background: #10293b; }
.social-links .social-link:focus-visible { outline: 2px solid #9cc9ef; outline-offset: 3px; }
.social-links .social-link :deep(> span) { display: inline-flex; align-items: center; justify-content: center; width: auto; height: auto; border: 0; color: inherit; font-size: 16px; }
</style>
