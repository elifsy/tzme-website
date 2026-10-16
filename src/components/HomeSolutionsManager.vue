<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import AdminEditorPanel from './AdminEditorPanel.vue'
import AdminPreviewFrame from './AdminPreviewFrame.vue'
import AdminSaveBar from './AdminSaveBar.vue'
import { useAdminEditorState } from '../composables/useAdminEditorState.js'

import HomeSolutionsSection from './HomeSolutionsSection.vue'
import { editorLocales as availableLocales } from '../i18n/locales/index.js'
import { emptySolutionStory, homeSolutionsDraft } from '../data/homeSolutions.js'
import { localizedField, useProductCatalog } from '../services/catalog.js'
import { useIndustryCatalog } from '../services/industries.js'
import { loadHomeSolutions, saveHomeSolutions } from '../services/homeSolutions.js'
import { dataErrors } from '../services/api.js'
import '../style/admin-editor.css'

const { t, locale } = useI18n({ useScope: 'global' })
const { products, loadProducts } = useProductCatalog()
const { industries, loadIndustries } = useIndustryCatalog()
const form = ref(null), original = ref(''), loading = ref(false), saving = ref(false), error = ref(false)
const scope = ref('products'), selectedId = ref(''), editingLocale = ref('zh')
const localeCodes = availableLocales.map(item => item.code)
const sectionFields = [{ key: 'kicker', label: 'sectionKicker', max: 100 }, { key: 'title', label: 'sectionTitle', max: 240 }, { key: 'buttonText', label: 'sectionButton', max: 100 }]
const storyFields = [{ key: 'kicker', label: 'kicker', max: 100 }, { key: 'title', label: 'storyTitle', max: 240 }, { key: 'description', label: 'storyDescription', max: 2000 }]
const dirty = computed(() => form.value && JSON.stringify(form.value) !== original.value)
const selectableProducts = computed(() => [...products.value].sort((a,b) => Number(b.showOnHome) - Number(a.showOnHome) || (Number(a.homeOrder) || 999) - (Number(b.homeOrder) || 999)))
const options = computed(() => scope.value === 'products' ? selectableProducts.value : industries.value)
const field = (item, name) => localizedField(item, name, locale.value)
const currentProduct = computed(() => products.value.find(item => item.id === selectedId.value))
const buttonIndustries = computed(() => industries.value.filter(item => item.status === 'published' && currentProduct.value?.industries?.includes(item.id)))
const story = computed(() => {
  const items = form.value?.[scope.value]
  return items && Object.hasOwn(items, selectedId.value) ? items[selectedId.value] : emptySolutionStory(localeCodes)
})
const previewProducts = computed(() => {
  const product = scope.value === 'products' ? currentProduct.value : selectableProducts.value.find(item => item.status === 'published' && item.industries?.includes(selectedId.value))
  return product ? [product] : []
})
const previewConfiguration = computed(() => scope.value === 'products' || !previewProducts.value.length ? form.value : {
  ...form.value, products: { [previewProducts.value[0].id]: { ...emptySolutionStory(localeCodes), industry: selectedId.value } },
})
let disposed = false
function selectInitial() {
  if (!options.value.some(item => item.id === selectedId.value)) selectedId.value = options.value[0]?.id || ''
}
watch(options, selectInitial)
function ensureStory() {
  const items = form.value[scope.value]
  if (!Object.hasOwn(items, selectedId.value)) items[selectedId.value] = emptySolutionStory(localeCodes)
  return items[selectedId.value]
}
function editText(key, value) { ensureStory()[key][editingLocale.value] = value }
function editIndustry(value) { ensureStory().industry = value }
async function load() {
  if (loading.value || saving.value) return
  loading.value = true
  try {
    const [value] = await Promise.all([loadHomeSolutions(), loadProducts(), loadIndustries()])
    if (disposed) return
    error.value = !value || ['/api/products', '/api/industries'].some(path => dataErrors.has(path))
    if (!error.value) {
      form.value = homeSolutionsDraft(value, localeCodes)
      original.value = JSON.stringify(form.value)
      selectInitial()
    }
  } finally { if (!disposed) loading.value = false }
}
function validate() {
  for (const language of availableLocales.filter(item => ['en','zh'].includes(item.code))) for (const item of sectionFields) {
    if (!form.value.section[item.key][language.code].trim()) {
      editingLocale.value = language.code
      return t('homeSolutionsAdmin.required', {language:language.label,field:t('homeSolutionsAdmin.'+item.label)})
    }
  }
  for (const group of [form.value.section, ...Object.values(form.value.products), ...Object.values(form.value.industries)]) {
    for (const [key,max] of [['kicker',100],['title',240],['buttonText',100],['description',2000]]) {
      if (group[key] && Object.values(group[key]).some(value => value.length > max)) return t('homeSolutionsAdmin.tooLong',{field:key})
    }
  }
  return ''
}
async function save() {
  if (!form.value || loading.value || saving.value || error.value) return
  const message = validate()
  if (message) { ElMessage.warning(message); return }
  saving.value = true
  try {
    const value = await saveHomeSolutions(form.value)
    if (disposed) return
    form.value = homeSolutionsDraft(value, localeCodes)
    original.value = JSON.stringify(form.value)
    ElMessage.success(t('homeSolutionsAdmin.saved'))
  } catch { if (!disposed) ElMessage.error(t('homeSolutionsAdmin.saveFailed')) }
  finally { if (!disposed) saving.value = false }
}
onMounted(load)
onBeforeUnmount(() => { disposed = true })
useAdminEditorState({ dirty, saving, loading })
defineExpose({ load })
</script>

