<script setup>
import { onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElConfigProvider } from 'element-plus'
import elementEn from 'element-plus/es/locale/lang/en'
import elementZh from 'element-plus/es/locale/lang/zh-cn'
import { loadWebsiteContent } from './services/website.js'
import { loadContactSettings } from './services/contactSettings.js'
import { dataErrors, retryFailedData } from './services/api.js'

const { locale } = useI18n({ useScope: 'global' })
const ready = ref(false)
const loading = ref(true)
const retrying = ref(false)
async function initialize() {
  loading.value = true
  try { ready.value = (await Promise.all([loadWebsiteContent(), loadContactSettings()])).every(Boolean) }
  finally { loading.value = false }
}
async function retry() {
  retrying.value = true
  try { await retryFailedData() } finally { retrying.value = false }
}
onMounted(initialize)
</script>

<template>
  <el-config-provider :locale="locale === 'zh' ? elementZh : elementEn">
    <template v-if="ready">
      <el-alert v-if="dataErrors.size" type="error" show-icon :closable="false" class="database-error"
        :title="$t('admin.databaseReadFailed')">
        <el-button size="small" :loading="retrying" @click="retry">{{ $t('admin.retryDatabase') }}</el-button>
      </el-alert>
      <RouterView />
    </template>
    <div v-else class="database-boot">
      <el-skeleton v-if="loading" :rows="5" animated class="database-skeleton" />
      <el-result v-else icon="error" :title="$t('admin.databaseUnavailable')" :sub-title="$t('admin.databaseInitializeHint')">
        <template #extra><el-button type="primary" @click="initialize">{{ $t('admin.retryDatabase') }}</el-button></template>
      </el-result>
    </div>
  </el-config-provider>
</template>

<style scoped>
.database-boot { display: grid; place-items: center; min-height: 100vh; padding: 24px; box-sizing: border-box; background: #f3f6fa; }
.database-skeleton { width: min(680px, 100%); }
.database-error { border-radius: 0; }
.database-error :deep(.el-alert__description) { margin-top: 10px; }
</style>
