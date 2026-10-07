<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowUp, CircleCheckFilled } from '@element-plus/icons-vue'
import AdminEditorPanel from './AdminEditorPanel.vue'
import ImageUpload from './ImageUpload.vue'
import AboutTzmeContent from './AboutTzmeContent.vue'
import { availableLocales } from '../i18n/locales/index.js'
import { ABOUT_ENTRY_COUNT, aboutSettingsDraft, aboutText, validAboutImage } from '../data/aboutTzme.js'
import { loadAboutTzme, saveAboutTzme } from '../services/aboutTzme.js'
import '../style/admin-editor.css'

const { t, locale } = useI18n({ useScope: 'global' })
const form = ref(null)
const original = ref('')
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const error = ref(false)
const editingPage = ref('home')
const editingLocale = ref(locale.value)
const expandedEntry = ref(0)
const section = computed(() => form.value?.[editingPage.value])
const dirty = computed(() => form.value && JSON.stringify(form.value) !== original.value)
const textFields = [
  { key: 'kicker', max: 100 }, { key: 'titleLine1', max: 120 },
  { key: 'titleLine2', max: 120, optional: true }, { key: 'description', max: 2000, multiline: true },
  { key: 'description2', max: 2000, multiline: true, optional: true },
]
let disposed = false

async function load() {
  if (loading.value || saving.value || uploading.value) return
  loading.value = true
  try {
    const value = await loadAboutTzme()
    if (disposed) return
    error.value = !value
    form.value = value ? aboutSettingsDraft(value, availableLocales.map(item => item.code)) : null
    original.value = JSON.stringify(form.value)
  } finally { if (!disposed) loading.value = false }
}
function moveEntry(index, direction) {
  const target = index + direction
  if (saving.value || target < 0 || target >= ABOUT_ENTRY_COUNT) return
  const entries = [...section.value.entries]
  ;[entries[index], entries[target]] = [entries[target], entries[index]]
  section.value.entries = entries
  expandedEntry.value = target
}
function validate() {
  for (const [pageKey, value] of Object.entries(form.value)) {
    if (value.entries.length !== ABOUT_ENTRY_COUNT) return t('aboutTzmeAdmin.invalidEntries')
    if (!validAboutImage(value.image)) return t('aboutTzmeAdmin.invalidImage')
    for (const { code, label } of availableLocales) {
      const required = field => {
        editingPage.value = pageKey
        editingLocale.value = code
        return t('aboutTzmeAdmin.required', { page: t('aboutTzmeAdmin.' + pageKey + 'Tab'), language: label, field })
      }
      for (const field of textFields.filter(item => !item.optional)) {
        if (!value[field.key][code].trim()) return required(t('aboutTzmeAdmin.fields.' + field.key))
      }
      for (const [index, entry] of value.entries.entries()) {
        for (const field of ['value', 'label']) {
          if (!entry[field][code].trim()) {
            expandedEntry.value = index
            return required(t('aboutTzmeAdmin.entryTitle', { number: index + 1 }) + ' · ' + t(field === 'value' ? 'aboutTzmeAdmin.entryValue' : 'aboutTzmeAdmin.entryLabel'))
          }
        }
      }
    }
  }
  return ''
}
async function save() {
  if (!form.value || error.value || loading.value || saving.value || uploading.value) return
  const message = validate()
  if (message) { ElMessage.warning(message); return }
  saving.value = true
  try {
    const value = await saveAboutTzme(form.value)
    if (disposed) return
    form.value = aboutSettingsDraft(value, availableLocales.map(item => item.code))
    original.value = JSON.stringify(form.value)
    ElMessage.success(t('aboutTzmeAdmin.saved'))
  } catch { if (!disposed) ElMessage.error(t('aboutTzmeAdmin.saveFailed')) }
  finally { if (!disposed) saving.value = false }
}
onMounted(load)
onBeforeUnmount(() => { disposed = true })
defineExpose({ load })
</script>

