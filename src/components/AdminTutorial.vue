<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { adminTutorials } from '../data/adminTutorial.js';
import { adminModules } from '../data/adminWorkspace.js';

const props = defineProps({ prepareStep: { type: Function, required: true }, contextKey: { type: String, default: '' }, busy: Boolean });
const active = ref(false), current = ref(0), moduleKey = ref(''), preparing = ref(false);
const card = ref(null), highlight = ref(null), viewport = ref({});
const steps = computed(() => adminTutorials[moduleKey.value] || []);
const step = computed(() => steps.value[current.value]);
let requestId = 0, disposed = false, target, observer, frame, previousFocus;
const delay = () => new Promise(resolve => setTimeout(resolve, 50));

function updateGeometry() {
  const view = window.visualViewport;
  // Fixed positioning uses the layout viewport, excluding desktop scrollbars.
  const layoutWidth = document.documentElement.clientWidth, layoutHeight = document.documentElement.clientHeight;
  const height = view?.height || layoutHeight, width = view?.width || layoutWidth;
  const top = view?.offsetTop || 0, left = view?.offsetLeft || 0;
  viewport.value = { '--tutorial-height': `${height}px`, '--tutorial-width': `${width}px`,
    '--tutorial-bottom': `${Math.max(0, layoutHeight - top - height) + 12}px`,
    '--tutorial-right': `${Math.max(0, layoutWidth - left - width) + 12}px` };
  const rect = target?.getBoundingClientRect();
  const x = Math.max(left + 3, (rect?.left || 0) - 5), y = Math.max(top + 3, (rect?.top || 0) - 5);
  const right = Math.min(left + width - 3, (rect?.right || 0) + 5), bottom = Math.min(top + height - 3, (rect?.bottom || 0) + 5);
  highlight.value = rect && right > x && bottom > y ? { left: `${x}px`, top: `${y}px`, width: `${right - x}px`, height: `${bottom - y}px` } : null;
}
function scheduleGeometry() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(updateGeometry);
}
function setTarget(element) {
  observer?.disconnect(); target = element;
  if (target && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(scheduleGeometry); observer.observe(target);
  }
  updateGeometry();
}
function findTarget(selector) {
  const element = document.querySelector(selector || '.admin-heading');
  const rect = element?.getBoundingClientRect();
  return rect?.width && rect?.height ? element : undefined;
}
async function move(index) {
  if (preparing.value || props.busy || !active.value) return;
  if (index >= steps.value.length) { close(); return; }
  if (index < 0) return;
  const request = ++requestId;
  preparing.value = true;
  try {
    if (await props.prepareStep(steps.value[index], () => request === requestId && active.value) === false) return;
    if (disposed || request !== requestId || !active.value) return;
    current.value = index; setTarget(undefined);
    await nextTick();
    let element;
    for (let i = 0; i < 40; i++) {
      if (disposed || request !== requestId || !active.value) return;
      element = findTarget(step.value?.target);
      if (element) break;
      await delay();
    }
    element ||= findTarget('.admin-heading'); setTarget(element);
    const rect = element?.getBoundingClientRect();
    if (rect && (rect.top < 60 || rect.bottom > window.innerHeight - 20)) {
      element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      scheduleGeometry();
    }
  } catch {
    if (!disposed && active.value) ElMessage.warning('暂时无法定位这项配置，可跳过教学后从左侧导航进入。');
  } finally {
    if (request === requestId) preparing.value = false;
  }
}
async function start(module) {
  if (props.busy || !adminTutorials[module]) return;
  close(); previousFocus = document.activeElement;
  moduleKey.value = module; current.value = 0; active.value = true;
  updateGeometry(); await nextTick();
  card.value?.focus({ preventScroll: true }); await move(0);
}
function close() {
  requestId++; active.value = false; preparing.value = false;
  observer?.disconnect(); target = undefined; highlight.value = null; cancelAnimationFrame(frame);
  if (card.value?.contains(document.activeElement) && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
}
function onKey(event) {
  if (!active.value || event.defaultPrevented) return;
  if (event.key === 'Escape') { close(); return; }
  if (!card.value?.contains(event.target) || event.target?.matches?.('input,textarea,select')) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); move(current.value + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); move(current.value - 1); }
}
watch(() => props.contextKey, async () => {
  await nextTick();
  if (active.value && !preparing.value) setTarget(findTarget(step.value?.target) || findTarget('.admin-heading'));
});
onMounted(() => {
  window.addEventListener('keydown', onKey); window.addEventListener('scroll', scheduleGeometry, true);
  window.addEventListener('resize', scheduleGeometry);
  window.visualViewport?.addEventListener('resize', scheduleGeometry); window.visualViewport?.addEventListener('scroll', scheduleGeometry);
});
onBeforeUnmount(() => {
  disposed = true; close();
  window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', scheduleGeometry, true);
  window.removeEventListener('resize', scheduleGeometry);
  window.visualViewport?.removeEventListener('resize', scheduleGeometry); window.visualViewport?.removeEventListener('scroll', scheduleGeometry);
});
defineExpose({ start, close, active });
</script>

