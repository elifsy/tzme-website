<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CapabilityIcon from './CapabilityIcon.vue'
import { capabilityText } from '../data/capabilities.js'

const props = defineProps({ configuration: { type: Object, default: null }, localeCode: { type: String, required: true }, preview: Boolean, embedded: Boolean })
const { t } = useI18n({ useScope: 'global' })
const ui = (key, values = {}) => t(`capabilitiesUi.${key}`, values, { locale: props.localeCode })
const field = name => capabilityText(props.configuration?.[name], props.localeCode)
const visibleSteps = computed(() => (props.configuration?.steps || []).filter(step => step.enabled))
const selectedId = ref('')
const activeStep = computed(() => visibleSteps.value.find(step => step.id === selectedId.value) || visibleSteps.value[0])
const activeIndex = computed(() => visibleSteps.value.findIndex(step => step.id === activeStep.value?.id))
const description = computed(() => activeStep.value?.description?.[props.localeCode] ?? '')
const section = ref(null)
const entered = ref(props.preview || props.embedded)
const motionEnabled = ref(false)
const instanceId = useId()
const panelId = `${instanceId}-process-detail`
const tabId = id => `${instanceId}-process-${id}`
const buttons = new Map()
let observer, stopObserving

watch(() => visibleSteps.value.map(step => step.id).join(','), () => {
  if (!visibleSteps.value.some(step => step.id === selectedId.value)) selectedId.value = visibleSteps.value[0]?.id || ''
}, { immediate: true })

function selectStep(id) { selectedId.value = id; entered.value = true }
function onPointerEnter(event, id) { if (event.pointerType === 'mouse') selectStep(id) }
function setButton(id, element) { element ? buttons.set(id, element) : buttons.delete(id) }
async function onStepKeydown(event, index) {
  const columns = getComputedStyle(event.currentTarget.closest('ol')).gridTemplateColumns.split(' ').length
  const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }
  let target
  if (event.key === 'Home') target = 0
  else if (event.key === 'End') target = visibleSteps.value.length - 1
  else if (event.key in offsets) target = (index + offsets[event.key] + visibleSteps.value.length) % visibleSteps.value.length
  else return
  event.preventDefault()
  const step = visibleSteps.value[target]
  selectStep(step.id)
  await nextTick()
  buttons.get(step.id)?.focus({ preventScroll: true })
}
onMounted(() => {
  motionEnabled.value = !props.preview && !props.embedded && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window
  if (!motionEnabled.value) entered.value = true
  stopObserving = watch(section, element => {
    observer?.disconnect()
    if (!element || !motionEnabled.value || entered.value) return
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { entered.value = true; observer.disconnect() }
    }, { threshold: 0.12 })
    observer.observe(element)
  }, { immediate: true, flush: 'post' })
})
onBeforeUnmount(() => { observer?.disconnect(); stopObserving?.(); buttons.clear() })
</script>

