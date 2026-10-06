<script setup>
import { Document } from '@element-plus/icons-vue'
import AdminEditorDialog from './AdminEditorDialog.vue'
import AdminEditorPanel from './AdminEditorPanel.vue'
import { inquiryFieldLabels } from '../services/contactSettings.js'

defineProps({
  modelValue: Boolean,
  inquiry: { type: Object, default: () => ({}) },
  editableStatus: Boolean,
  saving: Boolean,
})
const emit = defineEmits(['update:modelValue', 'update:status', 'save'])

function sizeLabel(size) { return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB` }
function dateLabel(value) { return value ? new Date(value).toLocaleString() : '—' }
</script>

<template>
  <AdminEditorDialog
    :model-value="modelValue"
    :title="$t('contactAdmin.viewInquiry', { id: inquiry.id })"
    :description="$t(editableStatus ? 'contactAdmin.inquiriesHint' : 'contactAdmin.inquiryReadOnly')"
    :footer-note="$t(editableStatus ? 'contactAdmin.inquirySaveNote' : 'contactAdmin.inquiryReadOnly')"
    :save-label="$t('contactAdmin.saveStatus')"
    :close-label="editableStatus ? '' : $t('contactAdmin.closeDetails')"
    :show-save="editableStatus"
    :saving="saving"
    icon="ChatDotRound"
    @update:model-value="emit('update:modelValue', $event)"
    @save="editableStatus && emit('save')"
  >
    <el-form label-position="top" :disabled="saving" @submit.prevent="editableStatus && emit('save')">
      <div class="cms-editor-layout">
        <div class="cms-editor-main">
          <AdminEditorPanel step="01" :title="$t('contactAdmin.customerSubmission')">
            <el-descriptions :column="2" border class="inquiry-customer-details">
              <el-descriptions-item v-for="key in ['name', 'company', 'country', 'email', 'phone', 'industry']" :key="key" :label="$t(inquiryFieldLabels[key])">{{ inquiry[key] || '—' }}</el-descriptions-item>
            </el-descriptions>
            <h3 class="inquiry-section-title">{{ $t('site.projectRequirements') }}</h3>
            <div class="inquiry-submitted-text">{{ inquiry.requirements || '—' }}</div>
            <template v-if="inquiry.notes">
              <h3 class="inquiry-section-title">{{ $t('contactAdmin.notes') }}</h3>
              <div class="inquiry-submitted-text">{{ inquiry.notes }}</div>
            </template>
          </AdminEditorPanel>
        </div>
        <aside class="cms-editor-aside">
          <AdminEditorPanel step="02" :title="$t('contactAdmin.processingStatus')">
            <el-form-item v-if="editableStatus" :label="$t('admin.status')">
              <el-select :model-value="inquiry.status" @update:model-value="emit('update:status', $event)">
                <el-option v-for="status in ['new', 'contacted', 'closed']" :key="status" :value="status" :label="$t('contactAdmin.inquiryStatus.' + status)" />
              </el-select>
            </el-form-item>
            <el-tag v-else :type="inquiry.status === 'new' ? 'warning' : inquiry.status === 'closed' ? 'info' : 'success'">{{ $t('contactAdmin.inquiryStatus.' + inquiry.status) }}</el-tag>
            <p class="inquiry-detail-text">{{ $t('admin.received') }}: {{ dateLabel(inquiry.createdAt) }}</p>
          </AdminEditorPanel>
          <AdminEditorPanel step="03" :title="$t('contactUi.attachments')">
            <p v-if="!inquiry.attachments?.length" class="inquiry-detail-text">{{ $t('contactAdmin.noAttachments') }}</p>
            <a v-for="file in inquiry.attachments" :key="file.id" :href="file.url" class="inquiry-file-link" download><el-icon><Document /></el-icon><span>{{ file.originalName }}<small>{{ sizeLabel(file.size) }}</small></span></a>
          </AdminEditorPanel>
        </aside>
      </div>
    </el-form>
  </AdminEditorDialog>
</template>

<style scoped>
.inquiry-customer-details :deep(.el-descriptions__cell) { overflow-wrap: anywhere; font-size: 13px; line-height: 1.8; }
.inquiry-section-title { margin: 24px 0 12px; color: #244568; font-size: 14px; font-weight: 600; }
.inquiry-submitted-text { padding: 16px; background: #f6f8fb; border: 1px solid #e1e8f0; border-radius: 8px; color: #334d67; font-size: 14px; line-height: 1.9; white-space: pre-wrap; overflow-wrap: anywhere; }
.inquiry-detail-text { color: #52667d; font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
.inquiry-file-link { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; color: #245c9b; line-height: 1.7; font-size: 13px; text-decoration: underline; overflow-wrap: anywhere; }
.inquiry-file-link small { display: block; color: #52667d; }
</style>
