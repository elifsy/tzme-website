<script setup>
import { aboutText } from '../data/aboutTzme.js'

defineProps({
  configuration: { type: Object, required: true },
  localeCode: { type: String, default: 'en' },
  headingTag: { type: String, default: 'h2' },
  headingId: { type: String, default: undefined },
})
</script>

<template>
  <div class="about-tzme-content">
    <span class="hc-kick">{{ aboutText(configuration.kicker, localeCode) }}</span>
    <component :is="headingTag" :id="headingId" class="hc-h2 about-tzme-title">
      {{ aboutText(configuration.titleLine1, localeCode) }}<template v-if="aboutText(configuration.titleLine2, localeCode)"><br />{{ aboutText(configuration.titleLine2, localeCode) }}</template>
    </component>
    <p class="hc-p about-tzme-description catalog-intro-description">{{ aboutText(configuration.description, localeCode) }}</p>
    <p v-if="aboutText(configuration.description2, localeCode)" class="hc-p about-tzme-description catalog-intro-description">{{ aboutText(configuration.description2, localeCode) }}</p>
    <div class="hc-band about-tzme-entries">
      <div v-for="(entry, index) in configuration.entries" :key="index" class="about-tzme-entry">
        <div class="hc-stat">{{ aboutText(entry.value, localeCode) }}<u v-if="aboutText(entry.suffix, localeCode)">{{ aboutText(entry.suffix, localeCode) }}</u></div>
        <div class="hc-stat-cap">{{ aboutText(entry.label, localeCode) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-tzme-content { min-width: 0; }
.about-tzme-title { margin-top: 18px; color: var(--txt); overflow-wrap: anywhere; }
.about-tzme-description { max-width: 540px; margin-top: 20px; white-space: pre-line; overflow-wrap: anywhere; }
.about-tzme-description + .about-tzme-description { margin-top: 18px; }
.about-tzme-entries { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 40px; }
.about-tzme-entries > div, .about-tzme-entries > div + div { min-width: 0; padding: 24px 10px 4px; }
.about-tzme-entries > div:first-child { padding-left: 0; }
.about-tzme-entries > div:last-child { padding-right: 0; }
.about-tzme-entries .hc-stat { font-size: clamp(20px, 1.8vw, 28px); line-height: 1.3; white-space: normal; overflow-wrap: anywhere; }
.about-tzme-entries .hc-stat u { margin-left: 4px; font-size: 12px; white-space: normal; }
.about-tzme-entries .hc-stat-cap { margin-top: 10px; color: #bccddb; font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; }
@media (max-width: 700px) {
  .about-tzme-entries { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 0; }
  .about-tzme-entries > div:nth-child(2n) { border-right: 0; padding-right: 0; }
  .about-tzme-entries > div:nth-child(2n + 1) { padding-left: 0; }
}
</style>
