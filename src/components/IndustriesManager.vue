<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { industrySeed } from '../data/industries.js'
import {
  deleteIndustryLocally,
  industryField,
  markIndustrySynced,
  saveIndustryLocally,
  useIndustryCatalog,
} from '../services/industries.js'

const props = defineProps({ products: { type: Array, default: () => [] } })
const { t, locale } = useI18n({ useScope: 'global' })
const { industries, loadIndustries } = useIndustryCatalog()
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const editingLocale = ref('en')
const form = reactive({
  id: '', titleEn: '', titleZh: '', subtitleEn: '', subtitleZh: '',
  sortOrder: 10, status: 'published',
})
const publishedCount = computed(() => industries.value.filter((item) => item.status === 'published').length)
const defaultIds = new Set(industrySeed.map((item) => item.id))
const field = (item, name) => industryField(item, name, locale.value)
const productCount = (id) => props.products.filter((product) => product.industries?.includes(id) || product.industry === id).length

async function load() {
  loading.value = true
  await loadIndustries()
  loading.value = false
}

function openEditor(item = null) {
  editingLocale.value = locale.value === 'zh' ? 'zh' : 'en'
  Object.assign(form, {
    id: item?.id || '',
    titleEn: item?.titleEn || '', titleZh: item?.titleZh || '',
    subtitleEn: item?.subtitleEn || '', subtitleZh: item?.subtitleZh || '',
    sortOrder: Number(item?.sortOrder ?? (industries.value.length + 1) * 10),
    status: item?.status || 'published',
  })
  dialogOpen.value = true
}

