<script setup>
import { ref, useId, watch } from "vue";
import { useRoute } from "vue-router";
import { useSiteNavigation } from "../composables/useSiteNavigation.js";
import LanguageSwitcher from "./LanguageSwitcher.vue";

defineProps({ overlay: { type: Boolean, default: false } });

const route = useRoute();
const { menuItems, isMenuActive, goTo, navigateLink } = useSiteNavigation();
const drawerOpen = ref(false);
const mobileMenuId = `site-mobile-menu-${useId()}`;

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
        <i aria-hidden="true"></i>TZME
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
          >☰</el-button
        >
        <LanguageSwitcher />
        <el-button
          class="hc-btn sm"
          :class="overlay ? 'ghost' : 'solid'"
          style="height: 34px"
          @click.stop="navigateTo('/contact')"
        >
          {{ $t("site.contactUs") }}<i aria-hidden="true">→</i>
        </el-button>
      </div>
    </div>
  </header>
  <el-drawer
    v-model="drawerOpen"
    title="TZME"
    direction="rtl"
    size="min(320px, 85vw)"
    append-to-body
    class="hc-mobile-drawer site-nav-drawer"
  >
    <nav
      :id="mobileMenuId"
      class="hc-mobile-links"
      :aria-label="$t('site.primaryNavigation')"
      data-site-nav
    >
      <el-button
        v-for="item in menuItems"
        :key="item.key"
        text
        :type="isMenuActive(item) ? 'primary' : 'default'"
        :aria-current="isMenuActive(item) ? 'page' : undefined"
        @click="navigateTo(item.path)"
        >{{ item.label }}</el-button
      >
    </nav>
    <LanguageSwitcher mobile />
  </el-drawer>
</template>
