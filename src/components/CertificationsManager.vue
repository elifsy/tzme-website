<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminEditorDialog from './AdminEditorDialog.vue'
import AdminEditorPanel from './AdminEditorPanel.vue'
import {
  deleteCertificationLocally,
  loadCertifications,
  markCertificationSynced,
  mergeCertifications,
  saveCertificationLocally,
} from '../services/certifications.js'

const { t, locale } = useI18n({ useScope: 'global' })
const records = ref(mergeCertifications())
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const editingLocale = ref('en')
const publishedCount = computed(() => records.value.filter((item) => item.status === 'published').length)
const form = reactive({
  id: '', titleEn: '', titleZh: '', summaryEn: '', summaryZh: '',
  issuerEn: '', issuerZh: '', certificateNo: '', issuedAt: '', expiresAt: '',
  image: '', sortOrder: 10, status: 'published',
})

function field(item, name) {
  return locale.value === 'zh'
    ? item[`${name}Zh`] || item[`${name}En`] || ''
    : item[`${name}En`] || ''
}

async function load() {
  loading.value = true
  records.value = await loadCertifications()
  loading.value = false
}

function openEditor(item = null) {
  editingLocale.value = locale.value === 'zh' ? 'zh' : 'en'
  Object.assign(form, {
    id: item?.id || '',
    titleEn: item?.titleEn || '', titleZh: item?.titleZh || '',
    summaryEn: item?.summaryEn || '', summaryZh: item?.summaryZh || '',
    issuerEn: item?.issuerEn || '', issuerZh: item?.issuerZh || '',
    certificateNo: item?.certificateNo || '',
    issuedAt: item?.issuedAt || '', expiresAt: item?.expiresAt || '',
    image: item?.image || '',
    sortOrder: Number(item?.sortOrder ?? (records.value.length + 1) * 10),
    status: item?.status || 'published',
  })
  dialogOpen.value = true
}

