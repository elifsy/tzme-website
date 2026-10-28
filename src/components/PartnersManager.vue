<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import AdminEditorPanel from "./AdminEditorPanel.vue";
import AdminPreviewFrame from "./AdminPreviewFrame.vue";
import AdminSaveBar from "./AdminSaveBar.vue";
import ImageUpload from "./ImageUpload.vue";
import PartnersSection from "./PartnersSection.vue";
import { loadPartners, savePartners } from "../services/partners.js";
import { useAdminEditorState } from "../composables/useAdminEditorState.js";

const form = ref(null),
  original = ref(""),
  selectedId = ref(""),
  loading = ref(false),
  saving = ref(false),
  uploading = ref(false),
  error = ref(false);
const dirty = computed(
  () => !!form.value && JSON.stringify(form.value) !== original.value,
);
const selected = computed(() =>
  form.value?.items.find((item) => item.id === selectedId.value),
);
const busy = computed(() => loading.value || saving.value || uploading.value);
let disposed = false;
async function load() {
  if (busy.value) return;
  loading.value = true;
  try {
    const value = await loadPartners();
    if (disposed) return;
    error.value = !value;
    if (value) {
      form.value = JSON.parse(JSON.stringify(value));
      original.value = JSON.stringify(form.value);
      selectedId.value = form.value.items[0]?.id || "";
    }
  } finally {
    if (!disposed) loading.value = false;
  }
}
function add() {
  if (busy.value || form.value.items.length >= 80) return;
  const id =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const item = { id: `partner-${id}`, name: "", image: "", enabled: true };
  form.value.items.push(item);
  selectedId.value = item.id;
}
function move(index, offset) {
  if (
    busy.value ||
    index + offset < 0 ||
    index + offset >= form.value.items.length
  )
    return;
  const [item] = form.value.items.splice(index, 1);
  form.value.items.splice(index + offset, 0, item);
}
async function remove(item) {
  if (busy.value) return;
  try {
    await ElMessageBox.confirm(
      `移除“${item.name || "未命名合作伙伴"}”？保存后会从官网标志墙移除。`,
      "移除合作伙伴",
      { type: "warning", confirmButtonText: "移除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  if (disposed || busy.value) return;
  form.value.items = form.value.items.filter((value) => value.id !== item.id);
  if (selectedId.value === item.id)
    selectedId.value = form.value.items[0]?.id || "";
}
async function save() {
  if (busy.value || !form.value) return;
  if (
    ["kicker", "title", "description"].some((key) => !form.value[key].trim())
  ) {
    ElMessage.warning("请完整填写栏目标题和介绍。");
    return;
  }
  const incomplete = form.value.items.find(
    (item) => !item.name.trim() || !item.image.trim(),
  );
  if (incomplete) {
    selectedId.value = incomplete.id;
    ElMessage.warning("请为每个合作伙伴填写名称并上传标志图片。");
    return;
  }
  saving.value = true;
  try {
    const value = await savePartners(form.value);
    if (disposed) return;
    form.value = JSON.parse(JSON.stringify(value));
    original.value = JSON.stringify(form.value);
    ElMessage.success("合作伙伴资料已保存");
  } catch {
    if (!disposed) ElMessage.error("保存失败，请检查资料后重试。");
  } finally {
    if (!disposed) saving.value = false;
  }
}
useAdminEditorState({ dirty, saving, uploading, loading });
onMounted(load);
onBeforeUnmount(() => {
  disposed = true;
});
defineExpose({ load });
</script>

<template>
  <div v-loading="loading" class="partners-manager">
    <el-alert
      v-if="error"
      type="error"
      title="合作伙伴资料读取失败，请重试。"
      :closable="false"
      ><el-button @click="load">重新读取</el-button></el-alert
    >
    <el-form
      v-if="form"
      label-position="top"
      :disabled="busy || error"
      @submit.prevent="save"
    >
      <div class="partners-manager-layout">
        <div class="partners-manager-main">
          <AdminEditorPanel
            title="栏目与展示位置"
            step="01"
            description="资料来自英文官网 Our partner，标志保留品牌原色；名称同时用于图片说明。"
          >
            <div class="partners-display-options">
              <el-checkbox v-model="form.enabled">启用合作伙伴栏目</el-checkbox
              ><el-checkbox v-model="form.showOnHome">首页展示</el-checkbox
              ><el-checkbox v-model="form.showOnAbout"
                >关于我们展示</el-checkbox
              >
            </div>
            <el-form-item label="栏目提示" required
              ><el-input v-model="form.kicker" maxlength="100"
            /></el-form-item>
            <el-form-item label="栏目标题" required
              ><el-input v-model="form.title" maxlength="160"
            /></el-form-item>
            <el-form-item label="栏目介绍" required
              ><el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                maxlength="800"
            /></el-form-item>
          </AdminEditorPanel>
          <AdminEditorPanel
            title="标志与顺序"
            step="02"
            description="选择一项修改名称和图片，使用上下箭头调整顺序；关闭显示可保留资料。"
          >
            <div class="partners-list-toolbar">
              <span
                >共 {{ form.items.length }} 项 · 已显示
                {{ form.items.filter((item) => item.enabled).length }} 项</span
              ><el-button
                :disabled="busy || form.items.length >= 80"
                @click="add"
                >添加合作伙伴</el-button
              >
            </div>
            <div class="partner-settings-list">
              <div
                v-for="(item, index) in form.items"
                :key="item.id"
                class="partner-settings-row"
                :class="{ 'is-selected': selectedId === item.id }"
              >
                <button
                  type="button"
                  class="partner-select"
                  :disabled="busy"
                  :aria-pressed="selectedId === item.id"
                  @click="selectedId = item.id"
                >
                  <img v-if="item.image" :src="item.image" alt="" /><span>{{
                    item.name || "未命名合作伙伴"
                  }}</span>
                </button>
                <div class="partner-row-actions">
                  <el-switch
                    v-model="item.enabled"
                    :aria-label="`显示${item.name || '合作伙伴'}`"
                  /><button
                    type="button"
                    :disabled="busy || index === 0"
                    :aria-label="`上移${item.name}`"
                    @click="move(index, -1)"
                  >
                    ↑</button
                  ><button
                    type="button"
                    :disabled="busy || index === form.items.length - 1"
                    :aria-label="`下移${item.name}`"
                    @click="move(index, 1)"
                  >
                    ↓</button
                  ><button
                    type="button"
                    :disabled="busy"
                    :aria-label="`移除${item.name}`"
                    @click="remove(item)"
                  >
                    移除
                  </button>
                </div>
              </div>
            </div>
            <div v-if="selected" class="partner-current-editor">
              <el-form-item label="合作伙伴名称" required
                ><el-input
                  v-model="selected.name"
                  maxlength="160"
                  placeholder="用于图片说明与后台识别"
              /></el-form-item>
              <el-form-item label="品牌标志" required
                ><ImageUpload
                  v-model="selected.image"
                  kind="partner"
                  :context-key="selected.id"
                  :disabled="saving || loading || error"
                  :alt="selected.name"
                  @uploading="uploading = $event"
              /></el-form-item>
              <p v-if="selected.id === 'partner-37'" class="admin-field-hint">
                原站此标志未提供可确认的文字名称，暂按原站序号保留；确认名称后可在此补充。
              </p>
            </div>
          </AdminEditorPanel>
        </div>
        <aside>
          <AdminPreviewFrame title="合作伙伴栏目预览" public-path="/#partners"
            ><div class="design-site">
              <PartnersSection :configuration="form" preview /></div
          ></AdminPreviewFrame>
        </aside>
      </div>
      <AdminSaveBar
        :dirty="dirty"
        :saving="saving"
        :busy="uploading"
        :disabled="loading || error"
        @save="save"
      />
    </el-form>
  </div>
</template>

<style scoped>
.partners-manager-layout {
  display: grid;
  grid-template-columns: minmax(400px, 1.05fr) minmax(330px, 0.95fr);
  gap: 24px;
  align-items: start;
}
.partners-manager-main {
  display: grid;
  gap: 20px;
}
.partners-manager-layout > aside {
  position: sticky;
  top: 20px;
  min-width: 0;
}
.partners-display-options {
  display: flex;
  gap: 4px 18px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.partners-display-options .el-checkbox {
  margin-right: 0;
}
.partners-list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 13px;
  font-size: 12px;
  color: #658094;
}
.partner-settings-list {
  max-height: 370px;
  overflow: auto;
  border: 1px solid #e1e9ee;
  border-radius: 6px;
}
.partner-settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  border-bottom: 1px solid #e7edf2;
  background: #fff;
}
.partner-settings-row:last-child {
  border-bottom: 0;
}
.partner-settings-row.is-selected {
  background: #eef7f9;
}
.partner-select {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  flex: 1;
  background: none;
  border: 0;
  padding: 0;
  text-align: left;
  font: inherit;
  font-size: 12px;
  color: #294e65;
  cursor: pointer;
}
.partner-select img {
  width: 50px;
  height: 38px;
  object-fit: contain;
  background: #fff;
  flex-shrink: 0;
}
.partner-select span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.partner-row-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}
.partner-row-actions button {
  background: none;
  border: 0;
  color: #50788b;
  font-size: 12px;
  cursor: pointer;
  padding: 5px 3px;
}
.partner-row-actions button:disabled,
.partner-select:disabled {
  cursor: default;
  opacity: 0.4;
}
.partner-current-editor {
  border-top: 1px solid #dbe7ed;
  padding-top: 20px;
  margin-top: 22px;
}
@media (max-width: 1200px) {
  .partners-manager-layout {
    grid-template-columns: 1fr;
  }
  .partners-manager-layout > aside {
    position: static;
  }
}
@media (max-width: 600px) {
  .partner-settings-row {
    gap: 6px;
    padding-inline: 6px;
  }
  .partner-select {
    gap: 6px;
  }
  .partner-select img {
    width: 36px;
    height: 30px;
  }
  .partner-row-actions {
    gap: 3px;
  }
  .partners-list-toolbar {
    flex-wrap: wrap;
  }
}
</style>
