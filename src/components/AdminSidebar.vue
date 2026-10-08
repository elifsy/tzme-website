<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  Box, ChatDotRound, Collection, DataBoard, Document, Expand, Fold, Grid, Link,
  Location, Medal, Message, OfficeBuilding, Setting, Tools, TrendCharts,
} from '@element-plus/icons-vue'

const props = defineProps({
  activeKey: { type: String, default: 'overview' },
  newInquiries: { type: Number, default: 0 },
  databaseReady: { type: Boolean, default: true },
  collapsed: Boolean,
})
defineEmits(['select', 'toggle', 'close'])
const navigation = ref(null)
const menu = ref(null)
const groups = [
  {
    key: 'workspace', icon: DataBoard, items: [
      { key: 'overview', label: 'admin.overview', icon: DataBoard },
      { key: 'analytics', label: 'analyticsAdmin.title', icon: TrendCharts },
    ],
  },
  {
    key: 'content', icon: Collection, items: [
      { key: 'products', label: 'admin.products', icon: Box },
      { key: 'projects', label: 'admin.projects', icon: Collection },
      { key: 'articles', label: 'admin.insights', icon: Document },
      { key: 'industries', label: 'admin.industryManagement', icon: Grid },
      { key: 'certifications', label: 'admin.certifications', icon: Medal },
    ],
  },
  {
    key: 'pages', icon: Setting, items: [
      { key: 'about', label: 'adminNavigation.labels.about', title: 'aboutTzmeAdmin.title', icon: OfficeBuilding },
      { key: 'capabilities', label: 'adminNavigation.labels.capabilities', title: 'capabilitiesAdmin.title', icon: Tools },
      { key: 'global', label: 'adminNavigation.labels.global', title: 'admin.homeGlobal', icon: Location },
      { key: 'contact', label: 'adminNavigation.labels.contact', title: 'contactAdmin.title', icon: Setting },
    ],
  },
  {
    key: 'communication', icon: ChatDotRound, items: [
      { key: 'inquiries', label: 'admin.enquiries', icon: ChatDotRound },
      { key: 'mail', label: 'mailAdmin.title', icon: Message },
    ],
  },
]

const groupPreferenceKey = 'tzme-admin-sidebar-groups-v1'
const expandedGroups = ref(readExpandedGroups())
ensureActiveGroup()
const initialExpandedGroups = expandedGroups.value.slice()
let preferenceTimer
let scrollFrame
let disposed = false

function readExpandedGroups() {
  try {
    const stored = JSON.parse(localStorage.getItem(groupPreferenceKey))
    if (Array.isArray(stored)) return groups.filter(group => stored.includes(group.key)).map(group => group.key)
  } catch { /* Storage is optional; navigation remains available. */ }
  return []
}

function ensureActiveGroup() {
  const group = groups.find(group => group.items.some(item => item.key === props.activeKey))
  if (group && !expandedGroups.value.includes(group.key)) expandedGroups.value.push(group.key)
  return group?.key
}

function onGroupOpen(key) {
  // Hovering a popup in the compact sidebar must not change the saved layout.
  if (props.collapsed || !groups.some(group => group.key === key) || expandedGroups.value.includes(key)) return
  expandedGroups.value.push(key)
}

function onGroupClose(key) {
  if (props.collapsed) return
  expandedGroups.value = expandedGroups.value.filter(groupKey => groupKey !== key)
}

function toggleGroupWithKeyboard(key, event) {
  if (event.currentTarget.classList.contains('is-opened')) {
    menu.value?.close(key)
    onGroupClose(key)
  } else menu.value?.open(key)
}

async function restoreExpandedGroups(collapsed) {
  if (collapsed) {
    cancelAnimationFrame(scrollFrame)
    return
  }
  await nextTick()
  if (!disposed && !props.collapsed) {
    ensureActiveGroup()
    for (const group of groups) {
      if (expandedGroups.value.includes(group.key)) menu.value?.open(group.key)
      else menu.value?.close(group.key)
    }
    queueRevealActiveItem()
  }
}

async function queueRevealActiveItem() {
  await nextTick()
  if (disposed) return
  cancelAnimationFrame(scrollFrame)
  scrollFrame = requestAnimationFrame(revealActiveItem)
}

