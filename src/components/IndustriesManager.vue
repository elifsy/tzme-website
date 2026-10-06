<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Promotion } from '@element-plus/icons-vue'
import AdminEditorDialog from './AdminEditorDialog.vue'
import AdminEditorPanel from './AdminEditorPanel.vue'
import { industryField, useIndustryCatalog } from '../services/industries.js'
import { apiRequest } from '../services/api.js'

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

async function persist(record, update) {
  try {
    await apiRequest('/api/industries' + (update ? '/' + encodeURIComponent(record.id) : ''), { method: update ? 'PUT' : 'POST', body: record });
    await load(); ElMessage.success(t('admin.contentSaved')); return true;
  } catch { ElMessage.error(t('admin.apiWriteFailed')); return false; }
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
  try { if (await persist(record, Boolean(form.id))) dialogOpen.value = false }
  finally { saving.value = false }
}

async function toggle(item) {
  await persist({ ...item, status: item.status === 'published' ? 'draft' : 'published' }, true)
}

async function remove(item) {
  if (item.protectedSeed) {
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
    await apiRequest('/api/industries/' + encodeURIComponent(item.id), { method: 'DELETE' });
    await load(); ElMessage.success(t('admin.contentDeleted'));
  } catch (error) { ElMessage.error(t(error.status === 409 ? 'admin.industryInUse' : 'admin.apiWriteFailed')); }
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
      <el-table-column :label="$t('admin.actions')" width="150" align="right" fixed="right">
        <template #default="{ row }">
          <div class="industry-table-actions">
            <el-tooltip :content="$t('admin.edit')" :trigger="['hover', 'focus']" placement="top">
              <el-button link type="primary" :icon="Edit" :aria-label="$t('admin.edit')" @click="openEditor(row)" />
            </el-tooltip>
            <el-tooltip :content="$t(row.status === 'published' ? 'admin.unpublish' : 'admin.publish')" :trigger="['hover', 'focus']" placement="top">
              <el-button link :type="row.status === 'published' ? 'warning' : 'success'" :icon="Promotion" :aria-label="$t(row.status === 'published' ? 'admin.unpublish' : 'admin.publish')" @click="toggle(row)" />
            </el-tooltip>
            <el-tooltip v-if="!row.protectedSeed" :content="$t(productCount(row.id) > 0 ? 'admin.industryInUse' : 'admin.delete')" :trigger="['hover', 'focus']" placement="top">
              <span class="industry-action-trigger" :tabindex="productCount(row.id) > 0 ? 0 : undefined">
                <el-button link type="danger" :icon="Delete" :aria-label="$t('admin.delete')" :disabled="productCount(row.id) > 0" @click="remove(row)" />
              </span>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <AdminEditorDialog v-model="dialogOpen" :title="$t(form.id ? 'admin.editIndustry' : 'admin.addIndustry')"
    :description="$t('admin.industryManagementDescription')" icon="DataBoard" width="min(980px, calc(100vw - 40px))"
    :status="form.status" :saving="saving" @save="save">
    <el-form :model="form" label-position="top" @submit.prevent="save">
      <div class="cms-editor-layout">
        <div class="cms-editor-main">
          <AdminEditorPanel step="01" :title="$t('admin.editorBilingualContent')" :description="$t('admin.editorBilingualDescription')">
            <el-tabs v-model="editingLocale" class="bilingual-tabs">
              <el-tab-pane :label="$t('admin.english')" name="en">
                <el-form-item :label="$t('admin.industryNameEnglish')" required>
                  <el-input v-model="form.titleEn" maxlength="255" show-word-limit />
                </el-form-item>
                <el-form-item :label="$t('admin.industrySubtitleEnglish')">
                  <el-input v-model="form.subtitleEn" type="textarea" :rows="4" maxlength="1000" show-word-limit />
                </el-form-item>
              </el-tab-pane>
              <el-tab-pane :label="$t('admin.chinese')" name="zh">
                <el-form-item :label="$t('admin.industryNameChinese')" required>
                  <el-input v-model="form.titleZh" maxlength="255" show-word-limit />
                </el-form-item>
                <el-form-item :label="$t('admin.industrySubtitleChinese')">
                  <el-input v-model="form.subtitleZh" type="textarea" :rows="4" maxlength="1000" show-word-limit />
                </el-form-item>
              </el-tab-pane>
            </el-tabs>
          </AdminEditorPanel>
        </div>
        <aside class="cms-editor-aside">
          <AdminEditorPanel step="02" :title="$t('admin.editorIndustrySettings')" :description="$t('admin.industryVisibilityHint')">
            <el-form-item :label="$t('admin.industryOrder')">
              <el-input-number v-model="form.sortOrder" :min="0" :max="9999" controls-position="right" />
            </el-form-item>
            <el-form-item :label="$t('admin.status')">
              <el-radio-group v-model="form.status" class="cms-status-options">
                <el-radio-button value="published">{{ $t('admin.published') }}</el-radio-button>
                <el-radio-button value="draft">{{ $t('admin.draft') }}</el-radio-button>
              </el-radio-group>
              <p class="cms-field-hint">{{ $t(form.status === 'published' ? 'admin.editorPublishedHint' : 'admin.editorDraftHint') }}</p>
            </el-form-item>
          </AdminEditorPanel>
        </aside>
      </div>
    </el-form>
  </AdminEditorDialog>
</template>

<style scoped>
.industry-manager-tip { margin-bottom: 16px; }
.industry-table-subtitle { margin-top: 4px; color: #8893a1; font-size: 12px; }
.industry-table-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.industry-table-actions :deep(.el-button) { margin-left: 0; }
.industry-action-trigger { display: inline-flex; }
.industry-action-trigger:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; border-radius: 4px; }
</style>
