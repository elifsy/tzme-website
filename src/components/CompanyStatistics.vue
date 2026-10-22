<script setup>
import { useI18n } from 'vue-i18n'
import { aboutText } from '../data/aboutTzme.js'
defineProps({ entries: { type: Array, default: () => [] }, compact: Boolean })
const { locale } = useI18n({ useScope: 'global' })
</script>

<template>
  <dl class="company-statistics" :class="{ 'is-compact': compact }">
    <div v-for="(entry, index) in entries" :key="index">
      <dt>{{ aboutText(entry.label, locale) }}</dt>
      <dd>{{ aboutText(entry.value, locale) }}<small v-if="aboutText(entry.suffix, locale)">{{ aboutText(entry.suffix, locale) }}</small></dd>
    </div>
  </dl>
</template>

<style scoped>
.company-statistics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; padding-block: 27px; border-block: 1px solid #d7e5e9; }
.company-statistics>div { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px 13px; padding-inline: 24px; border-right: 1px solid #d7e5e9; min-width: 0; }
.company-statistics>div:first-child { padding-left: 0; }.company-statistics>div:last-child { border: 0; padding-right: 0; }
.company-statistics dt { color: #6a8490; font-size: 11px; line-height: 1.7; }
.company-statistics dd { order: -1; margin: 0; color: #123a50; font-size: 31px; font-weight: 600; line-height: 1.2; white-space: nowrap; }
.company-statistics small { font-size: 12px; margin-left: 4px; color: #087f91; }
.company-statistics.is-compact { gap: 14px; margin-top: 35px; padding: 24px 0 0; border-bottom: 0; }
.is-compact>div { display: flex; flex-direction: column; border: 0; padding: 0; gap: 10px; }
.is-compact dd { font-size: 25px; }.is-compact dt,.is-compact small { font-size: 10px; }
@media(max-width:1100px) { .company-statistics>div { flex-direction: column; gap: 9px; }.is-compact dd { font-size: 20px; } }
@media(max-width:700px) {
  .company-statistics { grid-template-columns: 1fr 1fr; gap: 22px 0; padding-block: 23px; }
  .company-statistics>div { padding-left: 20px; }.company-statistics>div:nth-child(odd) { padding-left: 0; }.company-statistics>div:nth-child(even) { border: 0; }
  .company-statistics dd { font-size: 27px; }.company-statistics dt { font-size: 10px; }
  .company-statistics.is-compact { gap: 22px 18px; margin-top: 25px; padding-top: 20px; }.is-compact>div { padding: 0; }.is-compact dd { font-size: 24px; }
}
</style>
