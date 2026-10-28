<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { useI18n } from "vue-i18n";
import worldDots from "../../assets/world-dots.svg";
import { globalReachText } from "../data/globalReach.js";

const props = defineProps({
  points: { type: Array, default: () => [] },
  description: { type: String, default: "" },
  localeCode: { type: String, default: "" },
  editable: Boolean,
  disabled: Boolean,
  selectedId: { type: String, default: "" },
});
const emit = defineEmits(["add", "select", "move", "remove", "activate"]);
const { t, locale } = useI18n({ useScope: "global" });
const hoveredId = ref("");
const activeId = ref("");
function selectPoint(id) {
  if (props.editable) {
    emit("select", id);
    return;
  }
  activeId.value = activeId.value === id ? "" : id;
  if (activeId.value) emit("activate", id);
}
const canvas = ref(null);
const routeLayer = ref(null);
const shipSymbolId = `world-map-ship-${useId()}`;
const shipScale = ref(1);
const inView = ref(false);
const pageVisible = ref(true);
const reducedMotion = ref(false);
const motionPaused = computed(
  () =>
    props.editable ||
    !inView.value ||
    !pageVisible.value ||
    reducedMotion.value,
);
const validPoint = (point) =>
  Number.isFinite(point.x) && Number.isFinite(point.y);
const origin = computed(() =>
  props.points.find((point) => point.id === "country-CN" && validPoint(point)),
);
const routes = computed(() => {
  if (props.editable || !origin.value) return [];
  const start = { x: origin.value.x * 10, y: origin.value.y * 4.6 };
  return props.points
    .filter((point) => point.id !== origin.value.id && validPoint(point))
    .flatMap((point) => {
      const end = { x: point.x * 10, y: point.y * 4.6 };
      const dx = end.x - start.x,
        dy = end.y - start.y,
        distance = Math.hypot(dx, dy);
      if (distance < 0.01) return [];
      const bend = Math.min(90, distance * 0.2);
      const control = {
        x: Math.max(
          12,
          Math.min(
            988,
            (start.x + end.x) / 2 - (dy / distance) * bend * Math.sign(dx || 1),
          ),
        ),
        y: Math.max(
          12,
          Math.min(
            448,
            (start.y + end.y) / 2 - (Math.abs(dx) / distance) * bend,
          ),
        ),
      };
      const travelDuration = 4.5 + distance / 60;
      const duration = travelDuration + 20;
      const travelEnd = travelDuration / duration;
      const phase =
        ([...point.id].reduce(
          (hash, character) =>
            Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0,
          2166136261,
        ) %
          997) /
        997;
      return [
        {
          id: point.id,
          path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
          duration: `${duration.toFixed(3)}s`,
          begin: `-${(duration * phase).toFixed(3)}s`,
          motionTimes: `0;${travelEnd};1`,
          opacityTimes: `0;${travelEnd * 0.07};${travelEnd * 0.93};${travelEnd};1`,
        },
      ];
    });
});
let visibilityObserver, sizeObserver, motionPreference;
function syncPlayback() {
  if (!routeLayer.value) return;
  // Let SVG run the motion natively, without Vue updates or geometry reads per frame.
  if (motionPaused.value) routeLayer.value.pauseAnimations();
  else routeLayer.value.unpauseAnimations();
}
function syncVisibility() {
  pageVisible.value = !document.hidden;
}
function syncMotionPreference() {
  reducedMotion.value = motionPreference.matches;
}
watch([motionPaused, routeLayer], syncPlayback, { flush: "post" });
onMounted(() => {
  motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  syncMotionPreference();
  motionPreference.addEventListener("change", syncMotionPreference);
  syncVisibility();
  document.addEventListener("visibilitychange", syncVisibility);
  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      inView.value = entry.isIntersecting;
    },
    { threshold: 0.05 },
  );
  visibilityObserver.observe(canvas.value);
  sizeObserver = new ResizeObserver(([entry]) => {
    const width = entry.contentRect.width;
    if (width > 0) shipScale.value = ((width < 480 ? 0.7 : 0.9) * 1000) / width;
  });
  sizeObserver.observe(canvas.value);
  syncPlayback();
});
onBeforeUnmount(() => {
  visibilityObserver?.disconnect();
  sizeObserver?.disconnect();
  motionPreference?.removeEventListener("change", syncMotionPreference);
  document.removeEventListener("visibilitychange", syncVisibility);
});
const pointButtons = new Map();
const visibleId = computed(
  () => hoveredId.value || activeId.value || props.selectedId,
);
const language = computed(() => props.localeCode || locale.value);
const name = (point) => globalReachText(point.label, language.value);
const names = computed(() =>
  props.points.map(name).join(language.value === "zh" ? "、" : ", "),
);
function markerLabel(point) {
  if (props.editable) return name(point);
  // City and country markers can share just a few screen pixels. Keep their
  // real coordinates and expose nearby names together in the public tooltip.
  const area = point.id.match(/^(?:country|city)-([A-Z]{2})(?:-|$)/)?.[1];
  if (!area) return name(point);
  const nearby = props.points.filter(
    (other) =>
      other.id.match(/^(?:country|city)-([A-Z]{2})(?:-|$)/)?.[1] === area &&
      Math.hypot(other.x - point.x, (other.y - point.y) * 0.46) < 1.25,
  );
  return nearby.map(name).join(" · ");
}
function addPoint(event) {
  if (!props.editable) {
    activeId.value = "";
    return;
  }
  if (props.disabled || event.target.closest("button")) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  emit("add", {
    x: Math.round(((event.clientX - bounds.left) / bounds.width) * 10000) / 100,
    y: Math.round(((event.clientY - bounds.top) / bounds.height) * 10000) / 100,
  });
}
function keyboard(event, point) {
  if (event.key === "Escape") {
    hoveredId.value = "";
    activeId.value = "";
    return;
  }
  if (!props.editable || props.disabled) return;
  const directions = {
    ArrowLeft: [-0.5, 0],
    ArrowRight: [0.5, 0],
    ArrowUp: [0, -0.5],
    ArrowDown: [0, 0.5],
  };
  if (directions[event.key]) {
    event.preventDefault();
    const [x, y] = directions[event.key];
    const step = event.shiftKey ? 4 : 1;
    emit("move", {
      id: point.id,
      x: Math.min(100, Math.max(0, point.x + x * step)),
      y: Math.min(100, Math.max(0, point.y + y * step)),
    });
  } else if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    emit("remove", point.id);
  }
}
defineExpose({ focusPoint: (id) => pointButtons.get(id)?.focus() });
</script>

