<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ days: { type: Array, default: () => [] } })
const { t } = useI18n({ useScope: 'global' })
const chart = ref(null)
const selected = ref(0)
watch(() => props.days, days => { selected.value = Math.max(0, days.length - 1) }, { immediate: true })
const max = computed(() => Math.max(1, ...props.days.map(day => Number(day.pageViews))))
const x = index => props.days.length === 1 ? 520 : 60 + index / Math.max(1, props.days.length - 1) * 920
const y = value => 210 - Number(value) / max.value * 180
const points = key => props.days.map((day, index) => `${x(index)},${y(day[key])}`).join(' ')
const active = computed(() => props.days[selected.value])
const ticks = computed(() => [...new Set([0, Math.floor((props.days.length - 1) / 2), props.days.length - 1])].filter(i => i >= 0))
function move(event) {
  const rect = chart.value.getBoundingClientRect()
  const position = (event.clientX - rect.left) / rect.width * 1000
  selected.value = Math.max(0, Math.min(props.days.length - 1, Math.round((position - 60) / 920 * (props.days.length - 1))))
}
function keyboard(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  selected.value = event.key === 'Home' ? 0 : event.key === 'End' ? props.days.length - 1
    : Math.max(0, Math.min(props.days.length - 1, selected.value + (event.key === 'ArrowLeft' ? -1 : 1)))
}
</script>

<template>
  <div class="analytics-trend">
    <div class="trend-legend"><span><i class="pv" />{{ $t('analyticsAdmin.pageViews') }}</span><span><i class="uv" />{{ $t('analyticsAdmin.visitors') }}</span></div>
    <svg ref="chart" viewBox="0 0 1000 255" role="img" tabindex="0" :aria-label="$t('analyticsAdmin.chartLabel')" @pointermove="move" @keydown="keyboard">
      <title>{{ $t('analyticsAdmin.trend') }}</title>
      <g v-for="step in [0, 1, 2, 3]" :key="step"><line x1="60" x2="980" :y1="30 + step * 60" :y2="30 + step * 60" stroke="#e3eaf2" /><text x="48" :y="35 + step * 60" text-anchor="end">{{ Math.round(max * (3 - step) / 3) }}</text></g>
      <polygon v-if="days.length" :points="`60,210 ${points('pageViews')} 980,210`" fill="#eaf2ff" />
      <polyline :points="points('pageViews')" fill="none" stroke="#276ed0" stroke-width="3" stroke-linejoin="round" />
      <polyline :points="points('visitors')" fill="none" stroke="#087d78" stroke-width="3" stroke-linejoin="round" />
      <g v-if="active"><line :x1="x(selected)" :x2="x(selected)" y1="30" y2="210" stroke="#8d9db3" stroke-dasharray="4 4" /><circle :cx="x(selected)" :cy="y(active.pageViews)" r="5" fill="#276ed0" stroke="#fff" stroke-width="2" /><circle :cx="x(selected)" :cy="y(active.visitors)" r="5" fill="#087d78" stroke="#fff" stroke-width="2" /></g>
      <text v-for="index in ticks" :key="index" :x="x(index)" y="241" :text-anchor="index === 0 ? 'start' : index === days.length - 1 ? 'end' : 'middle'">{{ days[index]?.day }}</text>
    </svg>
    <div v-if="active" class="trend-readout" aria-live="polite"><strong>{{ active.day }}</strong><span>{{ $t('analyticsAdmin.pageViews') }} <b>{{ active.pageViews }}</b></span><span>{{ $t('analyticsAdmin.visitors') }} <b>{{ active.visitors }}</b></span><span>{{ $t('analyticsAdmin.inquiries') }} <b>{{ active.inquiries }}</b></span></div>
  </div>
</template>

<style scoped>
.analytics-trend { min-width: 0; }
.trend-legend { display: flex; gap: 22px; margin: 12px 0 10px; color: #42566f; font-size: 13px; }
.trend-legend span { display: flex; align-items: center; gap: 7px; }
.trend-legend i { width: 10px; height: 10px; border-radius: 50%; }
.pv { background: #276ed0; } .uv { background: #087d78; }
svg { display: block; width: 100%; min-height: 170px; overflow: visible; }
svg:focus-visible { outline: 2px solid #276ed0; outline-offset: 4px; border-radius: 6px; }
svg text { font-size: 13px; fill: #53687f; }
.trend-readout { display: flex; align-items: center; flex-wrap: wrap; gap: 12px 22px; border-top: 1px solid #e5ebf3; padding-top: 14px; font-size: 12px; color: #4f647c; }
.trend-readout strong, .trend-readout b { color: #16334f; }
</style>
