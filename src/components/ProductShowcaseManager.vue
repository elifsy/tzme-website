<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import AdminEditorPanel from "./AdminEditorPanel.vue";
import AdminPreviewFrame from "./AdminPreviewFrame.vue";
import AdminSaveBar from "./AdminSaveBar.vue";
import ProductShowcase from "./ProductShowcase.vue";
import ImageUpload from "./ImageUpload.vue";
import ModelUpload from "./ModelUpload.vue";
import { useAdminEditorState } from "../composables/useAdminEditorState.js";
import { useProductCatalog } from "../services/catalog.js";
import { useIndustryCatalog } from "../services/industries.js";
import {
  useProductShowcase,
  saveProductShowcase,
} from "../services/productShowcase.js";
import {
  cloneShowcase,
  emptyIndustryScene,
  resolveThreeDSettings,
} from "../data/productShowcase.js";
import { dataErrors } from "../services/api.js";

const route = useRoute();
const { products, loadProducts } = useProductCatalog();
const { industries, loadIndustries } = useIndustryCatalog();
const { loadProductShowcase } = useProductShowcase();
const form = ref(null),
  original = ref(""),
  scope = ref("overview"),
  selectedIndustry = ref(""),
  previewIndustry = ref("");
const loading = ref(false),
  saving = ref(false),
  uploading = ref(false),
  error = ref(false),
  selectedPoint = ref(-1);
const modelUploads = ref(new Set());
const busy = computed(() => uploading.value || modelUploads.value.size > 0);
function setModelUploading(key, value) {
  const next = new Set(modelUploads.value);
  value ? next.add(key) : next.delete(key);
  modelUploads.value = next;
}
const dirty = computed(
  () => !!form.value && JSON.stringify(form.value) !== original.value,
);
const scene = computed(() =>
  scope.value === "overview"
    ? form.value?.overview
    : form.value?.industries[selectedIndustry.value] || emptyIndustryScene(),
);
const imageSource = computed(
  () =>
    scene.value?.image ||
    (scope.value === "industries" ? form.value?.overview.image : ""),
);
const validIndustries = computed(() =>
  industries.value.filter((item) => item.status !== "deleted"),
);
const validProducts = computed(() =>
  products.value.filter((item) => item.status !== "deleted"),
);
const modelIndustries = computed(() =>
  validIndustries.value.filter((industry) =>
    validProducts.value.some((product) =>
      product.industries?.includes(industry.id),
    ),
  ),
);
const pointProducts = (point) =>
  validProducts.value.filter(
    (item) =>
      !(
        point.industryId ||
        (scope.value === "industries" && selectedIndustry.value)
      ) ||
      item.industries?.includes(point.industryId || selectedIndustry.value),
  );
