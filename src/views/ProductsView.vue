<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import SiteNav from '../components/SiteNav.vue'
import SiteFooter from '../components/SiteFooter.vue'
import EquipmentImage from '../components/EquipmentImage.vue'
import ProductShowcase from '../components/ProductShowcase.vue'
import { useDesignPage } from '../composables/useDesignPage.js'
import { useSiteContent } from '../services/website.js'
import { localizedField, useProductCatalog } from '../services/catalog.js'
import { useIndustryCatalog } from '../services/industries.js'
import { useProductShowcase } from '../services/productShowcase.js'
import { hasIndustryProducts, productShowcaseLink } from '../data/productShowcase.js'
import { trackEvent } from '../services/analytics.js'
import { dataErrors } from '../services/api.js'

const page = ref(null), categoriesExpanded = ref(false), catalogReady = ref(false)
const route = useRoute(), router = useRouter()
const { siteAsset } = useSiteContent()
const { products, loading: productsLoading, loadProducts } = useProductCatalog()
const { industries, loadIndustries } = useIndustryCatalog()
const { configuration, loadProductShowcase } = useProductShowcase()
useDesignPage('hc-products', page)
const publishedProducts = computed(() => products.value.filter(item => item.status === 'published'))
const activeIndustries = computed(() => industries.value.filter(item => item.status === 'published' && hasIndustryProducts(item, publishedProducts.value)))
const selectedIndustry = computed(() => activeIndustries.value.some(item => item.id === route.query.industry) ? route.query.industry : '')
const industry = computed(() => activeIndustries.value.find(item => item.id === selectedIndustry.value))
const categoryKey = item => item.categoryEn || item.category || item.categoryZh || ''
const requestedCategories = computed(() => (Array.isArray(route.query.cat) ? route.query.cat : [route.query.cat]).filter(value => typeof value === 'string' && value))
const field = (item, key) => localizedField(item, key, 'zh')
const categoryLabel = category => field(publishedProducts.value.find(item => categoryKey(item) === category), 'category') || category
const search = computed({ get: () => String(route.query.q || ''), set: value => setQuery('q', value) })
// Facets follow the industry and keyword, independently of the chosen types,
// so selecting one type never hides another type that can be added to it.
const contextualProducts = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return publishedProducts.value.filter(item => (!selectedIndustry.value || item.industries?.includes(selectedIndustry.value))
    && (!keyword || ['titleEn', 'titleZh', 'summaryEn', 'summaryZh', 'categoryEn', 'categoryZh'].some(key => String(item[key] || '').toLocaleLowerCase().includes(keyword))))
})
const categories = computed(() => [...new Set(contextualProducts.value.map(categoryKey).filter(Boolean))])
const selectedCategories = computed(() => [...new Set(requestedCategories.value)].filter(category => categories.value.includes(category)))
const displayedCategories = computed(() => categoriesExpanded.value ? categories.value : categories.value.filter((item, index) => index < 9 || selectedCategories.value.includes(item)))
const filteredProducts = computed(() => {
  const result = contextualProducts.value.filter(item => !selectedCategories.value.length || selectedCategories.value.includes(categoryKey(item)))
  const order = configuration.value?.overview.featuredProducts || []
  const rank = id => { const index = order.indexOf(id); return index === -1 ? order.length : index }
  return result.sort((a, b) => rank(a.id) - rank(b.id))
})
const visibleCount = computed(() => /^\d+$/.test(String(route.query.limit || '')) ? Math.max(12, Math.min(publishedProducts.value.length, Number(route.query.limit))) : 12)
const visibleProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value))
const hasFilters = computed(() => selectedIndustry.value || selectedCategories.value.length || search.value.trim())
function setQuery(key, value) {
  const query = { ...route.query }
  if (Array.isArray(value) ? value.length : value) query[key] = value
  else delete query[key]
  if (key !== 'limit') delete query.limit
  return router.replace({ path: '/solutions', query })
}
function toggleCategory(category) {
  const next = selectedCategories.value.includes(category)
    ? selectedCategories.value.filter(value => value !== category)
    : [...selectedCategories.value, category]
  return setQuery('cat', next)
}
watch([catalogReady, categories, requestedCategories], () => {
  if (!catalogReady.value || productsLoading.value || dataErrors.has('/api/products') || dataErrors.has('/api/industries')) return
  if (requestedCategories.value.length !== selectedCategories.value.length) setQuery('cat', selectedCategories.value)
})
function setIndustry(id) {
  if (id === selectedIndustry.value) return
  trackEvent('industry_filter', id || 'all')
  const query = { ...route.query }
  if (id) query.industry = id
  else delete query.industry
  delete query.limit
  return router.push({ path: '/solutions', query })
}
async function scrollToSection(section) {
  await nextTick()
  page.value?.querySelector(section === 'industries' ? '#industry-explorer' : '#equipment-catalog')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
}
async function browseAll() {
  await resetOverview()
  await scrollToSection('catalog')
}
async function resetOverview() {
  const query = { ...route.query }
  for (const key of ['industry', 'cat', 'q', 'limit']) delete query[key]
  categoriesExpanded.value = false
  await router.push({ path: '/solutions', query })
}

