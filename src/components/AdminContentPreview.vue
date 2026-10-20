<script setup>
import { sanitizeRichText } from '../utils/richText.js'
import ProductDetailPresentation from './ProductDetailPresentation.vue'
import { useProductCatalog } from '../services/catalog.js'
import { useIndustryCatalog } from '../services/industries.js'
defineProps({ kind: { type: String, default: 'products' }, record: { type: Object, required: true } })
const { products } = useProductCatalog()
const { industries } = useIndustryCatalog()
</script>

<template>
  <ProductDetailPresentation v-if="kind === 'products'" :record="record" :products="products" :industries="industries" preview />
  <section v-else class="hc-sec content-draft-preview"><div class="hc-w">
    <span class="hc-kick">{{ record.categoryZh || '新闻资讯' }} · {{ record.date }}</span><h1 class="hc-h2">{{ record.titleZh || '新闻标题' }}</h1><p class="hc-p">{{ record.summaryZh }}</p><img v-if="record.image" class="draft-article-cover" :src="record.image" :alt="record.titleZh"/><div class="article-body" v-html="sanitizeRichText(record.contentZh)"/>
  </div></section>
</template>

<style scoped>
.content-draft-preview h1 { margin-bottom:22px; }
.draft-article-cover { display:block; width:100%; max-height:520px; object-fit:cover; margin:30px 0; }
</style>
