import { computed, ref } from "vue";

export const currentAccount = ref(null);
export const sessionExpired = ref(false);
export const isSuperAdmin = computed(
  () => currentAccount.value?.role === "SUPER_ADMIN",
);
let csrf, csrfPending;
const publicPosts = new Set([
  "/api/inquiries",
  "/api/inquiry-attachments",
  "/api/analytics/events",
]);

async function csrfToken() {
  if (csrf) return csrf;
  if (!csrfPending)
    csrfPending = fetch("/api/auth/csrf", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("登录服务暂不可用，请确认后端服务已更新。");
        return (csrf = await response.json());
      })
      .finally(() => {
        csrfPending = undefined;
      });
  return csrfPending;
}
export async function sessionFetch(path, options = {}, retry = true) {
  const method = (options.method || "GET").toUpperCase(),
    headers = new Headers(options.headers);
  if (
    !["GET", "HEAD", "OPTIONS"].includes(method) &&
    !publicPosts.has(path.split("?")[0])
  ) {
    const token = await csrfToken();
    headers.set(token.headerName, token.token);
  }
  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 403) {
    const error = await response
      .clone()
      .json()
      .catch(() => ({}));
    // A rejected CSRF request has not executed the operation, so it is safe to retry once.
    if (error.code === "CSRF_INVALID" && retry) {
      csrf = undefined;
      return sessionFetch(path, options, false);
    }
    if (error.code === "PASSWORD_CHANGE_REQUIRED" && currentAccount.value) {
      currentAccount.value.mustChangePassword = true;
      sessionExpired.value = true;
    }
  }
  if (
    response.status === 401 &&
    !path.startsWith("/api/auth/") &&
    /^\/admin(?:\/|$)/.test(location.pathname) &&
    location.pathname !== "/admin/login"
  )
    sessionExpired.value = true;
  return response;
}
async function authRequest(path, body) {
  const response = await sessionFetch(
    "/api/auth/" + path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  if (!response.ok) {
    const value = await response.json().catch(() => ({}));
    const error = new Error(value.message || "操作失败，请稍后重试。");
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
export async function checkSession() {
  try {
    return (currentAccount.value = await authRequest("me"));
  } catch (error) {
    if (error.status !== 401) throw error;
    currentAccount.value = null;
    return null;
  }
}
export async function signIn(username, password) {
  const account = await authRequest("login", { username, password });
  csrf = undefined;
  currentAccount.value = account;
  return account;
}
export async function signOut() {
  try {
    await authRequest("logout", {});
  } catch (error) {
    if (error.status !== 401) throw error;
  }
  currentAccount.value = null;
  sessionExpired.value = false;
  csrf = undefined;
}
export async function changeOwnPassword(currentPassword, newPassword) {
  await authRequest("password", { currentPassword, newPassword });
  currentAccount.value = null;
  sessionExpired.value = false;
  csrf = undefined;
}
export function adminReturnPath(value) {
  if (typeof value !== "string" || !/^\/admin(?:[/?#]|$)/.test(value))
    return "/admin";
  try {
    const url = new URL(value, location.origin);
    return url.origin === location.origin && url.pathname !== "/admin/login"
      ? url.pathname + url.search + url.hash
      : "/admin";
  } catch {
    return "/admin";
  }
}
