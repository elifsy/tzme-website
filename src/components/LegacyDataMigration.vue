<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { exportLegacyData, legacyChanges, migrateLegacyData } from '../services/legacyMigration.js'

const emit = defineEmits(['migrated'])
const { t } = useI18n({ useScope: 'global' })
const pending = ref(legacyChanges())
const importing = ref(false)
const reviewing = ref(false)
async function importData() {
  importing.value = true
  try {
    const result = await migrateLegacyData()
    pending.value = legacyChanges()
    if (result.failed.length) ElMessage.error(t('admin.legacyMigrationFailed', { count: result.failed.length }))
    else { ElMessage.success(t('admin.legacyMigrationDone', { count: result.imported })); reviewing.value = false }
    emit('migrated')
  } catch { ElMessage.error(t('admin.apiWriteFailed')) }
  finally { importing.value = false }
}
</script>

<template>
  <el-alert v-if="pending.length" type="warning" show-icon :closable="false" class="legacy-migration"
    :title="$t('admin.legacyDataFound', { count: pending.length })" :description="$t('admin.legacyDataHint')">
    <el-button size="small" @click="exportLegacyData">{{ $t('admin.legacyExport') }}</el-button>
    <el-button type="primary" size="small" @click="reviewing = true">{{ $t('admin.legacyReview') }}</el-button>
  </el-alert>
  <el-dialog v-model="reviewing" :title="$t('admin.legacyReview')" width="min(760px, 94vw)" append-to-body :close-on-click-modal="!importing" :show-close="!importing">
    <p>{{ $t('admin.legacyDataHint') }}</p>
    <el-table :data="pending" max-height="400">
      <el-table-column :label="$t('admin.legacyRecord')" min-width="180">
        <template #default="{ row }">{{ row.record?.titleZh || row.record?.titleEn || row.record?.title || row.id }}</template>
      </el-table-column>
      <el-table-column prop="id" label="ID" min-width="160" />
      <el-table-column :label="$t('admin.actions')" width="110">
        <template #default="{ row }">{{ $t(row.action === 'delete' ? 'admin.delete' : 'admin.saveContent') }}</template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button :disabled="importing" @click="exportLegacyData">{{ $t('admin.legacyExport') }}</el-button>
      <el-button type="primary" :loading="importing" @click="importData">{{ $t('admin.legacyImport') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.legacy-migration { margin-bottom: 24px; }
.legacy-migration :deep(.el-alert__description) { margin: 10px 0; }
</style>
