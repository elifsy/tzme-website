<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import { jCompany } from "../data/jCompany.js";

const props = defineProps({ localeCode: { type: String, default: "zh" } });
const chinese = computed(() => props.localeCode === "zh");
const root = ref(null);
const animated = ref(false);
const entered = ref(false);
const id = useId();
const statementPhrase = /(成为世界|非标机械装备|制造业领跑者。|为员工谋幸福，|让更多|“有灵魂 会说话”|的产品服务世界。)/;
const statementParts = (text) =>
  text.split(statementPhrase).filter(Boolean).map((text) => ({
    text,
    keepTogether: statementPhrase.test(text),
  }));
const vision = computed(() => statementParts(chinese.value ? jCompany.visionZh : jCompany.visionEn));
const mission = computed(() => statementParts(chinese.value ? jCompany.missionZh : jCompany.missionEn));
const values = computed(() =>
  chinese.value
    ? jCompany.valuesZh.split(/[、。]/).filter(Boolean)
    : [
        "Customer orientation",
        "Dedication",
        "Continuous improvement",
        "Integrity and unity",
        "Responsibility",
        "Innovation",
      ],
);
let observer;
onMounted(() => {
  if (
    !window.matchMedia("(prefers-reduced-motion: no-preference)").matches ||
    !("IntersectionObserver" in window)
  ) return;
  animated.value = true;
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      entered.value = true;
      observer.disconnect();
    },
    { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
  );
  observer.observe(root.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <section
    ref="root"
    class="company-culture hc-w"
    :class="{ 'culture-animated': animated, 'is-entered': entered }"
    :aria-label="chinese ? '企业愿景、使命与价值观' : 'Vision, mission and values'"
  >
    <div class="culture-layout">
      <div class="culture-reveal culture-vision" style="--culture-delay: 0ms">
        <article class="culture-card culture-card-vision" :aria-labelledby="`${id}-vision`">
          <h2 :id="`${id}-vision`" class="culture-eyebrow">
            <i aria-hidden="true" />
            <span>{{ chinese ? "企业愿景 / VISION" : "VISION" }}</span>
          </h2>
          <p class="culture-statement"><span v-for="(part, index) in vision" :key="index" :class="{ 'culture-phrase': part.keepTogether }">{{ part.text }}</span></p>
          <span class="culture-card-number" aria-hidden="true">01</span>
        </article>
      </div>
      <div class="culture-reveal culture-mission" style="--culture-delay: 140ms">
        <article class="culture-card culture-card-mission" :aria-labelledby="`${id}-mission`">
          <h2 :id="`${id}-mission`" class="culture-eyebrow">
            <i aria-hidden="true" />
            <span>{{ chinese ? "我们的使命 / MISSION" : "MISSION" }}</span>
          </h2>
          <p class="culture-statement"><span v-for="(part, index) in mission" :key="index" :class="{ 'culture-phrase': part.keepTogether }">{{ part.text }}</span></p>
          <span class="culture-card-number" aria-hidden="true">02</span>
        </article>
      </div>
      <div class="culture-reveal culture-values" style="--culture-delay: 280ms">
        <h2 :id="`${id}-values`" class="culture-eyebrow culture-values-heading">
          <i aria-hidden="true" />
          <span>{{ chinese ? "价值观 / VALUES" : "VALUES" }}</span>
        </h2>
        <ul class="culture-values-grid" :aria-labelledby="`${id}-values`">
          <li v-for="value in values" :key="value">{{ value }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.company-culture {
  padding-block: clamp(40px, 5vw, 76px) clamp(48px, 5vw, 80px);
  color: #123a50;
  font-family: var(--f-ui);
}
.culture-layout {
  max-width: 1180px;
  margin-inline: auto;
  display: grid;
  gap: 28px;
}
.culture-vision {
  width: 95%;
}
.culture-mission {
  width: 92%;
  justify-self: end;
}
.culture-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: clamp(28px, 3.2vw, 42px) clamp(26px, 4vw, 52px);
  border: 1px solid #dae9ee;
  transition: transform 240ms ease, box-shadow 240ms ease, border-color 240ms ease;
}
.culture-card-vision {
  background: linear-gradient(110deg, #f3fafc, #eaf6fa);
  border-color: transparent;
}
.culture-card-mission {
  background: #fff;
  box-shadow: 0 14px 34px #193e5010;
}
.culture-eyebrow {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 0;
  color: #438898;
  font-size: 12px;
  line-height: 1.7;
  font-weight: 500;
  letter-spacing: 1.8px;
}
.culture-eyebrow i {
  flex: 0 0 24px;
  height: 2px;
  background: #098da0;
}
.culture-statement {
  position: relative;
  z-index: 1;
  margin: 22px 0 0;
  max-width: 960px;
  color: #123a50;
  font-size: clamp(22px, 2vw, 30px);
  line-height: 1.65;
  font-weight: 650;
  letter-spacing: -0.5px;
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.culture-card-mission .culture-statement {
  max-width: 870px;
  font-size: clamp(21px, 1.8vw, 27px);
}
.culture-phrase { white-space: nowrap; }
.culture-card-number {
  position: absolute;
  right: 22px;
  bottom: -26px;
  z-index: 0;
  color: #078a9e;
  opacity: 0.065;
  font: 650 clamp(100px, 11vw, 148px)/1 var(--f-din);
  letter-spacing: -7px;
  pointer-events: none;
  user-select: none;
}
.culture-card-mission .culture-card-number {
  opacity: 0.035;
}
.culture-values {
  padding-top: 14px;
}
.culture-values-heading {
  color: #6c8b9c;
  margin-bottom: 18px;
}
.culture-values-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.culture-values-grid li {
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 60px;
  padding: 14px 20px;
  border: 1px solid #dbeaf0;
  background: #f5fafc;
  color: #2a566d;
  font-size: 15px;
  line-height: 1.7;
  text-align: center;
  transition: background 220ms ease, border-color 220ms ease;
}
.culture-animated:not(.is-entered) .culture-reveal {
  opacity: 0;
  transform: translateY(32px);
}
.culture-animated.is-entered .culture-reveal {
  animation: culture-enter 640ms cubic-bezier(0.2, 0.7, 0.25, 1) both;
  animation-delay: var(--culture-delay);
}
@keyframes culture-enter {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (hover: hover) and (pointer: fine) {
  .culture-card:hover {
    transform: translateY(-6px);
    border-color: #bddbe5;
    box-shadow: 0 22px 45px #193e501c;
  }
  .culture-values-grid li:hover {
    background: #eaf5f9;
    border-color: #bcdbe5;
  }
}
@media (max-width: 900px) {
  .culture-layout { gap: 24px; }
  .culture-vision { width: 100%; }
  .culture-mission { width: 94%; }
  .culture-card { padding: 28px 30px; }
}
@media (max-width: 600px) {
  .company-culture { padding-block: 36px 44px; }
  .culture-layout { gap: 18px; }
  .culture-mission { width: calc(100% - 12px); }
  .culture-card { padding: 24px 22px; }
  .culture-eyebrow { gap: 9px; font-size: 10px; letter-spacing: 1.3px; }
  .culture-eyebrow i { flex-basis: 20px; }
  .culture-statement,
  .culture-card-mission .culture-statement {
    margin-top: 16px;
    font-size: 20px;
    line-height: 1.7;
    letter-spacing: 0;
  }
  .culture-card-number { right: 12px; bottom: -18px; font-size: 100px; }
  .culture-values { padding-top: 8px; }
  .culture-values-heading { margin-bottom: 14px; }
  .culture-values-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .culture-values-grid li { min-height: 50px; padding: 11px 10px; font-size: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .culture-animated .culture-reveal {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .culture-card,
  .culture-values-grid li { transition: none; }
  .culture-card:hover { transform: none; }
}
</style>
