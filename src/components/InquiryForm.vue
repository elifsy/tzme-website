<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { apiRequest } from '../services/api.js'
import { contactText, inquiryFieldLabels, useContactSettings } from '../services/contactSettings.js'
import { industryField, useIndustryCatalog } from '../services/industries.js'

defineProps({ placement: { type: String, default: 'contact' } })
const { t, locale } = useI18n({ useScope: 'global' })
const { contactSettings } = useContactSettings()
const { industries, loadIndustries } = useIndustryCatalog()
const activeIndustries = computed(() => industries.value.filter(item => item.status === 'published'))
const config = computed(() => contactSettings.value)
const form = reactive(Object.fromEntries(Object.keys(inquiryFieldLabels).map(key => [key, ''])))
const formRef = ref(null)
const fileList = ref([])
const submitting = ref(false)
const uploadRef = ref(null)
const uploads = new Map()
const inProgress = computed(() => fileList.value.some(file => ['ready', 'uploading'].includes(file.status)))
const hasFailed = computed(() => fileList.value.some(file => file.status === 'fail'))
const accept = computed(() => config.value?.upload.allowedExtensions.map(value => `.${value}`).join(',') || '')
const rules = computed(() => Object.fromEntries(Object.keys(inquiryFieldLabels).map(key => [key, [
  ...(config.value?.form.requiredFields.includes(key) ? [{ required: true, whitespace: true, message: t('contactUi.required', { field: t(inquiryFieldLabels[key]) }), trigger: 'blur' }] : []),
  ...(key === 'email' ? [{ type: 'email', message: t('site.inquiryInvalidEmail'), trigger: 'blur' }] : []),
]])))
// Clear messages from the previous language without resetting the entered values.
watch(locale, () => formRef.value?.clearValidate(), { flush: 'post' })
let disposed = false
function beforeUpload(file) {
  const extension = file.name.split('.').pop().toLowerCase()
  if (!config.value.upload.allowedExtensions.includes(extension) || file.size <= 0 || file.size > config.value.upload.maxFileSizeMb * 1024 * 1024) {
    ElMessage.warning(t('contactUi.fileInvalid', { size: config.value.upload.maxFileSizeMb, types: config.value.upload.allowedExtensions.join(', ').toUpperCase() }))
    return false
  }
  return !submitting.value
}
function uploadFile(options) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    uploads.set(options.file.uid, request)
    const body = new FormData(); body.append('file', options.file)
    request.open('POST', '/api/inquiry-attachments')
    request.upload.onprogress = event => {
      if (event.lengthComputable) options.onProgress({ percent: event.loaded / event.total * 100 })
    }
    const finish = () => uploads.delete(options.file.uid)
    request.onload = () => {
      finish()
      try {
        if (request.status < 200 || request.status >= 300) throw new Error(`HTTP ${request.status}`)
        const result = JSON.parse(request.responseText)
        if (!result?.id || !result?.originalName) throw new Error('Invalid attachment response')
        resolve(result)
      } catch (error) { reject(error) }
    }
    request.onerror = () => { finish(); reject(new Error('Upload failed')) }
    request.onabort = () => { finish(); reject(new DOMException('Upload canceled', 'AbortError')) }
    request.send(body)
  })
}
function removeFile(file) { uploads.get(file.uid)?.abort() }
function uploadError(error) { if (!disposed && error.name !== 'AbortError') ElMessage.error(t('contactUi.uploadFailed')) }
async function submit() {
  if (submitting.value || inProgress.value || hasFailed.value || !config.value.form.enabled) return
  try { await formRef.value.validate() } catch { return }
  if (disposed || submitting.value) return
  submitting.value = true
  try {
    const values = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]))
    await apiRequest('/api/inquiries', { method: 'POST', body: { ...values, locale: locale.value, attachmentIds: fileList.value.filter(file => file.status === 'success').map(file => file.response.id) } })
    if (disposed) return
    Object.keys(form).forEach(key => { form[key] = '' })
    fileList.value = []; uploadRef.value?.clearFiles(); formRef.value.clearValidate()
    ElMessage.success(contactText(config.value.form.successText, locale.value))
  } catch {
    if (!disposed) ElMessage.error(t('contactUi.submitFailed', { email: config.value.contact.emails.join(' / ') || config.value.contact.phone }))
  } finally { if (!disposed) submitting.value = false }
}
onMounted(loadIndustries)
onBeforeUnmount(() => { disposed = true; uploads.forEach(request => request.abort()); uploads.clear() })
</script>

