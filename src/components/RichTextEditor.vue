<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, useZIndex } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { i18nChangeLanguage } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import { sanitizeRichText } from '../utils/richText.js'
import { IMAGE_ACCEPT, MAX_IMAGE_SIZE, uploadImageFile, validateImageFile } from '../services/imageUpload.js'
import { imageRecommendations } from '../config/imageUploads.js'

const props = defineProps({ modelValue: { type: String, default: '' }, placeholder: { type: String, default: '' }, showTocHint: { type: Boolean, default: true } })
const emit = defineEmits(['update:modelValue', 'uploading', 'fullscreen-change'])
const { t, locale } = useI18n({ useScope: 'global' })
const editorRef = shallowRef()
const editorContainer = ref(null)
const fullscreenTarget = shallowRef(document.body)
const fullscreen = ref(false)
const fullscreenZIndex = ref(0)
const normalHeight = ref(380)
const { nextZIndex } = useZIndex()
let resizeObserver
const valueHtml = ref(sanitizeRichText(props.modelValue))
const uploads = new Set()
let destroyed = false
i18nChangeLanguage(locale.value === 'zh' ? 'zh-CN' : 'en')

watch(valueHtml, (value) => emit('update:modelValue', value), { flush: 'sync' })
watch(() => props.modelValue, (value) => {
  if (value !== valueHtml.value) valueHtml.value = sanitizeRichText(value)
})
const toolbarConfig = {
  toolbarKeys: ['headerSelect', 'blockquote', '|', 'bold', 'italic', 'underline', 'through',
    'color', 'bgColor', 'fontSize', 'clearStyle', '|', 'bulletedList', 'numberedList',
    'justifyLeft', 'justifyCenter', 'justifyRight', '|', 'insertLink',
    'uploadImage', 'insertTable', 'divider', '|', 'undo', 'redo', 'fullScreen'],
}
const editorConfig = {
  placeholder: props.placeholder,
  scroll: true,
  hoverbarKeys: { image: { menuKeys: ['imageWidth30', 'imageWidth50', 'imageWidth100', 'deleteImage'] } },
  MENU_CONF: {
    uploadImage: {
      maxFileSize: MAX_IMAGE_SIZE,
      allowedFileTypes: IMAGE_ACCEPT.split(','),
      async customUpload(file, insertFn) {
        try { validateImageFile(file) } catch {
          ElMessage.warning(t('admin.richImageLimit'))
          return
        }
        const controller = new AbortController()
        uploads.add(controller)
        emit('uploading', true)
        try {
          const result = await uploadImageFile(file, { signal: controller.signal })
          if (!destroyed) insertFn(result.url, file.name, '')
        } catch (error) {
          if (error.name !== 'AbortError' && !destroyed) ElMessage.error(t('admin.richImageUploadFailed'))
        } finally {
          uploads.delete(controller)
          if (!destroyed) emit('uploading', uploads.size > 0)
        }
      },
    },
  },
}
function customAlert(message, type) {
  ElMessage({ message, type: ['success', 'warning', 'error', 'info'].includes(type) ? type : 'info' })
}
function handleCreated(editor) {
  editorRef.value = editor
  // Stay within the dialog's focus trap while moving outside its scrolling body and tabs.
  fullscreenTarget.value = editorContainer.value?.closest('.el-dialog') || document.body
  editor.on('fullScreen', enterFullscreen)
  editor.on('unFullScreen', leaveFullscreen)
}
function enterFullscreen() {
  if (destroyed) return
  fullscreenZIndex.value = nextZIndex()
  fullscreen.value = true
  emit('fullscreen-change', true)
  nextTick(() => { if (!destroyed) editorRef.value?.focus() })
}
function leaveFullscreen() {
  if (destroyed) return
  fullscreen.value = false
  emit('fullscreen-change', false)
  nextTick(() => { if (!destroyed) editorRef.value?.focus() })
}
function exitFullscreen() {
  editorRef.value?.hidePanelOrModal()
  editorRef.value?.unFullScreen()
}
function handleEscape(event) {
  if (event.key !== 'Escape' || !fullscreen.value) return
  event.preventDefault()
  event.stopImmediatePropagation()
  exitFullscreen()
}
onMounted(() => {
  window.addEventListener('keydown', handleEscape, true)
  resizeObserver = new ResizeObserver(([entry]) => {
    if (!fullscreen.value && entry?.borderBoxSize?.[0]) normalHeight.value = entry.borderBoxSize[0].blockSize
    else if (!fullscreen.value && editorContainer.value) normalHeight.value = editorContainer.value.offsetHeight
  })
  if (editorContainer.value) resizeObserver.observe(editorContainer.value)
})
onBeforeUnmount(() => {
  destroyed = true
  window.removeEventListener('keydown', handleEscape, true)
  resizeObserver?.disconnect()
  editorRef.value?.off('fullScreen', enterFullscreen)
  editorRef.value?.off('unFullScreen', leaveFullscreen)
  emit('fullscreen-change', false)
  uploads.forEach((controller) => controller.abort())
  emit('uploading', false)
  editorRef.value?.destroy()
})
</script>

