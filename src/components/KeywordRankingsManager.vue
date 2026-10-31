<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, Plus, Refresh, Upload } from '@element-plus/icons-vue';
import { apiRequest } from '../services/api.js';
import AdminEditorDialog from './AdminEditorDialog.vue';
import AdminEditorPanel from './AdminEditorPanel.vue';
import KeywordRankTrend from './KeywordRankTrend.vue';
import { useAdminEditorState } from '../composables/useAdminEditorState.js';
import { rankDevices, rankSources, rankLabel, rankCsvTemplate, parseRankCsv } from '../utils/keywordRankings.js';

const records = ref([]), configuration = ref(null), loading = ref(false), error = ref('');
const saving = ref(false), importing = ref(false), checking = ref(''), picker = ref(null);
const keywordDialog = ref(false), observationDialog = ref(false), selectedId = ref(''), original = ref('');
const page = ref(1), pageSize = ref(20), search = ref(''), deviceFilter = ref(''), statusFilter = ref('all'), changeFilter = ref('');
const keywordForm = reactive({ keyword: '', devices: ['desktop', 'mobile'], searchDepth: 100, notes: '', enabled: true });
const observation = reactive({ observedAt: new Date(), status: 'ranked', position: null, matchedUrl: '', notes: '' });
const history = ref(null), historyOpen = ref(false), historyLoading = ref(false), historyPage = ref(1), historyError = ref('');
const desktopQuery = window.matchMedia('(min-width: 1100px)'), wideTable = ref(desktopQuery.matches);
const updateTableWidth = event => { wideTable.value = event.matches; };
desktopQuery.addEventListener('change', updateTableWidth);
let loadRequest, historyRequest, disposed = false;
const dirty = computed(() => keywordDialog.value ? JSON.stringify(keywordForm) !== original.value : observationDialog.value && JSON.stringify(observation) !== original.value);
const busy = computed(() => importing.value || Boolean(checking.value));
useAdminEditorState({ dirty, saving, uploading: busy, loading });
const current = computed(() => records.value.find(item => item.id === selectedId.value));
const filtered = computed(() => records.value.filter(item => {
  const keyword = search.value.trim().toLowerCase();
  return (!keyword || [item.keyword, item.notes, item.targetHost].some(text => text.toLowerCase().includes(keyword))) && (!deviceFilter.value || item.device === deviceFilter.value)
    && (statusFilter.value === 'archived' ? item.archived : !item.archived && (statusFilter.value === 'all' || item.enabled === (statusFilter.value === 'enabled')))
    && (!changeFilter.value || item.change.kind === changeFilter.value);
}));
const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
const active = computed(() => records.value.filter(item => !item.archived));
const metrics = computed(() => [
  { label: '监测条件', value: active.value.length, note: '同一词的不同终端分别记录' },
  { label: '排名前十', value: active.value.filter(item => item.latestStatus === 'ranked' && item.latestRank <= 10).length, note: '按最近一次有效结果统计' },
  { label: '上升 / 新进', value: active.value.filter(item => ['up', 'entered'].includes(item.change.kind)).length, note: '与上一次有效结果相比' },
  { label: '下降 / 跌出', value: active.value.filter(item => ['down', 'left'].includes(item.change.kind)).length, note: '采集失败不会计为下降' },
]);
const dateLabel = value => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—';
async function load() {
  loadRequest?.abort(); const controller = new AbortController(); loadRequest = controller;
  loading.value = true; error.value = '';
  try {
    const [items, status] = await Promise.all([apiRequest('/api/seo/rankings/keywords', { signal: controller.signal }), apiRequest('/api/seo/rankings/status', { signal: controller.signal })]);
    if (disposed || controller !== loadRequest) return;
    records.value = items.map(item => ({ ...item.keyword, change: item.change })); configuration.value = status;
    page.value = Math.min(page.value, Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));
  } catch (failure) { if (!disposed && failure.name !== 'AbortError') error.value = failure.message || '排名监测数据加载失败。'; }
  finally { if (!disposed && controller === loadRequest) loading.value = false; }
}
function openKeyword(item) {
  selectedId.value = item?.id || '';
  Object.assign(keywordForm, { keyword: item?.keyword || '', devices: item ? [item.device] : ['desktop', 'mobile'], searchDepth: item?.searchDepth || 100, notes: item?.notes || '', enabled: item?.enabled ?? true });
  original.value = JSON.stringify(keywordForm); keywordDialog.value = true;
}
async function saveKeyword() {
  if (saving.value) return;
  if (!keywordForm.keyword.trim() || !keywordForm.devices.length) { ElMessage.warning('请填写关键词，并至少选择一个终端。'); return; }
  saving.value = true;
  try {
    await apiRequest('/api/seo/rankings/keywords' + (selectedId.value ? '/' + selectedId.value : ''), { method: selectedId.value ? 'PUT' : 'POST', body: selectedId.value ? { notes: keywordForm.notes, enabled: keywordForm.enabled } : keywordForm });
    keywordDialog.value = false; await load(); ElMessage.success('关键词监测已保存。');
  } catch (failure) { ElMessage.error(failure.message); } finally { saving.value = false; }
}
async function toggle(item) {
  if (busy.value || saving.value) return; saving.value = true;
  try { await apiRequest('/api/seo/rankings/keywords/' + item.id, { method: 'PUT', body: { enabled: item.archived || !item.enabled, archived: false } }); await load(); }
  catch (failure) { ElMessage.error(failure.message); } finally { saving.value = false; }
}
async function archive(item) {
  try { await ElMessageBox.confirm('归档后停止监测，历史排名会保留，可从“已归档”中恢复。', '归档关键词', { confirmButtonText: '归档', cancelButtonText: '取消', type: 'warning' }); }
  catch { return; }
  saving.value = true;
  try { await apiRequest('/api/seo/rankings/keywords/' + item.id, { method: 'DELETE' }); await load(); }
  catch (failure) { ElMessage.error(failure.message); } finally { saving.value = false; }
}
function openObservation(item) {
  selectedId.value = item.id; Object.assign(observation, { observedAt: new Date(), status: 'ranked', position: null, matchedUrl: '', notes: '' });
  original.value = JSON.stringify(observation); observationDialog.value = true;
}
async function saveObservation() {
  if (saving.value) return;
  if (!observation.observedAt || (observation.status === 'ranked' && (!Number.isInteger(observation.position) || observation.position < 1 || observation.position > current.value.searchDepth))) { ElMessage.warning('请填写实际采集时间和监测范围内的整数名次。'); return; }
  saving.value = true;
  try {
    await apiRequest('/api/seo/rankings/keywords/' + selectedId.value + '/observations', { method: 'POST', body: { ...observation, observedAt: new Date(observation.observedAt).toISOString(), position: observation.status === 'ranked' ? observation.position : null, matchedUrl: observation.status === 'ranked' ? observation.matchedUrl : '' } });
    observationDialog.value = false; await load(); ElMessage.success('实际排名已记录，升降和历史走势已更新。');
  } catch (failure) { ElMessage.error(failure.message); } finally { saving.value = false; }
}
async function check(item) {
  if (busy.value) return; checking.value = item.id;
  try { await apiRequest('/api/seo/rankings/keywords/' + item.id + '/check', { method: 'POST', body: {} }); ElMessage.success('排名采集完成。'); }
  catch (failure) { ElMessage.error(failure.message); }
  finally { checking.value = ''; await load(); }
}
async function openHistory(item) { selectedId.value = item.id; historyPage.value = 1; history.value = null; historyOpen.value = true; await loadHistory(); }
async function loadHistory() {
  historyRequest?.abort(); const controller = new AbortController(); historyRequest = controller;
  historyLoading.value = true; historyError.value = '';
  try { const value = await apiRequest(`/api/seo/rankings/keywords/${selectedId.value}/history?page=${historyPage.value}&pageSize=20`, { signal: controller.signal }); if (!disposed && controller === historyRequest) history.value = value; }
  catch (failure) { if (!disposed && failure.name !== 'AbortError') historyError.value = failure.message; }
  finally { if (!disposed && controller === historyRequest) historyLoading.value = false; }
}
function template() {
  const text = rankCsvTemplate(filtered.value.filter(item => !item.archived));
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = '关键词排名导入模板.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function importCsv(event) {
  const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
  if (!/\.csv$/i.test(file.name) || file.size > 2 * 1024 * 1024) { ElMessage.warning('请选择不超过 2 MB 的 UTF-8 CSV 文件。'); return; }
  let rows;
  try { rows = parseRankCsv(await file.text(), records.value); } catch (failure) { ElMessage.error(failure.message); return; }
  try { await ElMessageBox.confirm(`将导入 ${rows.length} 条真实排名记录。请确认来源、终端和采集时间一致。`, '导入排名历史', { confirmButtonText: '确认导入', cancelButtonText: '取消' }); } catch { return; }
  importing.value = true;
  try { const result = await apiRequest('/api/seo/rankings/import', { method: 'POST', body: rows }); await load(); ElMessage.success(`已导入 ${result.imported} 条排名记录。`); }
  catch (failure) { ElMessage.error(failure.message); } finally { importing.value = false; }
}
onMounted(load);
onBeforeUnmount(() => { disposed = true; loadRequest?.abort(); historyRequest?.abort(); desktopQuery.removeEventListener('change', updateTableWidth); });
defineExpose({ load });
</script>

