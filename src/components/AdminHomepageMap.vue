<script setup>
import { computed, onMounted } from "vue";
import AdminPreviewFrame from "./AdminPreviewFrame.vue";
import { useCapabilities } from "../services/capabilities.js";
import { useContactSettings } from "../services/contactSettings.js";
import { jBanner } from "../data/jDesign.js";
defineProps({
  products: { type: Array, default: () => [] },
  industries: { type: Array, default: () => [] },
});
const { capabilities, loadCapabilities } = useCapabilities();
const { contactSettings, loadContactSettings } = useContactSettings();
const steps = computed(
  () => capabilities.value?.steps.filter((item) => item.enabled).length,
);
async function load() {
  await Promise.allSettled([loadCapabilities(), loadContactSettings()]);
}
onMounted(load);
defineExpose({ load });
const modules = [
  {
    title: "行业入口",
    description: "已发布行业显示在 Banner 下方，产品按所属行业进入列表。",
    to: "/admin/industries",
    action: "维护行业",
  },
  {
    title: "企业简介",
    description: "编辑首页专用的企业简介、统计数字和制造基地图片。",
    to: "/admin/about?page=home",
    action: "填写简介",
  },
  {
    title: "首页方案",
    description: "先选择推荐产品和顺序，再维护对应的方案标题、说明与行业按钮。",
    to: "/admin/products?home=1",
    action: "选择推荐产品",
    second: { to: "/admin/solutions", label: "填写方案文案" },
  },
  {
    title: "制造与质量",
    description: "维护可切换的质量流程、工序说明和图标。",
    to: "/admin/capabilities",
    action: "编辑质量流程",
  },
  {
    title: "资质与质量体系",
    description: "维护关于我们页的资质资料，首页保留品质入口。",
    to: "/admin/certifications",
    action: "维护资质",
  },
  {
    title: "全球业务",
    description: "编辑业务文案、地图位置和统计数据。",
    to: "/admin/global",
    action: "配置全球业务",
  },
  {
    title: "合作伙伴",
    description: "维护与英文官网对应的品牌标志、名称、顺序与显示状态。",
    to: "/admin/partners",
    action: "维护合作伙伴",
  },
  {
    title: "联系与咨询",
    description: "企业联系方式、咨询表单、附件与邮件通知分别维护。",
    to: "/admin/contact",
    action: "联系方式",
    second: { to: "/admin/forms", label: "表单与附件" },
  },
  {
    title: "页脚资料",
    description:
      "页脚共用企业联系方式与社交链接；备案号在搜索与 AI 展示中填写。",
    to: "/admin/contact?section=social",
    action: "维护社交链接",
    second: { to: "/admin/seo?tab=site", label: "网站简称与备案号" },
  },
];
</script>

<template>
  <div class="admin-homepage-layout">
    <div class="admin-homepage-modules">
      <div class="admin-homepage-summary">
        <strong>按首页顺序维护内容</strong>
        <p>先准备资料，再设置展示；在右侧切换桌面和手机，检查已保存的效果。</p>
        <span
          >首页方案正在展示
          {{
            products.filter(
              (item) => item.showOnHome && item.status === "published",
            ).length
          }}
          / 5</span
        ><span v-if="steps !== undefined">{{ steps }} 道质量工序</span
        ><span
          >{{
            industries.filter((item) => item.status === "published").length
          }}
          个行业入口</span
        >
      </div>
      <article class="admin-homepage-banner">
        <img :src="jBanner.image" alt="首页固定首张港口 Banner" />
        <div>
          <strong>首页 Banner</strong>
          <p>使用当前固定首图与中文文案。</p>
          <span class="admin-fixed-badge">固定展示</span>
        </div>
      </article>
      <article
        v-for="(item, index) in modules"
        :key="item.title"
        class="admin-homepage-module"
      >
        <span class="admin-homepage-number">{{
          String(index + 1).padStart(2, "0")
        }}</span>
        <div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          <div>
            <router-link :to="item.to">{{ item.action }} →</router-link
            ><router-link v-if="item.second" :to="item.second.to"
              >{{ item.second.label }} →</router-link
            >
          </div>
        </div>
      </article>
      <div class="admin-homepage-summary admin-retained-note">
        <strong>当前首页不展示的内容</strong>
        <p>新闻只在独立资讯页维护；项目模块暂隐藏，资料与原设置保留。</p>
        <router-link to="/admin/articles">维护新闻资讯 ↗</router-link
        ><router-link to="/admin/projects">维护保留项目资料 ↗</router-link>
      </div>
    </div>
    <aside class="admin-homepage-preview">
      <AdminPreviewFrame title="首页已保存效果" source="/" />
    </aside>
  </div>
</template>
