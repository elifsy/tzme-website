<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { pdfPreviewLibrary, schedulePdfPreview } from '../utils/pdfPreview.js'

const props = defineProps({ source: { type: String, required: true }, label: { type: String, default: '资质原件第一页' } })
const root = ref(null), canvas = ref(null), state = ref('waiting')
let observer, visible = false, disposed = false, generation = 0, loadingTask, renderTask

async function load() {
  const current = ++generation
  state.value = 'loading'
  const previous = loadingTask
  renderTask?.cancel()
  loadingTask = undefined
  await previous?.destroy().catch(() => {})
  if (disposed || current !== generation) return
  try {
    await schedulePdfPreview(async () => {
      if (disposed || current !== generation) return
      const pdf = await pdfPreviewLibrary()
      if (disposed || current !== generation) return
      const task = pdf.getDocument({ url: props.source, isEvalSupported: false,
        cMapUrl: '/assets/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/assets/pdfjs/standard_fonts/',
        wasmUrl: '/assets/pdfjs/wasm/', iccUrl: '/assets/pdfjs/iccs/' })
      loadingTask = task
      try {
        const document = await task.promise
        const page = await document.getPage(1)
        if (disposed || current !== generation) return
        const original = page.getViewport({ scale: 1 })
        const viewport = page.getViewport({ scale: Math.min(1.5, 900 / Math.max(original.width, original.height)) })
        const target = canvas.value
        target.width = Math.ceil(viewport.width)
        target.height = Math.ceil(viewport.height)
        const rendering = page.render({ canvasContext: target.getContext('2d'), viewport, background: '#ffffff' })
        renderTask = rendering
        await rendering.promise
        if (!disposed && current === generation) state.value = 'ready'
      } finally {
        if (loadingTask === task) { loadingTask = undefined; renderTask = undefined }
        await task.destroy()
      }
    })
  } catch {
    if (!disposed && current === generation) state.value = 'error'
  }
}

watch(() => props.source, () => { if (visible) load(); else state.value = 'waiting' })
onMounted(() => {
  if (!('IntersectionObserver' in window)) { visible = true; load(); return }
  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { visible = true; observer.disconnect(); load() }
  }, { rootMargin: '180px' })
  observer.observe(root.value)
})
onBeforeUnmount(() => {
  disposed = true
  generation++
  observer?.disconnect()
  renderTask?.cancel()
  loadingTask?.destroy().catch(() => {})
})
</script>

<template>
  <span ref="root" class="pdf-first-page" :data-preview-state="state" :aria-busy="state === 'loading'">
    <canvas ref="canvas" v-show="state === 'ready'" role="img" :aria-label="label" />
    <span v-if="state !== 'ready'" class="pdf-preview-message">{{ state === 'error' ? '点击查看资质原件' : '正在加载资质预览…' }}</span>
  </span>
</template>

<style scoped>
.pdf-first-page { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; min-width: 0; }
.pdf-first-page canvas { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; background: #fff; box-shadow: 3px 5px 12px #123a5012; }
.pdf-preview-message { color: #688493; font: 11px/1.8 var(--f-ui); }
</style>