<template>
  <section class="keyword-rank-manager">
    <div class="keyword-rank-metrics"><article v-for="metric in metrics" :key="metric.label"><span>{{ metric.label }}</span><strong>{{ metric.value }}</strong><small>{{ metric.note }}</small></article></div>
    <div v-if="configuration" class="keyword-rank-source"><div><strong>{{ configuration.siteHost }} · 百度自然搜索</strong><p>{{ configuration.configured ? (configuration.automatic ? '已启用每日自动监测，也可按关键词立即检测。' : '数据接口已接入，可按关键词立即检测。') : '尚未接入自动采集接口，可先录入或导入实际查询结果。' }} 电脑端与手机端独立对比，不计广告位，采用数据接口默认地区。</p></div><el-popover placement="bottom-end" width="340" trigger="click"><template #reference><el-button text>数据接入说明</el-button></template><div class="keyword-rank-setup"><strong>自动采集</strong><p>服务器配置 <code>TZME_SERPAPI_KEY</code> 后重启即可接入 SerpApi 百度结果；接口按服务商额度计费，检查前 N 位最多查询 N/10 页。</p><p>需要每日自动检查时，再设置 <code>TZME_RANK_AUTO_ENABLED=true</code>。未启用时仅在点击“立即检测”后查询。</p><a href="https://serpapi.com/baidu-search-api" target="_blank" rel="noopener noreferrer">查看官方接口说明 ↗</a></div></el-popover></div>
    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" />
    <el-card shadow="never" class="keyword-rank-card">
      <template #header><div class="keyword-rank-toolbar"><div><strong>关键词排名监测</strong><small>共 {{ filtered.length }} 个监测条件 · 升降与上一次有效结果相比</small></div><div class="keyword-rank-toolbar-actions"><input ref="picker" class="keyword-rank-csv-picker" type="file" accept=".csv,text/csv" aria-label="导入实际关键词排名 CSV" @change="importCsv" /><el-button :icon="Download" :disabled="!filtered.some(item => !item.archived)" @click="template">下载模板</el-button><el-button :icon="Upload" :loading="importing" :disabled="busy || saving" @click="picker.click()">导入排名</el-button><el-button type="primary" :icon="Plus" :disabled="busy || saving" @click="openKeyword()">新增关键词</el-button></div></div></template>
      <div class="keyword-rank-filters"><el-input v-model="search" clearable placeholder="搜索关键词或备注" aria-label="搜索监测关键词" @input="page = 1" /><el-select v-model="deviceFilter" clearable placeholder="全部终端" aria-label="筛选终端" @change="page = 1"><el-option v-for="(label, value) in rankDevices" :key="value" :label="label" :value="value" /></el-select><el-select v-model="statusFilter" aria-label="筛选监测状态" @change="page = 1"><el-option label="全部监测" value="all" /><el-option label="监测中" value="enabled" /><el-option label="已暂停" value="paused" /><el-option label="已归档" value="archived" /></el-select><el-select v-model="changeFilter" clearable placeholder="全部升降" aria-label="筛选排名变化" @change="page = 1"><el-option label="上升" value="up" /><el-option label="下降" value="down" /><el-option label="新进榜" value="entered" /><el-option label="跌出范围" value="left" /><el-option label="持平" value="same" /><el-option label="首次记录" value="first" /><el-option label="待采集" value="pending" /></el-select><el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button></div>
      <el-table v-loading="loading" :data="pageRows" row-key="id" stripe>
        <el-table-column label="关键词 / 监测范围" min-width="220"><template #default="{ row }"><div class="keyword-rank-word"><strong>{{ row.keyword }}</strong><small>{{ rankDevices[row.device] }} · 前 {{ row.searchDepth }} 位 <span v-if="!row.enabled">· 已暂停</span></small><small v-if="row.notes">{{ row.notes }}</small></div></template></el-table-column>
        <el-table-column label="最近有效排名" min-width="160"><template #default="{ row }"><strong class="keyword-rank-position">{{ rankLabel(row.latestStatus, row.latestRank, row.searchDepth) }}</strong><el-tooltip v-if="row.lastError" :content="row.lastError + '，这里保留上次有效结果。'"><small class="keyword-rank-error">最近采集失败</small></el-tooltip><small v-else class="keyword-rank-muted">{{ row.latestSource ? rankSources[row.latestSource] : '尚无实际数据' }}</small></template></el-table-column>
        <el-table-column label="排名变化" min-width="145"><template #default="{ row }"><span class="keyword-rank-change" :class="'is-' + row.change.kind"><b v-if="['up', 'entered'].includes(row.change.kind)">↑</b><b v-else-if="['down', 'left'].includes(row.change.kind)">↓</b>{{ row.change.label }}</span></template></el-table-column>
        <el-table-column label="上次排名" min-width="120"><template #default="{ row }">{{ row.previousStatus ? rankLabel(row.previousStatus, row.previousRank, row.searchDepth) : '—' }}</template></el-table-column>
        <el-table-column label="历史最佳" width="100"><template #default="{ row }">{{ row.bestRank ? '第 ' + row.bestRank + ' 名' : '—' }}</template></el-table-column>
        <el-table-column label="有效采集时间" min-width="180"><template #default="{ row }"><span class="keyword-rank-date">{{ dateLabel(row.latestObservedAt) }}</span></template></el-table-column>
        <el-table-column label="操作" min-width="270" :fixed="wideTable ? 'right' : false"><template #default="{ row }"><div class="keyword-rank-row-actions"><el-button link type="primary" @click="openHistory(row)">趋势 / 历史</el-button><el-button link type="primary" :disabled="row.archived || busy" @click="openObservation(row)">录入排名</el-button><el-button link type="primary" :loading="checking === row.id" :disabled="!configuration?.configured || !row.enabled || busy || row.archived" @click="check(row)">立即检测</el-button><el-dropdown trigger="click" :disabled="busy || saving"><el-button link>更多</el-button><template #dropdown><el-dropdown-menu><el-dropdown-item @click="openKeyword(row)">编辑备注与状态</el-dropdown-item><el-dropdown-item @click="toggle(row)">{{ row.archived ? '恢复监测' : row.enabled ? '暂停监测' : '启用监测' }}</el-dropdown-item><el-dropdown-item v-if="!row.archived" divided @click="archive(row)">归档监测</el-dropdown-item></el-dropdown-menu></template></el-dropdown></div></template></el-table-column>
        <template #empty><el-empty :image-size="65" :description="records.length ? '暂无符合筛选条件的关键词' : '先新增关键词，再采集或录入真实排名，系统会自动计算升降。'" /></template>
      </el-table>
      <div class="keyword-rank-pagination"><span>同一关键词、终端、域名和检查范围单独比较；不同条件不混算。</span><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[20, 50, 100]" :total="filtered.length" layout="sizes, prev, pager, next" background @size-change="page = 1" /></div>
    </el-card>
    <AdminEditorDialog v-model="keywordDialog" :title="selectedId ? '编辑关键词监测' : '新增关键词监测'" description="关键词与搜索条件确定后保持一致，便于持续对比排名。" :dirty="Boolean(dirty)" :saving="saving" width="min(820px, calc(100vw - 32px))" save-label="保存监测" footer-note="仅用于后台监测，不在官网公开展示。" @save="saveKeyword">
      <el-form label-position="top" class="cms-editor-layout" @submit.prevent="saveKeyword"><AdminEditorPanel step="01" title="搜索条件" description="默认监测当前中文官网在百度自然搜索中的排名。"><div class="cms-field-grid"><el-form-item label="关键词" required><el-input v-model="keywordForm.keyword" maxlength="160" :disabled="Boolean(selectedId)" placeholder="例如：港口机械制造" /></el-form-item><el-form-item label="监测网站"><el-input :model-value="current?.targetHost || configuration?.siteHost" disabled /></el-form-item></div><div class="cms-field-grid"><el-form-item label="终端" required><el-checkbox-group v-model="keywordForm.devices" :disabled="Boolean(selectedId)"><el-checkbox value="desktop">电脑端</el-checkbox><el-checkbox value="mobile">手机端</el-checkbox></el-checkbox-group></el-form-item><el-form-item label="检查范围" required><el-select v-model="keywordForm.searchDepth" :disabled="Boolean(selectedId)"><el-option v-for="value in [10, 20, 50, 100]" :key="value" :value="value" :label="'前 ' + value + ' 位'" /></el-select></el-form-item></div><p class="keyword-rank-muted">如需更换关键词、终端或范围，请新增监测；历史记录不会被覆盖。</p></AdminEditorPanel><AdminEditorPanel step="02" title="备注与状态"><el-form-item label="备注"><el-input v-model="keywordForm.notes" type="textarea" :rows="3" maxlength="1000" placeholder="可填写所属产品、业务方向或关注事项" /></el-form-item><el-checkbox v-model="keywordForm.enabled">启用监测</el-checkbox></AdminEditorPanel></el-form>
    </AdminEditorDialog>
    <AdminEditorDialog v-model="observationDialog" title="录入实际排名" :description="current ? current.keyword + ' · ' + rankDevices[current.device] + ' · 前 ' + current.searchDepth + ' 位' : ''" :dirty="Boolean(dirty)" :saving="saving" width="min(820px, calc(100vw - 32px))" save-label="保存排名记录" footer-note="按实际采集时间追加历史，不覆盖已有记录。" @save="saveObservation">
      <el-form label-position="top" class="cms-editor-layout" @submit.prevent="saveObservation"><AdminEditorPanel step="01" title="实际查询结果" description="录入同一终端、默认地区的自然搜索名次，不要填写广告位或站长平台的平均排名。"><div class="cms-field-grid"><el-form-item label="采集时间" required><el-date-picker v-model="observation.observedAt" type="datetime" :clearable="false" placeholder="实际查询时间" /></el-form-item><el-form-item label="查询结果" required><el-select v-model="observation.status"><el-option label="已检出网站" value="ranked" /><el-option :label="'前 ' + (current?.searchDepth || 100) + ' 位未检出'" value="not_found" /></el-select></el-form-item><el-form-item v-if="observation.status === 'ranked'" label="实际名次" required><el-input-number v-model="observation.position" :min="1" :max="current?.searchDepth || 100" :precision="0" controls-position="right" /></el-form-item></div><el-form-item v-if="observation.status === 'ranked'" label="命中页面（可选）"><el-input v-model="observation.matchedUrl" maxlength="2000" placeholder="填写属于当前监测网站的完整链接" /></el-form-item></AdminEditorPanel><AdminEditorPanel step="02" title="记录说明"><el-input v-model="observation.notes" type="textarea" :rows="3" maxlength="1000" placeholder="可备注查询工具或核对说明；无实际查询结果时请不要录入。" /></AdminEditorPanel></el-form>
    </AdminEditorDialog>
    <el-drawer v-model="historyOpen" class="keyword-rank-history" title="排名趋势与历史" size="min(900px, 100vw)" append-to-body destroy-on-close>
      <div v-loading="historyLoading" class="keyword-rank-history-content"><el-alert v-if="historyError" :title="historyError" type="error" :closable="false" /><template v-if="history"><div class="keyword-rank-history-heading"><div><h2>{{ history.keyword.keyword.keyword }}</h2><p>{{ rankDevices[history.keyword.keyword.device] }} · {{ history.keyword.keyword.targetHost }} · 前 {{ history.keyword.keyword.searchDepth }} 位</p></div><span class="keyword-rank-change" :class="'is-' + history.keyword.change.kind">{{ history.keyword.change.label }}</span></div><KeywordRankTrend :snapshots="history.chart" :depth="history.keyword.keyword.searchDepth" /><p class="keyword-rank-history-note">曲线显示最近 200 条记录；名次越小越靠前。采集失败不改变上一次有效排名，记录时间按当前设备时区显示。</p><el-table :data="history.items" row-key="id" stripe><el-table-column label="采集时间" min-width="175"><template #default="{ row }">{{ dateLabel(row.observedAt) }}</template></el-table-column><el-table-column label="排名结果" min-width="135"><template #default="{ row }">{{ rankLabel(row.status, row.position, history.keyword.keyword.searchDepth) }}</template></el-table-column><el-table-column label="来源" min-width="100"><template #default="{ row }">{{ rankSources[row.source] }}</template></el-table-column><el-table-column label="备注 / 结果" min-width="180"><template #default="{ row }"><span>{{ row.error || row.notes || '—' }}</span><a v-if="row.matchedUrl" :href="row.matchedUrl" target="_blank" rel="noopener noreferrer" class="keyword-rank-hit-link">查看命中链接 ↗</a></template></el-table-column></el-table><el-pagination v-model:current-page="historyPage" :page-size="20" :total="history.total" layout="total, prev, pager, next" background class="keyword-rank-history-pagination" @current-change="loadHistory" /></template></div>
    </el-drawer>
  </section>
