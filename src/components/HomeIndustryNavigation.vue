<script setup>
import { useI18n } from "vue-i18n";
import IndustryIcon from "./IndustryIcon.vue";
import { industryField } from "../services/industries.js";

defineProps({ industries: { type: Array, default: () => [] } });
const { locale } = useI18n({ useScope: "global" });
const text = (zh, en) => (locale.value === "zh" ? zh : en);
</script>

<template>
  <section
    v-if="industries.length"
    id="industries"
    class="home-industry-nav"
    aria-labelledby="home-industry-heading"
  >
    <div class="hc-w home-industry-inner">
      <header class="home-industry-intro">
        <h2 id="home-industry-heading">{{ text("应用行业", "Industries") }}</h2>
        <router-link
          class="home-industry-all"
          to="/solutions"
          data-analytics-event="cta_click"
          data-analytics-target="home-industries-all"
        >
          {{ text("全部产品", "All products")
          }}<span aria-hidden="true">↗</span>
        </router-link>
      </header>
      <nav
        class="home-industry-links"
        :style="{ '--industry-count': industries.length }"
        :aria-label="text('选择应用行业', 'Choose an industry')"
      >
        <router-link
          v-for="industry in industries"
          :key="industry.id"
          class="home-industry-link"
          :to="{ path: '/solutions', query: { industry: industry.id } }"
          :aria-label="
            [
              industryField(industry, 'title', locale),
              industryField(industry, 'subtitle', locale),
            ]
              .filter(Boolean)
              .join(' · ')
          "
          :title="industryField(industry, 'subtitle', locale) || undefined"
          data-analytics-event="industry_filter"
          :data-analytics-target="industry.id"
        >
          <IndustryIcon class="home-industry-icon" :icon="industry.icon" />
          <span class="home-industry-name">{{
            industryField(industry, "title", locale)
          }}</span>
        </router-link>
      </nav>
    </div>
  </section>
</template>

<style scoped>
.home-industry-nav {
  background: linear-gradient(110deg, #eff7f8, #f9fcfc);
  border-bottom: 1px solid #e0ebee;
}
.home-industry-inner {
  padding-block: 22px 20px;
}
.home-industry-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.home-industry-intro h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #123a50;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.5;
  letter-spacing: -0.3px;
}
.home-industry-intro h2:before {
  content: "";
  display: block;
  width: 3px;
  height: 14px;
  background: #087f91;
}
.home-industry-all {
  display: inline-flex;
  align-items: center;
  gap: 13px;
  color: #087f91;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
  text-decoration: none;
  white-space: nowrap;
}
.home-industry-all span {
  font-size: 16px;
  font-weight: 400;
  transition: transform 0.2s;
}
.home-industry-all:hover span {
  transform: translate(2px, -2px);
}
.home-industry-links {
  display: grid;
  grid-template-columns: repeat(var(--industry-count), minmax(0, 1fr));
  column-gap: 12px;
  row-gap: 12px;
  min-width: 0;
}
.home-industry-link {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-width: 0;
  min-height: 74px;
  padding: 8px 4px;
  color: #123a50;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}
.home-industry-link:before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  background: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}
.home-industry-link:after {
  content: "";
  position: absolute;
  left: calc(50% - 13px);
  bottom: 0;
  width: 26px;
  height: 2px;
  background: #087f91;
  transform: scaleX(0);
  transition: transform 0.24s;
}
.home-industry-link .home-industry-icon {
  width: 30px;
  height: 30px;
  color: #087f91;
  transition: transform 0.24s;
}
.home-industry-name {
  display: block;
  min-width: 0;
  color: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  overflow-wrap: anywhere;
  text-wrap: balance;
  transition: color 0.2s;
}
.home-industry-link:focus-visible {
  color: #087f91;
  outline: 2px solid #087f91;
  outline-offset: 3px;
}
.home-industry-link:focus-visible:before {
  opacity: 1;
}
.home-industry-link:focus-visible:after {
  transform: scaleX(1);
}
.home-industry-link:active {
  background: #e0eff2;
}
@media (hover: hover) and (pointer: fine) {
  .home-industry-link:hover {
    color: #087f91;
  }
  .home-industry-link:hover:before {
    opacity: 1;
  }
  .home-industry-link:hover:after {
    transform: scaleX(1);
  }
  .home-industry-link:hover .home-industry-icon {
    transform: translateY(-2px);
  }
}
@media (max-width: 1250px) and (min-width: 1001px) {
  .home-industry-links {
    column-gap: 8px;
  }
  .home-industry-link {
    padding-inline: 2px;
  }
  .home-industry-name {
    font-size: 13px;
    letter-spacing: -0.2px;
  }
}
@media (max-width: 1000px) {
  .home-industry-links {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
/* Match the approved B concept, including its 197px height with ten industries. */
@media (max-width: 700px) {
  .home-industry-inner {
    padding-block: 17px;
  }
  .home-industry-intro {
    margin-bottom: 12px;
  }
  .home-industry-all {
    font-size: 11px;
  }
  .home-industry-all span {
    font-size: 15px;
  }
  .home-industry-links {
    column-gap: 6px;
    row-gap: 12px;
  }
  .home-industry-link {
    gap: 7px;
    min-height: 57px;
    padding: 1px 0;
  }
  .home-industry-link .home-industry-icon {
    width: 25px;
    height: 25px;
  }
  .home-industry-name {
    font-size: 11px;
    letter-spacing: -0.2px;
  }
}
@media (max-width: 350px) {
  .home-industry-links {
    column-gap: 2px;
  }
  .home-industry-name {
    font-size: 10px;
  }
  .home-industry-link .home-industry-icon {
    width: 24px;
    height: 24px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .home-industry-nav *,
  .home-industry-nav :before,
  .home-industry-nav :after {
    transition: none;
  }
  .home-industry-link:hover .home-industry-icon,
  .home-industry-all:hover span {
    transform: none;
  }
}
</style>