<template>
  <div v-if="config && config.form[placement === 'home' ? 'showOnHome' : 'showOnContact']" class="hc-form inquiry-form" @click.stop @keydown.stop>
    <template v-if="config.form.enabled">
      <span class="hc-kick inquiry-form-title">{{ contactText(config.form.title, locale) }}</span>
      <el-form ref="formRef" :model="form" :rules="rules" :validate-on-rule-change="false" label-position="top" :disabled="submitting" @submit.prevent="submit">
        <div class="inquiry-fields">
          <el-form-item v-for="key in ['name', 'company', 'country', 'email', 'phone', 'industry']" :key="key" :prop="key" :label="$t(inquiryFieldLabels[key])">
            <el-select v-if="key === 'industry'" v-model="form.industry" filterable allow-create default-first-option clearable :placeholder="$t('contactUi.industryPlaceholder')">
              <el-option v-for="industry in activeIndustries" :key="industry.id" :label="industryField(industry, 'title', locale)" :value="industryField(industry, 'title', locale)" />
            </el-select>
            <el-input v-else v-model="form[key]" :type="key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'" maxlength="255" :autocomplete="{ name: 'name', company: 'organization', country: 'country-name', email: 'email', phone: 'tel' }[key]" :placeholder="$t(inquiryFieldLabels[key])" />
          </el-form-item>
        </div>
        <el-form-item prop="requirements" :label="$t('site.projectRequirements')">
          <el-input v-model="form.requirements" type="textarea" :rows="4" maxlength="6000" show-word-limit :placeholder="$t('site.capacityMaterialHandledSiteConditionsRequiredDeliveryDate')" />
        </el-form-item>
        <el-form-item v-if="config.upload.enabled" :label="$t('contactUi.attachments')" class="inquiry-attachment-field">
          <el-upload ref="uploadRef" v-model:file-list="fileList" drag :accept="accept" :limit="config.upload.maxFiles" :before-upload="beforeUpload" :http-request="uploadFile" :on-remove="removeFile" :on-error="uploadError" :on-exceed="() => ElMessage.warning($t('contactUi.fileCount', { count: config.upload.maxFiles }))" :disabled="submitting" class="inquiry-upload">
            <el-icon class="inquiry-upload-icon"><UploadFilled /></el-icon>
            <div>{{ $t('site.dragAndDropOrClickToUpload') }}</div>
            <template #tip><p class="inquiry-upload-tip">{{ $t('contactUi.uploadHint', { size: config.upload.maxFileSizeMb, count: config.upload.maxFiles, types: config.upload.allowedExtensions.join(' / ').toUpperCase() }) }}</p></template>
          </el-upload>
        </el-form-item>
        <p v-if="inProgress" class="inquiry-upload-status" role="status">{{ $t('contactUi.uploading') }}</p>
        <p v-if="hasFailed" class="inquiry-upload-status" role="alert">{{ $t('contactUi.uploadFailed') }}</p>
        <div class="inquiry-submit">
          <p v-if="config.form.showPrivacy">{{ contactText(config.form.privacyText, locale) }}</p>
          <el-button type="primary" native-type="submit" class="hc-btn solid" :loading="submitting" :disabled="inProgress || hasFailed" @click.stop>{{ contactText(config.form.buttonText, locale) }}<i aria-hidden="true">→</i></el-button>
        </div>
      </el-form>
    </template>
    <el-alert v-else :title="contactText(config.form.closedText, locale)" type="info" :closable="false" show-icon />
  </div>
</template>

<style scoped>
.inquiry-form { min-width: 0; }
.inquiry-form-title { display: block; margin-bottom: 24px; }
.inquiry-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
.inquiry-form :deep(.el-form-item__label) { color: #dce6ef; font-size: 13px; line-height: 1.6; margin-bottom: 8px; }
.inquiry-form :deep(.el-select) { width: 100%; }
.inquiry-form :deep(.el-input__wrapper), .inquiry-form :deep(.el-select__wrapper), .inquiry-form :deep(.el-textarea__inner) { background: #112a3a; box-shadow: 0 0 0 1px #476276 inset; color: #f3f7fb; }
.inquiry-form :deep(.el-input__inner), .inquiry-form :deep(.el-select__selected-item) { color: #f3f7fb; }
.inquiry-form :deep(.el-input__inner::placeholder), .inquiry-form :deep(.el-textarea__inner::placeholder), .inquiry-form :deep(.el-select__placeholder) { color: #aebfce; }
.inquiry-form :deep(.el-input__count) { background: #112a3a; color: #bdccda; }
.inquiry-form :deep(.el-form-item__error) { color: #ffb2a9; }
.inquiry-upload { width: 100%; }
.inquiry-upload :deep(.el-upload), .inquiry-upload :deep(.el-upload-dragger) { width: 100%; }
.inquiry-upload :deep(.el-upload-dragger) { background: #112a3a; border-color: #68869c; padding: 22px 12px; color: #edf4fa; line-height: 1.8; }
.inquiry-upload-icon { font-size: 28px; color: #93c7f7; }
.inquiry-upload-tip, .inquiry-upload-status { color: #bdccda; font-size: 12px; line-height: 1.7; margin: 8px 0 0; }
.inquiry-upload :deep(.el-upload-list__item-name), .inquiry-upload :deep(.el-upload-list__item .el-icon--close) { color: #dce6ef; }
.inquiry-upload :deep(.el-upload-list__item:hover) { background: #1d394c; }
.inquiry-submit { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.inquiry-submit p { font-size: 12px; color: #bdccda; line-height: 1.7; flex: 1; }
.inquiry-submit .hc-btn { min-height: 42px; height: auto; white-space: normal; }
@media (max-width: 560px) { .inquiry-fields { grid-template-columns: 1fr; } .inquiry-submit { align-items: stretch; flex-direction: column; } }
</style>
