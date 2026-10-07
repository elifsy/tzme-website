<script setup>
import { OfficeBuilding } from '@element-plus/icons-vue'

defineProps({ icon: { type: String, default: '' } })
</script>

<template>
  <span class="industry-icon" aria-hidden="true">
    <el-image v-if="icon" :key="icon" :src="icon" fit="contain" alt="">
      <template #error><el-icon class="industry-icon-fallback"><OfficeBuilding /></el-icon></template>
    </el-image>
    <el-icon v-else class="industry-icon-fallback"><OfficeBuilding /></el-icon>
  </span>
</template>

<style scoped>
.industry-icon { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex-shrink: 0; color: #a4d7f7; }
.industry-icon > .el-image, .industry-icon-fallback { display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 20px; }
</style>
