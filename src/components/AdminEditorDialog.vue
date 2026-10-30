<script setup>
import { computed, nextTick, onBeforeUnmount, provide, ref, shallowRef, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { adminDialogSectionsKey } from "../composables/useAdminEditorState.js";
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
const content = ref(null), activeSection = ref("");
const registeredSections = shallowRef([]);
const sections = computed(() => [...registeredSections.value].sort((a, b) => {
  if (a.element === b.element) return 0;
  return a.element.compareDocumentPosition(b.element) & 4 ? -1 : 1;
}));
let scrollBody, scrollFrame, disposed = false;
function updateActive() {
  scrollFrame = undefined;
  if (!scrollBody || !sections.value.length) { activeSection.value = ""; return; }
  if (scrollBody.scrollHeight > scrollBody.clientHeight + 2 && scrollBody.scrollTop + scrollBody.clientHeight >= scrollBody.scrollHeight - 2) {
    activeSection.value = sections.value.at(-1).id;
    return;
  }
  const threshold = scrollBody.getBoundingClientRect().top + 24;
  let current = sections.value[0];
  for (const section of sections.value) {
    if (section.element.getBoundingClientRect().top <= threshold) current = section;
    else break;
  }
  activeSection.value = current.id;
}
function scheduleActive() {
  if (disposed) return;
  if (scrollFrame == null) scrollFrame = requestAnimationFrame(updateActive);
}
provide(adminDialogSectionsKey, {
  register(section) {
    registeredSections.value = [...registeredSections.value.filter(item => item.id !== section.id), section];
    nextTick(scheduleActive);
  },
  unregister(id) {
    registeredSections.value = registeredSections.value.filter(item => item.id !== id);
    nextTick(scheduleActive);
  },
});
watch(content, element => {
  scrollBody?.removeEventListener("scroll", scheduleActive);
  scrollBody = element;
  scrollBody?.addEventListener("scroll", scheduleActive, { passive: true });
  nextTick(scheduleActive);
}, { flush: "post" });
async function goToSection(section) {
  if (!scrollBody) return;
  section.element.querySelectorAll("details.cms-inline-preview").forEach(item => { item.open = true; });
  await nextTick();
  activeSection.value = section.id;
  scrollBody.scrollTo({
    top: scrollBody.scrollTop + section.element.getBoundingClientRect().top - scrollBody.getBoundingClientRect().top - 16,
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
}
onBeforeUnmount(() => {
  disposed = true;
  scrollBody?.removeEventListener("scroll", scheduleActive);
  if (scrollFrame != null) cancelAnimationFrame(scrollFrame);
});
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
    <nav v-if="sections.length > 1" class="cms-editor-navigation" aria-label="编辑内容导航">
      <button v-for="(section, index) in sections" :key="section.id" type="button"
        :aria-controls="section.id" :aria-current="activeSection === section.id ? 'location' : undefined"
        @click="goToSection(section)">
        <span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>{{ section.title() }}
      </button>
    </nav>
    <div ref="content" class="cms-editor-content"><slot /></div>
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
