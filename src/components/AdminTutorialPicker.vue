<script setup>
import { computed, ref } from 'vue';
import { adminGroups, adminModules } from '../data/adminWorkspace.js';
import { adminTutorials } from '../data/adminTutorial.js';
import { isSuperAdmin } from '../services/session.js';
defineProps({ modelValue: Boolean, currentModule: String, seen: { type: Object, default: () => ({}) }, busy: Boolean });
const emit = defineEmits(['update:modelValue', 'select']);
const search = ref('');
const groups = computed(() => adminGroups.map(group => ({ ...group,
  items: group.items.filter(item => adminTutorials[item.key] && (!item.superAdminOnly || isSuperAdmin.value)
    && item.label.includes(search.value.trim())).map(item => item.key),
})).filter(group => group.items.length));
</script>
<template>
  <el-dialog :model-value="modelValue" title="选择功能教程" class="admin-tutorial-picker" width="min(760px, calc(100vw - 24px))"
    align-center append-to-body destroy-on-close @update:model-value="emit('update:modelValue', $event)">
    <p class="admin-tutorial-picker-intro">每次只学习一个功能，可随时跳过或重新查看。</p>
    <el-input v-model="search" placeholder="搜索功能教程" clearable aria-label="搜索功能教程" />
    <div class="admin-tutorial-picker-groups">
      <section v-for="group in groups" :key="group.key">
        <h3>{{ group.label }}</h3>
        <button v-for="key in group.items" :key="key" type="button" :data-tutorial-module="key" :disabled="busy"
          :class="{ 'is-current': key === currentModule }" @click="emit('select', key)">
          <span><strong>{{ adminModules[key].label }}</strong><small>{{ adminTutorials[key].length }} 步<span v-if="key === currentModule"> · 当前页面</span></small></span>
          <span class="admin-tutorial-picker-action">{{ seen[key] ? '再看一次' : '开始学习' }} ↗</span>
        </button>
      </section>
    </div>
    <el-empty v-if="!groups.length" description="没有找到对应功能" :image-size="64" />
    <template #footer><span>完成或跳过后，该功能不会再自动开启教程。</span></template>
  </el-dialog>
</template>
<style>
.admin-tutorial-picker { display:flex; flex-direction:column; max-height:calc(100dvh - 24px); border-radius:16px; padding:22px; }
.admin-tutorial-picker .el-dialog__header,.admin-tutorial-picker .el-dialog__footer { flex-shrink:0; }
.admin-tutorial-picker .el-dialog__body { min-height:0; overflow:auto; }
.admin-tutorial-picker-intro { margin:0 0 16px; color:#6b8190; font-size:13px; }
.admin-tutorial-picker-groups { display:grid; grid-template-columns:1fr 1fr; gap:8px 20px; margin-top:18px; }
.admin-tutorial-picker-groups h3 { margin:12px 0 8px; color:#6b8190; font-size:12px; font-weight:500; }
.admin-tutorial-picker-groups button { display:flex; align-items:center; justify-content:space-between; gap:10px; width:100%; margin-bottom:7px; padding:12px; border:1px solid #e0e9f0; border-radius:9px; background:#fff; color:#21465d; text-align:left; font:inherit; cursor:pointer; }
.admin-tutorial-picker-groups button:hover,.admin-tutorial-picker-groups button.is-current { background:#f0f8fb; border-color:#a9d3df; }
.admin-tutorial-picker-groups button:focus-visible { outline:2px solid #238197; outline-offset:2px; }
.admin-tutorial-picker-groups strong { display:block; font-size:13px; font-weight:600; }
.admin-tutorial-picker-groups small { display:block; margin-top:5px; color:#7d919e; font-size:11px; }
.admin-tutorial-picker-action { flex-shrink:0; color:#238197; font-size:11px; }
.admin-tutorial-picker .el-dialog__footer { padding-top:16px; color:#80929e; font-size:12px; text-align:left; }
@media(max-width:560px) { .admin-tutorial-picker-groups { grid-template-columns:1fr; } .admin-tutorial-picker { padding:18px; } }
</style>
