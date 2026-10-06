<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import worldDots from '../../assets/world-dots.svg'
import { globalReachText } from '../data/globalReach.js'

const props = defineProps({
  points: { type: Array, default: () => [] },
  description: { type: String, default: '' },
  localeCode: { type: String, default: '' },
  editable: Boolean,
  disabled: Boolean,
  selectedId: { type: String, default: '' },
})
const emit = defineEmits(['add', 'select', 'move', 'remove'])
const { t, locale } = useI18n({ useScope: 'global' })
const hoveredId = ref('')
const activeId = ref('')
const pointButtons = new Map()
const visibleId = computed(() => hoveredId.value || activeId.value || props.selectedId)
const language = computed(() => props.localeCode || locale.value)
const name = (point) => globalReachText(point.label, language.value)
const names = computed(() => props.points.map(name).join(language.value === 'zh' ? '、' : ', '))
function addPoint(event) {
  if (!props.editable) { activeId.value = ''; return }
  if (props.disabled || event.target.closest('button')) return
  const bounds = event.currentTarget.getBoundingClientRect()
  emit('add', { x: Math.round((event.clientX - bounds.left) / bounds.width * 10000) / 100,
    y: Math.round((event.clientY - bounds.top) / bounds.height * 10000) / 100 })
}
function keyboard(event, point) {
  if (event.key === 'Escape') { hoveredId.value = ''; activeId.value = ''; return }
  if (!props.editable || props.disabled) return
  const directions = { ArrowLeft: [-.5, 0], ArrowRight: [.5, 0], ArrowUp: [0, -.5], ArrowDown: [0, .5] }
  if (directions[event.key]) {
    event.preventDefault()
    const [x, y] = directions[event.key]
    const step = event.shiftKey ? 4 : 1
    emit('move', { id: point.id, x: Math.min(100, Math.max(0, point.x + x * step)), y: Math.min(100, Math.max(0, point.y + y * step)) })
  } else if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    emit('remove', point.id)
  }
}
defineExpose({ focusPoint: (id) => pointButtons.get(id)?.focus() })
</script>

<template>
  <figure class="world-reach-map" :aria-label="description">
    <div class="world-map-canvas" :class="{ 'is-editable': editable && !disabled }" @click="addPoint">
      <img :src="worldDots" alt="" draggable="false" class="world-map-land" />
      <button v-for="point in points" :key="point.id" type="button" class="world-map-point"
        :ref="(element) => element ? pointButtons.set(point.id, element) : pointButtons.delete(point.id)"
        :class="{ 'is-selected': selectedId === point.id }" :style="{ left: `${point.x}%`, top: `${point.y}%` }"
        :aria-label="editable ? t('admin.globalEditPoint', { name: name(point) }) : name(point)"
        :aria-pressed="editable ? selectedId === point.id : undefined" :disabled="disabled"
        @click.stop="editable ? emit('select', point.id) : activeId = activeId === point.id ? '' : point.id"
        @pointerenter="hoveredId = point.id" @pointerleave="hoveredId = ''"
        @focus="hoveredId = point.id" @blur="hoveredId = ''" @keydown="keyboard($event, point)">
        <span class="world-map-halo" aria-hidden="true"></span><span class="world-map-core" aria-hidden="true"></span>
        <span v-if="visibleId === point.id" class="world-map-label" :class="{ 'near-right': point.x > 70, 'near-top': point.y < 15 }">{{ name(point) }}</span>
      </button>
    </div>
    <figcaption class="world-map-caption">
      <span class="world-map-legend" aria-hidden="true"></span>
      <span>{{ t('site.globalMapLitLocations', { count: points.length }, { locale: language }) }}</span>
      <span class="world-map-sr-only">{{ names }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.world-reach-map { width: 100%; margin: 0; color: #c3d6e3; }
.world-map-canvas { position: relative; width: 100%; aspect-ratio: 1000 / 460; }
.world-map-canvas.is-editable { cursor: crosshair; }
.world-map-land { display: block; width: 100%; height: 100%; object-fit: contain; user-select: none; pointer-events: none; }
.world-map-point { position: absolute; display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: #fff; cursor: pointer; transform: translate(-50%, -50%); touch-action: manipulation; z-index: 1; }
.world-map-halo { position: absolute; inset: -7px; border-radius: 50%; background: radial-gradient(circle, #72ccff88 0%, #58baf933 35%, transparent 72%); pointer-events: none; }
.world-map-core { width: 7px; height: 7px; background: #e5f7ff; border: 1px solid #8ed9ff; border-radius: 50%; box-shadow: 0 0 8px 2px #64c7ffc4; pointer-events: none; }
.world-map-point:hover, .world-map-point:focus-visible, .world-map-point.is-selected { z-index: 3; }
.world-map-point:focus-visible { outline: 2px solid #ffb543; outline-offset: 3px; }
.world-map-point.is-selected .world-map-core { background: #ffb543; border-color: #ffd995; box-shadow: 0 0 10px 3px #e79c4880; }
.world-map-label { position: absolute; bottom: calc(100% + 6px); left: 50%; max-width: min(220px, 50vw); width: max-content; padding: 7px 10px; border: 1px solid #618299; border-radius: 5px; background: #102a3d; color: #fff; font-size: 13px; line-height: 1.5; white-space: normal; text-align: left; pointer-events: none; transform: translateX(-50%); box-shadow: 0 3px 16px #0005; }
.world-map-label.near-right { left: auto; right: 0; transform: none; }
.world-map-label.near-top { bottom: auto; top: calc(100% + 6px); }
.world-map-caption { display: flex; align-items: center; gap: 9px; margin-top: 12px; font-size: 12px; line-height: 1.7; }
.world-map-legend { width: 6px; height: 6px; border-radius: 50%; background: #b5e8ff; box-shadow: 0 0 6px #62c4ff; flex: none; }
.world-map-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (forced-colors: active) { .world-map-core, .world-map-legend { background: Highlight; border: 1px solid CanvasText; forced-color-adjust: none; } .world-map-label { background: Canvas; color: CanvasText; border-color: CanvasText; } }
</style>
