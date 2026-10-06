<script setup>
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminEditorDialog from './AdminEditorDialog.vue'
import AdminEditorPanel from './AdminEditorPanel.vue'
import ImageUpload from './ImageUpload.vue'
import ProjectCard from './ProjectCard.vue'
import { localizedField } from '../services/catalog.js'
import {
  MAX_HOME_PROJECTS, normalizeProject, projectPath, useProjectCatalog,
} from '../services/projects.js'
import { apiRequest } from '../services/api.js'
import { sanitizeRichText } from '../utils/richText.js'
import { i18n } from '../i18n/index.js'

const RichTextEditor = defineAsyncComponent(() => import('./RichTextEditor.vue'))
const { t, locale } = useI18n({ useScope: 'global' })
const { projects, loadProjects } = useProjectCatalog()
const loading = ref(false)
const saving = ref(false)
const busyId = ref('')
const dialogOpen = ref(false)
const editingLocale = ref('en')
const bodyUploading = ref(false)
const coverUploading = ref(false)
const editorFullscreen = ref(false)
const languages = [{ code: 'en', suffix: 'En', label: 'admin.english' }, { code: 'zh', suffix: 'Zh', label: 'admin.chinese' }]
const metricNames = ['capacity', 'technology', 'scope']
const form = reactive(normalizeProject({}))
const publishedCount = computed(() => projects.value.filter((item) => item.status === 'published').length)
const selectedHomeCount = computed(() => projects.value.filter((item) => item.showOnHome).length)
const otherHomeCount = computed(() => projects.value.filter((item) => item.showOnHome && item.id !== form.id).length)
const formHomeCount = computed(() => otherHomeCount.value + Number(form.showOnHome))
const field = (item, name) => localizedField(item, name, locale.value)

async function load() {
  loading.value = true
  try { await loadProjects() } finally { loading.value = false }
}
function openEditor(item = null) {
  coverUploading.value = false
  editingLocale.value = locale.value === 'zh' ? 'zh' : 'en'
  bodyUploading.value = false
  editorFullscreen.value = false
  Object.assign(form, normalizeProject(item || {
    status: 'draft', sortOrder: (projects.value.length + 1) * 10, homeOrder: (projects.value.length + 1) * 10,
    ...Object.fromEntries(metricNames.flatMap((name) => ['en', 'zh'].map((code) => [
      name + 'Label' + (code === 'zh' ? 'Zh' : 'En'), i18n.global.getLocaleMessage(code).site[name],
    ]))),
  }), { id: item?.id || '' })
  dialogOpen.value = true
}
async function writeToApi(record, update) {
  return apiRequest('/api/projects' + (update ? '/' + encodeURIComponent(record.id) : ''), { method: update ? 'PUT' : 'POST', body: record });
}
async function persist(record, update) {
  if (record.showOnHome && projects.value.filter((item) => item.showOnHome && item.id !== record.id).length >= MAX_HOME_PROJECTS) {
    ElMessage.warning(t('admin.projectHomeLimit', { max: MAX_HOME_PROJECTS }))
    return false
  }
  try {
    await writeToApi(record, update);
    await loadProjects();
    ElMessage.success(t('admin.contentSaved'));
  } catch { ElMessage.error(t('admin.apiWriteFailed')); return false; }
  return true
}
async function save() {
  if (saving.value || bodyUploading.value || coverUploading.value) return
  if (!form.titleEn.trim() || !form.titleZh.trim()) {
    ElMessage.warning(t('admin.bothTitlesRequired'))
    return
  }
  saving.value = true
  try {
    const record = {
      ...normalizeProject(form), id: form.id || `project-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`,
      titleEn: form.titleEn.trim(), titleZh: form.titleZh.trim(),
      contentEn: sanitizeRichText(form.contentEn), contentZh: sanitizeRichText(form.contentZh),
    }
    if (await persist(record, Boolean(form.id))) dialogOpen.value = false
  } finally { saving.value = false }
}
async function toggle(item) {
  busyId.value = item.id
  try { await persist({ ...item, status: item.status === 'published' ? 'draft' : 'published' }, true) }
  finally { busyId.value = '' }
}
async function remove(item) {
  try {
    await ElMessageBox.confirm(t('admin.deleteConfirm', { title: field(item, 'title') }), t('admin.projectDeleteTitle'), {
      confirmButtonText: t('admin.delete'), cancelButtonText: t('admin.cancel'), type: 'warning',
    })
  } catch { return }
  busyId.value = item.id
  try {
    await apiRequest('/api/projects/' + encodeURIComponent(item.id), { method: 'DELETE' });
    await loadProjects();
    ElMessage.success(t('admin.contentDeleted'));
  } catch { ElMessage.error(t('admin.apiWriteFailed')); }
  finally { busyId.value = '' }
}
defineExpose({ load, openEditor })
onMounted(load)
</script>