function revealActiveItem() {
  const wrap = navigation.value?.querySelector('.el-scrollbar__wrap')
  const item = navigation.value?.querySelector(props.collapsed
    ? '.cms-sidebar-group-current > .el-sub-menu__title'
    : '.el-menu-item.is-active')
  if (!wrap || !item?.getClientRects().length) return
  const viewport = wrap.getBoundingClientRect()
  const bounds = item.getBoundingClientRect()
  if (bounds.top < viewport.top) wrap.scrollTop -= viewport.top - bounds.top + 8
  else if (bounds.bottom > viewport.bottom) wrap.scrollTop += bounds.bottom - viewport.bottom + 8
}
onMounted(queueRevealActiveItem)
watch(() => props.activeKey, async () => {
  const groupKey = ensureActiveGroup()
  await nextTick()
  if (disposed) return
  if (!props.collapsed && groupKey) menu.value?.open(groupKey)
  queueRevealActiveItem()
})
watch(() => props.collapsed, restoreExpandedGroups)

function saveExpandedGroups() {
  preferenceTimer = undefined
  try { localStorage.setItem(groupPreferenceKey, JSON.stringify(expandedGroups.value)) }
  catch { /* Keep the current layout when browser storage is unavailable. */ }
}
watch(expandedGroups, () => {
  clearTimeout(preferenceTimer)
  preferenceTimer = setTimeout(saveExpandedGroups, 200)
}, { deep: true, flush: 'post' })
onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(scrollFrame)
  if (preferenceTimer !== undefined) {
    clearTimeout(preferenceTimer)
    saveExpandedGroups()
  }
})
</script>

<template>
  <el-aside class="cms-sidebar" :class="{ 'cms-sidebar-collapsed': collapsed }" width="var(--admin-sidebar-width)">
    <div class="cms-sidebar-header">
      <router-link to="/admin" class="cms-sidebar-brand" :aria-label="$t('adminNavigation.home')" @click="$emit('close')">
        <span class="cms-sidebar-mark" aria-hidden="true">T</span>
        <span class="cms-sidebar-brand-copy">TZME<small>{{ $t('admin.management') }}</small></span>
      </router-link>
      <el-tooltip :content="$t(collapsed ? 'adminNavigation.expand' : 'adminNavigation.collapse')" :trigger="['hover', 'focus']" placement="right">
        <el-button class="cms-sidebar-toggle" text :icon="collapsed ? Expand : Fold"
          :aria-label="$t(collapsed ? 'adminNavigation.expand' : 'adminNavigation.collapse')" :aria-expanded="!collapsed"
          aria-controls="admin-sidebar-navigation" @click="$emit('toggle')" />
      </el-tooltip>
    </div>

    <nav id="admin-sidebar-navigation" ref="navigation" class="cms-sidebar-navigation" :aria-label="$t('adminNavigation.label')">
      <el-scrollbar class="cms-sidebar-scroll">
        <el-menu ref="menu" class="cms-sidebar-menu" :default-active="activeKey" :default-openeds="initialExpandedGroups"
          :collapse="collapsed" :collapse-transition="false" :unique-opened="false" popper-class="cms-sidebar-group-popup"
          :persistent="false" :show-timeout="0" :hide-timeout="80"
          @open="onGroupOpen" @close="onGroupClose" @select="$emit('select', $event)">
          <el-sub-menu v-for="group in groups" :key="group.key" :index="group.key" class="cms-sidebar-group"
            :class="{ 'cms-sidebar-group-current': group.items.some(item => item.key === activeKey) }"
            tabindex="0" :aria-label="$t('adminNavigation.groups.' + group.key)"
            @keydown.enter.self.prevent="toggleGroupWithKeyboard(group.key, $event)"
            @keydown.space.self.prevent="toggleGroupWithKeyboard(group.key, $event)">
            <template #title>
              <el-icon aria-hidden="true"><component :is="group.icon" /></el-icon>
              <span class="cms-sidebar-group-title" :title="$t('adminNavigation.groups.' + group.key)">{{ $t('adminNavigation.groups.' + group.key) }}</span>
              <el-badge v-if="group.key === 'communication' && newInquiries && (collapsed || !expandedGroups.includes(group.key))"
                :value="newInquiries" :max="99" :aria-label="$t('contactAdmin.newInquiryCount', { count: newInquiries })"
                class="cms-sidebar-badge cms-sidebar-group-badge" />
            </template>
            <li v-if="collapsed" class="cms-sidebar-popup-heading" role="presentation">{{ $t('adminNavigation.groups.' + group.key) }}</li>
            <el-menu-item v-for="item in group.items" :key="item.key" :index="item.key" :title="$t(item.title || item.label)"
              :aria-label="$t(item.label)" :aria-current="activeKey === item.key ? 'page' : undefined">
              <el-icon aria-hidden="true"><component :is="item.icon" /></el-icon>
              <span class="cms-sidebar-item-label">{{ $t(item.label) }}</span>
              <el-badge v-if="item.key === 'inquiries' && newInquiries" :value="newInquiries" :max="99"
                :aria-label="$t('contactAdmin.newInquiryCount', { count: newInquiries })" class="cms-sidebar-badge" />
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-scrollbar>
    </nav>

    <div class="cms-sidebar-footer">
      <div class="cms-sidebar-status" role="status">
        <span class="cms-sidebar-status-dot" :class="{ 'cms-sidebar-status-error': !databaseReady }" aria-hidden="true" />
        <span>{{ $t(databaseReady ? 'admin.systemOperational' : 'admin.databaseReadFailed') }}</span>
      </div>
      <el-tooltip :content="$t('admin.viewWebsite')" :trigger="['hover', 'focus']" placement="right">
        <el-link href="/" target="_blank" rel="noopener noreferrer" :underline="false" class="cms-sidebar-website" :aria-label="$t('admin.viewWebsite')">
          <el-icon aria-hidden="true"><Link /></el-icon><span class="cms-sidebar-website-label">{{ $t('admin.viewWebsite') }}</span>
        </el-link>
      </el-tooltip>
    </div>
  </el-aside>