<template>
  <div v-loading="loading" class="home-solutions-manager">
    <el-alert v-if="error" type="error" show-icon :closable="false" :title="$t('homeSolutionsAdmin.loadFailed')"><el-button @click="load">{{ $t('admin.retryDatabase') }}</el-button></el-alert>
    <el-form v-if="form" label-position="top" :disabled="saving || loading || error" @submit.prevent="save">

      <div class="home-solutions-layout">
        <div class="home-solutions-main">
          <AdminEditorPanel step="01" :title="$t('homeSolutionsAdmin.section')" :description="$t('homeSolutionsAdmin.sectionHint')">
            <el-form-item v-for="item in sectionFields" :key="item.key" :label="$t('homeSolutionsAdmin.'+item.label)" required>
              <el-input v-model="form.section[item.key][editingLocale]" :data-solution-section-field="item.key" :type="item.key==='title'?'textarea':'text'" :rows="2" :maxlength="item.max" show-word-limit />
            </el-form-item>
          </AdminEditorPanel>
          <AdminEditorPanel step="02" :title="$t('homeSolutionsAdmin.copy')">
            <el-tabs v-model="scope" class="home-solutions-scope"><el-tab-pane :label="$t('homeSolutionsAdmin.products')" name="products"/><el-tab-pane :label="$t('homeSolutionsAdmin.industries')" name="industries"/></el-tabs>
            <el-form-item :label="$t(scope==='products'?'homeSolutionsAdmin.selectProduct':'homeSolutionsAdmin.selectIndustry')">
              <el-select v-model="selectedId" filterable class="home-solutions-target"><el-option v-for="item in options" :key="item.id" :value="item.id" :label="field(item,'title')+(scope==='products'&&item.showOnHome?' · '+$t('homeSolutionsAdmin.onHome'):'')" /></el-select>
            </el-form-item>
            <template v-if="selectedId">
              <p class="home-solutions-note">{{ $t(scope==='products'?'homeSolutionsAdmin.inherit':'homeSolutionsAdmin.industryHint') }}</p>
              <el-form-item v-for="item in storyFields" :key="item.key" :label="$t('homeSolutionsAdmin.'+item.label)">
                <el-input :model-value="story[item.key][editingLocale]" :data-solution-field="item.key" :type="item.key==='kicker'?'text':'textarea'" :rows="item.key==='description'?4:2" :maxlength="item.max" show-word-limit @update:model-value="editText(item.key,$event)" />
              </el-form-item>
              <template v-if="scope==='products'">
                <el-form-item :label="$t('homeSolutionsAdmin.buttonIndustry')"><el-select :model-value="story.industry" clearable :placeholder="$t('homeSolutionsAdmin.automatic')" class="home-solutions-industry" @update:model-value="editIndustry($event || '')"><el-option v-for="item in buttonIndustries" :key="item.id" :value="item.id" :label="field(item,'title')" /></el-select></el-form-item>
                <p class="home-solutions-note">{{ $t('homeSolutionsAdmin.industryNote') }} <router-link to="/admin/industries">{{ $t('homeSolutionsAdmin.manageIndustries') }} →</router-link></p>
              </template>
            </template>
            <el-empty v-else :description="$t('homeSolutionsAdmin.noRecords')" />
            <p class="home-solutions-note">{{ $t('homeSolutionsAdmin.productNote') }} <router-link to="/admin/products">{{ $t('homeSolutionsAdmin.manageProducts') }} →</router-link></p>
          </AdminEditorPanel>
        </div>
        <aside class="home-solutions-preview">
          <AdminPreviewFrame title="首页方案预览" public-path="/#solutions"><HomeSolutionsSection v-if="previewProducts.length" :configuration="previewConfiguration" :products="previewProducts" :industries="industries" :locale-code="editingLocale"/><el-empty v-else :description="$t('homeSolutionsAdmin.noPreview')" /></AdminPreviewFrame>
        </aside>
      </div>
      <AdminSaveBar class="home-solutions-save" :dirty="Boolean(dirty)" :saving="saving" :disabled="loading || error" @save="save" />
    </el-form>
  </div>
</template>

<style scoped>
.home-solutions-layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:20px;align-items:start}
.home-solutions-main{display:grid;gap:20px;min-width:0}.home-solutions-preview{position:sticky;top:24px;min-width:0}
.home-solutions-manager :deep(.el-select){width:100%}.home-solutions-note{font-size:13px;line-height:1.8;color:#60768b;margin-bottom:18px}.home-solutions-note a{color:#2375bf}
.home-solutions-save{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:20px;padding:16px 20px;border:1px solid #dce5ef;border-radius:10px;background:#fff;font-size:13px;color:#4d637c}
.home-solutions-preview :deep(.hc-w){width:100%;max-width:none}.home-solutions-preview :deep(.hc-page){background:#fff}.home-solutions-preview :deep(.j-home-solutions){padding:0}
.home-solutions-preview :deep(.hc-shead){display:block}.home-solutions-preview :deep(.hc-h2){font-size:24px}.home-solutions-preview :deep(.j-all-solutions){display:inline-flex;margin-top:12px}
.home-solutions-preview :deep(.j-solution-row){display:flex;flex-direction:column;align-items:stretch;gap:20px;padding:24px 0}.home-solutions-preview :deep(.j-solution-row::before){display:none}
.home-solutions-preview :deep(.j-solution-image){order:0}.home-solutions-preview :deep(.j-solution-copy){order:1;padding:0}.home-solutions-preview :deep(.j-solution-copy h3){font-size:28px}
@media(max-width:1100px){.home-solutions-layout{grid-template-columns:minmax(0,1fr) 300px}}
@media(max-width:900px){.home-solutions-layout{grid-template-columns:1fr}.home-solutions-preview{position:static}.home-solutions-save{align-items:flex-start;flex-wrap:wrap}}
</style>
