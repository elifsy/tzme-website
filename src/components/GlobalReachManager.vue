<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import AdminEditorPanel from './AdminEditorPanel.vue'
import WorldReachMap from './WorldReachMap.vue'
import { createGlobalReachSettings, globalReachText, isGlobalReachUrl, MAX_GLOBAL_POINTS } from '../data/globalReach.js'
import { useSiteContent } from '../services/website.js'
import { localeMessages } from '../i18n/locales/index.js'
import { loadGlobalReach, saveGlobalReach, useGlobalReach } from '../services/globalReach.js'
import '../style/admin-editor.css'

const { t, locale } = useI18n({ useScope: 'global' })
const { globalReach } = useGlobalReach()
const { siteContent } = useSiteContent()
const form = ref(createGlobalReachSettings(globalReach.value))
const editingLocale = ref(locale.value === 'zh' ? 'zh' : 'en')
const languages = [{ code: 'en', label: 'admin.english' }, { code: 'zh', label: 'admin.chinese' }]
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const connected = ref(false)
const needsApiUpdate = ref(false)
const errors = ref([])
const selectedPointId = ref('')
const countrySearch = ref('')
const countrySelect = ref(null)
const mapEditor = ref(null)
watch(globalReach, (value) => {
  if (value && !connected.value && !loading.value) {
    form.value = createGlobalReachSettings(value)
    connected.value = true
  }
})
const selectedPoint = computed(() => form.value.mapPoints.find((point) => point.id === selectedPointId.value))
const countries = computed(() => siteContent.value?.mapCountries || [])
const countriesById = computed(() => new Map(countries.value.map((country) => [country.id, country])))
const countryOptions = computed(() => countries.value.filter((country) =>
  `${country.label.en} ${country.label.zh} ${country.code}`.toLowerCase().includes(countrySearch.value.trim().toLowerCase())))
const selectedCountries = computed({
  get: () => form.value.mapPoints.filter((point) => countriesById.value.has(point.id)).map((point) => point.id),
  set(ids) {
    const customPoints = form.value.mapPoints.filter((point) => !countriesById.value.has(point.id))
    if (customPoints.length + ids.length > MAX_GLOBAL_POINTS) { ElMessage.warning(t('admin.globalPointLimit', { max: MAX_GLOBAL_POINTS })); return }
    const previous = new Map(form.value.mapPoints.map((point) => [point.id, point]))
    form.value.mapPoints = [...customPoints, ...ids.map((id) => previous.get(id) || cloneMapPoint(countriesById.value.get(id)))]
    if (!form.value.mapPoints.some((point) => point.id === selectedPointId.value)) selectedPointId.value = ''
  },
})
const dirty = computed(() => JSON.stringify(form.value) !== JSON.stringify(globalReach.value))
const previewField = (name) => globalReachText(form.value[name], editingLocale.value)
const textFields = [
  { key: 'kicker', label: 'admin.globalKicker', max: 100 },
  { key: 'titleLine1', label: 'admin.globalTitleLine1', max: 120 },
  { key: 'titleLine2', label: 'admin.globalTitleLine2', max: 120, optional: true },
  { key: 'description', label: 'admin.globalDescription', max: 1000, multiline: true },
  { key: 'imageAlt', label: 'admin.globalImageAlt', max: 255 },
  { key: 'buttonText', label: 'admin.globalButtonText', max: 100 },
]
let uploadController
let loadVersion = 0
let disposed = false

