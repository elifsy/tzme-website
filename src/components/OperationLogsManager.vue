<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { Refresh, Search } from '@element-plus/icons-vue';
import { apiRequest } from '../services/api.js';

const rows = ref([]), total = ref(0), page = ref(1), pageSize = ref(20);
const loading = ref(false), error = ref(''), modules = ref([]), actions = ref([]), selected = ref(null);
const filters = reactive({ keyword: '', actor: '', module: '', action: '', result: '', dates: [] });
let request, disposed = false;
const dateFormatter = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
function dateLabel(value) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? '—' : dateFormatter.format(date); }
const moduleLabel = value => modules.value.find(item => item.value === value)?.label || value;
const actionLabel = value => actions.value.find(item => item.value === value)?.label || value;
const roleLabel = value => ({ SUPER_ADMIN: '超级管理员', ADMIN: '管理员', ANONYMOUS: '未认证的登录尝试' }[value] || value);
const hasFilters = computed(() => filters.keyword || filters.actor || filters.module || filters.action || filters.result || filters.dates?.length);
async function load() {
  request?.abort(); const controller = new AbortController(); request = controller;
  loading.value = true; error.value = '';
  const query = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize.value) });
  for (const key of ['keyword', 'actor', 'module', 'action', 'result']) if (filters[key].trim()) query.set(key, filters[key].trim());
  if (filters.dates?.length === 2) {
    query.set('from', new Date(filters.dates[0]).toISOString());
    const next = new Date(filters.dates[1]); next.setDate(next.getDate() + 1); query.set('to', next.toISOString());
  }
  try {
    const value = await apiRequest('/api/admin/operation-logs?' + query, { signal: controller.signal });
    if (disposed || controller !== request) return;
    if (!Array.isArray(value.items) || !Number.isFinite(value.total)) throw new Error('Invalid operation logs');
    rows.value = value.items; total.value = value.total;
  } catch (failure) {
    if (!disposed && controller === request && failure.name !== 'AbortError') { error.value = '操作日志加载失败，请重试。'; rows.value = []; total.value = 0; }
  } finally { if (!disposed && controller === request) loading.value = false; }
}
function search() { page.value = 1; load(); }
function reset() { Object.assign(filters, { keyword: '', actor: '', module: '', action: '', result: '', dates: [] }); search(); }
async function loadOptions() {
  try {
    const value = await apiRequest('/api/admin/operation-logs/options');
    if (!disposed) { modules.value = value.modules || []; actions.value = value.actions || []; }
  } catch { if (!disposed) error.value = '日志筛选选项加载失败，请刷新重试。'; }
}
function refresh() { loadOptions(); load(); }
onMounted(refresh);
onBeforeUnmount(() => { disposed = true; request?.abort(); });
defineExpose({ load: refresh });
</script>

