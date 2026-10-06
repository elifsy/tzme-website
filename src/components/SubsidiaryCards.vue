<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { contactText, contactWebsiteUrl, useContactSettings } from '../services/contactSettings.js'
const props = defineProps({
  includeHeadquarters: Boolean,
  aboutOnly: Boolean,
  configuration: { type: Object, default: null },
  localeCode: { type: String, default: '' },
})
const { t, locale } = useI18n({ useScope: 'global' })
const displayLocale = computed(() => props.localeCode || locale.value)
const label = key => t(key, {}, { locale: displayLocale.value })
const { contactSettings } = useContactSettings()
const cards = computed(() => {
  const config = props.configuration || contactSettings.value
  if (!config) return []
  const list = config.subsidiaries
    .filter(item => props.aboutOnly ? item.showOnAbout : item.enabled)
    .map(item => ({ id: item.id, name: item.name, address: item.address, phone: item.phone, email: item.email }))
  return props.includeHeadquarters ? [{ ...config.contact, id: 'headquarters', name: config.contact.headquarters, email: config.contact.emails.join(' · ') }, ...list] : list
})
</script>

<template>
  <div class="subsidiary-cards" :class="{ 'subsidiary-cards-wide': includeHeadquarters }">
    <article v-for="item in cards" :key="item.id" class="subsidiary-card">
      <h3>{{ contactText(item.name, displayLocale) }}</h3>
      <p>{{ contactText(item.address, displayLocale) }}</p>
      <p v-if="item.phone"><span>{{ label('site.telephone') }}:</span> {{ item.phone }}</p>
      <p v-if="item.email"><span>{{ label('site.email') }}:</span> {{ item.email }}</p>
      <p v-if="item.website"><a :href="contactWebsiteUrl(item.website)" target="_blank" rel="noopener noreferrer">{{ item.website }}</a></p>
    </article>
  </div>
</template>

<style scoped>
.subsidiary-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
.subsidiary-cards-wide { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.subsidiary-card { padding: 24px; background: var(--navy-2); border: 1px solid var(--line-d); border-radius: 6px; min-width: 0; }
.subsidiary-card h3 { font-size: 14px; color: #f5f8fb; line-height: 1.7; margin: 0; overflow-wrap: anywhere; }
.subsidiary-card p { font-size: 13px; color: #c1cfdb; margin: 10px 0 0; line-height: 1.8; white-space: pre-line; overflow-wrap: anywhere; }
.subsidiary-card a { color: #9cc9ef; }
@media (max-width: 760px) { .subsidiary-cards, .subsidiary-cards-wide { grid-template-columns: 1fr; } }
</style>
