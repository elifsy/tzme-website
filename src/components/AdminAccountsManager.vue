<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { apiRequest } from "../services/api.js";
import { currentAccount } from "../services/session.js";
import { useAdminEditorState } from "../composables/useAdminEditorState.js";

const accounts = ref([]),
  loading = ref(false),
  error = ref(""),
  keyword = ref(""),
  statusFilter = ref("all"),
  saving = ref(false);
const open = ref(false),
  editingId = ref(""),
  original = ref(""),
  resetTarget = ref(null),
  resetPassword = ref(""),
  resetConfirm = ref("");
const form = reactive({
  username: "",
  displayName: "",
  password: "",
  status: "active",
});
const visible = computed(() =>
  accounts.value.filter(
    (item) =>
      (statusFilter.value === "all" || item.status === statusFilter.value) &&
      [item.username, item.displayName].some((value) =>
        value.toLowerCase().includes(keyword.value.trim().toLowerCase()),
      ),
  ),
);
const dirty = computed(
  () =>
    (open.value && JSON.stringify(form) !== original.value) ||
    (resetTarget.value && Boolean(resetPassword.value || resetConfirm.value)),
);
useAdminEditorState({ dirty, saving, loading });
const editingRoot = computed(
  () =>
    accounts.value.find((item) => item.id === editingId.value)?.role ===
    "SUPER_ADMIN",
);
const time = (value) =>
  value
    ? new Date(value).toLocaleString("zh-CN", { hour12: false })
    : "尚未登录";