<template>
  <section v-if="configuration && (configuration.enabled || preview || embedded)" ref="section" :id="preview ? undefined : 'capabilities'" class="hc-sec hc-light hc-cap home-capabilities capabilities-interactive" :class="{ 'capabilities-preview': preview, 'has-entered': entered, 'motion-enabled': motionEnabled }">
    <div v-if="configuration.image" class="hc-cap-bg"><el-image :src="configuration.image" :alt="field('imageAlt')" fit="cover"><template #error><span /></template></el-image></div>
    <div class="hc-w hc-cap-in">
      <span class="hc-kick">{{ field('kicker') }}</span>
      <h2 class="hc-h2 capabilities-title"><span>{{ field('titleLine1') }}</span><span v-if="field('titleLine2')">{{ field('titleLine2') }}</span></h2>
      <p class="hc-p capabilities-description">{{ field('description') }}</p>
      <p v-if="visibleSteps.length" class="capability-select-hint"><span aria-hidden="true">↘</span>{{ ui('selectHint') }}</p>
      <ol v-if="visibleSteps.length" class="capability-steps" role="tablist" :style="{ '--capability-columns': visibleSteps.length }" :aria-label="field('kicker')">
        <li v-for="(step, index) in visibleSteps" :key="step.id" role="presentation">
          <button :id="tabId(step.id)" :ref="element => setButton(step.id, element)" type="button" role="tab" class="capability-step-button"
            :class="{ 'is-selected': activeStep?.id === step.id }" :style="{ '--step-delay': `${index * 45}ms` }"
            :aria-selected="activeStep?.id === step.id" :aria-controls="panelId" :tabindex="activeStep?.id === step.id ? 0 : -1"
            @pointerenter="onPointerEnter($event, step.id)" @focus="selectStep(step.id)" @click="selectStep(step.id)" @keydown="onStepKeydown($event, index)">
            <span class="capability-step-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="capability-step-icon"><CapabilityIcon :icon-mode="step.iconMode" :icon-name="step.iconName" :icon="step.icon" /></span>
            <span class="capability-step-label">{{ capabilityText(step.label, localeCode) }}</span>
            <span class="capability-step-state" aria-hidden="true">↓</span>
          </button>
        </li>
      </ol>
      <div v-if="activeStep" :id="panelId" class="capability-detail" role="tabpanel" :aria-labelledby="tabId(activeStep.id)" tabindex="0" aria-live="polite">
        <Transition name="process-detail" mode="out-in">
          <div :key="activeStep.id" class="capability-detail-inner">
            <div class="capability-detail-heading"><span class="capability-detail-number" aria-hidden="true">{{ String(activeIndex + 1).padStart(2, '0') }}</span><div><span class="capability-detail-kicker">{{ ui('stepPosition', { current: String(activeIndex + 1).padStart(2, '0'), total: String(visibleSteps.length).padStart(2, '0') }) }}</span><h3>{{ capabilityText(activeStep.label, localeCode) }}</h3></div></div>
            <p v-if="description" class="capability-detail-description">{{ description }}</p>
            <router-link class="capability-quality-link" to="/about#certificates-title">{{ ui('qualityLink') }}<span aria-hidden="true">↗</span></router-link>
          </div>
        </Transition>
      </div>
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
.home-capabilities:not(.capabilities-preview) .capability-step-icon { justify-content: flex-start; }
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

