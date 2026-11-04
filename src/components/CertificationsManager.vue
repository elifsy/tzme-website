<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Edit, Promotion } from "@element-plus/icons-vue";
import AdminEditorDialog from "./AdminEditorDialog.vue";
import AdminEditorPanel from "./AdminEditorPanel.vue";
import { useAdminEditorState } from "../composables/useAdminEditorState.js";
import ImageUpload from "./ImageUpload.vue";
import { useCertificationCatalog } from "../services/certifications.js";
import { apiRequest } from "../services/api.js";
import { isPdf } from "../data/jDesign.js";

const { t, locale } = useI18n({ useScope: "global" });
const { certifications: records, homeCertifications, loadCertifications } =
  useCertificationCatalog();
const loading = ref(false);
const saving = ref(false);
const homeSavingId = ref("");
const imageUploading = ref(false);
const dialogOpen = ref(false);
const editingLocale = ref("zh");
const editorForm = ref(null);
const validationRequested = ref(false);
const hasCertificateImage = (item) =>
  typeof item.image === "string" && Boolean(item.image.trim());
const publishedCount = computed(
  () =>
    records.value.filter(
      (item) => item.status === "published" && hasCertificateImage(item),
    ).length,
);
const missingPublishedImages = computed(
  () =>
    records.value.filter(
      (item) => item.status === "published" && !hasCertificateImage(item),
    ).length,
);
const form = reactive({
  id: "",
  titleEn: "",
  titleZh: "",
  summaryEn: "",
  summaryZh: "",
  issuerEn: "",
  issuerZh: "",
  certificateNo: "",
  issuedAt: "",
  expiresAt: "",
  image: "",
  sortOrder: 10,
  showOnHome: false,
  status: "published",
});
watch(() => form.status, (status) => {
  if (status !== "published") form.showOnHome = false;
}, { flush: "sync" });
const editorOriginal = ref("");
const formErrors = computed(() => validationRequested.value ? certificateProblems(form) : {});
const editorDirty = computed(
  () => dialogOpen.value && JSON.stringify(form) !== editorOriginal.value,
);
useAdminEditorState({
  dirty: editorDirty,
  saving,
  loading,
  uploading: imageUploading,
});

function field(item, name) {
  return locale.value === "zh"
    ? item[`${name}Zh`] || item[`${name}En`] || ""
    : item[`${name}En`] || "";
}

function certificateProblems(record) {
  const problems = {};
  if (!record.titleZh?.trim()) problems.titleZh = "请填写资质名称（中文）。";
  if (record.status === "published" && !hasCertificateImage(record))
    problems.image = t("admin.certImageRequired");
  if (record.issuedAt && record.expiresAt && record.expiresAt < record.issuedAt)
    problems.expiresAt = t("admin.certInvalidDateRange");
  return problems;
}

async function showValidationProblem(record, problems) {
  if (!dialogOpen.value) openEditor(record);
  validationRequested.value = true;
  const message = Object.values(problems)[0];
  const title = field(record, "title");
  ElMessage.warning(title ? `“${title}”：${message}` : message);
  await nextTick();
  focusValidationProblem();
}

function focusValidationProblem() {
  const name = Object.keys(formErrors.value)[0];
  if (!name) return;
  const element = editorForm.value?.$el.querySelector(`[data-cert-field="${name}"]`);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
  element?.querySelector('input:not([type="file"]):not([type="hidden"]), button')?.focus({ preventScroll: true });
}

function showRequestError(error, action) {
  if ([400, 409, 422].includes(error.status)) {
    ElMessage.warning(error.message && !/^HTTP \d+$/.test(error.message)
      ? error.message : "资质资料不完整或格式有误，请检查名称、证书文件及有效期。");
  } else if (error.status === 404) {
    ElMessage.warning("该资质已删除或不存在，请刷新列表后重试。");
  } else if (error.status === 401) {
    ElMessage.warning("登录已过期，请重新登录后操作。");
  } else if (error.status === 403) {
    ElMessage.warning("当前操作未获授权，请刷新页面后重试。");
  } else {
    ElMessage.error(`资质${action}失败，${error.status ? "服务暂不可用" : "网络连接异常"}，请稍后重试。`);
  }
}

async function load() {
  loading.value = true;
  try {
    records.value = await loadCertifications();
  } finally {
    loading.value = false;
  }
}

