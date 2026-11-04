<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { validAboutVideo } from "../data/aboutTzme.js";
import { displayImage, responsiveImage } from "../utils/responsiveImages.js";

const props = defineProps({ video: { type: String, default: "" }, image: { type: String, default: "" }, alt: { type: String, default: "制造基地实景" } });
const player = ref(null);
const failed = ref(false);
const showVideo = computed(() => props.video && validAboutVideo(props.video) && !failed.value);
watch(() => props.video, () => { failed.value = false; });
function startPlayback() {
  if (!player.value) return;
  player.value.muted = true;
  player.value.play()?.catch(() => {});
}
onBeforeUnmount(() => player.value?.pause());
</script>

<template>
  <video v-if="showVideo" :key="video" ref="player" class="company-intro-video" :src="video" :poster="image ? displayImage(image) : undefined" :aria-label="alt" autoplay :muted="true" loop playsinline controls preload="metadata" @loadedmetadata="startPlayback" @error="failed = true" />
  <img v-else-if="image" v-bind="responsiveImage(image, '(max-width:700px) 100vw, 54vw')" :alt="alt" fetchpriority="high" decoding="async" />
</template>
