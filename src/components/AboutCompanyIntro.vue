<script setup>
import { responsiveImage } from "../utils/responsiveImages.js";
import { computed } from "vue";
import { aboutText } from "../data/aboutTzme.js";
import CompanyStatistics from "./CompanyStatistics.vue";

const props = defineProps({
  configuration: { type: Object, required: true },
  localeCode: { type: String, default: "zh" },
});
const field = (key) => aboutText(props.configuration[key], props.localeCode);
const paragraphs = computed(() =>
  ["description", "description2"]
    .flatMap((key) => field(key).split(/\r?\n\s*\r?\n/))
    .map((paragraph) => paragraph.trim())
    .filter(Boolean),
);
const chapterTitles = ["企业沿革", "制造布局", "产品与全球业务"];
</script>

<template>
  <div class="company-intro">
    <section class="company-hero" aria-labelledby="about-page-title">
      <div
        class="hc-w company-hero-grid"
        :class="{ 'without-photo': !configuration.image }"
      >
        <div class="company-hero-copy">
          <span class="company-eyebrow"
            ><i aria-hidden="true" />{{ field("kicker") }}</span
          >
          <h1 id="about-page-title" class="site-page-title">
            <span>{{ field("titleLine1") }}</span
            ><span v-if="field('titleLine2')">{{ field("titleLine2") }}</span>
          </h1>
          <div class="company-hero-actions">
            <a class="company-overview-link" href="#company-overview"
              >完整公司介绍<span aria-hidden="true">↓</span></a
            >
            <a class="company-bases-link" href="#manufacturing-bases"
              >走进制造基地<span aria-hidden="true">↗</span></a
            >
          </div>
        </div>
        <figure v-if="configuration.image" class="company-hero-photo">
          <img
            v-bind="
              responsiveImage(
                configuration.image,
                '(max-width:700px) 100vw, 54vw',
              )
            "
            :alt="field('imageAlt') || '制造基地实景'"
            fetchpriority="high"
            decoding="async"
          />
          <figcaption>
            <span>TIANJIN / MANUFACTURING</span
            ><span>从制造基地，到全球工程现场。</span>
          </figcaption>
        </figure>
        <CompanyStatistics
          class="company-intro-statistics"
          :entries="configuration.entries"
        />
      </div>
    </section>

    <section
      id="company-overview"
      class="company-overview refine-about-overview hc-w"
      aria-labelledby="company-overview-title"
    >
      <header class="company-overview-heading">
        <h2 id="company-overview-title">公司介绍</h2>
        <span aria-hidden="true">COMPANY PROFILE</span>
      </header>
      <div class="company-overview-grid">
        <article
          v-for="(paragraph, index) in paragraphs"
          :key="index"
          class="company-overview-chapter"
          :class="{ 'is-lead': index === 0 }"
        >
          <header>
            <span aria-hidden="true">{{
              String(index + 1).padStart(2, "0")
            }}</span>
            <h3 v-if="chapterTitles[index]">{{ chapterTitles[index] }}</h3>
          </header>
          <p class="site-intro-description">{{ paragraph }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.company-intro {
  color: #123a50;
}
.company-hero {
  background: linear-gradient(110deg, #f2f8fa, #fbfdfd 58%, #fff);
}
.company-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.3fr);
  grid-template-areas: "copy photo" "stats photo";
  gap: 32px clamp(36px, 4.5vw, 78px);
  padding-block: var(--site-hero-copy-top, 64px) 44px;
  align-items: center;
}
.company-hero-copy {
  grid-area: copy;
  min-width: 0;
  align-self: start;
}
.company-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #5f7c89;
  font-size: 11px;
  line-height: var(--site-hero-kicker-line-height, 20px);
  letter-spacing: 1.8px;
}
.company-eyebrow i {
  width: 25px;
  height: 2px;
  background: #087f91;
}
.company-hero h1 {
  margin: var(--site-hero-title-gap, 12px) 0 0;
  color: #123a50;
  font-size: clamp(38px, 3.4vw, 62px);
  font-weight: 650;
  line-height: 1.3;
  letter-spacing: -1.5px;
  overflow-wrap: anywhere;
}
.company-hero h1 > span {
  display: block;
}
.company-hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px 25px;
  margin-top: 28px;
}
.company-hero-actions a {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 26px;
  min-height: 42px;
  color: #087f91;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}
.company-hero-actions .company-overview-link {
  padding: 0 18px;
  background: #087f91;
  color: #fff;
}
.company-hero-actions span {
  font-size: 17px;
  font-weight: 400;
  transition: transform 0.2s;
}
.company-overview-link:hover span {
  transform: translateY(3px);
}
.company-bases-link:hover span {
  transform: translate(2px, -2px);
}
.company-hero-actions a:focus-visible {
  outline: 2px solid #087f91;
  outline-offset: 5px;
}
.company-hero-photo {
  position: relative;
  grid-area: photo;
  min-width: 0;
  height: clamp(410px, 34vw, 520px);
  margin: 0;
  overflow: hidden;
}
.company-hero-photo > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 58%;
}
.company-hero-photo figcaption {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  padding: 54px 25px 22px;
  color: #fff;
  background: linear-gradient(transparent, #123a5080);
  font-size: 11px;
  line-height: 1.8;
}
.company-hero-photo figcaption > span:first-child {
  font-size: 9px;
  letter-spacing: 1.5px;
}
.company-intro .company-intro-statistics {
  grid-area: stats;
  align-self: start;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 23px 30px;
  padding: 25px 0 0;
  border-top: 1px solid #cbdde3;
  border-bottom: 0;
}
.company-intro .company-intro-statistics :deep(> div) {
  flex-direction: column;
  align-items: start;
  gap: 7px;
  padding: 0;
  border: 0;
}
.company-intro .company-intro-statistics :deep(dd) {
  font-size: clamp(27px, 2.3vw, 38px);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.8px;
  line-height: 1.15;
}
.company-intro .company-intro-statistics :deep(small) {
  font-size: 12px;
  letter-spacing: 0;
}
.company-intro .company-intro-statistics :deep(dt) {
  font-size: 11px;
  line-height: 1.7;
}
.company-hero-grid.without-photo {
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.75fr);
  grid-template-areas: "copy stats";
  gap: 60px;
  padding-block: var(--site-hero-copy-top, 64px) 55px;
}
.without-photo .company-intro-statistics {
  align-self: center;
}
.company-overview {
  padding-block: 50px 48px;
  scroll-margin-top: calc(var(--site-nav-height, 96px) + 22px);
}
.company-overview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
}
.company-overview-heading h2 {
  margin: 0;
  color: #123a50;
  font-size: 30px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: -0.5px;
}
.company-overview-heading > span {
  color: #78919c;
  font-size: 10px;
  letter-spacing: 2px;
}
.company-overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px 50px;
  margin-top: 28px;
}
.company-overview-chapter {
  min-width: 0;
  padding-top: 20px;
  border-top: 1px solid #d4e3e8;
}
.company-overview-chapter > header {
  display: flex;
  align-items: center;
  gap: 16px;
}
.company-overview-chapter > header > span {
  color: #087f91;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.company-overview-chapter h3 {
  margin: 0;
  color: #123a50;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.7;
}
.company-overview-chapter p {
  margin: 14px 0 0;
  color: #526f7d;
  font-size: 14px;
  line-height: 2;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.company-overview-chapter.is-lead {
  grid-column: 1 / -1;
}
.company-overview-chapter.is-lead p {
  max-width: 1100px;
  color: #254c60;
  font-size: 19px;
  line-height: 1.9;
}
@media (max-width: 1100px) {
  .company-hero-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    gap: 27px 32px;
    padding-block: var(--site-hero-copy-top, 48px) 34px;
  }
  .company-hero h1 {
    font-size: 40px;
  }
  .company-hero-photo {
    height: 440px;
  }
  .company-hero-photo figcaption {
    flex-direction: column;
    align-items: start;
    gap: 5px;
    padding: 40px 20px 18px;
  }
  .company-hero-actions {
    gap: 12px 18px;
    margin-top: 22px;
  }
  .company-hero-actions a {
    gap: 16px;
  }
  .company-intro .company-intro-statistics {
    gap: 22px;
  }
  .company-overview-grid {
    column-gap: 32px;
  }
}
@media (max-width: 800px) {
  .company-hero-grid,
  .company-hero-grid.without-photo {
    grid-template-columns: 1fr;
    grid-template-areas: "copy" "photo" "stats";
    gap: 26px;
    padding-block: var(--site-hero-copy-top, 24px) 30px;
  }
  .company-hero-grid.without-photo {
    grid-template-areas: "copy" "stats";
  }
  .company-hero h1 {
    font-size: 38px;
  }
  .company-hero-photo {
    height: 320px;
  }
  .company-intro .company-intro-statistics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
    padding-top: 23px;
  }
  .company-intro .company-intro-statistics :deep(dd) {
    font-size: 28px;
  }
  .company-overview {
    padding-block: 36px;
  }
  .company-overview-heading h2 {
    font-size: 27px;
  }
  .company-overview-grid {
    gap: 25px;
    margin-top: 23px;
  }
  .company-overview-chapter.is-lead p {
    font-size: 17px;
  }
}
@media (max-width: 600px) {
  .company-hero-grid {
    gap: 24px;
  }
  .company-eyebrow {
    font-size: 10px;
  }
  .company-hero h1 {
    font-size: 34px;
    line-height: 1.35;
    letter-spacing: -0.7px;
  }
  .company-hero-actions a {
    font-size: 11px;
    min-height: 40px;
  }
  .company-hero-photo {
    height: 228px;
  }
  .company-hero-photo figcaption {
    padding: 35px 16px 14px;
    font-size: 10px;
  }
  .company-hero-photo figcaption > span:first-child {
    font-size: 8px;
  }
  .company-intro .company-intro-statistics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px 26px;
    padding-top: 22px;
  }
  .company-intro .company-intro-statistics :deep(dd) {
    font-size: 29px;
  }
  .company-intro .company-intro-statistics :deep(dt) {
    font-size: 10px;
  }
  .company-overview {
    padding-block: 32px 36px;
  }
  .company-overview-heading h2 {
    font-size: 24px;
  }
  .company-overview-heading > span {
    font-size: 8px;
    letter-spacing: 1px;
  }
  .company-overview-grid {
    grid-template-columns: 1fr;
    gap: 24px;
    margin-top: 22px;
  }
  .company-overview-chapter {
    padding-top: 17px;
  }
  .company-overview-chapter p {
    font-size: 14px;
    line-height: 2;
    margin-top: 12px;
  }
  .company-overview-chapter.is-lead p {
    font-size: 16px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .company-hero-actions span {
    transition: none;
  }
}
</style>
