<script setup>
import { computed, ref, watch } from 'vue';
import { rankLabel, rankSources } from '../utils/keywordRankings.js';
const props = defineProps({ snapshots: { type: Array, default: () => [] }, depth: { type: Number, default: 100 } });
const selected = ref(null);
const date = value => new Date(value).toLocaleString('zh-CN', { hour12: false });
const points = computed(() => [...props.snapshots].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt) || a.id - b.id).map((item, index, values) => ({ ...item, x: values.length === 1 ? 380 : 55 + index * 665 / (values.length - 1), y: item.status === 'ranked' ? 24 + (item.position - 1) / props.depth * 170 : 194 })));
const segments = computed(() => {
  const result = []; let group = [];
  for (const point of points.value) { if (point.status === 'error') { if (group.length) result.push(group); group = []; } else group.push(point); }
  if (group.length) result.push(group); return result.map(group => group.map(point => `${point.x},${point.y}`).join(' '));
});
const ticks = computed(() => [...new Set([1, Math.round(props.depth / 2), props.depth])].map(value => ({ value, y: 24 + (value - 1) / props.depth * 170 })));
const dates = computed(() => points.value.filter((item, index, all) => index === 0 || index === all.length - 1 || (all.length > 4 && index === Math.floor(all.length / 2))));
const active = computed(() => points.value.find(point => point.id === selected.value) || points.value.at(-1));
watch(() => props.snapshots, () => { selected.value = null; });
</script>
<template>
  <div class="rank-trend">
    <template v-if="points.length">
      <div class="rank-trend-current"><div><small>{{ active ? date(active.observedAt) : '' }}</small><strong v-if="active">{{ rankLabel(active.status, active.position, depth) }}</strong></div><span v-if="active">{{ rankSources[active.source] }}{{ active.error ? ' · ' + active.error : '' }}</span></div>
      <svg viewBox="0 0 750 235" role="img" aria-label="关键词排名历史，名次越靠上越好，采集失败处断开">
        <g v-for="tick in ticks" :key="tick.value"><line x1="55" x2="720" :y1="tick.y" :y2="tick.y" stroke="#e1eaf0" stroke-dasharray="4 5" /><text x="43" :y="tick.y + 4" text-anchor="end">{{ tick.value }}</text></g>
        <line x1="55" x2="720" y1="194" y2="194" stroke="#e1eaf0" /><text x="43" y="198" text-anchor="end">范围外</text>
        <polyline v-for="(segment, index) in segments" :key="index" :points="segment" fill="none" stroke="#118398" stroke-width="2.4" stroke-linejoin="round" />
        <g v-for="point in points" :key="point.id" tabindex="0" role="img" :aria-label="date(point.observedAt) + ' ' + rankLabel(point.status, point.position, depth)" @pointerenter="selected = point.id" @focus="selected = point.id">
          <circle :cx="point.x" :cy="point.y" r="10" fill="transparent" />
          <circle :cx="point.x" :cy="point.y" :r="active?.id === point.id ? 5 : 3.5" :fill="point.status === 'error' ? '#c66666' : point.status === 'not_found' ? '#91a5b3' : '#118398'" stroke="#fff" stroke-width="1.5" />
          <title>{{ date(point.observedAt) }} · {{ rankLabel(point.status, point.position, depth) }}</title>
        </g>
        <text v-for="point in dates" :key="point.id" :x="point.x" y="222" :text-anchor="point === points[0] ? 'start' : point === points.at(-1) ? 'end' : 'middle'">{{ new Date(point.observedAt).toLocaleDateString('zh-CN') }}</text>
      </svg>
      <p>名次越靠上越好。“范围外”表示未在检查范围内检出，未赋予虚构名次；采集失败不参与升降对比。</p>
    </template>
    <el-empty v-else :image-size="65" description="暂无历史排名，首次记录后即可显示；两次有效记录后可比较升降。" />
  </div>
</template>
<style scoped>
.rank-trend { padding: 18px; border: 1px solid #e1eaf0; border-radius: 12px; background: #f8fbfd; }
.rank-trend-current { display: flex; justify-content: space-between; align-items: center; gap: 16px; min-height: 55px; }
.rank-trend-current > div { display: grid; gap: 7px; }
.rank-trend-current small, .rank-trend-current > span { color: #8297a5; font-size: 11px; line-height: 1.7; }
.rank-trend-current strong { color: #20465c; font-size: 20px; }
svg { display: block; width: 100%; margin-top: 12px; overflow: visible; }
svg text { fill: #90a2af; font: 10px system-ui, sans-serif; }
svg g[tabindex] { outline: none; cursor: crosshair; }
svg g[tabindex]:focus circle:first-child { stroke: #118398; stroke-width: 1; }
.rank-trend p { margin: 0; color: #91a2ae; font-size: 11px; line-height: 1.7; }
@media(max-width:600px) { .rank-trend { padding: 14px; } .rank-trend-current { align-items: start; } .rank-trend-current > span { max-width: 45%; text-align: right; } }
</style>
