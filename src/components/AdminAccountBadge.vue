<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowDown, ArrowRight, Check, EditPen, Lock, Refresh, SwitchButton, User } from '@element-plus/icons-vue';
import { currentAccount, isSuperAdmin, updateOwnAvatar } from '../services/session.js';
import { adminAvatar, adminAvatars } from '../data/adminAvatars.js';
import { useBadgeMotion } from '../composables/useBadgeMotion.js';
import AdminAvatar from './AdminAvatar.vue';

const emit = defineEmits(['command']);
const props = defineProps({ refreshAction: Function, refreshing: Boolean, refreshDisabled: Boolean });
const route = useRoute();
const root = ref(null), rig = ref(null), rope = ref(null), menu = ref(null), trigger = ref(null);
const menuOpen = ref(false), pickerOpen = ref(false), saving = ref(false), error = ref('');
const draft = ref('engineer');
const compact = ref(false);
const scrolled = ref(false);
const refreshPending = ref(false), refreshAnnouncement = ref('');
const refreshBusy = computed(() => props.refreshing || refreshPending.value);
const role = computed(() => isSuperAdmin.value ? '超级管理员' : '普通管理员');
const name = computed(() => currentAccount.value?.displayName || '管理员');
const selectedAvatar = computed(() => adminAvatar(currentAccount.value?.avatarKey));
const draftAvatar = computed(() => adminAvatar(draft.value));
const ribbonId = `badge-weave-${useId()}`;
let screen;
let pressedAction = 'account';
const motion = useBadgeMotion(rig, rope, () => { menuOpen.value = false; }, {
  canRefresh: () => Boolean(props.refreshAction) && !props.refreshDisabled && !refreshBusy.value && !pickerOpen.value,
  request: requestRefresh,
});
watch(menuOpen, value => motion.flip(value), { flush: 'post' });
watch(() => motion.pullState.value, state => {
  if (state !== 'idle') refreshAnnouncement.value = state === 'armed' ? '松手刷新当前页面' : '继续下拉工牌，拉到底后松手刷新';
  else if (!refreshBusy.value) refreshAnnouncement.value = '';
});
async function requestRefresh() {
  if (refreshBusy.value || props.refreshDisabled || !props.refreshAction) return;
  refreshPending.value = true; menuOpen.value = false;
  refreshAnnouncement.value = '正在刷新当前页面';
  try {
    const refreshed = await props.refreshAction();
    refreshAnnouncement.value = refreshed === false ? '未刷新当前页面，已保留现有内容' : '刷新已结束，请查看页面结果';
  } catch (failure) {
    refreshAnnouncement.value = '刷新失败，请重试'; ElMessage.error(failure.message || refreshAnnouncement.value);
  } finally { refreshPending.value = false; }
}
function beginDrag(event, action = 'account') { if (refreshBusy.value) return; pressedAction = action; motion.down(event); }
function tapSuspension() {
  if (motion.consumeClick()) return;
  if (pressedAction === 'avatar') openPicker();
  else toggle();
}
function chooseAvatar() { if (!motion.consumeClick()) openPicker(); }
function toggle() {
  if (motion.consumeClick() || pickerOpen.value) return;
  menuOpen.value = !menuOpen.value;
}
function openPicker() {
  menuOpen.value = false; motion.reset();
  draft.value = selectedAvatar.value.key; error.value = ''; pickerOpen.value = true;
}
function command(value) {
  menuOpen.value = false;
  if (value === 'avatar') openPicker();
  else emit('command', value);
}
async function saveAvatar() {
  if (saving.value) return;
  if (draft.value === selectedAvatar.value.key) { pickerOpen.value = false; return; }
  saving.value = true; error.value = '';
  const accountId = currentAccount.value?.id;
  try {
    await updateOwnAvatar(draft.value);
    if (accountId === currentAccount.value?.id) { pickerOpen.value = false; ElMessage.success('虚拟形象已保存'); }
  } catch (failure) { error.value = failure.message; }
  finally { saving.value = false; }
}
function outside(event) {
  if (menuOpen.value && !root.value?.contains(event.target) && !menu.value?.contains(event.target)) menuOpen.value = false;
}
async function restoreFocus() {
  await nextTick();
  if (compact.value) rig.value?.querySelector('.badge-front .badge-face-action')?.focus();
  else trigger.value?.focus();
}
async function escape(event) {
  if (event.key === 'Escape' && menuOpen.value) {
    menuOpen.value = false; event.stopPropagation(); await restoreFocus();
  }
}
async function focusMenu() {
  menuOpen.value = true; await nextTick(); menu.value?.querySelector('button')?.focus();
}
function menuKeys(event) {
  const items = [...menu.value.querySelectorAll('[role=menuitem]')], index = items.indexOf(document.activeElement);
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }
}
function updateScreen() { compact.value = screen.matches; motion.reset(); }
function updateScroll() {
  const next = window.scrollY > 24;
  if (next !== scrolled.value) { scrolled.value = next; motion.reset(); }
}
watch(() => route.fullPath, () => { menuOpen.value = false; motion.reset(); });
watch(() => currentAccount.value?.id, () => { menuOpen.value = false; pickerOpen.value = false; motion.reset(); });
onMounted(() => {
  screen = matchMedia('(max-width: 1000px)'); updateScreen(); screen.addEventListener('change', updateScreen);
  updateScroll(); window.addEventListener('scroll', updateScroll, { passive: true });
  document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
});
onBeforeUnmount(() => {
  screen?.removeEventListener('change', updateScreen);
  window.removeEventListener('scroll', updateScroll);
  document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape);
});
</script>

