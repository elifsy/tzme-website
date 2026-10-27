<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDesignPage } from '../composables/useDesignPage.js'
import { useProductCatalog } from '../services/catalog.js'
import { useIndustryCatalog } from '../services/industries.js'
import ProductDetailPresentation from '../components/ProductDetailPresentation.vue'
import SiteFooter from '../components/SiteFooter.vue'
import SiteNav from '../components/SiteNav.vue'
import SeoKnowledgeSection from '../components/SeoKnowledgeSection.vue'

const page = ref(null), loading = ref(true)
const route = useRoute()
const { goTo } = useDesignPage('hc-detail', page)
const { products, loadProducts } = useProductCatalog()
const { industries, loadIndustries } = useIndustryCatalog()
const productId = computed(() => route.params.id === 'ship-loader' ? 'bulk-ship-loader' : route.params.id)
const product = computed(() => products.value.find(item => item.id === productId.value && item.status === 'published'))
const listLink = computed(() => typeof route.query.from === 'string' && /^\/solutions(?:\?|$)/.test(route.query.from) ? route.query.from : '/solutions')
onMounted(async () => { try { await Promise.all([loadProducts(), loadIndustries()]) } finally { loading.value = false } })
watch(productId, () => window.scrollTo({ top: 0, behavior: 'instant' }))
</script>

<template>
  <main ref="page" class="design-site product-detail site-refined refined-product"><div class="hc-page">
    <SiteNav />
    <ProductDetailPresentation v-if="!loading && product" :key="productId" :record="product" :products="products" :industries="industries" :list-link="listLink" />
    <section v-else-if="!loading" class="hc-sec product-not-found"><el-empty :description="$t('site.productNotFound')" /><el-button type="primary" @click="goTo('/solutions')">{{ $t('site.backToProducts') }}</el-button></section>
    <div v-else class="equipment-detail-loading" role="status" aria-live="polite">{{ $t('productDetail.loading') }}</div>
    <SeoKnowledgeSection v-if="product" />
    <SiteFooter :show-contact-cta="false" />
  </div></main>
</template>

<style scoped>
.equipment-detail-loading { min-height:55vh; display:grid; place-items:center; color:#527487; font-size:14px; }
</style>
