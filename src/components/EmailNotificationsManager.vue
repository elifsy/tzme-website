<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Promotion, View } from '@element-plus/icons-vue'
import AdminEditorPanel from './AdminEditorPanel.vue'
import InquiryDetailsDialog from './InquiryDetailsDialog.vue'
import { apiRequest } from '../services/api.js'
import { useInquiryCatalog } from '../services/inquiries.js'
import { loadMailSettings, saveMailSettings, useMailSettings } from '../services/mailSettings.js'
import '../style/admin-editor.css'

const { t } = useI18n({ useScope: 'global' })
const { inquiries, loadInquiries } = useInquiryCatalog()
const { mailSettings } = useMailSettings()
const form = ref(null)
const recipientListRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const notifying = ref(null)
const inquiryDialogOpen = ref(false)
const selectedInquiryId = ref(null)
const selectedInquiry = computed(() => inquiries.value.find(item => item.id === selectedInquiryId.value) || {})
const error = ref('')
const activeTab = ref('settings')
const search = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const original = ref('')
const dirty = computed(() => JSON.stringify(form.value) !== original.value)
const filtered = computed(() => inquiries.value.filter(item => (!statusFilter.value || (item.mailStatus || 'disabled') === statusFilter.value) && [item.id, item.name, item.company, item.mailRecipients].join(' ').toLowerCase().includes(search.value.trim().toLowerCase())))
const pageItems = computed(() => filtered.value.slice((currentPage.value - 1) * 10, currentPage.value * 10))
let timer
let disposed = false
async function load() {
  if (loading.value || saving.value) return
  loading.value = true; error.value = ''
  try {
    const [value] = await Promise.all([loadMailSettings(), loadInquiries()])
    if (!disposed) { form.value = JSON.parse(JSON.stringify(value)); original.value = JSON.stringify(value) }
  } catch { if (!disposed) error.value = t('mailAdmin.loadFailed') }
  finally { if (!disposed) loading.value = false }
}
async function addRecipient() {
  if (!form.value || saving.value || form.value.recipients.length >= 20) return
  form.value.recipients.push({ email: '', enabled: false })
  await nextTick()
  const list = recipientListRef.value
  if (disposed || !list) return
  list.scrollTop = list.scrollHeight
  list.querySelector('.mail-recipient:last-child input')?.focus({ preventScroll: true })
}
function validEmail(value) { return /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value) }
function validate() {
  const notification = form.value
  if (notification.recipients.some(row => !validEmail(row.email)) || new Set(notification.recipients.map(row => row.email.trim().toLowerCase())).size !== notification.recipients.length) return t('contactAdmin.emailInvalid')
  const smtp = notification.smtp
  if (notification.enabled && (!notification.recipients.some(row => row.enabled) || !smtp.host.trim() || !validEmail(smtp.from) || (smtp.username.trim() && !smtp.password && (!smtp.passwordConfigured || smtp.clearPassword)))) return t('contactAdmin.completeSmtp')
  return ''
}
async function save() {
  if (!form.value || saving.value || loading.value) return
  const message = validate()
  if (message) { ElMessage.warning(message); return }
  saving.value = true
  try {
    const saved = await saveMailSettings(form.value)
    if (disposed) return
    form.value = JSON.parse(JSON.stringify(saved)); original.value = JSON.stringify(saved)
    ElMessage.success(t('mailAdmin.saved'))
  } catch { if (!disposed) ElMessage.error(t('contactAdmin.saveFailed')) }
  finally { if (!disposed) saving.value = false }
}
function openInquiry(item) { selectedInquiryId.value = item.id; inquiryDialogOpen.value = true }
function notifyDisabled(item) { return !mailSettings.value?.enabled || ['pending', 'sending'].includes(item.mailStatus) || notifying.value !== null }
async function notify(item) {
  if (notifyDisabled(item)) return
  notifying.value = item.id
  try {
    await apiRequest(`/api/inquiries/${item.id}/notify`, { method: 'POST' })
    if (!disposed) { await loadInquiries(); ElMessage.success(t('contactAdmin.notificationQueued')) }
  } catch { if (!disposed) ElMessage.error(t('contactAdmin.notificationFailed')) }
  finally { if (!disposed) notifying.value = null }
}
function dateLabel(value) { return value ? new Date(value).toLocaleString() : '—' }
function mailType(status) { return status === 'sent' ? 'success' : status === 'failed' ? 'danger' : ['pending', 'sending'].includes(status) ? 'warning' : 'info' }
onMounted(() => { load(); timer = setInterval(() => { if (inquiries.value.some(item => ['pending', 'sending'].includes(item.mailStatus))) loadInquiries() }, 15000) })
onBeforeUnmount(() => { disposed = true; clearInterval(timer) })
defineExpose({ load })
</script>

