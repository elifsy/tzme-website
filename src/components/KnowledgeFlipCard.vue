<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";

const props = defineProps({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  index: { type: Number, default: 0 },
});
const number = computed(() => String(props.index + 1).padStart(2, "0"));
const id = `knowledge-answer-${useId()}`;
const hovered = ref(false),
  hoverReady = ref(false),
  pinned = ref(false),
  hoverDismissed = ref(false),
  turning = ref(false);
const flipped = computed(
  () =>
    pinned.value ||
    (hovered.value && hoverReady.value && !hoverDismissed.value),
);
const frontButton = ref(null),
  answerPanel = ref(null);
let timer,
  hoverTimer,
  disposed = false,
  focusRequest = 0;

function finish() {
  clearTimeout(timer);
  turning.value = false;
}
watch(flipped, () => {
  clearTimeout(timer);
  turning.value = !window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches;
  if (turning.value) timer = setTimeout(finish, 1160);
});
function pointerEntered(event) {
  if (event.pointerType !== "mouse") return;
  clearTimeout(hoverTimer);
  hovered.value = true;
  hoverReady.value = false;
  hoverDismissed.value = false;
  if (!pinned.value)
    hoverTimer = setTimeout(() => {
      if (!disposed && hovered.value && !pinned.value && !hoverDismissed.value)
        hoverReady.value = true;
    }, 200);
}
function pointerLeft(event) {
  if (event.pointerType !== "mouse") return;
  clearTimeout(hoverTimer);
  hovered.value = false;
  hoverReady.value = false;
  hoverDismissed.value = false;
}
async function togglePin(event) {
  if (
    event.defaultPrevented ||
    event.target.closest('a,input,textarea,select,[contenteditable="true"]')
  )
    return;
  const selection = window.getSelection();
  if (!event.target.closest("button") && selection && !selection.isCollapsed)
    return;
  clearTimeout(hoverTimer);
  if (pinned.value) {
    // Closing a pinned card must keep the question visible until re-entry.
    hoverDismissed.value = hovered.value;
    pinned.value = false;
  } else {
    pinned.value = true;
    hoverDismissed.value = false;
  }
  const request = ++focusRequest;
  await nextTick();
  if (!disposed && request === focusRequest)
    (flipped.value ? answerPanel.value : frontButton.value)?.focus({
      preventScroll: true,
    });
}
function transitionEnded(event) {
  if (
    event.target === event.currentTarget &&
    event.propertyName === "transform"
  )
    finish();
}
onBeforeUnmount(() => {
  disposed = true;
  clearTimeout(timer);
  clearTimeout(hoverTimer);
});
</script>

