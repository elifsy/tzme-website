<script setup>
import { computed } from 'vue';
import { adminAvatar } from '../data/adminAvatars.js';
const props = defineProps({ avatarKey: { type: String, default: 'engineer' } });
const avatar = computed(() => adminAvatar(props.avatarKey));
</script>

<template>
  <span class="admin-virtual-avatar" :data-avatar="avatar.key" :style="{ backgroundPosition: avatar.position }" aria-hidden="true" />
</template>

<style scoped>
.admin-virtual-avatar { display:block; width:100%; aspect-ratio:1; background:#edf6f7 url('/assets/admin/virtual-avatars.webp') no-repeat; background-size:300% 200%; border-radius:inherit; }
</style>
