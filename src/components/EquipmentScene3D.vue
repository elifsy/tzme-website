<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { trackEvent } from "../services/analytics.js";
import { createSceneLabels } from "../three/sceneLabels.js";

const props = defineProps({
  settings: { type: Object, required: true },
  industries: { type: Array, default: () => [] },
  hotspots: { type: Array, default: () => [] },
  selectedIndustry: { type: String, default: "" },
  preview: Boolean,
});
const emit = defineEmits(["ready", "unavailable", "select-industry", "reset"]);
const host = ref(null),
  ready = ref(false),
  error = ref(""),
  anchors = shallowRef({}),
  loadedModels = ref({});
const viewport = shallowRef({ width: 1000, height: 650 });
const hovered = ref(""),
  animatedIndustry = ref("");
const mode = ref("orbit"),
  selected = ref(props.industries[0]?.id || ""),
  overview = ref(true),
  transitioning = ref(false),
  modelMessage = ref("");
const currentModels = computed(() =>
  Object.keys(loadedModels.value).filter(
    (key) =>
      loadedModels.value[key] &&
      loadedModels.value[key] === props.settings.models?.[key],
  ),
);
const industryKey = computed(() =>
  props.industries.map((industry) => industry.id).join(","),
);
const hint = computed(
  () =>
    (animatedIndustry.value ? "已选设备持续演示 · " : "") +
    (mode.value === "inspect"
      ? "拖动自由旋转 · 按钮或双指缩放"
      : "拖动环绕 · 点选标签切换行业"),
);
let engine,
  disposed = false,
  generation = 0;
const hoveredOnce = new Set();
let hoverTimer;
const track = (name, target) => {
  if (!props.preview) trackEvent(name, target);
};
// Observe region changes, never the render loop or individual mesh hits.
watch(hovered, (key) => {
  clearTimeout(hoverTimer);
  if (!key || props.preview || hoveredOnce.has(key)) return;
  hoverTimer = setTimeout(() => {
    hoveredOnce.add(key);
    track("model_hover", key);
  }, 800);
});
function syncState(value) {
  mode.value = value.mode;
  selected.value = value.selected;
  overview.value = value.overview;
  transitioning.value = value.transitioning;
  hovered.value = value.hovered;
  animatedIndustry.value = value.animatedIndustry;
}
function hoverLabel(key, event) {
  if (
    event.pointerType === "touch" ||
    (event.type === "focus" && !event.target.matches(":focus-visible"))
  )
    return;
  engine?.hover(key);
}
function industryName(point) {
  return (
    props.industries.find((industry) => industry.id === point.industryId)
      ?.titleZh || point.label
  );
}
const labels = shallowRef([]);
const labelLayout = createSceneLabels();
let labelFrame;
function scheduleLabels() {
  if (disposed || labelFrame != null) return;
  labelFrame = window.requestAnimationFrame(updateLabels);
}
function updateLabels() {
  labelFrame = undefined;
  if (disposed) return;
  const view = host.value?.ownerDocument.defaultView || window;
  const result = labelLayout.update(
    props.hotspots, anchors.value, viewport.value,
    {
      compact: view.innerWidth <= 700,
      reducedMotion: view.matchMedia("(prefers-reduced-motion: reduce)").matches,
      name: industryName,
    },
    performance.now(),
  );
  labels.value = result.labels;
  if (result.moving) scheduleLabels();
}
watch(() => [props.hotspots, props.industries], scheduleLabels, { deep: true });
function requestReset() {
  track("model_control", "reset");
  emit("reset");
}
function reset() {
  requestReset();
  engine?.reset();
}
function zoom(factor, target) {
  track("model_control", target);
  engine?.zoom(factor);
}
function inspect() {
  track("model_control", `inspect:${selected.value}`);
  engine?.inspect(selected.value);
}
function selectIndustry(key) {
  if (!props.industries.some((industry) => industry.id === key)) return;
  track("model_select", key);
  selected.value = key;
  if (props.selectedIndustry === key) engine?.focus(key);
  emit("select-industry", key);
}
function changeEquipment() {
  track("model_control", `equipment:${selected.value}`);
  if (mode.value === "inspect") engine?.inspect(selected.value);
  else engine?.focus(selected.value);
}
async function initialize() {
  const current = ++generation;
  ready.value = false;
  engine?.dispose();
  engine = null;
  anchors.value = {};
  labelLayout.clear();
  labels.value = [];
  loadedModels.value = {};
  try {
    const { createIndustrialViewer } =
      await import("../three/createIndustrialViewer.js");
    if (disposed || current !== generation) return;
    engine = createIndustrialViewer(
      host.value,
      {
        state: syncState,
        anchors: (value, size) => {
          anchors.value = value;
          if (
            size.width !== viewport.value.width ||
            size.height !== viewport.value.height
          )
            viewport.value = size;
          // The projection arrives from the canvas render: update in this frame
          // so the leader remains attached, then finish any offset interpolation.
          window.cancelAnimationFrame(labelFrame);
          updateLabels();
        },
        reset: requestReset,
        select: selectIndustry,
        failure: () => {
          error.value = "三维场景暂不可用";
          emit("unavailable");
        },
        modelError: () => {
          modelMessage.value = "替换模型加载失败，当前显示设备示意模型。";
        },
        modelLoaded: (key) => {
          loadedModels.value = {
            ...loadedModels.value,
            [key]: props.settings.models[key],
          };
          modelMessage.value = "";
        },
      },
      { ...props.settings, industries: props.industries },
    );
    engine.replaceModels(props.settings.models);
    if (
      props.industries.some(
        (industry) => industry.id === props.selectedIndustry,
      )
    )
      engine.focus(props.selectedIndustry);
    ready.value = true;
    emit("ready");
  } catch {
    if (!disposed && current === generation) {
      error.value = "当前设备暂不支持三维查看";
      emit("unavailable");
    }
  }
}
watch(
  () => props.selectedIndustry,
  (value) => {
    if (!engine) return;
    if (props.industries.some((item) => item.id === value)) engine.focus(value);
    else engine.reset();
  },
);
watch(
  () => props.settings.models,
  (value) => engine?.replaceModels(value),
  { deep: true },
);
let visibilityObserver,
  scheduled,
  idle = false,
  inViewport = false;
