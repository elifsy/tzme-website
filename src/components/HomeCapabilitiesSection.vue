<script setup>
import { computed } from 'vue'
import CapabilityIcon from './CapabilityIcon.vue'
import { capabilityText } from '../data/capabilities.js'

const props = defineProps({ configuration: { type: Object, default: null }, localeCode: { type: String, required: true }, preview: Boolean })
const field = name => capabilityText(props.configuration?.[name], props.localeCode)
const visibleSteps = computed(() => (props.configuration?.steps || []).filter(step => step.enabled))
</script>

<template>
  <section v-if="configuration && (configuration.enabled || preview)" :id="preview ? undefined : 'capabilities'" class="hc-sec hc-light hc-cap home-capabilities" :class="{ 'capabilities-preview': preview }">
    <div v-if="configuration.image" class="hc-cap-bg"><el-image :src="configuration.image" :alt="field('imageAlt')" fit="cover"><template #error><span /></template></el-image></div>
    <div class="hc-w hc-cap-in">
      <span class="hc-kick">{{ field('kicker') }}</span>
      <h2 class="hc-h2 capabilities-title"><span>{{ field('titleLine1') }}</span><span v-if="field('titleLine2')">{{ field('titleLine2') }}</span></h2>
      <p class="hc-p capabilities-description">{{ field('description') }}</p>
      <ol v-if="visibleSteps.length" class="capability-steps" :style="{ '--capability-columns': visibleSteps.length }" :aria-label="field('kicker')">
        <li v-for="(step, index) in visibleSteps" :key="step.id">
          <span class="capability-step-icon"><CapabilityIcon :icon-mode="step.iconMode" :icon-name="step.iconName" :icon="step.icon" /></span>
          <span class="capability-step-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="capability-step-label">{{ capabilityText(step.label, localeCode) }}</span>
        </li>
      </ol>
      <el-empty v-else-if="preview" :image-size="48" :description="$t('capabilitiesAdmin.noVisibleSteps')" />
    </div>
  </section>
</template>

<style scoped>
.home-capabilities .hc-cap-bg > .el-image { display: block; width: 100%; height: 100%; }
.capabilities-title { margin-top: 18px; overflow-wrap: anywhere; }
.capabilities-title > span { display: block; }
.capabilities-description { margin-top: 20px; max-width: 440px; white-space: pre-line; overflow-wrap: anywhere; }
.capability-steps { display: grid; grid-template-columns: repeat(var(--capability-columns), minmax(0, 1fr)); gap: 0; margin: 56px 0 0; padding: 0; list-style: none; border-top: 1px solid #dbe3e9; max-width: 820px; }
.capability-steps > li { display: flex; flex-direction: column; align-items: center; min-width: 0; padding: 26px 12px 4px; text-align: center; }
.capability-step-icon { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 40px; height: 40px; border: 1px solid #c3ced6; border-radius: 9px; background: #fff; }
.capability-step-number { display: block; margin-top: 16px; font-family: var(--f-din); font-size: 13px; font-weight: 700; line-height: 20px; color: #2375bf; }
.capability-step-label { display: block; width: 100%; margin-top: 5px; font-size: 10.5px; font-weight: 700; line-height: 1.6; letter-spacing: .12em; text-transform: uppercase; color: #10283a; overflow-wrap: anywhere; }
.home-capabilities.capabilities-preview { padding: 24px; border-radius: 10px; }
.capabilities-preview .hc-w { width: 100%; }
.capabilities-preview .hc-cap-bg { width: 60%; opacity: .12; }
.capabilities-preview .hc-h2 { font-size: 26px; line-height: 1.3; }
.capabilities-preview .hc-p { font-size: 13px; line-height: 1.8; color: #475f74; }
.capabilities-preview .capability-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 28px; }
.capabilities-preview .capability-steps > li { padding-top: 20px; }
.capabilities-preview .capability-step-label { font-size: 12px; letter-spacing: .03em; }
@media (max-width: 900px) { .capability-steps { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 450px) { .capability-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
