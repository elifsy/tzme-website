<script setup>
import ProductDetailPresentation from './ProductDetailPresentation.vue'
import NewsArticlePresentation from './NewsArticlePresentation.vue'
import { useProductCatalog } from '../services/catalog.js'
import { useIndustryCatalog } from '../services/industries.js'
defineProps({ kind: { type: String, default: 'products' }, record: { type: Object, required: true } })
const { products } = useProductCatalog()
const { industries } = useIndustryCatalog()
</script>

<template>
  <ProductDetailPresentation v-if="kind === 'products'" :record="record" :products="products" :industries="industries" preview />
  <div v-else class="design-site news-detail site-refined refined-article admin-news-draft-preview">
    <NewsArticlePresentation :record="record" preview><template #back><span class="news-text-link article-back">← 返回新闻列表</span></template></NewsArticlePresentation>
  </div>
</template>

<style scoped>
.admin-news-draft-preview { min-height:0; }
</style>
