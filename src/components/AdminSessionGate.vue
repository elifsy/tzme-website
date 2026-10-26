<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import AdminLoginForm from './AdminLoginForm.vue'
import AdminPasswordForm from './AdminPasswordForm.vue'
import { currentAccount, sessionExpired, sessionFetch, signOut } from '../services/session.js'
const route = useRoute(), error = ref('')
const visible = computed(() => route.meta.admin && route.path !== '/admin/login' && sessionExpired.value)
async function abandon() {
  try {
    await ElMessageBox.confirm('退出后当前未保存的内容将被丢弃。', '退出当前账号', { confirmButtonText: '退出', cancelButtonText: '继续编辑' })
    await signOut(); location.replace('/admin/login')
  } catch (failure) { if (failure instanceof Error) error.value = failure.message }
}
function signedIn(account) { if (!account.mustChangePassword) { sessionExpired.value = false; error.value = '' } }
function changed() { location.replace('/admin/login?changed=1&redirect=' + encodeURIComponent(route.fullPath)) }
async function check() {
  if (!route.meta.admin || route.path === '/admin/login' || sessionExpired.value) return
  try { const response = await sessionFetch('/api/auth/me'); if (response.status === 401) sessionExpired.value = true }
  catch { /* A network outage must not discard an editor's in-memory state. */ }
}
onMounted(() => window.addEventListener('focus', check))
onBeforeUnmount(() => window.removeEventListener('focus', check))
</script>
<template>
  <el-dialog :model-value="visible" class="admin-session-dialog" :title="currentAccount?.mustChangePassword ? '请设置自己的密码' : '登录已过期'" width="min(440px, calc(100vw - 32px))" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false" append-to-body destroy-on-close>
    <p class="admin-auth-description">当前填写内容仍保留在此页面。重新登录后，可继续编辑并再次点击保存。</p>
    <AdminPasswordForm v-if="currentAccount?.mustChangePassword" initial @success="changed"/>
    <AdminLoginForm v-else :username="currentAccount?.username || ''" :reauthenticate="Boolean(currentAccount)" @success="signedIn"/>
    <p v-if="error" class="admin-auth-error" role="alert">{{ error }}</p>
    <p class="admin-login-help">账号被停用或密码忘记时，请联系超级管理员。<button type="button" @click="abandon">退出并切换账号</button></p>
  </el-dialog>
</template>