<template>
  <article
    class="knowledge-card"
    :class="{
      'is-flipped': flipped,
      'is-turning': turning,
      'is-pinned': pinned,
    }"
    @pointerenter="pointerEntered"
    @pointerleave="pointerLeft"
    @click="togglePin"
  >
    <span class="knowledge-card-shadow" aria-hidden="true" />
    <div class="knowledge-card-rotor" @transitionend="transitionEnded">
      <div
        class="knowledge-card-face knowledge-card-front"
        :inert="flipped"
        :aria-hidden="flipped"
      >
        <button
          ref="frontButton"
          type="button"
          class="knowledge-card-open"
          :aria-expanded="flipped"
          :aria-controls="id"
          :aria-label="`${question}，查看并固定答案`"
        >
          <span class="knowledge-card-meta"
            ><span>{{ number }}</span
            ><span>QUESTION</span></span
          >
          <span class="knowledge-card-question" role="heading" aria-level="3">{{
            question
          }}</span>
          <svg
            class="knowledge-card-drawing"
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 68h64M14 68V16h40M14 23h47L49 16M19 23v40M14 35h5m-5 10h5m-5 10h5M45 23v18m-4 0h8m-4 0v7m-4 0 4 5 4-5M7 68v-5h18v5M28 68V53h22v15m8 0V44h12v24M32 59h4m4 0h4m18-9h4m-4 6h4"
            />
          </svg>
          <span class="knowledge-card-footer"
            ><span class="knowledge-card-hover-copy">移入预览 · 点击固定</span
            ><span class="knowledge-card-tap-copy">点击查看答案</span
            ><span class="knowledge-card-flip-icon" aria-hidden="true"
              >↻</span
            ></span
          >
        </button>
      </div>
      <div
        :id="id"
        ref="answerPanel"
        class="knowledge-card-face knowledge-card-back"
        role="region"
        tabindex="-1"
        :aria-labelledby="`${id}-title`"
        :aria-describedby="`${id}-text`"
        :inert="!flipped"
        :aria-hidden="!flipped"
      >
        <span class="knowledge-card-meta"
          ><span>{{ number }} / 制造服务</span
          ><span>{{ pinned ? "已固定 · ANSWER" : "ANSWER" }}</span></span
        >
        <h3 :id="`${id}-title`" class="knowledge-card-answer-title">
          {{ question }}
        </h3>
        <p :id="`${id}-text`" class="knowledge-card-answer">{{ answer }}</p>
        <button
          type="button"
          class="knowledge-card-return knowledge-card-footer"
          :aria-label="`${pinned ? '返回问题' : '固定答案'}：${question}`"
        >
          <span>{{ pinned ? "点击返回问题" : "点击固定答案" }}</span
          ><span class="knowledge-card-flip-icon" aria-hidden="true">{{
            pinned ? "↶" : "⌖"
          }}</span>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.knowledge-card {
  position: relative;
  min-width: 0;
  perspective: 1200px;
  isolation: isolate;
  --flip-duration: 1100ms;
}
.knowledge-card-shadow {
  position: absolute;
  left: 9%;
  right: 9%;
  bottom: -5px;
  height: 34px;
  border-radius: 50%;
  background: #17465c20;
  filter: blur(13px);
  transform: scale(0.86, 0.65);
  pointer-events: none;
}
.knowledge-card-rotor {
  display: grid;
  height: 100%;
  min-height: 278px;
  transform-style: preserve-3d;
  transition: transform var(--flip-duration) cubic-bezier(0.22, 0.7, 0.16, 1);
}
.knowledge-card.is-flipped .knowledge-card-rotor {
  transform: rotateY(180deg);
}
.knowledge-card.is-turning .knowledge-card-rotor {
  will-change: transform;
}
/* Both faces stay in the document. The grid sizes itself to the full answer. */
.knowledge-card-face {
  position: relative;
  grid-area: 1 / 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border: 1px solid #dce8ed;
  border-radius: 9px;
  background: #fff;
  box-shadow: 0 8px 24px #28556807;
  overflow-wrap: anywhere;
}
.knowledge-card-back {
  transform: rotateY(180deg);
  padding: 23px 24px;
  background: linear-gradient(135deg, #edf9fa, #e5f2f5);
  border-color: #c7dfe5;
  cursor: pointer;
}
.knowledge-card-face::after,
.knowledge-card-face::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
}
.knowledge-card-face::after {
  background: linear-gradient(105deg, #123a50bb, #11344844);
}
.knowledge-card-face::before {
  background: linear-gradient(
    110deg,
    transparent 25%,
    #fff9 50%,
    transparent 75%
  );
  background-size: 220% 100%;
}
.knowledge-card.is-turning .knowledge-card-face::after {
  animation: knowledge-flip-shade var(--flip-duration) ease-in-out;
}
.knowledge-card.is-turning .knowledge-card-face::before {
  animation: knowledge-flip-light var(--flip-duration) ease-in-out;
}
.knowledge-card.is-turning .knowledge-card-shadow {
  animation: knowledge-flip-shadow var(--flip-duration) ease-in-out;
}
.knowledge-card-open {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  padding: 23px 24px;
  margin: 0;
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.knowledge-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 7px 10px;
  color: #729ba9;
  font-size: 10px;
  line-height: 1.5;
  letter-spacing: 0.7px;
}
.knowledge-card-meta > span:first-child {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.knowledge-card-question {
  display: block;
  margin-top: 32px;
  font-size: 20px;
  font-weight: 650;
  line-height: 1.65;
  letter-spacing: -0.3px;
  text-wrap: balance;
  color: #123a50;
}
.knowledge-card-drawing {
  display: block;
  align-self: flex-end;
  width: 67px;
  height: 67px;
  margin: 18px 0 2px;
  stroke: #c4dfe6;
  stroke-width: 1.3;
  opacity: 0.65;
}
.knowledge-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 16px;
  color: #087f91;
  font-size: 11px;
  line-height: 1.6;
}
.knowledge-card-hover-copy {
  display: none;
}
.knowledge-card-flip-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 1px solid #d7e8ee;
  border-radius: 50%;
  font-size: 17px;
  font-weight: 400;
  line-height: 1;
}
.knowledge-card-answer-title {
  margin: 16px 0 0;
  color: #157f90;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.8;
}
.knowledge-card-answer {
  margin: 14px 0 0;
  color: #476a7b;
  font-size: 13px;
  line-height: 1.95;
  white-space: pre-line;
}
.knowledge-card-return {
  width: 100%;
  border: 0;
  background: transparent;
  padding-inline: 0;
  padding-bottom: 0;
  font-family: inherit;
  color: #558795;
  font-size: 10px;
  text-align: left;
  cursor: pointer;
}
.knowledge-card-back .knowledge-card-flip-icon {
  width: 24px;
  height: 24px;
  border-color: #bad8e0;
  font-size: 15px;
}
.knowledge-card-open:focus-visible,
.knowledge-card-back:focus-visible {
  outline: 2px solid #087f91;
  outline-offset: 5px;
}
.knowledge-card-return:focus-visible {
  outline: 2px solid #087f91;
  outline-offset: 4px;
  border-radius: 3px;
}
@media (hover: hover) {
  .knowledge-card:not(.is-flipped):hover .knowledge-card-front {
    border-color: #a8cfd9;
  }
  .knowledge-card-return:hover {
    color: #087f91;
  }
  .knowledge-card-hover-copy {
    display: inline;
  }
  .knowledge-card-tap-copy {
    display: none;
  }
}
@keyframes knowledge-flip-shade {
  0%,
  100% {
    opacity: 0;
  }
  45%,
  55% {
    opacity: 0.42;
  }
}
@keyframes knowledge-flip-light {
  0% {
    opacity: 0;
    background-position: 100% 0;
  }
  45% {
    opacity: 0.65;
  }
  100% {
    opacity: 0;
    background-position: 0 0;
  }
}
@keyframes knowledge-flip-shadow {
  0%,
  100% {
    transform: scale(0.86, 0.65);
    opacity: 1;
  }
  50% {
    transform: translateX(22px) scale(0.55, 1.25);
    opacity: 0.65;
  }
}
@media (max-width: 1100px) {
  .knowledge-card-rotor {
    min-height: 252px;
  }
}
@media (max-width: 700px) {
  .knowledge-card-open,
  .knowledge-card-back {
    padding: 20px;
  }
  .knowledge-card-question {
    font-size: 18px;
    margin-top: 24px;
  }
  .knowledge-card-meta {
    font-size: 9px;
  }
  .knowledge-card-meta > span:first-child {
    font-size: 11px;
  }
}
@media (max-width: 420px) {
  .knowledge-card-rotor {
    min-height: 220px;
  }
  .knowledge-card-question {
    margin-top: 22px;
    max-width: 85%;
  }
  .knowledge-card-drawing {
    position: absolute;
    right: 18px;
    bottom: 56px;
    width: 54px;
    height: 54px;
    margin: 0;
    opacity: 0.5;
  }
  .knowledge-card-open .knowledge-card-footer {
    padding-top: 32px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .knowledge-card-rotor {
    transition: none;
  }
  .knowledge-card.is-turning .knowledge-card-face::before,
  .knowledge-card.is-turning .knowledge-card-face::after,
  .knowledge-card.is-turning .knowledge-card-shadow {
    animation: none;
  }
}
@media print {
  .knowledge-card-rotor,
  .knowledge-card.is-flipped .knowledge-card-rotor,
  .knowledge-card-back {
    display: block;
    transform: none;
  }
  .knowledge-card-front,
  .knowledge-card-shadow,
  .knowledge-card-return {
    display: none;
  }
  .knowledge-card-back {
    background: #fff;
  }
}
</style>
