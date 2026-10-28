<script setup>
import ImageUpload from "./ImageUpload.vue";
const facility = defineModel({ type: Object, required: true });
defineProps({
  contextKey: { type: String, required: true },
  disabled: Boolean,
  active: Boolean,
});
defineEmits(["uploading"]);
</script>

<template>
  <div class="contact-facility-fields" :data-facility-editor="contextKey">
    <el-form-item :label="$t('contactAdmin.facilityImage')">
      <ImageUpload
        v-model="facility.image"
        kind="facility"
        :context-key="contextKey"
        :disabled="disabled"
        :active="active"
        :alt="facility.imageAlt.zh || facility.title.zh"
        @uploading="$emit('uploading', $event)"
      />
    </el-form-item>
    <div>
      <el-form-item :label="$t('contactAdmin.facilityTitle')">
        <el-input
          v-model="facility.title.zh"
          maxlength="255"
          :placeholder="$t('contactAdmin.facilityTitleHint')"
          data-facility-title
        />
      </el-form-item>
      <el-form-item :label="$t('contactAdmin.facilityDescription')">
        <el-input
          v-model="facility.description.zh"
          type="textarea"
          :rows="4"
          maxlength="2000"
          show-word-limit
          data-facility-description
        />
      </el-form-item>
      <el-form-item :label="$t('contactAdmin.facilityImageAlt')">
        <el-input
          v-model="facility.imageAlt.zh"
          maxlength="255"
          :placeholder="$t('contactAdmin.facilityImageAltHint')"
          data-facility-alt
        />
      </el-form-item>
    </div>
  </div>
</template>

<style scoped>
.contact-facility-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px;
  border-bottom: 1px solid #e3eaf1;
  margin-bottom: 22px;
  padding-bottom: 4px;
}
@media (max-width: 1100px) {
  .contact-facility-fields {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
