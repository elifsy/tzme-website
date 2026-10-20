<script setup>
import { ref } from 'vue'

defineProps({ count: { type: Number, default: 0 } })
const artworkUnavailable = ref(false)
</script>

<template>
  <section class="news-intro news-intro-linework" aria-labelledby="news-page-title">
    <div class="hc-w news-intro-inner">
      <div class="news-intro-copy">
        <span class="news-intro-kicker">{{ $t('site.newsCount', { count }) }}</span>
        <h1 id="news-page-title" class="news-intro-title">{{ $t('site.newsAndInsights') }}</h1>
        <span class="news-intro-rule" aria-hidden="true"/>
        <p class="news-intro-description">记录制造现场，传递企业动态。</p>
        <router-link class="news-text-link news-intro-link" to="/contact">{{ $t('site.subscribeToUpdates') }}<span aria-hidden="true">→</span></router-link>
      </div>
    </div>
    <div v-if="!artworkUnavailable" class="news-intro-art" aria-hidden="true">
      <img src="/assets/tzme-j/news/news-intro-linework.webp" alt="" width="2172" height="724" fetchpriority="high" decoding="async" @error="artworkUnavailable = true"/>
    </div>
  </section>
</template>

<style scoped>
.design-site .news-intro-linework { position: relative; isolation: isolate; overflow: hidden; padding: 0; background: #eff8fc; color: #123a50; }
.news-intro-linework::after { content: ''; position: absolute; z-index: 1; inset: 0; background: linear-gradient(90deg, #eff8fc 0%, #eff8fcfa 25%, #eff8fcc9 35%, #eff8fc00 54%); pointer-events: none; }
.news-intro-inner { position: relative; z-index: 2; display: flex; align-items: center; min-height: clamp(340px, 22.3vw, 420px); pointer-events: none; }
.news-intro-copy { width: 43%; max-width: 540px; padding: 34px 0; pointer-events: auto; }
.news-intro-kicker { display: block; color: #6c8795; font: 11px/1.6 var(--f-ui); letter-spacing: 1.8px; }
.news-intro-linework .news-intro-title { margin: 14px 0 0; color: #123a50; font: 700 clamp(42px, 3vw, 56px)/1.25 var(--f-ui); letter-spacing: -1px; overflow-wrap: anywhere; }
.news-intro-rule { display: block; width: 46px; height: 3px; margin: 20px 0 22px; background: #087f91; }
.news-intro-description { margin: 0; color: #56758a; font: 16px/1.8 var(--f-ui); }
.news-intro-linework .news-intro-link { display: inline-flex; align-items: center; gap: 16px; min-height: 36px; margin-top: 17px; color: #087f91; font: 600 13px/1.6 var(--f-ui); text-decoration: none; }
.news-intro-link:hover { text-decoration: underline; text-underline-offset: 5px; }
.news-intro-art { position: absolute; z-index: 0; inset: 0 0 0 auto; width: 78%; height: 100%; pointer-events: none; user-select: none; mask-image: linear-gradient(to right, transparent, #000 12%); }
.news-intro-art img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: right center; }
@media (min-width: 701px) and (max-width: 1050px) {
  .news-intro-copy { width: 53%; }
  .news-intro-art { width: 88%; }
  .news-intro-linework::after { background: linear-gradient(90deg, #eff8fc, #eff8fcf2 33%, #eff8fc00 70%); }
}
@media (max-width: 700px) {
  .news-intro-inner { min-height: 0; }
  .news-intro-copy { width: 100%; max-width: none; padding: var(--site-mobile-intro-space, 24px) 0 0; }
  .news-intro-kicker { font-size: 10px; letter-spacing: 1.3px; }
  .news-intro-linework .news-intro-title { margin-top: 10px; font-size: 32px; line-height: 1.3; letter-spacing: -.6px; }
  .news-intro-rule { width: 34px; height: 2px; margin: 13px 0 15px; }
  .news-intro-description { font-size: 13px; line-height: 1.8; }
  .news-intro-linework .news-intro-link { min-height: 44px; margin-top: 6px; font-size: 12px; }
  .news-intro-art { position: relative; inset: auto; width: 100%; height: auto; aspect-ratio: 3; margin: 0 0 8px; mask-image: linear-gradient(to right, transparent, #000 4%, #000 98%, transparent); }
  .news-intro-art img { aspect-ratio: 3; height: auto; }
  .news-intro-linework::after { display: none; }
}
@media (forced-colors: active) {
  .design-site .news-intro-linework { background: Canvas; color: CanvasText; }
  .news-intro-art, .news-intro-linework::after { display: none; }
  .news-intro-linework :is(.news-intro-kicker, .news-intro-title, .news-intro-description) { color: CanvasText; }
  .news-intro-rule { background: CanvasText; }
  .news-intro-linework .news-intro-link { color: LinkText; }
}
</style>
