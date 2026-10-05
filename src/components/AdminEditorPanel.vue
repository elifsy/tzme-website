<script setup>
defineProps({ title: { type: String, required: true }, description: { type: String, default: '' }, step: { type: String, default: '' } })
</script>

<template>
  <section class="cms-editor-panel">
    <div class="cms-panel-heading">
      <span v-if="step" class="cms-panel-step">{{ step }}</span>
      <div><h3>{{ title }}</h3><p v-if="description">{{ description }}</p></div>
    </div>
    <slot />
  </section>
</template>
