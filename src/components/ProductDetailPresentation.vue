<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { localizedField } from "../services/catalog.js";
import { industryField } from "../services/industries.js";
import {
  equipmentFrameStyle,
  knownEquipmentImage,
  measureEquipmentImage,
  resolveEquipmentLayout,
} from "../utils/equipmentPresentation.js";
import EquipmentImage from "./EquipmentImage.vue";
import ManufacturingQuality from "./ManufacturingQuality.vue";
import { useCapabilities } from "../services/capabilities.js";
import { useEquipmentDepth } from "../composables/useEquipmentDepth.js";
import { responsiveImage } from "../utils/responsiveImages.js";

const props = defineProps({
  record: { type: Object, required: true },
  products: { type: Array, default: () => [] },
  industries: { type: Array, default: () => [] },
  listLink: { type: String, default: "/solutions" },
  preview: Boolean,
});
const { locale, t } = useI18n({ useScope: "global" });
const { capabilities, loadCapabilities } = useCapabilities();
const root = ref(null),
  imageRef = ref(null),
  activeChapter = ref("product-introduction"),
  failedImages = ref([]);
const stage = ref(null),
  imageMetrics = ref(null),
  stageSize = ref({ width: 0, height: 0, mobile: false });
const hero = ref(null);
const field = (item, name) => {
  // Optional Chinese fields can be deliberately cleared in the Chinese-only editor.
  if (
    locale.value === "zh" &&
    ["summary", "content", "features", "specifications"].includes(name) &&
    item?.[`${name}Zh`] != null
  )
    return item[`${name}Zh`];
  return localizedField(item, name, locale.value);
};
const title = computed(
  () =>
    field(props.record, "title") ||
    (props.preview ? t("productDetail.namePlaceholder") : ""),
);
const category = computed(() =>
  [
    ...new Set(
      [
        field(props.record, "category"),
        ...(props.record.industries || []).map((id) => {
          const industry = props.industries.find(
            (item) => item.id === id && item.status === "published",
          );
          return industry ? industryField(industry, "title", locale.value) : "";
        }),
      ].filter(Boolean),
    ),
  ].join(" · "),
);
const primaryCategory = computed(
  () => field(props.record, "category") || category.value,
);
const lines = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
const features = computed(() => lines(field(props.record, "features")));
const specifications = computed(() =>
  lines(field(props.record, "specifications")).map((line) => {
    const separator = line.search(/[:：]/);
    return separator < 0
      ? { label: "", value: line }
      : {
          label: line.slice(0, separator).trim(),
          value: line.slice(separator + 1).trim(),
        };
  }),
);
const related = computed(() => {
  const other = props.products.filter(
    (item) => item.status === "published" && item.id !== props.record.id,
  );
  const matches = (item) =>
    item.industries?.some((id) => props.record.industries?.includes(id)) ||
    field(item, "category") === field(props.record, "category");
  return [
    ...other.filter(matches),
    ...other.filter((item) => !matches(item)),
  ].slice(0, 3);
});
const chapters = computed(() => [
  { id: "product-introduction", label: t("productDetail.introduction") },
  ...(features.value.length
    ? [{ id: "product-features", label: t("productDetail.features") }]
    : []),
  ...(specifications.value.length
    ? [
        {
          id: "product-specifications",
          label: t("productDetail.specifications"),
        },
      ]
    : []),
  ...(related.value.length
    ? [{ id: "product-related", label: t("productDetail.related") }]
    : []),
]);
const heroImage = computed(
  () =>
    [props.record.presentationImage, props.record.image].find(
      (src) => src && !failedImages.value.includes(src),
    ) || "",
);
const hasPresentationImage = computed(() =>
  Boolean(
    props.record.presentationImage &&
    heroImage.value === props.record.presentationImage,
  ),
);
const layout = computed(() =>
  resolveEquipmentLayout(
    props.record.detailLayout,
    imageMetrics.value,
    hasPresentationImage.value,
  ),
);
const silhouette = computed(() => {
  const bounds = imageMetrics.value?.bounds;
  const ratio = bounds
    ? (bounds.maxX - bounds.minX + 1) / (bounds.maxY - bounds.minY + 1)
    : 1;
  return {
    "equipment-shape-tall": ratio < 0.85,
    "equipment-shape-compact": ratio >= 0.85 && ratio < 1.55,
    "equipment-ropeway-system":
      props.record.id === "ropeway" && hasPresentationImage.value,
  };
});
const resetDepth = useEquipmentDepth(
  hero,
  computed(
    () =>
      hasPresentationImage.value && Boolean(imageMetrics.value?.transparent),
  ),
);
const frameStyle = computed(() =>
  equipmentFrameStyle(imageMetrics.value, stageSize.value, layout.value),
);
const previewImages = computed(() => [
  ...new Set(
    [props.record.image, props.record.presentationImage].filter(
      (src) => src && !failedImages.value.includes(src),
    ),
  ),
]);
const relatedLink = (item) => ({
  path: `/solutions/${item.id}`,
  query: props.listLink === "/solutions" ? {} : { from: props.listLink },
});
function imageFailed() {
  if (heroImage.value)
    failedImages.value = [...failedImages.value, heroImage.value];
}
function imageLoaded(event) {
  const image = event.target;
  if (image?.naturalWidth && image?.naturalHeight)
    imageMetrics.value =
      knownEquipmentImage(heroImage.value) ||
      measureEquipmentImage(image, heroImage.value);
}
function openImage() {
  if (!props.preview && heroImage.value) imageRef.value?.showPreview();
}
let scrollFrame,
  initialScrollFrame,
  resizeObserver,
  stageObserver,
  ownerWindow,
  chosenChapter,
  chosenAt = 0;
