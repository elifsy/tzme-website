<script setup>
import { computed, ref } from 'vue'
import { FullScreen, Monitor, Iphone } from '@element-plus/icons-vue'
import AdminPreviewViewport from './AdminPreviewViewport.vue'
const props = defineProps({ title: { type: String, default: '官网效果预览' }, source: { type: String, default: '' }, publicPath: { type: String, default: '' }, initialDevice: { type: String, default: '' } })
const device = ref(props.initialDevice || (props.source ? 'desktop' : 'mobile')), expanded = ref(false)
const width = computed(() => device.value === 'mobile' ? 390 : 1440)
defineExpose({ open: () => { expanded.value = true } })
</script>

<template>
  <section class="admin-preview-frame">
    <div class="admin-preview-heading"><div><h3>{{ title }}</h3><p>{{ source ? '展示已保存到官网的内容' : '随填写实时更新，保存后应用到官网' }}</p></div><span class="admin-preview-badge">{{ source ? '已保存页面' : '实时预览' }}</span></div>
    <div class="admin-preview-toolbar">
      <div class="admin-preview-devices" role="group" aria-label="选择预览设备"><button type="button" :aria-pressed="device === 'desktop'" @click="device = 'desktop'"><el-icon><Monitor /></el-icon>桌面</button><button type="button" :aria-pressed="device === 'mobile'" @click="device = 'mobile'"><el-icon><Iphone /></el-icon>手机</button></div>
      <el-button text :icon="FullScreen" class="admin-preview-expand" @click="expanded = true">放大</el-button>
    </div>
    <AdminPreviewViewport :width="width" :source="source"><slot /></AdminPreviewViewport>
    <div class="admin-preview-note"><span>{{ width }} px · 按真实视口比例展示</span><a v-if="publicPath || source" :href="publicPath || source" target="_blank" rel="noopener noreferrer">查看已保存网页 ↗</a></div>
    <el-dialog v-model="expanded" class="admin-preview-dialog" :title="title" width="min(1500px, calc(100vw - 32px))" top="20px" append-to-body destroy-on-close>
      <div class="admin-preview-toolbar"><div class="admin-preview-devices" role="group" aria-label="选择放大预览设备"><button type="button" :aria-pressed="device === 'desktop'" @click="device = 'desktop'"><el-icon><Monitor /></el-icon>桌面</button><button type="button" :aria-pressed="device === 'mobile'" @click="device = 'mobile'"><el-icon><Iphone /></el-icon>手机</button></div><span class="admin-preview-dialog-hint">{{ source ? '已保存页面' : '当前未保存内容' }} · {{ width }} px</span></div>
      <AdminPreviewViewport v-if="expanded" :width="width" :source="source" max-height="calc(100dvh - 180px)"><slot /></AdminPreviewViewport>
    </el-dialog>
  </section>
</template>

<style scoped>
.admin-preview-frame { min-width: 0; padding: 20px; border: 1px solid #dee7ee; border-radius: 13px; background: #fff; }
.admin-preview-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }.admin-preview-heading h3 { margin: 0; color: #29465c; font-size: 14px; line-height: 1.6; }.admin-preview-heading p { color: #6b8092; font-size: 11px; line-height: 1.7; margin: 4px 0 0; }
.admin-preview-badge { flex-shrink: 0; padding: 4px 7px; border-radius: 5px; background: #eaf5f1; color: #45836e; font-size: 10px; }
.admin-preview-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 18px 0 14px; }
.admin-preview-devices { display: flex; gap: 3px; padding: 3px; border-radius: 7px; background: #eff3f7; }.admin-preview-devices button { display: flex; align-items: center; gap: 6px; min-height: 30px; padding: 5px 11px; background: transparent; border: 0; border-radius: 5px; color: #64798b; font: inherit; font-size: 12px; line-height: 1.5; cursor: pointer; }.admin-preview-devices button[aria-pressed=true] { background: #fff; color: #14778b; box-shadow: 0 1px 4px #28475c10; }.admin-preview-devices button:focus-visible { outline: 2px solid #14778b; outline-offset: 2px; }
.admin-preview-expand.el-button { font-size: 11px; padding: 6px; }.admin-preview-note { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 7px; margin-top: 12px; color: #758a9b; font-size: 10px; line-height: 1.7; }.admin-preview-note a { color: #14778b; text-decoration: none; }.admin-preview-dialog-hint { color: #6b8092; font-size: 12px; }
</style>
