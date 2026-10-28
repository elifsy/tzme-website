<script setup>
import { computed, ref } from "vue";
const props = defineProps({
  configuration: { type: Object, default: null },
  placement: { type: String, default: "home" },
  preview: Boolean,
});
const items = computed(
  () =>
    props.configuration?.items.filter((item) => item.enabled && item.image) ||
    [],
);
const shown = computed(
  () =>
    props.configuration &&
    (props.preview ||
      (props.configuration.enabled &&
        props.configuration[
          props.placement === "about" ? "showOnAbout" : "showOnHome"
        ])) &&
    items.value.length,
);
const expanded = ref(false);
</script>

<template>
  <section
    v-if="shown"
    id="partners"
    class="partners-section"
    :class="{ 'partners-expanded': expanded }"
    aria-labelledby="partners-heading"
  >
    <div class="hc-w">
      <header class="partners-header">
        <div>
          <span class="hc-kick">{{ configuration.kicker }}</span>
          <h2 id="partners-heading">{{ configuration.title }}</h2>
        </div>
        <p>{{ configuration.description }}</p>
      </header>
      <ul class="partners-grid" aria-label="合作伙伴">
        <li
          v-for="item in items"
          :key="item.id"
          class="partner-tile"
          :title="item.name"
        >
          <img
            :src="item.image"
            :alt="item.name"
            width="240"
            height="180"
            loading="lazy"
            decoding="async"
          />
        </li>
      </ul>
      <button
        v-if="items.length > 6"
        type="button"
        class="partners-more"
        :aria-expanded="expanded"
        :data-analytics-event="preview ? undefined : 'cta_click'"
        :data-analytics-target="
          expanded ? 'partners-collapse' : 'partners-expand'
        "
        @click="expanded = !expanded"
      >
        {{ expanded ? "收起合作伙伴" : `查看更多合作伙伴`
        }}<span aria-hidden="true">{{ expanded ? "−" : "＋" }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.partners-section {
  padding: 64px 0 58px;
  background: #fff;
  color: #123a50;
  font-family: var(--f-ui);
  scroll-margin-top: calc(var(--site-nav-height) + 20px);
}
.partners-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: end;
  margin-bottom: 30px;
}
.partners-header .hc-kick {
  color: #668899;
  font-size: 10px;
  letter-spacing: 1.4px;
}
.partners-header h2 {
  margin: 13px 0 0;
  font-size: clamp(28px, 2.45vw, 40px);
  line-height: 1.45;
  letter-spacing: -0.8px;
  white-space: pre-line;
}
.partners-header p {
  max-width: 430px;
  justify-self: end;
  color: #587686;
  font-size: 14px;
  line-height: 1.95;
  margin: 0 0 4px;
  white-space: pre-line;
}
.partners-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid #dce7eb;
  border-left: 1px solid #e4ecef;
  background: #fff;
}
.partner-tile {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
  height: 102px;
  border-right: 1px solid #e4ecef;
  border-bottom: 1px solid #e4ecef;
  padding: 12px 21px;
  box-sizing: border-box;
  overflow: hidden;
  transition: background 0.2s;
}
.partner-tile img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
  transition: transform 0.25s ease;
}
.partner-tile:hover {
  background: #f3f8fa;
}
.partner-tile:hover img {
  transform: scale(1.045);
}
.partners-more {
  display: none;
}
@media (max-width: 1100px) {
  .partners-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .partner-tile {
    height: 100px;
  }
  .partners-header {
    gap: 30px;
  }
}
@media (max-width: 700px) {
  .partners-section {
    padding: 34px 0;
  }
  .partners-header {
    grid-template-columns: 1fr;
    gap: 14px;
    margin-bottom: 23px;
  }
  .partners-header h2 {
    font-size: 28px;
  }
  .partners-header p {
    justify-self: start;
    font-size: 12px;
    line-height: 1.9;
    max-width: 100%;
    margin: 0;
  }
  .partners-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .partner-tile {
    height: 87px;
    padding: 10px;
  }
  .partners-section:not(.partners-expanded) .partner-tile:nth-child(n + 7) {
    display: none;
  }
  .partners-more {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 17px 1px 0;
    border: 0;
    background: none;
    color: #087f91;
    font: 600 12px/1.8 var(--f-ui);
    cursor: pointer;
  }
  .partners-more > span {
    font-size: 17px;
    font-weight: 400;
  }
  .partners-more:focus-visible {
    outline: 2px solid #087f91;
    outline-offset: 4px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .partner-tile,
  .partner-tile img {
    transition: none;
  }
  .partner-tile:hover img {
    transform: none;
  }
}
</style>