</template>

<style scoped>
.keyword-rank-manager { display: grid; gap: 20px; }
.keyword-rank-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
.keyword-rank-metrics article { display: grid; gap: 12px; padding: 23px; border: 1px solid #e0e9ef; border-radius: 12px; background: #fff; }
.keyword-rank-metrics span { color: #718797; font-size: 12px; }
.keyword-rank-metrics strong { color: #1d4358; font-size: 30px; font-variant-numeric: tabular-nums; }
.keyword-rank-metrics small { color: #97a6b1; font-size: 11px; line-height: 1.7; }
.keyword-rank-source { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 19px 22px; border: 1px solid #dce8ef; border-radius: 10px; background: #edf5f9; }
.keyword-rank-source strong { color: #365c72; font-size: 13px; }
.keyword-rank-source p { color: #78909f; font-size: 12px; line-height: 1.8; margin: 7px 0 0; }
.keyword-rank-source > .el-button { flex-shrink: 0; }
.keyword-rank-setup { color: #6e8594; font-size: 12px; line-height: 1.9; }
.keyword-rank-setup code { font-size: 11px; overflow-wrap: anywhere; }
.keyword-rank-card { border-color: #e0e9ef; border-radius: 12px; }
.keyword-rank-card :deep(.el-card__body) { padding: 0; }
.keyword-rank-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 18px; }
.keyword-rank-toolbar strong { color: #2e5065; font-size: 15px; }
.keyword-rank-toolbar small { display: block; color: #94a4af; font-size: 11px; margin-top: 7px; }
.keyword-rank-toolbar-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.keyword-rank-toolbar-actions .el-button { margin: 0; }
.keyword-rank-csv-picker { display: none; }
.keyword-rank-filters { display: grid; grid-template-columns: minmax(190px, 1.6fr) repeat(3, minmax(120px, 1fr)) auto; gap: 12px; padding: 20px; border-bottom: 1px solid #edf1f4; }
.keyword-rank-word { display: grid; gap: 4px; }
.keyword-rank-word strong { color: #294b60; font-size: 13px; font-weight: 600; }
.keyword-rank-word small, .keyword-rank-muted { color: #93a5b1; font-size: 11px; line-height: 1.8; }
.keyword-rank-muted { display: block; }
.keyword-rank-position { font-size: 14px; color: #345b70; }
.keyword-rank-date { font-size: 12px; font-variant-numeric: tabular-nums; }
.keyword-rank-error { display: block; font-size: 11px; color: #bf8162; margin-top: 5px; }
.keyword-rank-change { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 5px 8px; border-radius: 5px; color: #8b9ca9; background: #f0f4f7; white-space: nowrap; }
.keyword-rank-change.is-up, .keyword-rank-change.is-entered { color: #25847a; background: #edf7f3; }
.keyword-rank-change.is-down, .keyword-rank-change.is-left { color: #bd706b; background: #fcf0ef; }
.keyword-rank-row-actions { display: flex; flex-wrap: wrap; gap: 8px 10px; }
.keyword-rank-row-actions .el-button { margin: 0; font-size: 12px; }
.keyword-rank-pagination { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 18px 20px; border-top: 1px solid #edf1f4; }
.keyword-rank-pagination > span { color: #94a4af; font-size: 11px; line-height: 1.8; }
.keyword-rank-history-content { min-height: 300px; }
.keyword-rank-history-heading { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin: 0 0 22px; }
.keyword-rank-history-heading h2 { color: #254b61; font-size: 22px; margin: 0 0 8px; }
.keyword-rank-history-heading p, .keyword-rank-history-note { color: #8da1ae; font-size: 11px; line-height: 1.8; }
.keyword-rank-history-note { margin: 16px 0 22px; }
.keyword-rank-hit-link { display: block; color: #168095; font-size: 11px; margin-top: 6px; }
.keyword-rank-history-pagination { justify-content: flex-end; margin-top: 20px; flex-wrap: wrap; }
@media(max-width:1150px) { .keyword-rank-toolbar { align-items: start; flex-direction: column; } .keyword-rank-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media(max-width:680px) { .keyword-rank-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } .keyword-rank-metrics article { padding: 17px; gap: 9px; } .keyword-rank-metrics strong { font-size: 25px; } .keyword-rank-source { padding: 16px; align-items: start; flex-direction: column; gap: 8px; } .keyword-rank-filters { padding: 16px; } .keyword-rank-filters > .el-input { grid-column: span 2; } .keyword-rank-pagination { padding: 16px 10px; align-items: stretch; flex-direction: column; } .keyword-rank-pagination :deep(.el-pagination) { flex-wrap: wrap; justify-content: flex-end; row-gap: 10px; } .keyword-rank-history-heading { align-items: start; } .keyword-rank-history-heading h2 { font-size: 19px; } }
</style>