let disposed = false;
function ensureScene() {
  if (scope.value === "overview") return form.value.overview;
  if (!Object.hasOwn(form.value.industries, selectedIndustry.value))
    form.value.industries[selectedIndustry.value] = emptyIndustryScene();
  return form.value.industries[selectedIndustry.value];
}
function updateScene(key, value) {
  ensureScene()[key] = value;
}
function editPoint(index, key, value) {
  const point = ensureScene().hotspots[index];
  if (!point) return;
  point[key] = value;
  if (key === "industryId") point.productId = "";
}
function addPoint() {
  const record = ensureScene();
  if (record.hotspots.length >= 12) return;
  record.hotspots.push({
    label: "新热点",
    industryId: scope.value === "industries" ? selectedIndustry.value : "",
    productId: "",
    x: 50,
    y: 50,
  });
  selectedPoint.value = record.hotspots.length - 1;
}
function removePoint(index) {
  ensureScene().hotspots.splice(index, 1);
  selectedPoint.value = -1;
}
function positionPoint(event) {
  if (selectedPoint.value < 0 || event.target.closest("button") || saving.value)
    return;
  const rect = event.currentTarget.getBoundingClientRect();
  editPoint(
    selectedPoint.value,
    "x",
    Math.max(
      0,
      Math.min(
        100,
        Number((((event.clientX - rect.left) / rect.width) * 100).toFixed(1)),
      ),
    ),
  );
  editPoint(
    selectedPoint.value,
    "y",
    Math.max(
      0,
      Math.min(
        100,
        Number((((event.clientY - rect.top) / rect.height) * 100).toFixed(1)),
      ),
    ),
  );
}
watch([scope, selectedIndustry], () => {
  selectedPoint.value = -1;
  previewIndustry.value =
    scope.value === "overview" ? "" : selectedIndustry.value;
});
async function load() {
  if (loading.value || saving.value) return;
  loading.value = true;
  try {
    const [value] = await Promise.all([
      loadProductShowcase(),
      loadProducts(),
      loadIndustries(),
    ]);
    if (disposed) return;
    error.value =
      !value ||
      ["/api/products", "/api/industries"].some((path) => dataErrors.has(path));
    if (!error.value) {
      form.value = cloneShowcase(value);
      form.value.overview.threeD = resolveThreeDSettings(form.value.overview);
      original.value = JSON.stringify(form.value);
      selectedIndustry.value =
        validIndustries.value.find((item) => item.id === route.query.industry)
          ?.id ||
        validIndustries.value[0]?.id ||
        "";
      if (route.query.industry) scope.value = "industries";
    }
  } finally {
    if (!disposed) loading.value = false;
  }
}
function validate() {
  const overview = form.value.overview;
  if (
    ["kicker", "title", "description", "secondaryText", "image"].some(
      (key) => !overview[key]?.trim(),
    )
  )
    return "请补全全景页的标题、说明、按钮文案和场景图。";
  for (const item of [overview, ...Object.values(form.value.industries)]) {
    if (item.title.length > 240 || item.description.length > 1500)
      return "标题最多 240 字，场景说明最多 1500 字。";
    for (const point of item.hotspots) {
      if (!point.label.trim() || (!point.industryId && !point.productId))
        return "请为每个热点填写名称，并关联行业或产品。";
      if (
        ["x", "y"].some(
          (key) =>
            !Number.isFinite(point[key]) || point[key] < 0 || point[key] > 100,
        )
      )
        return "热点位置应在 0—100 之间。";
    }
  }
  return "";
}
async function save() {
  if (!form.value || saving.value || busy.value || loading.value || error.value)
    return;
  const message = validate();
  if (message) return ElMessage.warning(message);
  saving.value = true;
  try {
    const value = await saveProductShowcase(form.value);
    if (disposed) return;
    form.value = cloneShowcase(value);
    original.value = JSON.stringify(form.value);
    ElMessage.success("产品中心展示已保存。");
  } catch {
    if (!disposed)
      ElMessage.error("保存失败，请检查热点关联、图片路径和文字长度后重试。");
  } finally {
    if (!disposed) saving.value = false;
  }
}
useAdminEditorState({ dirty, saving, loading, uploading: busy });
onMounted(load);
onBeforeUnmount(() => {
  disposed = true;
});
defineExpose({ load });
</script>