function openEditor(item = null) {
  editingLocale.value = "zh";
  validationRequested.value = false;
  Object.assign(form, {
    id: item?.id || "",
    titleEn: item?.titleEn || "",
    titleZh: item?.titleZh || "",
    summaryEn: item?.summaryEn || "",
    summaryZh: item?.summaryZh || "",
    issuerEn: item?.issuerEn || "",
    issuerZh: item?.issuerZh || "",
    certificateNo: item?.certificateNo || "",
    issuedAt: item?.issuedAt || "",
    expiresAt: item?.expiresAt || "",
    image: item?.image || "",
    sortOrder: Number(item?.sortOrder ?? (records.value.length + 1) * 10),
    showOnHome: item?.status === "published" && item?.showOnHome === true,
    status: item?.status || "published",
  });
  editorOriginal.value = JSON.stringify(form);
  dialogOpen.value = true;
}

async function persist(record, update) {
  if (saving.value) return false;
  const problems = certificateProblems(record);
  if (Object.keys(problems).length) {
    await showValidationProblem(record, problems);
    return false;
  }
  saving.value = true;
  try {
    await apiRequest(
      "/api/certifications" +
        (update ? "/" + encodeURIComponent(record.id) : ""),
      {
        method: update ? "PUT" : "POST",
        body: {
          ...record,
          issuedAt: record.issuedAt || null,
          expiresAt: record.expiresAt || null,
        },
      },
    );
    await load();
    ElMessage.success(t("admin.contentSaved"));
    return true;
  } catch (error) {
    showRequestError(error, "保存");
    return false;
  } finally {
    saving.value = false;
  }
}

async function save() {
  if (saving.value || imageUploading.value) return;
  const record = {
    ...form,
    id: form.id || `cert-${Date.now()}`,
    titleEn: form.titleEn.trim(),
    titleZh: form.titleZh.trim(),
    image: form.image.trim(),
    sortOrder: Number(form.sortOrder) || 0,
  };
  if (await persist(record, Boolean(form.id))) dialogOpen.value = false;
}

async function toggle(item) {
  if (saving.value || loading.value) return;
  const record = {
    ...item,
    status: item.status === "published" ? "draft" : "published",
    showOnHome: false,
  };
  await persist(record, true);
}

async function setHomeDisplay(item, selected) {
  if (saving.value || loading.value || item.showOnHome === selected) return;
  if (item.status !== "published") {
    ElMessage.warning("请先发布资质，再设置首页展示。");
    return;
  }
  homeSavingId.value = item.id;
  try {
    await persist({ ...item, showOnHome: selected }, true);
  } finally {
    homeSavingId.value = "";
  }
}

async function remove(item) {
  try {
    await ElMessageBox.confirm(
      t("admin.deleteConfirm", { title: field(item, "title") }),
      t("admin.certDeleteTitle"),
      {
        confirmButtonText: t("admin.delete"),
        cancelButtonText: t("admin.cancel"),
        type: "warning",
      },
    );
  } catch {
    return;
  }
  try {
    await apiRequest("/api/certifications/" + encodeURIComponent(item.id), {
      method: "DELETE",
    });
    await load();
    ElMessage.success(t("admin.contentDeleted"));
  } catch (error) {
    showRequestError(error, "删除");
  }
}

defineExpose({ load, openEditor });
onMounted(load);
</script>