async function writeToApi(record, update) {
  const payload = {
    ...record,
    issuedAt: record.issuedAt || null,
    expiresAt: record.expiresAt || null,
  }
  const options = {
    method: update ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
  let response = await fetch(
    `/api/certifications${update ? `/${encodeURIComponent(record.id)}` : ''}`,
    options,
  )
  // Seed records are visible before their first save to MySQL.
  if (update && response.status === 404) {
    response = await fetch('/api/certifications', { ...options, method: 'POST' })
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function persist(record, update) {
  saveCertificationLocally(record)
  const index = records.value.findIndex((item) => item.id === record.id)
  if (index < 0) records.value.unshift(record)
  else records.value[index] = record
  records.value = [...records.value].sort((a, b) =>
    (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)
    || (a.titleEn || '').localeCompare(b.titleEn || ''),
  )
  try {
    await writeToApi(record, update)
    markCertificationSynced(record.id)
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
  if (form.issuedAt && form.expiresAt && form.expiresAt < form.issuedAt) {
    ElMessage.warning(t('admin.certInvalidDateRange'))
    return
  }
  saving.value = true
  const record = {
    ...form,
    id: form.id || `cert-${Date.now()}`,
    titleEn: form.titleEn.trim(),
    titleZh: form.titleZh.trim(),
    sortOrder: Number(form.sortOrder) || 0,
  }
  await persist(record, Boolean(form.id))
  saving.value = false
  dialogOpen.value = false
}

async function toggle(item) {
  const record = { ...item, status: item.status === 'published' ? 'draft' : 'published' }
  await persist(record, true)
}

async function remove(item) {
  try {
    await ElMessageBox.confirm(
      t('admin.deleteConfirm', { title: field(item, 'title') }),
      t('admin.certDeleteTitle'),
      {
        confirmButtonText: t('admin.delete'),
        cancelButtonText: t('admin.cancel'),
        type: 'warning',
      },
    )
  } catch {
    return
  }
  deleteCertificationLocally(item.id)
  records.value = records.value.filter((record) => record.id !== item.id)
  try {
    const response = await fetch(`/api/certifications/${encodeURIComponent(item.id)}`, { method: 'DELETE' })
    if (!response.ok && response.status !== 404) throw new Error(`HTTP ${response.status}`)
    ElMessage.success(t('admin.contentDeleted'))
  } catch {
    ElMessage.warning(t('admin.savedInThisBrowserBackendApiIsUnavailable'))
  }
}

defineExpose({ load, openEditor })
onMounted(load)
</script>

<template>
  <el-card shadow="never" class="table-card cert-manager">
    <template #header>
      <div class="card-heading">
        <div>
          <strong>{{ $t('admin.certifications') }}</strong>
          <small>{{ publishedCount }} {{ $t('admin.certPublishedCount') }} · {{ records.length }} {{ $t('admin.records') }}</small>
        </div>
        <el-button type="primary" @click="openEditor()">{{ $t('admin.certAdd') }}</el-button>
      </div>
    </template>
    <el-table :data="records" v-loading="loading" row-key="id" :empty-text="$t('admin.certEmpty')">
      <el-table-column :label="$t('admin.certName')" min-width="230">
        <template #default="{ row }">
          <div class="cert-name-cell">
            <el-image v-if="row.image" :src="row.image" fit="cover" class="cert-thumbnail" />
            <span v-else class="cert-thumbnail cert-thumbnail-empty"><el-icon><Picture /></el-icon></span>
            <span><strong>{{ field(row, 'title') }}</strong><small>{{ field(row, 'summary') }}</small></span>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('admin.certIssuer')" min-width="150">
        <template #default="{ row }">{{ field(row, 'issuer') || '—' }}</template>
      </el-table-column>
      <el-table-column prop="certificateNo" :label="$t('admin.certNumber')" min-width="130">
        <template #default="{ row }">{{ row.certificateNo || '—' }}</template>
      </el-table-column>
      <el-table-column :label="$t('admin.certValidity')" min-width="170">
        <template #default="{ row }">{{ row.issuedAt || '—' }} → {{ row.expiresAt || '—' }}</template>
      </el-table-column>
      <el-table-column prop="sortOrder" :label="$t('admin.certOrder')" width="85" />
      <el-table-column :label="$t('admin.status')" width="110">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'warning'" size="small">
            {{ $t(row.status === 'published' ? 'admin.published' : 'admin.draft') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('admin.actions')" width="175" align="right" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditor(row)">{{ $t('admin.edit') }}</el-button>
          <el-button link :type="row.status === 'published' ? 'warning' : 'success'" @click="toggle(row)">
            {{ $t(row.status === 'published' ? 'admin.unpublish' : 'admin.publish') }}
          </el-button>
          <el-button link type="danger" @click="remove(row)">{{ $t('admin.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <AdminEditorDialog v-model="dialogOpen" :title="$t(form.id ? 'admin.certEdit' : 'admin.certAdd')"
    :description="$t('admin.certDescription')" icon="CircleCheckFilled" width="min(1100px, calc(100vw - 40px))"
    :status="form.status" :saving="saving" @save="save">
    <el-form :model="form" label-position="top" @submit.prevent="save">
      <div class="cms-editor-layout">
        <div class="cms-editor-main">
          <AdminEditorPanel step="01" :title="$t('admin.editorBilingualContent')" :description="$t('admin.editorBilingualDescription')">
            <el-alert class="bilingual-tip" type="info" :closable="false" show-icon :title="$t('admin.certBilingualHint')" />
            <el-tabs v-model="editingLocale">
              <el-tab-pane :label="$t('admin.english')" name="en">
                <el-form-item :label="$t('admin.certNameEn')" required>
                  <el-input v-model="form.titleEn" maxlength="255" show-word-limit />
                </el-form-item>
                <el-form-item :label="$t('admin.certSummaryEn')">
                  <el-input v-model="form.summaryEn" type="textarea" :rows="3" maxlength="3000" show-word-limit />
                </el-form-item>
                <el-form-item :label="$t('admin.certIssuerEn')">
                  <el-input v-model="form.issuerEn" maxlength="255" />
                </el-form-item>
              </el-tab-pane>
              <el-tab-pane :label="$t('admin.chinese')" name="zh">
                <el-form-item :label="$t('admin.certNameZh')" required>
                  <el-input v-model="form.titleZh" maxlength="255" show-word-limit />
                </el-form-item>
                <el-form-item :label="$t('admin.certSummaryZh')">
                  <el-input v-model="form.summaryZh" type="textarea" :rows="3" maxlength="3000" show-word-limit />
                </el-form-item>
                <el-form-item :label="$t('admin.certIssuerZh')">
                  <el-input v-model="form.issuerZh" maxlength="255" />
                </el-form-item>
              </el-tab-pane>
            </el-tabs>
          </AdminEditorPanel>
          <AdminEditorPanel step="02" :title="$t('admin.editorCertificateDetails')" :description="$t('admin.editorCertificateDescription')">
            <div class="cms-field-grid">
              <el-form-item :label="$t('admin.certNumber')"><el-input v-model="form.certificateNo" maxlength="255" /></el-form-item>
              <el-form-item :label="$t('admin.certOrder')">
                <el-input-number v-model="form.sortOrder" :min="0" :max="9999" controls-position="right" />
              </el-form-item>
              <el-form-item :label="$t('admin.certIssuedAt')">
                <el-date-picker v-model="form.issuedAt" type="date" value-format="YYYY-MM-DD" :placeholder="$t('admin.certSelectDate')" />
              </el-form-item>
              <el-form-item :label="$t('admin.certExpiresAt')">
                <el-date-picker v-model="form.expiresAt" type="date" value-format="YYYY-MM-DD" :placeholder="$t('admin.certSelectDate')" />
              </el-form-item>
            </div>
          </AdminEditorPanel>
        </div>
        <aside class="cms-editor-aside">
          <AdminEditorPanel step="03" :title="$t('admin.editorDisplaySettings')" :description="$t('admin.editorDisplayDescription')">
            <el-form-item :label="$t('admin.certImage')">
              <div class="cms-cover-control">
                <el-image v-if="form.image" :src="form.image" fit="contain" class="cms-cover-image">
                  <template #error><div class="cms-cover-fallback"><el-icon><Picture /></el-icon><span>{{ $t('admin.editorImageError') }}</span></div></template>
                </el-image>
                <div v-else class="cms-cover-empty"><el-icon><Picture /></el-icon><span>{{ $t('admin.editorImagePreview') }}</span><small>{{ $t('admin.editorImageHint') }}</small></div>
                <el-input v-model="form.image" maxlength="500" :placeholder="$t('admin.imagePathPlaceholder')" />
              </div>
            </el-form-item>
            <el-form-item :label="$t('admin.status2')">
              <el-radio-group v-model="form.status" class="cms-status-options">
                <el-radio-button value="published">{{ $t('admin.published2') }}</el-radio-button>
                <el-radio-button value="draft">{{ $t('admin.draft2') }}</el-radio-button>
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
.cert-name-cell { display: flex; align-items: center; gap: 12px; min-width: 0; }
.cert-name-cell > span:last-child { min-width: 0; }
.cert-name-cell strong, .cert-name-cell small { display: block; }
.cert-name-cell strong { color: #263544; font-size: 12px; }
.cert-name-cell small { margin-top: 3px; overflow: hidden; color: #8995a1; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.cert-thumbnail { width: 48px; height: 48px; flex: none; border-radius: 4px; }
.cert-thumbnail-empty { display: grid; place-items: center; background: #eef3f8; color: #9baabd; font-size: 20px; }
</style>