<template>
  <section ref="root" class="admin-account-badge" :class="{ 'is-flipped': menuOpen, 'is-dragging': motion.dragging.value, 'is-scrolled': scrolled, 'is-refreshing': refreshBusy }" :aria-busy="refreshBusy" aria-label="我的账户工牌">
    <span class="badge-sr-only" role="status" aria-live="polite">{{ refreshAnnouncement }}</span>
    <el-popover :visible="menuOpen && !pickerOpen" placement="bottom-end" :offset="compact ? 28 : 12" :width="252" :show-arrow="false" popper-class="admin-badge-popover" :persistent="true" :show-after="0" :hide-after="0">
      <template #reference>
        <button ref="trigger" type="button" class="badge-account-trigger" aria-haspopup="menu" :aria-expanded="menuOpen" :tabindex="compact ? -1 : 0" :aria-hidden="compact || undefined" title="下拉工牌到底后松手刷新；聚焦后也可按 R 刷新" aria-keyshortcuts="R" @click="toggle" @keydown.down.prevent="focusMenu" @keydown.r.exact.prevent="requestRefresh">
          <span>我的账户</span><el-icon><ArrowDown /></el-icon>
        </button>
      </template>
      <div ref="menu" class="badge-account-menu" @keydown="menuKeys">
        <div class="badge-menu-identity"><AdminAvatar :avatar-key="selectedAvatar.key" /><span><strong :title="name">{{ name }}</strong><span>{{ role }}</span><small :title="currentAccount?.username">{{ currentAccount?.username }}</small></span></div>
        <div role="menu" aria-label="账户操作">
          <button type="button" role="menuitem" data-account-command="avatar" @click="command('avatar')"><el-icon><EditPen /></el-icon><span>更换虚拟形象</span><el-icon><ArrowRight /></el-icon></button>
          <button type="button" role="menuitem" data-account-command="password" @click="command('password')"><el-icon><Lock /></el-icon><span>修改我的密码</span><el-icon><ArrowRight /></el-icon></button>
          <button v-if="isSuperAdmin" type="button" role="menuitem" data-account-command="accounts" @click="command('accounts')"><el-icon><User /></el-icon><span>账号管理</span><el-icon><ArrowRight /></el-icon></button>
          <button type="button" role="menuitem" class="badge-menu-logout" data-account-command="logout" @click="command('logout')"><el-icon><SwitchButton /></el-icon><span>退出登录</span><el-icon><ArrowRight /></el-icon></button>
        </div>
      </div>
    </el-popover>

    <div class="badge-slot">
      <svg ref="rope" class="badge-strap" viewBox="0 0 88 60" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
        <defs><pattern :id="ribbonId" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(18)"><path d="M0 .3H2" stroke="#d5f1ef" stroke-opacity=".3" stroke-width=".38" /><path d="M.4 0V2" stroke="#042c39" stroke-opacity=".34" stroke-width=".48" /></pattern></defs>
        <path data-ribbon-shadow fill="none" stroke="#183f50" stroke-opacity=".12" stroke-width="14" transform="translate(.5 .6)" />
        <g data-ribbon-faces />
        <path data-ribbon-texture :fill="`url(#${ribbonId})`" />
        <path data-ribbon-edge fill="none" stroke="#91c4c7" stroke-opacity=".7" stroke-width=".65" />
        <path data-ribbon-edge fill="none" stroke="#093f4c" stroke-opacity=".9" stroke-width=".65" />
        <path v-for="side in 2" :key="side" data-ribbon-seam fill="none" stroke="#b2d2d1" stroke-opacity=".6" stroke-width=".4" stroke-dasharray="1.2 1.2" />
        <g data-ribbon-label><text text-anchor="middle" dominant-baseline="central" fill="#f4fbfa" font-family="Arial,sans-serif" font-size="5.5" font-weight="700" textLength="10" lengthAdjust="spacingAndGlyphs">TZME</text></g>
      </svg>
      <div ref="rig" class="badge-suspension" @pointermove="motion.move" @pointerup="motion.up" @pointercancel="motion.cancelled" @lostpointercapture="motion.cancelled" @click.self="tapSuspension" @dragstart.prevent>
        <span class="badge-metal-clip" aria-hidden="true" />
        <div class="badge-card-turn">
          <div class="badge-face badge-front" :inert="menuOpen || undefined">
            <button type="button" class="badge-face-action" :aria-label="`${name}的账户，点击翻面；下拉到底后松手刷新`" title="下拉到底后松手刷新；点击查看账户；聚焦后按 R 也可刷新" aria-keyshortcuts="R" aria-haspopup="menu" :aria-expanded="menuOpen" :tabindex="menuOpen ? -1 : 0"
              @pointerdown="beginDrag" @click.stop="toggle" @keydown.down.prevent="focusMenu" @keydown.r.exact.prevent="requestRefresh">
              <span class="badge-slot-hole" aria-hidden="true" /><img class="badge-brand" src="/assets/tzme-j/brand/official-mark-small.webp" alt="重钢机械" width="28" height="26" />
              <span class="badge-portrait-space" aria-hidden="true" />
              <strong class="badge-person-name" :title="name">{{ name }}</strong><span class="badge-person-account">{{ currentAccount?.username }}</span><span class="badge-person-role">{{ role }}</span><span class="badge-bottom">TZME · 管理后台</span>
            </button>
            <button type="button" class="badge-avatar-edit" :aria-label="`更换虚拟形象，当前${selectedAvatar.label}`" :tabindex="menuOpen ? -1 : 0" @pointerdown="beginDrag($event, 'avatar')" @click.stop="chooseAvatar"><AdminAvatar :avatar-key="selectedAvatar.key" /><span class="badge-avatar-pencil"><el-icon><EditPen /></el-icon></span></button>
          </div>
          <div class="badge-face badge-back" :inert="!menuOpen || undefined">
            <button type="button" class="badge-face-action" aria-label="收起账户菜单并翻回正面；下拉到底后松手刷新" aria-keyshortcuts="R" :tabindex="menuOpen ? 0 : -1"
              @pointerdown="beginDrag" @click.stop="toggle" @keydown.r.exact.prevent="requestRefresh">
              <span class="badge-slot-hole" aria-hidden="true" /><img class="badge-brand" src="/assets/tzme-j/brand/official-mark-small.webp" alt="重钢机械" width="28" height="26" />
              <strong class="badge-back-title">账户信息</strong><span class="badge-back-row"><span>账号</span><b>{{ currentAccount?.username }}</b></span><span class="badge-back-row"><span>角色</span><b>{{ role }}</b></span><span class="badge-back-row"><span>状态</span><b class="badge-status">已启用</b></span><span class="badge-bottom">点击翻回正面</span>
            </button>
          </div>
        </div>
        <div v-if="motion.pullState.value !== 'idle' || refreshBusy" class="badge-pull-cue" :class="{ 'is-armed': motion.pullState.value === 'armed' }" aria-hidden="true">
          <el-icon class="badge-pull-icon" :class="{ 'is-spinning': refreshBusy }"><Refresh /></el-icon><span>{{ refreshBusy ? '正在刷新…' : motion.pullState.value === 'armed' ? '松手刷新' : '继续下拉刷新' }}</span><i v-if="!refreshBusy" class="badge-pull-meter" />
        </div>
      </div>
    </div>

    <el-dialog v-model="pickerOpen" title="选择虚拟形象" width="min(536px, calc(100vw - 24px))" class="cms-compact-dialog admin-avatar-dialog" append-to-body destroy-on-close :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving" @closed="restoreFocus">
      <p class="avatar-picker-description">选择喜欢的形象，用于您的账户工牌。</p>
      <fieldset class="avatar-picker-grid" :disabled="saving"><legend class="badge-sr-only">虚拟形象预设</legend>
        <label v-for="avatar in adminAvatars" :key="avatar.key" class="avatar-picker-option" :class="{ 'is-selected': draft === avatar.key }" :data-avatar-option="avatar.key">
          <input v-model="draft" type="radio" name="account-avatar" :value="avatar.key" :aria-label="avatar.label" /><AdminAvatar :avatar-key="avatar.key" /><span>{{ avatar.label }}</span><el-icon v-if="draft === avatar.key" class="avatar-picker-check"><Check /></el-icon>
        </label>
      </fieldset>
      <p v-if="error" role="alert" class="admin-auth-error avatar-picker-error">{{ error }}</p>
      <div class="avatar-picker-bottom"><div class="avatar-picker-current"><AdminAvatar :avatar-key="draft" /><span>当前选择：<strong>{{ draftAvatar.label }}</strong></span></div><div class="avatar-picker-actions"><el-button :disabled="saving" @click="pickerOpen = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveAvatar">使用此形象</el-button></div></div>
      <p class="avatar-picker-note">形象将保存到您的账号，重新登录后继续使用。</p>
    </el-dialog>
  </section>
