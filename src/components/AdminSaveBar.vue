<script setup>
defineProps({
  dirty: Boolean,
  saving: Boolean,
  busy: Boolean,
  disabled: Boolean,
});
defineEmits(["save"]);
</script>

<template>
  <div class="admin-save-bar">
    <div class="admin-save-status" role="status">
      <span
        class="admin-save-dot"
        :class="{ 'is-dirty': dirty, 'is-busy': busy || saving }"
      />
      <div>
        <strong>{{
          busy
            ? "图片正在上传"
            : saving
              ? "正在保存"
              : dirty
                ? "有未保存的修改"
                : "当前配置已保存"
        }}</strong
        ><small>{{
          busy ? "上传完成后即可保存" : "当前修改会一起保存，保存后设置生效"
        }}</small>
      </div>
    </div>
    <el-button
      type="primary"
      :loading="saving"
      :disabled="busy || disabled"
      @click="$emit('save')"
      >保存当前配置</el-button
    >
  </div>
</template>

<style scoped>
.admin-save-bar {
  position: sticky;
  bottom: 16px;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 16px 22px;
  background: #fff;
  border: 1px solid #d8e4ed;
  border-radius: 12px;
  box-shadow: 0 10px 35px #1b3b5512;
}
.admin-save-status {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}
.admin-save-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #6b9e90;
}
.admin-save-dot.is-dirty {
  background: #d89940;
}
.admin-save-dot.is-busy {
  background: #5386bb;
}
.admin-save-status strong {
  display: block;
  color: #2b465d;
  font-size: 13px;
  font-weight: 600;
}
.admin-save-status small {
  display: block;
  margin-top: 4px;
  color: #6b7f90;
  font-size: 11px;
  line-height: 1.6;
}
.admin-save-bar .el-button {
  min-height: 38px;
  flex-shrink: 0;
  margin: 0;
  padding-inline: 22px;
}
@media (max-width: 600px) {
  .admin-save-bar {
    bottom: 10px;
    padding: 14px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .admin-save-status small {
    display: none;
  }
  .admin-save-bar .el-button {
    padding-inline: 14px;
  }
}
</style>
