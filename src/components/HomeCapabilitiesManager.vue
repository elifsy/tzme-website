<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowUp, Delete, Plus } from '@element-plus/icons-vue'
import AdminEditorPanel from './AdminEditorPanel.vue'
import ImageUpload from './ImageUpload.vue'
import CapabilityIcon from './CapabilityIcon.vue'
import HomeCapabilitiesSection from './HomeCapabilitiesSection.vue'
import { availableLocales } from '../i18n/locales/index.js'
import { capabilitiesDraft, capabilityIconNames, capabilityText, MAX_CAPABILITY_STEPS, validCapabilityBackground, validCapabilityImage } from '../data/capabilities.js'
import { loadCapabilities, saveCapabilities } from '../services/capabilities.js'
import '../style/admin-editor.css'

const { t, locale } = useI18n({ useScope: 'global' })
const form = ref(null)
const original = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref(false)
const editingLocale = ref(locale.value)
const expandedStep = ref('')
const uploadIds = ref(new Set())
const uploading = computed(() => uploadIds.value.size > 0)
const dirty = computed(() => form.value && JSON.stringify(form.value) !== original.value)
const textFields = [
  { key: 'kicker', max: 100 }, { key: 'titleLine1', max: 120 },
  { key: 'titleLine2', max: 120, optional: true }, { key: 'description', max: 1000 },
]
let disposed = false

function setUploading(key, value) {
  const next = new Set(uploadIds.value)
  if (value) next.add(key)
  else next.delete(key)
  uploadIds.value = next
}
async function load() {
  if (loading.value || saving.value || uploading.value) return
  loading.value = true
  try {
    const value = await loadCapabilities()
    if (disposed) return
    error.value = !value
    if (value) {
      form.value = capabilitiesDraft(value, availableLocales.map(item => item.code))
      original.value = JSON.stringify(form.value)
      expandedStep.value = form.value.steps[0]?.id || ''
    }
  } finally { if (!disposed) loading.value = false }
}
function addStep() {
  if (saving.value || form.value.steps.length >= MAX_CAPABILITY_STEPS) return
  const id = crypto.randomUUID()
  form.value.steps.push({ id, label: Object.fromEntries(availableLocales.map(item => [item.code, ''])), enabled: false, iconMode: 'preset', iconName: 'general', icon: '' })
  expandedStep.value = id
}
function moveStep(index, direction) {
  const target = index + direction
  if (saving.value || target < 0 || target >= form.value.steps.length) return
  const items = [...form.value.steps]
  ;[items[index], items[target]] = [items[target], items[index]]
  form.value.steps = items
}
function removeStep(index) {
  if (saving.value) return
  const [removed] = form.value.steps.splice(index, 1)
  if (expandedStep.value === removed.id) expandedStep.value = form.value.steps[Math.min(index, form.value.steps.length - 1)]?.id || ''
}
function validate() {
  for (const { code, label } of availableLocales) {
    for (const field of textFields.filter(item => !item.optional)) {
      if (!form.value[field.key][code].trim()) return t('capabilitiesAdmin.required', { language: label, field: t('capabilitiesAdmin.fields.' + field.key) })
    }
    const index = form.value.steps.findIndex(step => step.enabled && !step.label[code].trim())
    if (index >= 0) {
      expandedStep.value = form.value.steps[index].id
      editingLocale.value = code
      return t('capabilitiesAdmin.required', { language: label, field: t('capabilitiesAdmin.stepTitle', { number: index + 1 }) + ' · ' + t('capabilitiesAdmin.stepName') })
    }
  }
  if (form.value.enabled && !form.value.steps.some(step => step.enabled)) return t('capabilitiesAdmin.atLeastOne')
  if (!validCapabilityBackground(form.value.image)) return t('capabilitiesAdmin.invalidImage')
  for (const [index, step] of form.value.steps.entries()) {
    if (step.enabled && step.iconMode === 'image' && !step.icon) {
      expandedStep.value = step.id
      return t('capabilitiesAdmin.iconRequired', { number: index + 1 })
    }
    if (!validCapabilityImage(step.icon)) return t('capabilitiesAdmin.invalidImage')
  }
  return ''
}
async function save() {
  if (!form.value || error.value || loading.value || saving.value || uploading.value) return
  const message = validate()
  if (message) { ElMessage.warning(message); return }
  saving.value = true
  try {
    const value = await saveCapabilities(form.value)
    if (disposed) return
    form.value = capabilitiesDraft(value, availableLocales.map(item => item.code))
    original.value = JSON.stringify(form.value)
    ElMessage.success(t('capabilitiesAdmin.saved'))
  } catch { if (!disposed) ElMessage.error(t('capabilitiesAdmin.saveFailed')) }
  finally { if (!disposed) saving.value = false }
}
onMounted(load)
onBeforeUnmount(() => { disposed = true })
defineExpose({ load })
</script>

