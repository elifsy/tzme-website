<script setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useCapabilities } from "../services/capabilities.js";
import { capabilityText } from "../data/capabilities.js";
import { jAssets } from "../data/jDesign.js";
import { responsiveImage } from "../utils/responsiveImages.js";
defineProps({ compact: Boolean });
const { locale } = useI18n({ useScope: "global" });
const { capabilities, loadCapabilities } = useCapabilities();
const text = (key) => capabilityText(capabilities.value?.[key], locale.value);
const steps = computed(
  () => capabilities.value?.steps.filter((step) => step.enabled) || [],
);
onMounted(() => {
  if (!capabilities.value) loadCapabilities();
});
</script>

<template>
  <section
    v-if="capabilities?.enabled"
    class="manufacturing-quality"
    :class="{ 'is-compact': compact }"
    aria-labelledby="manufacturing-quality-title"
  >
    <figure class="manufacturing-quality-photo">
      <img
        v-bind="
          responsiveImage(jAssets.welding, '(max-width:700px) 100vw, 42vw')
        "
        alt="焊接加工现场"
        loading="lazy"
        decoding="async"
      />
      <figcaption v-if="!compact"></figcaption>
    </figure>
    <div class="manufacturing-quality-copy">
      <span class="refine-eyebrow">{{ text("kicker") }}</span>
      <h2 id="manufacturing-quality-title">
        {{ text("titleLine1") }}<br v-if="!compact" />{{ text("titleLine2") }}
      </h2>
      <p class="refine-description">{{ text("description") }}</p>
      <router-link v-if="compact" class="refine-link" to="/contact"
        >交流设备制造需求 <span aria-hidden="true">→</span></router-link
      >
      <ol v-else class="manufacturing-quality-steps">
        <li v-for="(step, index) in steps" :key="step.id">
          <span>{{ String(index + 1).padStart(2, "0") }}</span
          ><strong>{{ capabilityText(step.label, locale) }}</strong>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.manufacturing-quality {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}
.manufacturing-quality-photo {
  position: relative;
  margin: 0;
}
.manufacturing-quality-photo img {
  display: block;
  width: 100%;
  height: 380px;
  object-fit: cover;
}
.manufacturing-quality-photo figcaption {
  position: absolute;
  bottom: 0;
  inset-inline: 0;
  padding: 20px 22px;
  background: linear-gradient(transparent, #0b385bc4);
  color: #fff;
  font-size: 11px;
}
.manufacturing-quality h2 {
  margin: 14px 0 0;
  color: #123a50;
  font-size: 38px;
  line-height: 1.4;
  font-weight: 650;
  letter-spacing: -0.6px;
}
.manufacturing-quality-steps {
  list-style: none;
  padding: 0;
  margin: 28px 0 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px 25px;
}
.manufacturing-quality-steps li {
  display: flex;
  gap: 14px;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #cbdfe5;
  font-size: 13px;
  color: #123a50;
}
.manufacturing-quality-steps li > span {
  font-size: 10px;
  color: #087f91;
}
.manufacturing-quality-steps strong {
  font-weight: 500;
}
.is-compact {
  display: block;
  background: #f2f7f9;
}
.is-compact .manufacturing-quality-photo img {
  height: 185px;
}
.is-compact .manufacturing-quality-copy {
  padding: 22px 24px 24px;
}
.is-compact h2 {
  display: block;
  font-size: 22px;
  line-height: 1.55;
  margin: 8px 0 12px;
  letter-spacing: 0;
  font-weight: 600;
}
.is-compact .refine-description {
  margin: 0;
  font-size: 12px;
  line-height: 1.9;
}
.is-compact .refine-link {
  font-size: 11px;
  margin-top: 16px;
}
@media (max-width: 1100px) {
  .manufacturing-quality {
    gap: 40px;
  }
}
@media (max-width: 700px) {
  .manufacturing-quality {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .manufacturing-quality-photo {
    order: 2;
  }
  .manufacturing-quality-photo img {
    height: 235px;
  }
  .manufacturing-quality-photo figcaption {
    font-size: 9px;
    padding: 15px;
  }
  .manufacturing-quality h2 {
    font-size: 28px;
    line-height: 1.45;
    margin-top: 11px;
  }
  .manufacturing-quality-steps {
    gap: 12px 18px;
    margin-top: 22px;
  }
  .manufacturing-quality-steps li {
    font-size: 12px;
  }
  .is-compact h2 {
    font-size: 21px;
  }
  .is-compact .manufacturing-quality-copy {
    padding: 19px 20px 20px;
  }
}
</style>
