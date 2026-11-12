<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { Delete, Plus } from '@element-plus/icons-vue';
import { MAX_CONTACT_DEPARTMENTS } from '../data/contactDepartments.js';
const props = defineProps({ modelValue: { type: Array, required: true }, contact: { type: Object, required: true }, disabled: Boolean });
const emit = defineEmits(['update:modelValue']);
const expanded = ref('procurement');
const root = ref(null);
const sorting = ref(null), sortAnnouncement = ref('');
let scrollFrame = 0;
function dropTarget() {
  const state = sorting.value, list = root.value?.querySelector('.el-collapse');
  if (!state || !list) return;
  const bounds = list.getBoundingClientRect();
  if (state.x < bounds.left - 12 || state.x > bounds.right + 12 || state.y < bounds.top - 24 || state.y > bounds.bottom + 24) { state.target = ''; return; }
  const items = [...list.querySelectorAll('[data-department-editor]')];
  const target = items.find(item => item.getBoundingClientRect().bottom >= state.y) || items.at(-1);
  if (!target) return;
  const rect = target.getBoundingClientRect();
  state.target = target.dataset.departmentEditor;
  state.after = state.y > rect.top + rect.height / 2;
}
function autoScroll() {
  const state = sorting.value;
  if (!state?.active) return;
  const delta = state.y < 70 ? -Math.ceil((70 - state.y) / 5) : state.y > window.innerHeight - 70 ? Math.ceil((state.y - window.innerHeight + 70) / 5) : 0;
  if (delta) { window.scrollBy({ top: Math.max(-18, Math.min(18, delta)), behavior: 'instant' }); dropTarget(); }
  scrollFrame = requestAnimationFrame(autoScroll);
}
function startSort(event, item) {
  if (props.disabled || props.modelValue.length < 2 || event.button !== 0 || !event.isPrimary || sorting.value) return;
  event.currentTarget.focus({ preventScroll: true });
  event.currentTarget.setPointerCapture(event.pointerId);
  sorting.value = { id: item.id, title: item.title || '未命名分类', pointer: event.pointerId, handle: event.currentTarget, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, target: item.id, after: false, active: false };
}
function dragSort(event) {
  const state = sorting.value;
  if (!state || state.pointer !== event.pointerId) return;
  state.x = event.clientX; state.y = event.clientY;
  if (!state.active && Math.hypot(state.x - state.startX, state.y - state.startY) >= 5) {
    state.active = true;
    sortAnnouncement.value = `正在移动${state.title}，松开后调整顺序，按 Escape 取消。`;
    scrollFrame = requestAnimationFrame(autoScroll);
  }
  if (state.active) dropTarget();
}
function clearSort() {
  cancelAnimationFrame(scrollFrame);
  const state = sorting.value;
  sorting.value = null;
  if (state?.handle.hasPointerCapture(state.pointer)) state.handle.releasePointerCapture(state.pointer);
}
function cancelSort() { if (sorting.value?.active) sortAnnouncement.value = '已取消排序，原顺序保留。'; clearSort(); }
async function reorder(id, index) {
  if (props.disabled) return;
  const items = [...props.modelValue], from = items.findIndex(item => item.id === id);
  if (from < 0 || from === index) return;
  const [item] = items.splice(from, 1);
  items.splice(index, 0, item);
  emit('update:modelValue', items);
  sortAnnouncement.value = `${item.title || '未命名分类'}已移到第 ${index + 1} 项，共 ${items.length} 项。保存后应用到官网。`;
  await nextTick();
  root.value?.querySelector(`[data-department-sort-handle="${id}"]`)?.focus({ preventScroll: true });
}
function finishSort(event) {
  const state = sorting.value;
  if (!state || event.pointerId !== state.pointer) return;
  dropTarget();
  const from = props.modelValue.findIndex(item => item.id === state.id), target = props.modelValue.findIndex(item => item.id === state.target);
  const index = target + (state.after ? 1 : 0) - (from < target + (state.after ? 1 : 0) ? 1 : 0);
  clearSort();
  if (state.active && target >= 0 && state.target !== state.id) reorder(state.id, index);
}
function sortKeys(event, item) {
  if (event.key === 'Escape') { event.preventDefault(); cancelSort(); return; }
  if (props.disabled || sorting.value || !['ArrowUp', 'ArrowDown', 'Home', 'End', ' ', 'Enter'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === ' ' || event.key === 'Enter') { sortAnnouncement.value = '按上下方向键调整顺序，Home 移到第一项，End 移到最后一项。'; return; }
  const index = props.modelValue.findIndex(row => row.id === item.id);
  reorder(item.id, event.key === 'Home' ? 0 : event.key === 'End' ? props.modelValue.length - 1 : Math.max(0, Math.min(props.modelValue.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1))));
}
watch(() => props.disabled, value => { if (value) cancelSort(); });
onBeforeUnmount(clearSort);
function update(id, field, value) { emit('update:modelValue', props.modelValue.map(item => item.id === id ? { ...item, [field]: value } : item)); }
async function add() {
  if (props.disabled || props.modelValue.length >= MAX_CONTACT_DEPARTMENTS) return;
  const id = `department-${crypto.randomUUID()}`;
  emit('update:modelValue', [...props.modelValue, { id, title: '', description: '', phone: '', email: '', enabled: true }]);
  expanded.value = id;
  await nextTick();
  const input = root.value?.querySelector(`[data-department-field="${id}-title"]`);
  input?.focus();
}
function remove(id) {
  if (props.disabled) return;
  emit('update:modelValue', props.modelValue.filter(item => item.id !== id));
  if (expanded.value === id) expanded.value = '';
}
</script>

