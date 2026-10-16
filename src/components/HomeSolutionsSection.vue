<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Picture } from '@element-plus/icons-vue'
import { localizedField } from '../services/catalog.js'
import { resolveHomeSolution, solutionText } from '../data/homeSolutions.js'

const props = defineProps({
  configuration: { type: Object, required: true },
  products: { type: Array, default: () => [] },
  industries: { type: Array, default: () => [] },
  localeCode: { type: String, default: '' },
})
const { locale } = useI18n({ useScope: 'global' })
const language = computed(() => props.localeCode || locale.value)
const field = (item, name) => localizedField(item, name, language.value)
const sectionText = key => solutionText(props.configuration.section[key], language.value)
const solutions = computed(() => props.products.map(product => resolveHomeSolution(props.configuration, product, props.industries, language.value)))
</script>

<template>
  <section id="solutions" class="hc-sec j-home-solutions" aria-labelledby="home-solutions-title">
    <div class="hc-w">
      <div class="hc-shead">
        <div>
          <span class="hc-kick">{{ sectionText('kicker') }}</span>
          <h2 id="home-solutions-title" class="hc-h2">{{ sectionText('title') }}</h2>
        </div>
        <router-link class="j-link j-all-solutions" to="/solutions" data-analytics-event="cta_click" data-analytics-target="home-all-solutions">
          {{ sectionText('buttonText') }}<span aria-hidden="true">→</span>
        </router-link>
      </div>
      <div v-if="solutions.length" class="j-solution-list">
        <article v-for="(item, index) in solutions" :key="item.product.id" class="j-solution-row" :class="{ 'is-reversed': index % 2 === 1 }" :data-solution-id="item.product.id" :data-industry="item.industry?.id" :aria-labelledby="`home-solution-${item.product.id}`">
          <router-link class="j-solution-image" :to="item.to" :aria-label="item.industryLabel">
            <img v-if="item.product.image" :src="item.product.image" :alt="field(item.product, 'title')" loading="lazy" decoding="async" />
            <div v-else class="j-solution-image-empty"><el-icon><Picture /></el-icon></div>
          </router-link>
          <div class="j-solution-copy">
            <span class="hc-kick">{{ item.kicker }}</span>
            <h3 :id="`home-solution-${item.product.id}`">{{ item.title }}</h3>
            <span class="j-rule" aria-hidden="true"></span>
            <p class="hc-p">{{ item.description }}</p>
            <router-link class="j-button" :to="item.to" data-analytics-event="industry_filter" :data-analytics-target="item.industry?.id || 'all'">
              {{ item.industryLabel }}<span aria-hidden="true">→</span>
            </router-link>
          </div>
        </article>
      </div>
      <el-empty v-else :description="$t('site.noProductsForIndustry')" />
    </div>
  </section>
</template>

<style scoped>
.j-home-solutions.hc-sec { padding: 24px 0 64px; background: #fff; }
.j-home-solutions .hc-shead { margin-bottom: 24px; }
.j-home-solutions .hc-shead .hc-h2 { font-size: clamp(27px, 2.6vw, 36px); white-space: pre-line; }
.j-all-solutions { flex-shrink: 0; border-bottom: 1px solid #a6cbd2; }
.j-solution-list { display: grid; gap: 0; isolation: isolate; }
.j-solution-row { position: relative; display: grid; grid-template-columns: minmax(0, 1.42fr) minmax(0, 1fr); gap: clamp(40px, 5vw, 76px); align-items: center; padding: 48px 0; }
.j-solution-row.is-reversed { grid-template-columns: minmax(0, 1fr) minmax(0, 1.42fr); }
.j-solution-row.is-reversed::before { content: ''; position: absolute; z-index: -1; inset-block: 0; left: 50%; width: 100vw; transform: translateX(-50%); background: #f4f9fa; }
.j-solution-row.is-reversed .j-solution-image { order: 2; }
.j-solution-row.is-reversed .j-solution-copy { order: 1; }
.j-solution-image { display: block; overflow: hidden; min-width: 0; background: #edf6f7; }
.j-solution-image img, .j-solution-image-empty { display: block; width: 100%; aspect-ratio: 1.8; object-fit: cover; }
.j-solution-image img { transition: transform .4s; }
.j-solution-image:hover img { transform: scale(1.025); }
.j-solution-image-empty { display: grid; place-items: center; color: #7a9da9; font-size: 48px; }
.j-solution-copy { min-width: 0; padding: 12px 0; }
.j-solution-copy .hc-kick { display: block; color: #6c8795; font-size: 10px; letter-spacing: 1.6px; line-height: 1.7; }
.j-solution-copy h3 { margin-top: 14px; color: #123a50; font: 700 clamp(29px, 2.7vw, 38px)/1.3 var(--f-ui); letter-spacing: -.8px; white-space: pre-line; overflow-wrap: break-word; text-wrap: pretty; }
.j-solution-copy .j-rule { width: 42px; margin: 21px 0 22px; }
.j-solution-copy .hc-p { max-width: 445px; font-size: 14px; line-height: 1.95; }
.j-solution-copy .j-button { gap: 28px; margin-top: 25px; min-width: 180px; max-width: 100%; white-space: normal; }
@media (max-width: 1050px) {
  .j-solution-row, .j-solution-row.is-reversed { gap: 36px; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); padding: 38px 0; }
  .j-solution-row.is-reversed { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); }
  .j-solution-copy h3 { font-size: 29px; }
  .j-solution-copy .hc-p { font-size: 13px; }
}
@media (max-width: 700px) {
  .j-home-solutions.hc-sec { padding: 12px 0 32px; }
  .j-home-solutions .hc-shead { margin-bottom: 12px; gap: 16px; }
  .j-solution-row, .j-solution-row.is-reversed { display: flex; flex-direction: column; gap: 25px; align-items: stretch; padding: 32px 0; }
  .j-solution-row.is-reversed .j-solution-image { order: 0; }
  .j-solution-row.is-reversed .j-solution-copy { order: 1; }
  .j-solution-copy { padding: 0; }
  .j-solution-image img, .j-solution-image-empty { aspect-ratio: 1.6; }
  .j-solution-copy h3 { font-size: 29px; margin-top: 11px; }
  .j-solution-copy .j-rule { margin: 18px 0 20px; }
  .j-solution-copy .j-button { margin-top: 22px; min-width: 168px; }
  .j-solution-copy .hc-p { max-width: none; font-size: 13px; line-height: 1.95; }
}
@media (prefers-reduced-motion: reduce) { .j-solution-image img { transition: none; } }
</style>
