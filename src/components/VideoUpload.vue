<script setup>
import { onBeforeUnmount, ref } from "vue";
import { ElMessage } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import { VIDEO_ACCEPT, uploadVideoFile, validateVideoFile } from "../services/videoUpload.js";

const props = defineProps({ modelValue: { type: String, default: "" }, disabled: Boolean, poster: { type: String, default: "" } });
const emit = defineEmits(["update:modelValue", "uploading"]);
const uploading = ref(false);
let request;
let disposed = false;
function beforeUpload(file) {
  if (props.disabled || uploading.value) return false;
  try { validateVideoFile(file); return true; }
  catch (error) { ElMessage.warning(error.message); return false; }
}
async function upload({ file }) {
  if (props.disabled || uploading.value) throw new DOMException("上传已取消", "AbortError");
  const controller = new AbortController();
  request = controller;
  uploading.value = true;
  emit("uploading", true);
  try {
    const result = await uploadVideoFile(file, { signal: controller.signal });
    if (!disposed) emit("update:modelValue", result.url);
    return result;
  } catch (error) {
    if (!disposed && error.name !== "AbortError") ElMessage.error(error.message);
    throw error;
  } finally {
    if (request === controller) {
      request = undefined;
      uploading.value = false;
      if (!disposed) emit("uploading", false);
    }
  }
}
onBeforeUnmount(() => { disposed = true; request?.abort(); emit("uploading", false); });
</script>

<template>
  <div class="video-upload" :aria-busy="uploading">
    <video v-if="modelValue" :key="modelValue" :src="modelValue" :poster="poster || undefined" controls muted playsinline preload="metadata" aria-label="企业介绍视频预览" />
    <el-upload drag :accept="VIDEO_ACCEPT" :show-file-list="false" :before-upload="beforeUpload" :http-request="upload" :disabled="disabled || uploading">
      <el-icon><UploadFilled /></el-icon>
      <p>{{ uploading ? "视频上传中，请稍候…" : modelValue ? "点击或拖放视频以替换" : "点击或拖放视频上传" }}</p>
      <small>支持 MP4 / WebM，最大 100 MB；推荐 H.264 编码 MP4。</small>
    </el-upload>
    <div v-if="modelValue" class="video-upload-actions">
      <span>官网优先静音自动播放视频</span>
      <el-button text type="danger" :disabled="disabled || uploading" @click="emit('update:modelValue', '')">移除视频</el-button>
    </div>
  </div>
</template>

<style scoped>
.video-upload { width:100%; min-width:0; }
.video-upload video { display:block; width:100%; max-height:260px; margin-bottom:12px; background:#edf5f7; }
.video-upload :deep(.el-upload), .video-upload :deep(.el-upload-dragger) { width:100%; }
.video-upload :deep(.el-upload-dragger) { padding:20px 12px; }
.video-upload .el-icon { font-size:26px; color:#648e9c; }
.video-upload p { margin:8px 0; color:#345667; font-size:13px; }
.video-upload small { font-size:11px; color:#748a95; }
.video-upload-actions { display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:12px; color:#69818d; }
</style>
