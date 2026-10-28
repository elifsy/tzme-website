<script setup>
import { computed, ref, shallowRef, watch } from "vue";
import {
  ArrowLeft,
  ArrowRight,
  Close,
  TopRight,
} from "@element-plus/icons-vue";
import { localizedField } from "../services/catalog.js";
import { isPdf } from "../data/jDesign.js";
import PdfFirstPage from "./PdfFirstPage.vue";

const props = defineProps({
  modelValue: Boolean,
  certificate: { type: Object, default: null },
  certificates: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue", "select"]);
const opened = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
const current = shallowRef(null),
  view = ref("preview");
const field = (name) => localizedField(current.value, name, "zh");
const pdf = computed(() => isPdf(current.value?.image));
const position = computed(() =>
  props.certificates.findIndex((item) => item.id === current.value?.id),
);
const imageSources = computed(() => [
  ...new Set(
    [
      ...props.certificates
        .filter((item) => !isPdf(item.image))
        .map((item) => item.image),
      ...(!pdf.value ? [current.value?.image] : []),
    ].filter(Boolean),
  ),
]);
const metadata = computed(() =>
  [
    { label: "文件格式", value: pdf.value ? "PDF 文档" : "图片" },
    { label: "颁发机构", value: field("issuer") },
    { label: "证书编号", value: current.value?.certificateNo },
    { label: "颁发日期", value: current.value?.issuedAt },
    { label: "有效期至", value: current.value?.expiresAt },
  ].filter((item) => item.value),
);

watch(
  () => props.certificate,
  (value) => {
    // Retain the current document during the closing transition.
    if (value) {
      current.value = value;
      view.value = "preview";
    }
  },
  { immediate: true },
);
function select(offset) {
  const next = props.certificates[position.value + offset];
  if (next) emit("select", next.id);
}
function closed() {
  current.value = null;
  view.value = "preview";
}
</script>

<template>
  <el-dialog
    v-model="opened"
    class="certificate-details-dialog"
    width="var(--certificate-dialog-width)"
    align-center
    append-to-body
    destroy-on-close
    :show-close="false"
    @closed="closed"
  >
    <template #header="{ titleId, close }">
      <div class="certificate-dialog-heading">
        <div>
          <span class="certificate-dialog-eyebrow">资质认证</span>
          <h2 :id="titleId" aria-live="polite">
            {{ field("title") || "资质详情" }}
          </h2>
        </div>
        <button
          type="button"
          class="certificate-dialog-close"
          aria-label="关闭资质详情"
          @click="close"
        >
          <Close aria-hidden="true" />
        </button>
      </div>
    </template>
    <div v-if="current" class="certificate-dialog-layout">
      <section class="certificate-document-pane" aria-label="证书内容预览">
        <div class="certificate-document-toolbar">
          <span>{{ pdf ? "PDF 证书" : "证书图片" }}</span>
          <div
            v-if="pdf"
            class="certificate-view-switch"
            role="group"
            aria-label="证书阅读方式"
          >
            <button
              type="button"
              :aria-pressed="view === 'preview'"
              @click="view = 'preview'"
            >
              首页预览
            </button>
            <button
              type="button"
              :aria-pressed="view === 'document'"
              @click="view = 'document'"
            >
              完整文档
            </button>
          </div>
        </div>
        <div
          class="certificate-document-stage"
          :class="{ 'is-full-document': pdf && view === 'document' }"
        >
          <PdfFirstPage
            v-if="pdf && view === 'preview'"
            :key="current.image"
            :source="current.image"
            :label="field('title') + ' · 第一页'"
          />
          <iframe
            v-else-if="pdf"
            :key="current.image"
            class="certificate-document-frame"
            :src="current.image"
            :title="field('title') + ' · 完整文档'"
          />
          <el-image
            v-else
            :key="current.image"
            class="certificate-dialog-image"
            :src="current.image"
            :alt="field('title')"
            fit="contain"
            :preview-src-list="imageSources"
            :initial-index="imageSources.indexOf(current.image)"
            preview-teleported
            hide-on-click-modal
          >
            <template #error
              ><span class="certificate-dialog-image-error"
                >图片暂时无法显示，可打开原件查看。</span
              ></template
            >
          </el-image>
        </div>
      </section>
      <aside class="certificate-information">
        <div class="certificate-information-copy">
          <span class="certificate-dialog-eyebrow">认证说明</span>
          <p v-if="field('summary')" class="certificate-dialog-summary">
            {{ field("summary") }}
          </p>
          <dl class="certificate-information-meta">
            <div v-for="item in metadata" :key="item.label">
              <dt>{{ item.label }}</dt>
              <dd>{{ item.value }}</dd>
            </div>
          </dl>
          <a
            class="certificate-original-link"
            :href="current.image"
            target="_blank"
            rel="noopener"
            >{{ pdf ? "打开 PDF 原件" : "打开图片原件"
            }}<TopRight aria-hidden="true"
          /></a>
          <p class="certificate-original-hint">
            在新窗口中阅读或保存完整证书。
          </p>
        </div>
        <nav
          v-if="certificates.length > 1"
          class="certificate-dialog-navigation"
          aria-label="浏览其他资质"
        >
          <div>
            <span>浏览其他资质</span
            ><span role="status" aria-live="polite"
              >{{ String(position + 1).padStart(2, "0")
              }}<i aria-hidden="true"> / </i
              >{{ String(certificates.length).padStart(2, "0") }}</span
            >
          </div>
          <div class="certificate-navigation-actions">
            <button
              type="button"
              aria-label="上一项资质"
              :disabled="position <= 0"
              @click="select(-1)"
            >
              <ArrowLeft aria-hidden="true" /><span>上一项</span>
            </button>
            <button
              type="button"
              aria-label="下一项资质"
              :disabled="position < 0 || position >= certificates.length - 1"
              @click="select(1)"
            >
              <span>下一项</span><ArrowRight aria-hidden="true" />
            </button>
          </div>
        </nav>
      </aside>
    </div>
  </el-dialog>
</template>

<style>
.certificate-details-dialog.el-dialog {
  --certificate-dialog-width: min(1100px, calc(100vw - 64px));
  --el-dialog-padding-primary: 0;
  --el-dialog-border-radius: 2px;
  max-height: calc(100dvh - 48px);
  padding: 0;
  margin: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #123a50;
  font-family: var(--f-ui);
  box-shadow: 0 24px 90px #123a502b;
}
.certificate-details-dialog .el-dialog__header {
  flex-shrink: 0;
  padding: 0;
  margin: 0;
  border-bottom: 1px solid #deeaee;
}
.certificate-details-dialog .el-dialog__body {
  min-height: 0;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.certificate-dialog-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 24px 30px;
}
.certificate-dialog-eyebrow {
  display: block;
  color: #78939f;
  font-size: 10px;
  letter-spacing: 1.5px;
  line-height: 1.7;
}
.certificate-dialog-heading h2 {
  margin: 7px 0 0;
  color: #123a50;
  font: 650 27px/1.35 var(--f-ui);
  overflow-wrap: anywhere;
}
.certificate-dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border: 1px solid #dce8ed;
  background: #fff;
  color: #587a8b;
  cursor: pointer;
}
.certificate-dialog-close svg {
  width: 18px;
  height: 18px;
}
.certificate-dialog-close:hover {
  color: #087f91;
  background: #eff7f8;
  border-color: #a6c7d0;
}
.certificate-dialog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(285px, 1fr);
}
.certificate-document-pane {
  min-width: 0;
  background: #edf4f6;
}
.certificate-document-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  min-height: 54px;
  padding: 10px 24px;
  border-bottom: 1px solid #dce7eb;
}
.certificate-document-toolbar > span {
  font-size: 10px;
  color: #6f8c99;
  white-space: nowrap;
}
.certificate-view-switch {
  display: flex;
  gap: 3px;
  padding: 3px;
  background: #e2edf0;
}
.certificate-view-switch button {
  border: 0;
  background: transparent;
  color: #6b8794;
  padding: 6px 12px;
  font: 500 11px/1.6 var(--f-ui);
  cursor: pointer;
}
.certificate-view-switch button[aria-pressed="true"] {
  color: #087f91;
  background: #fff;
  box-shadow: 0 1px 4px #123a5009;
}
.certificate-document-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  height: clamp(300px, 57dvh, 600px);
  min-width: 0;
  padding: 25px 30px;
  box-sizing: border-box;
  background: radial-gradient(ellipse at 50% 35%, #fff9, transparent 75%);
}
.certificate-document-stage .pdf-first-page {
  min-height: 0;
}
.certificate-document-stage .pdf-first-page img,
.certificate-document-stage .pdf-first-page canvas {
  box-shadow: 0 9px 24px #274c601c;
}
.certificate-document-stage.is-full-document {
  padding: 0;
}
.certificate-document-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
.certificate-dialog-image.el-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: zoom-in;
}
.certificate-dialog-image .el-image__inner {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  box-shadow: 0 9px 24px #274c601c;
}
.certificate-dialog-image-error {
  color: #78909b;
  font-size: 12px;
  line-height: 1.8;
  text-align: center;
}
.certificate-information {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 36px;
  min-width: 0;
  padding: 34px 30px 26px;
  background: #fff;
}
.certificate-dialog-summary {
  margin: 13px 0 23px;
  font-size: 19px;
  font-weight: 550;
  line-height: 1.7;
  color: #123a50;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.certificate-information-meta {
  margin: 23px 0 30px;
  border-top: 1px solid #deeaee;
}
.certificate-information-meta > div {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 15px;
  padding: 13px 0;
  border-bottom: 1px solid #e6eef1;
  font-size: 11px;
  line-height: 1.8;
}
.certificate-information-meta dt {
  color: #7b929e;
}
.certificate-information-meta dd {
  margin: 0;
  color: #355c70;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.certificate-original-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 44px;
  padding: 11px 17px;
  background: #087f91;
  color: #fff;
  text-decoration: none;
  font: 600 12px/1.7 var(--f-ui);
  box-sizing: border-box;
}
.certificate-original-link svg {
  flex: 0 0 15px;
  width: 15px;
  height: 15px;
}
.certificate-original-link:hover {
  background: #066f80;
  color: #fff;
}
.certificate-original-hint {
  margin: 11px 0 0;
  color: #8a9da8;
  font-size: 10px;
  line-height: 1.8;
}
.certificate-dialog-navigation {
  padding-top: 20px;
  border-top: 1px solid #deeaee;
}
.certificate-dialog-navigation > div:first-child {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 10px;
  color: #78909d;
}
.certificate-dialog-navigation > div:first-child > span:last-child {
  color: #31576b;
  font-variant-numeric: tabular-nums;
}
.certificate-dialog-navigation i {
  margin: 0 3px;
  color: #a4b8c2;
  font-style: normal;
}
.certificate-navigation-actions {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 15px;
}
.certificate-navigation-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 36px;
  padding: 0;
  border: 0;
  background: none;
  color: #087f91;
  font: 500 11px/1.7 var(--f-ui);
  cursor: pointer;
}
.certificate-navigation-actions button:disabled {
  color: #b0c0c8;
  cursor: default;
}
.certificate-navigation-actions svg {
  width: 15px;
  height: 15px;
}
.certificate-details-dialog button:focus-visible,
.certificate-details-dialog a:focus-visible {
  outline: 2px solid #087f91;
  outline-offset: 3px;
}
@media (max-width: 700px) {
  .certificate-details-dialog.el-dialog {
    --certificate-dialog-width: calc(100vw - 24px);
    max-height: calc(100dvh - 24px);
  }
  .certificate-dialog-heading {
    padding: 18px 20px;
    gap: 16px;
  }
  .certificate-dialog-heading h2 {
    font-size: 22px;
    margin-top: 5px;
  }
  .certificate-dialog-close {
    flex-basis: 36px;
    width: 36px;
    height: 36px;
  }
  .certificate-dialog-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .certificate-document-toolbar {
    padding: 10px 16px;
    min-height: 50px;
  }
  .certificate-view-switch button {
    padding: 6px 10px;
    font-size: 10px;
  }
  .certificate-document-stage {
    height: clamp(230px, 38dvh, 340px);
    padding: 18px 22px;
  }
  .certificate-information {
    padding: 22px 20px 18px;
    gap: 23px;
  }
  .certificate-dialog-summary {
    font-size: 17px;
    margin: 9px 0 17px;
  }
  .certificate-information-meta {
    margin: 17px 0 20px;
  }
  .certificate-information-meta > div {
    padding: 10px 0;
  }
  .certificate-original-link {
    min-height: 42px;
  }
  .certificate-original-hint {
    font-size: 9px;
    margin-top: 9px;
  }
  .certificate-dialog-navigation {
    padding-top: 16px;
  }
  .certificate-navigation-actions {
    margin-top: 8px;
  }
}
</style>