<template>
  <section class="operation-logs-manager">
    <div class="operation-log-intro">
      <div><strong>人员操作记录</strong><p>记录后台操作及接口执行结果；邮件是否送达，请在邮件通知中查看。</p></div>
      <span class="operation-log-readonly">历史记录仅供查看</span>
    </div>
    <el-form class="operation-log-filters" label-position="top" @submit.prevent="search">
      <el-form-item label="搜索内容"><el-input v-model="filters.keyword" clearable maxlength="128" placeholder="操作内容、名称或记录编号" :prefix-icon="Search" /></el-form-item>
      <el-form-item label="操作人"><el-input v-model="filters.actor" clearable maxlength="64" placeholder="姓名或登录账号" /></el-form-item>
      <el-form-item label="所属模块"><el-select v-model="filters.module" clearable filterable placeholder="全部模块"><el-option v-for="item in modules" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
      <el-form-item label="操作类型"><el-select v-model="filters.action" clearable placeholder="全部操作"><el-option v-for="item in actions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
      <el-form-item label="执行结果"><el-select v-model="filters.result" clearable placeholder="全部结果"><el-option label="成功" value="success" /><el-option label="失败" value="failure" /></el-select></el-form-item>
      <el-form-item label="操作日期" class="operation-log-dates"><el-date-picker v-model="filters.dates" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" range-separator="至" clearable /></el-form-item>
      <div class="operation-log-filter-actions"><el-button type="primary" native-type="submit" :icon="Search" :loading="loading">查询</el-button><el-button :disabled="!hasFilters" @click="reset">重置</el-button></div>
    </el-form>
    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" class="operation-log-error"><el-button text @click="refresh">重新加载</el-button></el-alert>
    <el-card shadow="never" class="operation-log-table">
      <template #header><div class="operation-log-table-heading"><span>共 <strong>{{ total.toLocaleString() }}</strong> 条记录</span><el-button :icon="Refresh" :loading="loading" @click="refresh">刷新</el-button></div></template>
      <el-table v-loading="loading" :data="rows" row-key="id" stripe>
        <el-table-column label="操作时间" width="180"><template #default="{ row }"><span class="operation-log-date">{{ dateLabel(row.createdAt) }}</span></template></el-table-column>
        <el-table-column label="操作人" min-width="155"><template #default="{ row }"><div class="operation-log-actor"><strong>{{ row.displayName || row.username || '未认证' }}</strong><small>{{ row.username || '账号未识别' }}<span v-if="row.role === 'ANONYMOUS'"> · 登录尝试</span></small></div></template></el-table-column>
        <el-table-column label="所属模块" min-width="140"><template #default="{ row }">{{ moduleLabel(row.module) }}</template></el-table-column>
        <el-table-column label="操作" min-width="115"><template #default="{ row }">{{ actionLabel(row.action) }}</template></el-table-column>
        <el-table-column label="操作内容" min-width="260" show-overflow-tooltip><template #default="{ row }"><span>{{ row.targetName || row.summary }}</span><small v-if="row.targetId" class="operation-log-target">{{ row.targetId }}</small></template></el-table-column>
        <el-table-column label="结果" width="90"><template #default="{ row }"><el-tooltip :content="row.resultMessage"><el-tag :type="row.success ? 'success' : 'danger'" effect="light" round>{{ row.success ? '成功' : '失败' }}</el-tag></el-tooltip></template></el-table-column>
        <el-table-column label="详情" width="85" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="selected = row">查看</el-button></template></el-table-column>
        <template #empty><el-empty :image-size="64" :description="hasFilters ? '没有符合筛选条件的操作记录' : '暂无记录，后台操作后会自动记录'" /></template>
      </el-table>
      <div class="operation-log-pagination"><span>时间按当前设备时区显示</span><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[20, 50, 100]" :total="total" layout="sizes, prev, pager, next" background @current-change="load" @size-change="search" /></div>
    </el-card>
    <el-drawer :model-value="Boolean(selected)" title="操作详情" class="operation-log-drawer" size="min(560px, 100vw)" append-to-body destroy-on-close @update:model-value="value => { if (!value) selected = null; }">
      <template v-if="selected">
        <div class="operation-log-detail-result"><el-tag :type="selected.success ? 'success' : 'danger'" round>{{ selected.success ? '操作成功' : '操作失败' }}</el-tag><p>{{ selected.summary }}</p><small>{{ selected.resultMessage }}</small></div>
        <dl class="operation-log-detail-fields">
          <dt>操作时间</dt><dd>{{ dateLabel(selected.createdAt) }}</dd>
          <dt>操作人</dt><dd>{{ selected.displayName }}<small>{{ selected.username || '未识别账号' }} · {{ roleLabel(selected.role) }}</small></dd>
          <dt>所属模块</dt><dd>{{ moduleLabel(selected.module) }}</dd>
          <dt>操作类型</dt><dd>{{ actionLabel(selected.action) }}</dd>
          <dt>操作目标</dt><dd>{{ selected.targetName || '—' }}</dd>
          <dt>目标编号</dt><dd><code>{{ selected.targetId || '—' }}</code></dd>
          <dt>来源地址</dt><dd>{{ selected.address || '—' }}</dd>
          <dt>请求</dt><dd><code>{{ selected.method }} {{ selected.path }}</code></dd>
          <dt>状态码</dt><dd>{{ selected.statusCode }}</dd>
          <dt>处理耗时</dt><dd>{{ selected.durationMs }} ms</dd>
          <dt>追踪编号</dt><dd><code>{{ selected.requestId }}</code></dd>
        </dl>
        <p class="operation-log-detail-note">此处不保存密码、邮件授权码、客户留言正文和文件内容。</p>
      </template>
      <template #footer><el-button @click="selected = null">关闭</el-button></template>
    </el-drawer>
  </section>
