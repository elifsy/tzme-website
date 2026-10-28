<script setup>
import { responsiveImage } from "../utils/responsiveImages.js";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AdminLoginForm from "../components/AdminLoginForm.vue";
import AdminPasswordForm from "../components/AdminPasswordForm.vue";
import {
  adminReturnPath,
  currentAccount,
  signOut,
} from "../services/session.js";
const route = useRoute(),
  router = useRouter(),
  passwordChanged = ref(route.query.changed === "1"),
  error = ref("");
const initial = computed(() =>
  Boolean(currentAccount.value?.mustChangePassword),
);
async function loggedIn(account) {
  if (!account.mustChangePassword)
    await router.replace(adminReturnPath(route.query.redirect));
}
function changed() {
  passwordChanged.value = true;
}
async function leaveAccount() {
  try {
    await signOut();
  } catch (failure) {
    error.value = failure.message;
  }
}
</script>
<template>
  <main class="admin-login-page">
    <section class="admin-login-brand" aria-label="TZME 网站管理">
      <router-link to="/" class="admin-login-logo"
        ><img
          v-bind="
            responsiveImage(
              '/assets/tzme-j/brand/official-mark.jpg',
              '72px',
              160,
            )
          "
          alt="TZME"
        /><span
          >天津重钢机械装备股份有限公司<small
            >TZME (Tianjin) Co., Ltd.</small
          ></span
        ></router-link
      >
      <div class="admin-login-brand-copy">
        <p>WEBSITE MANAGEMENT</p>
        <h1>做好每一处内容，<br />呈现可靠制造。</h1>
        <span>天津重钢 · 网站管理平台</span>
      </div>
      <svg
        class="admin-login-z"
        viewBox="0 0 600 500"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="login-z-stroke"
            x1="0"
            y1="0"
            x2="600"
            y2="500"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#b5d6e1" stop-opacity="0" />
            <stop offset=".5" stop-color="#087f91" />
            <stop offset="1" stop-color="#99bacd" stop-opacity=".2" />
          </linearGradient>
        </defs>
        <path
          v-for="n in 6"
          :key="n"
          :d="`M ${40 + n * 12} ${80 + n * 12} H ${555 - n * 12} L ${60 + n * 12} ${440 - n * 12} H ${550 - n * 12}`"
          stroke="url(#login-z-stroke)"
          stroke-width="2"
        />
      </svg>
      <p class="admin-login-copyright">TZME · CONTENT MANAGEMENT</p>
    </section>
    <section class="admin-login-panel">
      <div class="admin-login-card">
        <p class="admin-auth-kicker">TZME / ADMIN</p>
        <h2>{{ initial ? "设置登录密码" : "欢迎登录" }}</h2>
        <p class="admin-auth-description">
          {{
            initial
              ? currentAccount.username + " · 请完成账号初始化"
              : "使用管理员账号维护网站内容。"
          }}
        </p>
        <p
          v-if="passwordChanged && !initial"
          class="admin-auth-success"
          role="status"
        >
          密码已更新，请使用新密码登录。
        </p>
        <p v-if="error" class="admin-auth-error" role="alert">{{ error }}</p>
        <AdminPasswordForm
          v-if="initial"
          initial
          @success="changed"
        /><AdminLoginForm
          v-else
          :key="passwordChanged ? 'changed' : 'login'"
          @success="loggedIn"
        />
        <p class="admin-login-help">
          {{
            initial
              ? "账号与其他已登录设备将在修改后退出。"
              : "账号由超级管理员创建；忘记密码请联系超级管理员。"
          }}
        </p>
        <div class="admin-login-links">
          <router-link to="/">← 返回官网</router-link
          ><button v-if="initial" type="button" @click="leaveAccount">
            切换账号
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