<template>
  <div class="rich-editor-wrap">
    <div class="rich-editor-slot" :style="fullscreen ? { height: `${normalHeight}px` } : undefined">
      <Teleport :to="fullscreenTarget" :disabled="!fullscreen">
        <div ref="editorContainer" class="rich-editor" :style="fullscreen ? { zIndex: fullscreenZIndex } : undefined">
          <div v-if="fullscreen" class="rich-editor-fullscreen-actions">
            <span>{{ $t('admin.richEditorFullscreenHint') }}</span>
            <el-button size="small" @click="exitFullscreen">{{ $t('admin.exitRichEditorFullscreen') }}</el-button>
          </div>
          <Toolbar :editor="editorRef" :default-config="toolbarConfig" mode="default" />
          <Editor v-model="valueHtml" :default-config="editorConfig" mode="default"
            class="rich-editor-content" @on-created="handleCreated" @custom-alert="customAlert" />
        </div>
      </Teleport>
    </div>
    <p class="rich-editor-hint">{{ $t('admin.richEditorHint') }}</p>
    <p class="rich-image-hint"><strong>{{ $t('admin.imageRecommendation', imageRecommendations.body) }}</strong> · {{ $t('admin.imageBodyHint') }}</p>
    <el-alert v-if="showTocHint" class="rich-editor-toc-hint" type="info" :closable="false" show-icon
      :title="$t('admin.articleTocRuleTitle')" :description="$t('admin.articleTocRuleDescription')" />
  </div>
</template>

<style>
.rich-editor-wrap { width: 100%; min-width: 0; }
.rich-editor { border: 1px solid #dcdfe6; border-radius: 5px; color: #303133; background: #fff; position: relative; z-index: 1; font-family: Inter, "Segoe UI", "Microsoft YaHei", sans-serif; font-size: 14px; line-height: 1.5; --el-color-primary: #2f74d0; }
.rich-editor .w-e-toolbar { border-bottom: 1px solid #e4e7ed; border-radius: 5px 5px 0 0; }
.rich-editor .w-e-bar { flex-wrap: wrap; }
.rich-editor-content { height: 380px; overflow-y: hidden; }
.rich-editor .w-e-text-container { border-radius: 0 0 5px 5px; }
.rich-editor.w-e-full-screen-container { position: fixed; height: 100dvh !important; border-radius: 0; border: 0; box-sizing: border-box; overflow: hidden; }
.rich-editor.w-e-full-screen-container .rich-editor-content { height: auto; min-height: 0; flex: 1; }
.rich-editor.w-e-full-screen-container > :not(.rich-editor-content) { flex-shrink: 0; }
.rich-editor-fullscreen-actions { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 16px; background: #f5f7fa; border-bottom: 1px solid #e4e7ed; }
.rich-editor-fullscreen-actions span { color: #606266; font-size: 12px; }
/* Keep the dialog's keyboard focus on visible editor controls while fullscreen is active. */
.editor-dialog:has(> .rich-editor.w-e-full-screen-container) > :is(.el-dialog__header, .el-dialog__body, .el-dialog__footer) { visibility: hidden; }
.rich-editor-hint { color: #909399; font-size: 12px; line-height: 1.6; margin: 8px 0 0; }
.rich-image-hint { color: #455b73; font-size: 12px; line-height: 1.7; margin: 8px 0 0; }
.rich-image-hint strong { color: #234c7e; font-weight: 600; }
.rich-editor-toc-hint { margin-top: 12px; }
@media (max-width: 640px) { .rich-editor-content { height: 320px; } }
</style>
