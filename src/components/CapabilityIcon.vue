<script setup>
import { Connection, EditPen, Grid, Opportunity, SetUp, Tools, Van } from '@element-plus/icons-vue'

defineProps({ iconMode: { type: String, default: 'preset' }, iconName: { type: String, default: 'general' }, icon: { type: String, default: '' } })
const icons = { idea: Opportunity, engineering: SetUp, design: EditPen, fabrication: Tools, assembly: Connection, delivery: Van, general: Grid }
</script>

<template>
  <span class="capability-icon" aria-hidden="true">
    <el-image v-if="iconMode === 'image' && icon" :key="icon" :src="icon" fit="contain" alt="">
      <template #error><el-icon><component :is="icons[iconName] || Grid" /></el-icon></template>
    </el-image>
    <el-icon v-else><component :is="icons[iconName] || Grid" /></el-icon>
  </span>
</template>

<style scoped>
.capability-icon { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; flex-shrink: 0; color: #2375bf; }
.capability-icon > .el-image, .capability-icon .el-icon { display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 22px; }
</style>