<template>
  <div v-loading="loading" class="capabilities-manager">
    <el-alert v-if="error" type="error" show-icon :closable="false" :title="$t('capabilitiesAdmin.loadFailed')"><el-button @click="load">{{ $t('admin.retryDatabase') }}</el-button></el-alert>
    <el-form v-if="form" label-position="top" :disabled="saving || loading || error" @submit.prevent="save">
      <div class="capabilities-editor-layout">
        <div class="capabilities-editor-main">
          <AdminEditorPanel step="01" :title="$t('capabilitiesAdmin.textSettings')" :description="$t('capabilitiesAdmin.textHint')">
            <el-radio-group v-model="editingLocale" class="capabilities-language"><el-radio-button v-for="language in availableLocales" :key="language.code" :value="language.code">{{ language.label }}</el-radio-button></el-radio-group>
            <el-form-item v-for="field in textFields" :key="field.key" :label="$t('capabilitiesAdmin.fields.' + field.key)" :required="!field.optional">
              <el-input v-model="form[field.key][editingLocale]" :type="field.key === 'description' ? 'textarea' : 'text'" :rows="3" :maxlength="field.max" show-word-limit />
            </el-form-item>
          </AdminEditorPanel>
          <AdminEditorPanel step="02" :title="$t('capabilitiesAdmin.steps')" :description="$t('capabilitiesAdmin.stepsHint', { max: MAX_CAPABILITY_STEPS })">
            <el-collapse v-model="expandedStep" accordion class="capabilities-step-list">
              <el-collapse-item v-for="(step, index) in form.steps" :key="step.id" :name="step.id">
                <template #title><span class="capabilities-step-heading"><CapabilityIcon :icon-mode="step.iconMode" :icon-name="step.iconName" :icon="step.icon" /><strong>{{ String(index + 1).padStart(2, '0') }} · {{ capabilityText(step.label, editingLocale) || $t('capabilitiesAdmin.stepTitle', { number: index + 1 }) }}</strong><el-tag size="small" :type="step.enabled ? 'success' : 'info'">{{ $t(step.enabled ? 'capabilitiesAdmin.visible' : 'capabilitiesAdmin.hidden') }}</el-tag></span></template>
                <div class="capabilities-step-toolbar">
                  <el-switch v-model="step.enabled" :active-text="$t('capabilitiesAdmin.stepVisible')" :aria-label="$t('capabilitiesAdmin.stepVisible')" />
                  <div class="capabilities-step-actions">
                    <el-tooltip :content="$t('capabilitiesAdmin.moveUp')" placement="top"><span><el-button link :icon="ArrowUp" :disabled="saving || index === 0" :aria-label="$t('capabilitiesAdmin.moveUp')" @click="moveStep(index, -1)" /></span></el-tooltip>
                    <el-tooltip :content="$t('capabilitiesAdmin.moveDown')" placement="top"><span><el-button link :icon="ArrowDown" :disabled="saving || index === form.steps.length - 1" :aria-label="$t('capabilitiesAdmin.moveDown')" @click="moveStep(index, 1)" /></span></el-tooltip>
                    <el-tooltip :content="$t('capabilitiesAdmin.deleteStep')" placement="top"><el-button link type="danger" :icon="Delete" :disabled="saving" :aria-label="$t('capabilitiesAdmin.deleteStep')" @click="removeStep(index)" /></el-tooltip>
                  </div>
                </div>
                <el-form-item :label="$t('capabilitiesAdmin.stepName')" :required="step.enabled"><el-input v-model="step.label[editingLocale]" maxlength="100" show-word-limit /></el-form-item>
                <el-form-item :label="$t('capabilitiesAdmin.iconMode')"><el-radio-group v-model="step.iconMode"><el-radio-button value="preset">{{ $t('capabilitiesAdmin.preset') }}</el-radio-button><el-radio-button value="image">{{ $t('capabilitiesAdmin.uploaded') }}</el-radio-button></el-radio-group></el-form-item>
                <el-form-item v-if="step.iconMode === 'preset'" :label="$t('capabilitiesAdmin.iconName')"><el-select v-model="step.iconName"><el-option v-for="name in capabilityIconNames" :key="name" :value="name" :label="$t('capabilitiesAdmin.icons.' + name)"><div class="capabilities-icon-option"><CapabilityIcon :icon-name="name" /><span>{{ $t('capabilitiesAdmin.icons.' + name) }}</span></div></el-option></el-select></el-form-item>
                <el-form-item v-else :label="$t('capabilitiesAdmin.stepIcon')" :required="step.enabled"><ImageUpload v-model="step.icon" kind="capabilityIcon" :active="expandedStep === step.id" :context-key="step.id" :disabled="saving" :alt="capabilityText(step.label, editingLocale)" @uploading="setUploading('step:' + step.id, $event)" /></el-form-item>
              </el-collapse-item>
            </el-collapse>
            <el-button type="primary" plain :icon="Plus" :disabled="saving || form.steps.length >= MAX_CAPABILITY_STEPS" @click="addStep">{{ $t('capabilitiesAdmin.addStep') }} ({{ form.steps.length }}/{{ MAX_CAPABILITY_STEPS }})</el-button>
          </AdminEditorPanel>
          <AdminEditorPanel step="03" :title="$t('capabilitiesAdmin.displaySettings')">
            <el-form-item :label="$t('capabilitiesAdmin.enabled')"><el-switch v-model="form.enabled" /></el-form-item>
            <el-form-item :label="$t('capabilitiesAdmin.image')"><ImageUpload v-model="form.image" kind="capabilityBackground" :disabled="saving" @uploading="setUploading('background', $event)" /></el-form-item>
            <el-form-item :label="$t('capabilitiesAdmin.fields.imageAlt')"><el-input v-model="form.imageAlt[editingLocale]" maxlength="255" show-word-limit /></el-form-item>
          </AdminEditorPanel>
        </div>
        <aside class="capabilities-editor-preview">
          <AdminEditorPanel :title="$t('capabilitiesAdmin.preview')" :description="$t('capabilitiesAdmin.previewHint')">
            <el-alert v-if="!form.enabled" type="info" :closable="false" :title="$t('capabilitiesAdmin.hiddenPreview')" class="capabilities-preview-alert" />
            <div class="capabilities-preview-scroll" tabindex="0" :aria-label="$t('capabilitiesAdmin.preview')"><HomeCapabilitiesSection :configuration="form" :locale-code="editingLocale" preview /></div>
          </AdminEditorPanel>
        </aside>
      </div>
      <div class="capabilities-save-bar"><span>{{ $t(uploading ? 'capabilitiesAdmin.uploading' : dirty ? 'capabilitiesAdmin.unsaved' : 'capabilitiesAdmin.saveNote') }}</span><el-button type="primary" :loading="saving" :disabled="uploading || loading || error" @click="save"><el-icon><CircleCheckFilled /></el-icon>{{ $t('admin.saveContent') }}</el-button></div>
    </el-form>
  </div>
