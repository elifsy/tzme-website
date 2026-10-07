<script setup>
import { useSiteContent } from '../services/website.js'
const { siteAsset, siteValue } = useSiteContent()
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useDesignPage } from '../composables/useDesignPage.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import SocialLinks from '../components/SocialLinks.vue'
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
const visibleProducts = computed(() => selectedIndustry.value
  ? publishedProducts.value.filter((item) => item.industries?.includes(selectedIndustry.value))
  : publishedProducts.value)
const categoryCount = computed(() => new Set(publishedProducts.value.map((item) => item.categoryEn || item.category).filter(Boolean)).size)
const productField = (item, name) => localizedField(item, name, locale.value)
const displayIndustry = (item) => industryField(item, 'title', locale.value)
function setIndustry(id) {
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

              <section class="hc-sec" style="padding:72px 0 60px">
                <div class="hc-w" style="display:grid;grid-template-columns:1fr 380px;gap:80px;
                     align-items:flex-end">
                  <div>
                    <span class="hc-kick">{{ $t('site.solutionCount', { products: publishedProducts.length, categories: categoryCount }) }}</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff;font-size:52px">
                      {{ $t('site.whatWeEngineer') }}</h2>
                  </div>
                  <p class="hc-p">
                    {{ $t('site.everyUnitIsEngineeredToOrderCapacityGeometryAndDriveConfigurationAre') }}</p>
                </div>
              </section>

              <section style="border-top:1px solid var(--line-d2)">
                <div class="hc-w" style="padding:56px 0 96px">
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
                  <div class="hc-cards" style="grid-template-columns:repeat(4,1fr)">
                    <router-link v-for="(item, index) in visibleProducts" :key="item.id" class="hc-card" :to="`/solutions/${item.id}`">
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
                    <el-button type="primary" @click="setIndustry('')">{{ $t('site.allIndustries') }}</el-button>
                  </el-empty>
                </div>
              </section>

              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>{{ siteValue('text_8920f3d022b5') }}</span>
                  <span class="tag">{{ $t('site.solutionCount', { products: publishedProducts.length, categories: categoryCount }) }}</span>
                  <LanguageSwitcher style="margin-left:auto;color:var(--txt-2)" />
                  <SocialLinks />
                </div>
              </footer>

            </div>
</main>
</template>