async function writeToApi(record, update) {
  const options = {
    method: update ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  }
  let response = await fetch(`/api/industries${update ? `/${encodeURIComponent(record.id)}` : ''}`, options)
  if (update && response.status === 404) response = await fetch('/api/industries', { ...options, method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function persist(record, update) {
  saveIndustryLocally(record)
  try {
    await writeToApi(record, update)
    markIndustrySynced(record.id)
    ElMessage.success(t('admin.contentSaved'))
  } catch {
    ElMessage.warning(t('admin.savedInThisBrowserBackendApiIsUnavailable'))
  }
}

async function save() {
  if (!form.titleEn.trim() || !form.titleZh.trim()) {
    ElMessage.warning(t('admin.bothTitlesRequired'))
    return
  }
  saving.value = true
  const record = {
    ...form,
    id: form.id || `industry-${Date.now()}`,
    titleEn: form.titleEn.trim(), titleZh: form.titleZh.trim(),
    subtitleEn: form.subtitleEn.trim(), subtitleZh: form.subtitleZh.trim(),
    sortOrder: Number(form.sortOrder) || 0,
  }
  await persist(record, Boolean(form.id))
  saving.value = false
  dialogOpen.value = false
}

async function toggle(item) {
  await persist({ ...item, status: item.status === 'published' ? 'draft' : 'published' }, true)
}

async function remove(item) {
  if (defaultIds.has(item.id)) {
    ElMessage.warning(t('admin.industryDefaultCannotDelete'))
    return
  }
  if (productCount(item.id)) {
    ElMessage.warning(t('admin.industryInUse'))
    return
  }
  try {
    await ElMessageBox.confirm(
      t('admin.deleteConfirm', { title: field(item, 'title') }),
      t('admin.deleteIndustry'),
      { confirmButtonText: t('admin.delete'), cancelButtonText: t('admin.cancel'), type: 'warning' },
    )
  } catch { return }
  try {
    const response = await fetch(`/api/industries/${encodeURIComponent(item.id)}`, { method: 'DELETE' })
    if (response.status === 409) {
      ElMessage.warning(t('admin.industryInUse'))
      return
    }
    if (!response.ok && response.status !== 404) throw new Error(`HTTP ${response.status}`)
    deleteIndustryLocally(item.id)
    ElMessage.success(t('admin.contentDeleted'))
  } catch {
    deleteIndustryLocally(item.id)
    ElMessage.warning(t('admin.savedInThisBrowserBackendApiIsUnavailable'))
  }
}

defineExpose({ load, openEditor })
onMounted(load)
</script>

<template>
  <el-card shadow="never" class="table-card industry-manager">
    <template #header>
      <div class="card-heading">
        <div><strong>{{ $t('admin.industryManagement') }}</strong>
          <small>{{ publishedCount }} {{ $t('admin.industryPublished') }} · {{ industries.length }} {{ $t('admin.records') }}</small></div>
        <el-button type="primary" @click="openEditor()">{{ $t('admin.addIndustry') }}</el-button>
      </div>
    </template>
    <el-alert type="info" :closable="false" class="industry-manager-tip" :title="$t('admin.industryVisibilityHint')" />
    <el-table :data="industries" v-loading="loading" row-key="id" :empty-text="$t('admin.noIndustries')">
      <el-table-column :label="$t('admin.productIndustry')" min-width="220">
        <template #default="{ row }"><strong>{{ field(row, 'title') }}</strong>
          <div class="industry-table-subtitle">{{ field(row, 'subtitle') }}</div></template>
      </el-table-column>
      <el-table-column :label="$t('admin.linkedProducts')" width="120">
        <template #default="{ row }">{{ productCount(row.id) }}</template>
      </el-table-column>
      <el-table-column prop="sortOrder" :label="$t('admin.industryOrder')" width="100" />
      <el-table-column :label="$t('admin.status')" width="110">
        <template #default="{ row }"><el-tag :type="row.status === 'published' ? 'success' : 'warning'" size="small">
          {{ $t(row.status === 'published' ? 'admin.published' : 'admin.draft') }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="$t('admin.actions')" width="185" align="right" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditor(row)">{{ $t('admin.edit') }}</el-button>
          <el-button link :type="row.status === 'published' ? 'warning' : 'success'" @click="toggle(row)">
            {{ $t(row.status === 'published' ? 'admin.unpublish' : 'admin.publish') }}
          </el-button>
          <el-button v-if="!defaultIds.has(row.id)" link type="danger" :disabled="productCount(row.id) > 0"
            @click="remove(row)">{{ $t('admin.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogOpen" :title="$t(form.id ? 'admin.editIndustry' : 'admin.addIndustry')"
    width="640px" class="editor-dialog" destroy-on-close>
    <el-form :model="form" label-position="top" @submit.prevent="save">
      <el-tabs v-model="editingLocale" class="bilingual-tabs">
        <el-tab-pane :label="$t('admin.english')" name="en">
          <el-form-item :label="$t('admin.industryNameEnglish')" required>
            <el-input v-model="form.titleEn" maxlength="255" show-word-limit />
          </el-form-item>
          <el-form-item :label="$t('admin.industrySubtitleEnglish')">
            <el-input v-model="form.subtitleEn" maxlength="1000" show-word-limit />
          </el-form-item>
        </el-tab-pane>
        <el-tab-pane :label="$t('admin.chinese')" name="zh">
          <el-form-item :label="$t('admin.industryNameChinese')" required>
            <el-input v-model="form.titleZh" maxlength="255" show-word-limit />
          </el-form-item>
          <el-form-item :label="$t('admin.industrySubtitleChinese')">
            <el-input v-model="form.subtitleZh" maxlength="1000" show-word-limit />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12"><el-form-item :label="$t('admin.industryOrder')">
          <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
        </el-form-item></el-col>
        <el-col :xs="24" :sm="12"><el-form-item :label="$t('admin.status')">
          <el-select v-model="form.status" class="full-width">
            <el-option :label="$t('admin.published')" value="published" />
            <el-option :label="$t('admin.draft')" value="draft" />
          </el-select>
        </el-form-item></el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogOpen = false">{{ $t('admin.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ $t('admin.saveContent') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.industry-manager-tip { margin-bottom: 16px; }
.industry-table-subtitle { margin-top: 4px; color: #8893a1; font-size: 12px; }
</style>