<template>
  <figure class="world-reach-map" :aria-label="description">
    <div
      ref="canvas"
      class="world-map-canvas"
      :class="{
        'is-editable': editable && !disabled,
        'has-routes': routes.length,
        'is-motion-paused': motionPaused,
        'has-reduced-motion': reducedMotion,
      }"
      @click="addPoint"
    >
      <img :src="worldDots" alt="" draggable="false" class="world-map-land" />
      <svg
        v-if="routes.length"
        ref="routeLayer"
        class="world-map-routes"
        viewBox="0 0 1000 460"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <g :id="shipSymbolId" class="world-map-ship-shape">
            <path d="M-9-4H3.5Q7-4 10 0Q7 4 3.5 4H-9Z" />
            <path class="world-map-ship-cabin" d="M-6.5-2.5h3v5h-3Z" />
            <path
              class="world-map-ship-cargo"
              d="M-1.5-2.3h2v1.7h-2Zm0 2.9h2v1.7h-2Zm3.1-2.9h2v1.7h-2Zm0 2.9h2v1.7h-2Z"
            />
          </g>
        </defs>
        <path
          v-for="route in routes"
          :key="route.id"
          class="world-map-route"
          :class="{ 'is-active': visibleId === route.id }"
          :data-destination="route.id"
          :d="route.path"
          vector-effect="non-scaling-stroke"
        />
        <g
          v-for="route in routes"
          :key="`ship-${route.id}`"
          class="world-map-ship"
          :data-destination="route.id"
          opacity="0"
        >
          <animateMotion
            :path="route.path"
            :dur="route.duration"
            :begin="route.begin"
            rotate="auto"
            keyPoints="0;1;1"
            :keyTimes="route.motionTimes"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;.9;.9;0;0"
            :keyTimes="route.opacityTimes"
            :dur="route.duration"
            :begin="route.begin"
            repeatCount="indefinite"
          />
          <g :transform="`scale(${shipScale})`">
            <use :href="`#${shipSymbolId}`" />
          </g>
        </g>
      </svg>
      <button
        v-for="point in points"
        :key="point.id"
        type="button"
        class="world-map-point"
        :ref="
          (element) =>
            element
              ? pointButtons.set(point.id, element)
              : pointButtons.delete(point.id)
        "
        :class="{
          'is-selected': selectedId === point.id,
          'is-active': visibleId === point.id,
          'is-origin': origin?.id === point.id,
        }"
        :style="{ left: `${point.x}%`, top: `${point.y}%` }"
        :aria-label="
          editable
            ? t('admin.globalEditPoint', { name: name(point) })
            : name(point)
        "
        :aria-pressed="
          editable ? selectedId === point.id : activeId === point.id
        "
        :disabled="disabled"
        @click.stop="selectPoint(point.id)"
        @pointerenter="hoveredId = point.id"
        @pointerleave="hoveredId = ''"
        @focus="hoveredId = point.id"
        @blur="hoveredId = ''"
        @keydown="keyboard($event, point)"
      >
        <span class="world-map-halo" aria-hidden="true"></span
        ><span class="world-map-core" aria-hidden="true"></span>
        <span
          v-if="origin?.id === point.id && !editable && visibleId !== point.id"
          class="world-map-origin-name"
          aria-hidden="true"
          >{{ name(point) }}</span
        >
        <span
          v-if="visibleId === point.id"
          class="world-map-label"
          :class="{ 'near-right': point.x > 70, 'near-top': point.y < 15 }"
          >{{ markerLabel(point) }}</span
        >
      </button>
    </div>
    <figcaption class="world-map-caption">
      <span class="world-map-legend" aria-hidden="true"></span>
      <span
        ><slot name="caption">{{
          t(
            "site.globalMapLitLocations",
            { count: points.length },
            { locale: language },
          )
        }}</slot></span
      >
      <span class="world-map-sr-only">{{ names }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.world-reach-map {
  width: 100%;
  margin: 0;
  color: #c3d6e3;
}
.world-map-canvas {
  position: relative;
  width: 100%;
  aspect-ratio: 1000 / 460;
}
.world-map-canvas.is-editable {
  cursor: crosshair;
}
.world-map-land {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}
.world-map-routes {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.world-map-route {
  fill: none;
  stroke: #168d9e;
  stroke-width: 0.85;
  opacity: 0.23;
  transition:
    opacity 0.2s,
    stroke-width 0.2s;
}
.world-map-route.is-active {
  stroke-width: 1.6;
  opacity: 0.85;
}
.world-map-ship-shape {
  fill: #f8ffff;
  stroke: #087f91;
  stroke-width: 1.15;
  stroke-linejoin: round;
}
.world-map-ship-cabin {
  fill: #087f91;
  stroke: none;
}
.world-map-ship-cargo {
  fill: #77b7bd;
  stroke: none;
}
.has-reduced-motion .world-map-ship {
  display: none;
}
.world-map-point {
  position: absolute;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transform: translate(-50%, -50%);
  touch-action: manipulation;
  z-index: 1;
}
.world-map-halo {
  position: absolute;
  inset: -7px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #72ccff88 0%,
    #58baf933 35%,
    transparent 72%
  );
  pointer-events: none;
}
.world-map-core {
  width: 7px;
  height: 7px;
  background: #e5f7ff;
  border: 1px solid #8ed9ff;
  border-radius: 50%;
  box-shadow: 0 0 8px 2px #64c7ffc4;
  pointer-events: none;
}
.world-map-point.is-origin {
  width: 38px;
  height: 38px;
}
.world-map-point.is-origin .world-map-core {
  width: 14px;
  height: 14px;
  box-shadow:
    0 0 0 5px #087f911c,
    0 0 0 10px #087f910a;
}
.has-routes .world-map-point:not(.is-origin) .world-map-halo {
  inset: 5px;
}
.world-map-origin-name {
  position: absolute;
  top: calc(100% + 1px);
  padding: 1px 5px;
  border-radius: 2px;
  color: #087f91;
  background: #f1f9faed;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.5;
  white-space: nowrap;
  pointer-events: none;
}
.world-map-point:hover,
.world-map-point:focus-visible,
.world-map-point.is-selected,
.world-map-point.is-active {
  z-index: 3;
}
.world-map-point:focus-visible {
  outline: 2px solid #ffb543;
  outline-offset: 3px;
}
.world-map-point.is-selected .world-map-core {
  background: #ffb543;
  border-color: #ffd995;
  box-shadow: 0 0 10px 3px #e79c4880;
}
.world-map-label {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  max-width: min(220px, 50vw);
  width: max-content;
  padding: 7px 10px;
  border: 1px solid #618299;
  border-radius: 5px;
  background: #102a3d;
  color: #fff;
  font-size: 13px;
  line-height: 1.5;
  white-space: normal;
  text-align: left;
  pointer-events: none;
  transform: translateX(-50%);
  box-shadow: 0 3px 16px #0005;
}
.world-map-label.near-right {
  left: auto;
  right: 0;
  transform: none;
}
.world-map-label.near-top {
  bottom: auto;
  top: calc(100% + 6px);
}
.world-map-caption {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.7;
}
.world-map-legend {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #b5e8ff;
  box-shadow: 0 0 6px #62c4ff;
  flex: none;
}
.world-map-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
@media (forced-colors: active) {
  .world-map-core,
  .world-map-legend {
    background: Highlight;
    border: 1px solid CanvasText;
    forced-color-adjust: none;
  }
  .world-map-label {
    background: Canvas;
    color: CanvasText;
    border-color: CanvasText;
  }
}
@media (prefers-reduced-motion: reduce) {
  .world-map-route {
    transition: none;
  }
  .world-map-ship {
    display: none;
  }
}
@media (max-width: 600px) {
  .has-routes .world-map-point:not(.is-origin) .world-map-halo {
    inset: 8px;
  }
}
</style>