<template>
  <div v-loading="loading" class="product-showcase-manager">
    <el-alert
      v-if="error"
      type="error"
      :closable="false"
      title="产品中心配置读取失败，请刷新重试。"
    />
    <template v-if="form && !error">
      <div class="showcase-editor-toolbar">
        <el-radio-group v-model="scope" :disabled="saving || busy"
          ><el-radio-button value="overview">首屏行业全景</el-radio-button
          ><el-radio-button value="industries"
            >各行业展示</el-radio-button
          ></el-radio-group
        ><router-link to="/admin/industries">维护行业资料 ↗</router-link
        ><router-link to="/admin/products">维护产品资料 ↗</router-link>
      </div>
      <div v-if="scope === 'industries'" class="showcase-industry-picker">
        <span>选择行业</span
        ><el-select
          v-model="selectedIndustry"
          :disabled="saving || uploading"
          filterable
          aria-label="选择要配置的行业"
          ><el-option
            v-for="item in validIndustries"
            :key="item.id"
            :value="item.id"
            :label="`${item.titleZh}${item.status !== 'published' ? '（草稿）' : ''}`" /></el-select
        ><small>名称、发布状态和排序沿用行业管理；产品关联沿用产品资料。</small>
      </div>
      <div class="showcase-editor-columns">
        <el-form
          label-position="top"
          :disabled="saving || loading"
          @submit.prevent="save"
        >
          <AdminEditorPanel
            step="01"
            title="展示文案"
            :description="
              scope === 'overview'
                ? '维护产品中心首屏的标题、说明与入口。标题可换行。'
                : '为当前行业填写专属文案；留空时使用行业名称与简介。'
            "
          >
            <el-form-item
              v-if="scope === 'overview'"
              label="栏目引导语"
              required
              ><el-input
                v-model="form.overview.kicker"
                maxlength="100"
                show-word-limit
            /></el-form-item>
            <el-form-item label="场景标题" :required="scope === 'overview'"
              ><el-input
                :model-value="scene.title"
                type="textarea"
                :rows="2"
                maxlength="240"
                show-word-limit
                @update:model-value="updateScene('title', $event)"
            /></el-form-item>
            <el-form-item label="场景说明" :required="scope === 'overview'"
              ><el-input
                :model-value="scene.description"
                type="textarea"
                :rows="3"
                maxlength="1500"
                show-word-limit
                @update:model-value="updateScene('description', $event)"
            /></el-form-item>
            <el-form-item
              v-if="scope === 'overview'"
              label="全部产品按钮"
              required
              ><el-input v-model="form.overview.secondaryText" maxlength="60"
            /></el-form-item>
            <el-form-item v-if="scope === 'overview'" label="优先展示的产品"
              ><el-select
                v-model="form.overview.featuredProducts"
                multiple
                filterable
                :multiple-limit="12"
                placeholder="按选择顺序优先展示，其他产品仍保留"
                ><el-option
                  v-for="item in validProducts"
                  :key="item.id"
                  :value="item.id"
                  :label="`${item.titleZh}${item.status !== 'published' ? '（草稿）' : ''}`"
              /></el-select>
              <p class="cms-field-hint">
                按选择顺序排列，最多 12 项；仅已发布产品会出现在官网。
              </p></el-form-item
            >
          </AdminEditorPanel>
          <AdminEditorPanel
            step="02"
            title="场景图片"
            description="立体场景推荐使用透明背景 PNG / WebP；实景照片也可使用。"
          >
            <ImageUpload
              :model-value="scene.image"
              kind="showcase"
              :context-key="`${scope}-${selectedIndustry}`"
              :disabled="saving"
              :clearable="scope !== 'overview'"
              :alt="scene.imageAlt || scene.title"
              @update:model-value="updateScene('image', $event)"
              @uploading="uploading = $event"
            />
            <p v-if="scope === 'industries'" class="cms-field-hint">
              未单独上传时，沿用行业全景并定位本行业设备；上传后使用本行业的独立场景图。
            </p>
            <el-form-item label="图片说明"
              ><el-input
                :model-value="scene.imageAlt"
                maxlength="240"
                placeholder="简要描述图片内容，便于无障碍浏览"
                @update:model-value="updateScene('imageAlt', $event)"
            /></el-form-item>
            <el-form-item label="图片展示方式"
              ><el-radio-group
                :model-value="scene.presentation"
                @update:model-value="updateScene('presentation', $event)"
                ><el-radio-button value="scene"
                  >立体场景 · 完整显示</el-radio-button
                ><el-radio-button value="photo"
                  >实景照片 · 铺满画面</el-radio-button
                ></el-radio-group
              ></el-form-item
            >
          </AdminEditorPanel>
          <AdminEditorPanel
            v-if="scope === 'overview'"
            step="03"
            title="行业设备全景"
            description="所有有产品数据的已发布行业统一展示，支持环绕查看、设备特写和一键复位。"
          >
            <el-form-item label="启用三维全景"
              ><el-switch
                v-model="form.overview.threeD.enabled"
                :disabled="busy"
              /><span class="cms-field-hint" style="margin: 0 0 0 12px"
                >关闭后使用上方场景图片。</span
              ></el-form-item
            >
            <template v-if="form.overview.threeD.enabled"
              ><p class="cms-field-hint">
                可按行业上传真实模型替换设备。请使用自包含的 GLB 2.0
                文件，贴图需包含在文件中，单个文件不超过 40
                MB；导出时取消几何与贴图压缩。留空即使用内置示意模型。
              </p>
              <ModelUpload
                v-for="industry in modelIndustries"
                :key="industry.id"
                v-model="form.overview.threeD.models[industry.id]"
                :label="`${industry.titleZh}装备`"
                :disabled="saving"
                @uploading="setModelUploading(industry.id, $event)"
            /></template>
          </AdminEditorPanel>
          <AdminEditorPanel
            step="04"
            title="场景热点"
            description="先添加热点并关联行业或产品，再点击图片放置位置。横纵坐标也可手动调整。"
          >
            <p
              v-if="scope === 'overview' && form.overview.threeD.enabled"
              class="cms-field-hint"
            >
              三维标签自动跟随各行业设备，点击后切换到对应行业并同步下方筛选；图片展示仍使用下方热点位置及关联产品。
            </p>
            <el-alert
              v-if="scope === 'industries' && !scene.image"
              type="info"
              :closable="false"
              title="当前沿用行业全景。上传本行业的独立场景图后，可设置专属热点。"
            />
            <template v-else>
              <div
                v-if="imageSource"
                class="showcase-point-editor"
                :class="{ 'is-photo': scene.presentation === 'photo' }"
                @click="positionPoint"
              >
                <img :src="imageSource" alt="热点位置预览" /><button
                  v-for="(point, index) in scene.hotspots"
                  :key="index"
                  type="button"
                  :style="{ left: `${point.x}%`, top: `${point.y}%` }"
                  :aria-pressed="selectedPoint === index"
                  :aria-label="`选择热点 ${index + 1}：${point.label}`"
                  @click.stop="selectedPoint = index"
                >
                  {{ index + 1 }}
                </button>
              </div>
              <p class="cms-field-hint">
                {{
                  selectedPoint >= 0
                    ? `正在调整第 ${selectedPoint + 1} 个热点，点击图中位置即可移动。`
                    : "选择下方热点后，可在图中点按定位。"
                }}
              </p>
              <div
                v-for="(point, index) in scene.hotspots"
                :key="index"
                class="showcase-point-fields"
                :class="{ selected: selectedPoint === index }"
              >
                <div class="point-field-heading">
                  <button type="button" @click="selectedPoint = index">
                    {{ String(index + 1).padStart(2, "0") }} /
                    {{ point.label || "未命名热点" }}</button
                  ><el-button type="danger" text @click="removePoint(index)"
                    >删除</el-button
                  >
                </div>
                <el-form-item label="热点名称" required
                  ><el-input
                    :model-value="point.label"
                    maxlength="80"
                    @update:model-value="editPoint(index, 'label', $event)"
                /></el-form-item>
                <el-form-item v-if="scope === 'overview'" label="关联行业"
                  ><el-select
                    :model-value="point.industryId"
                    clearable
                    placeholder="选择对应行业"
                    @update:model-value="
                      editPoint(index, 'industryId', $event || '')
                    "
                    ><el-option
                      v-for="item in validIndustries"
                      :key="item.id"
                      :value="item.id"
                      :label="item.titleZh" /></el-select
                ></el-form-item>
                <el-form-item label="关联产品"
                  ><el-select
                    :model-value="point.productId"
                    clearable
                    filterable
                    placeholder="可选择该行业下的产品"
                    @update:model-value="
                      editPoint(index, 'productId', $event || '')
                    "
                    ><el-option
                      v-for="item in pointProducts(point)"
                      :key="item.id"
                      :value="item.id"
                      :label="`${item.titleZh}${item.status !== 'published' ? '（草稿）' : ''}`" /></el-select
                ></el-form-item>
                <div class="showcase-point-coordinates">
                  <el-form-item label="横向位置 %"
                    ><el-input-number
                      :model-value="point.x"
                      :min="0"
                      :max="100"
                      :step="1"
                      :precision="1"
                      controls-position="right"
                      @update:model-value="
                        editPoint(index, 'x', $event)
                      " /></el-form-item
                  ><el-form-item label="纵向位置 %"
                    ><el-input-number
                      :model-value="point.y"
                      :min="0"
                      :max="100"
                      :step="1"
                      :precision="1"
                      controls-position="right"
                      @update:model-value="editPoint(index, 'y', $event)"
                  /></el-form-item>
                </div>
              </div>
              <el-button
                :disabled="!imageSource || scene.hotspots.length >= 12"
                @click="addPoint"
                >添加场景热点</el-button
              >
            </template>
          </AdminEditorPanel>
        </el-form>
        <aside class="showcase-live-preview">
          <AdminPreviewFrame title="产品中心效果预览" public-path="/solutions"
            ><ProductShowcase
              :configuration="form"
              :products="products"
              :industries="industries"
              :selected-industry="previewIndustry"
              preview
              @select-industry="previewIndustry = $event"
              @browse-all="previewIndustry = ''"
              @reset="previewIndustry = ''"
          /></AdminPreviewFrame>
          <p class="showcase-preview-hint">
            预览支持切换行业和点开设备热点。保存后，文案、图片与热点会一起应用到官网。
          </p>
        </aside>
      </div>
      <AdminSaveBar
        :dirty="dirty"
        :saving="saving"
        :busy="busy"
        :disabled="loading || error || !dirty"
        @save="save"
      />
    </template>
  </div>
