<script setup>
import { sanitizeRichText } from '../utils/richText.js'
defineProps({ kind: { type: String, default: 'products' }, record: { type: Object, required: true } })
const lines = text => (text || '').split('\n').map(value => value.trim()).filter(Boolean)
</script>

<template>
  <section class="hc-sec content-draft-preview"><div class="hc-w">
    <template v-if="kind === 'products'"><div class="j-detail-top"><div><span class="hc-kick">{{ record.categoryZh || '产品介绍' }}</span><h1 class="hc-h2">{{ record.titleZh || '产品名称' }}</h1><p class="hc-p">{{ record.summaryZh }}</p></div><div class="j-detail-photo"><img v-if="record.image" :src="record.image" :alt="record.titleZh"/><div v-else class="draft-image-placeholder">产品图片</div></div></div><div class="content-draft-detail"><div><h2>产品介绍</h2><p>{{ record.contentZh }}</p><h3 v-if="record.featuresZh">产品特点</h3><ul v-if="record.featuresZh"><li v-for="line in lines(record.featuresZh)" :key="line">{{ line }}</li></ul></div><div v-if="record.specificationsZh" class="draft-specifications"><h3>产品信息</h3><p v-for="line in lines(record.specificationsZh)" :key="line">{{ line }}</p></div></div></template>
    <template v-else><span class="hc-kick">{{ record.categoryZh || '新闻资讯' }} · {{ record.date }}</span><h1 class="hc-h2">{{ record.titleZh || '新闻标题' }}</h1><p class="hc-p">{{ record.summaryZh }}</p><img v-if="record.image" class="draft-article-cover" :src="record.image" :alt="record.titleZh"/><div class="article-body" v-html="sanitizeRichText(record.contentZh)"/></template>
  </div></section>
</template>

<style scoped>
.content-draft-preview h1 { margin-bottom:22px; }.j-detail-photo > img { width:100%; aspect-ratio:1.4; object-fit:cover; }.draft-image-placeholder { display:grid; place-items:center; min-height:240px; background:#edf6f7; color:#809ba6; }
.content-draft-detail { display:grid; grid-template-columns:1.3fr 1fr; gap:60px; margin-top:45px; font-size:15px; line-height:2; color:#526c79; }.content-draft-detail h2,.content-draft-detail h3 { color:#123a50; font-size:21px; margin:0 0 18px; }.content-draft-detail h3 { margin-top:25px; }.content-draft-detail p { margin:0; white-space:pre-line; overflow-wrap:anywhere; }.draft-specifications { background:#f4f9fa; padding:25px; align-self:start; }.draft-specifications p { border-top:1px solid #dbe6e9; padding:12px 0; }.draft-specifications h3 { margin-top:0; }.draft-article-cover { display:block; width:100%; max-height:520px; object-fit:cover; margin:30px 0; }
@media(max-width:700px){.content-draft-detail { grid-template-columns:1fr; gap:26px; font-size:13px; margin-top:28px; }.content-draft-detail h2,.content-draft-detail h3 { font-size:19px; }}
</style>