<template>
  <div v-loading="loading" class="about-settings-manager">
    <el-alert v-if="error" type="error" show-icon :closable="false" :title="$t('aboutTzmeAdmin.loadFailed')"><el-button @click="load">{{ $t('admin.retryDatabase') }}</el-button></el-alert>
    <template v-if="form">
      <el-tabs v-model="editingPage" :before-leave="() => !saving && !uploading" class="about-settings-tabs">
        <el-tab-pane :label="$t('aboutTzmeAdmin.homeTab')" name="home" />
        <el-tab-pane :label="$t('aboutTzmeAdmin.aboutTab')" name="about" />
      </el-tabs>
      <el-form label-position="top" :disabled="saving || loading || error" @submit.prevent="save">
        <div class="about-settings-layout">
          <div class="about-settings-main">
            <AdminEditorPanel step="01" :title="$t('aboutTzmeAdmin.textSettings')" :description="$t('aboutTzmeAdmin.textHint')">
              <el-radio-group v-model="editingLocale" class="about-settings-language">
                <el-radio-button v-for="language in availableLocales" :key="language.code" :value="language.code">{{ language.label }}</el-radio-button>
              </el-radio-group>
              <el-form-item v-for="field in textFields" :key="field.key" :label="$t('aboutTzmeAdmin.fields.' + field.key)" :required="!field.optional">
                <el-input v-model="section[field.key][editingLocale]" :type="field.multiline ? 'textarea' : 'text'" :rows="3" :maxlength="field.max" show-word-limit />
              </el-form-item>
            </AdminEditorPanel>
            <AdminEditorPanel step="02" :title="$t('aboutTzmeAdmin.entries')" :description="$t('aboutTzmeAdmin.entriesHint')">
              <el-collapse v-model="expandedEntry" accordion>
                <el-collapse-item v-for="(entry, index) in section.entries" :key="index" :name="index">
                  <template #title><span class="about-entry-heading"><b>{{ String(index + 1).padStart(2, '0') }}</b><strong>{{ aboutText(entry.label, editingLocale) || $t('aboutTzmeAdmin.entryTitle', { number: index + 1 }) }}</strong></span></template>
                  <div class="about-entry-toolbar">
                    <span>{{ $t('aboutTzmeAdmin.entryTitle', { number: index + 1 }) }}</span>
                    <div>
                      <el-tooltip :content="$t('aboutTzmeAdmin.moveUp')" placement="top"><span><el-button link :icon="ArrowUp" :disabled="saving || index === 0" :aria-label="$t('aboutTzmeAdmin.moveUp')" @click="moveEntry(index, -1)" /></span></el-tooltip>
                      <el-tooltip :content="$t('aboutTzmeAdmin.moveDown')" placement="top"><span><el-button link :icon="ArrowDown" :disabled="saving || index === ABOUT_ENTRY_COUNT - 1" :aria-label="$t('aboutTzmeAdmin.moveDown')" @click="moveEntry(index, 1)" /></span></el-tooltip>
                    </div>
                  </div>
                  <div class="cms-field-grid">
                    <el-form-item :label="$t('aboutTzmeAdmin.entryValue')" required><el-input v-model="entry.value[editingLocale]" maxlength="60" show-word-limit /></el-form-item>
                    <el-form-item :label="$t('aboutTzmeAdmin.entrySuffix')"><el-input v-model="entry.suffix[editingLocale]" maxlength="20" show-word-limit /></el-form-item>
                  </div>
                  <el-form-item :label="$t('aboutTzmeAdmin.entryLabel')" required><el-input v-model="entry.label[editingLocale]" maxlength="100" show-word-limit /></el-form-item>
                </el-collapse-item>
              </el-collapse>
            </AdminEditorPanel>
            <AdminEditorPanel step="03" :title="$t('aboutTzmeAdmin.imageSettings')">
              <el-form-item :label="$t(editingPage === 'home' ? 'aboutTzmeAdmin.homeImage' : 'aboutTzmeAdmin.aboutImage')">
                <ImageUpload v-model="section.image" :kind="editingPage === 'home' ? 'aboutHome' : 'aboutIntro'" :context-key="editingPage" :disabled="saving"
                  :alt="aboutText(section.imageAlt, editingLocale)" @uploading="uploading = $event" />
              </el-form-item>
              <el-form-item :label="$t('aboutTzmeAdmin.fields.imageAlt')"><el-input v-model="section.imageAlt[editingLocale]" maxlength="255" show-word-limit /></el-form-item>
            </AdminEditorPanel>
          </div>
          <aside class="about-settings-preview">
            <AdminEditorPanel :title="$t('aboutTzmeAdmin.preview')" :description="$t('aboutTzmeAdmin.previewHint')">
              <div class="about-settings-preview-scroll" tabindex="0" :aria-label="$t('aboutTzmeAdmin.preview')">
                <div class="design-site about-preview-surface" :class="{ 'about-preview-background': editingPage === 'about' }">
                  <el-image v-if="section.image" :src="section.image" :alt="aboutText(section.imageAlt, editingLocale)" fit="cover" class="about-preview-image" />
                  <div class="about-preview-copy"><AboutTzmeContent :configuration="section" :locale-code="editingLocale" /></div>
                </div>
              </div>
            </AdminEditorPanel>
          </aside>
        </div>
        <div class="about-settings-save-bar">
          <span>{{ $t(uploading ? 'aboutTzmeAdmin.uploading' : dirty ? 'aboutTzmeAdmin.unsaved' : 'aboutTzmeAdmin.saveNote') }}</span>
          <el-button type="primary" :icon="CircleCheckFilled" :loading="saving" :disabled="uploading || loading || error" @click="save">{{ $t('admin.saveContent') }}</el-button>
        </div>
      </el-form>
    </template>
  </div>