async function load() {
  loading.value = true;
  error.value = "";
  try {
    accounts.value = await apiRequest("/api/admin/accounts");
  } catch (failure) {
    error.value = failure.message;
  } finally {
    loading.value = false;
  }
}
function edit(account) {
  editingId.value = account?.id || "";
  Object.assign(form, {
    username: account?.username || "",
    displayName: account?.displayName || "",
    password: "",
    status: account?.status || "active",
  });
  original.value = JSON.stringify(form);
  open.value = true;
}
async function closeEditor(done) {
  if (saving.value) return;
  if (dirty.value) {
    try {
      await ElMessageBox.confirm("当前有未保存的账号信息。", "放弃修改", {
        confirmButtonText: "放弃修改",
        cancelButtonText: "继续填写",
      });
    } catch {
      return;
    }
  }
  open.value = false;
  form.password = "";
  resetTarget.value = null;
  resetPassword.value = resetConfirm.value = "";
  if (typeof done === "function") done();
}
async function save() {
  if (saving.value) return;
  saving.value = true;
  error.value = "";
  try {
    const saved = await apiRequest(
      "/api/admin/accounts" + (editingId.value ? "/" + editingId.value : ""),
      { method: editingId.value ? "PUT" : "POST", body: { ...form } },
    );
    const renamedSelf =
      saved.id === currentAccount.value?.id &&
      saved.username !== currentAccount.value.username;
    if (saved.id === currentAccount.value?.id) currentAccount.value = saved;
    open.value = false;
    form.password = "";
    ElMessage.success(
      editingId.value ? "账号已更新" : "账号已创建，首次登录需修改密码",
    );
    if (renamedSelf) {
      location.replace("/admin/login?redirect=/admin/accounts");
      return;
    }
    await load();
  } catch (failure) {
    error.value = failure.message;
    ElMessage.error(failure.message);
  } finally {
    saving.value = false;
  }
}
async function toggle(account) {
  try {
    await ElMessageBox.confirm(
      account.status === "active"
        ? "停用后，该账号在所有设备上的登录将失效。"
        : "启用后，该账号可使用原密码登录。",
      account.status === "active" ? "停用账号" : "启用账号",
      { type: "warning", confirmButtonText: "确定", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  saving.value = true;
  try {
    await apiRequest("/api/admin/accounts/" + account.id, {
      method: "PUT",
      body: {
        ...account,
        status: account.status === "active" ? "disabled" : "active",
      },
    });
    ElMessage.success("账号状态已更新");
    await load();
  } catch (failure) {
    ElMessage.error(failure.message);
  } finally {
    saving.value = false;
  }
}
async function remove(account) {
  try {
    await ElMessageBox.confirm(
      `确定删除“${account.displayName}（${account.username}）”？删除后该账号将无法登录，已维护的网站内容保留。`,
      "删除账号",
      {
        type: "warning",
        confirmButtonText: "删除账号",
        cancelButtonText: "取消",
      },
    );
  } catch {
    return;
  }
  saving.value = true;
  try {
    await apiRequest("/api/admin/accounts/" + account.id, { method: "DELETE" });
    ElMessage.success("账号已删除");
    await load();
  } catch (failure) {
    ElMessage.error(failure.message);
  } finally {
    saving.value = false;
  }
}
function openReset(account) {
  resetTarget.value = account;
  resetPassword.value = resetConfirm.value = "";
}
async function reset() {
  if (saving.value) return;
  if (resetPassword.value !== resetConfirm.value) {
    ElMessage.warning("两次输入的密码不一致");
    return;
  }
  saving.value = true;
  try {
    await apiRequest(
      "/api/admin/accounts/" + resetTarget.value.id + "/password",
      { method: "POST", body: { password: resetPassword.value } },
    );
    resetTarget.value = null;
    resetPassword.value = resetConfirm.value = "";
    ElMessage.success("密码已重置，原登录已失效；下次登录需修改密码");
    await load();
  } catch (failure) {
    ElMessage.error(failure.message);
  } finally {
    saving.value = false;
  }
}
onMounted(load);
defineExpose({ load });
</script>
<template>
  <section class="admin-accounts-manager">
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
    />
    <div class="admin-accounts-toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索账号或姓名"
        aria-label="搜索账号或姓名"
        clearable
      /><el-select v-model="statusFilter" aria-label="筛选账号状态"
        ><el-option label="全部状态" value="all" /><el-option
          label="已启用"
          value="active" /><el-option
          label="已停用"
          value="disabled" /></el-select
      ><span>共 {{ visible.length }} 个账号</span
      ><el-button type="primary" :icon="Plus" :disabled="saving" @click="edit()"
        >新增账号</el-button
      >
    </div>
    <el-card shadow="never"
      ><el-table
        v-loading="loading"
        :data="visible"
        row-key="id"
        empty-text="暂无匹配账号"
      >
        <el-table-column label="账号 / 姓名" min-width="200"
          ><template #default="{ row }"
            ><strong>{{ row.username }}</strong
            ><el-tag
              v-if="row.id === currentAccount?.id"
              size="small"
              class="admin-account-self"
              >当前账号</el-tag
            ><small class="admin-account-name">{{
              row.displayName
            }}</small></template
          ></el-table-column
        >
        <el-table-column label="角色" min-width="130"
          ><template #default="{ row }"
            ><el-tag
              :type="row.role === 'SUPER_ADMIN' ? 'primary' : 'info'"
              effect="plain"
              >{{
                row.role === "SUPER_ADMIN" ? "超级管理员" : "普通管理员"
              }}</el-tag
            ></template
          ></el-table-column
        >
        <el-table-column label="状态" min-width="130"
          ><template #default="{ row }"
            ><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{
              row.status === "active" ? "已启用" : "已停用"
            }}</el-tag
            ><small v-if="row.mustChangePassword" class="admin-account-name"
              >待设置个人密码</small
            ></template
          ></el-table-column
        >
        <el-table-column label="最近登录" min-width="180"
          ><template #default="{ row }">{{
            time(row.lastLoginAt)
          }}</template></el-table-column
        >
        <el-table-column label="操作" min-width="265"
          ><template #default="{ row }"
            ><div class="admin-account-actions">
              <el-button
                link
                type="primary"
                :disabled="saving"
                @click="edit(row)"
                >修改</el-button
              ><el-button
                v-if="row.id !== currentAccount?.id"
                link
                type="primary"
                :disabled="saving"
                @click="openReset(row)"
                >重置密码</el-button
              ><el-button
                v-if="row.role !== 'SUPER_ADMIN'"
                link
                :type="row.status === 'active' ? 'warning' : 'success'"
                :disabled="saving"
                @click="toggle(row)"
                >{{ row.status === "active" ? "停用" : "启用" }}</el-button
              ><el-button
                v-if="row.role !== 'SUPER_ADMIN'"
                link
                type="danger"
                :disabled="saving"
                @click="remove(row)"
                >删除</el-button
              >
            </div></template
          ></el-table-column
        >
      </el-table></el-card
    >
    <p class="admin-accounts-note">
      所有账号拥有相同的网站维护功能。超级管理员额外负责账号管理；普通管理员可在右上角修改自己的密码。
    </p>
    <el-dialog
      v-model="open"
      class="cms-compact-dialog"
      :title="editingId ? '修改账号信息' : '新增普通管理员'"
      width="min(480px, calc(100vw - 32px))"
      :before-close="closeEditor"
      :close-on-click-modal="false"
      append-to-body
      destroy-on-close
    >
      <form class="admin-auth-form" @submit.prevent="save">
        <label
          >登录账号<el-input
            v-model="form.username"
            autocomplete="off"
            maxlength="64"
            :disabled="saving"
            pattern="[a-zA-Z0-9][a-zA-Z0-9_.-]{3,63}"
            required
          /><small>4–64 位字母、数字、点、横线或下划线。</small></label
        ><label
          >姓名<el-input
            v-model="form.displayName"
            maxlength="64"
            :disabled="saving"
            required /></label
        ><label v-if="!editingId"
          >初始密码<el-input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            show-password
            minlength="12"
            maxlength="72"
            :disabled="saving"
            required
          /><small>至少 12 个字符，首次登录需设置个人密码。</small></label
        ><label
          >账号状态<el-select
            v-model="form.status"
            :disabled="saving || editingRoot"
            ><el-option label="启用" value="active" /><el-option
              label="停用"
              value="disabled" /></el-select
        ></label>
        <p v-if="editingRoot" class="admin-auth-description">
          超级管理员账号保持启用，可在右上角修改本人密码。
        </p>
        <div class="admin-account-dialog-actions">
          <el-button :disabled="saving" @click="closeEditor()">取消</el-button
          ><el-button type="primary" native-type="submit" :loading="saving">{{
            editingId ? "保存修改" : "创建账号"
          }}</el-button>
        </div>
      </form>
    </el-dialog>
    <el-dialog
      :model-value="Boolean(resetTarget)"
      class="cms-compact-dialog"
      title="重置账号密码"
      width="min(440px, calc(100vw - 32px))"
      :before-close="closeEditor"
      :close-on-click-modal="false"
      append-to-body
      destroy-on-close
    >
      <form class="admin-auth-form" @submit.prevent="reset">
        <p class="admin-auth-description">
          为 {{ resetTarget?.displayName }}（{{
            resetTarget?.username
          }}）设置初始密码。原登录将失效，下次登录需修改密码。
        </p>
        <label
          >新初始密码<el-input
            v-model="resetPassword"
            type="password"
            autocomplete="new-password"
            show-password
            minlength="12"
            maxlength="72"
            :disabled="saving"
            required /></label
        ><label
          >确认密码<el-input
            v-model="resetConfirm"
            type="password"
            autocomplete="new-password"
            show-password
            minlength="12"
            maxlength="72"
            :disabled="saving"
            required
        /></label>
        <div class="admin-account-dialog-actions">
          <el-button :disabled="saving" @click="closeEditor()">取消</el-button
          ><el-button type="primary" native-type="submit" :loading="saving"
            >重置密码</el-button
          >
        </div>
      </form>
    </el-dialog>
  </section>
