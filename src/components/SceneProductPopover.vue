<script setup>
defineProps({
  label: String,
  product: Object,
  industry: Object,
  productLink: Object,
});
defineEmits(["close", "select-industry"]);
</script>
<template>
  <aside class="scene-product-card" :aria-label="label">
    <button
      type="button"
      class="scene-card-close"
      aria-label="关闭设备介绍"
      @click="$emit('close')"
    >
      ×</button
    ><span class="scene-card-kicker">{{ industry?.titleZh || "代表装备" }}</span
    ><strong>{{ product?.titleZh || label }}</strong>
    <p>{{ product?.summaryZh || industry?.subtitleZh }}</p>
    <div>
      <router-link v-if="product" :to="productLink"
        >查看产品 <span aria-hidden="true">↗</span></router-link
      ><button
        v-if="industry"
        type="button"
        @click="$emit('select-industry', industry.id)"
      >
        {{ industry.titleZh }}装备 <span aria-hidden="true">→</span>
      </button>
    </div>
  </aside>
</template>
<style scoped>
.scene-product-card {
  position: absolute;
  z-index: 4;
  right: 14%;
  bottom: 5%;
  width: 280px;
  box-sizing: border-box;
  padding: 23px;
  background: #fffffff5;
  box-shadow: 0 10px 40px #21465a29;
  border-top: 2px solid #087f91;
  backdrop-filter: blur(12px);
  font-family: var(--f-ui);
}
.scene-card-close {
  position: absolute;
  right: 5px;
  top: 5px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: none;
  border: 0;
  font: 20px/1 var(--f-ui);
  color: #658498;
  cursor: pointer;
}
.scene-card-kicker {
  font-size: 10px;
  color: #6d8fa0;
  letter-spacing: 1px;
}
.scene-product-card strong {
  display: block;
  color: #123a50;
  font-size: 18px;
  line-height: 1.6;
  margin-top: 8px;
}
.scene-product-card p {
  color: #607c8b;
  font-size: 12px;
  line-height: 1.8;
  margin: 10px 0 17px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.scene-product-card > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.scene-product-card a,
.scene-product-card > div button {
  font: 600 11px/1.6 var(--f-ui);
  color: #087f91;
  background: none;
  border: 0;
  text-decoration: none;
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  gap: 12px;
}
.scene-product-card button:focus-visible,
.scene-product-card a:focus-visible {
  outline: 2px solid #087f91;
  outline-offset: 3px;
}
@media (max-width: 700px) {
  .scene-product-card {
    width: min(270px, 82%);
    padding: 16px 18px;
  }
  .scene-product-card strong {
    font-size: 16px;
  }
  .scene-product-card p {
    font-size: 11px;
    line-height: 1.7;
    margin: 7px 0 10px;
    -webkit-line-clamp: 2;
  }
  .scene-card-close {
    width: 28px;
    height: 28px;
    font-size: 18px;
  }
}
</style>
