<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import WorldReachMap from './WorldReachMap.vue'
import { globalReachText, isGlobalReachUrl } from '../data/globalReach.js'

const props = defineProps({
  configuration: { type: Object, default: null },
  localeCode: { type: String, default: '' },
  preview: Boolean,
})
const { locale } = useI18n({ useScope: 'global' })
const language = computed(() => props.localeCode || locale.value)
const field = key => globalReachText(props.configuration?.[key], language.value)
const buttonLink = computed(() => props.configuration?.buttonLink || '')
const hasButton = computed(() => props.configuration?.showButton && isGlobalReachUrl(buttonLink.value))
const mapHint = computed(() => language.value === 'zh' ? '点击标记，查看业务位置' : 'Select a marker to explore our reach')
</script>

<template>
  <section v-if="configuration && (configuration.enabled || preview)" id="global-reach" class="hc-sec j-global global-reach" aria-labelledby="global-reach-title">
    <div class="hc-w">
      <header class="global-reach-header">
        <div class="global-reach-heading">
          <span class="hc-kick global-reach-kicker"><i aria-hidden="true"/>{{ field('kicker') }}</span>
          <h2 id="global-reach-title" class="hc-h2 global-reach-title"><span>{{ field('titleLine1') }}</span><span v-if="field('titleLine2')">{{ field('titleLine2') }}</span></h2>
        </div>
        <div class="global-reach-intro">
          <p v-if="field('description')" class="hc-p">{{ field('description') }}</p>
          <component :is="buttonLink.startsWith('/') ? RouterLink : 'a'" v-if="hasButton" class="global-reach-link" v-bind="buttonLink.startsWith('/') ? { to: buttonLink } : { href: buttonLink }">
            {{ field('buttonText') }}<span aria-hidden="true">↗</span>
          </component>
        </div>
      </header>

      <div class="global-reach-body">
        <div class="global-reach-map" :class="{ 'is-image': configuration.mapMode !== 'points' }">
          <span class="global-reach-map-corner" aria-hidden="true"/>
          <WorldReachMap v-if="configuration.mapMode === 'points'" :points="configuration.mapPoints" :description="field('imageAlt')" :locale-code="language">
            <template v-if="configuration.mapPoints?.length" #caption>{{ mapHint }}</template>
          </WorldReachMap>
          <el-image v-else :src="configuration.image" :alt="field('imageAlt')" fit="contain"><template #error><span class="global-reach-image-error">{{ field('imageAlt') }}</span></template></el-image>
        </div>
        <dl class="global-reach-statistics">
          <div v-for="(statistic, index) in configuration.statistics" :key="index" class="global-reach-statistic">
            <dt>{{ globalReachText(statistic.label, language) }}</dt>
            <dd>{{ statistic.value }}<span v-if="statistic.suffix">{{ statistic.suffix }}</span></dd>
            <span class="global-reach-statistic-index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<style scoped>