async function load() {
  if (loading.value || saving.value || uploading.value) return
  const version = ++loadVersion
  loading.value = true
  try {
    const result = await loadGlobalReach()
    if (disposed || version !== loadVersion) return
    connected.value = result.connected
    needsApiUpdate.value = result.connected && !result.supportsPointMap
    if (result.settings) form.value = createGlobalReachSettings(result.settings)
    selectedPointId.value = ''
    errors.value = []
  } finally { if (!disposed && version === loadVersion) loading.value = false }
}
function validate() {
  const messages = []
  for (const language of languages) {
    for (const field of textFields) {
      if (field.optional || (field.key === 'buttonText' && !form.value.showButton)) continue
      if (!form.value[field.key][language.code].trim()) {
        messages.push(t('admin.globalRequiredField', { field: t(field.label), language: t(language.label) }))
      }
    }
    form.value.statistics.forEach((statistic, index) => {
      if (!statistic.label[language.code].trim()) {
        messages.push(t('admin.globalRequiredField', {
          field: t('admin.globalStatisticLabel', { number: index + 1 }), language: t(language.label),
        }))
      }
    })
  }
  form.value.statistics.forEach((statistic, index) => {
    if (!statistic.value.trim()) messages.push(t('admin.globalValueRequired', { number: index + 1 }))
  })
  for (const point of form.value.mapPoints) {
    for (const language of languages) {
      if (!point.label[language.code].trim()) {
        selectedPointId.value = point.id
        messages.push(t('admin.globalRequiredField', { field: t('admin.globalPointName'), language: t(language.label) }))
      }
    }
  }
  const urls = [['buttonLink', 'admin.globalButtonLink']]
  if (form.value.mapMode === 'image') urls.push(['image', 'admin.globalMapImage'])
  for (const [key, label] of urls) {
    if (!isGlobalReachUrl(form.value[key])) messages.push(t('admin.globalInvalidUrl', { field: t(label) }))
  }
  errors.value = messages
  return messages.length === 0
}
function cloneMapPoint(point) { return JSON.parse(JSON.stringify(point)) }
function addMapPoint(position) {
  if (loading.value || saving.value) return
  if (form.value.mapPoints.length >= MAX_GLOBAL_POINTS) { ElMessage.warning(t('admin.globalPointLimit', { max: MAX_GLOBAL_POINTS })); return }
  const number = form.value.mapPoints.length + 1
  const id = `point-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`
  const label = Object.fromEntries(languages.map(({ code }) => [code, localeMessages[code].admin.globalNewPointName.replace('{number}', number)]))
  form.value.mapPoints.push({ id, label, x: position.x, y: position.y })
  selectedPointId.value = id
  nextTick(() => mapEditor.value?.focusPoint(id))
}
function moveMapPoint(position) {
  if (loading.value || saving.value) return
  const point = form.value.mapPoints.find((item) => item.id === position.id)
  if (point) { point.x = Math.round(position.x * 1000) / 1000; point.y = Math.round(position.y * 1000) / 1000 }
}
function removeMapPoint(id) {
  if (loading.value || saving.value) return
  form.value.mapPoints = form.value.mapPoints.filter((point) => point.id !== id)
  if (selectedPointId.value === id) selectedPointId.value = ''
  countrySelect.value?.focus()
}
async function save() {
  if (!connected.value || saving.value || loading.value || uploading.value || !validate()) return
  if (needsApiUpdate.value) { ElMessage.error(t('admin.globalMapApiUpdate')); return }
  saving.value = true
  try {
    const saved = await saveGlobalReach(createGlobalReachSettings(form.value))
    if (disposed) return
    form.value = createGlobalReachSettings(saved)
    connected.value = true
    needsApiUpdate.value = false
    ElMessage.success(t('admin.globalSaved'))
  } catch {
    if (!disposed) ElMessage.error(t('admin.globalSaveFailed'))
  } finally { if (!disposed) saving.value = false }
}
function beforeUpload(file) {
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) {
    ElMessage.warning(t('admin.richImageLimit'))
    return false
  }
  return true
}
async function uploadImage({ file }) {
  uploading.value = true
  const controller = new AbortController()
  uploadController = controller
  try {
    const body = new FormData()
    body.append('file', file)
    const response = await fetch('/api/uploads/images', { method: 'POST', body, signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = await response.json()
    if (!isGlobalReachUrl(result.url)) throw new Error('Invalid image URL')
    if (!disposed && uploadController === controller) form.value.image = result.url
    return result
  } catch (error) {
    if (!disposed && error.name !== 'AbortError') ElMessage.error(t('admin.richImageUploadFailed'))
    throw error
  } finally { if (!disposed && uploadController === controller) uploading.value = false }
}
onBeforeUnmount(() => { disposed = true; uploadController?.abort(); loadVersion++ })
onMounted(load)
defineExpose({ load })
</script>

<template>
  <div v-loading="loading" class="global-manager">
    <el-alert v-if="!connected" :title="$t('admin.globalLoadFailed')" type="warning" show-icon :closable="false" />
    <el-alert v-else-if="needsApiUpdate" :title="$t('admin.globalMapApiUpdate')" type="warning" show-icon :closable="false" />
    <el-alert v-if="errors.length" type="error" show-icon :closable="false" :title="$t('admin.globalCheckFields')" role="alert">
      <ul class="global-errors"><li v-for="(message, index) in errors" :key="index">{{ message }}</li></ul>
    </el-alert>
    <el-form label-position="top" class="global-form" :disabled="!connected || loading || saving">
      <div class="global-editor-grid">
        <div class="global-editor-main">
        <AdminEditorPanel step="01" :title="$t('admin.globalCopy')" :description="$t('admin.globalCopyHint')">
          <el-tabs v-model="editingLocale">
            <el-tab-pane v-for="language in languages" :key="language.code" :name="language.code" :label="$t(language.label)">
              <el-form-item v-for="field in textFields" :key="field.key" :label="$t(field.label)"
                :required="!field.optional && (field.key !== 'buttonText' || form.showButton)">
                <el-input v-model="form[field.key][language.code]" :maxlength="field.max" show-word-limit
                  :type="field.multiline ? 'textarea' : 'text'" :rows="3" />
                <p v-if="field.key === 'imageAlt'" class="cms-field-hint">{{ $t('admin.globalImageAltHint') }}</p>
              </el-form-item>
              <el-form-item v-for="(statistic, index) in form.statistics" :key="index" required
                :label="$t('admin.globalStatisticLabel', { number: index + 1 })">
                <el-input v-model="statistic.label[language.code]" maxlength="100" show-word-limit />
              </el-form-item>
            </el-tab-pane>
          </el-tabs>
        </AdminEditorPanel>
        <AdminEditorPanel step="04" :title="$t('admin.globalDisplaySettings')" class="global-display-panel">
          <div class="global-display-switches">
            <el-form-item :label="$t('admin.globalEnabled')"><el-switch v-model="form.enabled" :aria-label="$t('admin.globalEnabled')" /></el-form-item>
            <el-form-item :label="$t('admin.globalShowButton')"><el-switch v-model="form.showButton" :aria-label="$t('admin.globalShowButton')" /></el-form-item>
          </div>
          <el-form-item :label="$t('admin.globalButtonLink')" class="global-display-link" required>
            <el-input v-model="form.buttonLink" maxlength="500" placeholder="/about" />
            <p class="cms-field-hint">{{ $t('admin.globalButtonLinkHint') }}</p>
          </el-form-item>
        </AdminEditorPanel>
        </div>
        <div class="global-editor-aside">
          <AdminEditorPanel step="02" :title="$t('admin.globalMapSettings')" :description="$t('admin.globalMapSettingsHint')">
            <el-form-item :label="$t('admin.globalMapMode')">
              <el-radio-group v-model="form.mapMode">
                <el-radio-button value="points">{{ $t('admin.globalPointMap') }}</el-radio-button>
                <el-radio-button value="image">{{ $t('admin.globalImageMap') }}</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <template v-if="form.mapMode === 'points'">
              <el-form-item :label="$t('admin.globalChooseCountries')">
                <el-select ref="countrySelect" v-model="selectedCountries" multiple filterable :filter-method="(value) => countrySearch = value"
                  collapse-tags collapse-tags-tooltip :max-collapse-tags="3" style="width:100%" :placeholder="$t('admin.globalCountryPlaceholder')"
                  @visible-change="countrySearch = ''">
                  <el-option v-for="country in countryOptions" :key="country.id" :value="country.id"
                    :label="globalReachText(country.label, editingLocale)" :disabled="!selectedCountries.includes(country.id) && form.mapPoints.length >= MAX_GLOBAL_POINTS">
                    <span>{{ globalReachText(country.label, editingLocale) }}</span><small class="global-country-code">{{ country.code }}</small>
                  </el-option>
                </el-select>
              </el-form-item>
              <div class="global-point-map-editor">
                <WorldReachMap ref="mapEditor" :points="form.mapPoints" :description="previewField('imageAlt')" :locale-code="editingLocale"
                  editable :disabled="loading || saving" :selected-id="selectedPointId" @add="addMapPoint"
                  @select="selectedPointId = $event" @move="moveMapPoint" @remove="removeMapPoint" />
              </div>
              <p class="cms-field-hint">{{ $t('admin.globalPointMapHint', { max: MAX_GLOBAL_POINTS }) }}</p>
              <el-button class="global-add-point" type="primary" plain :disabled="loading || saving || form.mapPoints.length >= MAX_GLOBAL_POINTS"
                @click="addMapPoint({ x: 50, y: 50 })"><el-icon><Plus /></el-icon>{{ $t('admin.globalAddPoint') }}</el-button>
              <div v-if="form.mapPoints.length" class="global-point-list">
                <el-tag v-for="point in form.mapPoints" :key="point.id" :closable="!loading && !saving"
                  :type="selectedPointId === point.id ? 'warning' : 'info'" @close="removeMapPoint(point.id)">
                  <button type="button" :disabled="loading || saving" @click="selectedPointId = point.id">{{ globalReachText(point.label, editingLocale) }}</button>
                </el-tag>
              </div>
              <div v-if="selectedPoint" class="global-point-edit">
                <h4>{{ $t('admin.globalPointDetails') }}</h4>
                <el-form-item v-for="language in languages" :key="language.code" required
                  :label="`${$t('admin.globalPointName')} · ${$t(language.label)}`">
                  <el-input v-model="selectedPoint.label[language.code]" maxlength="120" show-word-limit />
                </el-form-item>
                <p class="cms-field-hint">{{ $t('admin.globalPointMoveHint') }}</p>
                <el-button type="danger" plain @click="removeMapPoint(selectedPoint.id)">{{ $t('admin.globalRemovePoint') }}</el-button>
              </div>
            </template>
            <template v-else>
            <el-image :src="form.image" :alt="previewField('imageAlt')" fit="contain" class="global-map-preview">
              <template #error><span class="global-image-error">{{ $t('admin.editorImageError') }}</span></template>
            </el-image>
            <el-form-item :label="$t('admin.imagePath')" required>
              <el-input v-model="form.image" maxlength="500" :disabled="uploading" />
            </el-form-item>
            <el-upload accept="image/jpeg,image/png,image/gif,image/webp" :show-file-list="false"
              :before-upload="beforeUpload" :http-request="uploadImage" :disabled="uploading || saving || loading">
              <el-button :loading="uploading" :disabled="saving || loading"><el-icon v-if="!uploading"><Picture /></el-icon>{{ $t('admin.globalUploadMap') }}</el-button>
            </el-upload>
            <p class="cms-field-hint">{{ $t('admin.globalUploadHint') }}</p>
            </template>
          </AdminEditorPanel>
          <AdminEditorPanel step="03" :title="$t('admin.globalStatistics')" :description="$t('admin.globalStatisticsHint')">
            <div v-for="(statistic, index) in form.statistics" :key="index" class="global-statistic-fields">
              <h4>{{ $t('admin.globalStatistic', { number: index + 1 }) }}</h4>
              <div class="global-statistic-inputs">
                <el-form-item :label="$t('admin.globalStatisticValue')" required>
                  <el-input v-model="statistic.value" maxlength="24" />
                </el-form-item>
                <el-form-item :label="$t('admin.globalStatisticSuffix')">
                  <el-input v-model="statistic.suffix" maxlength="16" placeholder="+" />
                </el-form-item>
              </div>
            </div>
          </AdminEditorPanel>
        </div>
      </div>
      <div class="global-save-bar">
        <span>{{ $t(dirty ? 'admin.globalUnsaved' : 'admin.editorSaveNote') }}</span>
        <el-button type="primary" :loading="saving" :disabled="uploading || loading" @click="save">
          <el-icon v-if="!saving"><CircleCheckFilled /></el-icon>{{ $t('admin.saveContent') }}
        </el-button>
      </div>
    </el-form>
    <AdminEditorPanel :title="$t('admin.globalPreview')" :description="$t('admin.globalPreviewHint')">
      <el-alert v-if="!form.enabled" :title="$t('admin.globalHiddenPreview')" type="info" :closable="false" />
      <div class="design-site global-live-preview" :lang="editingLocale === 'zh' ? 'zh-CN' : 'en'">
        <div class="hc-page hc-global">
          <div>
            <span class="hc-kick">{{ previewField('kicker') }}</span>
            <h2 class="hc-h2">{{ previewField('titleLine1') }}<template v-if="previewField('titleLine2')"><br />{{ previewField('titleLine2') }}</template></h2>
            <p class="hc-p">{{ previewField('description') }}</p>
            <div class="hc-map">
              <WorldReachMap v-if="form.mapMode === 'points'" :points="form.mapPoints" :description="previewField('imageAlt')" :locale-code="editingLocale" />
              <el-image v-else :src="form.image" :alt="previewField('imageAlt')" fit="contain">
              <template #error><span class="global-image-error">{{ $t('admin.editorImageError') }}</span></template>
            </el-image></div>
          </div>
          <div class="hc-gstats">
            <div v-for="(statistic, index) in form.statistics" :key="index">
              <div class="hc-stat">{{ statistic.value }}<u v-if="statistic.suffix">{{ statistic.suffix }}</u></div>
              <div class="hc-stat-cap">{{ globalReachText(statistic.label, editingLocale) }}</div>
            </div>
            <div v-if="form.showButton"><el-button class="hc-btn ghost sm" disabled>{{ previewField('buttonText') }}<i aria-hidden="true">→</i></el-button></div>
          </div>
        </div>
      </div>
    </AdminEditorPanel>
  </div>
</template>

<style scoped>
.global-manager, .global-editor-main, .global-editor-aside { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.global-editor-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(300px, .8fr); gap: 20px; align-items: stretch; }
.global-editor-main > :last-child, .global-editor-aside > :last-child { flex: 1 0 auto; }
.global-display-switches { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.global-form :deep(.el-form-item) { margin-bottom: 20px; }
.global-form .global-display-link { margin-bottom: 0; }
.global-form :deep(.el-form-item__label) { color: #3a4d64; }
.global-manager :deep(.cms-panel-heading p), .global-manager .cms-field-hint { color: #5a6c82; }
.global-form .cms-field-hint { width: 100%; }
.global-map-preview { display: block; width: 100%; height: 180px; margin-bottom: 18px; background: #07151f; border: 1px solid #dce5ef; border-radius: 8px; }
.global-point-map-editor { padding: 14px; border: 1px solid #254153; border-radius: 8px; background: #07151f; }
.global-add-point { margin-top: 12px; }
.global-country-code { float: right; margin-left: 12px; color: #667c91; }
.global-point-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
.global-point-list button { padding: 0; border: 0; background: none; color: inherit; font: inherit; cursor: pointer; }
.global-point-list button:focus-visible { outline: 2px solid #397acb; outline-offset: 3px; }
.global-point-edit { margin-top: 18px; padding: 16px; border: 1px solid #dce5ef; border-radius: 8px; background: #f8fafc; }
.global-point-edit h4 { margin: 0 0 14px; color: #3a4d64; font-size: 13px; }
.global-point-edit .el-button { margin-top: 12px; }
.global-image-error { display: grid; place-items: center; min-height: 120px; padding: 16px; color: #c0d3e3; text-align: center; }
.global-statistic-fields + .global-statistic-fields { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e4eaf2; }
.global-statistic-fields h4 { margin: 0 0 12px; color: #3a4d64; font-size: 13px; }
.global-statistic-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.global-statistic-inputs :deep(.el-form-item) { margin-bottom: 0; }
.global-save-bar { position: sticky; bottom: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 20px; padding: 16px 20px; border: 1px solid #dce5ef; border-radius: 10px; background: #fff; box-shadow: 0 -4px 18px rgba(33, 52, 82, .06); }
.global-save-bar span { color: #53647b; font-size: 13px; }
.global-errors { padding-left: 18px; margin: 8px 0; }
.global-live-preview { margin-top: 16px; border-radius: 8px; overflow: hidden; }
.global-live-preview .hc-page { padding: 36px; }
.global-live-preview .hc-h2 { margin-top: 18px; color: #fff; overflow-wrap: anywhere; }
.global-live-preview .hc-p { margin-top: 20px; max-width: 520px; }
.global-live-preview .hc-map { margin-top: 34px; }
.global-live-preview .el-image { display: block; width: 100%; }
.global-live-preview .hc-stat, .global-live-preview .hc-stat-cap { overflow-wrap: anywhere; }
.global-live-preview .hc-gstats .hc-btn { max-width: 100%; min-height: 38px; height: auto; padding: 10px 17px; white-space: normal; text-align: left; }
.global-live-preview .hc-gstats .hc-btn :deep(> span) { min-width: 0; max-width: 100%; line-height: 1.4; }
.global-live-preview :deep(.el-button.is-disabled) { opacity: 1; color: #fff; }
@media (max-width: 1050px) {
  .global-editor-grid { grid-template-columns: 1fr; }
  .global-editor-main > :last-child, .global-editor-aside > :last-child { flex: none; }
}
@media (max-width: 700px) {
  .global-display-switches { grid-template-columns: 1fr; gap: 0; }
  .global-live-preview .hc-page { padding: 24px 18px; }
  .global-live-preview .hc-h2 { font-size: 28px; }
  .global-save-bar { padding: 14px; flex-wrap: wrap; }
}
</style>