</template>

<style scoped>
.operation-logs-manager { display: grid; gap: 20px; }
.operation-log-intro { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.operation-log-intro strong { color: #244257; font-size: 17px; }
.operation-log-intro p { margin: 8px 0 0; color: #7b8f9e; font-size: 12px; line-height: 1.7; }
.operation-log-readonly { flex-shrink: 0; padding: 7px 11px; border-radius: 6px; background: #eaf2f7; color: #648094; font-size: 11px; }
.operation-log-filters { display: grid; grid-template-columns: minmax(210px, 1.4fr) repeat(3, minmax(140px, 1fr)); gap: 16px; padding: 22px; border: 1px solid #e1e9ef; border-radius: 12px; background: #fff; }
.operation-log-filters :deep(.el-form-item) { margin: 0; min-width: 0; }
.operation-log-filters :deep(.el-form-item__label) { height: auto; margin: 0 0 8px; color: #60788b; font-size: 12px; line-height: 1.5; }
.operation-log-filters :deep(.el-select), .operation-log-filters :deep(.el-date-editor) { width: 100%; min-width: 0; }
.operation-log-dates { grid-column: span 2; }
.operation-log-filter-actions { display: flex; align-items: flex-end; gap: 10px; }
.operation-log-filter-actions .el-button { margin: 0; min-width: 75px; }
.operation-log-table { border-radius: 12px; border-color: #e1e9ef; }
.operation-log-table :deep(.el-card__body) { padding: 0; }
.operation-log-table-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; color: #6d8394; font-size: 13px; }
.operation-log-table-heading strong { color: #244257; font-variant-numeric: tabular-nums; }
.operation-log-date { font-size: 12px; font-variant-numeric: tabular-nums; }
.operation-log-actor { display: grid; gap: 3px; }
.operation-log-actor strong { font-weight: 500; font-size: 13px; }
.operation-log-actor small, .operation-log-target { color: #8a9caa; font-size: 11px; line-height: 1.6; }
.operation-log-target { display: block; overflow: hidden; text-overflow: ellipsis; }
.operation-log-pagination { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 22px; border-top: 1px solid #edf1f5; }
.operation-log-pagination > span { color: #91a1ad; font-size: 11px; }
.operation-log-detail-result { padding: 18px; border-radius: 10px; background: #f2f7fb; }
.operation-log-detail-result p { margin: 14px 0 5px; color: #28475b; font-size: 14px; line-height: 1.8; overflow-wrap: anywhere; }
.operation-log-detail-result small { color: #8194a1; font-size: 12px; }
.operation-log-detail-fields { display: grid; grid-template-columns: 80px minmax(0, 1fr); gap: 18px 16px; margin: 26px 0; font-size: 12px; line-height: 1.8; }
.operation-log-detail-fields dt { color: #8b9ca8; }
.operation-log-detail-fields dd { margin: 0; color: #385469; overflow-wrap: anywhere; }
.operation-log-detail-fields small { display: block; color: #8b9ca8; }
.operation-log-detail-fields code { font: 11px/1.8 Consolas, monospace; }
.operation-log-detail-note { padding-top: 16px; border-top: 1px solid #e6edf2; color: #90a0ad; font-size: 11px; line-height: 1.8; }
@media (max-width: 1150px) { .operation-log-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } .operation-log-dates { grid-column: auto; } }
@media (max-width: 680px) { .operation-log-intro { align-items: start; } .operation-log-readonly { display: none; } .operation-log-filters { padding: 16px; gap: 14px; grid-template-columns: minmax(0, 1fr); } .operation-log-filter-actions { justify-content: flex-end; } .operation-log-pagination { flex-wrap: wrap; justify-content: flex-end; padding: 16px 10px; } .operation-log-pagination > span { width: 100%; } .operation-log-pagination :deep(.el-pagination) { flex-wrap: wrap; justify-content: flex-end; row-gap: 12px; } }
</style>
