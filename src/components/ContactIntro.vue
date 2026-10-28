<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import PortEquipmentMonogram from "./PortEquipmentMonogram.vue";

const section = ref(null),
  artwork = ref(null),
  drawing = ref(null),
  pointerLight = ref(null);
const motionEnabled = ref(false);
const revealState = ref("static");
const pointerEnabled = computed(
  () =>
    motionEnabled.value &&
    (revealState.value === "static" || revealState.value === "complete"),
);
const id = `contact-mark-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
const artWidth = 1100,
  artHeight = 580;
// Trace both edges of the open Z. The space between them is essential to
// the approved mark; a stack of single bent lines compresses its diagonal.
const paths = [
  {
    d: "M 170 42 H 881 V 119 H 828 L 397 457 H 1120",
    color: "#0754b3",
    end: "#079caf",
    width: 5,
  },
  {
    d: "M 170 56 H 855 V 108 H 827 L 359 468 H 1120",
    color: "#749db7",
    end: "#2895ac",
    width: 3.8,
    opacity: 0.75,
  },
  {
    d: "M 170 70 H 824 V 96 H 800 L 323 480 H 1120",
    color: "#268b66",
    end: "#5a9f9b",
    width: 4.2,
    opacity: 0.88,
  },
  {
    d: "M 170 83 H 798 V 94 H 768 L 286 491 H 1120",
    color: "#53a4bb",
    end: "#459eb4",
    width: 3.6,
    opacity: 0.8,
  },
  {
    d: "M 170 95 H 767 L 247 502 H 1120",
    color: "#8da9bd",
    end: "#689eaf",
    width: 3.3,
    opacity: 0.74,
  },
  {
    d: "M 170 108 H 733 L 207 514 H 1120",
    color: "#799bb6",
    end: "#1b8ea9",
    width: 3.4,
    opacity: 0.78,
  },
  {
    d: "M 170 120 H 700 L 169 525 H 1120",
    color: "#8da7c0",
    end: "#0793a9",
    width: 3.3,
    opacity: 0.75,
  },
  {
    d: "M 170 120 H 645 L 130 537 H 1120",
    color: "#0754b3",
    end: "#049db1",
    width: 4.8,
  },
];
const current = { x: 0, y: 0, light: 0 },
  target = { x: 0, y: 0, light: 0 };
let frame = 0,
  media,
  disposed = false,
  pointerX = 0,
  pointerY = 0;
let revealMedia,
  revealObserver,
  revealFrame = 0,
  hasRevealed = false;

function paint() {
  const style = artwork.value?.style;
  if (!style) return;
  style.setProperty("--mark-x", `${(current.x * 12).toFixed(2)}px`);
  style.setProperty("--mark-y", `${(current.y * 8).toFixed(2)}px`);
  style.setProperty("--mark-rx", `${(-current.y * 1.8).toFixed(2)}deg`);
  style.setProperty("--mark-ry", `${(current.x * 2.4).toFixed(2)}deg`);
  style.setProperty("--mark-light", current.light.toFixed(3));
  if (current.light > 0.005 && pointerLight.value && drawing.value) {
    const bounds = drawing.value.getBoundingClientRect();
    if (bounds.width && bounds.height) {
      pointerLight.value.setAttribute(
        "cx",
        String(((pointerX - bounds.left) / bounds.width) * artWidth),
      );
      pointerLight.value.setAttribute(
        "cy",
        String(((pointerY - bounds.top) / bounds.height) * artHeight),
      );
    }
  }
}
function animate() {
  frame = 0;
  if (disposed) return;
  let unsettled = false;
  for (const key of ["x", "y", "light"]) {
    const difference = target[key] - current[key];
    current[key] =
      Math.abs(difference) < 0.002
        ? target[key]
        : current[key] + difference * 0.13;
    if (current[key] !== target[key]) unsettled = true;
  }
  paint();
  if (unsettled) frame = requestAnimationFrame(animate);
}
function schedule() {
  if (!frame && !disposed) frame = requestAnimationFrame(animate);
}
function onPointerMove(event) {
  if (!pointerEnabled.value || event.pointerType !== "mouse") return;
  const bounds = section.value.getBoundingClientRect();
  target.x = Math.max(
    -1,
    Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1),
  );
  target.y = Math.max(
    -1,
    Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1),
  );
  target.light = 1;
  pointerX = event.clientX;
  pointerY = event.clientY;
  schedule();
}
function reset() {
  target.x = 0;
  target.y = 0;
  target.light = 0;
  schedule();
}
function updateMotion() {
  motionEnabled.value = media.matches;
  if (!media.matches) {
    cancelAnimationFrame(frame);
    frame = 0;
    for (const key of ["x", "y", "light"]) current[key] = target[key] = 0;
    paint();
  }
}
function updateReveal() {
  revealObserver?.disconnect();
  cancelAnimationFrame(revealFrame);
  revealFrame = 0;
  if (
    !revealMedia.matches ||
    !artwork.value ||
    !("IntersectionObserver" in window)
  ) {
    revealState.value = "static";
    return;
  }
  if (hasRevealed) {
    revealState.value = "complete";
    return;
  }
  revealState.value = "waiting";
  revealObserver = new IntersectionObserver(
    (entries) => {
      if (
        disposed ||
        !revealMedia.matches ||
        !entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.25,
        )
      )
        return;
      revealObserver.disconnect();
      revealFrame = requestAnimationFrame(() => {
        revealFrame = 0;
        if (disposed || !revealMedia.matches) return;
        hasRevealed = true;
        revealState.value = "playing";
      });
    },
    { threshold: 0.25 },
  );
  revealObserver.observe(artwork.value);
}
function finishReveal(index) {
  if (index === paths.length - 1 && revealState.value === "playing")
    revealState.value = "complete";
}
onMounted(() => {
  media = window.matchMedia(
    "(min-width: 701px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
  );
  updateMotion();
  media.addEventListener("change", updateMotion);
  revealMedia = window.matchMedia("(prefers-reduced-motion: no-preference)");
  updateReveal();
  revealMedia.addEventListener("change", updateReveal);
});
onBeforeUnmount(() => {
  disposed = true;
  cancelAnimationFrame(frame);
  cancelAnimationFrame(revealFrame);
  media?.removeEventListener("change", updateMotion);
  revealMedia?.removeEventListener("change", updateReveal);
  revealObserver?.disconnect();
});
</script>

<template>
  <section
    ref="section"
    class="contact-hero"
    aria-labelledby="contact-page-title"
    @pointermove.passive="onPointerMove"
    @pointerleave="reset"
  >
    <div class="hc-w contact-hero-inner">
      <div class="contact-hero-copy">
        <span class="contact-hero-kicker"
          >{{ $t("site.contactUs") }} / CONTACT TZME</span
        >
        <h1 id="contact-page-title" class="contact-hero-title site-page-title">
          <span>下一项制造需求，</span><span>从交流开始。</span>
        </h1>
        <span class="contact-hero-rule" aria-hidden="true" />
        <p class="contact-hero-description site-intro-description">
          <span>告诉我们您的图纸、工况、质量要求与交付计划。</span
          ><span>一起明确设备制造与交付需求。</span>
        </p>
        <ul class="contact-hero-topics" aria-label="沟通内容">
          <li>设备制造</li>
          <li>质量要求</li>
          <li>交付计划</li>
        </ul>
      </div>
    </div>
    <div
      ref="artwork"
      class="contact-hero-art"
      :class="{
        'is-interactive': pointerEnabled,
        'is-reveal-pending': revealState === 'waiting',
        'is-revealing': revealState === 'playing',
      }"
      aria-hidden="true"
    >
      <div class="contact-hero-mark">
        <svg
          ref="drawing"
          class="contact-hero-svg"
          :viewBox="`0 0 ${artWidth} ${artHeight}`"
          fill="none"
          focusable="false"
        >
          <defs>
            <linearGradient
              v-for="(path, index) in paths"
              :id="`${id}-line-${index}`"
              :key="index"
              x1="760"
              y1="60"
              x2="600"
              y2="530"
              gradientUnits="userSpaceOnUse"
            >
              <stop :stop-color="path.color" />
              <stop offset=".76" :stop-color="path.color" />
              <stop offset="1" :stop-color="path.end" />
            </linearGradient>
            <linearGradient
              :id="`${id}-top-fade`"
              x1="170"
              x2="881"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="black" />
              <stop offset=".15" stop-color="#161616" />
              <stop offset=".5" stop-color="#999" />
              <stop offset=".8" stop-color="white" />
            </linearGradient>
            <linearGradient
              :id="`${id}-bottom-fade`"
              x1="0"
              x2="1100"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".45" stop-color="white" />
              <stop offset=".7" stop-color="#ddd" />
              <stop offset="1" stop-color="black" />
            </linearGradient>
            <mask
              :id="`${id}-fade`"
              maskUnits="userSpaceOnUse"
              x="-300"
              y="0"
              width="1500"
              height="580"
            >
              <path
                d="M -300 0 H 1200 V 145 H -300 Z"
                :fill="`url(#${id}-top-fade)`"
              />
              <path d="M -300 145 H 1200 V 440 H -300 Z" fill="white" />
              <path
                d="M -300 440 H 1200 V 580 H -300 Z"
                :fill="`url(#${id}-bottom-fade)`"
              />
            </mask>
            <linearGradient
              :id="`${id}-trails`"
              x1="0"
              y1="580"
              x2="1040"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#70b8d2" stop-opacity="0" />
              <stop offset=".4" stop-color="#70b8d2" stop-opacity=".12" />
              <stop offset="1" stop-color="#70b8d2" stop-opacity=".04" />
            </linearGradient>
            <radialGradient
              :id="`${id}-pointer`"
              ref="pointerLight"
              cx="580"
              cy="280"
              r="180"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#31b4c8" stop-opacity=".95" />
              <stop offset=".35" stop-color="#0784a0" stop-opacity=".7" />
              <stop offset="1" stop-color="#0784a0" stop-opacity="0" />
            </radialGradient>
          </defs>
          <g
            class="contact-hero-trails"
            :stroke="`url(#${id}-trails)`"
            stroke-width="2.4"
          >
            <path
              v-for="index in 7"
              :key="index"
              :d="`M ${-240 + index * 35} 610 Q 570 230 ${1050 + index * 28} -30`"
            />
          </g>
          <g
            class="contact-hero-strokes"
            :mask="`url(#${id}-fade)`"
            stroke-linejoin="miter"
          >
            <path
              v-for="(path, index) in paths"
              :key="index"
              :d="path.d"
              pathLength="1"
              :style="{ '--stroke-index': index }"
              :stroke="`url(#${id}-line-${index})`"
              :stroke-width="path.width"
              :opacity="path.opacity ?? 1"
              @animationend="finishReveal(index)"
            />
          </g>
          <g
            class="contact-hero-highlight"
            :mask="`url(#${id}-fade)`"
            :stroke="`url(#${id}-pointer)`"
            stroke-width="5.5"
            stroke-linejoin="miter"
          >
            <path v-for="(path, index) in paths" :key="index" :d="path.d" />
          </g>
          <PortEquipmentMonogram class="contact-hero-me" opacity=".85" />
        </svg>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact-hero {
  position: relative;
  isolation: isolate;
  height: 430px;
  overflow: hidden;
  background: #eff8fb;
}
.contact-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(105deg, #f7fcfe 5%, #edf8fc 70%, #e5f4f9);
  pointer-events: none;
}
.contact-hero .contact-hero-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  align-items: flex-start;
}
.contact-hero-copy {
  width: 58%;
  max-width: 650px;
  padding-top: var(--site-hero-copy-top, 64px);
}
.contact-hero-kicker {
  display: block;
  color: #608594;
  font-size: 11px;
  line-height: var(--site-hero-kicker-line-height, 20px);
  letter-spacing: 1.8px;
}
.contact-hero .contact-hero-title {
  margin: var(--site-hero-title-gap, 12px) 0 0;
  color: #082947;
}
.contact-hero-title > span {
  display: block;
}
.contact-hero-rule {
  display: block;
  width: 40px;
  height: 3px;
  margin: 17px 0 18px;
  background: #078b9e;
}
.contact-hero-description {
  max-width: 420px;
  margin: 0;
  color: #416a7e;
  overflow-wrap: anywhere;
}
.contact-hero-description > span {
  display: block;
}
.contact-hero-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
  color: #467586;
  font-size: 11px;
  letter-spacing: 0.4px;
}
.contact-hero-topics > li {
  padding-left: 10px;
  border-left: 2px solid #83c0cb;
  line-height: 1.2;
}
.contact-hero-art {
  position: absolute;
  z-index: 0;
  top: 50%;
  right: 0;
  height: 112%;
  aspect-ratio: 1100 / 580;
  opacity: 0.58;
  transform: translateY(-50%);
  pointer-events: none;
  user-select: none;
}
.contact-hero-mark {
  width: 100%;
  height: 100%;
  transform: perspective(1000px)
    translate3d(var(--mark-x, 0px), var(--mark-y, 0px), 0)
    rotateX(var(--mark-rx, 0deg)) rotateY(var(--mark-ry, 0deg));
  transform-origin: 65% 50%;
}
.is-interactive .contact-hero-mark {
  will-change: transform;
}
.contact-hero-svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.contact-hero-highlight {
  opacity: var(--mark-light, 0);
}
.is-reveal-pending .contact-hero-strokes path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
.is-reveal-pending .contact-hero-me,
.is-reveal-pending .contact-hero-trails {
  opacity: 0;
}
.is-revealing .contact-hero-strokes path {
  stroke-dasharray: 1;
  animation: contact-z-draw 1.6s linear both;
  animation-delay: calc(var(--stroke-index) * 27ms);
}
.is-revealing .contact-hero-me {
  animation: contact-me-appear 0.4s ease-out 1.1s both;
}
.is-revealing .contact-hero-trails {
  animation: contact-trails-appear 0.4s ease-out 0.26s both;
}
@keyframes contact-z-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes contact-me-appear {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.85;
  }
}
@keyframes contact-trails-appear {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media (min-width: 1800px) {
  .contact-hero-art {
    right: max(0px, calc((100% - 1660px) / 2 - 40px));
  }
}
@media (max-width: 1100px) and (min-width: 701px) {
  .contact-hero-copy {
    width: 75%;
  }
  .contact-hero-art {
    right: -15%;
    height: 105%;
    opacity: 0.3;
  }
}
@media (max-width: 700px) {
  .contact-hero {
    height: auto;
    min-height: 410px;
    display: flex;
    flex-direction: column;
    padding-bottom: 30px;
  }
  .contact-hero .contact-hero-inner {
    height: auto;
    flex: none;
    align-items: flex-start;
  }
  .contact-hero .contact-hero-copy {
    width: 100%;
    max-width: none;
    padding: var(--site-hero-copy-top, 24px) 0 0;
  }
  .contact-hero-kicker {
    font-size: 10px;
  }
  .contact-hero-rule {
    width: 32px;
    margin: 15px 0 17px;
    height: 2px;
  }
  .contact-hero-description {
    max-width: 300px;
  }
  .contact-hero-description > span {
    display: inline;
  }
  .contact-hero-topics {
    gap: 12px;
    margin-top: 18px;
    font-size: 10px;
  }
  .contact-hero-art {
    top: auto;
    right: -5%;
    bottom: 0;
    width: 95%;
    height: auto;
    opacity: 0.23;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce), (hover: none), (pointer: coarse) {
  .contact-hero-mark {
    transform: none;
    will-change: auto;
  }
  .contact-hero-highlight {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .is-reveal-pending .contact-hero-strokes path,
  .is-revealing .contact-hero-strokes path {
    animation: none;
    stroke-dashoffset: 0;
  }
  .is-reveal-pending .contact-hero-me,
  .is-revealing .contact-hero-me {
    animation: none;
    opacity: 0.85;
  }
  .is-reveal-pending .contact-hero-trails,
  .is-revealing .contact-hero-trails {
    animation: none;
    opacity: 1;
  }
}
@media (forced-colors: active) {
  .contact-hero {
    background: Canvas;
  }
  .contact-hero::before,
  .contact-hero-art {
    display: none;
  }
  .contact-hero-title,
  .contact-hero-kicker,
  .contact-hero-description {
    color: CanvasText;
  }
  .contact-hero-rule {
    background: CanvasText;
  }
}
</style>