<template>
  <div v-loading="loading" class="mail-notifications-manager">
    <el-alert v-if="error" type="error" :closable="false" show-icon :title="error"><el-button @click="load">{{ $t('admin.retryDatabase') }}</el-button></el-alert>
    <el-tabs v-model="activeTab" class="mail-manager-tabs"><el-tab-pane name="settings" :label="$t('mailAdmin.settings')" /><el-tab-pane name="records" :label="$t('mailAdmin.records')" /></el-tabs>
    <el-form v-if="form" v-show="activeTab === 'settings'" label-position="top" :disabled="saving" @submit.prevent="save">
      <div class="mail-settings-grid">
        <AdminEditorPanel step="01" :title="$t('contactAdmin.recipients')" :description="$t('contactAdmin.mailHint')">
          <el-form-item :label="$t('contactAdmin.mailEnabled')"><el-switch v-model="form.enabled" /></el-form-item>
          <div v-if="form.recipients.length" ref="recipientListRef" class="mail-recipient-list" role="region" tabindex="0" :aria-label="$t('contactAdmin.recipients')">
            <div v-for="(recipient, index) in form.recipients" :key="index" class="mail-recipient"><el-input v-model="recipient.email" type="email" maxlength="255" :aria-label="$t('contactAdmin.recipientEmail')" /><el-switch v-model="recipient.enabled" :aria-label="$t('contactAdmin.recipientEnabled')" /><el-button text type="danger" @click="form.recipients.splice(index, 1)">{{ $t('admin.delete') }}</el-button></div>
          </div>
          <el-button plain type="primary" :disabled="form.recipients.length >= 20" @click="addRecipient">{{ $t('contactAdmin.addRecipient') }}</el-button>
        </AdminEditorPanel>
        <AdminEditorPanel step="02" :title="$t('contactAdmin.smtp')" :description="$t('contactAdmin.smtpHint')">
          <el-form-item :label="$t('contactAdmin.smtpHost')"><el-input v-model="form.smtp.host" maxlength="255" placeholder="smtp.example.com" /></el-form-item>
          <div class="mail-settings-grid mail-settings-grid-inside"><el-form-item :label="$t('contactAdmin.smtpPort')"><el-input-number v-model="form.smtp.port" :min="1" :max="65535" :precision="0" controls-position="right" /></el-form-item><el-form-item :label="$t('contactAdmin.smtpSecurity')"><el-select v-model="form.smtp.security"><el-option label="SSL / TLS" value="ssl" /><el-option label="STARTTLS" value="starttls" /><el-option :label="$t('contactAdmin.smtpNone')" value="none" /></el-select></el-form-item></div>
          <el-form-item :label="$t('contactAdmin.smtpFrom')"><el-input v-model="form.smtp.from" maxlength="255" type="email" /></el-form-item>
          <el-form-item :label="$t('contactAdmin.smtpUsername')"><el-input v-model="form.smtp.username" maxlength="255" autocomplete="off" /></el-form-item>
          <el-form-item :label="$t('contactAdmin.smtpPassword')"><el-input v-model="form.smtp.password" type="password" show-password maxlength="1000" autocomplete="new-password" :placeholder="$t(form.smtp.passwordConfigured ? 'contactAdmin.passwordKeep' : 'contactAdmin.passwordEnter')" /></el-form-item>
          <el-checkbox v-if="form.smtp.passwordConfigured" v-model="form.smtp.clearPassword">{{ $t('contactAdmin.clearPassword') }}</el-checkbox>
        </AdminEditorPanel>
      </div>
      <div class="mail-settings-footer"><span>{{ $t(dirty ? 'mailAdmin.unsaved' : 'mailAdmin.saveHint') }}</span><el-button type="primary" :loading="saving" @click="save"><el-icon><CircleCheckFilled /></el-icon>{{ $t('mailAdmin.saveSettings') }}</el-button></div>
    </el-form>
    <el-card v-show="activeTab === 'records'" shadow="never" class="table-card mail-records">
      <template #header><div class="mail-records-heading"><div><strong>{{ $t('mailAdmin.records') }}</strong><p>{{ $t('mailAdmin.recordsHint') }}</p></div><div class="mail-records-filters"><el-input v-model="search" clearable :placeholder="$t('mailAdmin.search')" @input="currentPage = 1" /><el-select v-model="statusFilter" clearable :placeholder="$t('mailAdmin.allStatuses')" @change="currentPage = 1"><el-option v-for="status in ['disabled', 'pending', 'sending', 'sent', 'failed']" :key="status" :value="status" :label="$t('contactAdmin.mailStatus.' + status)" /></el-select></div></div></template>
      <el-alert v-if="!mailSettings?.enabled" :title="$t('mailAdmin.enableHint')" type="info" show-icon :closable="false" class="mail-records-tip" />
      <el-table :data="pageItems" row-key="id" :empty-text="$t('admin.noEnquiriesReceivedYet')">
        <el-table-column :label="$t('mailAdmin.inquiry')" min-width="150"><template #default="{ row }"><strong>#{{ row.id }} · {{ row.name }}</strong><small class="mail-records-sub">{{ row.company }}</small></template></el-table-column>
        <el-table-column :label="$t('contactAdmin.recipients')" min-width="240"><template #default="{ row }"><span class="mail-recipient-text">{{ row.mailRecipients || '—' }}</span></template></el-table-column>
        <el-table-column :label="$t('contactAdmin.mailStatusLabel')" width="120"><template #default="{ row }"><el-tag :type="mailType(row.mailStatus)">{{ $t('contactAdmin.mailStatus.' + (row.mailStatus || 'disabled')) }}</el-tag><small v-if="row.mailError" class="mail-records-sub">{{ $t('contactAdmin.mailFailureHint') }}</small></template></el-table-column>
        <el-table-column :label="$t('contactAdmin.mailAttempts')" width="100" align="center"><template #default="{ row }">{{ row.mailAttempts || 0 }}</template></el-table-column>
        <el-table-column :label="$t('mailAdmin.sentAt')" min-width="165"><template #default="{ row }">{{ dateLabel(row.mailSentAt) }}</template></el-table-column>
        <el-table-column :label="$t('contactAdmin.actions')" width="118" align="center" fixed="right">
          <template #default="{ row }">
            <div class="mail-records-actions">
              <el-tooltip :content="$t('mailAdmin.viewInquiry')" :trigger="['hover', 'focus']" placement="top">
                <el-button :icon="View" circle plain type="primary" :aria-label="$t('mailAdmin.viewInquiry')" @click="openInquiry(row)" />
              </el-tooltip>
              <el-tooltip :content="$t('contactAdmin.retryNotification')" :trigger="['hover', 'focus']" placement="top">
                <span class="mail-action-trigger" :tabindex="notifyDisabled(row) ? 0 : undefined">
                  <el-button :icon="Promotion" circle plain :loading="notifying === row.id" :disabled="notifyDisabled(row)" :aria-label="$t('contactAdmin.retryNotification')" @click="notify(row)" />
                </span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="currentPage" :page-size="10" :total="filtered.length" layout="total, prev, pager, next" class="mail-records-pagination" />
    </el-card>
    <InquiryDetailsDialog v-model="inquiryDialogOpen" :inquiry="selectedInquiry" />
  </div>
