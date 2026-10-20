<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
const props = defineProps({ modelValue: { type: String, default: '' }, disabled: Boolean, label: String })
const emit = defineEmits(['update:modelValue', 'uploading'])
const uploading = ref(false)
let request, disposed = false
async function upload({ file }) {
  if (props.disabled || uploading.value) return
  if (!file.name.toLowerCase().endsWith('.glb') || file.size <= 0 || file.size > 40 * 1024 * 1024) { ElMessage.warning('请使用不超过 40 MB 的 GLB 模型。'); return }
  uploading.value = true; emit('uploading', true); request = new AbortController()
  try {
    const body = new FormData(); body.append('file', file)
    const response = await fetch('/api/uploads/models', { method: 'POST', body, signal: request.signal })
    if (!response.ok) throw Error('模型应为自包含的 GLB 2.0 文件，请将贴图一并导出，并取消几何和贴图压缩。')
    const result = await response.json()
    if (!/^\/api\/uploads\/models\/[0-9a-f-]{36}\.glb$/.test(result.url)) throw Error('模型上传返回了无效路径。')
    if (!disposed) { emit('update:modelValue', result.url); ElMessage.success('模型上传完成，保存配置后应用到官网。') }
  } catch (error) { if (!disposed && error.name !== 'AbortError') ElMessage.error(error.message || '模型上传失败，请重试。') }
  finally { if (!disposed) { uploading.value = false; emit('uploading', false) } }
}
onBeforeUnmount(() => { disposed = true; request?.abort(); emit('uploading', false) })
</script>
<template><div class="model-upload"><div class="model-upload-heading"><strong>{{ label }}</strong><span>{{ modelValue ? '已配置替换模型' : '使用内置设备示意模型' }}</span></div><el-input :model-value="modelValue" :disabled="disabled || uploading" clearable placeholder="可上传模型，或填写项目中 /assets/ 下的 .glb 路径" :aria-label="`${label}模型路径`" @update:model-value="$emit('update:modelValue', $event)"/><el-upload action="#" :http-request="upload" :show-file-list="false" accept=".glb" :disabled="disabled || uploading"><el-button :loading="uploading" :disabled="disabled">上传 GLB 模型</el-button></el-upload></div></template>
<style scoped>.model-upload{border:1px solid #dce7ed;border-radius:8px;padding:14px;margin-top:15px;background:#fbfdfe;}.model-upload-heading{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:11px;}.model-upload-heading strong{font-size:12px;color:#31546b;}.model-upload-heading span{font-size:10px;color:#8195a2;}.model-upload .el-input{font-size:11px;}.model-upload .el-upload{margin-top:10px;}.model-upload :deep(.el-upload){margin-top:10px;}.model-upload .el-button{font-size:11px;}</style>
