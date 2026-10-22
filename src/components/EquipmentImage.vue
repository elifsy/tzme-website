<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { knownEquipmentImage, measureEquipmentImage } from '../utils/equipmentPresentation.js'

const props = defineProps({
  record: { type: Object, required: true },
  alt: { type: String, default: '' },
  fallback: { type: String, default: '/assets/p-other-1.jpg' },
})
const stage = ref(null), metrics = ref(null), size = ref({ width: 0, height: 0 }), failed = ref([])
const source = computed(() => [props.record.presentationImage, props.record.image, props.fallback].find(src => src && !failed.value.includes(src)))
const frame = computed(() => {
  const m = metrics.value, b = m?.bounds, s = size.value
  if (!b || !s.width || !s.height) return {}
  const subjectWidth = b.maxX - b.minX + 1, subjectHeight = b.maxY - b.minY + 1
  const scale = Math.min(s.width * .88 / subjectWidth, s.height * .86 / subjectHeight)
  return { position: 'absolute', maxWidth: 'none', width: `${m.width * scale}px`, height: `${m.height * scale}px`,
    left: `${(s.width - subjectWidth * scale) / 2 - b.minX * scale}px`, top: `${(s.height - subjectHeight * scale) / 2 - b.minY * scale}px` }
})
watch(() => [props.record.presentationImage, props.record.image, props.fallback], () => { failed.value = [] })
watch(source, src => { metrics.value = knownEquipmentImage(src) }, { immediate: true })
function loaded(event) { metrics.value = measureEquipmentImage(event.target, source.value) }
function imageFailed() { if (source.value) failed.value = [...failed.value, source.value] }
let observer
onMounted(() => {
  observer = new ResizeObserver(([entry]) => { size.value = { width: entry.contentRect.width, height: entry.contentRect.height } })
  observer.observe(stage.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="stage" class="equipment-cutout">
    <span class="equipment-cutout-floor" aria-hidden="true" />
    <img v-if="source" :src="source" :alt="alt || record.titleZh || record.titleEn || ''" :style="frame" loading="lazy" decoding="async" @load="loaded" @error="imageFailed" />
    <span v-else class="equipment-cutout-empty">暂无设备图片</span>
  </div>
</template>

<style scoped>
.equipment-cutout { position: relative; width: 100%; aspect-ratio: 1.7; isolation: isolate; overflow: hidden; background: radial-gradient(ellipse at 50% 110%, #e5f0f4, #fff0 66%); }
.equipment-cutout-floor { position: absolute; bottom: 13%; left: 20%; right: 20%; height: 10%; border-radius: 50%; background: #274f6418; filter: blur(10px); z-index: -1; }
.equipment-cutout img { display: block; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 10px 7px #1c4d6218); }
.equipment-cutout-empty { display: grid; place-items: center; height: 100%; color: #6b8592; font-size: 12px; }
@media (max-width: 700px) { .equipment-cutout { aspect-ratio: 1.15; } }
</style>