function chooseChapter(id) {
  if (!props.preview) {
    chosenChapter = id;
    chosenAt = performance.now();
    activeChapter.value = id;
  }
}
function updateChapter() {
  scrollFrame = undefined;
  if (!root.value || props.preview) return;
  const doc = root.value.ownerDocument;
  const offset =
    (doc.querySelector(".hc-nav")?.getBoundingClientRect().height || 0) +
    (root.value.querySelector(".equipment-chapters")?.getBoundingClientRect()
      .height || 0) +
    36;
  if (chosenChapter) {
    const rect = root.value
      .querySelector(`#${chosenChapter}`)
      ?.getBoundingClientRect();
    if (rect && rect.top <= offset + 4 && rect.bottom >= offset) {
      activeChapter.value = chosenChapter;
      return;
    }
    // Keep the requested chapter highlighted while the browser animates to its anchor.
    if (performance.now() - chosenAt < 1200) return;
    chosenChapter = undefined;
  }
  let current = chapters.value[0].id;
  for (const chapter of chapters.value) {
    // Specifications sit beside the introduction on desktop; scrolling follows the reading column.
    if (chapter.id === "product-specifications" && ownerWindow.innerWidth > 700)
      continue;
    const element = root.value.querySelector(`#${chapter.id}`);
    if (element && element.getBoundingClientRect().top <= offset)
      current = chapter.id;
  }
  activeChapter.value = current;
}
function scheduleChapter() {
  if (!scrollFrame)
    scrollFrame = ownerWindow?.requestAnimationFrame(updateChapter);
}
function restoreImageFocus() {
  nextTick(() =>
    root.value
      ?.querySelector(".equipment-stage .el-image__inner")
      ?.focus({ preventScroll: true }),
  );
}
watch(
  () => props.record.id,
  async () => {
    resetDepth();
    failedImages.value = [];
    activeChapter.value = "product-introduction";
    await nextTick();
    scheduleChapter();
  },
);
watch(
  () => [props.record.image, props.record.presentationImage],
  () => {
    failedImages.value = [];
  },
);
watch(
  heroImage,
  (source) => {
    imageMetrics.value = knownEquipmentImage(source);
  },
  { immediate: true },
);
onMounted(() => {
  if (!capabilities.value) loadCapabilities();
  ownerWindow = root.value.ownerDocument.defaultView;
  stageObserver = new ResizeObserver((entries) => {
    const rect = entries[0].contentRect;
    stageSize.value = {
      width: rect.width,
      height: rect.height,
      mobile: ownerWindow.innerWidth <= 700,
    };
  });
  stageObserver.observe(stage.value);
  if (props.preview) return;
  ownerWindow.addEventListener("scroll", scheduleChapter, { passive: true });
  resizeObserver = new ResizeObserver(scheduleChapter);
  resizeObserver.observe(root.value);
  scheduleChapter();
  const initialChapter = ownerWindow.location.hash.slice(1);
  if (chapters.value.some((chapter) => chapter.id === initialChapter))
    nextTick(() => {
      initialScrollFrame = ownerWindow.requestAnimationFrame(() => {
        initialScrollFrame = undefined;
        const target = root.value?.querySelector(`#${initialChapter}`);
        if (!target) return;
        chooseChapter(initialChapter);
        // Use the same offset as router navigation, without adding html scroll-padding twice.
        ownerWindow.scrollTo({
          top:
            target.getBoundingClientRect().top +
            ownerWindow.scrollY -
            (parseFloat(getComputedStyle(target).scrollMarginTop) || 0),
          behavior: "instant",
        });
      });
    });
});
onBeforeUnmount(() => {
  ownerWindow?.removeEventListener("scroll", scheduleChapter);
  ownerWindow?.cancelAnimationFrame(scrollFrame);
  ownerWindow?.cancelAnimationFrame(initialScrollFrame);
  resizeObserver?.disconnect();
  stageObserver?.disconnect();
});
</script>

