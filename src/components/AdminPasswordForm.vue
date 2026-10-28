<script setup>
import { reactive, ref } from "vue";
import { changeOwnPassword } from "../services/session.js";
defineProps({ initial: Boolean });
const emit = defineEmits(["success", "busy"]);
const form = reactive({ current: "", password: "", confirm: "" }),
  busy = ref(false),
  error = ref("");
async function submit() {
  if (busy.value) return;
  error.value = "";
  if (
    Array.from(form.password).length < 12 ||
    new TextEncoder().encode(form.password).length > 72
  ) {
    error.value = "密码至少 12 个字符，最多 72 个 UTF-8 字节。";
    return;
  }
  if (form.password !== form.confirm) {
    error.value = "两次输入的新密码不一致。";
    return;
  }
  busy.value = true;
  emit("busy", true);
  try {
    await changeOwnPassword(form.current, form.password);
    form.current = form.password = form.confirm = "";
    emit("success");
  } catch (failure) {
    error.value = failure.message;
  } finally {
    busy.value = false;
    emit("busy", false);
  }
}
</script>
<template>
  <form class="admin-auth-form" @submit.prevent="submit">
    <p class="admin-auth-description">
      {{
        initial
          ? "首次登录或密码重置后，请先设置自己的密码。"
          : "修改成功后，所有设备上的旧登录都会失效，请重新登录。"
      }}
    </p>
    <label
      >{{ initial ? "当前 / 初始密码" : "原密码"
      }}<el-input
        v-model="form.current"
        type="password"
        autocomplete="current-password"
        show-password
        :disabled="busy"
        required
    /></label>
    <label
      >新密码<el-input
        v-model="form.password"
        type="password"
        autocomplete="new-password"
        show-password
        :disabled="busy"
        maxlength="72"
        placeholder="至少 12 个字符"
        required
    /></label>
    <label
      >确认新密码<el-input
        v-model="form.confirm"
        type="password"
        autocomplete="new-password"
        show-password
        :disabled="busy"
        maxlength="72"
        required
    /></label>
    <p v-if="error" class="admin-auth-error" role="alert">{{ error }}</p>
    <el-button
      class="admin-auth-submit"
      type="primary"
      native-type="submit"
      :loading="busy"
      >保存新密码<span aria-hidden="true">→</span></el-button
    >
  </form>
</template>
