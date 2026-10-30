<script setup>
import { computed, defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
const WorldReachMap = defineAsyncComponent(() => import('./WorldReachMap.vue'));
import { globalReachText, isGlobalReachUrl } from "../data/globalReach.js";
import { trackEvent } from "../services/analytics.js";
import { displayImage } from "../utils/responsiveImages.js";

const props = defineProps({
  configuration: { type: Object, default: null },
  localeCode: { type: String, default: "" },
  preview: Boolean,
});
const { locale } = useI18n({ useScope: "global" });
const language = computed(() => props.localeCode || locale.value);
const field = (key) =>
  globalReachText(props.configuration?.[key], language.value);
const buttonLink = computed(() => props.configuration?.buttonLink || "");
const hasButton = computed(
  () => props.configuration?.showButton && isGlobalReachUrl(buttonLink.value),
);
function trackLocation(id) {
  if (!props.preview) trackEvent("map_location", id);
}
</script>

<template>
  <section
    v-if="configuration && (configuration.enabled || preview)"
    id="global-reach"
    class="hc-sec j-global global-reach"
    aria-labelledby="global-reach-title"
  >
    <div class="hc-w global-reach-layout" :class="{ 'has-custom-map': configuration.mapMode !== 'points' }">
      <div class="global-reach-copy">
          <span class="hc-kick global-reach-kicker"
            ><i aria-hidden="true" />{{ field("kicker") }}</span
          >
          <h2 id="global-reach-title" class="hc-h2 global-reach-title">
            <span>{{ field("titleLine1") }}</span
            ><span v-if="field('titleLine2')">{{ field("titleLine2") }}</span>
          </h2>
        <div class="global-reach-intro">
          <p v-if="field('description')" class="hc-p">
            {{ field("description") }}
          </p>
        </div>
        <dl class="global-reach-statistics">
          <div
            v-for="(statistic, index) in configuration.statistics"
            :key="index"
            class="global-reach-statistic"
          >
            <dt class="hc-stat-cap">{{ globalReachText(statistic.label, language) }}</dt>
            <dd class="hc-stat">
              {{ statistic.value
              }}<span v-if="statistic.suffix">{{ statistic.suffix }}</span>
            </dd>
          </div>
        </dl>
        <component
            :is="buttonLink.startsWith('/') ? RouterLink : 'a'"
            v-if="hasButton"
            class="global-reach-link"
            v-bind="
              buttonLink.startsWith('/')
                ? { to: buttonLink }
                : { href: buttonLink }
            "
          >
            {{ field("buttonText") }}<span aria-hidden="true">↗</span>
          </component>
      </div>
      <div class="global-reach-map" :class="{ 'is-image': configuration.mapMode !== 'points' }">
        <WorldReachMap v-if="configuration.mapMode === 'points'" appearance="blue-gray" :points="configuration.mapPoints" :description="field('imageAlt')" :locale-code="language" @activate="trackLocation" />
        <el-image v-else :src="displayImage(configuration.image)" :alt="field('imageAlt')" fit="contain" loading="lazy">
          <template #error><span class="global-reach-image-error">{{ field('imageAlt') }}</span></template>
        </el-image>
      </div>
    </div>
  </section>
</template>

<style scoped src="../style/global-reach.css"></style>