</template>

<style scoped>
.about-settings-tabs { margin-bottom: 20px; }
.about-settings-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
.about-settings-main { display: grid; gap: 20px; min-width: 0; }
.about-settings-language { margin-bottom: 24px; }
.about-entry-heading { display: flex; align-items: center; gap: 12px; min-width: 0; padding-right: 12px; }
.about-entry-heading b { color: #2375bf; font-size: 12px; }
.about-entry-heading strong { overflow: hidden; color: #294b68; text-overflow: ellipsis; white-space: nowrap; }
.about-entry-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 12px 0 16px; color: #53647b; font-size: 12px; }
.about-entry-toolbar > div { display: flex; gap: 16px; }
.about-entry-toolbar > div > span { display: inline-flex; }
.about-entry-toolbar .el-button { margin: 0; }
.about-settings-preview { position: sticky; top: 24px; min-width: 0; }
.about-settings-preview-scroll { max-height: max(320px, calc(100dvh - 220px)); overflow-y: auto; border-radius: 6px; scrollbar-gutter: stable; }
.about-settings-preview-scroll:focus-visible { outline: 2px solid #2375bf; outline-offset: 2px; }
.about-preview-surface { position: relative; min-height: 0; overflow: hidden; background: #06131c; color: var(--txt); font-family: var(--f-ui); }
.about-preview-image.el-image { display: block; width: 100%; height: 180px; }
.about-preview-copy { position: relative; z-index: 1; padding: 24px 20px; }
.about-preview-background .about-preview-image { position: absolute; inset: 0; width: 100%; height: 100%; opacity: .3; }
.about-preview-copy :deep(.hc-h2) { font-size: 26px; line-height: 1.25; }
.about-preview-copy :deep(.about-tzme-description) { color: #e1eaf2; font-size: 13px; line-height: 1.8; }
.about-preview-copy :deep(.about-tzme-entries) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 0; margin-top: 28px; }
.about-preview-copy :deep(.about-tzme-entries > div:nth-child(2n)) { padding-right: 0; border-right: 0; }
.about-preview-copy :deep(.about-tzme-entries > div:nth-child(2n + 1)) { padding-left: 0; }
.about-preview-copy :deep(.hc-stat) { font-size: 22px; }
.about-settings-save-bar { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 20px; padding: 16px 20px; border: 1px solid #dce5ef; border-radius: 10px; background: #fff; color: #4d637c; font-size: 13px; }
@media (max-width: 1100px) { .about-settings-layout { grid-template-columns: minmax(0, 1fr) 300px; } }
@media (max-width: 900px) { .about-settings-layout { grid-template-columns: minmax(0, 1fr); } .about-settings-preview { position: static; } .about-settings-preview-scroll { max-height: 600px; } }
@media (max-width: 600px) { .about-settings-save-bar { align-items: flex-start; flex-direction: column; gap: 12px; } }
</style>