<template>
  <el-card shadow="never" class="table-card cert-manager">
    <template #header>
      <div class="card-heading">
        <div>
          <strong>{{ $t("admin.certifications") }}</strong>
          <small
            >{{ publishedCount }} {{ $t("admin.certPublishedCount") }} ·
            {{ records.length }} {{ $t("admin.records") }} ·
            {{ homeCertifications.length }} 项首页展示</small
          >
        </div>
        <el-button type="primary" @click="openEditor()">{{
          $t("admin.certAdd")
        }}</el-button>
      </div>
    </template>
    <el-alert
      v-if="missingPublishedImages"
      class="cert-image-alert"
      type="warning"
      show-icon
      :closable="false"
      :title="$t('admin.certMissingImages', { count: missingPublishedImages })"
    />
    <el-table
      :data="records"
      v-loading="loading"
      row-key="id"
      :empty-text="$t('admin.certEmpty')"
    >
      <el-table-column :label="$t('admin.certName')" min-width="230">
        <template #default="{ row }">
          <div class="cert-name-cell">
            <a
              v-if="isPdf(row.image)"
              :href="row.image"
              target="_blank"
              rel="noopener"
              class="cert-thumbnail cert-thumbnail-empty"
              :aria-label="field(row, 'title')"
              ><el-icon><Document /></el-icon
            ></a>
            <el-image
              v-else-if="row.image"
              :src="row.image"
              fit="cover"
              class="cert-thumbnail"
            />
            <span v-else class="cert-thumbnail cert-thumbnail-empty"
              ><el-icon><Picture /></el-icon
            ></span>
            <span
              ><strong>{{ field(row, "title") }}</strong
              ><small>{{ field(row, "summary") }}</small>
              <el-tag
                v-if="!hasCertificateImage(row)"
                class="cert-image-missing"
                type="warning"
                size="small"
                >{{ $t("admin.certImageMissing") }}</el-tag
              >
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('admin.certIssuer')" min-width="150">
        <template #default="{ row }">{{
          field(row, "issuer") || "—"
        }}</template>
      </el-table-column>
      <el-table-column
        prop="certificateNo"
        :label="$t('admin.certNumber')"
        min-width="130"
      >
        <template #default="{ row }">{{ row.certificateNo || "—" }}</template>
      </el-table-column>
      <el-table-column :label="$t('admin.certValidity')" min-width="170">
        <template #default="{ row }"
          >{{ row.issuedAt || "—" }} → {{ row.expiresAt || "—" }}</template
        >
      </el-table-column>
      <el-table-column
        prop="sortOrder"
        :label="$t('admin.certOrder')"
        width="85"
      />
      <el-table-column :label="$t('admin.status')" width="110">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'published' ? 'success' : 'warning'"
            size="small"
          >
            {{
              $t(row.status === "published" ? "admin.published" : "admin.draft")
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="首页展示" width="110" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status === 'published' && row.showOnHome === true"
            :loading="homeSavingId === row.id"
            :disabled="saving || loading || row.status !== 'published'"
            :title="row.status !== 'published' ? '请先发布资质，再设置首页展示' : undefined"
            :aria-label="`${field(row, 'title')}：首页展示`"
            @change="setHomeDisplay(row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('admin.actions')"
        width="150"
        align="right"
        fixed="right"
      >
        <template #default="{ row }">
          <div class="cert-table-actions">
            <el-tooltip
              :content="$t('admin.edit')"
              :trigger="['hover', 'focus']"
              placement="top"
            >
              <el-button
                link
                type="primary"
                :icon="Edit"
                :aria-label="$t('admin.edit')"
                @click="openEditor(row)"
              />
            </el-tooltip>
            <el-tooltip
              :content="
                $t(
                  row.status === 'published'
                    ? 'admin.unpublish'
                    : 'admin.publish',
                )
              "
              :trigger="['hover', 'focus']"
              placement="top"
            >
              <el-button
                link
                :type="row.status === 'published' ? 'warning' : 'success'"
                :icon="Promotion"
                :aria-label="
                  $t(
                    row.status === 'published'
                      ? 'admin.unpublish'
                      : 'admin.publish',
                  )
                "
                @click="toggle(row)"
              />
            </el-tooltip>
            <el-tooltip
              :content="$t('admin.delete')"
              :trigger="['hover', 'focus']"
              placement="top"
            >
              <el-button
                link
                type="danger"
                :icon="Delete"
                :aria-label="$t('admin.delete')"
                @click="remove(row)"
              />
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <AdminEditorDialog
    v-model="dialogOpen"
    :title="$t(form.id ? 'admin.certEdit' : 'admin.certAdd')"
    :description="$t('admin.certDescription')"
    icon="CircleCheckFilled"
    width="min(1100px, calc(100vw - 40px))"
    :status="form.status"
    :dirty="editorDirty"
    :saving="saving"
    :save-disabled="imageUploading"
    @opened="focusValidationProblem"
    @save="save"
  >
    <el-form ref="editorForm" :model="form" label-position="top" @submit.prevent="save">
      <div class="cms-editor-layout">
        <div class="cms-editor-main">
          <AdminEditorPanel
            step="01"
            :title="$t('admin.editorBilingualContent')"
            :description="$t('admin.editorBilingualDescription')"
          >
            <el-alert
              class="bilingual-tip"
              type="info"
              :closable="false"
              show-icon
              :title="$t('admin.certBilingualHint')"
            />
            <el-tabs v-model="editingLocale">
              <el-tab-pane :label="$t('admin.chinese')" name="zh">
                <el-form-item :label="$t('admin.certNameZh')" data-cert-field="titleZh" :error="formErrors.titleZh" required>
                  <el-input
                    v-model="form.titleZh"
                    maxlength="255"
                    show-word-limit
                  />
                </el-form-item>
                <el-form-item :label="$t('admin.certSummaryZh')">
                  <el-input
                    v-model="form.summaryZh"
                    type="textarea"
                    :rows="3"
                    maxlength="3000"
                    show-word-limit
                  />
                </el-form-item>
                <el-form-item :label="$t('admin.certIssuerZh')">
                  <el-input v-model="form.issuerZh" maxlength="255" />
                </el-form-item>
              </el-tab-pane>
            </el-tabs>
          </AdminEditorPanel>
          <AdminEditorPanel
            step="02"
            :title="$t('admin.editorCertificateDetails')"
            :description="$t('admin.editorCertificateDescription')"
          >
            <div class="cms-field-grid">
              <el-form-item :label="$t('admin.certNumber')"
                ><el-input v-model="form.certificateNo" maxlength="255"
              /></el-form-item>
              <el-form-item :label="$t('admin.certOrder')">
                <el-input-number
                  v-model="form.sortOrder"
                  :min="0"
                  :max="9999"
                  controls-position="right"
                />
              </el-form-item>
              <el-form-item :label="$t('admin.certIssuedAt')">
                <el-date-picker
                  v-model="form.issuedAt"
                  type="date"
                  value-format="YYYY-MM-DD"
                  :placeholder="$t('admin.certSelectDate')"
                />
              </el-form-item>
              <el-form-item :label="$t('admin.certExpiresAt')" data-cert-field="expiresAt" :error="formErrors.expiresAt">
                <el-date-picker
                  v-model="form.expiresAt"
                  type="date"
                  value-format="YYYY-MM-DD"
                  :placeholder="$t('admin.certSelectDate')"
                />
              </el-form-item>
            </div>
          </AdminEditorPanel>
        </div>
        <aside class="cms-editor-aside">
          <AdminEditorPanel
            step="03"
            :title="$t('admin.editorDisplaySettings')"
            :description="$t('admin.certDisplayDescription')"
          >
            <el-form-item
              :label="$t('admin.certImage')"
              :required="form.status === 'published'"
              data-cert-field="image"
              :error="formErrors.image"
            >
              <ImageUpload
                v-model="form.image"
                kind="certification"
                :alt="form.titleZh"
                :active="dialogOpen"
                :context-key="form.id"
                :disabled="saving"
                @uploading="imageUploading = $event"
              />
              <p class="cert-image-requirement">
                {{ $t("admin.certImageRequirement") }}
              </p>
            </el-form-item>
            <el-form-item :label="$t('admin.status2')">
              <el-radio-group v-model="form.status" class="cms-status-options">
                <el-radio-button value="published">{{
                  $t("admin.published2")
                }}</el-radio-button>
                <el-radio-button value="draft">{{
                  $t("admin.draft2")
                }}</el-radio-button>
              </el-radio-group>
              <p class="cms-field-hint">
                {{
                  $t(
                    form.status === "published"
                      ? "admin.editorPublishedHint"
                      : "admin.editorDraftHint",
                  )
                }}
              </p>
            </el-form-item>
            <el-form-item label="首页展示">
              <el-switch v-model="form.showOnHome" :disabled="saving || form.status !== 'published'" aria-label="首页展示" />
              <p class="cms-field-hint">
                {{ form.status !== 'published' ? '请先发布资质，再设置首页展示。改为草稿会自动取消首页展示。' : '开启后，该资质会按排序值展示在首页。改为草稿会自动取消；全部关闭时，首页隐藏资质栏。' }}
              </p>
            </el-form-item>
          </AdminEditorPanel>
        </aside>
      </div>
    </el-form>
  </AdminEditorDialog>
</template>

<style scoped>
.cert-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.cert-name-cell > span:last-child {
  min-width: 0;
}
.cert-name-cell strong,
.cert-name-cell small {
  display: block;
}
.cert-name-cell strong {
  color: #263544;
  font-size: 12px;
}
.cert-name-cell small {
  margin-top: 3px;
  overflow: hidden;
  color: #8995a1;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cert-thumbnail {
  width: 48px;
  height: 48px;
  flex: none;
  border-radius: 4px;
}
.cert-thumbnail-empty {
  display: grid;
  place-items: center;
  background: #eef3f8;
  color: #9baabd;
  font-size: 20px;
}
.cert-table-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
.cert-table-actions :deep(.el-button) {
  margin-left: 0;
}
.cert-image-alert {
  margin-bottom: 16px;
}
.cert-image-missing {
  margin-top: 5px;
}
.cert-image-requirement {
  margin-top: 10px;
  color: #53647b;
  font-size: 12px;
  line-height: 1.75;
}
</style>