<template>
  <div ref="root" class="contact-departments-editor">
    <p class="cms-field-hint">按需新增联系分类，每个分类分别维护。电话或邮箱留空时使用通用联系方式，填写后仅替换对应渠道。联系方式会公开展示，请使用对外联系信息。</p>
    <div class="department-editor-toolbar"><span>已配置 {{ modelValue.length }} / {{ MAX_CONTACT_DEPARTMENTS }} 个分类<small>拖动左侧手柄排序，保存后应用到官网。</small></span><el-button :icon="Plus" :disabled="disabled || modelValue.length >= MAX_CONTACT_DEPARTMENTS" data-add-contact-department @click="add">新增联系分类</el-button></div>
    <span class="department-sort-status" role="status" aria-live="polite">{{ sortAnnouncement }}</span>
    <el-empty v-if="!modelValue.length" description="暂未添加联系分类，官网将显示通用联系方式。" :image-size="70" />
    <el-collapse v-model="expanded" accordion>
      <el-collapse-item v-for="item in modelValue" :key="item.id" :name="item.id" :data-department-editor="item.id" :class="{ 'is-sorting': sorting?.active && sorting.id === item.id, 'sort-before': sorting?.active && sorting.target === item.id && sorting.id !== item.id && !sorting.after, 'sort-after': sorting?.active && sorting.target === item.id && sorting.id !== item.id && sorting.after }">
        <template #title><span class="department-sort-handle" role="button" :tabindex="disabled || modelValue.length < 2 ? -1 : 0" :aria-disabled="disabled || modelValue.length < 2" :aria-label="`调整${item.title || '未命名分类'}的顺序，使用上下方向键或拖动`" title="拖动排序，也可聚焦后按上下方向键调整" :data-department-sort-handle="item.id" @pointerdown.stop.prevent="startSort($event, item)" @pointermove.stop.prevent="dragSort" @pointerup.stop.prevent="finishSort" @pointercancel.stop="cancelSort" @lostpointercapture="cancelSort" @click.stop.prevent @keydown.stop="sortKeys($event, item)"><svg viewBox="0 0 14 20" width="14" height="20" fill="currentColor" aria-hidden="true"><circle v-for="point in [[4,4],[10,4],[4,10],[10,10],[4,16],[10,16]]" :key="point.join('-')" :cx="point[0]" :cy="point[1]" r="1.5" /></svg></span><strong>{{ item.title || '待填写分类名称' }}</strong><span class="department-editor-state">{{ item.enabled ? '展示中' : '已关闭' }} · {{ !item.phone && !item.email ? '使用通用联系方式' : '已配置独立渠道' }}</span></template>
        <div class="department-editor-fields">
          <el-form-item label="分类名称" required><el-input :model-value="item.title" maxlength="40" placeholder="例如：客户服务" :disabled="disabled" :data-department-field="`${item.id}-title`" @update:model-value="update(item.id, 'title', $event)" /></el-form-item>
          <el-form-item label="事项说明"><el-input :model-value="item.description" type="textarea" :rows="2" maxlength="300" show-word-limit :disabled="disabled" :data-department-field="`${item.id}-description`" @update:model-value="update(item.id, 'description', $event)" /></el-form-item>
          <div class="department-editor-channels">
            <el-form-item label="独立联系电话"><el-input :model-value="item.phone" maxlength="255" :placeholder="contact.phone || '留空使用通用电话'" :disabled="disabled" :data-department-field="`${item.id}-phone`" @update:model-value="update(item.id, 'phone', $event)" /></el-form-item>
            <el-form-item label="独立联系邮箱"><el-input :model-value="item.email" maxlength="255" type="email" :placeholder="contact.emails[0] || '留空使用通用邮箱'" :disabled="disabled" :data-department-field="`${item.id}-email`" @update:model-value="update(item.id, 'email', $event)" /></el-form-item>
          </div>
          <el-form-item label="在联系页显示"><el-switch :model-value="item.enabled" :disabled="disabled" :aria-label="`${item.title}在联系页显示`" @update:model-value="update(item.id, 'enabled', $event)" /></el-form-item>
          <div class="department-editor-actions"><el-popconfirm :title="`确定删除“${item.title || '未命名'}”分类？保存后生效。`" confirm-button-text="删除" cancel-button-text="取消" width="260" @confirm="remove(item.id)"><template #reference><el-button text type="danger" :icon="Delete" :disabled="disabled" :data-remove-contact-department="item.id">删除分类</el-button></template></el-popconfirm></div>
        </div>
      </el-collapse-item>
    </el-collapse>
    <Teleport to="body"><div v-if="sorting?.active" class="department-sort-ghost" :style="{ left: `${Math.max(8, Math.min(sorting.x + 14, root.ownerDocument.defaultView.innerWidth - 258))}px`, top: `${Math.max(8, Math.min(sorting.y + 14, root.ownerDocument.defaultView.innerHeight - 58))}px` }" aria-hidden="true"><span>↕</span><strong>{{ sorting.title }}</strong></div></Teleport>
  </div>