function productIndustry(item) {
  return item.industries?.map(id => activeIndustries.value.find(industry => industry.id === id)?.titleZh).filter(Boolean).slice(0, 2).join(' / ') || field(item, 'category')
}
onMounted(async () => {
  await Promise.all([loadProducts(), loadIndustries(), loadProductShowcase()])
  catalogReady.value = true
})
</script>

<template>
  <main ref="page" class="design-site site-refined refined-products"><div class="hc-page">
    <SiteNav/>
    <ProductShowcase v-if="configuration" :configuration="configuration" :products="publishedProducts" :industries="activeIndustries" :selected-industry="selectedIndustry" :return-path="route.fullPath"
      @select-industry="setIndustry" @browse-all="browseAll" @explore="scrollToSection" @reset="resetOverview"/>
    <section v-else class="showcase-loading hc-w" aria-busy="true"><span class="hc-kick">产品中心</span><el-skeleton :rows="4" animated/></section>
    <section id="equipment-catalog" class="equipment-catalog" aria-labelledby="catalog-heading">
      <div class="hc-w">
        <div class="equipment-catalog-heading">
          <div><span class="catalog-eyebrow">从装备到现场</span><h2 id="catalog-heading">{{ industry ? `${industry.titleZh}装备` : '全部产品' }}</h2></div>
          <div class="catalog-search-group"><el-input id="product-search" v-model="search" :prefix-icon="Search" clearable maxlength="150" placeholder="搜索产品与关键词" aria-label="搜索产品与关键词"/><span class="catalog-result-count" role="status">共 {{ filteredProducts.length }} 个产品</span></div>
        </div>
        <div class="catalog-category-heading">产品类型<span>可多选</span></div>
        <div class="equipment-categories" role="group" aria-label="按产品类型筛选，可多选">
          <button type="button" :aria-pressed="!selectedCategories.length" @click="setQuery('cat', [])">全部产品</button>
          <button v-for="category in displayedCategories" :key="category" type="button" :data-category="category" :aria-pressed="selectedCategories.includes(category)" @click="toggleCategory(category)"><span class="category-check" aria-hidden="true">✓</span><span class="category-label">{{ categoryLabel(category) }}</span></button>
          <button v-if="categories.length > 9" type="button" class="category-expand" :aria-expanded="categoriesExpanded" @click="categoriesExpanded = !categoriesExpanded">{{ categoriesExpanded ? '收起分类' : '更多分类' }}<span aria-hidden="true">{{ categoriesExpanded ? '↑' : '↓' }}</span></button>
        </div>
        <div v-if="hasFilters" class="catalog-active-filters" aria-label="当前筛选条件">
          <span>当前筛选</span><button v-if="industry" type="button" @click="setIndustry('')">行业：{{ industry.titleZh }}<span aria-hidden="true">×</span><span class="sr-only">移除行业筛选</span></button>
          <button v-for="category in selectedCategories" :key="category" type="button" :data-selected-category="category" @click="toggleCategory(category)">类型：{{ categoryLabel(category) }}<span aria-hidden="true">×</span><span class="sr-only">移除此产品类型筛选</span></button>
          <button v-if="search.trim()" type="button" @click="setQuery('q', '')">“{{ search }}”<span aria-hidden="true">×</span><span class="sr-only">移除关键词</span></button>
          <button type="button" class="catalog-reset" @click="browseAll">清除筛选</button>
        </div>
        <div v-loading="productsLoading" class="equipment-product-grid">
          <router-link v-for="item in visibleProducts" :key="item.id" class="equipment-product-card" :to="productShowcaseLink(item.id, route.fullPath)">
            <EquipmentImage :record="item" :alt="field(item, 'title')" :fallback="siteAsset('/assets/p-other-1.jpg')" />
            <div class="bd"><span class="product-industry-label">{{ productIndustry(item) }}</span><div class="product-card-title"><h3>{{ field(item, 'title') }}</h3><span aria-hidden="true">→</span></div><p>{{ field(item, 'summary') }}</p><span class="go">查看产品 <i aria-hidden="true">↗</i></span></div>
          </router-link>
        </div>
        <el-empty v-if="!productsLoading && !filteredProducts.length" class="product-filter-empty" description="暂未找到符合条件的产品，试试其他行业、分类或关键词。"><el-button type="primary" @click="browseAll">清除筛选，查看全部产品</el-button></el-empty>
        <div v-if="filteredProducts.length > visibleProducts.length" class="catalog-more"><button type="button" @click="setQuery('limit', String(visibleCount + 12))">浏览更多产品<span aria-hidden="true">↓</span></button><span>已展示 {{ visibleProducts.length }} / {{ filteredProducts.length }}</span></div>
        <div class="catalog-bottom-links"><span>依据客户图纸与技术要求，做好每一台装备的制造与交付。</span><a href="/solutions" @click.prevent="browseAll">全部行业方案 <span aria-hidden="true">↗</span></a></div>
      </div>
    </section>
    <SiteFooter/>
  </div></main>
