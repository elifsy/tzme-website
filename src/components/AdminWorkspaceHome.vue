<script setup>
import { computed } from "vue";
import {
  Box,
  ChatDotRound,
  Document,
  Grid,
  OfficeBuilding,
  ArrowRight,
  CircleCheck,
  Search,
} from "@element-plus/icons-vue";
import { contentNeedsAttention } from "../utils/adminContent.js";
const props = defineProps({
  products: { type: Array, default: () => [] },
  articles: { type: Array, default: () => [] },
  inquiries: { type: Array, default: () => [] },
  newInquiries: { type: Number, default: 0 },
  ready: Boolean,
});
defineEmits(["create"]);
const productGaps = computed(
  () =>
    props.products.filter((record) => contentNeedsAttention(record, "products"))
      .length,
);
const newsGaps = computed(
  () =>
    props.articles.filter((record) => contentNeedsAttention(record, "articles"))
      .length,
);
const featuredCount = computed(
  () =>
    props.products.filter(
      (record) => record.status === "published" && record.showOnHome,
    ).length,
);
const tasks = [
  {
    icon: Box,
    title: "维护产品与行业",
    text: "填写产品类型、关联行业，配置设备展示图与布局",
    to: "/admin/products",
    color: "blue",
  },
  {
    icon: Document,
    title: "发布新闻资讯",
    text: "选择或新建中文类别，补齐封面、正文与发布日期",
    to: "/admin/articles",
    color: "teal",
  },
  {
    icon: Grid,
    title: "调整首页展示",
    text: "按实际首页顺序维护推荐方案、制造与质量、全球业务",
    to: "/admin/home",
    color: "teal",
  },
  {
    icon: OfficeBuilding,
    title: "更新企业资料",
    text: "企业介绍、制造基地、资质和联系方式分别维护",
    to: "/admin/about?page=about",
    color: "purple",
  },
  {
    icon: Search,
    title: "搜索与 AI 展示",
    text: "维护标题摘要、公开问答、备案号和搜索平台验证",
    to: "/admin/seo",
    color: "blue",
  },
  {
    icon: ChatDotRound,
    title: "处理客户咨询",
    text: "查看客户留言与附件，跟进需求和邮件通知状态",
    to: "/admin/inquiries",
    color: "orange",
  },
];
</script>

