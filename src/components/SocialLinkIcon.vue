<script setup>
import { computed, ref, watch } from 'vue'
import { Camera, ChatDotRound, Link, VideoCamera, VideoPlay } from '@element-plus/icons-vue'
import { validSocialIcon } from '../data/socialLinks.js'

const props = defineProps({ platform: { type: String, default: 'link' }, icon: { type: String, default: '' } })
const icons = { youtube: VideoPlay, wechat: ChatDotRound, bilibili: VideoCamera, instagram: Camera, link: Link }
const imageFailed = ref(false)
const customIcon = computed(() => props.platform === 'link' && props.icon && validSocialIcon(props.icon) && !imageFailed.value)
watch(() => props.icon, () => { imageFailed.value = false })
</script>

<template>
  <img v-if="customIcon" :src="icon" class="social-custom-icon" alt="" aria-hidden="true" @error="imageFailed = true" />
  <el-icon v-else-if="icons[platform]" aria-hidden="true"><component :is="icons[platform]" /></el-icon>
  <svg v-else-if="platform === 'weibo'" viewBox="0 0 24 24" class="social-symbol" aria-hidden="true"><path d="M18 9c3-6-4-7-6-2M19 5c3 0 4 3 3 5" /><ellipse cx="10" cy="15" rx="8" ry="5" /><ellipse cx="10" cy="15" rx="3" ry="2" /></svg>
  <span v-else class="social-symbol social-letter" aria-hidden="true">{{ { linkedin: 'in', x: 'X', facebook: 'f' }[platform] || '↗' }}</span>
</template>

<style scoped>
.social-custom-icon { display: block; width: 16px; height: 16px; object-fit: contain; }
.social-symbol { display: block; width: 16px; height: 16px; color: inherit; border: 0; border-radius: 0; background: transparent; }
svg.social-symbol { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; }
.social-letter { display: inline-flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; font-weight: 700; font-size: 13px; line-height: 1; }
</style>
