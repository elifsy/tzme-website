<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowDown, ArrowUp, Delete, Plus } from '@element-plus/icons-vue'
import AdminEditorPanel from './AdminEditorPanel.vue'
import SocialLinkIcon from './SocialLinkIcon.vue'
import SocialLinks from './SocialLinks.vue'
import ImageUpload from './ImageUpload.vue'
import { MAX_SOCIAL_LINKS, socialPlatforms, validSocialUrl } from '../data/socialLinks.js'

const props = defineProps({ modelValue: { type: Array, default: () => [] }, localeCode: { type: String, required: true }, disabled: Boolean, active: { type: Boolean, default: true } })
const emit = defineEmits(['update:modelValue', 'uploading'])
const uploadingIds = ref(new Set())
const hasPreview = computed(() => props.modelValue.some(item => item.enabled && validSocialUrl(item.url)))
function update(index, patch) { emit('update:modelValue', props.modelValue.map((item, position) => position === index ? { ...item, ...patch } : item)) }
function updateIcon(id, icon) { emit('update:modelValue', props.modelValue.map(item => item.id === id ? { ...item, icon } : item)) }
function setUploading(id, value) {
  const next = new Set(uploadingIds.value)
  if (value) next.add(id)
  else next.delete(id)
  uploadingIds.value = next
  emit('uploading', next.size > 0)
}
function clearUploading() { uploadingIds.value = new Set(); emit('uploading', false) }
watch(() => [props.active, props.localeCode], clearUploading)
onBeforeUnmount(clearUploading)
function add() {
  if (props.disabled || props.modelValue.length >= MAX_SOCIAL_LINKS) return
  emit('update:modelValue', [...props.modelValue, { id: crypto.randomUUID(), platform: 'link', label: '', icon: '', url: '', enabled: false }])
}
function move(index, direction) {
  const items = [...props.modelValue]
  const target = index + direction
  if (props.disabled || target < 0 || target >= items.length) return
  ;[items[index], items[target]] = [items[target], items[index]]
  emit('update:modelValue', items)
}
function remove(index) { if (!props.disabled) emit('update:modelValue', props.modelValue.filter((_, position) => position !== index)) }
</script>

<template>
  <div class="social-settings-layout">
    <AdminEditorPanel :title="$t('contactAdmin.socialSettings')" :description="$t('contactAdmin.socialHint', { max: MAX_SOCIAL_LINKS })">
      <el-empty v-if="!modelValue.length" :image-size="64" :description="$t('contactAdmin.socialNoLinks')" />
      <div v-for="(item, index) in modelValue" :key="localeCode + ':' + item.id" class="social-editor-row">
        <div class="social-editor-heading">
          <span class="social-editor-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <el-switch :model-value="item.enabled" :aria-label="$t('contactAdmin.socialEnabled')" @update:model-value="update(index, { enabled: $event })" />
          <span class="social-editor-state">{{ $t(item.enabled ? 'contactAdmin.socialEnabled' : 'contactAdmin.socialDisabled') }}</span>
          <div class="social-editor-actions">
            <el-tooltip :content="$t('contactAdmin.moveUp')" placement="top"><span><el-button :icon="ArrowUp" link :disabled="disabled || index === 0" :aria-label="$t('contactAdmin.moveUp')" @click="move(index, -1)" /></span></el-tooltip>
            <el-tooltip :content="$t('contactAdmin.moveDown')" placement="top"><span><el-button :icon="ArrowDown" link :disabled="disabled || index === modelValue.length - 1" :aria-label="$t('contactAdmin.moveDown')" @click="move(index, 1)" /></span></el-tooltip>
            <el-tooltip :content="$t('admin.delete')" placement="top"><el-button :icon="Delete" link type="danger" :disabled="disabled" :aria-label="$t('admin.delete')" @click="remove(index)" /></el-tooltip>
          </div>
        </div>
        <div class="social-editor-fields">
          <el-form-item :label="$t('contactAdmin.socialPlatform')">
            <el-select :model-value="item.platform" @update:model-value="update(index, { platform: $event })">
              <el-option v-for="platform in socialPlatforms" :key="platform" :value="platform" :label="$t('contactAdmin.socialPlatforms.' + platform)"><div class="social-platform-option"><SocialLinkIcon :platform="platform" /><span>{{ $t('contactAdmin.socialPlatforms.' + platform) }}</span></div></el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t(item.platform === 'link' ? 'contactAdmin.socialCustomName' : 'contactAdmin.socialLabel')" :required="item.platform === 'link' && item.enabled"><el-input :model-value="item.label" maxlength="100" :placeholder="$t(item.platform === 'link' ? 'contactAdmin.socialCustomNameHint' : 'contactAdmin.socialLabelHint')" @update:model-value="update(index, { label: $event })" /></el-form-item>
        </div>
        <el-form-item :label="$t('contactAdmin.socialUrl')" :required="item.enabled"><el-input :model-value="item.url" maxlength="1000" placeholder="https://..." @update:model-value="update(index, { url: $event })" /></el-form-item>
        <el-form-item v-if="item.platform === 'link'" :label="$t('contactAdmin.socialCustomIcon')">
          <ImageUpload :model-value="item.icon || ''" kind="socialIcon" :active="active" :context-key="localeCode + ':' + item.id" :disabled="disabled" :alt="item.label || $t('contactAdmin.socialCustomIcon')" @update:model-value="updateIcon(item.id, $event)" @uploading="setUploading(item.id, $event)" />
        </el-form-item>
      </div>
      <el-button type="primary" plain :icon="Plus" :disabled="disabled || modelValue.length >= MAX_SOCIAL_LINKS" @click="add">{{ $t('contactAdmin.addSocialLink') }}</el-button>
    </AdminEditorPanel>
    <aside class="social-editor-preview">
      <AdminEditorPanel :title="$t('contactAdmin.socialPreview')" :description="$t('contactAdmin.socialPreviewHint')">
        <div class="social-preview-footer">
          <SocialLinks v-if="hasPreview" :links="modelValue" :locale-code="localeCode" preview />
          <p v-else>{{ $t('contactAdmin.socialPreviewEmpty') }}</p>
        </div>
      </AdminEditorPanel>
    </aside>
  </div>
</template>

<style scoped>
.social-settings-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
.social-editor-row { border-bottom: 1px solid #e4eaf2; padding-bottom: 8px; margin-bottom: 20px; }
.social-editor-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.social-editor-number { color: #52667d; font-size: 12px; }
.social-editor-state { color: #52667d; font-size: 13px; }
.social-editor-actions { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.social-editor-actions .el-button { margin-left: 0; }
.social-editor-actions > span { display: inline-flex; }
.social-editor-fields { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 16px; }
.social-platform-option { display: flex; align-items: center; gap: 10px; }
.social-editor-preview { min-width: 0; position: sticky; top: 24px; }
.social-preview-footer { padding: 24px; background: #06131c; border-radius: 8px; }
.social-preview-footer p { color: #c1cfdb; font-size: 13px; line-height: 1.8; margin: 0; }
@media (max-width: 1100px) { .social-settings-layout { grid-template-columns: minmax(0, 1fr) 300px; } .social-editor-fields { grid-template-columns: 1fr; gap: 0; } }
@media (max-width: 900px) { .social-settings-layout { grid-template-columns: 1fr; } .social-editor-preview { position: static; } }
</style>