function scheduleInitialize() {
  if (
    disposed ||
    engine ||
    scheduled != null ||
    !inViewport ||
    (!props.preview && document.documentElement.hasAttribute("data-site-boot"))
  )
    return;
  const run = () => {
    scheduled = undefined;
    if (!disposed && inViewport) initialize();
  };
  idle = typeof window.requestIdleCallback === "function";
  scheduled = idle
    ? window.requestIdleCallback(run, { timeout: 700 })
    : setTimeout(run, 60);
}
watch(industryKey, () => {
  if (engine) initialize();
  else scheduleInitialize();
});
onMounted(() => {
  window.addEventListener("tzme:page-ready", scheduleInitialize);
  if (props.preview || !("IntersectionObserver" in window)) {
    inViewport = true;
    scheduleInitialize();
    return;
  }
  visibilityObserver = new IntersectionObserver(
    (entries) => {
      inViewport = entries.some((entry) => entry.isIntersecting);
      if (inViewport) scheduleInitialize();
    },
    { rootMargin: "180px" },
  );
  visibilityObserver.observe(host.value);
});
onBeforeUnmount(() => {
  disposed = true;
  generation++;
  clearTimeout(hoverTimer);
  window.cancelAnimationFrame(labelFrame);
  visibilityObserver?.disconnect();
  window.removeEventListener("tzme:page-ready", scheduleInitialize);
  if (scheduled != null) {
    if (idle) window.cancelIdleCallback(scheduled);
    else clearTimeout(scheduled);
  }
  engine?.dispose();
});
</script>

