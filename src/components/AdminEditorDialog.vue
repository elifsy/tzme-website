<script setup>
import { ElMessage, ElMessageBox } from "element-plus";
import "../style/admin-editor.css";

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, required: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "EditPen" },
  width: { type: String, default: "min(1100px, calc(100vw - 40px))" },
  status: { type: String, default: "" },
  saving: Boolean,
  dirty: Boolean,
  saveDisabled: Boolean,
  editorFullscreen: Boolean,
  footerNote: { type: String, default: "" },
  saveLabel: { type: String, default: "" },
  showSave: { type: Boolean, default: true },
  showPreview: Boolean,
  closeLabel: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue", "save", "preview"]);
async function mayClose() {
  if (props.saving || props.saveDisabled) {
    ElMessage.info("正在保存或上传，请稍候。");
    return false;
  }
  if (!props.dirty) return true;
  try {
    await ElMessageBox.confirm(
      "当前内容尚未保存，关闭后将丢弃修改。",
      "保留编辑内容",
      {
        confirmButtonText: "丢弃修改并关闭",
        cancelButtonText: "继续填写",
        type: "warning",
      },
    );
    return true;
  } catch {
    return false;
  }
}
async function beforeClose(done) {
  if (await mayClose()) done();
}
async function close() {
  if (await mayClose()) emit("update:modelValue", false);
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :width="width"
    class="editor-dialog cms-editor-dialog"
    modal-class="cms-editor-overlay"
    append-to-body
    destroy-on-close
    :close-on-press-escape="!editorFullscreen"
    :close-on-click-modal="!editorFullscreen"
    :before-close="beforeClose"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header="{ titleId }">
      <div class="cms-editor-heading">
        <span class="cms-editor-heading-icon"
          ><el-icon><component :is="icon" /></el-icon
        ></span>
        <div class="cms-editor-heading-copy">
          <span class="cms-editor-eyebrow">{{
            $t("admin.contentManager")
          }}</span>
          <h2 :id="titleId">{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </div>
        <el-tag
          v-if="status"
          :type="status === 'published' ? 'success' : 'info'"
          effect="light"
          round
          class="cms-editor-status"
        >
          <span class="cms-status-dot"></span
          >{{ $t(status === "published" ? "admin.published" : "admin.draft") }}
        </el-tag>
      </div>
    </template>
    <slot />
    <template #footer>
      <div class="cms-editor-footer">
        <span class="cms-editor-footer-note"
          ><el-icon><CircleCheckFilled /></el-icon
          >{{ footerNote || $t("admin.editorSaveNote") }}</span
        >
        <div class="cms-editor-footer-actions">
          <el-button v-if="showPreview" plain @click="emit('preview')"
            >预览效果</el-button
          >
          <el-button @click="close">{{
            closeLabel || $t("admin.cancel")
          }}</el-button>
          <el-button
            v-if="showSave"
            type="primary"
            :loading="saving"
            :disabled="saveDisabled"
            @click="emit('save')"
          >
            <el-icon v-if="!saving"><CircleCheckFilled /></el-icon
            >{{ saveLabel || $t("admin.saveContent") }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
