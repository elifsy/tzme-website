<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { Message, Phone, TopRight } from '@element-plus/icons-vue';
import { contactDepartments, contactTelephone, departmentChannels, departmentMailto } from '../data/contactDepartments.js';
const props = defineProps({ contact: { type: Object, required: true } });
const rows = computed(() => contactDepartments(props.contact).filter(item => item.enabled).map(item => ({ ...item, channels: departmentChannels(item, props.contact) })));
const selected = ref(''), expanded = ref(false), root = ref(null), card = ref(null);
const left = ref(0), above = ref(false), cardHeight = ref(420), panelId = `contact-card-${useId()}`;
const active = computed(() => rows.value.find(item => item.id === selected.value));
let closeTimer, observer, ownerDocument, ownerWindow, pointerType = 'mouse';
let restoringFocus = false;
watch(rows, value => { if (!value.some(item => item.id === selected.value)) close(); else if (expanded.value) nextTick(position); });
function position() {
  if (!root.value || !card.value || !expanded.value) return;
  const bounds = root.value.getBoundingClientRect();
  const button = root.value.querySelector(`[data-contact-department="${selected.value}"]`);
  const buttonLeft = button ? button.getBoundingClientRect().left - bounds.left : 0;
  left.value = Math.max(0, Math.min(buttonLeft, bounds.width - card.value.offsetWidth));
  const below = ownerWindow.innerHeight - bounds.bottom - 20, top = bounds.top - 20;
  const needed = Math.min(420, card.value.scrollHeight);
  above.value = below < needed && top > below;
  cardHeight.value = Math.max(80, Math.min(420, above.value ? top : below));
}
function show(id) { clearTimeout(closeTimer); selected.value = id; expanded.value = true; nextTick(position); }
function close() { clearTimeout(closeTimer); expanded.value = false; }
function preview(id, event) { if (event.pointerType !== 'touch') show(id); }
function activate(id) { if (pointerType === 'touch' && expanded.value && selected.value === id) close(); else show(id); }
function focus(id, event) { if (!restoringFocus && event.currentTarget.matches(':focus-visible')) show(id); }
function stay() { clearTimeout(closeTimer); }
function escape() {
  const inside = card.value?.contains(ownerDocument.activeElement);
  close();
  if (inside) { restoringFocus = true; root.value.querySelector(`[data-contact-department="${selected.value}"]`)?.focus(); restoringFocus = false; }
}
function leave() {
  const focused = ownerDocument?.activeElement;
  if (root.value?.contains(focused) && focused?.matches(':focus-visible')) return;
  closeTimer = setTimeout(close, 140);
}
function focusOut(event) { if (!root.value?.contains(event.relatedTarget)) close(); }
function outside(event) { if (!root.value?.contains(event.target)) close(); }
function onScroll(event) {
  if (event.target instanceof ownerWindow.Node && card.value?.contains(event.target)) return;
  const focused = ownerDocument.activeElement;
  if (root.value?.contains(focused) && focused.matches(':focus-visible')) position(); else close();
}
async function keys(event, index) {
  if (event.key === 'Escape') { event.preventDefault(); close(); return; }
  if (event.key === 'ArrowDown') { event.preventDefault(); show(rows.value[index].id); await nextTick(); card.value?.querySelector('a')?.focus(); return; }
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const target = event.key === 'Home' ? 0 : event.key === 'End' ? rows.value.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + rows.value.length) % rows.value.length;
  pointerType = ''; root.value.querySelectorAll('[data-contact-department]')[target]?.focus(); show(rows.value[target].id);
}
function detach() {
  observer?.disconnect();
  ownerDocument?.removeEventListener('pointerdown', outside);
  ownerWindow?.removeEventListener('scroll', onScroll, true);
  ownerWindow?.removeEventListener('resize', position);
}
watch(root, element => {
  detach();
  if (!element) return;
  ownerDocument = element.ownerDocument; ownerWindow = ownerDocument.defaultView;
  ownerDocument.addEventListener('pointerdown', outside); ownerWindow.addEventListener('scroll', onScroll, true);
  ownerWindow.addEventListener('resize', position);
  observer = new ResizeObserver(() => { if (expanded.value) position(); }); observer.observe(element);
}, { flush: 'post' });
onBeforeUnmount(() => { clearTimeout(closeTimer); detach(); });
</script>

<template>
  <section v-if="rows.length" ref="root" class="department-contact" :class="{ 'has-open-card': expanded, 'opens-above': expanded && above }" aria-label="按事项联系" @pointerleave="leave" @pointerenter="stay" @focusout="focusOut" @keydown.esc.stop.prevent="escape">
    <div class="department-contact-categories" role="group" aria-label="选择联系事项">
      <button v-for="(item, index) in rows" :key="item.id" type="button" :data-contact-department="item.id" :title="item.title" :aria-expanded="expanded && selected === item.id" :aria-controls="panelId" @pointerenter="preview(item.id, $event)" @pointerdown="pointerType = $event.pointerType" @focus="focus(item.id, $event)" @click="activate(item.id)" @keydown="keys($event, index)">{{ item.title || '待填写分类' }}</button>
    </div>
    <Transition name="department-card">
      <article v-if="active" v-show="expanded" :id="panelId" ref="card" class="department-business-card" :class="{ 'opens-above': above }" :style="{ left: `${left}px`, maxHeight: `${cardHeight}px` }" role="region" :aria-label="`${active.title}联系名片`" :data-department-panel="active.id" @pointerenter="stay">
        <header class="department-business-header"><div class="department-business-heading"><p class="department-business-brand">TZME / CONTACT</p><h3>{{ active.title }}</h3></div><span class="department-contact-kind">{{ active.channels.generalEmail && active.channels.generalPhone ? '通用联系方式' : '部门联系方式' }}</span></header>
        <p v-if="active.description" class="department-contact-description">{{ active.description }}</p>
        <div class="department-contact-channels">
          <a v-for="email in active.channels.emails" :key="email" class="department-contact-email" :href="departmentMailto(email, active.title)" :aria-label="`通过邮件沟通${active.title}事项：${email}`"><span class="department-channel-icon"><el-icon><Message /></el-icon></span><span class="department-channel-value"><small>电子邮箱</small><span>{{ email }}</span></span><el-icon class="department-channel-arrow"><TopRight /></el-icon></a>
          <a v-if="active.channels.phone && contactTelephone(active.channels.phone)" class="department-contact-phone" :href="contactTelephone(active.channels.phone)"><span class="department-channel-icon"><el-icon><Phone /></el-icon></span><span class="department-channel-value"><small>{{ active.channels.generalPhone && !active.channels.generalEmail ? '通用电话' : '联系电话' }}</small><span>{{ active.channels.phone }}</span></span></a>
          <p v-else-if="active.channels.phone" class="department-contact-phone">{{ active.channels.phone }}</p>
        </div>
      </article>
    </Transition>
  </section>