</template>

<style scoped>
.product-showcase-manager {
  min-width: 0;
  min-height: 300px;
}
.showcase-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.showcase-editor-toolbar a {
  font-size: 12px;
  color: #39798b;
  text-decoration: none;
}
.showcase-editor-toolbar .el-radio-group {
  margin-right: auto;
}
.showcase-editor-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
  gap: 24px;
  align-items: start;
}
.showcase-editor-columns > form {
  min-width: 0;
}
.showcase-editor-columns :deep(.el-select) {
  width: 100%;
}
.showcase-live-preview {
  position: sticky;
  top: 24px;
  min-width: 0;
}
.showcase-button-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.showcase-industry-picker {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 17px 20px;
  border: 1px solid #dce6ed;
  background: white;
  border-radius: 10px;
  margin-bottom: 22px;
  font-size: 12px;
  color: #39596d;
}
.showcase-industry-picker .el-select {
  width: 220px;
}
.showcase-industry-picker small {
  font-size: 11px;
  color: #7f94a4;
}
.showcase-preview-hint {
  font-size: 11px;
  line-height: 1.8;
  color: #78909f;
  padding-inline: 8px;
}
.showcase-point-editor {
  position: relative;
  aspect-ratio: 1.5;
  background: #edf5fa;
  border: 1px solid #dbe7ed;
  margin-bottom: 12px;
  cursor: crosshair;
}
.showcase-point-editor img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.showcase-point-editor.is-photo {
  aspect-ratio: 1.42;
}
.showcase-point-editor.is-photo img {
  object-fit: cover;
}
.showcase-point-editor button {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  border: 1px solid #78acbc;
  color: #176e83;
  font: 600 11px/1 var(--f-ui);
  cursor: pointer;
  box-shadow: 0 3px 12px #1e546028;
}
.showcase-point-editor button[aria-pressed="true"] {
  background: #087f91;
  color: white;
  outline: 3px solid #087f9125;
}
.showcase-point-fields {
  border: 1px solid #dfe8ee;
  border-radius: 9px;
  padding: 15px;
  margin: 16px 0;
}
.showcase-point-fields.selected {
  border-color: #8fbdc9;
  background: #f7fbfc;
}
.point-field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.point-field-heading > button {
  background: none;
  border: 0;
  color: #2e657b;
  font: 600 12px/1.7 var(--f-ui);
  cursor: pointer;
  padding: 0;
  text-align: left;
}
.showcase-point-coordinates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.showcase-point-coordinates .el-input-number {
  width: 100%;
}
.product-showcase-manager .el-alert {
  margin-bottom: 16px;
}
.product-showcase-manager .cms-field-hint {
  font-size: 11px;
  color: #7c92a1;
  line-height: 1.8;
  margin: 10px 0 16px;
}
.product-showcase-manager :deep(.image-upload) {
  margin-bottom: 18px;
}
@media (max-width: 1100px) {
  .showcase-editor-columns {
    grid-template-columns: minmax(0, 1fr);
  }
  .showcase-live-preview {
    position: static;
  }
  .showcase-editor-toolbar .el-radio-group {
    width: 100%;
  }
  .showcase-preview-hint {
    margin-bottom: 0;
  }
}
@media (max-width: 600px) {
  .showcase-button-fields {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .showcase-editor-toolbar {
    gap: 12px;
  }
  .showcase-editor-toolbar :deep(.el-radio-button__inner) {
    font-size: 12px;
    padding: 10px 13px;
  }
  .showcase-point-fields {
    padding: 12px;
  }
}
</style>
