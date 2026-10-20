<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { publicPreviewPath } from '../data/adminWorkspace.js'

const props = defineProps({ width: { type: Number, default: 1440 }, source: { type: String, default: '' }, maxHeight: { type: String, default: '520px' } })
const host = ref(null), frame = ref(null), target = shallowRef(null)
const available = ref(360), height = ref(320)
const scale = computed(() => Math.min(1, available.value / props.width))
const sourceUrl = computed(() => props.source ? publicPreviewPath(props.source) : undefined)
const documentMarkup = '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="admin-preview-document"><div id="preview-root"></div></body></html>'
let hostObserver, contentObserver, styleObserver, styleTimer, disposed = false
let copiedStyles = [], listeningDocument

function measure() {
  if (disposed) return
  const doc = frame.value?.contentDocument
  const root = props.source ? doc?.querySelector('#app') : doc?.getElementById('preview-root')
  if (!root) return
  const next = Math.max(80, Math.ceil(root.getBoundingClientRect().height), root.scrollHeight)
  if (Math.abs(next - height.value) > 1) height.value = next
}
function syncStyles() {
  const doc = frame.value?.contentDocument
  if (!doc || props.source || disposed) return
  copiedStyles.forEach(node => node.remove())
  copiedStyles = [...document.head.querySelectorAll('style,link[rel="stylesheet"]')].map(node => {
    const copy = node.cloneNode(true)
    if (copy.tagName === 'LINK') { copy.href = node.href; copy.addEventListener('load', measure, { once: true }) }
    doc.head.insertBefore(copy, doc.head.querySelector('[data-preview-base]'))
    return copy
  })
  nextTick(measure)
}
function blockNavigation(event) {
  const element = event.target.closest?.('a,input[type="file"],.el-upload')
  if (element || event.type !== 'click') { event.preventDefault(); event.stopImmediatePropagation() }
}
function detachDocument() {
  if (!listeningDocument) return
  for (const event of ['click', 'submit', 'drop', 'dragover']) listeningDocument.removeEventListener(event, blockNavigation, true)
  listeningDocument = undefined
}
async function ready() {
  const doc = frame.value?.contentDocument
  if (!doc || disposed) return
  detachDocument(); contentObserver?.disconnect()
  listeningDocument = doc
  for (const event of ['click', 'submit', 'drop', 'dragover']) doc.addEventListener(event, blockNavigation, true)
  if (!doc.head.querySelector('[data-preview-base]')) {
    const base = doc.createElement('base'); base.href = window.location.origin + '/'; doc.head.prepend(base)
    const style = doc.createElement('style'); style.dataset.previewBase = ''
    style.textContent = 'html,body{height:auto!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}body.admin-preview-document .hc-page{min-height:0!important}#preview-root{display:flow-root;width:100%}'
    doc.head.append(style)
  }
  doc.body.classList.add('admin-preview-document')
  if (!props.source) { syncStyles(); target.value = doc.getElementById('preview-root') }
  await nextTick()
  if (disposed) return
  contentObserver = new ResizeObserver(measure)
  contentObserver.observe(props.source ? doc.body : target.value)
  doc.fonts?.ready.then(measure)
  measure()
}
onMounted(() => {
  hostObserver = new ResizeObserver(entries => { available.value = Math.max(1, entries[0].contentRect.width); measure() })
  hostObserver.observe(host.value)
  styleObserver = new MutationObserver(() => { clearTimeout(styleTimer); styleTimer = setTimeout(syncStyles, 40) })
  styleObserver.observe(document.head, { childList: true, subtree: true, characterData: true })
})
watch(() => props.width, () => nextTick(measure))
onBeforeUnmount(() => { disposed = true; clearTimeout(styleTimer); hostObserver?.disconnect(); contentObserver?.disconnect(); styleObserver?.disconnect(); detachDocument(); target.value = null })
</script>

<template>
  <div ref="host" class="admin-preview-viewport" :style="{ maxHeight }">
    <div class="admin-preview-canvas" :style="{ width: `${width * scale}px`, height: `${height * scale}px` }">
      <iframe ref="frame" class="admin-preview-iframe" allowfullscreen :title="source ? '已保存官网效果预览' : '当前编辑内容实时预览'" :src="sourceUrl" :srcdoc="source ? undefined : documentMarkup"
        :style="{ width: `${width}px`, height: `${height}px`, transform: `scale(${scale})` }" @load="ready" />
      <Teleport v-if="target && !source" :to="target"><div class="design-site"><div class="hc-page"><slot /></div></div></Teleport>
    </div>
  </div>
</template>

<style scoped>
.admin-preview-viewport { width: 100%; min-width: 0; min-height: 90px; overflow: auto; scrollbar-gutter: stable; overscroll-behavior: contain; background: #eaf0f4; border: 1px solid #dce5ec; border-radius: 9px; }
.admin-preview-canvas { position: relative; margin-inline: auto; flex-shrink: 0; background: #fff; }
.admin-preview-iframe { display: block; position: absolute; inset: 0 auto auto 0; border: 0; transform-origin: top left; background: #fff; }
</style>
