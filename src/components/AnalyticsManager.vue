<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Download, InfoFilled, Refresh } from '@element-plus/icons-vue'
import AnalyticsTrend from './AnalyticsTrend.vue'
import { availableLocales } from '../i18n/locales/index.js'
import { localizedField, useProductCatalog } from '../services/catalog.js'
import { useArticleCatalog } from '../services/articles.js'
import { useProjectCatalog } from '../services/projects.js'
import { industryField, useIndustryCatalog } from '../services/industries.js'
import { useContactSettings } from '../services/contactSettings.js'
const { t, locale } = useI18n({ useScope: 'global' })
const { products } = useProductCatalog()
const { articles, newsCategories } = useArticleCatalog()
const { contactSettings } = useContactSettings()
const { projects, loadProjects } = useProjectCatalog()
const { industries, loadIndustries } = useIndustryCatalog()
const dayString = date => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
const today = () => dayString(new Date())
const calendarDay = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
function range(days) { const end = today(); const start = new Date(`${end}T00:00:00+08:00`); start.setUTCDate(start.getUTCDate() - days + 1); return [dayString(start), end] }
const dates = ref(range(30)), language = ref(''), selectedDevice = ref(''), tab = ref('overview'), trendMode = ref('chart')
const report = ref(null), records = ref([]), total = ref(0), currentPage = ref(1), eventName = ref('')
const loading = ref(false), recordsLoading = ref(false), error = ref(false), recordsError = ref(false)
const collecting = ref(false), configReady = ref(false), saving = ref(false), updated = ref('')
let reportAbort, recordsAbort, configAbort, disposed = false
const eventNames = ['page_view', 'page_engagement', 'navigation_click', 'cta_click', 'content_click', 'industry_filter', 'news_filter', 'social_click', 'contact_click', 'inquiry_start', 'inquiry_submit', 'inquiry_success', 'inquiry_error', 'language_change', 'pagination']
const shortcuts = computed(() => [7, 30, 90].map(days => ({ text: t(`analyticsAdmin.last${days}`), value: () => range(days).map(day => new Date(`${day}T00:00:00`)) })))
const summary = computed(() => report.value?.summary || {})
const integer = value => Number(value || 0).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US')
const duration = value => Number(value) < 60 ? t('analyticsAdmin.seconds', { value: integer(value) }) : t('analyticsAdmin.minutes', { value: (Number(value) / 60).toFixed(1) })
const metrics = computed(() => [
  ['pageViews', integer(summary.value.pageViews), 'pvHint'], ['visitors', integer(summary.value.visitors), 'uvHint'],
  ['sessions', integer(summary.value.sessions), 'sessionHint'], ['avgDuration', duration(summary.value.avgDuration || 0), 'durationHint'],
  ['bounceRate', `${summary.value.bounceRate || 0}%`, 'bounceHint'], ['formStarts', integer(summary.value.formStarts), 'startedHint'],
  ['inquiries', integer(summary.value.inquiries), 'inquiryHint'], ['conversionRate', `${summary.value.conversionRate || 0}%`, 'conversionHint']
])
const funnel = computed(() => [['visited', summary.value.sessions], ['started', summary.value.formStarts], ['submitted', summary.value.submittedSessions], ['converted', summary.value.convertedSessions]].map(([label, value]) => ({ label, value: Number(value || 0), rate: summary.value.sessions ? Math.round(Number(value || 0) / Number(summary.value.sessions) * 10000) / 100 : 0 })))
const groups = computed(() => ['sources', 'devices', 'languages'].map(key => ({ key, items: report.value?.[key] || [] })))
const eventLabel = name => t(`analyticsAdmin.eventNames.${name}`)
const languageLabel = code => availableLocales.find(item => item.code === code)?.label || code
const sourceLabel = name => name === 'direct' ? t('analyticsAdmin.direct') : name
function pageLabel(path, key) {
  const parts = path.split('/').filter(Boolean)
  const type = key || (path === '/' ? 'home' : parts.length > 1 ? ({ solutions: 'product_detail', projects: 'project_detail', insights: 'news_detail' }[parts[0]]) : parts[0])
  const collection = parts[0] === 'solutions' ? products.value : parts[0] === 'projects' ? projects.value : parts[0] === 'insights' ? articles.value : []
  let id = parts.at(-1)
  try { id = decodeURIComponent(id || '') } catch { /* Keep malformed historical paths readable. */ }
  const record = parts.length > 1 ? collection.find(item => item.id === id) : null
  return record ? localizedField(record, 'title', locale.value) : type ? t(`analyticsAdmin.pageNames.${type}`) : path
}
function targetLabel(item) {
  const target = item.target
  if (!target) return '—'
  if (target.startsWith('/')) return pageLabel(target)
  if (item.name === 'industry_filter') {
    return target === 'all' ? t('analyticsAdmin.all') : industryField(industries.value.find(industry => industry.id === target), 'title', locale.value) || target
  }
  if (item.name === 'news_filter') return target === 'all' ? t('analyticsAdmin.all') : localizedField(newsCategories.value.find(category => category.id === target), 'title', locale.value) || target
  if (item.name === 'social_click') {
    const [platform, id] = target.split(':')
    const link = contactSettings.value?.contact.socialLinks?.[locale.value]?.find(link => link.id === id)
    return link?.label || t(`contactAdmin.socialPlatforms.${platform}`)
  }
  if (['inquiry_start', 'inquiry_submit', 'inquiry_error'].includes(item.name)) return t(target === 'home' ? 'analyticsAdmin.homeForm' : 'analyticsAdmin.contactForm')
  if (item.name === 'language_change') return languageLabel(target)
  if (item.name === 'cta_click') {
    const key = Object.entries(availableLocales.find(item => item.code === 'en')?.messages.site || {}).find(([, value]) => value === target)?.[0]
    if (key) return t(`site.${key}`)
  }
  const keys = { all: 'all', 'website-button': 'websiteButton', 'nav-contact': 'navContact', email: 'email', phone: 'phone' }
  return keys[target] ? t(`analyticsAdmin.${keys[target]}`) : target
}
function params() {
  const query = new URLSearchParams({ from: dates.value[0], to: dates.value[1] })
  if (language.value) query.set('locale', language.value)
  if (selectedDevice.value) query.set('device', selectedDevice.value)
  return query
}
function validRange() {
  const values = dates.value
  return Array.isArray(values) && values.length === 2 && values[0] <= values[1] && values[1] <= today() && (Date.parse(values[1]) - Date.parse(values[0])) / 86400000 <= 365
}
async function request(path, options = {}) {
  const response = await fetch(path, { cache: 'no-store', ...options })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
async function loadRecords() {
  if (!validRange() || disposed) return
  recordsAbort?.abort(); const controller = new AbortController(); recordsAbort = controller
  recordsLoading.value = true; recordsError.value = false
  const query = params(); query.set('page', currentPage.value); if (eventName.value) query.set('name', eventName.value)
  try {
    const value = await request(`/api/analytics/events?${query}`, { signal: controller.signal })
    if (disposed || controller !== recordsAbort) return
    records.value = value.items; total.value = value.total
  } catch (failure) { if (!disposed && failure.name !== 'AbortError') { recordsError.value = true; records.value = []; total.value = 0 } }
  finally { if (!disposed && controller === recordsAbort) recordsLoading.value = false }
}
async function loadReport() {
  if (!validRange()) { ElMessage.warning(t('analyticsAdmin.invalidRange')); return }
  reportAbort?.abort(); const controller = new AbortController(); reportAbort = controller
  loading.value = true; error.value = false
  try {
    const value = await request(`/api/analytics/report?${params()}`, { signal: controller.signal })
    if (disposed || controller !== reportAbort) return
    report.value = value
    if (!saving.value) { collecting.value = value.enabled; configReady.value = true }
    updated.value = new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date())
  } catch (failure) { if (!disposed && failure.name !== 'AbortError') { error.value = true; report.value = null } }
  finally { if (!disposed && controller === reportAbort) loading.value = false }
}
async function load() {
  const tasks = [loadReport()]
  if (tab.value === 'records') tasks.push(loadRecords())
  await Promise.all(tasks)
}
async function toggleCollection(value) {
  if (saving.value) return
  saving.value = true
  configAbort = new AbortController()
  try {
    const result = await request('/api/analytics/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: value }), signal: configAbort.signal })
    if (!disposed) { collecting.value = result.enabled; ElMessage.success(t('analyticsAdmin.saved')) }
  } catch (failure) { if (!disposed && failure.name !== 'AbortError') ElMessage.error(t('analyticsAdmin.saveFailed')) }
  finally { if (!disposed) saving.value = false }
}
function exportTrend() {
  if (!report.value) return
  const rows = [[t('analyticsAdmin.date'), t('analyticsAdmin.pageViews'), t('analyticsAdmin.visitors'), t('analyticsAdmin.inquiries')], ...report.value.trend.map(day => [day.day, day.pageViews, day.visitors, day.inquiries])]
  const csv = '\uFEFF' + rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = `analytics-${dates.value[0]}-${dates.value[1]}.csv`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
watch([dates, language, selectedDevice], () => { currentPage.value = 1; load() })
watch(tab, value => { if (value === 'records') loadRecords() })
watch(eventName, () => { currentPage.value = 1; loadRecords() })
onMounted(() => { load(); loadProjects(); loadIndustries() })
onBeforeUnmount(() => { disposed = true; reportAbort?.abort(); recordsAbort?.abort(); configAbort?.abort() })
defineExpose({ load })
</script>

<template>
  <div class="analytics-manager" :aria-busy="loading || recordsLoading">
    <section class="analytics-collection analytics-card">
      <div><h2>{{ $t('analyticsAdmin.collection') }} <el-tag :type="collecting ? 'success' : 'info'" size="small">{{ $t(collecting ? 'analyticsAdmin.enabled' : 'analyticsAdmin.disabled') }}</el-tag></h2><p>{{ $t('analyticsAdmin.collectionHint') }}</p></div>
      <el-switch :model-value="collecting" :loading="saving" :disabled="!configReady" :aria-label="$t('analyticsAdmin.collection')" @change="toggleCollection" />
    </section>
    <section class="analytics-filters analytics-card">
      <div class="analytics-date"><label>{{ $t('analyticsAdmin.fromTo') }}</label><el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :shortcuts="shortcuts" :start-placeholder="$t('analyticsAdmin.start')" :end-placeholder="$t('analyticsAdmin.end')" :disabled-date="date => calendarDay(date) > today()" /><div class="date-presets"><el-button v-for="days in [7, 30, 90]" :key="days" size="small" :type="dates.join() === range(days).join() ? 'primary' : 'default'" @click="dates = range(days)">{{ $t(`analyticsAdmin.last${days}`) }}</el-button></div></div>
      <div><label>{{ $t('analyticsAdmin.language') }}</label><el-select v-model="language" :aria-label="$t('analyticsAdmin.language')"><el-option value="" :label="$t('analyticsAdmin.allLanguages')" /><el-option v-for="item in availableLocales" :key="item.code" :value="item.code" :label="languageLabel(item.code)" /></el-select></div>
      <div><label>{{ $t('analyticsAdmin.device') }}</label><el-select v-model="selectedDevice" :aria-label="$t('analyticsAdmin.device')"><el-option value="" :label="$t('analyticsAdmin.allDevices')" /><el-option v-for="name in ['desktop','tablet','mobile']" :key="name" :value="name" :label="$t(`analyticsAdmin.${name}`)" /></el-select></div>
      <div class="analytics-filter-actions"><el-button :icon="Refresh" :loading="loading" @click="load">{{ $t('analyticsAdmin.refresh') }}</el-button><el-button :icon="Download" :disabled="!report || loading" @click="exportTrend">{{ $t('analyticsAdmin.export') }}</el-button></div>
    </section>
    <p v-if="updated" class="analytics-updated">{{ $t('analyticsAdmin.generated', { time: updated }) }}</p>
    <el-alert v-if="error" :title="$t('analyticsAdmin.loadFailed')" type="error" show-icon :closable="false" />
    <el-tabs v-model="tab">
      <el-tab-pane :label="$t('analyticsAdmin.overview')" name="overview">
        <el-skeleton v-if="loading && !report" :rows="10" animated class="analytics-card" />
        <template v-else-if="report">
          <div class="analytics-metrics"><div v-for="[key, value, hint] in metrics" :key="key" class="analytics-card metric"><div class="metric-label">{{ $t(`analyticsAdmin.${key}`) }}<el-tooltip :content="$t(`analyticsAdmin.${hint}`)" :trigger="['hover','focus']" placement="top"><el-icon tabindex="0" :aria-label="$t(`analyticsAdmin.${hint}`)"><InfoFilled /></el-icon></el-tooltip></div><strong>{{ value }}</strong></div></div>
          <el-alert v-if="!summary.pageViews && !summary.inquiries" :title="$t('analyticsAdmin.noData')" :description="$t('analyticsAdmin.noDataHint')" type="info" show-icon :closable="false" class="analytics-empty-hint" />
          <div class="analytics-primary-grid">
            <section class="analytics-card trend-panel"><div class="panel-heading"><div><h2>{{ $t('analyticsAdmin.trend') }}</h2><p>{{ $t('analyticsAdmin.trendHint') }}</p></div><el-radio-group v-model="trendMode" size="small" :aria-label="$t('analyticsAdmin.trend')"><el-radio-button value="chart">{{ $t('analyticsAdmin.chart') }}</el-radio-button><el-radio-button value="table">{{ $t('analyticsAdmin.table') }}</el-radio-button></el-radio-group></div>
              <AnalyticsTrend v-if="trendMode === 'chart'" :days="report.trend" />
              <el-table v-else :data="report.trend" max-height="300" :empty-text="$t('analyticsAdmin.noData')"><el-table-column prop="day" :label="$t('analyticsAdmin.date')" min-width="120" /><el-table-column prop="pageViews" :label="$t('analyticsAdmin.pageViews')" /><el-table-column prop="visitors" :label="$t('analyticsAdmin.visitors')" /><el-table-column prop="inquiries" :label="$t('analyticsAdmin.inquiries')" /></el-table>
            </section>
            <section class="analytics-card funnel-panel"><h2>{{ $t('analyticsAdmin.funnel') }}</h2><p>{{ $t('analyticsAdmin.funnelHint') }}</p><ol class="analytics-funnel"><li v-for="(stage, index) in funnel" :key="stage.label"><div><span class="funnel-step">{{ index + 1 }}</span><span>{{ $t(`analyticsAdmin.${stage.label}`) }}</span><strong>{{ integer(stage.value) }}</strong></div><el-progress :percentage="Math.min(100, stage.rate)" :show-text="false" :stroke-width="7" :color="index === 3 ? '#087d78' : '#276ed0'" /><small>{{ $t('analyticsAdmin.relative', { rate: stage.rate }) }}</small></li></ol></section>
          </div>
          <section class="analytics-card"><h2>{{ $t('analyticsAdmin.pages') }}</h2><p>{{ $t('analyticsAdmin.pagesHint') }}</p><el-table :data="report.pages" :empty-text="$t('analyticsAdmin.noData')" max-height="460" stripe><el-table-column :label="$t('analyticsAdmin.page')" min-width="240"><template #default="{ row }"><div class="page-title">{{ pageLabel(row.path, row.pageKey) }}</div><small class="page-path">{{ row.path }}</small></template></el-table-column><el-table-column prop="views" :label="$t('analyticsAdmin.views')" sortable min-width="120" /><el-table-column prop="visitors" :label="$t('analyticsAdmin.visitors')" sortable min-width="120" /><el-table-column :label="$t('analyticsAdmin.avgDuration')" min-width="130"><template #default="{ row }">{{ duration(row.avgDuration) }}</template></el-table-column><el-table-column :label="$t('analyticsAdmin.scrollDepth')" min-width="130"><template #default="{ row }">{{ row.scrollDepth }}%</template></el-table-column></el-table></section>
          <div class="analytics-breakdowns"><section v-for="group in groups" :key="group.key" class="analytics-card"><h2>{{ $t(`analyticsAdmin.${group.key}`) }}</h2><p>{{ $t('analyticsAdmin.breakdownHint') }}</p><div v-if="group.items.length" class="breakdown-list"><div v-for="item in group.items" :key="item.name" class="breakdown-item"><div><span>{{ group.key === 'sources' ? sourceLabel(item.name) : group.key === 'devices' ? $t(`analyticsAdmin.${item.name}`) : languageLabel(item.name) }}</span><strong>{{ integer(item.views) }} <small>{{ summary.pageViews ? Math.round(item.views / summary.pageViews * 100) : 0 }}%</small></strong></div><el-progress :percentage="summary.pageViews ? Math.min(100, Math.round(item.views / summary.pageViews * 100)) : 0" :show-text="false" :stroke-width="6" /></div></div><el-empty v-else :image-size="48" :description="$t('analyticsAdmin.noData')" /></section></div>
          <section class="analytics-card"><h2>{{ $t('analyticsAdmin.actions') }}</h2><p>{{ $t('analyticsAdmin.actionsHint') }}</p><el-table :data="report.actions" :empty-text="$t('analyticsAdmin.noData')" max-height="380" stripe><el-table-column :label="$t('analyticsAdmin.event')" min-width="160"><template #default="{ row }">{{ eventLabel(row.name) }}</template></el-table-column><el-table-column :label="$t('analyticsAdmin.target')" min-width="240" show-overflow-tooltip><template #default="{ row }">{{ targetLabel(row) }}</template></el-table-column><el-table-column prop="count" :label="$t('analyticsAdmin.count')" sortable min-width="100" /><el-table-column prop="visitors" :label="$t('analyticsAdmin.uniqueVisitors')" sortable min-width="120" /></el-table></section>
        </template>
      </el-tab-pane>
      <el-tab-pane :label="$t('analyticsAdmin.records')" name="records">
        <section class="analytics-card"><div class="panel-heading"><h2>{{ $t('analyticsAdmin.records') }}</h2><el-select v-model="eventName" class="event-filter" :aria-label="$t('analyticsAdmin.event')"><el-option value="" :label="$t('analyticsAdmin.allEvents')" /><el-option v-for="name in eventNames" :key="name" :value="name" :label="eventLabel(name)" /></el-select></div>
          <el-alert v-if="recordsError" :title="$t('analyticsAdmin.loadFailed')" type="error" :closable="false" />
          <el-table :data="records" :empty-text="recordsLoading ? $t('analyticsAdmin.loading') : $t('analyticsAdmin.noData')" stripe><el-table-column prop="time" :label="$t('analyticsAdmin.time')" min-width="180" /><el-table-column :label="$t('analyticsAdmin.event')" min-width="155"><template #default="{ row }"><el-tag size="small" :type="row.name === 'inquiry_success' ? 'success' : 'info'">{{ eventLabel(row.name) }}</el-tag></template></el-table-column><el-table-column :label="$t('analyticsAdmin.page')" min-width="220"><template #default="{ row }"><div>{{ pageLabel(row.path, row.pageKey) }}</div><small class="page-path">{{ row.path }}</small></template></el-table-column><el-table-column :label="$t('analyticsAdmin.target')" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ targetLabel(row) }}</template></el-table-column><el-table-column :label="$t('analyticsAdmin.language')" min-width="100"><template #default="{ row }">{{ languageLabel(row.locale) }}</template></el-table-column><el-table-column :label="$t('analyticsAdmin.device')" min-width="100"><template #default="{ row }">{{ $t(`analyticsAdmin.${row.device}`) }}</template></el-table-column><el-table-column :label="$t('analyticsAdmin.source')" min-width="160" show-overflow-tooltip><template #default="{ row }">{{ sourceLabel(row.source) }}</template></el-table-column><el-table-column prop="duration" :label="$t('analyticsAdmin.duration')" min-width="110" /><el-table-column :label="$t('analyticsAdmin.scrollDepth')" min-width="110"><template #default="{ row }">{{ row.scrollDepth }}%</template></el-table-column></el-table>
          <el-pagination v-if="total" v-model:current-page="currentPage" :page-size="20" :total="total" :pager-count="5" layout="total, prev, pager, next" background :disabled="recordsLoading" @current-change="loadRecords" class="analytics-pagination" />
        </section>
      </el-tab-pane>
    </el-tabs>
    <section class="analytics-card definitions"><el-collapse><el-collapse-item :title="$t('analyticsAdmin.definitions')" name="definitions"><p>{{ $t('analyticsAdmin.privacy') }}</p><p>{{ $t('analyticsAdmin.limitations') }}</p><ul><li v-for="key in ['pvHint','uvHint','sessionHint','durationHint','bounceHint','inquiryHint','conversionHint']" :key="key">{{ $t(`analyticsAdmin.${key}`) }}</li></ul></el-collapse-item></el-collapse></section>
  </div>
</template>

<style scoped>
.analytics-manager { color: #203951; min-width: 0; }
.analytics-card { background: #fff; padding: 22px; border: 1px solid #e1e9f3; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 6px #17385704; min-width: 0; }
.analytics-card h2 { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.7; color: #16334f; }
.analytics-card p { margin: 5px 0 15px; color: #5c7087; font-size: 12px; line-height: 1.8; }
.analytics-collection { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.analytics-collection h2 { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }.analytics-collection p { margin-bottom: 0; }
.analytics-filters { display: grid; grid-template-columns: minmax(300px, 2fr) minmax(140px, 1fr) minmax(140px, 1fr); gap: 18px; align-items: start; }
.analytics-filters label { display: block; margin-bottom: 8px; color: #344d68; font-size: 12px; }
.analytics-filters :deep(.el-date-editor), .analytics-filters .el-select { width: 100%; min-width: 0; }
.analytics-date :deep(.el-range-input) { min-width: 0; }
.date-presets { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }.date-presets .el-button { margin: 0; }
.analytics-filter-actions { grid-column: 1 / -1; display: flex; gap: 10px; flex-wrap: wrap; }.analytics-filter-actions .el-button { margin: 0; }
.analytics-updated { color: #5d7189; font-size: 12px; margin: -5px 0 15px; }
.analytics-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
.metric { margin: 0; padding: 20px; }.metric-label { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; color: #4d637c; }.metric-label .el-icon { color: #627d98; flex-shrink: 0; }.metric-label .el-icon:focus-visible { outline: 2px solid #276ed0; outline-offset: 3px; }
.metric strong { display: block; font-size: 28px; line-height: 1.4; margin-top: 12px; color: #16334f; font-variant-numeric: tabular-nums; }
.analytics-primary-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: 20px; }.analytics-primary-grid .analytics-card { height: 100%; box-sizing: border-box; }
.panel-heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: start; gap: 12px; margin-bottom: 14px; }.panel-heading p { margin-bottom: 0; }
.analytics-funnel { padding: 0; margin: 20px 0 0; list-style: none; display: grid; gap: 18px; }.analytics-funnel li > div:first-child { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; font-size: 12px; }.analytics-funnel strong { margin-left: auto; font-size: 17px; }.funnel-step { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 7px; background: #edf4ff; color: #276ed0; font-weight: 700; }.analytics-funnel small { display: block; color: #5d7189; font-size: 11px; margin-top: 6px; }
.analytics-primary-grid { margin-bottom: 20px; }.analytics-primary-grid .analytics-card { margin-bottom: 0; }
.analytics-breakdowns { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.breakdown-list { max-height: 260px; overflow-y: auto; padding-right: 4px; }.breakdown-item { margin-top: 17px; }.breakdown-item > div:first-child { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; margin-bottom: 7px; font-size: 12px; }.breakdown-item span { overflow-wrap: anywhere; }.breakdown-item strong { white-space: nowrap; }.breakdown-item small { color: #5d7189; font-weight: 400; margin-left: 6px; }
.page-title { font-weight: 600; }.page-path { display: block; color: #5d7189; font-size: 11px; overflow-wrap: anywhere; line-height: 1.7; }
.event-filter { width: 230px; }.analytics-pagination { margin-top: 20px; justify-content: flex-end; flex-wrap: wrap; gap: 10px; }
.analytics-empty-hint { margin-bottom: 20px; }.definitions { padding-top: 8px; padding-bottom: 8px; }.definitions :deep(.el-collapse) { border: 0; }.definitions :deep(.el-collapse-item__wrap) { border: 0; }.definitions :deep(.el-collapse-item__header) { border: 0; color: #16334f; }.definitions ul { padding-left: 20px; color: #4d637c; line-height: 1.9; font-size: 12px; }
@media (max-width: 1200px) { .analytics-primary-grid { grid-template-columns: minmax(0, 1fr); }.analytics-breakdowns { grid-template-columns: minmax(0, 1fr); }.analytics-funnel { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; } }
@media (max-width: 850px) { .analytics-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }.analytics-date { grid-column: 1 / -1; }.analytics-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 480px) { .analytics-card { padding: 16px; }.metric strong { font-size: 23px; }.analytics-funnel { grid-template-columns: minmax(0, 1fr); }.analytics-filters { gap: 12px; }.analytics-pagination { justify-content: center; } }
</style>
