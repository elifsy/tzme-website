<script setup>
import { useSiteContent } from '../services/website.js'
const { siteAsset } = useSiteContent()
import { computed, onMounted, ref } from 'vue'
import { trackEvent } from '../services/analytics.js'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useDesignPage } from '../composables/useDesignPage.js'
import SiteFooter from '../components/SiteFooter.vue'
import SiteNav from '../components/SiteNav.vue'
import { localizedField, useProductCatalog } from '../services/catalog.js'
import { industryField, useIndustryCatalog } from '../services/industries.js'
const page = ref(null)
const route = useRoute()
const router = useRouter()
useDesignPage('hc-products', page)
const { locale } = useI18n({ useScope: 'global' })
const { products, loadProducts } = useProductCatalog()
const { industries, loadIndustries } = useIndustryCatalog()
const publishedIndustries = computed(() => industries.value.filter((item) => item.status === 'published'))
const publishedProducts = computed(() => products.value.filter((item) => item.status === 'published'))
const selectedIndustry = computed(() => publishedIndustries.value.some((item) => item.id === route.query.industry) ? route.query.industry : '')
const industryProducts = computed(() => selectedIndustry.value
  ? publishedProducts.value.filter((item) => item.industries?.includes(selectedIndustry.value))
  : publishedProducts.value)
const categories = computed(() => [...new Set(publishedProducts.value.map(item => item.categoryEn || item.category).filter(Boolean))])
const search = computed({ get: () => String(route.query.q || ''), set: q => setQuery('q', q) })
const selectedCategory = computed(() => String(route.query.cat || ''))
const visibleProducts = computed(() => industryProducts.value.filter(item =>
  (!selectedCategory.value || (item.categoryEn || item.category) === selectedCategory.value) &&
  (!search.value.trim() || ['titleEn','titleZh','summaryEn','summaryZh','categoryEn','categoryZh'].some(key => String(item[key] || '').toLowerCase().includes(search.value.trim().toLowerCase())))))
function setQuery(key, value) {
  const query = { ...route.query }
  if (value) query[key] = value
  else delete query[key]
  router.replace({ path: '/solutions', query })
}
const categoryCount = computed(() => new Set(publishedProducts.value.map((item) => item.categoryEn || item.category).filter(Boolean)).size)
const productField = (item, name) => localizedField(item, name, locale.value)
const displayIndustry = (item) => industryField(item, 'title', locale.value)
function setIndustry(id) {
  if (id === selectedIndustry.value) return
  trackEvent('industry_filter', id || 'all')
  const query = { ...route.query }
  if (id) query.industry = id
  else delete query.industry
  router.push({ path: '/solutions', query })
}
onMounted(() => { loadProducts(); loadIndustries() })
</script>

<template>
<main ref="page" class="design-site">
<div class="hc-page">

              <SiteNav />

              <section class="hc-sec catalog-intro catalog-intro-products" aria-labelledby="products-page-title">
                <el-image v-if="siteAsset('/assets/hero-02.jpg')" class="catalog-intro-image"
                  :src="siteAsset('/assets/hero-02.jpg')" fit="cover" alt="" aria-hidden="true">
                  <template #error><div class="catalog-intro-image-fallback"></div></template>
                </el-image>
                <div class="hc-w catalog-intro-content">
                  <div class="catalog-intro-copy">
                    <span class="hc-kick">{{ $t('site.solutionCount', { products: publishedProducts.length, categories: categoryCount }) }}</span>
                    <h1 id="products-page-title" class="hc-h2">{{ $t('site.whatWeEngineer') }}</h1>
                  </div>
                  <p class="hc-p catalog-intro-description">
                    {{ $t('site.everyUnitIsEngineeredToOrderCapacityGeometryAndDriveConfigurationAre') }}</p>
                </div>
              </section>

              <section style="border-top:1px solid var(--line-d2)">
                <div class="hc-w j-catalog-layout">
                  <aside class="j-catalog-sidebar" :aria-label="locale === 'zh' ? '产品分类' : 'Product categories'">
                    <span class="hc-kick">{{ locale === 'zh' ? '产品分类' : 'CATEGORIES' }}</span>
                    <button class="j-category" :aria-pressed="!selectedCategory" @click="setQuery('cat','')">{{ locale === 'zh' ? '全部产品' : 'All products' }}<span>{{ publishedProducts.length }}</span></button>
                    <button v-for="category in categories" :key="category" class="j-category" :aria-pressed="selectedCategory === category" @click="setQuery('cat',category)">{{ productField(publishedProducts.find(item => (item.categoryEn || item.category) === category),'category') }}<span>↗</span></button>
                  </aside>
                  <div class="j-catalog-main">
                  <div class="j-catalog-toolbar"><span class="hc-kick">{{ locale === 'zh' ? '按需求寻找适用装备' : 'FIND THE RIGHT EQUIPMENT' }}</span><el-input id="product-search" v-model="search" clearable :aria-label="locale === 'zh' ? '搜索产品' : 'Search products'" :placeholder="locale === 'zh' ? '搜索产品与关键词' : 'Search products & keywords'" /></div>
                  <div class="product-industry-filter">
                    <span class="hc-kick">{{ $t('site.filterByIndustry') }}</span>
                    <div class="product-industry-options">
                      <el-button :type="!selectedIndustry ? 'primary' : 'default'" :aria-pressed="!selectedIndustry"
                        @click="setIndustry('')">{{ $t('site.allIndustries') }}</el-button>
                      <el-button v-for="industry in publishedIndustries" :key="industry.id"
                        :type="selectedIndustry === industry.id ? 'primary' : 'default'"
                        :aria-pressed="selectedIndustry === industry.id"
                        @click="setIndustry(industry.id)">{{ displayIndustry(industry) }}</el-button>
                    </div>
                    <span class="product-result-count">{{ $t('site.filteredProductCount', { count: visibleProducts.length }) }}</span>
                  </div>
                  <div class="hc-cards">
                    <router-link v-for="(item, index) in visibleProducts" :key="item.id" class="hc-card" :to="{path:`/solutions/${item.id}`,query:{from:route.fullPath}}">
                      <div class="im"><img :src="item.image || siteAsset('/assets/p-other-1.jpg')" :alt="productField(item, 'title')" /></div>
                      <div class="bd">
                        <span class="no">{{ String(index + 1).padStart(2, '0') }}</span>
                        <h3>{{ productField(item, 'title') }}</h3>
                        <p>{{ productField(item, 'summary') }}</p>
                        <span class="go">{{ $t('site.explore') }}<i>→</i></span>
                      </div>
                    </router-link>
                  </div>
                  <el-empty v-if="!visibleProducts.length" class="product-filter-empty"
                    :description="$t('site.noProductsForIndustry')">
                    <el-button type="primary" @click="router.replace('/solutions')">{{ locale === 'zh' ? '清除筛选' : 'Clear filters' }}</el-button>
                  </el-empty>
                  </div>
                </div>
              </section>

              <SiteFooter />

            </div>
</main>
</template>
