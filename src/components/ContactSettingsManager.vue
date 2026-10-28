<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import AdminEditorPanel from "./AdminEditorPanel.vue";
import AdminPreviewFrame from "./AdminPreviewFrame.vue";
import AdminSaveBar from "./AdminSaveBar.vue";
import { useAdminEditorState } from "../composables/useAdminEditorState.js";

import SubsidiaryCards from "./SubsidiaryCards.vue";
import SocialLinksEditor from "./SocialLinksEditor.vue";
import ContactFacilityFields from "./ContactFacilityFields.vue";
import ContactDetails from "./ContactDetails.vue";
import InquiryForm from "./InquiryForm.vue";
import {
  emptyFacility,
  ensureContactFacilities,
  validFacilityImage,
} from "../data/contactFacilities.js";
import { apiRequest } from "../services/api.js";
import {
  attachmentTypes,
  inquiryFieldLabels,
  saveContactSettings,
} from "../services/contactSettings.js";
import { editorLocales as availableLocales } from "../i18n/locales/index.js";
import {
  ensureSocialLinkLocales,
  MAX_SOCIAL_LINKS,
  socialPlatforms,
  validSocialIcon,
  validSocialUrl,
} from "../data/socialLinks.js";
import "../style/admin-editor.css";

const props = defineProps({ mode: { type: String, default: "company" } });
const route = useRoute();
const { t, locale } = useI18n({ useScope: "global" });
const form = ref(null);
const loading = ref(false);
const saving = ref(false);
const socialUploading = ref(false);
const facilityUploads = ref(new Set());
const uploading = computed(
  () => socialUploading.value || facilityUploads.value.size > 0,
);
const activeTab = ref("contact");
const availableTabs = computed(() =>
  props.mode === "inquiry" ? ["form"] : ["contact", "subsidiaries", "social"],
);
watch(
  () => [props.mode, route.query.section],
  () => {
    activeTab.value = availableTabs.value.includes(route.query.section)
      ? route.query.section
      : availableTabs.value[0];
  },
  { immediate: true },
);
const editingLocale = ref("zh");
const subsidiaryPreviewPage = ref("about");
const formPreviewPage = ref("contact");
const error = ref("");
const original = ref("");
const dirty = computed(() => JSON.stringify(form.value) !== original.value);
const bilingualContact = ["headquarters", "address", "port"];
const bilingualForm = [
  "title",
  "buttonText",
  "successText",
  "closedText",
  "privacyText",
];
let disposed = false;
async function load() {
  if (loading.value || saving.value || uploading.value) return;
  loading.value = true;
  error.value = "";
  try {
    const value = await apiRequest("/api/contact-settings/admin");
    if (!disposed) {
      form.value = ensureContactFacilities(
        ensureSocialLinkLocales(
          value,
          availableLocales.map((item) => item.code),
        ),
      );
      original.value = JSON.stringify(form.value);
    }
  } catch {
    if (!disposed) error.value = t("contactAdmin.loadFailed");
  } finally {
    if (!disposed) loading.value = false;
  }
}
function addSubsidiary() {
  if (form.value.subsidiaries.length >= 50) return;
  const text = () =>
    Object.fromEntries(availableLocales.map(({ code }) => [code, ""]));
  form.value.subsidiaries.push({
    id: crypto.randomUUID(),
    name: text(),
    address: text(),
    phone: "",
    email: "",
    website: "",
    facility: emptyFacility(),
    enabled: true,
    showOnAbout: true,
  });
}
function trackFacilityUpload(id, active) {
  active ? facilityUploads.value.add(id) : facilityUploads.value.delete(id);
}
function move(index, direction) {
  const items = form.value.subsidiaries;
  const target = index + direction;
  if (target >= 0 && target < items.length)
    [items[index], items[target]] = [items[target], items[index]];
}
function validEmail(value) {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}
function validate() {
  const value = form.value;
  for (const { code } of availableLocales) {
    if (
      ["headquarters", "address"].some(
        (key) => !value.contact[key]?.[code]?.trim(),
      ) ||
      ["title", "buttonText", "successText", "closedText"].some(
        (key) => !value.form[key]?.[code]?.trim(),
      ) ||
      value.subsidiaries.some(
        (item) => !item.name?.[code]?.trim() || !item.address?.[code]?.trim(),
      )
    )
      return t("contactAdmin.bilingualRequired");
  }
  if (
    value.contact.emails.some((email) => !validEmail(email)) ||
    value.subsidiaries.some((item) => item.email && !validEmail(item.email))
  )
    return t("contactAdmin.emailInvalid");
  if (value.upload.enabled && !value.upload.allowedExtensions.length)
    return t("contactAdmin.selectTypes");
  for (const item of [value.contact, ...value.subsidiaries]) {
    if (!validFacilityImage(item.facility.image))
      return t("contactAdmin.facilityImageInvalid");
    if (
      ["title", "description", "imageAlt"].some(
        (key) =>
          typeof item.facility[key]?.zh !== "string" ||
          item.facility[key].zh.length > (key === "description" ? 2000 : 255),
      )
    )
      return t("contactAdmin.facilityTextInvalid");
  }
  for (const links of availableLocales.map(
    ({ code }) => value.contact.socialLinks[code] || [],
  )) {
    if (
      !Array.isArray(links) ||
      links.length > MAX_SOCIAL_LINKS ||
      links.some(
        (item) =>
          !socialPlatforms.includes(item.platform) ||
          (item.enabled && !item.url.trim()) ||
          (item.url.trim() && !validSocialUrl(item.url.trim())),
      )
    )
      return t("contactAdmin.socialInvalid", { max: MAX_SOCIAL_LINKS });
    if (
      links.some(
        (item) =>
          item.platform === "link" && item.enabled && !item.label.trim(),
      )
    )
      return t("contactAdmin.socialCustomNameRequired");
    if (links.some((item) => !validSocialIcon(item.icon ?? "")))
      return t("contactAdmin.socialCustomIconInvalid");
  }
  return "";
}
async function save() {
  if (!form.value || saving.value || loading.value) return;
  if (uploading.value) {
    ElMessage.info(t("contactAdmin.imagesUploading"));
    return;
  }
  const message = validate();
  if (message) {
    ElMessage.warning(message);
    return;
  }
  saving.value = true;
  try {
    const value = await saveContactSettings(form.value);
    if (disposed) return;
    form.value = ensureContactFacilities(value);
    original.value = JSON.stringify(form.value);
    error.value = "";
    ElMessage.success(t("contactAdmin.saved"));
  } catch {
    if (!disposed) ElMessage.error(t("contactAdmin.saveFailed"));
  } finally {
    if (!disposed) saving.value = false;
  }
}
onMounted(load);
onBeforeUnmount(() => {
  disposed = true;
});
useAdminEditorState({ dirty, saving, loading, uploading });
const publicPath = computed(() =>
  props.mode === "inquiry"
    ? formPreviewPage.value === "home"
      ? "/"
      : "/contact"
    : activeTab.value === "social"
      ? "/"
      : activeTab.value === "subsidiaries" &&
          subsidiaryPreviewPage.value === "about"
        ? "/about"
        : "/contact",
);
defineExpose({ load, publicPath });
</script>

