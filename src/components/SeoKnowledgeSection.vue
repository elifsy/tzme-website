<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { currentSeoPage } from "../services/seo.js";
const route = useRoute();
const questions = computed(() =>
  currentSeoPage.value?.path === route.path
    ? currentSeoPage.value.faqs || []
    : [],
);
</script>
<template>
  <section
    v-if="questions.length"
    class="site-knowledge"
    aria-labelledby="manufacturing-questions-title"
  >
    <div class="hc-w">
      <header>
        <div>
          <span>制造服务 / KNOWLEDGE</span>
          <h2 id="manufacturing-questions-title">制造服务常见问题</h2>
        </div>
        <router-link to="/contact"
          >沟通具体需求 <span aria-hidden="true">↗</span></router-link
        >
      </header>
      <div class="site-knowledge-list">
        <details v-for="item in questions" :key="item.question" open>
          <summary>
            {{ item.question }}<span aria-hidden="true">＋</span>
          </summary>
          <p>{{ item.answer }}</p>
        </details>
      </div>
      <p class="site-knowledge-source">
        资料来自重钢机械官网。具体制造范围、检验要求和交付安排以项目沟通确认为准。
      </p>
    </div>
  </section>
</template>
<style scoped>
.site-knowledge details p {
  white-space: pre-line;
}
.site-knowledge {
  padding: 48px 0 50px;
  background: #f7fafb;
  color: #123a50;
  font-family: var(--f-ui);
}
.site-knowledge header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 23px;
}
.site-knowledge header > div > span {
  font-size: 10px;
  letter-spacing: 1px;
  color: #76929f;
}
.site-knowledge h2 {
  font-size: 28px;
  line-height: 1.5;
  margin: 10px 0 0;
}
.site-knowledge header > a {
  color: #087f91;
  font-size: 12px;
  text-decoration: none;
  white-space: nowrap;
}
.site-knowledge header > a > span {
  margin-left: 20px;
}
.site-knowledge-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 40px;
  align-items: start;
}
.site-knowledge details {
  border-top: 1px solid #cfdee5;
  padding: 18px 0;
}
.site-knowledge summary {
  list-style: none;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.8;
  cursor: pointer;
}
.site-knowledge summary::-webkit-details-marker {
  display: none;
}
.site-knowledge summary > span {
  color: #087f91;
  font-size: 18px;
  font-weight: 400;
}
.site-knowledge details[open] summary > span {
  transform: rotate(45deg);
}
.site-knowledge details p {
  font-size: 13px;
  line-height: 1.95;
  color: #587586;
  margin: 12px 30px 0 0;
  overflow-wrap: anywhere;
}
.site-knowledge-source {
  font-size: 10px;
  line-height: 1.9;
  color: #8499a5;
  margin: 17px 0 0;
}
.site-knowledge summary:focus-visible {
  outline: 2px solid #087f91;
  outline-offset: 5px;
}
@media (max-width: 700px) {
  .site-knowledge {
    padding: 30px 0;
  }
  .site-knowledge h2 {
    font-size: 23px;
  }
  .site-knowledge header {
    align-items: start;
    gap: 16px;
  }
  .site-knowledge header > a {
    font-size: 10px;
    margin-top: 32px;
  }
  .site-knowledge header > a > span {
    margin-left: 8px;
  }
  .site-knowledge-list {
    grid-template-columns: 1fr;
  }
  .site-knowledge summary {
    font-size: 13px;
  }
  .site-knowledge details p {
    font-size: 12px;
    margin-right: 10px;
  }
}
</style>
