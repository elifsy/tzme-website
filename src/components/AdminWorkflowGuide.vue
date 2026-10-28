<script setup>
import { adminModules, adminPath } from "../data/adminWorkspace.js";
defineProps({ module: { type: Object, required: true } });
</script>

<template>
  <div v-if="module.steps?.length" class="admin-workflow-guide">
    <div class="admin-workflow-path">
      <span class="admin-workflow-caption">填写顺序</span>
      <ol>
        <li v-for="(step, index) in module.steps" :key="step">
          <b>{{ index + 1 }}</b
          >{{ step }}
        </li>
      </ol>
    </div>
    <div v-if="module.related?.length" class="admin-related-links">
      <span>相关设置</span
      ><router-link
        v-for="key in module.related"
        :key="key"
        :to="adminPath(key)"
        >{{ adminModules[key].label }} ↗</router-link
      >
    </div>
  </div>
</template>

<style scoped>
.admin-workflow-guide {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px 24px;
  padding: 16px 20px;
  margin-bottom: 24px;
  border: 1px solid #dce8ee;
  border-radius: 12px;
  background: #f4f9fb;
}
.admin-workflow-path,
.admin-workflow-path ol,
.admin-workflow-path li,
.admin-related-links {
  display: flex;
  align-items: center;
  gap: 12px;
}
.admin-workflow-path {
  flex-wrap: wrap;
  gap: 12px 20px;
}
.admin-workflow-caption {
  font-size: 12px;
  color: #506b7e;
  flex-shrink: 0;
}
.admin-workflow-path ol {
  flex-wrap: wrap;
  gap: 12px 22px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.admin-workflow-path li {
  font-size: 12px;
  color: #28485e;
  gap: 8px;
}
.admin-workflow-path b {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e0edf2;
  color: #14778b;
  font-size: 10px;
}
.admin-related-links {
  flex-wrap: wrap;
  font-size: 11px;
}
.admin-related-links > span {
  color: #698093;
}
.admin-related-links a {
  color: #197486;
  text-decoration: none;
}
.admin-related-links a:hover {
  text-decoration: underline;
}
</style>