</template>
<style scoped>
.admin-accounts-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.admin-accounts-toolbar > .el-input {
  width: 260px;
}
.admin-accounts-toolbar > .el-select {
  width: 140px;
}
.admin-accounts-toolbar > span {
  font-size: 12px;
  color: #7c8e9f;
  margin-right: auto;
}
.admin-account-name {
  display: block;
  font-size: 11px;
  color: #8193a1;
  margin-top: 5px;
}
.admin-account-self {
  margin-left: 10px;
}
.admin-account-actions {
  display: flex;
  align-items: center;
  gap: 13px;
}
.admin-account-actions .el-button + .el-button {
  margin-left: 0;
}
.admin-accounts-note {
  font-size: 12px;
  color: #748c9a;
  line-height: 1.9;
  margin-top: 20px;
}
.admin-accounts-manager > .el-alert {
  margin-bottom: 20px;
}
.admin-account-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}
.admin-auth-form label > small {
  color: #8294a2;
  font-size: 11px;
  line-height: 1.8;
}
@media (max-width: 700px) {
  .admin-accounts-toolbar {
    gap: 10px;
  }
  .admin-accounts-toolbar > .el-input {
    width: 100%;
  }
  .admin-accounts-toolbar > .el-select {
    width: 130px;
  }
  .admin-accounts-manager .el-card {
    --el-card-padding: 12px;
  }
}
</style>