</template>

<style scoped>
.contact-departments-editor > p { margin:0 0 20px; }
.department-editor-toolbar { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; color:#79939f; font-size:12px; }
.department-editor-toolbar > span { flex:1 1 200px; min-width:0; }
.department-editor-toolbar :deep(.el-button) { margin-left:auto; }
.department-editor-toolbar small { display:block; margin-top:5px; font-size:11px; line-height:1.7; }
.department-sort-status { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
.department-sort-handle { display:inline-flex; justify-content:center; align-items:center; flex:none; width:28px; height:32px; margin-left:-6px; border-radius:5px; color:#91aab5; cursor:grab; touch-action:none; user-select:none; }
.department-sort-handle:hover { background:#e5f1f4; color:#118397; }
.department-sort-handle:active { cursor:grabbing; }
.department-sort-handle:focus-visible { outline:2px solid #118397; outline-offset:2px; }
.department-sort-handle[aria-disabled=true] { cursor:default; opacity:.4; }
.department-sort-ghost { position:fixed; z-index:5000; display:flex; align-items:center; gap:14px; width:250px; max-width:calc(100vw - 16px); min-height:46px; padding:10px 16px; box-sizing:border-box; border:1px solid #74acb9; border-radius:8px; background:#f0fafb; color:#235367; box-shadow:0 8px 24px #183f522a; pointer-events:none; font-size:14px; }
.department-sort-ghost strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.contact-departments-editor :deep(.el-collapse) { border:0; }
.contact-departments-editor :deep(.el-collapse-item) { position:relative; margin-bottom:12px; border:1px solid #dce7ec; border-radius:8px; overflow:hidden; }
.contact-departments-editor :deep(.el-collapse-item.is-sorting) { opacity:.45; }
.contact-departments-editor :deep(.sort-before::before),.contact-departments-editor :deep(.sort-after::after) { content:''; position:absolute; z-index:1; left:0; right:0; height:3px; background:#09869a; pointer-events:none; }
.contact-departments-editor :deep(.sort-before::before) { top:0; }
.contact-departments-editor :deep(.sort-after::after) { bottom:0; }
.contact-departments-editor :deep(.el-collapse-item__header) { min-height:56px; height:auto; padding:12px 15px; border:0; line-height:1.7; gap:12px; background:#f7fafb; }
.contact-departments-editor :deep(.el-collapse-item__header strong) { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#285366; font-size:14px; }
.contact-departments-editor :deep(.el-collapse-item__title) { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
.department-editor-state { margin-left:auto; color:#79939f; font-size:11px; text-align:right; }
.department-editor-fields { padding:20px 16px 0; }
.department-editor-actions { display:flex; justify-content:flex-end; padding:10px 0 14px; border-top:1px solid #e8eff2; }
.contact-departments-editor :deep(.el-collapse-item__content) { padding-bottom:0; }
.department-editor-channels { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
@media (max-width:760px) {
 .department-editor-channels { grid-template-columns:1fr; gap:0; }
 .contact-departments-editor :deep(.el-collapse-item__title) { display:grid; grid-template-columns:28px minmax(0,1fr); column-gap:10px; row-gap:4px; }
 .department-sort-handle { grid-row:1 / 3; }
 .department-editor-state { grid-column:2; margin-left:0; text-align:left; line-height:1.6; }
}
</style>