</template>

<style scoped>
.department-contact { position:relative; margin-top:26px; color:#153f52; }
.department-contact.has-open-card { z-index:8; }
.department-contact.has-open-card::after { content:''; position:absolute; top:100%; left:0; right:0; height:14px; z-index:-1; }
.department-contact.opens-above::after { top:auto; bottom:100%; }
.department-contact-categories { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,62px),1fr)); gap:6px; }
.department-contact-categories button { min-width:0; min-height:49px; padding:11px 4px; overflow:hidden; text-overflow:ellipsis; border:1px solid #dbe8ec; border-radius:10px; color:#416e80; background:linear-gradient(150deg,#fff,#f3f8f9); font:500 13px/1.5 'Microsoft YaHei',sans-serif; cursor:pointer; white-space:nowrap; transition:color .2s,border-color .2s,box-shadow .2s; }
.department-contact-categories button:hover,.department-contact-categories button[aria-expanded=true] { color:#087f91; border-color:#8ab7c1; box-shadow:0 3px 10px #174a5c0b; }
.department-contact-categories button:focus-visible,.department-business-card a:focus-visible { outline:2px solid #087f91; outline-offset:3px; }
.department-contact-categories button:focus-visible { outline-offset:-3px; }
.department-business-card { position:absolute; top:calc(100% + 12px); width:340px; max-width:100%; padding:22px 23px 20px; box-sizing:border-box; border:1px solid #fff; border-radius:18px; background:linear-gradient(150deg,#fff 4%,#eff8fa 43%,#d5edf0 100%); box-shadow:0 16px 36px #173f521f,inset 0 0 0 1px #ffffff80; overflow:auto; overscroll-behavior:contain; transform-origin:50% 0; scrollbar-width:thin; }
.department-business-card.opens-above { top:auto; bottom:calc(100% + 12px); transform-origin:50% 100%; }
.department-business-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.department-business-heading { min-width:0; }
.department-contact-kind { flex:none; margin-top:2px; color:#688b99; background:#ffffff9c; padding:5px 9px; border:1px solid #ffffffce; border-radius:20px; font-size:10px; white-space:nowrap; }
.department-business-brand { margin:0 0 7px; color:#7d9ba8; font-size:9px; line-height:1.5; letter-spacing:1.5px; }
.department-business-card h3 { margin:0; color:#123d52; font-size:23px; line-height:1.5; font-weight:600; overflow-wrap:anywhere; }
.department-contact-description { margin:10px 0 0; color:#607f8e; font-size:13px; line-height:1.85; }
.department-contact-channels { display:flex; align-items:stretch; flex-direction:column; gap:9px; margin-top:19px; }
.department-contact-email,.department-contact-phone { display:flex; align-items:center; gap:11px; min-width:0; margin:0; padding:11px 12px; border:1px solid #ffffffbd; border-radius:13px; color:#126a7d; background:#ffffffa1; font-size:13px; line-height:1.7; text-decoration:none; transition:background .2s; }
.department-contact-phone { color:#4e7182; font-size:12px; }
.department-channel-icon { flex:none; display:grid; place-items:center; width:28px; height:28px; border-radius:50%; background:#fff; box-shadow:0 2px 6px #477d8b0d; color:#147d90; font-size:15px; }
.department-channel-value { min-width:0; overflow-wrap:anywhere; }
.department-channel-value small { display:block; margin-bottom:2px; font-size:10px; line-height:1.5; color:#77939e; }
.department-channel-arrow { margin-left:auto; flex:none; font-size:12px; color:#65949f; }
.department-contact-email:hover,.department-contact-phone:hover { background:#fff; }
.department-card-enter-active,.department-card-leave-active { transition:opacity .18s ease,transform .24s cubic-bezier(.2,.7,.2,1); }
.department-card-enter-from,.department-card-leave-to { opacity:0; transform:translateY(-6px) scale(.97); }
@media (max-width:600px) {
 .department-contact { margin-top:22px; }
 .department-contact-categories { grid-template-columns:repeat(auto-fit,minmax(min(100%,52px),1fr)); gap:3px; }
 .department-contact-categories button { min-height:43px; padding:8px 1px; font-size:11px; border-radius:7px; }
 .department-business-card { padding:22px 20px; border-radius:18px; }
 .department-business-card h3 { font-size:21px; }
}
@media (prefers-reduced-motion:reduce) { .department-contact-categories button,.department-contact-email,.department-contact-phone,.department-card-enter-active,.department-card-leave-active { transition:none; } }
</style>
