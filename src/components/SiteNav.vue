<script setup>
import { useSiteContent } from "../services/website.js";
const { siteValue } = useSiteContent();
import { onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { useRoute } from "vue-router";
import { useSiteNavigation } from "../composables/useSiteNavigation.js";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import SiteLogo from "./SiteLogo.vue";
import { responsiveImage } from "../utils/responsiveImages.js";
import { useContactSettings } from "../services/contactSettings.js";
import "../style/site-mobile-nav.css";

defineProps({ overlay: { type: Boolean, default: false } });

const route = useRoute();
const { menuItems, isMenuActive, goTo, navigateLink } = useSiteNavigation();
const { contactSettings } = useContactSettings();
const drawerOpen = ref(false);
const mobileMenuId = `site-mobile-menu-${useId()}`;
const desktopNavigation = window.matchMedia("(min-width: 1051px)");

function navigateFromDrawer(event, path) {
  if (
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  drawerOpen.value = false;
  navigateLink(event, path);
}
function closeOnDesktop(event) {
  if (event.matches) drawerOpen.value = false;
}
onMounted(() => desktopNavigation.addEventListener("change", closeOnDesktop));
onBeforeUnmount(() =>
  desktopNavigation.removeEventListener("change", closeOnDesktop),
);

function navigateTo(path) {
  drawerOpen.value = false;
  return goTo(path);
}

watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false;
  },
);
</script>

<template>
  <header class="hc-nav" :class="{ over: overlay }" data-site-nav>
    <div class="hc-nav-in">
      <a
        class="hc-logo"
        href="/"
        :aria-label="$t('site.brandHome')"
        @click="navigateLink($event, '/')"
      >
        <SiteLogo />
      </a>
      <nav class="hc-menu" :aria-label="$t('site.primaryNavigation')">
        <a
          v-for="item in menuItems"
          :key="item.key"
          :href="item.path"
          :class="{ on: isMenuActive(item) }"
          :aria-current="isMenuActive(item) ? 'page' : undefined"
          @click="navigateLink($event, item.path)"
          >{{ item.label }}</a
        >
      </nav>
      <div class="hc-nav-r">
        <el-button
          class="hc-mobile-menu"
          text
          :aria-label="$t('site.openNavigation')"
          :aria-expanded="drawerOpen"
          :aria-controls="mobileMenuId"
          @click="drawerOpen = true"
          ><svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h11" /></svg
        ></el-button>
        <LanguageSwitcher class="site-header-language" />
        <el-button
          class="hc-btn sm site-nav-contact"
          :class="overlay ? 'ghost' : 'solid'"
          data-analytics-event="cta_click"
          data-analytics-target="nav-contact"
          @click.stop="navigateTo('/contact')"
        >
          {{ $t("site.contactUs") }}<i aria-hidden="true">→</i>
        </el-button>
      </div>
    </div>
  </header>
  <el-drawer
    v-model="drawerOpen"
    :title="siteValue('text_8920f3d022b5')"
    direction="rtl"
    size="min(400px, calc(100vw - 24px))"
    append-to-body
    destroy-on-close
    :show-close="false"
    modal-class="site-nav-drawer-overlay"
    class="hc-mobile-drawer site-nav-drawer"
  >
    <template #header="{ titleId }">
      <div class="mobile-drawer-brand">
        <img
          v-bind="
            responsiveImage(
              '/assets/tzme-j/brand/official-mark.jpg',
              '44px',
              160,
            )
          "
          width="44"
          height="44"
          alt="TZME 重钢机械"
        />
        <div>
          <strong>{{ siteValue("text_8920f3d022b5") }}</strong>
          <h2 :id="titleId">网站导航</h2>
        </div>
      </div>
      <button
        type="button"
        class="mobile-drawer-close"
        :aria-label="$t('site.close')"
        @click="drawerOpen = false"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </template>
    <nav
      :id="mobileMenuId"
      class="hc-mobile-links"
      :aria-label="$t('site.primaryNavigation')"
      data-site-nav
    >
      <a
        v-for="(item, index) in menuItems"
        :key="item.key"
        :href="item.path"
        :aria-current="isMenuActive(item) ? 'page' : undefined"
        data-analytics-event="navigation_click"
        :data-analytics-target="item.path"
        @click="navigateFromDrawer($event, item.path)"
        ><span class="mobile-drawer-index" aria-hidden="true">{{
          String(index + 1).padStart(2, "0")
        }}</span
        ><span>{{ item.label }}</span
        ><span class="mobile-drawer-arrow" aria-hidden="true">↗</span></a
      >
    </nav>
    <div class="mobile-drawer-footer">
      <div
        v-if="
          contactSettings?.contact.emails.length ||
          contactSettings?.contact.phone
        "
        class="mobile-drawer-contact"
      >
        <span class="mobile-drawer-contact-label">{{
          $t("site.contactUs")
        }}</span>
        <a
          v-for="email in contactSettings?.contact.emails"
          :key="email"
          :href="`mailto:${email}`"
          class="mobile-drawer-email"
          >{{ email }}<span aria-hidden="true">→</span></a
        >
        <p v-if="contactSettings?.contact.phone">
          {{ contactSettings.contact.phone }}
        </p>
      </div>
      <LanguageSwitcher mobile />
    </div>
  </el-drawer>
</template>

<style scoped>
.hc-nav .hc-nav-r :deep(.site-header-language) {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 14px;
  height: 36px;
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 1;
  letter-spacing: 0;
}
.hc-nav .hc-nav-r :deep(.site-header-language .hc-lang-option) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 36px;
  padding: 0;
  color: #647f8c;
  font-size: 13px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0;
  text-decoration: none;
}
.hc-nav .hc-nav-r :deep(.site-header-language a.hc-lang-option:hover) {
  color: #087f91;
}
.hc-nav .hc-nav-r :deep(.site-header-language a.hc-lang-option::after) {
  content: '↗';
  margin-left: 8px;
  font-size: 13px;
}
.hc-nav .hc-nav-r :deep(.site-header-language .hc-lang-option.active) {
  color: #087f91;
  font-weight: 600;
  cursor: default;
}
.hc-nav .hc-nav-r :deep(.site-header-language .hc-lang-separator) {
  color: #c0d1d7;
  font-size: 11px;
  font-weight: 400;
}
@media (max-width: 700px) {
  .hc-nav .hc-nav-r :deep(.site-header-language) {
    display: none !important;
  }
}
</style>
