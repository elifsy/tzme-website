<script setup>
import '../style/admin-editor.css'

defineProps({
  modelValue: Boolean,
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'EditPen' },
  width: { type: String, default: 'min(1100px, calc(100vw - 40px))' },
  status: { type: String, default: '' },
  saving: Boolean,
  saveDisabled: Boolean,
  editorFullscreen: Boolean,
  footerNote: { type: String, default: '' },
  saveLabel: { type: String, default: '' },
  showSave: { type: Boolean, default: true },
  closeLabel: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'save'])
</script>

<template>
  <el-dialog :model-value="modelValue" :title="title" :width="width"
    class="editor-dialog cms-editor-dialog" modal-class="cms-editor-overlay" append-to-body destroy-on-close
    :close-on-press-escape="!editorFullscreen" :close-on-click-modal="!editorFullscreen"
    @update:model-value="emit('update:modelValue', $event)">
    <template #header="{ titleId }">
      <div class="cms-editor-heading">
        <span class="cms-editor-heading-icon"><el-icon><component :is="icon" /></el-icon></span>
        <div class="cms-editor-heading-copy">
          <span class="cms-editor-eyebrow">{{ $t('admin.contentManager') }}</span>
          <h2 :id="titleId">{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </div>
        <el-tag v-if="status" :type="status === 'published' ? 'success' : 'info'" effect="light" round class="cms-editor-status">
          <span class="cms-status-dot"></span>{{ $t(status === 'published' ? 'admin.published' : 'admin.draft') }}
        </el-tag>
      </div>
    </template>
    <slot />
    <template #footer>
      <div class="cms-editor-footer">
        <span class="cms-editor-footer-note"><el-icon><CircleCheckFilled /></el-icon>{{ footerNote || $t('admin.editorSaveNote') }}</span>
        <div class="cms-editor-footer-actions">
          <el-button @click="emit('update:modelValue', false)">{{ closeLabel || $t('admin.cancel') }}</el-button>
          <el-button v-if="showSave" type="primary" :loading="saving" :disabled="saveDisabled" @click="emit('save')">
            <el-icon v-if="!saving"><CircleCheckFilled /></el-icon>{{ saveLabel || $t('admin.saveContent') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
