<script setup>
import { ref } from 'vue'

const artworkUnavailable = ref(false)
</script>

<template>
  <section class="news-intro news-intro-ocean" :class="{ 'news-intro-no-art': artworkUnavailable }" aria-labelledby="news-page-title">
    <div v-if="!artworkUnavailable" class="news-intro-art" aria-hidden="true">
      <img src="/assets/tzme-j/news/news-intro-ocean.webp" alt="" width="2079" height="756" fetchpriority="high" decoding="async" @error="artworkUnavailable = true"/>
    </div>
    <div class="hc-w news-intro-inner">
      <div class="news-intro-copy">
        <span class="news-intro-kicker">NEWS &amp; INSIGHTS</span>
        <h1 id="news-page-title" class="news-intro-title site-page-title">{{ $t('site.newsAndInsights') }}</h1>
        <span class="news-intro-rule" aria-hidden="true"/>
        <p class="news-intro-description site-intro-description">记录制造现场，传递企业动态。</p>
        <router-link class="news-text-link news-intro-link" to="/contact">{{ $t('site.subscribeToUpdates') }}<span aria-hidden="true">↗</span></router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.news-intro-ocean { position: relative; isolation: isolate; overflow: hidden; background: #eff7fa; color: #123a50; }
.news-intro-art { position: absolute; inset: 0; z-index: -1; pointer-events: none; user-select: none; }
.news-intro-art img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center 51%; }
.news-intro-art::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #eff7fa 0%, #eff7fa 24%, rgba(239,247,250,.96) 34%, rgba(239,247,250,.7) 43%, rgba(239,247,250,.15) 58%, rgba(239,247,250,0) 68%); }
.news-intro-inner { display: flex; align-items: flex-start; min-height: 430px; }
.news-intro-copy { width: 42%; padding: var(--site-hero-copy-top, 64px) 0 52px; }
.news-intro-kicker { display: block; color: #617f8e; font-size: 11px; line-height: var(--site-hero-kicker-line-height, 20px); letter-spacing: 2px; }
.news-intro-title { margin: var(--site-hero-title-gap, 12px) 0 0; color: #123a50; font: 700 clamp(42px,3.8vw,62px)/1.25 var(--f-ui); letter-spacing: -1px; overflow-wrap: anywhere; }
.news-intro-rule { display: block; width: 45px; height: 3px; margin: 26px 0; background: #087f91; }
.news-intro-description { margin: 0; color: #466a7a; font-size: 17px; line-height: 1.9; }
.news-intro-ocean .news-intro-link { display: inline-flex; align-items: center; gap: 20px; min-height: 36px; margin-top: 15px; color: #087f91; font-size: 13px; font-weight: 600; text-decoration: none; }
.news-intro-link span { font-size: 17px; transition: transform .2s; }
.news-intro-link:hover { text-decoration: underline; text-underline-offset: 5px; }
.news-intro-link:hover span { transform: translate(3px,-1px); }
@media (min-width: 1800px) { .news-intro-inner { min-height: 480px; } }
@media (max-width: 1050px) {
  .news-intro-inner { min-height: 360px; }
  .news-intro-copy { width: 48%; }
  .news-intro-description { font-size: 15px; }
}
@media (max-width: 700px) {
  .news-intro-inner { min-height: 0; }
  .news-intro-copy { width: 100%; padding: var(--site-hero-copy-top, 24px) 0 143px; }
  .news-intro-kicker { font-size: 10px; letter-spacing: 1.5px; }
  .news-intro-title { font-size: 34px; line-height: 1.25; letter-spacing: -.6px; }
  .news-intro-rule { width: 34px; height: 2px; margin: 13px 0 14px; }
  .news-intro-description { font-size: 13px; line-height: 1.8; }
  .news-intro-ocean .news-intro-link { min-height: 36px; margin-top: 4px; font-size: 11px; gap: 17px; }
  .news-intro-art { top: auto; height: 165px; }
  .news-intro-art img { object-position: right center; }
  .news-intro-art::after { background: linear-gradient(180deg, #eff7fa 0%, rgba(239,247,250,.87) 13%, rgba(239,247,250,.12) 43%, rgba(239,247,250,0) 66%); }
  .news-intro-no-art .news-intro-copy { padding-bottom: 24px; }
}
@media (prefers-reduced-motion: reduce) { .news-intro-link span { transition: none; } }
@media (forced-colors: active) {
  .news-intro-ocean { background: Canvas; color: CanvasText; }
  .news-intro-art { display: none; }
  .news-intro-ocean :is(.news-intro-kicker, .news-intro-title, .news-intro-description) { color: CanvasText; }
  .news-intro-rule { background: CanvasText; }
  .news-intro-ocean .news-intro-link { color: LinkText; }
  .news-intro-copy { padding-bottom: 24px; }
}
</style>
