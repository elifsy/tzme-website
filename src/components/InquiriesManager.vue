<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import InquiryDetailsDialog from './InquiryDetailsDialog.vue'
import { apiRequest } from '../services/api.js'
import { useInquiryCatalog } from '../services/inquiries.js'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const { inquiries, loadInquiries } = useInquiryCatalog()
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const search = ref('')
const currentPage = ref(1)
const form = reactive({})
const filtered = computed(() => inquiries.value.filter(item => [item.name, item.email, item.company, item.requirements].join(' ').toLowerCase().includes(search.value.trim().toLowerCase())))
const pageItems = computed(() => filtered.value.slice((currentPage.value - 1) * 10, currentPage.value * 10))
let disposed = false
let openedInquiryId = ''
function openDetails(item) { Object.assign(form, JSON.parse(JSON.stringify(item))); dialogOpen.value = true }
function openRequestedInquiry() {
  const id = String(route.query.inquiry || '')
  if (!id || id === openedInquiryId) return
  const item = inquiries.value.find(row => String(row.id) === id)
  if (item) { openedInquiryId = id; openDetails(item) }
}
watch(() => route.query.inquiry, openRequestedInquiry)
async function load() {
  if (loading.value) return
  loading.value = true
  try { await loadInquiries(); if (!disposed) openRequestedInquiry() }
  finally { if (!disposed) loading.value = false }
}
function dateLabel(value) { return value ? new Date(value).toLocaleString() : '—' }
async function save() {
  if (saving.value) return
  saving.value = true
  try {
    await apiRequest('/api/inquiries/' + form.id, { method: 'PUT', body: { status: form.status } })
    if (disposed) return
    await load(); dialogOpen.value = false; ElMessage.success(t('contactAdmin.statusSaved'))
  } catch { if (!disposed) ElMessage.error(t('admin.apiWriteFailed')) }
  finally { if (!disposed) saving.value = false }
}
onMounted(load)
onBeforeUnmount(() => { disposed = true })
defineExpose({ load })
</script>

<template>
  <el-card shadow="never" class="table-card inquiry-manager">
    <template #header><div class="inquiries-heading"><div><strong>{{ $t('admin.customerEnquiries') }}</strong><p>{{ $t('contactAdmin.inquiriesHint') }}</p></div><el-input v-model="search" clearable :placeholder="$t('contactAdmin.inquirySearch')" class="inquiries-search" @input="currentPage = 1" /></div></template>
    <el-table v-loading="loading" :data="pageItems" row-key="id" :empty-text="$t('admin.noEnquiriesReceivedYet')">
      <el-table-column :label="$t('admin.contact')" min-width="180"><template #default="{ row }"><strong>{{ row.name || '—' }}</strong><small class="table-sub">{{ row.email }}<br />{{ row.phone }}</small></template></el-table-column>
      <el-table-column :label="$t('admin.companyAndIndustry')" min-width="180"><template #default="{ row }">{{ row.company || '—' }}<small class="table-sub">{{ row.country }} · {{ row.industry }}</small></template></el-table-column>
      <el-table-column prop="requirements" :label="$t('admin.requirements')" min-width="240" show-overflow-tooltip />
      <el-table-column :label="$t('contactUi.attachments')" width="80" align="center"><template #default="{ row }">{{ row.attachments?.length || 0 }}</template></el-table-column>
      <el-table-column :label="$t('admin.status')" width="100"><template #default="{ row }"><el-tag :type="row.status === 'new' ? 'warning' : row.status === 'closed' ? 'info' : 'success'">{{ $t('contactAdmin.inquiryStatus.' + row.status) }}</el-tag></template></el-table-column>
      <el-table-column :label="$t('admin.received')" min-width="165"><template #default="{ row }">{{ dateLabel(row.createdAt) }}</template></el-table-column>
      <el-table-column :label="$t('contactAdmin.actions')" width="88" align="center" fixed="right">
        <template #default="{ row }">
          <el-tooltip :content="$t('contactAdmin.viewAndProcess')" :trigger="['hover', 'focus']" placement="top">
            <el-button :icon="View" circle plain type="primary" :aria-label="$t('contactAdmin.viewAndProcess')" @click="openDetails(row)" />
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="currentPage" :page-size="10" :total="filtered.length" layout="total, prev, pager, next" class="inquiries-pagination" />
  </el-card>
  <InquiryDetailsDialog v-model="dialogOpen" :inquiry="form" editable-status :saving="saving" @update:status="form.status = $event" @save="save" />
</template>

<style scoped>
.inquiries-heading { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.inquiries-heading p { color: #52667d; font-size: 13px; margin: 6px 0 0; }
.inquiries-search { width: 280px; max-width: 100%; }
.table-sub { display: block; color: #52667d; line-height: 1.7; margin-top: 4px; }
.inquiries-pagination { justify-content: flex-end; margin-top: 20px; }
@media (max-width: 760px) { .inquiries-heading { align-items: flex-start; flex-direction: column; } }
</style>
