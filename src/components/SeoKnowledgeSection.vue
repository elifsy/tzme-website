<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { currentSeoPage } from "../services/seo.js";
import KnowledgeFlipCard from './KnowledgeFlipCard.vue';
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
      <p class="site-knowledge-hint"><span class="site-knowledge-hover-hint">鼠标移入预览 · 点击固定答案 · 再次点击返回</span><span class="site-knowledge-tap-hint">点击卡片查看答案 · 再次点击返回</span></p>
      <div class="site-knowledge-list" :style="{ '--knowledge-columns': Math.min(questions.length, 4) }">
        <KnowledgeFlipCard v-for="(item, index) in questions" :key="`${route.path}:${item.question}:${item.answer}`"
          :question="item.question" :answer="item.answer" :index="index" />
      </div>
      <p class="site-knowledge-source">
        资料来自重钢机械官网。具体制造范围、检验要求和交付安排以项目沟通确认为准。
      </p>
    </div>
  </section>
</template>
<style scoped>
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
  grid-template-columns: repeat(var(--knowledge-columns, 4), minmax(0, 1fr));
  gap: 20px;
}
.site-knowledge-list:has(> :only-child) { max-width: 520px; grid-template-columns: 1fr; }
.site-knowledge-hint {
  margin: 0 0 17px;
  color: #8297a2;
  font-size: 11px;
  line-height: 1.8;
}
.site-knowledge-hover-hint { display:none; }
@media (hover:hover) {
  .site-knowledge-hover-hint { display:inline; }
  .site-knowledge-tap-hint { display:none; }
}
.site-knowledge-source {
  font-size: 10px;
  line-height: 1.9;
  color: #8499a5;
  margin: 27px 0 0;
}
@media (max-width: 1100px) {
  .site-knowledge-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
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
    gap: 15px;
  }
}
@media (max-width: 420px) {
  .site-knowledge-list { grid-template-columns: 1fr; }
}
</style>
