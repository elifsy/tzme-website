<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  contactText,
  contactWebsiteUrl,
  useContactSettings,
} from "../services/contactSettings.js";
import { displayImage } from "../utils/responsiveImages.js";
const props = defineProps({
  includeHeadquarters: Boolean,
  aboutOnly: Boolean,
  showMedia: Boolean,
  collapsibleDetails: Boolean,
  configuration: { type: Object, default: null },
  localeCode: { type: String, default: "" },
});
const { t, locale } = useI18n({ useScope: "global" });
const displayLocale = computed(() => props.localeCode || locale.value);
const label = (key) => t(key, {}, { locale: displayLocale.value });
const { contactSettings } = useContactSettings();
const cards = computed(() => {
  const config = props.configuration || contactSettings.value;
  if (!config) return [];
  const list = config.subsidiaries
    .filter((item) => (props.aboutOnly ? item.showOnAbout : item.enabled))
    .map((item) => ({ ...item, cardKey: `subsidiary-${item.id}` }));
  return props.includeHeadquarters
    ? [
        {
          ...config.contact,
          id: "headquarters",
          cardKey: "headquarters",
          name: config.contact.headquarters,
          email: config.contact.emails.join(" · "),
        },
        ...list,
      ]
    : list;
});
</script>

<template>
  <div
    class="subsidiary-cards"
    :class="{
      'subsidiary-cards-wide': includeHeadquarters,
      'facility-cards': showMedia,
      'facility-cards-collapsible': collapsibleDetails,
    }"
  >
    <article
      v-for="item in cards"
      :key="item.cardKey"
      class="subsidiary-card"
      :class="{ 'facility-card': showMedia }"
      :data-entity-id="item.cardKey"
    >
      <el-image
        v-if="showMedia && item.facility?.image"
        class="facility-card-image"
        :src="displayImage(item.facility.image, 960)"
        loading="lazy"
        :alt="
          contactText(item.facility.imageAlt, displayLocale) ||
          contactText(item.facility.title, displayLocale) ||
          contactText(item.name, displayLocale)
        "
        :preview-src-list="[item.facility.image]"
        fit="cover"
        preview-teleported
        hide-on-click-modal
      />
      <div class="subsidiary-card-body">
        <h3>
          {{
            (showMedia && contactText(item.facility?.title, displayLocale)) ||
            contactText(item.name, displayLocale)
          }}
        </h3>
        <p
          v-if="
            showMedia && contactText(item.facility?.description, displayLocale)
          "
          class="facility-card-intro"
        >
          {{ contactText(item.facility.description, displayLocale) }}
        </p>
        <component
          :is="collapsibleDetails ? 'details' : 'div'"
          :class="{
            'facility-card-details': showMedia,
            'facility-collapsible': collapsibleDetails,
          }"
        >
          <summary v-if="collapsibleDetails">
            查看基地联系方式 <span aria-hidden="true">＋</span>
          </summary>
          <p
            v-if="
              showMedia &&
              contactText(item.facility?.title, displayLocale) &&
              contactText(item.facility.title, displayLocale) !==
                contactText(item.name, displayLocale)
            "
            class="facility-company-name"
          >
            {{ contactText(item.name, displayLocale) }}
          </p>
          <p class="facility-address">
            {{ contactText(item.address, displayLocale) }}
          </p>
          <p v-if="item.phone">
            <span>{{ label("site.telephone") }}:</span> {{ item.phone }}
          </p>
          <p v-if="item.email">
            <span>{{ label("site.email") }}:</span> {{ item.email }}
          </p>
          <p v-if="item.website">
            <a
              :href="contactWebsiteUrl(item.website)"
              target="_blank"
              rel="noopener noreferrer"
              >{{ item.website }}</a
            >
          </p>
        </component>
      </div>
    </article>
  </div>
</template>

<style scoped>
.subsidiary-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}
.subsidiary-cards-wide {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.subsidiary-card {
  padding: 24px;
  background: var(--navy-2);
  border: 1px solid var(--line-d);
  border-radius: 6px;
  min-width: 0;
}
.subsidiary-card h3 {
  font-size: 14px;
  color: #f5f8fb;
  line-height: 1.7;
  margin: 0;
  overflow-wrap: anywhere;
}
.subsidiary-card p {
  font-size: 13px;
  color: #c1cfdb;
  margin: 10px 0 0;
  line-height: 1.8;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.subsidiary-card a {
  color: #9cc9ef;
}
@media (max-width: 760px) {
  .subsidiary-cards,
  .subsidiary-cards-wide {
    grid-template-columns: 1fr;
  }
}
.facility-cards {
  gap: 28px;
  margin-top: 0;
}
.facility-cards .facility-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  background: #fff;
  border: 1px solid #dbe6e9;
  border-radius: 0;
  overflow: hidden;
}
.facility-card-image {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  flex-shrink: 0;
  background: #eaf3f5;
  cursor: zoom-in;
}
.facility-card .subsidiary-card-body {
  padding: 24px;
}
.facility-cards .facility-card h3 {
  color: #123a50;
  font-size: 21px;
  line-height: 1.5;
}
.facility-cards .facility-card p {
  color: #526c79;
}
.facility-cards .facility-card .facility-card-intro {
  font-size: 14px;
  line-height: 1.9;
  margin-top: 10px;
}
.facility-card-details {
  border-top: 1px solid #dbe6e9;
  margin-top: 22px;
  padding-top: 18px;
}
.facility-card-details > p:first-child {
  margin-top: 0;
}
.facility-cards .facility-card .facility-company-name {
  color: #123a50;
  font-weight: 600;
}
.facility-cards .facility-card a {
  color: #087f91;
}
.facility-cards-collapsible .facility-card {
  background: transparent;
  border: 0;
  overflow: visible;
}
@media (min-width: 761px) and (max-width: 1000px) {
  .facility-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .facility-cards {
    gap: 24px;
  }
  .facility-card .subsidiary-card-body {
    padding: 22px;
  }
}
</style>
