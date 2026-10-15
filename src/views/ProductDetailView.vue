<script setup>
import { useSiteContent } from '../services/website.js'
const { siteAsset } = useSiteContent()
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDesignPage } from '../composables/useDesignPage.js'
import { localizedField, useProductCatalog } from '../services/catalog.js'
import { industryField, useIndustryCatalog } from '../services/industries.js'
import SiteFooter from '../components/SiteFooter.vue'
import SiteNav from '../components/SiteNav.vue'

const page = ref(null)
const route = useRoute()
const { locale } = useI18n({ useScope: 'global' })
const { goTo } = useDesignPage('hc-detail', page)
const { products, loadProducts } = useProductCatalog()
const { industries, loadIndustries } = useIndustryCatalog()
const loading = ref(true)
const imageRef = ref(null)
const productId = computed(() => route.params.id === 'ship-loader' ? 'port-machinery' : route.params.id)
const product = computed(() => products.value.find((item) => item.id === productId.value && item.status === 'published'))
const listLink = computed(() => typeof route.query.from === 'string' && /^\/solutions(?:\?|$)/.test(route.query.from) ? route.query.from : '/solutions')
const productIndustries = computed(() => (product.value?.industries || [])
  .map((id) => industries.value.find((item) => item.id === id && item.status === 'published'))
  .filter(Boolean))
const field = (item, name) => localizedField(item, name, locale.value)
const features = computed(() => field(product.value, 'features').split(/\r?\n/).map((line) => line.trim()).filter(Boolean))
const specifications = computed(() => field(product.value, 'specifications').split(/\r?\n/).map((line) => {
  const separator = line.search(/[:：]/)
  return separator < 0 ? { label: '', value: line.trim() } : {
    label: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim(),
  }
}).filter((item) => item.label || item.value))
const related = computed(() => {
  if (!product.value) return []
  const other = products.value.filter((item) => item.status === 'published' && item.id !== product.value.id)
  return [...other.filter((item) => item.categoryEn === product.value.categoryEn),
    ...other.filter((item) => item.categoryEn !== product.value.categoryEn)].slice(0, 3)
})
onMounted(async () => { await Promise.all([loadProducts(), loadIndustries()]); loading.value = false })
watch(productId, () => window.scrollTo({ top: 0, behavior: 'instant' }))
</script>

<template>
  <main ref="page" class="design-site product-detail">
    <div class="hc-page">
      <SiteNav />

      <template v-if="!loading && product">
        <section class="hc-hero product-detail-hero">
          <div class="hc-w"><router-link class="j-detail-back" :to="listLink">← {{ $t('site.backToProducts') }}</router-link><div class="j-detail-top"><div>
            <span class="hc-kick">{{ field(product, 'category') }}<template v-for="item in productIndustries" :key="item.id"> · {{ industryField(item, 'title', locale) }}</template></span>
            <h1 class="hc-h1">{{ field(product, 'title') }}</h1>
            <p class="hc-p">{{ field(product, 'summary') }}</p>
            <el-button class="hc-btn solid" @click.stop="goTo('/contact')">{{ $t('site.requestAQuote') }}<i>→</i></el-button>
          </div><div class="j-detail-photo"><el-image ref="imageRef" :src="product.image || siteAsset('/assets/p-other-1.jpg')" :alt="field(product, 'title')" :preview-src-list="[product.image || siteAsset('/assets/p-other-1.jpg')]" fit="cover" preview-teleported hide-on-click-modal tabindex="0" role="button" @keydown.enter.prevent="imageRef?.showPreview()" @keydown.space.prevent="imageRef?.showPreview()" /></div></div></div>
        </section>

        <section class="hc-sec product-detail-content">
          <div class="hc-w product-detail-grid">
            <div>
              <span class="hc-kick">{{ $t('site.productDescription') }}</span>
              <h2 class="hc-h2">{{ field(product, 'title') }}</h2>
              <p class="hc-p product-detail-paragraph">{{ field(product, 'content') || field(product, 'summary') }}</p>
              <template v-if="features.length">
                <h3 class="product-detail-subheading">{{ $t('site.productFeatures') }}</h3>
                <ul class="product-feature-list">
                  <li v-for="feature in features" :key="feature">{{ feature }}</li>
                </ul>
              </template>
            </div>
            <div v-if="specifications.length" class="product-detail-specs">
              <span class="hc-kick">{{ $t('site.productSpecifications') }}</span>
              <dl>
                <div v-for="(spec, index) in specifications" :key="index">
                  <dt>{{ spec.label }}</dt><dd>{{ spec.value }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section v-if="related.length" class="hc-sec product-related">
          <div class="hc-w">
            <div class="hc-shead"><div class="l">
              <span class="hc-kick">{{ $t('site.relatedProducts') }}</span>
              <h2 class="hc-h2">{{ $t('site.exploreMoreProducts') }}</h2>
            </div><router-link class="product-all-link" to="/solutions">{{ $t('site.allSolutions') }} →</router-link></div>
            <div class="hc-cards">
              <router-link v-for="item in related" :key="item.id" class="hc-card" :to="`/solutions/${item.id}`">
                <div class="im"><img :src="item.image || siteAsset('/assets/p-other-1.jpg')" :alt="field(item, 'title')" /></div>
                <div class="bd"><h3>{{ field(item, 'title') }}</h3><p>{{ field(item, 'summary') }}</p>
                  <span class="go">{{ $t('site.explore') }}<i>→</i></span></div>
              </router-link>
            </div>
          </div>
        </section>
      </template>
      <section v-else-if="!loading" class="hc-sec product-not-found">
        <el-empty :description="$t('site.productNotFound')" />
        <el-button type="primary" @click="goTo('/solutions')">{{ $t('site.backToProducts') }}</el-button>
      </section>

      <SiteFooter />
    </div>

  </main>
</template>