</template>

<style scoped>
.mail-manager-tabs { margin-bottom: 20px; }
.mail-settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; align-items: stretch; }
.mail-settings-grid-inside { gap: 16px; align-items: start; }
.mail-notifications-manager :deep(.el-select) { width: 100%; }
.mail-notifications-manager :deep(.el-input-number) { width: min(180px, 100%); }
.mail-recipient-list { max-height: 240px; overflow-y: auto; scrollbar-gutter: stable; overscroll-behavior: contain; margin-bottom: 16px; padding: 3px 8px 3px 3px; }
.mail-recipient-list:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; border-radius: 4px; }
.mail-recipient { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
.mail-recipient:last-child { margin-bottom: 0; }
.mail-recipient :deep(.el-input) { flex: 1; min-width: 0; }
.mail-recipient :deep(.el-switch), .mail-recipient :deep(.el-button) { flex-shrink: 0; }
.mail-settings-footer { display: flex; justify-content: space-between; align-items: center; gap: 20px; background: #fff; border: 1px solid #dce5ef; border-radius: 10px; padding: 16px 20px; margin-top: 20px; color: #4d637c; font-size: 13px; }
.mail-records-heading { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.mail-records-heading p { color: #52667d; font-size: 13px; margin: 6px 0 0; line-height: 1.7; }
.mail-records-filters { display: flex; gap: 12px; width: min(440px, 100%); flex-shrink: 0; }
.mail-records-filters > .el-select { width: 160px; flex-shrink: 0; }
.mail-records-sub { display: block; font-size: 12px; color: #52667d; line-height: 1.7; margin-top: 5px; }
.mail-recipient-text { overflow-wrap: anywhere; }
.mail-records-tip { margin-bottom: 16px; }
.mail-records-pagination { display: flex; justify-content: flex-end; margin-top: 20px; }
.mail-records-actions { display: flex; align-items: center; justify-content: center; gap: 8px; }
.mail-action-trigger { display: inline-flex; border-radius: 50%; }
.mail-action-trigger:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
@media (max-width: 900px) { .mail-settings-grid { grid-template-columns: 1fr; } .mail-records-heading { align-items: stretch; flex-direction: column; } }
</style>