.home-capabilities.capabilities-interactive .capability-steps { margin-top: 18px; }
.home-capabilities.capabilities-interactive .capability-steps > li { display: block; padding: 0; border: 0; }
.capability-select-hint { display: flex; align-items: center; gap: 9px; margin: 26px 0 0; color: #6c8795; font-size: 12px; line-height: 1.8; }
.capability-select-hint > span { color: #087f91; font-size: 18px; }
.capability-step-button { position: relative; display: flex; flex-direction: column; align-items: flex-start; width: 100%; min-width: 0; height: 100%; padding: 20px 0 16px; border: 0; border-top: 1px solid #bfd7dd; background: transparent; color: #526c79; text-align: left; font: inherit; cursor: pointer; transition: background-color .22s, color .22s; }
.capability-step-button::before { position: absolute; content: ''; top: -1px; left: 0; width: 100%; height: 3px; background: #087f91; transform: scaleX(0); transform-origin: left; transition: transform .28s ease; }
.capability-step-button.is-selected { background: linear-gradient(180deg, #ffffff88, #ffffff00); color: #087f91; }
.capability-step-button.is-selected::before { transform: scaleX(1); }
.capability-step-button:focus-visible { outline: 2px solid #087f91; outline-offset: 5px; }
.home-capabilities .capability-step-button .capability-step-number { margin: 0 0 18px; color: inherit; font-variant-numeric: tabular-nums; }
.home-capabilities .capability-step-button .capability-step-icon { align-items: center; justify-content: flex-start; border: 0; background: transparent; color: inherit; transition: transform .22s ease; }
.capability-step-button :deep(.capability-icon) { color: inherit; }
.capability-step-button.is-selected .capability-step-icon { transform: translateY(-3px); }
.home-capabilities .capability-step-button .capability-step-label { margin-top: 5px; color: #123a50; }
.capability-step-state { position: absolute; top: 18px; right: 8px; color: #087f91; opacity: 0; transform: translateY(-4px); transition: opacity .22s, transform .22s; }
.is-selected .capability-step-state { opacity: 1; transform: translateY(0); }
.capability-detail { margin-top: 24px; padding: 26px 30px; border: 1px solid #d4e4e8; border-left: 3px solid #087f91; background: #fff; }
.capability-detail:focus-visible { outline: 2px solid #087f91; outline-offset: 4px; }
.capability-detail-inner { display: grid; grid-template-columns: 240px minmax(0, 1fr) auto; align-items: center; gap: 30px; min-height: 92px; }
.capability-detail-heading { display: flex; align-items: center; gap: 18px; min-width: 0; }
.capability-detail-number { color: #b6d0d7; font: 600 48px/1 var(--f-din); font-variant-numeric: tabular-nums; }
.capability-detail-kicker { color: #6c8795; font-size: 10px; line-height: 1.5; letter-spacing: 1px; }
.capability-detail-heading h3 { margin: 6px 0 0; color: #123a50; font: 600 21px/1.5 var(--f-ui); overflow-wrap: anywhere; }
.capability-detail-description { margin: 0; color: #526c79; font-size: 14px; line-height: 1.95; white-space: pre-line; overflow-wrap: anywhere; }
.capability-quality-link { display: inline-flex; align-items: center; justify-content: space-between; gap: 18px; color: #087f91; font-size: 12px; line-height: 1.8; }
.capability-quality-link > span { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border: 1px solid #d4e4e8; transition: transform .2s, border-color .2s; }
.capability-quality-link:hover > span { transform: translate(2px, -2px); border-color: #087f91; }
.process-detail-enter-active, .process-detail-leave-active { transition: opacity .14s ease, transform .14s ease; }
.process-detail-enter-from { opacity: 0; transform: translateY(5px); }
.process-detail-leave-to { opacity: 0; transform: translateY(-5px); }
.motion-enabled:not(.has-entered) .capability-step-button { opacity: 0; }
.motion-enabled.has-entered .capability-step-button { animation: process-step-enter .4s both; animation-delay: var(--step-delay); }
.capability-step-button:focus-visible { animation: none; opacity: 1; }
@keyframes process-step-enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.capabilities-preview .capability-step-button { padding-top: 16px; }
.capabilities-preview .capability-step-button .capability-step-label { font-size: 12px; }
.capabilities-preview .capability-detail { padding: 20px 16px; }
.capabilities-preview .capability-detail-inner { grid-template-columns: 1fr; gap: 18px; }
.capabilities-preview .capability-detail-description { font-size: 13px; }
.capabilities-preview .capability-quality-link { grid-column: auto; justify-self: start; }
@media (max-width: 1100px) {
  .capability-detail-inner { grid-template-columns: 200px minmax(0, 1fr); gap: 18px 24px; }
  .capability-quality-link { grid-column: 2; justify-self: start; }
}
@media (max-width: 700px) {
  .capability-select-hint { font-size: 11px; }
  .capability-detail { padding: 22px 20px; }
  .capability-detail-inner { grid-template-columns: 1fr; gap: 20px; min-height: 230px; }
  .capability-quality-link { grid-column: auto; justify-self: start; }
  .capability-detail-heading h3 { font-size: 20px; }
  .capability-detail-description { font-size: 13px; }
}
@media (prefers-reduced-motion: reduce) {
  .capability-step-button, .capability-step-button::before, .capability-step-icon, .capability-step-state, .capability-quality-link > span, .process-detail-enter-active, .process-detail-leave-active { transition: none !important; animation: none !important; }
  .motion-enabled .capability-step-button { opacity: 1; transform: none; }
  .capability-step-button.is-selected .capability-step-icon { transform: none; }
}
</style>