<template>
  <div v-loading="loading" class="contact-settings-manager">
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      ><el-button @click="load">{{
        $t("admin.retryDatabase")
      }}</el-button></el-alert
    >
    <el-form
      v-if="form"
      label-position="top"
      :disabled="saving"
      class="contact-settings-form"
      @submit.prevent="save"
    >
      <div v-if="mode !== 'inquiry'" class="contact-settings-toolbar">
        <el-tabs v-model="activeTab"
          ><el-tab-pane
            v-for="key in availableTabs"
            :key="key"
            :name="key"
            :label="$t('contactAdmin.tabs.' + key)"
        /></el-tabs>
      </div>
      <div v-show="activeTab === 'contact'" class="contact-settings-grid">
        <AdminEditorPanel
          step="01"
          :title="$t('contactAdmin.contactText')"
          :description="$t('contactAdmin.sharedHint')"
        >
          <el-form-item
            v-for="key in bilingualContact"
            :key="key"
            :label="$t('contactAdmin.fields.' + key)"
            :required="key !== 'port'"
          >
            <el-input
              v-model="form.contact[key][editingLocale]"
              :type="key === 'address' ? 'textarea' : 'text'"
              :rows="3"
              :maxlength="key === 'address' ? 2000 : key === 'port' ? 500 : 255"
              show-word-limit
            />
          </el-form-item>
        </AdminEditorPanel>
        <AdminEditorPanel step="02" :title="$t('contactAdmin.contactChannels')">
          <el-form-item
            v-for="key in ['phone', 'fax', 'website']"
            :key="key"
            :label="$t('contactAdmin.fields.' + key)"
            ><el-input
              v-model="form.contact[key]"
              :maxlength="key === 'website' ? 500 : 255"
          /></el-form-item>
          <el-form-item :label="$t('contactAdmin.fields.emails')"
            ><el-select
              v-model="form.contact.emails"
              multiple
              filterable
              allow-create
              default-first-option
              :multiple-limit="10"
              :placeholder="$t('contactAdmin.emailEnter')"
          /></el-form-item>
          <p class="cms-field-hint">
            {{ $t("contactAdmin.emailContactHint") }}
          </p>
        </AdminEditorPanel>
      </div>
      <div v-if="activeTab === 'contact'" class="contact-direct-preview">
        <AdminPreviewFrame title="公开联系方式预览" public-path="/contact"
          ><section class="hc-sec">
            <div class="hc-w">
              <h2 class="hc-h2">{{ form.contact.headquarters.zh }}</h2>
              <ContactDetails :contact="form.contact" />
            </div></section
        ></AdminPreviewFrame>
      </div>
      <div v-show="activeTab === 'subsidiaries'">
        <p class="contact-settings-help">
          {{ $t("contactAdmin.subsidiaryHint") }}
        </p>
        <div class="contact-subsidiaries-layout">
          <div class="contact-subsidiaries-config">
            <AdminEditorPanel
              step="01"
              :title="
                form.contact.facility.title.zh || form.contact.headquarters.zh
              "
              :description="$t('contactAdmin.headquartersFacilityHint')"
              class="contact-subsidiary-panel"
              data-company-editor="headquarters"
            >
              <ContactFacilityFields
                v-model="form.contact.facility"
                context-key="headquarters"
                :disabled="saving"
                :active="activeTab === 'subsidiaries'"
                @uploading="trackFacilityUpload('headquarters', $event)"
              />
              <div class="contact-settings-grid contact-settings-grid-inside">
                <div>
                  <el-form-item
                    :label="$t('contactAdmin.fields.headquarters')"
                    required
                    ><el-input
                      v-model="form.contact.headquarters.zh"
                      maxlength="255"
                  /></el-form-item>
                  <el-form-item
                    :label="$t('contactAdmin.fields.address')"
                    required
                    ><el-input
                      v-model="form.contact.address.zh"
                      type="textarea"
                      :rows="3"
                      maxlength="2000"
                  /></el-form-item>
                </div>
                <div>
                  <el-form-item
                    v-for="key in ['phone', 'website']"
                    :key="key"
                    :label="$t('contactAdmin.fields.' + key)"
                    ><el-input
                      v-model="form.contact[key]"
                      :maxlength="key === 'website' ? 500 : 255"
                  /></el-form-item>
                  <el-form-item :label="$t('contactAdmin.fields.emails')"
                    ><el-select
                      v-model="form.contact.emails"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                      :multiple-limit="10"
                      :placeholder="$t('contactAdmin.emailEnter')"
                  /></el-form-item>
                </div>
              </div>
            </AdminEditorPanel>
            <AdminEditorPanel
              v-for="(item, index) in form.subsidiaries"
              :key="item.id"
              :step="String(index + 2).padStart(2, '0')"
              :title="
                item.name[editingLocale] || $t('contactAdmin.newSubsidiary')
              "
              class="contact-subsidiary-panel"
              :data-company-editor="'subsidiary-' + item.id"
            >
              <ContactFacilityFields
                v-model="item.facility"
                :context-key="'subsidiary-' + item.id"
                :disabled="saving"
                :active="activeTab === 'subsidiaries'"
                @uploading="
                  trackFacilityUpload('subsidiary-' + item.id, $event)
                "
              />
              <div class="contact-settings-grid contact-settings-grid-inside">
                <div>
                  <el-form-item
                    :label="$t('contactAdmin.subsidiaryName')"
                    required
                    ><el-input
                      v-model="item.name[editingLocale]"
                      maxlength="255" /></el-form-item
                  ><el-form-item :label="$t('site.address')" required
                    ><el-input
                      v-model="item.address[editingLocale]"
                      type="textarea"
                      :rows="3"
                      maxlength="2000"
                  /></el-form-item>
                </div>
                <div>
                  <el-form-item
                    v-for="key in ['phone', 'email', 'website']"
                    :key="key"
                    :label="$t('contactAdmin.fields.' + key)"
                    ><el-input
                      v-model="item[key]"
                      :maxlength="key === 'website' ? 500 : 255"
                  /></el-form-item>
                </div>
              </div>
              <div class="contact-subsidiary-actions">
                <el-checkbox v-model="item.enabled">{{
                  $t("contactAdmin.visible")
                }}</el-checkbox
                ><el-checkbox v-model="item.showOnAbout">{{
                  $t("contactAdmin.showOnAbout")
                }}</el-checkbox
                ><el-button
                  size="small"
                  :disabled="uploading || index === 0"
                  @click="move(index, -1)"
                  >{{ $t("contactAdmin.moveUp") }}</el-button
                ><el-button
                  size="small"
                  :disabled="
                    uploading || index === form.subsidiaries.length - 1
                  "
                  @click="move(index, 1)"
                  >{{ $t("contactAdmin.moveDown") }}</el-button
                ><el-button
                  size="small"
                  type="danger"
                  plain
                  :disabled="uploading"
                  @click="form.subsidiaries.splice(index, 1)"
                  >{{ $t("admin.delete") }}</el-button
                >
              </div>
            </AdminEditorPanel>
            <el-button
              type="primary"
              plain
              :disabled="uploading || form.subsidiaries.length >= 50"
              @click="addSubsidiary"
              ><el-icon><Plus /></el-icon
              >{{ $t("contactAdmin.addSubsidiary") }}</el-button
            >
          </div>
          <aside
            v-if="activeTab === 'subsidiaries'"
            class="contact-subsidiaries-preview"
            :aria-label="$t('contactAdmin.subsidiaryPreview')"
          >
            <el-radio-group
              v-model="subsidiaryPreviewPage"
              class="subsidiary-preview-pages"
              aria-label="选择预览页面"
              ><el-radio-button value="about">关于我们</el-radio-button
              ><el-radio-button value="contact"
                >联系我们</el-radio-button
              ></el-radio-group
            >
            <AdminPreviewFrame
              title="企业资料效果预览"
              :public-path="
                subsidiaryPreviewPage === 'about' ? '/about' : '/contact'
              "
              ><section
                class="hc-sec"
                :class="{ 'j-soft': subsidiaryPreviewPage === 'about' }"
              >
                <div class="hc-w">
                  <h2 class="hc-h2" style="margin-bottom: 32px">
                    {{
                      subsidiaryPreviewPage === "about"
                        ? "总部与下属企业"
                        : "下属企业"
                    }}
                  </h2>
                  <SubsidiaryCards
                    :configuration="form"
                    :locale-code="editingLocale"
                    :about-only="subsidiaryPreviewPage === 'about'"
                    :include-headquarters="subsidiaryPreviewPage === 'about'"
                    :show-media="subsidiaryPreviewPage === 'about'"
                  />
                </div></section
            ></AdminPreviewFrame>
          </aside>
        </div>
      </div>
      <SocialLinksEditor
        v-show="activeTab === 'social'"
        v-model="form.contact.socialLinks[editingLocale]"
        :locale-code="editingLocale"
        :disabled="saving"
        :active="activeTab === 'social'"
        @uploading="socialUploading = $event"
      />
      <div v-show="activeTab === 'form'" class="contact-form-layout">
        <div class="contact-settings-grid">
          <AdminEditorPanel step="01" :title="$t('contactAdmin.formSettings')">
            <div class="contact-settings-switches">
              <el-checkbox v-model="form.form.enabled">{{
                $t("contactAdmin.formEnabled")
              }}</el-checkbox
              ><el-checkbox v-model="form.form.showOnHome">{{
                $t("contactAdmin.showOnHome")
              }}</el-checkbox
              ><el-checkbox v-model="form.form.showOnContact">{{
                $t("contactAdmin.showOnContact")
              }}</el-checkbox>
            </div>
            <el-form-item
              v-for="key in bilingualForm"
              :key="key"
              :label="$t('contactAdmin.formText.' + key)"
              :required="key !== 'privacyText'"
              ><el-input
                v-model="form.form[key][editingLocale]"
                :type="
                  ['successText', 'closedText', 'privacyText'].includes(key)
                    ? 'textarea'
                    : 'text'
                "
                :rows="2"
                maxlength="1000"
            /></el-form-item>
            <el-checkbox v-model="form.form.showPrivacy">{{
              $t("contactAdmin.showPrivacy")
            }}</el-checkbox>
            <el-form-item :label="$t('contactAdmin.requiredFields')"
              ><el-checkbox-group v-model="form.form.requiredFields"
                ><el-checkbox
                  v-for="(label, key) in inquiryFieldLabels"
                  :key="key"
                  :value="key"
                  >{{ $t(label).replace(/\s*[*＊]\s*$/, "") }}</el-checkbox
                ></el-checkbox-group
              ></el-form-item
            >
          </AdminEditorPanel>
          <AdminEditorPanel
            step="02"
            :title="$t('contactAdmin.uploadSettings')"
            :description="$t('contactAdmin.uploadServerHint')"
          >
            <el-form-item :label="$t('contactAdmin.uploadEnabled')"
              ><el-switch v-model="form.upload.enabled"
            /></el-form-item>
            <el-form-item
              :label="$t('contactAdmin.allowedTypes')"
              :required="form.upload.enabled"
              ><el-checkbox-group
                v-model="form.upload.allowedExtensions"
                class="contact-file-types"
                ><el-checkbox
                  v-for="extension in attachmentTypes"
                  :key="extension"
                  :value="extension"
                  >{{ extension.toUpperCase() }}</el-checkbox
                ></el-checkbox-group
              ></el-form-item
            >
            <el-form-item :label="$t('contactAdmin.maxSize')"
              ><el-input-number
                v-model="form.upload.maxFileSizeMb"
                :min="1"
                :max="50"
                :precision="0"
                controls-position="right"
              /><span class="contact-settings-unit">MB</span></el-form-item
            >
            <el-form-item :label="$t('contactAdmin.maxFiles')"
              ><el-input-number
                v-model="form.upload.maxFiles"
                :min="1"
                :max="10"
                :precision="0"
                controls-position="right"
            /></el-form-item>
          </AdminEditorPanel>
        </div>
        <aside v-if="activeTab === 'form'" class="contact-form-preview">
          <el-radio-group
            v-model="formPreviewPage"
            class="subsidiary-preview-pages"
            aria-label="选择表单预览位置"
            ><el-radio-button value="contact">联系我们</el-radio-button
            ><el-radio-button value="home"
              >首页</el-radio-button
            ></el-radio-group
          ><el-alert
            v-if="
              !form.form[
                formPreviewPage === 'home' ? 'showOnHome' : 'showOnContact'
              ]
            "
            title="此位置已关闭表单展示，下面仍可预览编辑内容"
            type="info"
            :closable="false"
          /><AdminPreviewFrame
            title="咨询表单效果预览"
            :public-path="formPreviewPage === 'home' ? '/' : '/contact'"
            ><section class="hc-sec">
              <div class="hc-w inquiry-preview-content">
                <InquiryForm
                  :configuration="form"
                  :placement="formPreviewPage"
                  preview
                />
              </div></section
          ></AdminPreviewFrame>
        </aside>
      </div>
      <AdminSaveBar
        class="contact-settings-footer"
        :dirty="Boolean(dirty)"
        :saving="saving"
        :busy="uploading"
        :disabled="loading"
        @save="save"
      />
    </el-form>
  </div>