<template>
  <div
    ref="root"
    class="equipment-detail"
    :class="{ 'equipment-detail-preview': preview }"
  >
    <section
      ref="hero"
      class="equipment-detail-hero"
      :class="[
        `equipment-layout-${layout}`,
        silhouette,
        { 'equipment-detail-hero-photo': !hasPresentationImage },
      ]"
      :aria-label="title"
    >
      <div class="hc-w equipment-hero-inner">
        <nav
          class="equipment-breadcrumb"
          :aria-label="$t('productDetail.breadcrumb')"
        >
          <router-link to="/">{{ $t("site.navHome") }}</router-link
          ><span aria-hidden="true">/</span>
          <router-link class="j-detail-back" :to="listLink">{{
            $t("site.productCenter")
          }}</router-link>
          <template v-if="primaryCategory"
            ><span aria-hidden="true">/</span
            ><span>{{ primaryCategory }}</span></template
          >
        </nav>
        <div class="equipment-hero-grid">
          <div class="equipment-hero-copy">
            <p v-if="primaryCategory" class="equipment-category">
              {{ primaryCategory }}
            </p>
            <h1 class="site-page-title">{{ title }}</h1>
            <span class="equipment-title-rule" aria-hidden="true" />
          </div>
          <div class="equipment-hero-summary">
            <p
              v-if="field(record, 'summary')"
              class="equipment-summary site-intro-description"
            >
              {{ field(record, "summary") }}
            </p>
            <router-link
              class="equipment-inquiry-button equipment-inline-inquiry"
              to="/contact"
              >{{ $t("productDetail.inquire")
              }}<span aria-hidden="true">→</span></router-link
            >
          </div>
          <figure
            ref="stage"
            class="equipment-stage"
            :class="{ 'equipment-stage-cutout': hasPresentationImage }"
          >
            <div class="equipment-image-frame" :style="frameStyle">
              <span
                v-if="hasPresentationImage && imageMetrics?.transparent"
                class="equipment-floor-shadow"
                aria-hidden="true"
              />
              <el-image
                v-if="heroImage"
                ref="imageRef"
                v-bind="
                  responsiveImage(heroImage, '(max-width:700px) 100vw, 55vw')
                "
                :alt="title"
                fit="contain"
                fetchpriority="high"
                :preview-src-list="preview ? [] : previewImages"
                preview-teleported
                hide-on-click-modal
                :tabindex="preview ? -1 : 0"
                :role="preview ? undefined : 'button'"
                :aria-label="$t('productDetail.zoomImage', { title })"
                @error="imageFailed"
                @load="imageLoaded"
                @close="restoreImageFocus"
                @keydown.enter.prevent="openImage"
                @keydown.space.prevent="openImage"
              />
              <div v-else class="equipment-image-placeholder">
                {{ $t("productDetail.imagePlaceholder") }}
              </div>
            </div>
            <figcaption v-if="heroImage" class="equipment-image-hint">
              {{ title }}<span aria-hidden="true">↗</span>
            </figcaption>
          </figure>
          <div class="equipment-hero-actions">
            <router-link class="equipment-inquiry-button" to="/contact"
              >{{ $t("productDetail.inquire")
              }}<span aria-hidden="true">→</span></router-link
            >
            <p class="equipment-process">
              {{ $t("productDetail.manufacturingLine") }}
            </p>
            <a
              v-if="specifications.length"
              class="equipment-specification-link"
              href="#product-specifications"
              @click="chooseChapter('product-specifications')"
              >{{ $t("productDetail.viewSpecifications")
              }}<span aria-hidden="true">↓</span></a
            >
            <p class="equipment-endnote">
              {{ $t("productDetail.manufacturingNote") }}
            </p>
          </div>
        </div>
      </div>
    </section>
    <nav class="equipment-chapters" :aria-label="$t('productDetail.chapters')">
      <div class="hc-w">
        <a
          v-for="chapter in chapters"
          :key="chapter.id"
          :href="`#${chapter.id}`"
          :aria-current="activeChapter === chapter.id ? 'location' : undefined"
          @click="chooseChapter(chapter.id)"
          >{{ chapter.label }}</a
        >
      </div>
    </nav>
    <section class="equipment-information">
      <div
        class="hc-w equipment-information-grid"
        :class="{
          'equipment-information-single':
            !specifications.length && !capabilities?.enabled,
        }"
      >
        <div>
          <section
            id="product-introduction"
            class="equipment-section equipment-introduction"
          >
            <h2>
              {{ $t("productDetail.introduction") }}<span aria-hidden="true" />
            </h2>
            <p v-if="field(record, 'content') || field(record, 'summary')">
              {{ field(record, "content") || field(record, "summary") }}
            </p>
          </section>
          <section
            v-if="features.length"
            id="product-features"
            class="equipment-section equipment-features"
          >
            <h2>
              {{ $t("productDetail.features") }}<span aria-hidden="true" />
            </h2>
            <ol>
              <li v-for="(feature, index) in features" :key="index">
                <span class="equipment-feature-number" aria-hidden="true">{{
                  String(index + 1).padStart(2, "0")
                }}</span
                ><span>{{ feature }}</span>
              </li>
            </ol>
          </section>
        </div>
        <div
          v-if="specifications.length || capabilities?.enabled"
          class="equipment-information-aside"
        >
          <section
            v-if="specifications.length"
            id="product-specifications"
            class="equipment-section equipment-specifications product-detail-specs"
          >
            <h2>
              {{ $t("productDetail.specifications")
              }}<span aria-hidden="true" />
            </h2>
            <dl>
              <div
                v-for="(spec, index) in specifications"
                :key="index"
                :class="{ 'equipment-specification-note': !spec.label }"
              >
                <dt v-if="spec.label">{{ spec.label }}</dt>
                <dd>{{ spec.value }}</dd>
              </div>
            </dl>
          </section>
          <ManufacturingQuality compact />
        </div>
      </div>
    </section>
    <section
      v-if="related.length"
      id="product-related"
      class="equipment-section equipment-related"
    >
      <div class="hc-w">
        <div class="equipment-related-heading">
          <h2>{{ $t("productDetail.related") }}<span aria-hidden="true" /></h2>
          <router-link :to="listLink"
            >{{ $t("productDetail.allProducts")
            }}<span aria-hidden="true">→</span></router-link
          >
        </div>
        <div class="equipment-related-grid">
          <router-link
            v-for="item in related"
            :key="item.id"
            :to="relatedLink(item)"
            class="equipment-related-card"
            ><EquipmentImage
              class="equipment-related-image"
              :record="item"
              :alt="field(item, 'title')"
            />
            <div class="equipment-related-copy">
              <p>{{ field(item, "category") }}</p>
              <h3>{{ field(item, "title") }}</h3>
              <p>{{ field(item, "summary") }}</p>
              <span class="equipment-related-arrow" aria-hidden="true">↗</span>
            </div></router-link
          >
        </div>
      </div>
    </section>
  </div>
</template>
