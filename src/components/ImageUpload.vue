<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Picture, UploadFilled } from '@element-plus/icons-vue'
import { imageRecommendations } from '../config/imageUploads.js'
import { IMAGE_ACCEPT, uploadImageFile, validateImageFile } from '../services/imageUpload.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  kind: { type: String, default: 'product' },
  disabled: Boolean,
  active: { type: Boolean, default: true },
  contextKey: { type: String, default: '' },
  clearable: { type: Boolean, default: true },
  alt: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'uploading'])
const { t } = useI18n({ useScope: 'global' })
const uploading = ref(false)
const dimensions = ref(null)
const recommendation = computed(() => imageRecommendations[props.kind] || imageRecommendations.product)
let request
let disposed = false

function cancelUpload() {
  request?.abort()
  request = undefined
  uploading.value = false
  emit('uploading', false)
}
watch(() => [props.active, props.contextKey, props.kind], ([active, context, kind], [, previousContext, previousKind]) => {
  if (!active || context !== previousContext || kind !== previousKind) cancelUpload()
})
watch(() => props.modelValue, () => {
  dimensions.value = null
  if (uploading.value) cancelUpload()
})
function onImageLoad(event) {
  const image = event.target
  if (image?.naturalWidth && image?.naturalHeight) dimensions.value = { width: image.naturalWidth, height: image.naturalHeight }
}
function beforeUpload(file) {
  if (props.disabled || uploading.value || !props.active) return false
  try { validateImageFile(file); return true }
  catch { ElMessage.warning(t('admin.richImageLimit')); return false }
}
async function upload({ file }) {
  if (uploading.value || props.disabled || !props.active) throw new DOMException('Upload canceled', 'AbortError')
  const controller = new AbortController()
  request = controller
  uploading.value = true
  emit('uploading', true)
  try {
    const result = await uploadImageFile(file, { signal: controller.signal })
    if (!disposed && request === controller && props.active) emit('update:modelValue', result.url)
    return result
  } catch (error) {
    if (!disposed && request === controller && error.name !== 'AbortError') ElMessage.error(t('admin.richImageUploadFailed'))
    throw error
  } finally {
    if (request === controller) {
      request = undefined
      uploading.value = false
      if (!disposed) emit('uploading', false)
    }
  }
}
onBeforeUnmount(() => { disposed = true; cancelUpload() })
</script>

<template>
  <div class="image-upload" :class="`image-upload-${kind}`" :aria-busy="uploading">
    <div class="image-upload-preview">
      <el-image v-if="modelValue" :key="modelValue" :src="modelValue" :alt="alt || $t('admin.editorImagePreview')"
        :fit="recommendation.fit" @load="onImageLoad">
        <template #error><div class="image-upload-empty"><el-icon><Picture /></el-icon><span>{{ $t('admin.editorImageError') }}</span></div></template>
      </el-image>
      <div v-else class="image-upload-empty"><el-icon><Picture /></el-icon><span>{{ $t('admin.editorImagePreview') }}</span></div>
    </div>
    <div class="image-upload-details">
      <el-upload drag :accept="IMAGE_ACCEPT" :show-file-list="false" :before-upload="beforeUpload" :http-request="upload"
        :disabled="disabled || uploading || !active" class="image-upload-picker">
        <el-button type="primary" plain :loading="uploading" :disabled="disabled || uploading || !active">
          <el-icon v-if="!uploading"><UploadFilled /></el-icon>{{ $t(modelValue ? 'admin.imageReplace' : 'admin.imageChoose') }}
        </el-button>
        <span class="image-upload-drop-hint">{{ $t('admin.imageDropHint') }}</span>
      </el-upload>
      <div v-if="modelValue" class="image-upload-current" aria-live="polite">
        <span v-if="dimensions">{{ $t('admin.imageCurrentDimensions', dimensions) }}</span>
        <el-button v-if="clearable" text type="danger" size="small" :disabled="disabled || uploading || !active" @click="emit('update:modelValue', '')">
          {{ $t('admin.imageRemove') }}
        </el-button>
      </div>
      <div class="image-upload-guidance">
        <strong>{{ $t('admin.imageRecommendation', recommendation) }}</strong>
        <p>{{ $t(recommendation.hint) }}</p>
        <p>{{ $t('admin.imageFormatHint') }}</p>
        <p>{{ $t('admin.imageSaveHint') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-upload { display: flex; flex-direction: column; gap: 10px; width: 100%; min-width: 0; }
.image-upload-details { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.image-upload-preview { height: 160px; overflow: hidden; border: 1px solid #dfe7f0; border-radius: 9px; background: #f3f6fa; }
.image-upload-certification .image-upload-preview { height: 240px; }
.image-upload-map .image-upload-preview { height: auto; aspect-ratio: 16 / 7; }
.image-upload-socialIcon, .image-upload-industryIcon { display: grid; grid-template-columns: 128px minmax(0, 1fr); gap: 16px; align-items: stretch; }
.image-upload-socialIcon .image-upload-preview, .image-upload-industryIcon .image-upload-preview { display: flex; align-items: center; justify-content: center; height: auto; min-height: 128px; background: #06131c; }
.image-upload-socialIcon .image-upload-empty, .image-upload-industryIcon .image-upload-empty { color: #c1cfdb; }
.image-upload-socialIcon .image-upload-preview > .el-image, .image-upload-industryIcon .image-upload-preview > .el-image { width: 64px; height: 64px; flex-shrink: 0; }
.image-upload-preview > .el-image { display: block; width: 100%; height: 100%; }
.image-upload-capabilityIcon { display: grid; grid-template-columns: 128px minmax(0, 1fr); gap: 16px; align-items: stretch; }
.image-upload-capabilityIcon .image-upload-preview { display: flex; align-items: center; justify-content: center; height: auto; min-height: 128px; }
.image-upload-capabilityIcon .image-upload-preview > .el-image { width: 64px; height: 64px; flex-shrink: 0; }
.image-upload-empty { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; height: 100%; padding: 16px; box-sizing: border-box; color: #52657c; font-size: 12px; text-align: center; }
.image-upload-empty .el-icon { font-size: 28px; }
.image-upload-picker :deep(.el-upload), .image-upload-picker :deep(.el-upload-dragger) { width: 100%; }
.image-upload-picker :deep(.el-upload-dragger) { padding: 13px 10px; border-radius: 9px; background: #fbfdff; }
.image-upload-picker :deep(.el-upload-dragger:focus-within) { outline: 2px solid #3273ce; outline-offset: 2px; }
.image-upload-drop-hint { display: block; margin-top: 6px; color: #52657c; font-size: 12px; line-height: 1.6; }
.image-upload-current { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; color: #52657c; font-size: 12px; }
.image-upload-current .el-button { margin-left: auto; }
.image-upload-guidance { padding: 12px; border: 1px solid #dce7f5; border-radius: 8px; background: #f2f7fd; }
.image-upload-guidance strong { display: block; color: #234c7e; font-size: 12px; font-weight: 600; line-height: 1.6; }
.image-upload-guidance p { margin: 5px 0 0; color: #455b73; font-size: 12px; line-height: 1.7; }
@media (max-width: 600px) {
  .image-upload-socialIcon, .image-upload-industryIcon, .image-upload-capabilityIcon { grid-template-columns: minmax(0, 1fr); }
  .image-upload-socialIcon .image-upload-preview, .image-upload-industryIcon .image-upload-preview, .image-upload-capabilityIcon .image-upload-preview { height: 128px; }
}
</style>
