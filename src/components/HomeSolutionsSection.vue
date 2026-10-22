<script setup>
import { computed, nextTick, ref } from 'vue'
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
const selectedId = ref(''), tablist = ref(null)
const current = computed(() => solutions.value.find(item => item.product.id === selectedId.value) || solutions.value[0])
function tabLabel(item) {
  const industry = item.industry ? field(item.industry, 'title') : item.industryLabel
  return solutions.value.filter(other => other.industry?.id === item.industry?.id).length > 1 ? industry + ' / ' + field(item.product, 'title') : industry
}
async function moveTab(event, index) {
  const length = solutions.value.length
  const target = { ArrowRight: (index + 1) % length, ArrowLeft: (index - 1 + length) % length, Home: 0, End: length - 1 }[event.key]
  if (target === undefined) return
  event.preventDefault()
  selectedId.value = solutions.value[target].product.id
  await nextTick()
  const tab = tablist.value?.querySelectorAll('[role="tab"]')[target]
  tab?.focus({ preventScroll: true })
  tab?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
}
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
      <div v-if="current" class="j-solution-list">
        <div ref="tablist" class="solution-tabs" role="tablist" aria-label="行业方案">
          <button v-for="(item, index) in solutions" :id="'solution-tab-' + item.product.id" :key="item.product.id" type="button" role="tab" :aria-selected="current.product.id === item.product.id" :tabindex="current.product.id === item.product.id ? 0 : -1" :aria-controls="'home-solution-' + item.product.id" @click="selectedId = item.product.id" @keydown="moveTab($event, index)"><span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>{{ tabLabel(item) }}</button>
        </div>
        <article v-for="item in solutions" v-show="current.product.id === item.product.id" :id="'home-solution-' + item.product.id" :key="item.product.id" class="j-solution-row" role="tabpanel" tabindex="0" :data-solution-id="item.product.id" :data-industry="item.industry?.id" :aria-labelledby="'solution-tab-' + item.product.id">
          <router-link class="j-solution-image" :to="item.to" :aria-label="item.industryLabel">
            <img v-if="item.product.image" :src="item.product.image" :alt="field(item.product, 'title')" loading="lazy" decoding="async" />
            <div v-else class="j-solution-image-empty"><el-icon><Picture /></el-icon></div>
          </router-link>
          <div class="j-solution-copy">
            <span class="hc-kick">{{ item.kicker }}</span>
            <h3>{{ item.title }}</h3>
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
.j-home-solutions.hc-sec { padding:68px 0; background:#f3f8f9; }
.j-home-solutions .hc-shead { margin-bottom:32px; gap:25px; }.j-home-solutions .hc-h2 { font-size:38px; line-height:1.4; white-space:pre-line; }.j-all-solutions { flex-shrink:0; border-bottom:1px solid #a6cbd2; }
.solution-tabs { display:flex; border-bottom:1px solid #cfdee4; margin-bottom:32px; overflow-x:auto; scrollbar-width:thin; }
.solution-tabs button { display:flex; align-items:center; gap:13px; flex:1 0 auto; justify-content:center; padding:20px 10px; border:0; border-bottom:2px solid transparent; background:transparent; color:#607e8b; font:14px var(--f-ui); cursor:pointer; white-space:nowrap; }
.solution-tabs button>span { font-size:10px; color:#8da4ad; }.solution-tabs button[aria-selected=true] { color:#087f91; border-bottom-color:#087f91; font-weight:600; }
.j-solution-row { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,1fr); gap:65px; align-items:center; }
.j-solution-image { display:block; overflow:hidden; min-width:0; background:#e6f0f3; }.j-solution-image img,.j-solution-image-empty { display:block; width:100%; height:360px; object-fit:cover; }.j-solution-image img { transition:transform .4s; }.j-solution-image:hover img { transform:scale(1.025); }.j-solution-image-empty { display:grid; place-items:center; color:#7a9da9; font-size:48px; }
.j-solution-copy { min-width:0; }.j-solution-copy .hc-kick { display:block; color:#688493; font-size:10px; line-height:1.8; letter-spacing:1.6px; }.j-solution-copy h3 { margin:15px 0 0; font-size:34px; line-height:1.4; white-space:pre-line; font-weight:650; color:#123a50; overflow-wrap:anywhere; }.j-solution-copy .j-rule { margin:23px 0; width:38px; height:2px; }.j-solution-copy p { color:#587583; font-size:13px; line-height:1.95; margin:0; white-space:pre-line; }.j-solution-copy .j-button { margin-top:25px; font-size:12px; min-height:44px; min-width:170px; }
button:focus-visible,.j-solution-row:focus-visible { outline:2px solid #087f91; outline-offset:-3px; }
@media(max-width:1100px) { .j-solution-row { gap:35px; }.j-solution-copy h3 { font-size:29px; }.solution-tabs button { font-size:12px; gap:8px; } }
@media(max-width:700px) {
 .j-home-solutions.hc-sec { padding-block:36px; }.j-home-solutions .hc-shead { margin-bottom:22px; align-items:flex-end; }.j-home-solutions .hc-h2 { font-size:28px; }.j-all-solutions { font-size:10px; gap:12px; }
 .solution-tabs { margin-bottom:22px; }.solution-tabs button { min-width:90px; padding:15px 10px; font-size:12px; gap:8px; }.solution-tabs button>span { font-size:8px; }
 .j-solution-row { grid-template-columns:1fr; gap:23px; }.j-solution-image img,.j-solution-image-empty { height:210px; }.j-solution-copy h3 { font-size:27px; }.j-solution-copy p { font-size:12px; }.j-solution-copy .j-button { margin-top:20px; }
}
@media(prefers-reduced-motion:reduce) { .j-solution-image img { transition:none; } }
</style>