</template>

<style scoped>
.contact-settings-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}
.inquiry-preview-content {
  max-width: 650px;
}
.contact-settings-toolbar > .el-tabs {
  flex: 1;
  min-width: 0;
}
.contact-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
}
.contact-settings-grid-inside {
  gap: 16px;
  align-items: start;
}
.contact-settings-form :deep(.el-select) {
  width: 100%;
}
.contact-settings-form :deep(.el-input-number) {
  width: min(180px, 100%);
}
.contact-settings-help {
  color: #4d637c;
  font-size: 13px;
  line-height: 1.8;
  margin: 0 0 20px;
}
.contact-subsidiary-panel {
  margin-bottom: 20px;
}
.contact-subsidiaries-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 20px;
  align-items: start;
}
.contact-subsidiaries-config,
.contact-subsidiaries-preview {
  min-width: 0;
}
.contact-subsidiaries-preview {
  position: sticky;
  top: 24px;
}
.contact-subsidiaries-preview :deep(.cms-panel-heading p) {
  color: #52667d;
}
.subsidiary-preview-pages {
  display: flex;
  width: 100%;
  margin-bottom: 18px;
}
.subsidiary-preview-pages :deep(.el-radio-button) {
  flex: 1;
}
.subsidiary-preview-pages :deep(.el-radio-button__inner) {
  display: block;
  padding: 10px 8px;
}
.subsidiary-preview-body {
  max-height: max(280px, calc(100dvh - 290px));
  overflow-y: auto;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
  padding: 16px;
  background: var(--navy);
  border-radius: 10px;
  font-family: var(--f-cn);
}
.subsidiary-preview-body:has(.facility-cards) {
  background: #f4f9fa;
}
.subsidiary-preview-body:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 3px;
}
.subsidiary-preview-body :deep(.subsidiary-cards) {
  grid-template-columns: minmax(0, 1fr);
  margin-top: 0;
}
.subsidiary-preview-body :deep(.el-empty__description p) {
  color: #c1cfdb;
}
.contact-subsidiary-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.contact-subsidiary-actions .el-button {
  margin-left: 0;
}
.contact-settings-switches {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 20px;
}
.contact-file-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.contact-file-types .el-checkbox {
  margin-right: 0;
}
.contact-settings-unit {
  margin-left: 12px;
}
.contact-settings-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  background: #fff;
  border: 1px solid #dce5ef;
  border-radius: 10px;
  padding: 16px 20px;
  margin-top: 20px;
  color: #4d637c;
  font-size: 13px;
}
@media (max-width: 1100px) {
  .contact-subsidiaries-layout {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
  .contact-subsidiaries-config .contact-settings-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 900px) {
  .contact-settings-grid,
  .contact-subsidiaries-layout {
    grid-template-columns: 1fr;
  }
  .contact-subsidiaries-preview {
    position: static;
  }
  .subsidiary-preview-body {
    max-height: none;
  }
  .contact-settings-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 0;
  }
}
</style>
