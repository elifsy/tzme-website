<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { uploadArticleAttachment } from '../services/articleAttachments.js';
import { ARTICLE_ATTACHMENT_ACCEPT, MAX_ARTICLE_ATTACHMENTS, attachmentSize, validateArticleAttachment } from '../utils/articleAttachments.js';

const props = defineProps({
  modelValue: { type: Array, default: () => [] }, disabled: Boolean,
  active: Boolean, contextKey: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'uploading']);
const picker = ref(null), uploading = ref(false), dragging = ref(false), progress = ref('');
const canUpload = computed(() => props.active && !props.disabled && !uploading.value && props.modelValue.length < MAX_ARTICLE_ATTACHMENTS);
let request, generation = 0;
function cancel() {
  generation++; request?.abort(); request = undefined;
  uploading.value = false; dragging.value = false; emit('uploading', false);
}
watch(() => [props.active, props.contextKey], cancel);
onBeforeUnmount(cancel);
async function upload(files) {
  if (!canUpload.value || !files.length) return;
  if (props.modelValue.length + files.length > MAX_ARTICLE_ATTACHMENTS) { ElMessage.warning('每篇资讯最多上传 10 个附件。'); return; }
  try { files.forEach(validateArticleAttachment); }
  catch (error) { ElMessage.warning(error.message); return; }
  const current = ++generation;
  uploading.value = true; emit('uploading', true);
  try {
    for (let index = 0; index < files.length; index++) {
      if (current !== generation || !props.active) return;
      progress.value = `正在上传 ${index + 1} / ${files.length}：${files[index].name}`;
      request = new AbortController();
      const result = await uploadArticleAttachment(files[index], { signal: request.signal });
      if (current !== generation || !props.active) return;
      emit('update:modelValue', [...props.modelValue, result]);
    }
  } catch (error) {
    if (current === generation && error.name !== 'AbortError') ElMessage.error(error.message);
  } finally {
    if (current === generation) { request = undefined; uploading.value = false; emit('uploading', false); }
  }
}
function select(event) { const files = [...event.target.files]; event.target.value = ''; upload(files); }
function drop(event) { dragging.value = false; upload([...event.dataTransfer.files]); }
function remove(index) { if (!props.disabled && !uploading.value) emit('update:modelValue', props.modelValue.filter((_, position) => position !== index)); }
</script>

<template>
  <div class="article-attachments-upload" :aria-busy="uploading">
    <input ref="picker" class="attachment-file-input" type="file" multiple :accept="ARTICLE_ATTACHMENT_ACCEPT" :disabled="!canUpload" aria-label="选择资讯附件" @change="select" />
    <button type="button" class="attachment-upload-zone" :class="{ 'is-dragging': dragging }" :disabled="!canUpload"
      @click="picker.click()" @dragover.prevent="dragging = canUpload" @dragleave.prevent="dragging = false" @drop.prevent="drop">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M7 18H5a3 3 0 0 1-.6-5.94A7 7 0 0 1 18 8a5 5 0 0 1 1 9.9h-2M12 21V10m-4 4 4-4 4 4" /></svg>
      <strong>{{ uploading ? '附件上传中…' : modelValue.length >= MAX_ARTICLE_ATTACHMENTS ? '已达到附件数量上限' : '点击或拖拽文件到这里上传' }}</strong>
      <span>可一次选择多个文件，最多 10 个；单个文件不超过 20 MB</span>
    </button>
    <p v-if="uploading" class="attachment-upload-status" role="status">{{ progress }}</p>
    <p class="cms-field-hint">支持 PDF、Word、Excel、PPT、ZIP、DWG / DXF、JPG / PNG。保存后会显示在官网详情页的“资料下载”中。</p>
    <ul v-if="modelValue.length" class="attachment-upload-list">
      <li v-for="(file, index) in modelValue" :key="file.id">
        <span class="attachment-extension">{{ file.extension?.toUpperCase() || '文件' }}</span>
        <div><a :href="file.url" :download="file.name">{{ file.name }}</a><span>{{ attachmentSize(file.size) }}</span></div>
        <button type="button" :disabled="disabled || uploading" :aria-label="`移除附件：${file.name}`" @click="remove(index)">移除</button>
      </li>
    </ul>
    <p v-if="modelValue.length" class="cms-field-hint">移除或新增附件后，请保存文章使修改生效。</p>
  </div>
</template>

<style scoped>
.article-attachments-upload { width: 100%; }
.attachment-file-input { display: none; }
.attachment-upload-zone { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:9px; width:100%; padding:25px 16px; border:1px dashed #adc5d9; border-radius:9px; background:#f7fafd; color:#49647c; cursor:pointer; font:inherit; }
.attachment-upload-zone:hover,.attachment-upload-zone.is-dragging { border-color:#4387cf; background:#eef6ff; }
.attachment-upload-zone:disabled { cursor:default; opacity:.65; }
.attachment-upload-zone svg { width:28px; height:28px; color:#5f91bf; }
.attachment-upload-zone strong { font-size:14px; font-weight:500; }
.attachment-upload-zone span,.attachment-upload-status { font-size:12px; line-height:1.6; }
.attachment-upload-status { overflow-wrap:anywhere; color:#337ecc; }
.attachment-upload-list { margin:16px 0 0; padding:0; list-style:none; display:grid; gap:9px; }
.attachment-upload-list li { display:flex; align-items:center; gap:12px; padding:12px; border:1px solid #e0e8f0; border-radius:7px; }
.attachment-extension { flex:none; color:#4c79a0; font-size:10px; background:#f0f5fa; padding:6px; border-radius:4px; }
.attachment-upload-list li div { flex:1; min-width:0; display:grid; gap:4px; }
.attachment-upload-list a { color:#325d86; text-decoration:none; font-size:13px; overflow-wrap:anywhere; }
.attachment-upload-list li div span { color:#8a99a9; font-size:11px; }
.attachment-upload-list button { border:0; background:none; color:#d46a6a; padding:6px; cursor:pointer; font:inherit; font-size:12px; }
.attachment-upload-list button:disabled { opacity:.5; cursor:default; }
</style>
