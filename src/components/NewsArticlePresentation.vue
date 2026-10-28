<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { localizedField } from "../services/catalog.js";
import { articleDate } from "../services/articles.js";
import { sanitizeRichText } from "../utils/richText.js";
import { responsiveImage } from "../utils/responsiveImages.js";
import { articleAttachments, attachmentSize } from "../utils/articleAttachments.js";

const props = defineProps({
  record: { type: Object, required: true },
  preview: Boolean,
});
const emit = defineEmits(["contact"]);
const { locale } = useI18n({ useScope: "global" });
const field = (name) => localizedField(props.record, name, locale.value);
const attachments = computed(() => articleAttachments(props.record));
const body = computed(() => {
  const template = document.createElement("template");
  template.innerHTML = sanitizeRichText(field("content") || field("summary"), {
    optimizeImages: true,
  });
  const headings = [...template.content.querySelectorAll("h1, h2, h3")].map(
    (heading, index) => {
      heading.id = `article-heading-${index}`;
      return { id: heading.id, text: heading.textContent };
    },
  );
  return { html: template.innerHTML, headings };
});
function scrollToHeading(id) {
  if (!props.preview)
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <section id="article-overview" class="hc-sec article-intro">
    <div class="hc-w">
      <slot name="back" />
      <div
        class="refine-article-head-grid"
        :class="{ 'without-cover': !record.image }"
      >
        <div>
          <div class="news-meta">
            <el-tag effect="plain">{{ field("category") || "新闻资讯" }}</el-tag
            ><time :datetime="record.date">{{ articleDate(record.date) }}</time>
          </div>
          <h1 class="site-page-title">
            {{ field("title") || (preview ? "新闻标题" : "") }}
          </h1>
          <p
            v-if="field('summary')"
            class="article-lead site-intro-description"
          >
            {{ field("summary") }}
          </p>
        </div>
        <figure v-if="record.image" class="article-cover">
          <img
            v-bind="
              responsiveImage(record.image, '(max-width:700px) 100vw, 48vw')
            "
            :alt="field('title')"
            fetchpriority="high"
            decoding="async"
          />
        </figure>
      </div>
    </div>
  </section>
  <section class="hc-sec article-content-section">
    <div class="hc-w article-layout">
      <article>
        <div class="article-body" v-html="body.html"></div>
        <section v-if="attachments.length" class="article-downloads" aria-label="资料下载">
          <span class="hc-kick">DOWNLOADS</span>
          <h2>资料下载</h2>
          <p>下载产品手册与相关资料，了解更多设备信息。</p>
          <a v-for="file in attachments" :key="file.id" :href="preview ? undefined : file.url" :download="file.name" :aria-disabled="preview" :tabindex="preview ? -1 : 0" class="article-download-file">
            <span class="article-download-type">{{ file.extension?.toUpperCase() || '文件' }}</span>
            <span class="article-download-name">{{ file.name }}<small>{{ attachmentSize(file.size) }}</small></span>
            <span class="article-download-action">下载 <span aria-hidden="true">↓</span></span>
          </a>
        </section>
        <slot name="navigation" />
      </article>
      <aside class="article-sidebar">
        <div class="article-toc">
          <span class="hc-kick">{{ $t("site.articleContents") }}</span>
          <a
            href="#article-overview"
            @click.prevent="scrollToHeading('article-overview')"
            >{{ $t("site.articleOverview") }}</a
          >
          <a
            v-for="heading in body.headings"
            :key="heading.id"
            :href="'#' + heading.id"
            @click.prevent="scrollToHeading(heading.id)"
            >{{ heading.text }}</a
          >
        </div>
        <div class="article-contact">
          <h2>{{ $t("site.newsContactTitle") }}</h2>
          <p>{{ $t("site.newsContactText") }}</p>
          <el-button type="primary" @click="!preview && emit('contact')"
            >{{ $t("site.contactUs") }} →</el-button
          >
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.article-downloads { margin-top:40px; padding-top:28px; border-top:1px solid #cce0e6; }
.article-downloads h2 { margin:10px 0; font-size:24px; color:#123e53; }
.article-downloads > p { margin:0 0 22px; color:#668594; font-size:14px; line-height:1.8; }
.article-download-file { display:flex; align-items:center; gap:16px; padding:20px 0; border-bottom:1px solid #deeaee; color:#214d60; text-decoration:none; }
.article-download-type { flex:none; display:grid; place-items:center; min-width:44px; min-height:48px; padding:5px; border:1px solid #ccdee5; color:#07859a; font-size:11px; }
.article-download-name { flex:1; min-width:0; overflow-wrap:anywhere; font-size:15px; line-height:1.6; }
.article-download-name small { display:block; color:#7b97a3; font-size:12px; margin-top:4px; }
.article-download-action { flex:none; display:flex; gap:16px; align-items:center; color:#00879a; font-size:13px; }
.article-download-file:hover { color:#00879a; }
.article-download-file[aria-disabled='true'] { cursor:default; }
@media(max-width:700px) { .article-download-file { gap:12px; } .article-download-action { gap:6px; } .article-download-name { font-size:14px; } }
</style>
