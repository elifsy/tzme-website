<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import IndustryIcon from './IndustryIcon.vue'
import SceneProductPopover from './SceneProductPopover.vue'
import { emptyIndustryScene, hasIndustryProducts, productShowcaseLink, resolveIndustryHotspots, resolveThreeDSettings } from '../data/productShowcase.js'
const EquipmentScene3D = defineAsyncComponent(() => import('./EquipmentScene3D.vue'))

const props = defineProps({
  configuration: { type: Object, required: true },
  products: { type: Array, default: () => [] },
  industries: { type: Array, default: () => [] },
  selectedIndustry: { type: String, default: '' },
  returnPath: { type: String, default: '/solutions' },
  preview: Boolean,
})
const emit = defineEmits(['select-industry', 'browse-all', 'explore', 'reset'])
const stage = ref(null), entered = ref(false), failedImage = ref(false), openHotspot = ref(-1)
const threeReady = ref(false), threeFailed = ref(false)
const uid = useId()
const activeIndustries = computed(() => props.industries.filter(item => (item.status === 'published' && hasIndustryProducts(item, props.products))
  || (props.preview && item.status !== 'deleted' && item.id === props.selectedIndustry)))
const publishedProducts = computed(() => props.products.filter(item => item.status === 'published'
  || (props.preview && props.selectedIndustry && item.status !== 'deleted' && item.industries?.includes(props.selectedIndustry))))
const industry = computed(() => activeIndustries.value.find(item => item.id === props.selectedIndustry))
const industryProducts = computed(() => industry.value ? publishedProducts.value.filter(item => item.industries?.includes(industry.value.id)) : [])
const overview = computed(() => props.configuration.overview)
const story = computed(() => industry.value && Object.hasOwn(props.configuration.industries, industry.value.id)
  ? props.configuration.industries[industry.value.id] : emptyIndustryScene())
const usesOverviewImage = computed(() => !industry.value || !story.value.image)
const image = computed(() => !industry.value || usesOverviewImage.value ? overview.value.image : story.value.image || industryProducts.value[0]?.image)
const presentation = computed(() => usesOverviewImage.value ? overview.value.presentation : story.value.image ? story.value.presentation : 'photo')
const threeSettings = computed(() => resolveThreeDSettings(overview.value))
const useThreeD = computed(() => threeSettings.value.enabled && usesOverviewImage.value && presentation.value === 'scene' && !threeFailed.value)
watch(useThreeD, value => { if (!value) threeReady.value = false })
const title = computed(() => !industry.value ? overview.value.title : story.value.title || `${industry.value.titleZh}装备，\n服务现场需求。`)
const description = computed(() => !industry.value ? overview.value.description : story.value.description || industry.value.subtitleZh || overview.value.description)
const imageAlt = computed(() => (!industry.value || usesOverviewImage.value ? overview.value.imageAlt : story.value.imageAlt) || `${industry.value?.titleZh || ''}装备场景`)
const categories = computed(() => new Set(publishedProducts.value.map(item => item.categoryEn || item.category).filter(Boolean)).size)
const hotspots = computed(() => {
  const points = useThreeD.value ? resolveIndustryHotspots(overview.value.hotspots, activeIndustries.value, publishedProducts.value)
    : !industry.value || usesOverviewImage.value ? overview.value.hotspots : story.value.hotspots
  return points.filter(point => {
    if (!useThreeD.value && industry.value && point.industryId && point.industryId !== industry.value.id) return false
    const linkedIndustry = !point.industryId || activeIndustries.value.some(item => item.id === point.industryId)
    const linkedProduct = !point.productId || publishedProducts.value.some(item => item.id === point.productId)
    return linkedIndustry && linkedProduct && (point.industryId || point.productId)
  })
})
const currentPoint = computed(() => hotspots.value[openHotspot.value])
const currentProduct = computed(() => publishedProducts.value.find(item => item.id === currentPoint.value?.productId))
const currentIndustry = computed(() => activeIndustries.value.find(item => item.id === currentPoint.value?.industryId))
const productLink = item => productShowcaseLink(item.id, props.returnPath)
let observer, motionMedia, reducedMedia, frame = 0, x = 0, y = 0
function resetPointer() { x = 0; y = 0; schedulePointer() }
function paintPointer() {
  frame = 0
  stage.value?.style.setProperty('--scene-x', `${x * 12}px`)
  stage.value?.style.setProperty('--scene-y', `${y * 9}px`)
  stage.value?.style.setProperty('--scene-rotate', `${x * .7}deg`)
}
function schedulePointer() { if (!frame) frame = requestAnimationFrame(paintPointer) }
function movePointer(event) {
  if (useThreeD.value || props.preview || !motionMedia?.matches || reducedMedia?.matches) return
  const rect = stage.value.getBoundingClientRect()
  x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1))
  y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1))
  schedulePointer()
}
function closeHotspot(restoreFocus = false) {
  const index = openHotspot.value
  openHotspot.value = -1
  if (restoreFocus) nextTick(() => stage.value?.querySelector(`[data-hotspot-index="${index}"]`)?.focus())
}
function toggleHotspot(index, event) {
  openHotspot.value = openHotspot.value === index ? -1 : index
  if (event?.currentTarget) event.currentTarget.focus({ preventScroll: true })
  else nextTick(() => stage.value?.querySelector(`[data-hotspot-index="${index}"]`)?.focus({ preventScroll: true }))
}
function resetOverview() { closeHotspot(); resetPointer(); emit('reset') }
function selectIndustry(id) { if (!id) return resetOverview(); closeHotspot(); emit('select-industry', id) }
watch(() => [props.selectedIndustry, image.value], () => { closeHotspot(); failedImage.value = false; resetPointer() })
onMounted(() => {
  motionMedia = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 701px)')
  reducedMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMedia.addEventListener('change', resetPointer)
  if (props.preview || reducedMedia.matches || !('IntersectionObserver' in window)) entered.value = true
  else {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { entered.value = true; observer.disconnect() }
    }, { threshold: .15 })
    observer.observe(stage.value)
  }
})
onBeforeUnmount(() => { observer?.disconnect(); reducedMedia?.removeEventListener('change', resetPointer); if (frame) cancelAnimationFrame(frame) })
</script>