</template>

<style scoped>
.capabilities-editor-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
.capabilities-editor-main { display: grid; gap: 20px; min-width: 0; }
.capabilities-editor-preview { position: sticky; top: 24px; min-width: 0; }
.capabilities-language { margin-bottom: 24px; }
.capabilities-manager :deep(.el-select) { width: 100%; }
.capabilities-step-list { margin-bottom: 20px; }
.capabilities-step-heading { display: flex; align-items: center; gap: 10px; min-width: 0; padding-right: 10px; }
.capabilities-step-heading strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #294b68; }
.capabilities-step-heading .el-tag { flex-shrink: 0; }
.capabilities-step-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 12px 0 20px; }
.capabilities-step-actions, .capabilities-icon-option { display: flex; align-items: center; gap: 12px; }
.capabilities-step-actions .el-button { margin-left: 0; }
.capabilities-step-actions > span { display: inline-flex; }
.capabilities-preview-scroll { max-height: max(260px, calc(100dvh - 220px)); overflow-y: auto; scrollbar-gutter: stable; border-radius: 10px; }
.capabilities-preview-scroll:focus-visible { outline: 2px solid #2375bf; outline-offset: 2px; }
.capabilities-preview-alert { margin-bottom: 16px; }
.capabilities-save-bar { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 20px; padding: 16px 20px; border: 1px solid #dce5ef; border-radius: 10px; background: #fff; font-size: 13px; color: #4d637c; }
@media (max-width: 1100px) { .capabilities-editor-layout { grid-template-columns: minmax(0, 1fr) 300px; } }
@media (max-width: 900px) { .capabilities-editor-layout { grid-template-columns: 1fr; } .capabilities-editor-preview { position: static; } .capabilities-preview-scroll { max-height: none; } }
</style>
