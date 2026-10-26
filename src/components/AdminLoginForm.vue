<script setup>
import { reactive, ref } from 'vue'
import { signIn } from '../services/session.js'
const props = defineProps({ username: { type: String, default: '' }, reauthenticate: Boolean })
const emit = defineEmits(['success'])
const form = reactive({ username: props.username, password: '' }), busy = ref(false), error = ref('')
async function submit() {
  if (busy.value || !form.username.trim() || !form.password) return
  busy.value = true; error.value = ''
  try { const account = await signIn(form.username.trim(), form.password); form.password = ''; emit('success', account) }
  catch (failure) { error.value = failure.message }
  finally { busy.value = false }
}
</script>
<template>
  <form class="admin-auth-form" @submit.prevent="submit">
    <label>登录账号<el-input v-model="form.username" name="username" autocomplete="username" :readonly="reauthenticate" :disabled="busy" maxlength="64" placeholder="请输入账号" required /></label>
    <label>登录密码<el-input v-model="form.password" name="password" type="password" autocomplete="current-password" show-password :disabled="busy" maxlength="72" placeholder="请输入密码" required /></label>
    <p v-if="error" class="admin-auth-error" role="alert">{{ error }}</p>
    <el-button class="admin-auth-submit" type="primary" native-type="submit" :loading="busy" :disabled="!form.username.trim() || !form.password">{{ reauthenticate ? '重新登录并继续编辑' : '登录管理后台' }}<span aria-hidden="true">→</span></el-button>
  </form>
</template>