<template>
  <Teleport to="body">
    <div v-if="active && highlight" class="admin-tutorial-highlight" :style="highlight" aria-hidden="true" />
    <section v-if="active" ref="card" class="admin-tutorial-tour" :style="viewport" role="dialog" aria-modal="false"
      aria-labelledby="admin-tutorial-title" aria-describedby="admin-tutorial-description" tabindex="-1" :data-tutorial-module="moduleKey">
      <header><span>{{ adminModules[moduleKey]?.label }} · 新手教程</span><button type="button" aria-label="关闭教程" @click="close">×</button></header>
      <div class="admin-tutorial-progress" :data-tutorial-step="current" aria-live="polite">{{ current + 1 }} / {{ steps.length }} <strong id="admin-tutorial-title">{{ step?.title }}</strong></div>
      <div class="admin-tutorial-scroll">
        <p id="admin-tutorial-description">{{ step?.description }}</p>
        <ul v-if="step?.tips?.length"><li v-for="tip in step.tips" :key="tip">{{ tip }}</li></ul>
        <p v-if="preparing" class="admin-tutorial-note">正在定位配置位置…</p>
      </div>
      <footer class="admin-tutorial-controls">
        <el-button text class="admin-tutorial-skip" @click="close">跳过教学</el-button>
        <div><el-button v-if="current > 0" :disabled="preparing || busy" class="admin-tutorial-prev" @click="move(current - 1)">上一步</el-button>
          <el-button type="primary" :loading="preparing" :disabled="busy" class="admin-tutorial-next" @click="move(current + 1)">{{ current === steps.length - 1 ? '完成教程' : '下一步' }}</el-button></div>
      </footer>
    </section>
  </Teleport>
</template>

<style>
.admin-tutorial-highlight { position:fixed; z-index:3990; pointer-events:none; box-sizing:border-box; border:2px solid #2b9caf; border-radius:9px; box-shadow:0 0 0 4px #39a4b51a; }
.admin-tutorial-tour { --el-color-primary:#2875bb; position:fixed; z-index:4000; right:var(--tutorial-right,12px); bottom:var(--tutorial-bottom,12px); display:flex; flex-direction:column; box-sizing:border-box; width:min(390px,calc(var(--tutorial-width,100vw) - 24px)); max-height:min(430px,calc(var(--tutorial-height,100dvh) - 24px)); padding:18px 20px; overflow:hidden; border:1px solid #c8dce8; border-radius:14px; background:#fff; box-shadow:0 12px 45px #17394e30; color:#21465d; font-family:"Microsoft YaHei","Segoe UI",sans-serif; outline:none; }
.admin-tutorial-tour header { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-shrink:0; color:#6d8594; font-size:11px; }
.admin-tutorial-tour header button { display:grid; place-items:center; width:28px; height:28px; margin:-6px -8px -6px 0; padding:0; border:0; border-radius:5px; background:transparent; color:#6d8594; font-size:22px; cursor:pointer; }
.admin-tutorial-tour header button:hover { background:#eff5f9; }
.admin-tutorial-tour button:focus-visible { outline:2px solid #238197; outline-offset:2px; }
.admin-tutorial-progress { display:flex; align-items:baseline; gap:10px; flex-shrink:0; margin:14px 0 6px; color:#238197; font-size:12px; }
.admin-tutorial-progress strong { color:#183e56; font-size:17px; line-height:1.5; font-weight:650; }
.admin-tutorial-scroll { min-height:0; overflow-y:auto; overscroll-behavior:contain; scrollbar-gutter:stable; }
.admin-tutorial-scroll p { margin:8px 0; color:#486273; font-size:13px; line-height:1.85; }
.admin-tutorial-scroll ul { margin:8px 0 0; padding:10px 12px 10px 26px; border-radius:8px; background:#f0f6fa; color:#607d8c; font-size:12px; line-height:1.8; }
.admin-tutorial-scroll .admin-tutorial-note { color:#7b919d; font-size:11px; }
.admin-tutorial-controls { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-shrink:0; margin-top:16px; padding-top:12px; border-top:1px solid #e5eef3; }
.admin-tutorial-controls > div { display:flex; gap:8px; }
.admin-tutorial-controls .el-button { min-height:34px; margin:0; padding-inline:12px; font-size:12px; }
.admin-tutorial-controls .admin-tutorial-skip { padding-inline:0; color:#748896; }
@media(max-width:480px),(max-height:480px) {
  .admin-tutorial-tour { padding:14px 16px; }
  .admin-tutorial-progress { margin-top:10px; }
  .admin-tutorial-progress strong { font-size:15px; }
  .admin-tutorial-controls { margin-top:10px; padding-top:8px; }
}
</style>
