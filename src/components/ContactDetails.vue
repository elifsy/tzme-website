<script setup>
import { useI18n } from 'vue-i18n'
import { contactText, contactWebsiteUrl } from '../services/contactSettings.js'
defineProps({ contact: { type: Object, required: true } })
const { locale } = useI18n({ useScope: 'global' })
</script>

<template>
  <dl class="contact-details">
    <div><dt>{{ $t('site.address') }}</dt><dd>{{ contactText(contact.address, locale) }}</dd></div>
    <div v-if="contact.phone"><dt>{{ $t('site.telephone') }}</dt><dd>{{ contact.phone }}</dd></div>
    <div v-if="contact.fax"><dt>{{ $t('site.fax') }}</dt><dd>{{ contact.fax }}</dd></div>
    <div v-if="contact.emails.length"><dt>{{ $t('site.email') }}</dt><dd><a v-for="email in contact.emails" :key="email" :href="`mailto:${email}`">{{ email }}</a></dd></div>
    <div v-if="contact.website"><dt>{{ $t('site.website') }}</dt><dd><a :href="contactWebsiteUrl(contact.website)" target="_blank" rel="noopener noreferrer">{{ contact.website }}</a></dd></div>
    <div v-if="contactText(contact.port, locale)"><dt>{{ $t('site.port') }}</dt><dd>{{ contactText(contact.port, locale) }}</dd></div>
  </dl>
</template>

<style scoped>
.contact-details { margin: 26px 0 0; }
.contact-details > div { display: flex; justify-content: space-between; gap: 24px; padding: 15px 0; border-bottom: 1px solid var(--line-d2); }
.contact-details dt { font-size: 12px; color: #b9cad7; flex: 0 0 100px; }
.contact-details dd { margin: 0; font-size: 13px; color: #e3edf5; text-align: right; line-height: 1.8; white-space: pre-line; overflow-wrap: anywhere; }
.contact-details a { display: block; color: #a8d1f3; }
</style>