</template>

<style scoped>
.showcase-loading{padding-block:75px;min-height:420px;}.showcase-loading>.hc-kick{display:block;margin-bottom:35px;}
.equipment-catalog{padding:64px 0 58px;background:#fff;color:#123a50;scroll-margin-top:calc(var(--site-nav-height) + 25px);font-family:var(--f-ui);}
.equipment-catalog-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:29px;}.catalog-eyebrow{display:block;font-size:10px;color:#8b9eaa;letter-spacing:1px;margin-bottom:12px;}.equipment-catalog-heading h2{font:700 clamp(28px,2.5vw,42px)/1.4 var(--f-ui);margin:0;letter-spacing:-.6px;}.catalog-search-group{display:flex;align-items:center;gap:25px;margin-bottom:7px;}.catalog-search-group .el-input{width:300px;--el-input-border-radius:0;--el-input-height:40px;--el-input-border-color:#d6e3e9;--el-input-hover-border-color:#8eb6c2;--el-input-focus-border-color:#087f91;font-size:12px;}.catalog-result-count{font-size:11px;color:#7993a3;white-space:nowrap;}
.catalog-category-heading{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:11px;font-weight:600;color:#41677b;}.catalog-category-heading>span{font-size:10px;font-weight:400;color:#8b9faa;}
.equipment-categories{display:flex;align-items:stretch;gap:8px 27px;flex-wrap:wrap;border-bottom:1px solid #dce7ec;margin-bottom:33px;}.equipment-categories button{display:inline-flex;align-items:center;justify-content:center;gap:6px;position:relative;min-height:43px;padding:0 0 14px;border:0;background:none;color:#70899a;font:500 12px/1.7 var(--f-ui);white-space:nowrap;cursor:pointer;}.equipment-categories button::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:#087f91;transform:scaleX(0);transition:transform .2s;}.equipment-categories button[aria-pressed=true]{color:#087f91;font-weight:700;}.equipment-categories button[aria-pressed=true]::after{transform:scaleX(1);}.equipment-categories button:hover{color:#087f91;}.equipment-categories .category-expand{display:flex;align-items:center;gap:10px;margin-left:auto;color:#3e7a8f;font-size:11px;}.category-check{display:inline-flex;align-items:center;justify-content:center;flex:0 0 12px;width:12px;height:12px;border:1px solid #acc2cd;color:transparent;font-size:9px;line-height:1;}.equipment-categories button[aria-pressed=true] .category-check{border-color:#087f91;background:#087f91;color:#fff;}
.catalog-active-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:-13px 0 23px;font-size:10px;}.catalog-active-filters>span{color:#859aa6;margin-right:4px;}.catalog-active-filters button{display:flex;gap:10px;align-items:center;max-width:100%;border:1px solid #d9e8ed;background:#f2f8fa;color:#407489;padding:4px 9px;font:inherit;cursor:pointer;overflow-wrap:anywhere;}.catalog-active-filters .catalog-reset{margin-left:auto;border:0;background:none;color:#087f91;}
.equipment-product-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:35px 34px;}.equipment-product-card{display:block;min-width:0;background:transparent;border:0;border-bottom:1px solid #d4e2e7;border-radius:0;box-shadow:none;padding-bottom:21px;color:#123a50;}.equipment-product-card:hover{box-shadow:none;border-color:#91bdc8;transform:none;}.equipment-product-card:focus-visible{outline:2px solid #087f91;outline-offset:5px;}
.equipment-product-card .bd{padding:17px 0 0;min-width:0;}.product-industry-label{display:block;font-size:10px;color:#5a8796;line-height:1.7;margin-bottom:9px;}.product-card-title{display:flex;justify-content:space-between;align-items:baseline;gap:14px;}.product-card-title h3{font:650 19px/1.6 var(--f-ui);margin:0;color:#123a50;overflow-wrap:anywhere;}.product-card-title>span{font-size:18px;color:#087f91;flex-shrink:0;}.equipment-product-card .bd p{color:#728b9b;font-size:12px;line-height:1.9;margin:10px 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}.equipment-product-card .bd .go{display:none;}.catalog-more{display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:42px;}.catalog-more button{display:flex;align-items:center;gap:30px;min-height:44px;padding:11px 30px;color:#087f91;border:1px solid #71aebc;background:none;font:600 12px/1.6 var(--f-ui);cursor:pointer;transition:background .2s;}.catalog-more button:hover{background:#edf7f9;}.catalog-more>span{font-size:10px;color:#8da1ae;}
.catalog-bottom-links{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px;border-top:1px solid #e3edf1;margin-top:42px;padding-top:24px;color:#8b9faa;font-size:11px;line-height:1.8;}.catalog-bottom-links a{display:flex;align-items:center;gap:22px;color:#087f91;text-decoration:none;font-weight:600;}.equipment-catalog button:focus-visible,.equipment-catalog a:focus-visible{outline:2px solid #087f91;outline-offset:4px;}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
@media(max-width:1050px){
 .equipment-catalog{padding-top:44px;}.equipment-product-grid{gap:26px 22px;}.catalog-search-group .el-input{width:250px;}.product-card-title h3{font-size:17px;}.equipment-categories{gap:7px 22px;}.catalog-search-group{gap:15px;}
}
@media(max-width:850px){
 .equipment-product-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.catalog-search-group .el-input{width:230px;}.equipment-catalog-heading h2{font-size:31px;}
}
@media(max-width:700px){
 .equipment-catalog{padding:34px 0 35px;}.equipment-catalog-heading{align-items:stretch;flex-direction:column;gap:21px;margin-bottom:20px;}.equipment-catalog-heading h2{font-size:28px;}.catalog-eyebrow{font-size:9px;margin-bottom:8px;}
 .catalog-search-group{gap:16px;margin:0;}.catalog-search-group .el-input{width:auto;flex:1;min-width:0;--el-input-height:37px;font-size:11px;}.catalog-result-count{font-size:10px;}
 .equipment-categories{gap:6px 21px;margin-bottom:23px;}.equipment-categories button{font-size:11px;min-height:37px;padding-bottom:10px;}.equipment-categories .category-expand{font-size:10px;gap:7px;}
 .equipment-product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 16px;}.equipment-product-card{padding-bottom:17px;}.equipment-product-card .bd{padding:12px 0 0;}.product-industry-label{font-size:8px;}.product-card-title{gap:8px;}.product-card-title h3{font-size:15px;line-height:1.6;}.product-card-title>span{font-size:14px;}.equipment-product-card .bd p{font-size:10px;line-height:1.8;margin-top:7px;}
 .catalog-more{margin-top:29px;}.catalog-more button{font-size:11px;padding:10px 25px;}.catalog-bottom-links{margin-top:29px;padding-top:20px;font-size:10px;}.catalog-bottom-links>span{max-width:240px;}.catalog-active-filters{margin-top:-3px;font-size:9px;}.catalog-active-filters .catalog-reset{margin-left:0;}
}
@media(prefers-reduced-motion:reduce){.equipment-product-card{transition:none;}}
</style>