<template>
  <section class="product-showcase" aria-labelledby="products-page-title" :class="{ 'is-entered': entered }">
    <div class="hc-w product-showcase-inner">
      <div class="product-showcase-copy">
        <span class="showcase-kicker">{{ industry ? `产品中心 / ${industry.titleZh}` : overview.kicker }}</span>
        <Transition name="showcase-copy" mode="out-in">
          <div :key="industry?.id || 'overview'" class="showcase-story">
            <h1 id="products-page-title">{{ title }}</h1>
            <p>{{ description }}</p>
          </div>
        </Transition>
        <div class="showcase-actions">
          <button type="button" class="showcase-primary" @click="industry ? emit('explore', 'catalog') : emit('browse-all')">{{ industry ? `查看${industry.titleZh}装备` : overview.secondaryText }}<span aria-hidden="true">↓</span></button>
        </div>
        <div v-if="industry" class="showcase-related" aria-label="行业代表产品">
          <span>相关装备</span><router-link v-for="product in industryProducts.slice(0, 3)" :key="product.id" :to="productLink(product)">{{ product.titleZh || product.title }}<i aria-hidden="true">↗</i></router-link>
        </div>
        <div v-else class="showcase-counts" aria-label="产品目录统计">
          <span><strong>{{ activeIndustries.length }}</strong> 个行业</span><span><strong>{{ categories }}</strong> 个分类</span><span><strong>{{ publishedProducts.length }}</strong> 个产品</span>
        </div>
        <button v-if="industry" type="button" class="showcase-overview" @click="selectIndustry('')"><span aria-hidden="true">←</span>返回行业全景</button>
        <span v-else class="showcase-scroll-note"><i aria-hidden="true"/> 探索装备与应用场景</span>
      </div>
      <div ref="stage" class="equipment-scene" :class="{ 'is-photo': presentation === 'photo', 'has-industry': industry, 'image-unavailable': failedImage, 'has-three-d': useThreeD, 'three-d-ready': useThreeD && threeReady, 'three-d-failed': threeFailed }"
        @pointermove="movePointer" @pointerleave="resetPointer" @keydown.esc.stop="closeHotspot(true)">
        <div class="scene-ambient" aria-hidden="true"/>
        <div class="equipment-scene-motion">
          <Transition name="scene-switch" mode="out-in">
            <img v-if="image && !failedImage" :key="image" class="equipment-scene-art" :src="image" :alt="imageAlt" width="1536" height="1024" fetchpriority="high" decoding="async" @error="failedImage = true"/>
            <div v-else class="equipment-scene-placeholder"><IndustryIcon :icon="industry?.icon || ''"/><span>{{ industry?.titleZh || '装备制造' }}</span></div>
          </Transition>
          <EquipmentScene3D v-if="useThreeD" :settings="threeSettings" :industries="activeIndustries" :hotspots="hotspots" :selected-industry="selectedIndustry" @ready="threeReady = true" @unavailable="threeFailed = true" @select-industry="selectIndustry" @reset="resetOverview"/>
          <div v-if="!useThreeD && !failedImage" class="scene-hotspots">
            <button v-for="(point, index) in hotspots" :key="`${industry?.id}-${index}`" type="button" class="scene-hotspot"
              :class="{ 'is-active': openHotspot === index, 'is-right': point.x > 70, 'is-bottom': point.y > 80 }"
              :style="{ left: `${point.x}%`, top: `${point.y}%` }" :data-hotspot-index="index"
              :aria-label="`了解${point.label}`" :aria-expanded="openHotspot === index" :aria-controls="`${uid}-scene-card`"
              @click.stop="toggleHotspot(index, $event)"><span class="scene-hotspot-dot" aria-hidden="true"/><span>{{ point.label }}</span><i aria-hidden="true">↗</i></button>
          </div>
        </div>
        <Transition name="scene-card"><SceneProductPopover v-if="currentPoint && !useThreeD" :id="`${uid}-scene-card`" :label="currentPoint.label" :product="currentProduct" :industry="currentIndustry" :product-link="currentProduct ? productLink(currentProduct) : undefined" @close="closeHotspot(true)" @select-industry="selectIndustry"/></Transition>
        <div v-if="industry && !useThreeD" class="scene-industry-caption"><span>{{ industry.titleZh }}</span><small>{{ industryProducts.length }} 项相关产品</small></div>
      </div>
    </div>
  </section>
  <section id="industry-explorer" class="showcase-industry-section" aria-label="按应用行业选择装备">
    <div class="hc-w">
      <div class="industry-section-heading"><h2>选择应用行业</h2><span>从实际工况，找到适用装备</span></div>
      <div class="showcase-industries">
        <button type="button" :aria-pressed="!industry" @click="selectIndustry('')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg><span>全部行业</span></button>
        <button v-for="item in activeIndustries" :key="item.id" type="button" :aria-pressed="industry?.id === item.id" :data-industry="item.id" @click="selectIndustry(item.id)"><IndustryIcon :icon="item.icon || ''"/><span>{{ item.titleZh }}</span></button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.product-showcase{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(115deg,#eff7fc 0%,#eaf4fa 46%,#dcecf7 100%);color:#123a50;font-family:var(--f-ui);}
.product-showcase::before{content:'';position:absolute;inset:0;z-index:-1;background:radial-gradient(ellipse at 15% 60%,#fff9,transparent 56%),radial-gradient(ellipse at 85% 0%,#fff8,transparent 56%);}
.product-showcase-inner{display:grid;grid-template-columns:35% 65%;position:relative;min-height:660px;align-items:center;}
.product-showcase-copy{position:relative;z-index:2;padding:68px 0 52px;align-self:stretch;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;min-width:0;}
.showcase-kicker{font-size:12px;color:#688699;letter-spacing:1.2px;line-height:1.8;margin-bottom:28px;}
.showcase-story{width:100%;}
.showcase-story h1{font:700 clamp(38px,3.65vw,66px)/1.35 var(--f-ui);letter-spacing:-1.8px;color:#123a50;white-space:pre-line;margin:0 0 30px;overflow-wrap:anywhere;}
.showcase-story p{color:#56758a;max-width:410px;font-size:15px;line-height:2;margin:0;white-space:pre-line;}
.showcase-actions{display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-top:38px;}
.showcase-actions button{font:600 13px/1.5 var(--f-ui);cursor:pointer;border-radius:0;display:inline-flex;align-items:center;justify-content:space-between;gap:24px;min-height:48px;transition:background .2s,color .2s,transform .2s;}
.showcase-primary{border:1px solid #087f91;background:#087f91;color:white;padding:13px 23px;min-width:172px;}
.showcase-primary:hover{background:#086c7c;transform:translateY(-2px);}
.showcase-counts{display:flex;gap:22px;flex-wrap:wrap;margin-top:46px;color:#7590a3;font-size:12px;line-height:1.8;}
.showcase-counts strong{font-size:16px;font-weight:600;color:#087f91;padding-right:3px;font-variant-numeric:tabular-nums;}
.showcase-scroll-note{display:flex;align-items:center;gap:11px;font-size:10px;color:#849dab;letter-spacing:1px;margin-top:54px;}
.showcase-scroll-note i{display:block;width:24px;height:1px;background:#5b9dad;}
.showcase-related{display:flex;align-items:center;gap:10px 17px;flex-wrap:wrap;max-width:420px;margin-top:34px;font-size:11px;line-height:1.8;}
.showcase-related>span{width:100%;font-size:10px;color:#7d95a3;letter-spacing:1px;}
.showcase-related a{color:#315a70;text-decoration:none;display:flex;gap:9px;align-items:center;}.showcase-related a:hover{color:#087f91;}.showcase-related i{font-style:normal;color:#087f91;}
.showcase-overview{font:inherit;font-size:11px;display:flex;gap:10px;align-items:center;background:none;border:0;color:#67869a;padding:12px 0 0;margin-top:26px;cursor:pointer;}
.equipment-scene{position:relative;width:110%;max-width:110%;aspect-ratio:1.5;justify-self:start;transform:translate(-2%,-1%);perspective:1000px;--scene-x:0px;--scene-y:0px;--scene-rotate:0deg;}
.equipment-scene.has-three-d{width:116%;max-width:116%;aspect-ratio:1.64;transform:translateX(1.5%);justify-self:end;}
.scene-ambient{position:absolute;inset:12% 5% 0;background:radial-gradient(ellipse,#9bc9e13b,transparent 68%);filter:blur(20px);transform:translate(calc(var(--scene-x) * -.6),calc(var(--scene-y) * -.6));}
.equipment-scene-motion{position:absolute;inset:0;transform:translate3d(var(--scene-x),var(--scene-y),0) rotateY(var(--scene-rotate));transition:transform .65s cubic-bezier(.2,.7,.25,1);}
.has-three-d .equipment-scene-motion{transform:none!important;transition:none;}.three-d-ready .equipment-scene-art{opacity:0!important;pointer-events:none;}
.three-d-failed .equipment-scene-art{opacity:1!important;transform:none!important;transition:none!important;}
.equipment-scene-art{display:block;width:100%;height:100%;object-fit:contain;opacity:0;transform:translateY(22px);transition:opacity 1.1s ease,transform 1.3s cubic-bezier(.2,.7,.25,1);}
.is-entered .equipment-scene-art{opacity:1;transform:translateY(0);}
.equipment-scene.is-photo{width:98%;max-width:98%;aspect-ratio:1.42;transform:none;justify-self:end;margin-block:42px;}
.is-photo .equipment-scene-art{object-fit:cover;border:10px solid #ffffffc7;box-shadow:0 20px 50px #3e70951a;}
.scene-hotspots{position:absolute;inset:0;}
.scene-hotspot{position:absolute;z-index:1;display:flex;align-items:center;gap:9px;white-space:nowrap;transform:translate(-25%,-100%);background:#fffffff5;color:#28576e;border:1px solid #ffffffbd;box-shadow:0 4px 18px #173f5710;border-radius:7px;padding:9px 12px;font:600 11px/1.5 var(--f-ui);cursor:pointer;opacity:0;transition:opacity .6s .7s,background .2s,color .2s,box-shadow .2s;}
.is-entered .scene-hotspot{opacity:1;}.scene-hotspot:hover,.scene-hotspot.is-active{color:#087f91;background:#fff;box-shadow:0 5px 24px #23768e24;}.scene-hotspot.is-active{z-index:2;border-color:#77bfcc;}.scene-hotspot i{font-size:13px;font-style:normal;font-weight:400;}.scene-hotspot.is-right{transform:translate(-70%,-100%);}.scene-hotspot.is-bottom{transform:translate(-30%,0);}
.scene-hotspot::after{content:'';position:absolute;top:100%;left:25%;height:24px;width:1px;background:linear-gradient(#3b8da7c0,#3b8da72b);}.scene-hotspot.is-bottom::after{top:auto;bottom:100%;}
.scene-hotspot{max-width:min(230px,80%);}.scene-hotspot>span:nth-child(2){overflow:hidden;text-overflow:ellipsis;}.scene-hotspot-dot,.scene-hotspot i{flex-shrink:0;}.scene-hotspot-dot{display:block;width:5px;height:5px;border-radius:50%;background:#1794a5;box-shadow:0 0 0 3px #1794a515;}
.scene-product-card{position:absolute;z-index:4;right:14%;bottom:5%;width:280px;box-sizing:border-box;padding:23px;background:#fffffff5;box-shadow:0 10px 40px #21465a29;border-top:2px solid #087f91;backdrop-filter:blur(12px);}
.scene-card-close{position:absolute;right:5px;top:5px;width:32px;height:32px;display:grid;place-items:center;background:none;border:0;font:20px/1 var(--f-ui);color:#658498;cursor:pointer;}
.scene-card-kicker{font-size:10px;color:#6d8fa0;letter-spacing:1px;}.scene-product-card strong{display:block;color:#123a50;font-size:18px;line-height:1.6;margin-top:8px;}.scene-product-card p{color:#607c8b;font-size:12px;line-height:1.8;margin:10px 0 17px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}.scene-product-card>div{display:flex;align-items:center;justify-content:space-between;gap:12px;}.scene-product-card a,.scene-product-card>div button{font:600 11px/1.6 var(--f-ui);color:#087f91;background:none;border:0;text-decoration:none;padding:6px 0;cursor:pointer;display:flex;gap:12px;}
.scene-industry-caption{position:absolute;bottom:4px;right:15%;display:flex;align-items:center;gap:13px;color:#315d73;font-size:12px;}.scene-industry-caption::before{content:'';width:25px;height:1px;background:#83adbd;}.scene-industry-caption small{font-size:10px;color:#7894a5;}
.equipment-scene-placeholder{position:absolute;inset:10%;display:flex;align-items:center;justify-content:center;gap:18px;border:1px solid #c9dfe8;color:#4c7b90;background:#edf7fab3;font-size:20px;}.equipment-scene-placeholder :deep(img),.equipment-scene-placeholder :deep(svg){width:42px;height:42px;}
.showcase-industry-section{background:#fff;border-bottom:1px solid #e4edf1;padding:29px 0 0;color:#123a50;}
.industry-section-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:22px;}.industry-section-heading h2{font:600 14px/1.6 var(--f-ui);margin:0;}.industry-section-heading>span{font-size:10px;color:#8a9daa;letter-spacing:.5px;}
.showcase-industries{display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:4px 8px;}
.showcase-industries button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:11px;min-width:0;padding:0 5px 21px;min-height:77px;border:0;background:transparent;font:500 11px/1.5 var(--f-ui);color:#6d8798;cursor:pointer;transition:color .2s,background .2s;}
.showcase-industries button::after{content:'';position:absolute;bottom:0;left:12%;right:12%;height:2px;background:#087f91;transform:scaleX(0);transition:transform .2s;}.showcase-industries button[aria-pressed=true],.showcase-industries button:hover{color:#087f91;}.showcase-industries button[aria-pressed=true]::after{transform:scaleX(1);}.showcase-industries button>svg,.showcase-industries :deep(.industry-icon){width:25px;height:25px;}.showcase-industries :deep(.industry-icon img){width:100%;height:100%;object-fit:contain;}
.product-showcase button:focus-visible,.product-showcase a:focus-visible,.showcase-industry-section button:focus-visible{outline:2px solid #087f91;outline-offset:5px;}
.showcase-copy-enter-active,.showcase-copy-leave-active{transition:opacity .15s,transform .15s;}.showcase-copy-enter-from{opacity:0;transform:translateY(7px);}.showcase-copy-leave-to{opacity:0;transform:translateY(-5px);}.scene-switch-enter-active,.scene-switch-leave-active{transition:opacity .18s;}.scene-switch-enter-from,.scene-switch-leave-to{opacity:0;}.scene-card-enter-active,.scene-card-leave-active{transition:opacity .2s,transform .2s;}.scene-card-enter-from,.scene-card-leave-to{opacity:0;transform:translateY(9px);}
@media(min-width:1800px){.product-showcase-inner{min-height:760px;}.equipment-scene{width:116%;}.showcase-story h1{font-size:68px;}.showcase-story p{font-size:17px;max-width:470px;}}
@media(max-width:1200px){.product-showcase-inner{min-height:580px;grid-template-columns:40% 60%;}.showcase-story h1{font-size:42px;}.showcase-story p{font-size:14px;}.showcase-actions{gap:17px;margin-top:28px;}.showcase-actions button{font-size:12px;}.showcase-primary{min-width:150px;padding-inline:18px;}.showcase-counts{gap:15px;margin-top:30px;}.equipment-scene{width:125%;max-width:125%;}.showcase-scroll-note{margin-top:40px;}.showcase-industries{grid-template-columns:repeat(auto-fit,minmax(83px,1fr));}}
@media(max-width:900px) and (min-width:701px){.product-showcase-inner{min-height:560px;grid-template-columns:44% 56%;}.showcase-story h1{font-size:36px;}.showcase-story p{font-size:13px;}.showcase-actions{gap:12px;}.showcase-primary{min-width:135px;padding-inline:14px;}.showcase-secondary{font-size:11px!important;}.showcase-counts{font-size:10px;gap:11px;}.showcase-counts strong{font-size:14px;}.scene-hotspot{font-size:10px;padding:7px 9px;gap:6px;}.showcase-industries{grid-template-columns:repeat(6,minmax(0,1fr));}.showcase-industries button{padding-top:8px;}.scene-product-card{right:8%;width:250px;}}
@media(max-width:700px){.product-showcase-inner{grid-template-columns:1fr;min-height:0;}.product-showcase-copy{padding:38px 0 16px;}.showcase-kicker{font-size:10px;letter-spacing:1px;margin-bottom:18px;}.showcase-story h1{font-size:clamp(31px,8.5vw,44px);line-height:1.4;letter-spacing:-1px;margin-bottom:18px;}.showcase-story p{font-size:12px;line-height:1.9;max-width:460px;}.showcase-actions{gap:22px;margin-top:23px;}.showcase-actions button{font-size:11px;min-height:42px;}.showcase-primary{min-width:145px;padding:10px 15px;}.showcase-secondary{font-size:11px!important;}.showcase-counts{gap:22px;margin-top:25px;font-size:10px;}.showcase-counts strong{font-size:14px;}.showcase-scroll-note{display:none;}.showcase-related{margin-top:21px;gap:8px 14px;max-width:100%;font-size:10px;}.showcase-overview{font-size:10px;margin-top:12px;padding-top:4px;}.equipment-scene{width:112%;max-width:112%;aspect-ratio:1.5;justify-self:center;transform:none;margin:0 -6% 9px;}.equipment-scene.is-photo{width:100%;max-width:100%;aspect-ratio:1.4;margin:10px 0 27px;}.is-photo .equipment-scene-art{border-width:5px;}.scene-hotspot{font-size:9px;padding:7px 8px;gap:6px;border-radius:5px;}.scene-hotspot-dot{width:4px;height:4px;}.scene-hotspot::after{height:15px;}.scene-product-card{right:9%;bottom:3%;width:min(270px,82%);padding:16px 18px;}.scene-product-card strong{font-size:16px;}.scene-product-card p{font-size:11px;line-height:1.7;margin:7px 0 10px;-webkit-line-clamp:2;}.scene-industry-caption{font-size:10px;right:7%;bottom:-14px;}.scene-industry-caption small{font-size:9px;}.showcase-industry-section{padding-top:23px;}.industry-section-heading{margin-bottom:15px;}.industry-section-heading h2{font-size:12px;}.industry-section-heading>span{display:none;}.showcase-industries{grid-template-columns:repeat(4,minmax(0,1fr));gap:5px 4px;}.showcase-industries button{min-height:72px;font-size:10px;gap:8px;padding:9px 0 14px;}.showcase-industries button>svg,.showcase-industries :deep(.industry-icon){width:22px;height:22px;}.scene-card-close{width:28px;height:28px;font-size:18px;}}
@media(min-width:701px) and (max-width:1050px){.product-showcase-inner{grid-template-columns:36% 64%;}}
@media(max-width:700px){.equipment-scene.has-three-d{width:100%;max-width:100%;aspect-ratio:.95;margin:8px 0 15px;transform:none;justify-self:center;}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;}.equipment-scene-motion{transform:none!important;}.equipment-scene-art,.scene-hotspot{opacity:1;transform:none;}.scene-hotspot{transform:translate(-25%,-100%);}}
</style>