</template>

<style scoped>
.cms-sidebar { position: fixed; inset: 0 auto 0 0; z-index: 6; display: flex; flex-direction: column; width: var(--admin-sidebar-width, 244px); height: 100vh; height: 100dvh; overflow: hidden; padding: 0 12px; background: #111e2b; color: #d2dce6; box-sizing: border-box; contain: layout paint; }
.cms-sidebar,
:global(.cms-sidebar-group-popup) { -webkit-user-select: none; user-select: none; }
.cms-sidebar-header { display: flex; flex-shrink: 0; align-items: center; gap: 8px; min-height: 82px; padding: 16px 6px; border-bottom: 1px solid #2a3a4b; }
.cms-sidebar-brand { display: flex; flex: 1; align-items: center; gap: 10px; min-width: 0; min-height: 36px; color: #fff; text-decoration: none; }
.cms-sidebar-brand:focus-visible { outline: 2px solid #88c2ff; outline-offset: -4px; border-radius: 5px; }
.cms-sidebar-mark { display: grid; flex-shrink: 0; place-items: center; width: 34px; height: 34px; border-radius: 5px; background: #e96727; color: #fff; font-size: 17px; font-weight: 700; }
.cms-sidebar-brand-copy { min-width: 0; font-size: 16px; font-weight: 700; letter-spacing: .1em; }
.cms-sidebar-brand-copy small { display: block; margin-top: 2px; color: #afbdcb; font-size: 10px; font-weight: 400; letter-spacing: .03em; }
.cms-sidebar-toggle.el-button { flex-shrink: 0; width: 34px; height: 36px; margin: 0; padding: 0; border: 1px solid #3a4e62; border-radius: 4px; background: #1b2e40; color: #dce9f4; font-size: 18px; }
.cms-sidebar-toggle.el-button:hover { border-color: #88c2ff; background: #233c54; color: #fff; }
.cms-sidebar-toggle.el-button:focus-visible { outline: 2px solid #88c2ff; outline-offset: 2px; }
.cms-sidebar-navigation { flex: 1; min-height: 0; padding: 8px 0 12px; overflow: hidden; }
.cms-sidebar-scroll { height: 100%; }
.cms-sidebar-scroll :deep(.el-scrollbar__bar.is-vertical) { right: 0; }
.cms-sidebar-menu.el-menu { --el-menu-bg-color: transparent; --el-menu-text-color: #c5d1dc; --el-menu-active-color: #fff; --el-menu-hover-bg-color: #1b2e40; --el-transition-duration: 0s; padding: 0 4px 0 0; border-right: 0; background: transparent; }
.cms-sidebar-group + .cms-sidebar-group { margin-top: 8px; padding-top: 8px; border-top: 1px solid #2a3a4b; }
.cms-sidebar-group :deep(.el-sub-menu__title) { gap: 10px; height: 44px; padding: 0 30px 0 12px !important; border-radius: 5px; color: #cbd8e5; line-height: 1.4; }
.cms-sidebar-group :deep(.el-sub-menu__title > .el-icon:not(.el-sub-menu__icon-arrow)) { flex-shrink: 0; width: 20px; margin: 0; color: #9db3c6; font-size: 18px; }
.cms-sidebar-group :deep(.el-sub-menu__icon-arrow) { right: 10px; width: 12px; color: #9db3c6; }
.cms-sidebar-group :deep(.el-sub-menu__title:hover) { background: #1b2e40; color: #fff; }
.cms-sidebar-group-current :deep(.el-sub-menu__title) { color: #fff; }
.cms-sidebar-group-current :deep(.el-sub-menu__title > .el-icon:not(.el-sub-menu__icon-arrow)) { color: #88c2ff; }
.cms-sidebar-group:focus-visible { outline: none; }
.cms-sidebar-group:focus-visible :deep(.el-sub-menu__title) { outline: 2px solid #88c2ff; outline-offset: -2px; }
.cms-sidebar-group-title { flex: 1; min-width: 0; overflow: hidden; color: inherit; font-size: 12px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.cms-sidebar-menu :deep(.el-menu-item) { position: relative; display: flex; align-items: center; gap: 8px; height: 42px; min-width: 0; margin: 3px 0; padding: 0 10px 0 36px !important; border-radius: 5px; color: #c5d1dc; font-size: 13px; line-height: 1.4; }
.cms-sidebar-menu :deep(.el-menu-item .el-icon) { flex-shrink: 0; width: 20px; margin: 0; color: #9db3c6; font-size: 18px; }
.cms-sidebar-item-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cms-sidebar-menu :deep(.el-menu-item:hover) { background: #1b2e40; color: #fff; }
.cms-sidebar-menu :deep(.el-menu-item.is-active) { background: #233c54; color: #fff; font-weight: 600; }
.cms-sidebar-menu :deep(.el-menu-item.is-active::before) { position: absolute; top: 11px; bottom: 11px; left: 0; width: 3px; border-radius: 0 2px 2px 0; background: #88c2ff; content: ''; }
.cms-sidebar-menu :deep(.el-menu-item.is-active .el-icon) { color: #88c2ff; }
.cms-sidebar-menu :deep(.el-menu-item:focus-visible) { outline: 2px solid #88c2ff; outline-offset: -2px; }
.cms-sidebar-badge { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; height: 20px; margin-left: auto; line-height: 1; }
.cms-sidebar-badge :deep(.el-badge__content) { position: static; display: inline-flex; align-items: center; justify-content: center; transform: none; height: 20px; min-width: 20px; padding: 0 6px; border: 0; line-height: 20px; box-sizing: border-box; }
.cms-sidebar-footer { flex-shrink: 0; padding: 14px 10px 16px; border-top: 1px solid #2a3a4b; }
.cms-sidebar-status { display: flex; align-items: center; gap: 8px; color: #afbdcb; font-size: 11px; line-height: 1.5; }
.cms-sidebar-status-dot { flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; background: #50c69a; }
.cms-sidebar-status-error { background: #f18b81; }
.cms-sidebar-website.el-link { justify-content: flex-start; width: 100%; min-height: 36px; margin-top: 8px; color: #d4e5f3; font-size: 12px; }
.cms-sidebar-website :deep(.el-link__inner) { gap: 8px; }
.cms-sidebar-website .el-icon { font-size: 16px; }
.cms-sidebar-website.el-link:hover { color: #fff; }
.cms-sidebar-website.el-link:focus-visible { outline: 2px solid #88c2ff; outline-offset: 2px; }
.cms-sidebar-collapsed { padding: 0 6px; }
.cms-sidebar-collapsed .cms-sidebar-header { flex-direction: column; justify-content: center; gap: 10px; min-height: 106px; padding: 12px 0; }
.cms-sidebar-collapsed .cms-sidebar-brand { flex: none; justify-content: center; gap: 0; }
.cms-sidebar-collapsed .cms-sidebar-brand-copy,
.cms-sidebar-collapsed .cms-sidebar-group-title,
.cms-sidebar-collapsed .cms-sidebar-status { display: none; }
.cms-sidebar-collapsed .cms-sidebar-navigation { padding: 8px 0; }
.cms-sidebar-collapsed .cms-sidebar-menu.el-menu { width: 100%; padding: 0; }
.cms-sidebar-collapsed .cms-sidebar-group :deep(.el-sub-menu__title) { justify-content: center; gap: 0; padding: 0 !important; }
.cms-sidebar-collapsed .cms-sidebar-group :deep(.el-sub-menu__title > .el-icon:not(.el-sub-menu__icon-arrow)) { width: 22px; font-size: 20px; }
.cms-sidebar-collapsed .cms-sidebar-group-current :deep(.el-sub-menu__title) { background: #233c54; }
.cms-sidebar-collapsed .cms-sidebar-group-badge { position: absolute; top: 2px; right: 0; height: 16px; margin-left: 0; }
.cms-sidebar-collapsed .cms-sidebar-group-badge :deep(.el-badge__content) { height: 16px; min-width: 16px; padding: 0 4px; font-size: 10px; line-height: 16px; }
.cms-sidebar-collapsed .cms-sidebar-footer { padding: 10px 0; }
.cms-sidebar-collapsed .cms-sidebar-website.el-link { justify-content: center; width: 100%; height: 36px; margin: 0; }
.cms-sidebar-collapsed .cms-sidebar-website-label { display: none; }
.cms-sidebar-popup-heading { margin: 0 6px 4px; padding: 8px 10px 10px; border-bottom: 1px solid #2a3a4b; color: #afbdcb; font-size: 12px; font-weight: 600; line-height: 1.5; }
:global(.cms-sidebar-group-popup.el-popper) { --el-transition-md-fade: none; --el-transition-duration: 0s; border: 1px solid #3a4e62; border-radius: 6px; background: #111e2b; box-shadow: 0 8px 24px rgb(0 0 0 / 24%); }
:global(.cms-sidebar-group-popup .el-menu) { --el-menu-bg-color: #111e2b; --el-menu-text-color: #c5d1dc; --el-menu-hover-bg-color: #1b2e40; --el-menu-active-color: #fff; background: #111e2b; }
:global(.cms-sidebar-group-popup .el-menu--popup) { min-width: 210px; max-width: calc(100vw - 90px); max-height: min(70vh, 420px); overflow-y: auto; padding: 6px; box-shadow: none; }
:global(.cms-sidebar-group-popup .el-menu-item) { display: flex; align-items: center; gap: 10px; height: 42px; margin: 3px 0; padding: 0 12px; border-radius: 5px; color: #c5d1dc; font-size: 13px; line-height: 1.4; }
:global(.cms-sidebar-group-popup .el-menu-item .el-icon) { width: 20px; margin: 0; color: #9db3c6; font-size: 18px; }
:global(.cms-sidebar-group-popup .el-menu-item:hover) { background: #1b2e40; color: #fff; }
:global(.cms-sidebar-group-popup .el-menu-item.is-active) { background: #233c54; color: #fff; font-weight: 600; }
:global(.cms-sidebar-group-popup .el-menu-item.is-active .el-icon) { color: #88c2ff; }
:global(.cms-sidebar-group-popup .el-menu-item:focus-visible) { outline: 2px solid #88c2ff; outline-offset: -2px; }
.cms-sidebar-menu :deep(.el-collapse-transition-enter-active),
.cms-sidebar-menu :deep(.el-collapse-transition-leave-active) { transition: none; }
@media (forced-colors: active) {
  .cms-sidebar { border-right: 1px solid CanvasText; }
  .cms-sidebar-menu :deep(.el-menu-item.is-active) { outline: 1px solid Highlight; outline-offset: -1px; }
}
</style>