</template>

<style scoped>
.admin-account-badge { position:relative; display:flex; align-items:center; gap:12px; flex-shrink:0; height:62px; width:178px; color:#315a6c; }
.badge-account-trigger { display:flex; align-items:center; justify-content:center; gap:8px; width:78px; height:32px; padding:0; border:0; background:transparent; color:#286677; font:inherit; font-size:12px; font-weight:500; cursor:pointer; white-space:nowrap; border-radius:5px; }
.badge-account-trigger:focus-visible,.badge-face-action:focus-visible,.badge-avatar-edit:focus-visible { outline:2px solid #147d90; outline-offset:3px; }
.badge-account-trigger .el-icon { font-size:10px; transition:transform .25s; }
.is-flipped .badge-account-trigger .el-icon { transform:rotate(180deg); }
.badge-slot { position:relative; align-self:flex-start; width:88px; height:62px; perspective:700px; }
.badge-strap { position:absolute; width:88px; height:60px; inset:0 auto auto 0; overflow:visible; pointer-events:none; }
.badge-suspension { position:absolute; top:34px; left:0; width:88px; height:128px; transform:none; transform-origin:50% 50%; transform-style:preserve-3d; }
.badge-suspension.has-pose { transform:translate3d(var(--badge-x,0px),var(--badge-y,0px),0) rotateZ(var(--badge-angle,0deg)) rotateX(var(--badge-tilt,0deg)) rotateY(var(--badge-yaw,0deg)); }
.badge-metal-clip { position:absolute; z-index:2; width:8px; height:19px; border:1px solid #899da4; border-radius:4px; top:-12px; left:calc(50% - 4px); background:linear-gradient(100deg,#a7bbc4,#fff 25%,#9eafb8 50%,#f4f8fa 78%,#6f8791); box-shadow:1px 2px 2px #17374420,inset 1px 0 1px #fff; pointer-events:none; transform:rotateY(var(--badge-flip,0deg)); }
.badge-card-turn { width:100%; height:100%; position:relative; transform-style:preserve-3d; transform:rotateY(var(--badge-flip,0deg)); }
.badge-face { position:absolute; inset:0; border:1px solid #b9cdd5; border-radius:8px; backface-visibility:hidden; -webkit-backface-visibility:hidden; background:linear-gradient(120deg,#ffffffdc,#d8e6eb80 48%,#faffffff); box-shadow:2px 7px 12px #173c501f,inset 0 0 0 2px #ffffffb3; padding:4px; }
.badge-back { transform:rotateY(180deg); }
.badge-front { transform:none; }
.badge-face-action { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; gap:2px; width:100%; height:100%; padding:5px 3px 4px; border:0; border-radius:4px; background:linear-gradient(140deg,#fff,#f7fafb); color:#153e51; font-family:'Microsoft YaHei UI','Microsoft YaHei','PingFang SC',sans-serif; cursor:grab; touch-action:none; user-select:none; overflow:hidden; }
.is-dragging .badge-face-action { cursor:grabbing; }
.badge-face-action::after { content:'Z'; position:absolute; z-index:0; right:3px; bottom:3px; font:italic 45px/1 Arial,sans-serif; color:#147d9012; pointer-events:none; }
.badge-slot-hole { position:absolute; top:-2px; left:calc(50% - 9px); height:3px; width:18px; border:1px solid #a6bdc5; border-radius:3px; background:#d8e6ea; }
.badge-brand { position:relative; width:22px; height:20px; object-fit:contain; flex:none; }
.badge-portrait-space { height:34px; flex-shrink:0; }
.badge-person-name { position:relative; z-index:1; max-width:100%; flex-shrink:0; font-size:12px; font-weight:700; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.badge-person-account { max-width:100%; flex-shrink:0; font-size:8px; font-weight:500; line-height:1.25; color:#426274; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.badge-person-role { position:relative; flex-shrink:0; font-size:8px; font-weight:600; line-height:1.45; padding:1px 4px; color:#096273; border-radius:8px; background:#e3f2f2; }
.badge-bottom { display:none; }
.badge-avatar-edit { position:absolute; left:calc(50% - 17px); top:31px; width:34px; height:34px; border:0; padding:0; border-radius:9px; background:#edf6f7; cursor:pointer; touch-action:none; }
.badge-avatar-pencil { position:absolute; bottom:-2px; right:-3px; display:grid; place-items:center; width:12px; height:12px; border-radius:50%; color:#147d90; background:white; border:1px solid #b8d9df; }
.badge-avatar-pencil .el-icon { font-size:7px; }
.badge-back-title { margin:3px 0; color:#096273; font-size:10px; }
.badge-back-row { display:flex; align-items:center; justify-content:space-between; flex-shrink:0; gap:3px; width:100%; padding:4px 0; border-top:1px solid #d7e4e9; font-size:7.5px; line-height:1.3; }
.badge-back-row > span { flex-shrink:0; color:#486c7d; }
.badge-back-row b { font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.badge-status::before { content:''; display:inline-block; width:3px; height:3px; margin-right:4px; border-radius:50%; background:#4da784; vertical-align:middle; }
.badge-account-menu { font:12px/1.5 Inter,'Segoe UI','Microsoft YaHei',sans-serif; color:#27495b; }
.badge-menu-identity { display:flex; align-items:center; gap:12px; padding:8px 8px 15px; margin-bottom:6px; border-bottom:1px solid #e5edf0; }
.badge-menu-identity > .admin-virtual-avatar { width:44px; flex:none; border-radius:12px; }
.badge-menu-identity > span { min-width:0; display:flex; align-items:center; flex-wrap:wrap; gap:4px 8px; }
.badge-menu-identity strong { font-size:14px; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.badge-menu-identity > span > span { font-size:9px; padding:2px 5px; background:#eef6f7; border-radius:4px; color:#147d90; }
.badge-menu-identity small { width:100%; color:#7a919f; font-size:11px; overflow:hidden; text-overflow:ellipsis; }
.badge-account-menu button { width:100%; display:flex; align-items:center; gap:12px; min-height:42px; border:0; border-radius:5px; padding:9px; color:#345669; background:transparent; font:inherit; text-align:left; cursor:pointer; }
.badge-account-menu button > span:not(.el-icon) { flex:1; }
.badge-account-menu button .el-icon:first-child { color:#348699; font-size:16px; }
.badge-account-menu button .el-icon:last-child { font-size:10px; color:#8aa2ad; }
.badge-account-menu button:hover,.badge-account-menu button:focus-visible { color:#147d90; background:#eef6f7; outline:none; }
.badge-account-menu .badge-menu-logout { border-top:1px solid #e5edf0; border-radius:0 0 5px 5px; margin-top:6px; padding-top:12px; }
.avatar-picker-description { margin:0 0 20px; color:#6c8796; font-size:13px; }
.avatar-picker-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin:0; padding:0; border:0; min-width:0; }
.avatar-picker-option { position:relative; padding:5px 5px 10px; border:1px solid #dce7eb; border-radius:10px; background:#f7fafb; cursor:pointer; min-width:0; transition:background .2s,border-color .2s; }
.avatar-picker-option > .admin-virtual-avatar { border-radius:6px; }
.avatar-picker-option > span:not(.admin-virtual-avatar) { display:block; text-align:center; font-size:12px; color:#416375; margin-top:7px; }
.avatar-picker-option input { position:absolute; inset:0; width:100%; height:100%; margin:0; opacity:0; cursor:pointer; }
.avatar-picker-option:focus-within { outline:2px solid #147d90; outline-offset:3px; }
.avatar-picker-option.is-selected { background:#eaf5f5; border-color:#147d90; box-shadow:inset 0 0 0 1px #147d90; }
.avatar-picker-option .avatar-picker-check { position:absolute; right:8px; top:8px; display:grid; place-items:center; width:19px; height:19px; border-radius:50%; background:#147d90; color:#fff; pointer-events:none; }
.avatar-picker-bottom { display:flex; align-items:center; justify-content:space-between; gap:15px; margin-top:22px; }
.avatar-picker-current { display:flex; align-items:center; gap:9px; font-size:11px; color:#688595; }
.avatar-picker-current > .admin-virtual-avatar { width:36px; flex:none; border-radius:9px; }
.avatar-picker-current strong { color:#147d90; }
.avatar-picker-actions { display:flex; gap:8px; }
.avatar-picker-actions .el-button { margin:0; }
.avatar-picker-note { padding-top:16px; margin:16px 0 0; border-top:1px solid #e5edf0; color:#8197a2; font-size:11px; line-height:1.8; }
.avatar-picker-error { margin-top:16px; }
.badge-sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
.badge-pull-cue { position:absolute; top:calc(100% + 8px); right:0; display:flex; align-items:center; justify-content:center; gap:7px; width:112px; padding:9px 8px; border:1px solid #d5e6eb; border-radius:7px; background:#fff; box-shadow:0 5px 15px #173c5017; color:#527788; font:11px/1.5 'Microsoft YaHei',sans-serif; white-space:nowrap; pointer-events:none; overflow:hidden; }
.badge-pull-cue.is-armed { color:#0d7182; border-color:#86b7bf; background:#f1f9f9; }
.badge-pull-icon { flex:none; font-size:13px; }
.badge-pull-meter { position:absolute; height:2px; background:#147d90; left:0; right:0; bottom:0; transform:scaleX(var(--badge-pull-progress,0)); transform-origin:left; }
.is-refreshing .badge-avatar-edit,.is-refreshing .badge-face-action { cursor:wait; }
.is-spinning { animation:badge-refresh-spin .8s linear infinite; }
@keyframes badge-refresh-spin { to { transform:rotate(360deg); } }
@media (prefers-reduced-motion:reduce) { .is-spinning { animation:none; } }
:global(.admin-badge-popover.el-popper) { padding:10px; border:1px solid #dbe7ec; border-radius:10px; box-shadow:0 12px 35px #143c501f; max-width:calc(100vw - 24px); }
:global(.admin-avatar-dialog) { --el-color-primary:#147d90; }
@media (max-width:1000px) {
  .admin-account-badge { width:60px; }
  .badge-account-trigger { position:absolute; inset:16px 0 auto; width:60px; opacity:0; pointer-events:none; }
  .badge-slot { width:60px; }
  .badge-strap { width:60px; height:40px; }
  .badge-suspension { width:60px; height:86px; top:20px; }
  .badge-metal-clip { height:13px; top:-8px; width:6px; left:calc(50% - 3px); }
  .badge-face { border-radius:6px; padding:3px; }
  .badge-face-action { gap:2px; padding:3px 1px; }
  .badge-brand { width:16px; height:14px; }
  .badge-portrait-space { height:27px; }
  .badge-avatar-edit { width:27px; height:27px; top:22px; left:calc(50% - 13.5px); border-radius:7px; }
  .badge-person-name { font-size:9px; }
  .badge-person-role { font-size:6px; padding:1px 3px; }
  .badge-person-account,.badge-bottom { display:none; }
  .badge-back-title { font-size:7px; margin:2px 0; }
  .badge-back-row { font-size:5px; gap:2px; padding:3px 0; }
}
@media (max-width:680px) {
  .admin-account-badge { width:44px; height:54px; }
  .badge-account-trigger { width:44px; top:10px; }
  .badge-slot { width:44px; height:54px; }
  .badge-strap { width:44px; height:25px; }
  .badge-suspension { width:44px; height:60px; top:11px; }
  .badge-face { padding:2px; }
  .badge-face-action { padding:2px 0; gap:1px; }
  .badge-brand { width:12px; height:10px; }
  .badge-portrait-space { height:23px; }
  .badge-avatar-edit { width:23px; height:23px; top:15px; left:calc(50% - 11.5px); border-radius:5px; }
  .badge-avatar-pencil { width:10px; height:10px; }
  .badge-person-name { font-size:7px; }
  .badge-person-role { display:none; }
  .badge-back-title { font-size:5px; }
  .badge-back-row { font-size:3.4px; padding:2px 0; }
  .badge-back-row:nth-last-child(2) { display:none; }
  .avatar-picker-grid { gap:9px; }
  .avatar-picker-bottom { flex-wrap:wrap; gap:14px; }
  .avatar-picker-actions { margin-left:auto; }
}
@media (prefers-reduced-motion:reduce) { .badge-card-turn,.badge-account-trigger .el-icon,.avatar-picker-option { transition:none; } }
.is-scrolled .badge-suspension { width:52px; height:50px; left:18px; top:6px; }
.is-scrolled .badge-strap { opacity:0; }
.is-scrolled .badge-metal-clip { height:8px; top:-5px; width:5px; }
.is-scrolled .badge-face { padding:2px; border-radius:5px; }
.is-scrolled .badge-face-action { padding:2px 0; gap:1px; }
.is-scrolled .badge-brand { width:11px; height:9px; }
.is-scrolled .badge-portrait-space { height:20px; }
.is-scrolled .badge-avatar-edit { width:20px; height:20px; top:14px; left:calc(50% - 10px); border-radius:5px; }
.is-scrolled .badge-person-name { font-size:7px; }
.is-scrolled .badge-person-role,.is-scrolled .badge-person-account,.is-scrolled .badge-bottom { display:none; }
.is-scrolled .badge-back-title { font-size:5px; margin:1px 0; }
.is-scrolled .badge-back-row { font-size:3.5px; padding:1px 0; }
@media (min-width:681px) and (max-width:1000px) { .is-scrolled .badge-suspension { left:4px; } }
@media (max-width:680px) { .is-scrolled .badge-suspension { width:44px; height:46px; left:0; top:4px; } }
</style>
