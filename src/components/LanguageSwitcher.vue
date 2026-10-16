<script setup>
import { englishSiteUrl } from '../i18n/locales/index.js'

defineProps({ mobile: { type: Boolean, default: false } })
</script>

<template>
  <component :is="mobile ? 'div' : 'span'" :class="mobile ? 'hc-mobile-language' : 'hc-lang'" role="group" :aria-label="$t('site.languageSelection')">
    <a :href="englishSiteUrl" class="hc-lang-option" lang="en" aria-label="访问英文官网">{{ mobile ? 'English' : 'EN' }}</a>
    <span aria-hidden="true"> | </span>
    <span class="hc-lang-option active" lang="zh-CN" aria-current="page">{{ mobile ? '中文' : '中' }}</span>
  </component>
</template>