<template>
  <div
    class="industrial-viewer"
    :class="{ 'is-ready': ready }"
    :aria-busy="!ready || transitioning"
    :data-mode="mode"
    :data-overview="overview"
    :data-hovered-industry="hovered"
    :data-animated-industry="animatedIndustry"
    :data-custom-models="currentModels.join(',')"
    :data-industries="industryKey"
  >
    <div ref="host" class="industrial-canvas-host" />
    <div v-if="!ready" class="industrial-loading" role="status">
      {{ error || "正在准备装备全景…" }}
    </div>
    <template v-if="ready">
      <div class="industrial-view-actions">
        <div class="industrial-zoom" role="group" aria-label="三维场景缩放">
          <button
            type="button"
            aria-label="放大三维场景"
            title="放大"
            @click="zoom(0.85, 'zoom-in')"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path d="M4 10h12M10 4v12" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="缩小三维场景"
            title="缩小"
            @click="zoom(1 / 0.85, 'zoom-out')"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path d="M4 10h12" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          class="industrial-reset"
          title="恢复全部行业、初始视角和筛选"
          @click="reset"
        >
          <span aria-hidden="true">↺</span>复位
        </button>
      </div>
      <svg
        class="industrial-leaders"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          v-for="label in labels"
          :key="label.id"
          :class="{ 'is-hidden': !label.visible }"
          :data-industry-leader="label.point.industryId"
          :d="`M${label.target.x},${label.target.y} L${label.x},${label.y}`"
        />
      </svg>
      <div class="industrial-labels">
        <button
          v-for="label in labels"
          :key="label.id"
          type="button"
          class="industrial-hotspot scene-hotspot"
          :class="{
            'is-active': selectedIndustry === label.point.industryId,
            'is-hovered': hovered === label.point.industryId,
            'is-hidden': !label.visible,
          }"
          :style="{ left: `${label.x}%`, top: `${label.y}%` }"
          :data-anchor-x="label.target?.x"
          :data-anchor-y="label.target?.y"
          :data-hotspot-index="label.index"
          :data-industry-model="label.point.industryId"
          :aria-hidden="!label.visible"
          :tabindex="label.visible ? 0 : -1"
          :aria-pressed="selectedIndustry === label.point.industryId"
          :aria-label="`切换到${industryName(label.point)}行业`"
          @pointerenter="hoverLabel(label.point.industryId, $event)"
          @pointerleave="engine.hover('')"
          @focus="hoverLabel(label.point.industryId, $event)"
          @blur="engine.hover('')"
          @click.stop="selectIndustry(label.point.industryId)"
        >
          <i aria-hidden="true" /><span>{{ industryName(label.point) }}</span
          ><b aria-hidden="true">→</b>
        </button>
      </div>
      <div class="industrial-bottom-panel">
        <div class="industrial-controls">
          <label class="industrial-model-picker"
            ><span class="sr-only">查看设备</span
            ><select
              v-model="selected"
              aria-label="选择查看设备"
              @change="changeEquipment"
            >
              <option
                v-for="industry in industries"
                :key="industry.id"
                :value="industry.id"
              >
                {{ industry.titleZh }}装备
              </option>
            </select></label
          >
          <div
            class="industrial-mode-buttons"
            role="group"
            aria-label="选择三维查看方式"
          >
            <button
              type="button"
              :aria-pressed="mode === 'orbit'"
              @click="reset"
            >
              行业全景</button
            ><button
              type="button"
              :aria-pressed="mode === 'inspect'"
              @click="inspect"
            >
              设备特写
            </button>
          </div>
        </div>
        <p class="industrial-hint">
          <span class="industrial-hover-hint">悬停设备查看动作 · </span>{{ hint
          }}<span class="industrial-wheel-hint"> · 滚轮滚动网页</span>
        </p>
        <p v-if="modelMessage" class="industrial-model-message" role="status">
          {{ modelMessage }}
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.industrial-viewer {
  --f-ui: "Segoe UI", "Microsoft YaHei", -apple-system, sans-serif;
  position: absolute;
  inset: 0;
  z-index: 2;
  color: #27566c;
  font-family: var(--f-ui);
  isolation: isolate;
}
.industrial-canvas-host {
  position: absolute;
  inset: 0;
  mask-image: linear-gradient(
    to right,
    transparent,
    #000 7%,
    #000 97%,
    transparent
  );
}
.industrial-canvas-host :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
}
.industrial-canvas-host :deep(canvas:focus-visible) {
  outline: 2px solid #087f91;
  outline-offset: -3px;
}
.industrial-loading {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: #ffffffe8;
  border: 1px solid #d1e5ed;
  padding: 12px 18px;
  font-size: 12px;
}
.industrial-leaders {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}
.industrial-leaders path {
  fill: none;
  stroke: #77afbd;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  opacity: 0.7;
  transition: opacity 160ms ease;
}
.industrial-leaders path.is-hidden {
  opacity: 0;
}
@media (max-width: 700px) {
  .industrial-canvas-host {
    mask-image: linear-gradient(
      to right,
      transparent,
      #000 2.5%,
      #000 97.5%,
      transparent
    );
  }
}
.industrial-view-actions {
  position: absolute;
  top: 13px;
  right: 18px;
  z-index: 2;
  display: flex;
  align-items: stretch;
  gap: 9px;
}
.industrial-reset {
  display: flex;
  gap: 7px;
  align-items: center;
  min-height: 36px;
  padding: 6px 12px;
  border: 1px solid #c8dde8;
  background: #ffffffeb;
  color: #3c6c80;
  font: 500 11px/1.5 var(--f-ui);
  cursor: pointer;
}
.industrial-reset > span {
  font-size: 19px;
  line-height: 1;
}
.industrial-reset:hover {
  border-color: #78b5c3;
  background: #fff;
  color: #087f91;
}
.industrial-zoom {
  display: flex;
  border: 1px solid #c8dde8;
  background: #ffffffeb;
}
.industrial-zoom button {
  display: grid;
  place-items: center;
  width: 36px;
  min-height: 34px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #3c6c80;
  cursor: pointer;
}
.industrial-zoom button + button {
  border-left: 1px solid #d7e6ec;
}
.industrial-zoom svg {
  width: 18px;
  height: 18px;
}
.industrial-zoom button:hover {
  background: #edf7f9;
  color: #087f91;
}
.industrial-labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.industrial-hotspot {
  position: absolute;
  pointer-events: auto;
  transform: translate(-50%, -100%);
  padding: 6px 9px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #ffffffd9;
  background: #ffffffdb;
  border-radius: 3px;
  color: #315e72;
  box-shadow: 0 3px 12px #214f650a;
  font: 600 10px/1.5 var(--f-ui);
  cursor: pointer;
  white-space: nowrap;
  opacity: 1;
  visibility: visible;
  transition: opacity 160ms ease, visibility 0s;
}
.industrial-hotspot.is-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 160ms ease, visibility 0s 160ms;
}
@media (prefers-reduced-motion: reduce) {
  .industrial-hotspot,
  .industrial-hotspot.is-hidden,
  .industrial-leaders path {
    transition: none;
  }
}
.industrial-hotspot i {
  width: 4px;
  height: 4px;
  background: #159bad;
  box-shadow: 0 0 0 3px #159bad12;
  border-radius: 50%;
  flex-shrink: 0;
}
.industrial-hotspot b {
  font-weight: 400;
  color: #7fa0af;
}
.industrial-hotspot.is-active,
.industrial-hotspot:hover {
  border-color: #7bbac8;
  color: #087f91;
  background: #fff;
}
.industrial-bottom-panel {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: calc(100% - 24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.industrial-controls {
  display: flex;
  align-items: stretch;
  border: 1px solid #d1e2e9;
  background: #fffffff0;
  padding: 4px;
  gap: 4px;
  backdrop-filter: blur(10px);
  box-shadow: 0 5px 25px #335c6f08;
}
.industrial-model-picker {
  display: flex;
  align-items: center;
  border-right: 1px solid #e0eaf0;
  padding-right: 6px;
}
.industrial-model-picker select {
  width: 116px;
  min-height: 32px;
  border: 0;
  background: transparent;
  padding: 4px 8px;
  color: #315e73;
  font: 500 10px/1.5 var(--f-ui);
  cursor: pointer;
}
.industrial-mode-buttons {
  display: flex;
  gap: 3px;
}
.industrial-mode-buttons button {
  min-height: 32px;
  padding: 6px 12px;
  border: 0;
  background: transparent;
  color: #6a8493;
  font: 500 10px/1.5 var(--f-ui);
  white-space: nowrap;
  cursor: pointer;
}
.industrial-mode-buttons button[aria-pressed="true"] {
  background: #e8f4f7;
  color: #087f91;
}
.industrial-hint {
  margin: 0;
  color: #718d9e;
  font-size: 9px;
  line-height: 1.6;
  text-align: center;
}
.industrial-model-message {
  margin: 0;
  font-size: 10px;
  color: #886d42;
  background: #ffffffe0;
  padding: 5px 8px;
}
.industrial-viewer button:focus-visible,
.industrial-viewer select:focus-visible {
  outline: 2px solid #087f91;
  outline-offset: 3px;
}
.industrial-viewer :deep(.scene-product-card) {
  bottom: 94px;
  right: 17px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
.industrial-hotspot.is-hovered {
  border-color: #58a9b9;
  background: #fff;
  color: #087f91;
  box-shadow: 0 3px 16px #16899f24;
}
.industrial-hotspot.is-hovered i {
  box-shadow: 0 0 0 4px #159bad20;
}
@media (hover: none), (pointer: coarse) {
  .industrial-hover-hint,
  .industrial-wheel-hint {
    display: none;
  }
}
@media (max-width: 700px) {
  .industrial-view-actions {
    top: 2px;
    right: 9px;
    gap: 7px;
  }
  .industrial-reset {
    font-size: 10px;
    min-height: 36px;
    padding: 4px 9px;
  }
  .industrial-reset > span {
    font-size: 17px;
  }
  .industrial-hotspot {
    font-size: 8px;
    padding: 4px 6px;
    gap: 4px;
  }
  .industrial-hotspot b {
    display: none;
  }
  .industrial-bottom-panel {
    bottom: 0;
    gap: 6px;
    max-width: calc(100% - 16px);
  }
  .industrial-controls {
    padding: 3px;
    gap: 2px;
  }
  .industrial-model-picker {
    padding-right: 3px;
  }
  .industrial-model-picker select {
    width: 101px;
    font-size: 9px;
    padding: 4px 5px;
  }
  .industrial-mode-buttons button {
    font-size: 9px;
    min-height: 31px;
    padding: 5px 10px;
  }
  .industrial-hint {
    font-size: 8px;
  }
  .industrial-viewer :deep(.scene-product-card) {
    bottom: 85px;
    right: 9px;
  }
}
</style>
