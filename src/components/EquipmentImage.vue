<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  knownEquipmentImage,
  measureEquipmentImage,
} from "../utils/equipmentPresentation.js";
import { responsiveImage } from "../utils/responsiveImages.js";

const props = defineProps({
  record: { type: Object, required: true },
  alt: { type: String, default: "" },
  fallback: { type: String, default: "/assets/p-other-1.jpg" },
  interactive: Boolean,
  active: Boolean,
  revealed: Boolean,
});
const stage = ref(null),
  metrics = ref(null),
  size = ref({ width: 0, height: 0 }),
  failed = ref([]),
  currentImage = ref(''),
  entrySweep = ref(false);
let entryTimer, sweptOnEntry = false;
const source = computed(() =>
  [props.record.presentationImage, props.record.image, props.fallback].find(
    (src) => src && !failed.value.includes(src),
  ),
);
const frame = computed(() => {
  const m = metrics.value,
    b = m?.bounds,
    s = size.value;
  if (!b || !s.width || !s.height) return {};
  const subjectWidth = b.maxX - b.minX + 1,
    subjectHeight = b.maxY - b.minY + 1;
  const scale = Math.min(
    (s.width * 0.88) / subjectWidth,
    (s.height * 0.86) / subjectHeight,
  );
  return {
    position: "absolute",
    maxWidth: "none",
    width: `${m.width * scale}px`,
    height: `${m.height * scale}px`,
    left: `${(s.width - subjectWidth * scale) / 2 - b.minX * scale}px`,
    top: `${(s.height - subjectHeight * scale) / 2 - b.minY * scale}px`,
  };
});
watch(
  () => [props.record.presentationImage, props.record.image, props.fallback],
  () => {
    failed.value = [];
  },
);
watch(
  source,
  (src) => {
    metrics.value = knownEquipmentImage(src);
    currentImage.value = '';
    clearTimeout(entryTimer);
    entrySweep.value = false;
    sweptOnEntry = false;
  },
  { immediate: true },
);
function loaded(event) {
  currentImage.value = event.target.currentSrc || event.target.src;
  metrics.value =
    knownEquipmentImage(source.value) ||
    measureEquipmentImage(event.target, source.value);
}
function imageFailed() {
  if (source.value) failed.value = [...failed.value, source.value];
}
watch(() => [props.revealed, currentImage.value], ([revealed, image]) => {
  if (!props.interactive || !revealed || !image || sweptOnEntry) return;
  sweptOnEntry = true;
  if (!window.matchMedia('(hover:none)').matches || window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  entrySweep.value = true;
  const delay = parseFloat(getComputedStyle(stage.value).getPropertyValue('--product-enter-delay')) || 0;
  entryTimer = setTimeout(() => { entrySweep.value = false; }, 1250 + delay);
});
let observer;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    size.value = {
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    };
  });
  observer.observe(stage.value);
});
onBeforeUnmount(() => { observer?.disconnect(); clearTimeout(entryTimer); });
</script>

<template>
  <div ref="stage" class="equipment-cutout" :class="{ 'equipment-cutout-interactive': interactive, 'is-active': interactive && active, 'is-entering': entrySweep }">
    <span class="equipment-cutout-floor" aria-hidden="true" />
    <div v-if="source" class="equipment-cutout-subject" :style="frame">
    <img
      v-bind="
        responsiveImage(
          source,
          '(max-width:700px) 48vw, (max-width:1100px) 30vw, 22vw',
          960,
        )
      "
      :alt="alt || record.titleZh || record.titleEn || ''"
      loading="lazy"
      decoding="async"
      @load="loaded"
      @error="imageFailed"
    />
    <span v-if="interactive && currentImage && metrics?.transparent" class="equipment-cutout-sweep" :style="{ '--equipment-mask': `url(${JSON.stringify(currentImage)})` }" aria-hidden="true" />
    </div>
    <span v-else class="equipment-cutout-empty">暂无设备图片</span>
  </div>
</template>

<style scoped>
.equipment-cutout {
  position: relative;
  width: 100%;
  aspect-ratio: 1.7;
  isolation: isolate;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 110%, #e5f0f4, #fff0 66%);
}
.equipment-cutout-floor {
  position: absolute;
  bottom: 13%;
  left: 20%;
  right: 20%;
  height: 10%;
  border-radius: 50%;
  background: #274f6418;
  filter: blur(10px);
  z-index: -1;
}
.equipment-cutout img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 7px #1c4d6218);
}
.equipment-cutout-subject {
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 100%;
  transform-origin: 50% 80%;
}
.equipment-cutout-interactive .equipment-cutout-subject {
  transition: transform .65s cubic-bezier(.2,.7,.2,1);
}
.equipment-cutout-interactive .equipment-cutout-floor {
  transition: transform .65s ease, opacity .65s ease;
}
.equipment-cutout-interactive.is-active .equipment-cutout-subject {
  transform: translateY(-9px) scale(1.025);
}
.equipment-cutout-interactive.is-active .equipment-cutout-floor {
  transform: translateY(5px) scale(1.13);
  opacity: .55;
}
.equipment-cutout-sweep {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  background: linear-gradient(112deg,transparent 37%,#c6f4ff35 46%,#fff8 50%,#b9ebf150 53%,transparent 62%);
  background-size: 330% 100%;
  background-position: 100% 0;
  -webkit-mask-image: var(--equipment-mask);
  mask-image: var(--equipment-mask);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
.equipment-cutout-interactive.is-active .equipment-cutout-sweep {
  animation: equipment-cutout-light 1150ms ease-in-out both;
}
@keyframes equipment-cutout-light {
  0% { opacity:0; background-position:100% 0; }
  15% { opacity:.5; }
  60% { opacity:.8; }
  100% { opacity:0; background-position:0 0; }
}
@media (hover:none) {
  .equipment-cutout-interactive.is-entering .equipment-cutout-sweep {
    animation: equipment-cutout-light 1150ms ease-in-out both;
    animation-delay: var(--product-enter-delay, 0ms);
  }
}
@media (prefers-reduced-motion:reduce) {
  .equipment-cutout-interactive .equipment-cutout-subject,.equipment-cutout-interactive .equipment-cutout-floor { transition:none; }
  .equipment-cutout-interactive .equipment-cutout-sweep { animation:none!important; }
  .equipment-cutout-interactive.is-active .equipment-cutout-subject { transform:none; }
}
.equipment-cutout-empty {
  display: grid;
  place-items: center;
  height: 100%;
  color: #6b8592;
  font-size: 12px;
}
@media (max-width: 700px) {
  .equipment-cutout-interactive.is-active .equipment-cutout-subject { transform:translateY(-5px) scale(1.02); }
  .equipment-cutout {
    aspect-ratio: 1.15;
  }
}
</style>
