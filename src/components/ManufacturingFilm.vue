<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { jAssets } from "../data/jDesign.js";
import { displayImage } from "../utils/responsiveImages.js";
const { locale } = useI18n({ useScope: "global" });
const open = ref(false);
const video = ref(null);
watch(open, (value) => {
  if (!value) video.value?.pause();
});
</script>
<template>
  <button
    class="j-film-button"
    type="button"
    data-analytics-event="cta_click"
    data-analytics-target="manufacturing-film"
    @click="open = true"
  >
    <span aria-hidden="true">▶</span
    >{{
      locale === "zh" ? "观看制造基地航拍" : "Watch the manufacturing base film"
    }}
  </button>
  <el-dialog
    v-model="open"
    class="j-media-dialog"
    append-to-body
    destroy-on-close
    width="min(1100px, calc(100vw - 32px))"
    :title="
      locale === 'zh'
        ? '格林兰制造基地 · 航拍视频'
        : 'Greenland manufacturing base · aerial film'
    "
    @close="video?.pause()"
  >
    <video
      v-if="open"
      ref="video"
      :src="jAssets.video"
      :poster="displayImage(jAssets.factory)"
      controls
      playsinline
      preload="metadata"
      style="display: block; width: 100%; max-height: 75vh"
    />
  </el-dialog>
</template>