<template>
  <el-card shadow="never" class="table-card project-manager">
    <template #header><div class="card-heading">
      <div><strong>{{ $t('admin.projects') }}</strong><small>{{ $t('admin.projectManagerCounts', { published: publishedCount, total: projects.length, home: selectedHomeCount, max: MAX_HOME_PROJECTS }) }}</small></div>
      <el-button type="primary" @click="openEditor()"><el-icon><Plus /></el-icon>{{ $t('admin.projectAdd') }}</el-button>
    </div></template>
    <el-table :data="projects" v-loading="loading" row-key="id" :empty-text="$t('admin.projectEmpty')">
      <el-table-column :label="$t('admin.projectTitle')" min-width="260">
        <template #default="{ row }"><div class="project-name-cell">
          <el-image v-if="row.image" :src="row.image" fit="cover" class="project-thumbnail" />
          <span v-else class="project-thumbnail project-thumbnail-empty"><el-icon><Picture /></el-icon></span>
          <span><strong>{{ field(row, 'title') }}</strong><small>{{ field(row, 'summary') }}</small></span>
        </div></template>
      </el-table-column>
      <el-table-column :label="$t('admin.projectTags')" min-width="165"><template #default="{ row }">
        <div class="project-table-tags"><el-tag v-if="field(row, 'industry')" size="small" effect="plain">{{ field(row, 'industry') }}</el-tag>
          <el-tag v-if="field(row, 'location')" size="small" effect="plain">{{ field(row, 'location') }}</el-tag></div>
      </template></el-table-column>
      <el-table-column :label="$t('site.capacity')" min-width="115"><template #default="{ row }">{{ field(row, 'capacity') || '—' }}</template></el-table-column>
      <el-table-column :label="$t('admin.projectHomepage')" width="115"><template #default="{ row }">
        <el-tag v-if="row.showOnHome" :type="row.status === 'published' ? 'primary' : 'info'" size="small">
          {{ $t(row.status === 'published' ? 'admin.projectHomeSelected' : 'admin.projectHomeDraft') }}
        </el-tag><span v-else>—</span>
      </template></el-table-column>
      <el-table-column prop="sortOrder" :label="$t('admin.projectSortOrder')" width="90" />
      <el-table-column :label="$t('admin.status')" width="100"><template #default="{ row }">
        <el-tag :type="row.status === 'published' ? 'success' : 'warning'" size="small">{{ $t(row.status === 'published' ? 'admin.published' : 'admin.draft') }}</el-tag>
      </template></el-table-column>
      <el-table-column :label="$t('admin.actions')" width="210" align="right" fixed="right"><template #default="{ row }">
        <el-button link type="primary" :disabled="Boolean(busyId)" @click="openEditor(row)">{{ $t('admin.edit') }}</el-button>
        <router-link v-if="row.status === 'published'" :to="projectPath(row.id)" target="_blank" class="project-preview-link">{{ $t('admin.projectView') }}</router-link>
        <el-button link :type="row.status === 'published' ? 'warning' : 'success'" :disabled="Boolean(busyId)" @click="toggle(row)">{{ $t(row.status === 'published' ? 'admin.unpublish' : 'admin.publish') }}</el-button>
        <el-button link type="danger" :disabled="Boolean(busyId)" @click="remove(row)">{{ $t('admin.delete') }}</el-button>
      </template></el-table-column>
    </el-table>
  </el-card>

  <AdminEditorDialog v-model="dialogOpen" :title="$t(form.id ? 'admin.projectEdit' : 'admin.projectAdd')"
    :description="$t('admin.projectEditorDescription')" icon="DataBoard" width="min(1280px, calc(100vw - 40px))"
    :status="form.status" :saving="saving" :save-disabled="bodyUploading || coverUploading" :editor-fullscreen="editorFullscreen" @save="save">
    <el-form :model="form" label-position="top" @submit.prevent="save">
      <div class="cms-editor-layout">
        <div class="cms-editor-main">
          <AdminEditorPanel step="01" :title="$t('admin.projectCardContent')" :description="$t('admin.projectCardContentHint')">
            <el-tabs v-model="editingLocale">
              <el-tab-pane v-for="language in languages" :key="language.code" :label="$t(language.label)" :name="language.code">
                <el-form-item :label="$t('admin.projectTitle')" required>
                  <el-input v-model="form['title' + language.suffix]" maxlength="255" show-word-limit />
                </el-form-item>
                <div class="cms-field-grid">
                  <el-form-item :label="$t('admin.projectIndustryTag')"><el-input v-model="form['industry' + language.suffix]" maxlength="255" /></el-form-item>
                  <el-form-item :label="$t('admin.projectLocationTag')"><el-input v-model="form['location' + language.suffix]" maxlength="255" /></el-form-item>
                </div>
                <div v-for="metric in metricNames" :key="metric" class="project-metric-fields">
                  <h4>{{ $t('admin.projectMetric_' + metric) }}</h4>
                  <div class="cms-field-grid">
                    <el-form-item :label="$t('admin.projectMetricLabel')"><el-input v-model="form[metric + 'Label' + language.suffix]" maxlength="255" /></el-form-item>
                    <el-form-item :label="$t('admin.projectMetricValue')"><el-input v-model="form[metric + language.suffix]" maxlength="255" /></el-form-item>
                  </div>
                </div>
                <el-form-item :label="$t('admin.projectImageAlt')"><el-input v-model="form['imageAlt' + language.suffix]" maxlength="255" /></el-form-item>
                <el-form-item :label="$t('admin.projectSummary')">
                  <el-input v-model="form['summary' + language.suffix]" type="textarea" :rows="3" maxlength="3000" show-word-limit />
                </el-form-item>
              </el-tab-pane>
            </el-tabs>
          </AdminEditorPanel>
          <AdminEditorPanel step="02" :title="$t('admin.projectDetailContent')" :description="$t('admin.projectDetailContentHint')">
            <template v-for="language in languages" :key="language.code">
              <RichTextEditor v-if="dialogOpen && editingLocale === language.code" v-model="form['content' + language.suffix]"
                :placeholder="$t('admin.projectBodyPlaceholder')" :show-toc-hint="false"
                @uploading="bodyUploading = $event" @fullscreen-change="editorFullscreen = $event" />
            </template>
          </AdminEditorPanel>
        </div>
        <aside class="cms-editor-aside">
          <AdminEditorPanel step="03" :title="$t('admin.editorDisplaySettings')" :description="$t('admin.editorDisplayDescription')">
            <el-form-item :label="$t('admin.editorDisplayImage')">
              <ImageUpload v-model="form.image" kind="project" :active="dialogOpen" :context-key="form.id"
                :disabled="saving" @uploading="coverUploading = $event" />
            </el-form-item>
            <el-form-item :label="$t('admin.status2')">
              <el-radio-group v-model="form.status" class="cms-status-options">
                <el-radio-button value="published">{{ $t('admin.published2') }}</el-radio-button>
                <el-radio-button value="draft">{{ $t('admin.draft2') }}</el-radio-button>
              </el-radio-group>
              <p class="cms-field-hint">{{ $t(form.status === 'published' ? 'admin.editorPublishedHint' : 'admin.editorDraftHint') }}</p>
            </el-form-item>
            <el-form-item :label="$t('admin.projectSortOrder')"><el-input-number v-model="form.sortOrder" :min="0" :max="9999" controls-position="right" /></el-form-item>
          </AdminEditorPanel>
          <AdminEditorPanel step="04" :title="$t('admin.editorHomepageSettings')" :description="$t('admin.projectHomeHint', { max: MAX_HOME_PROJECTS })">
            <div class="cms-switch-row"><span>{{ $t('admin.projectHomepage') }}</span>
              <el-switch v-model="form.showOnHome" :disabled="!form.showOnHome && otherHomeCount >= MAX_HOME_PROJECTS" />
            </div>
            <p class="cms-field-hint">{{ $t('admin.projectHomeCount', { count: formHomeCount, max: MAX_HOME_PROJECTS }) }}</p>
            <el-form-item v-if="form.showOnHome" :label="$t('admin.projectHomeOrder')"><el-input-number v-model="form.homeOrder" :min="0" :max="9999" controls-position="right" /></el-form-item>
          </AdminEditorPanel>
          <AdminEditorPanel :title="$t('admin.projectCardPreview')" :description="$t(editingLocale === 'zh' ? 'admin.chinese' : 'admin.english')">
            <div class="design-site project-card-preview"><div class="hc-proj"><ProjectCard :project="form" :locale-code="editingLocale" preview /></div></div>
          </AdminEditorPanel>
        </aside>
      </div>
    </el-form>
  </AdminEditorDialog>
</template>

<style scoped>
.project-name-cell { display: flex; align-items: center; gap: 12px; min-width: 0; }
.project-name-cell > span:last-child { min-width: 0; }
.project-name-cell strong, .project-name-cell small { display: block; }
.project-name-cell strong { color: #263544; font-size: 12px; }
.project-name-cell small { margin-top: 3px; overflow: hidden; color: #8995a1; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.project-thumbnail { width: 62px; height: 46px; flex: none; border-radius: 5px; }
.project-thumbnail-empty { display: grid; place-items: center; background: #eef3f8; color: #9baabd; font-size: 20px; }
.project-table-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.project-preview-link { color: var(--el-color-primary); margin: 0 9px; text-decoration: none; font-size: 12px; }
.project-metric-fields { border: 1px solid #e5ebf2; border-radius: 8px; padding: 14px 16px 0; margin-bottom: 18px; background: #fafcfe; }
.project-metric-fields h4 { margin: 0 0 12px; font-size: 12px; color: #607284; font-weight: 600; }
</style>