.global-reach.hc-sec { padding: 72px 0; background: linear-gradient(120deg, #e5eef1, #eaf1f3); }
.global-reach-header { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, .6fr); align-items: end; gap: 70px; margin-bottom: 38px; }
.global-reach .global-reach-kicker { display: inline-flex; align-items: center; gap: 12px; color: #4c6977; font-size: 11px; letter-spacing: 1.5px; }
.global-reach-kicker i { display: block; width: 26px; height: 2px; background: #087f91; }
.global-reach .global-reach-title { margin: 18px 0 0; color: #123a50; font-size: 42px; line-height: 1.28; letter-spacing: -1px; overflow-wrap: anywhere; }
.global-reach-title > span { display: block; }
.global-reach-intro { min-width: 0; padding-bottom: 2px; }
.global-reach-intro .hc-p { margin: 0; max-width: 430px; color: #526c79; font-size: 14px; line-height: 1.95; white-space: pre-line; overflow-wrap: anywhere; }
.global-reach-link { display: inline-flex; align-items: center; gap: 24px; margin-top: 20px; color: #086c7d; font-size: 13px; font-weight: 600; }
.global-reach-link > span { display: grid; place-items: center; width: 34px; height: 34px; font-size: 18px; font-weight: 400; transition: transform .2s; }
.global-reach-link:hover > span { transform: translate(2px, -2px); }
.global-reach-link:focus-visible { outline: 2px solid #087f91; outline-offset: 5px; }
.global-reach-body { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 50px; align-items: stretch; }
.global-reach-map { position: relative; display: flex; align-items: center; min-width: 0; padding: 30px 28px 20px; border: 1px solid #bfd2da; background: radial-gradient(ellipse at 48% 45%, #dfeaec80, transparent 75%), #d5e2e7; }
.global-reach-map::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(#a5c2cc15 1px, transparent 1px), linear-gradient(90deg, #a5c2cc15 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; }
.global-reach-map-corner { position: absolute; inset: -1px auto auto -1px; width: 28px; height: 28px; border-top: 2px solid #087f91; border-left: 2px solid #087f91; }
.global-reach-map > .el-image { width: 100%; position: relative; }
.global-reach-image-error { display: grid; min-height: 250px; place-items: center; color: #647f8b; }
.global-reach-map :deep(.world-reach-map) { position: relative; color: #486675; }
.global-reach-map :deep(.world-map-land) { opacity: .8; filter: grayscale(1) brightness(.72); mix-blend-mode: multiply; }
.global-reach-map :deep(.world-map-caption) { gap: 9px; margin-top: 16px; padding-top: 15px; border-top: 1px solid #b8cdd6; font-size: 11px; line-height: 1.8; }
.global-reach-map :deep(.world-map-core) { width: 7px; height: 7px; background: #087f91; border: 0; box-shadow: 0 0 0 4px #087f9114; }
.global-reach-map :deep(.world-map-halo) { inset: 0; border: 1px solid #087f9138; background: #087f910c; transition: transform .2s, background-color .2s; }
.global-reach-map :deep(.world-map-point.is-active .world-map-halo) { transform: scale(1.3); background: #087f9116; }
.global-reach-map :deep(.world-map-point:focus-visible) { outline-color: #087f91; }
.global-reach-map :deep(.world-map-label) { z-index: 4; border: 0; border-radius: 2px; background: #123a50; color: #fff; box-shadow: 0 6px 18px #123a501a; font-size: 12px; }
.global-reach-map :deep(.world-map-legend) { width: 5px; height: 5px; background: #087f91; box-shadow: 0 0 0 3px #087f9110; }
.global-reach-statistics { display: grid; grid-template-rows: repeat(3, minmax(0, 1fr)); margin: 0; padding: 0; }
.global-reach-statistic { position: relative; display: flex; flex-direction: column; justify-content: center; padding: 22px 32px 22px 0; border-top: 1px solid #bed0d8; min-width: 0; }
.global-reach-statistic:last-child { border-bottom: 1px solid #bed0d8; }
.global-reach-statistic dt { order: 1; margin-top: 10px; color: #4c6977; font-size: 13px; line-height: 1.7; overflow-wrap: anywhere; }
.global-reach-statistic dd { margin: 0; color: #123a50; font: 600 48px/1.1 var(--f-din, var(--f-ui)); letter-spacing: -1.5px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.global-reach-statistic dd > span { display: inline-block; margin-left: 7px; color: #087f91; font: 400 18px/1.4 var(--f-ui); letter-spacing: 0; }
.global-reach-statistic-index { position: absolute; top: 26px; right: 0; color: #8da7b2; font: 400 10px/1.5 var(--f-ui); }
@media (max-width: 1050px) {
  .global-reach-header { grid-template-columns: minmax(0, 1fr) minmax(0, .8fr); gap: 40px; }
  .global-reach-body { grid-template-columns: minmax(0, 1fr) 200px; gap: 30px; }
  .global-reach-map { padding: 24px 20px 18px; }
  .global-reach-statistic dd { font-size: 40px; }
  .global-reach-statistic { padding-block: 18px; }
}
@media (max-width: 800px) {
  .global-reach.hc-sec { padding: 52px 0; }
  .global-reach-header { grid-template-columns: 1fr; gap: 22px; margin-bottom: 28px; }
  .global-reach .global-reach-title { font-size: 34px; }
  .global-reach-intro .hc-p { max-width: 100%; }
  .global-reach-link { margin-top: 15px; }
  .global-reach-body { grid-template-columns: 1fr; gap: 26px; }
  .global-reach-statistics { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: auto; }
  .global-reach-statistic { justify-content: flex-start; padding: 20px 14px 0; border-top: 1px solid #bed0d8; border-right: 1px solid #bed0d8; }
  .global-reach-statistic:first-child { padding-left: 0; }
  .global-reach-statistic:last-child { border-right: 0; border-bottom: 0; padding-right: 0; }
  .global-reach-statistic-index { display: none; }
  .global-reach-statistic dd { font-size: 36px; }
  .global-reach-statistic dt { margin-top: 9px; font-size: 11px; }
}
@media (max-width: 450px) {
  .global-reach .global-reach-title { font-size: 32px; }
  .global-reach-intro .hc-p { font-size: 13px; }
  .global-reach-map { padding: 20px 12px 14px; }
  .global-reach-map :deep(.world-map-caption) { font-size: 10px; margin-top: 14px; padding-top: 12px; }
  .global-reach-statistic { padding-inline: 10px; }
  .global-reach-statistic dd { font-size: 32px; }
  .global-reach-statistic dd > span { font-size: 13px; margin-left: 4px; }
  .global-reach-statistic dt { font-size: 10px; }
}
@media (prefers-reduced-motion: reduce) { .global-reach-link > span, .global-reach-map :deep(.world-map-halo) { transition: none; } }
</style>
