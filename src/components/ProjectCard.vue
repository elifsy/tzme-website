<script setup>
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { localizedField } from '../services/catalog.js'
import { projectPath } from '../services/projects.js'

const props = defineProps({ project: { type: Object, required: true }, to: { type: [String, Object], default: '' }, preview: Boolean, localeCode: { type: String, default: '' } })
const { locale } = useI18n({ useScope: 'global' })
const titleId = useId()
const actionId = useId()
const field = (name) => localizedField(props.project, name, props.localeCode || locale.value)
const metrics = computed(() => ['capacity', 'technology', 'scope'].map((name) => ({
  name, label: field(`${name}Label`), value: field(name),
})))
</script>

<template>
  <component :is="preview ? 'article' : 'router-link'" :to="preview ? undefined : to || projectPath(project.id)"
    :aria-labelledby="preview ? undefined : `${titleId} ${actionId}`" class="c project-card">
    <div class="im">
      <el-image v-if="project.image" :src="project.image" :alt="field('imageAlt') || field('title')" fit="cover" loading="lazy">
        <template #error><div class="project-image-fallback"><el-icon><Picture /></el-icon></div></template>
      </el-image>
      <div v-else class="project-image-fallback"><el-icon><Picture /></el-icon></div>
    </div>
    <div class="bd">
      <h3 :id="titleId">{{ field('title') }}</h3>
      <div class="tg">
        <el-tag v-if="field('industry')" effect="plain" round size="small">{{ field('industry') }}</el-tag>
        <el-tag v-if="field('location')" effect="plain" round size="small">{{ field('location') }}</el-tag>
      </div>
      <dl class="meta">
        <div v-for="metric in metrics" :key="metric.name"><dt>{{ metric.label }}</dt><dd>{{ metric.value }}</dd></div>
      </dl>
      <div class="project-card-action"><span :id="actionId">{{ $t('site.viewProjectDetails') }}</span><el-icon aria-hidden="true"><ArrowRight /></el-icon></div>
    </div>
  </component>
</template>