<template>
  <div class="admin-workbench">
    <section class="admin-welcome">
      <div>
        <span>TZME · 官网内容维护</span>
        <h2>今天，准备更新什么？</h2>
        <p>选择维护内容，完成填写、预览和保存；英文官网独立维护。</p>
      </div>
      <a href="/" target="_blank" rel="noopener noreferrer"
        >查看官网 <span>↗</span></a
      >
    </section>
    <div class="admin-workbench-stats">
      <div>
        <span>产品资料</span
        ><strong
          >{{ products.length
          }}<small
            >{{
              products.filter((item) => item.status === "published").length
            }}
            个已发布 · 首页正在展示 {{ featuredCount }} 个</small
          ></strong
        >
      </div>
      <div>
        <span>新闻资讯</span
        ><strong
          >{{ articles.filter((item) => item.status === "published").length
          }}<small
            >已发布 ·
            {{
              articles.filter((item) => item.status === "draft").length
            }}
            篇草稿</small
          ></strong
        >
      </div>
      <div>
        <span>待跟进咨询</span
        ><strong
          >{{ newInquiries
          }}<small>共 {{ inquiries.length }} 条咨询</small></strong
        >
      </div>
      <div>
        <span>数据读取</span
        ><strong class="admin-status-value"
          ><el-icon><CircleCheck /></el-icon
          >{{ ready ? "正常" : "待检查" }}</strong
        ><small>当前后台读取状态</small>
      </div>
    </div>
    <section class="admin-workbench-section">
      <div class="admin-section-heading">
        <div>
          <h2>常用任务</h2>
          <p>资料与页面展示分别维护，进入对应入口即可。</p>
        </div>
        <div class="admin-workbench-create">
          <el-button plain @click="$emit('create', 'products')"
            >新增产品</el-button
          ><el-button type="primary" plain @click="$emit('create', 'articles')"
            >新增新闻</el-button
          >
        </div>
      </div>
      <div class="admin-task-grid">
        <router-link
          v-for="task in tasks"
          :key="task.to"
          :to="task.to"
          class="admin-task-card"
          ><span class="admin-task-icon" :class="task.color"
            ><el-icon><component :is="task.icon" /></el-icon
          ></span>
          <div>
            <h3>{{ task.title }}</h3>
            <p>{{ task.text }}</p>
          </div>
          <el-icon class="admin-task-arrow"><ArrowRight /></el-icon
        ></router-link>
      </div>
    </section>
    <section class="admin-workbench-section admin-publish-checks">
      <div class="admin-section-heading">
        <div>
          <h2>发布前检查</h2>
          <p>仅检查实际必填资料，点击可查看待完善的记录。</p>
        </div>
      </div>
      <div class="admin-check-grid">
        <router-link to="/admin/products?check=incomplete"
          ><strong>产品名称与行业</strong
          ><span
            >{{
              productGaps ? productGaps + " 条待完善" : "当前资料齐全"
            }}
            ↗</span
          ><small
            >核对中文名称及所属行业，详情布局随产品保存。</small
          ></router-link
        >
        <router-link to="/admin/articles?check=incomplete"
          ><strong>新闻封面与日期</strong
          ><span
            >{{ newsGaps ? newsGaps + " 条待完善" : "当前资料齐全" }} ↗</span
          ><small
            >草稿及发布都需要中文标题、封面和发布日期。</small
          ></router-link
        >
        <router-link to="/admin/seo?tab=verification"
          ><strong>搜索收录准备</strong><span>核对平台验证与站点地图 ↗</span
          ><small
            >保存官网内容后，站点地图随已发布资料更新。</small
          ></router-link
        >
      </div>
    </section>
    <div class="admin-workbench-bottom">
      <section class="admin-workbench-section">
        <div class="admin-section-heading">
          <div>
            <h2>推荐维护路径</h2>
            <p>内容更新后，再检查页面展示与搜索信息。</p>
          </div>
        </div>
        <ol class="admin-setup-path">
          <li>
            <b>01</b>
            <div>
              <router-link to="/admin/products">产品与行业 →</router-link>
              <p>选择现有行业，完善介绍、图片与设备详情。</p>
            </div>
          </li>
          <li>
            <b>02</b>
            <div>
              <router-link to="/admin/home">首页与企业资料 →</router-link>
              <p>检查推荐方案、质量流程、基地照片与资质。</p>
            </div>
          </li>
          <li>
            <b>03</b>
            <div>
              <router-link to="/admin/articles">新闻与搜索展示 →</router-link>
              <p>维护独立资讯页，必要时调整搜索标题和摘要。</p>
            </div>
          </li>
          <li>
            <b>04</b>
            <div>
              <router-link to="/admin/forms">咨询与邮件通知 →</router-link>
              <p>检查表单、附件规则、联系人及邮件收件设置。</p>
            </div>
          </li>
        </ol>
      </section>
      <section class="admin-workbench-section">
        <div class="admin-section-heading">
          <div>
            <h2>最近客户咨询</h2>
            <p>留言与附件都在客户咨询中管理。</p>
          </div>
          <router-link to="/admin/inquiries">查看全部 ↗</router-link>
        </div>
        <el-empty
          v-if="!inquiries.length"
          :image-size="65"
          description="暂无客户咨询"
        />
        <div
          v-for="item in inquiries.slice(0, 4)"
          :key="item.id"
          class="admin-recent-inquiry"
        >
          <span>{{ (item.name || "客").slice(0, 1) }}</span>
          <div>
            <strong>{{ item.name || "网站访客" }}</strong>
            <p>{{ item.company || item.email }}</p>
          </div>
          <time>{{ item.createdAt?.slice(0, 10) }}</time>
        </div>
        <div class="admin-workbench-shortcuts">
          <router-link to="/admin/contact">企业联系方式 ↗</router-link
          ><router-link to="/admin/analytics">查看访问分析 ↗</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-workbench-create {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.admin-workbench-create .el-button {
  margin: 0;
}
.admin-check-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.admin-check-grid > a {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 18px;
  border: 1px solid #e0e8ee;
  border-radius: 9px;
  text-decoration: none;
}
.admin-check-grid strong {
  color: #315369;
  font-size: 13px;
}
.admin-check-grid span {
  color: #14798b;
  font-size: 12px;
  line-height: 1.7;
}
.admin-check-grid small {
  color: #718698;
  font-size: 11px;
  line-height: 1.8;
}
@media (max-width: 900px) {
  .admin-check-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .admin-workbench-create {
    justify-content: flex-start;
  }
  .admin-workbench-create .el-button {
    font-size: 11px;
    padding-inline: 10px;
  }
  .admin-workbench-section
    > .admin-section-heading:has(.admin-workbench-create) {
    flex-wrap: wrap;
  }
}
</style>
