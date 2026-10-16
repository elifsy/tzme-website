<script setup>
import { Box, ChatDotRound, Grid, OfficeBuilding, ArrowRight, CircleCheck } from '@element-plus/icons-vue'
defineProps({ products: { type: Array, default: () => [] }, articles: { type: Array, default: () => [] }, inquiries: { type: Array, default: () => [] }, newInquiries: { type: Number, default: 0 }, ready: Boolean })
defineEmits(['create'])
const tasks = [
  { icon: Box, title: '维护产品与行业', text: '补充产品介绍、图片、参数和所属行业', to: '/admin/products', color: 'blue' },
  { icon: Grid, title: '调整首页展示', text: '按官网顺序进入各个模块，设置推荐内容', to: '/admin/home', color: 'teal' },
  { icon: OfficeBuilding, title: '更新企业资料', text: '维护企业介绍、基地照片、联系方式与资质', to: '/admin/contact?section=subsidiaries', color: 'purple' },
  { icon: ChatDotRound, title: '处理客户咨询', text: '查看留言附件，跟进需求与通知状态', to: '/admin/inquiries', color: 'orange' },
]
</script>

<template>
  <div class="admin-workbench">
    <section class="admin-welcome"><div><span>WEBSITE WORKSPACE</span><h2>今天，准备更新什么？</h2><p>从内容维护到首页展示，沿着任务路径完成填写、预览和保存。</p></div><a href="/" target="_blank" rel="noopener noreferrer">查看官网 <span>↗</span></a></section>
    <div class="admin-workbench-stats"><div><span>产品资料</span><strong>{{ products.length }}<small>{{ products.filter(item => item.status === 'published').length }} 个已发布</small></strong></div><div><span>首页推荐</span><strong>{{ products.filter(item => item.showOnHome).length }}<small>最多 5 个产品</small></strong></div><div><span>待跟进咨询</span><strong>{{ newInquiries }}<small>共 {{ inquiries.length }} 条咨询</small></strong></div><div><span>数据连接</span><strong class="admin-status-value"><el-icon><CircleCheck /></el-icon>{{ ready ? '正常' : '待检查' }}</strong><small>以当前读取结果为准</small></div></div>
    <section class="admin-workbench-section"><div class="admin-section-heading"><div><h2>常用任务</h2><p>选择想完成的事情，直接进入对应设置。</p></div><el-button plain @click="$emit('create', 'products')">新增产品</el-button></div><div class="admin-task-grid"><router-link v-for="task in tasks" :key="task.to" :to="task.to" class="admin-task-card"><span class="admin-task-icon" :class="task.color"><el-icon><component :is="task.icon" /></el-icon></span><div><h3>{{ task.title }}</h3><p>{{ task.text }}</p></div><el-icon class="admin-task-arrow"><ArrowRight /></el-icon></router-link></div></section>
    <div class="admin-workbench-bottom"><section class="admin-workbench-section"><div class="admin-section-heading"><div><h2>推荐填写路径</h2><p>第一次整理网站时，按这个顺序更顺畅。</p></div></div><ol class="admin-setup-path"><li><b>01</b><div><router-link to="/admin/industries">准备行业与产品 →</router-link><p>行业决定首页入口，产品资料决定内容与图片。</p></div></li><li><b>02</b><div><router-link to="/admin/home">配置首页展示 →</router-link><p>选择推荐产品，再完善方案文案、企业简介与质量流程。</p></div></li><li><b>03</b><div><router-link to="/admin/contact?section=subsidiaries">核对企业与联系资料 →</router-link><p>把照片、简介和对应地址一起检查，补齐资质与社交链接。</p></div></li><li><b>04</b><div><router-link to="/admin/forms">检查咨询与通知 →</router-link><p>确认表单必填项、附件规则及邮件收件设置。</p></div></li></ol></section><section class="admin-workbench-section"><div class="admin-section-heading"><div><h2>最近客户咨询</h2><p>留言与附件都在客户咨询中管理。</p></div><router-link to="/admin/inquiries">查看全部 ↗</router-link></div><el-empty v-if="!inquiries.length" :image-size="65" description="暂无客户咨询"/><div v-for="item in inquiries.slice(0, 4)" :key="item.id" class="admin-recent-inquiry"><span>{{ (item.name || '客').slice(0, 1) }}</span><div><strong>{{ item.name || '网站访客' }}</strong><p>{{ item.company || item.email }}</p></div><time>{{ item.createdAt?.slice(0, 10) }}</time></div><div class="admin-workbench-shortcuts"><el-button text @click="$emit('create', 'articles')">新增新闻资讯 ↗</el-button><router-link to="/admin/analytics">查看访问分析 ↗</router-link></div></section></div>
  </div>
</template>
