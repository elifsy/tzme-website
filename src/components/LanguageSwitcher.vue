<script setup>
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n/index.js'
import { availableLocales } from '../i18n/locales/index.js'

defineProps({ mobile: { type: Boolean, default: false } })
const { locale } = useI18n({ useScope: 'global' })
</script>

<template>
  <component :is="mobile ? 'div' : 'span'" :class="mobile ? 'hc-mobile-language' : 'hc-lang'">
    <template v-for="(option, index) in availableLocales" :key="option.code">
      <el-button
        v-if="mobile"
        :type="locale === option.code ? 'primary' : 'default'"
        @click="setLocale(option.code)"
      >{{ option.label }}</el-button>
      <template v-else>
        <span v-if="index" aria-hidden="true"> | </span>
        <button
          type="button"
          class="hc-lang-option"
          :class="{ active: locale === option.code }"
          @click="setLocale(option.code)"
        >{{ option.shortLabel }}</button>
      </template>
    </template>
  </component>
</template>
