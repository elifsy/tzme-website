import { onBeforeUnmount, onMounted, ref } from 'vue';
import { createBadgeRibbon } from '../utils/badgeRibbon.js';

const axes = ['x', 'y', 'angle', 'tilt', 'yaw'];
const zero = () => Object.fromEntries(axes.map(key => [key, 0]));
const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
const elastic = (value, limit) => Math.tanh(value / limit) * limit;
const rad = value => value * Math.PI / 180;
function project(point, pose) {
  const cy = Math.cos(rad(pose.yaw)), sy = Math.sin(rad(pose.yaw));
  const cx = Math.cos(rad(pose.tilt)), sx = Math.sin(rad(pose.tilt));
  const cz = Math.cos(rad(pose.angle)), sz = Math.sin(rad(pose.angle));
  const x = point.x * cy, z = -point.x * sy;
  const y = point.y * cx - z * sx;
  return { x: x * cz - y * sz, y: x * sz + y * cz, z: point.y * sx + z * cx };
}

// The grab point stays under the pointer while its lever arm determines rotation.
// Geometry and ribbon are updated directly, with no perpetual render loop.
export function useBadgeMotion(rig, ribbonSvg, onDrag, refresh = {}) {
  const dragging = ref(false);
  const pullState = ref('idle');
  let pointer, frame = 0, media, observer, ribbon, layout, reduced = false, suppressUntil = 0, lastTime = 0;
  let pose = zero(), velocity = zero(), flipAngle = 0, flipTarget = 0, flipTween;
  function updatePull(progress) {
    const previous = pullState.value;
    pullState.value = progress <= 0 ? 'idle' : progress >= 1 || (previous === 'armed' && progress >= .85) ? 'armed' : 'pulling';
    rig.value?.style.setProperty('--badge-pull-progress', String(Math.max(0, Math.min(1, progress))));
  }
  function measure() {
    if (!rig.value || !ribbonSvg.value) return;
    const slot = rig.value.parentElement.getBoundingClientRect();
    const clip = rig.value.querySelector('.badge-metal-clip');
    layout = {
      width: rig.value.offsetWidth, height: rig.value.offsetHeight,
      centerX: slot.left + rig.value.offsetLeft + rig.value.offsetWidth / 2,
      centerY: slot.top + rig.value.offsetTop + rig.value.offsetHeight / 2,
      originX: slot.left + slot.width / 2, originY: slot.top + slot.height / 2,
      perspective: parseFloat(getComputedStyle(rig.value.parentElement).perspective) || 700,
      attachment: -rig.value.offsetHeight / 2 + clip.offsetTop + clip.offsetHeight * .2,
      svgInverse: ribbonSvg.value.getScreenCTM()?.inverse(),
    };
  }
  function paint() {
    if (!rig.value || !layout) return;
    const style = rig.value.style;
    for (const key of axes) style.setProperty(`--badge-${key}`, `${pose[key].toFixed(3)}${key === 'x' || key === 'y' ? 'px' : 'deg'}`);
    style.setProperty('--badge-flip', `${flipAngle.toFixed(3)}deg`);
    const moving = axes.some(key => Math.abs(pose[key]) > .001);
    rig.value.classList.toggle('has-pose', moving);
    const attached = project({ x: 0, y: layout.attachment }, pose);
    const perspective = layout.perspective / (layout.perspective - attached.z);
    const screen = new DOMPoint(
      layout.originX + (layout.centerX + pose.x + attached.x - layout.originX) * perspective,
      layout.originY + (layout.centerY + pose.y + attached.y - layout.originY) * perspective,
    );
    const end = layout.svgInverse ? screen.matrixTransform(layout.svgInverse) : { x: 44, y: 26 };
    ribbon?.draw(end, pose.angle, flipAngle + pose.yaw * .65);
  }
  function releaseCapture() {
    if (!pointer) return;
    const previous = pointer; pointer = null;
    if (previous.target.hasPointerCapture?.(previous.id)) previous.target.releasePointerCapture(previous.id);
  }
  function tick(time) {
    frame = 0;
    const step = Math.min(2, Math.max(.4, (time - lastTime) / 16.67)); lastTime = time;
    if (!pointer) {
      for (const key of axes) {
        const spring = key === 'x' || key === 'y' ? .045 : .035;
        velocity[key] = (velocity[key] - pose[key] * spring * step) * Math.pow(.82, step);
        pose[key] += velocity[key] * step;
      }
      if (axes.every(key => Math.abs(pose[key]) + Math.abs(velocity[key]) < .045)) { pose = zero(); velocity = zero(); }
    }
    if (flipTween) {
      const t = Math.min(1, (time - flipTween.start) / 620);
      const ease = t * t * (3 - 2 * t);
      flipAngle = flipTween.from + (flipTarget - flipTween.from) * ease;
      if (t === 1) { flipAngle = flipTarget; flipTween = null; }
    }
    paint();
    if (flipTween || (!pointer && axes.some(key => pose[key] || velocity[key]))) schedule();
  }
  function schedule() {
    if (frame || document.hidden) return;
    if (!lastTime) lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }
  function reset() {
    cancelAnimationFrame(frame); frame = 0;
    releaseCapture(); dragging.value = false;
    updatePull(0);
    pose = zero(); velocity = zero(); flipTween = null; flipAngle = flipTarget;
    measure(); paint();
  }
  function flip(value) {
    flipTarget = value ? 180 : 0;
    measure();
    if (reduced) { flipTween = null; flipAngle = flipTarget; paint(); return; }
    flipTween = { from: flipAngle, start: performance.now() };
    lastTime = performance.now(); schedule();
  }
  function down(event) {
    if (event.button !== 0 || pointer) return;
    measure();
    const px = event.clientX - layout.centerX - pose.x, py = event.clientY - layout.centerY - pose.y;
    const a = project({ x: 1, y: 0 }, pose), b = project({ x: 0, y: 1 }, pose);
    const determinant = a.x * b.y - a.y * b.x;
    const grab = { x: (px * b.y - py * b.x) / determinant, y: (py * a.x - px * a.y) / determinant };
    const grip = { x: clamp(grab.x, layout.width / 2), y: clamp(grab.y, layout.height / 2) };
    pointer = { id: event.pointerId, target: rig.value, startX: event.clientX, startY: event.clientY, pose: { ...pose }, grip, projected: project(grip, pose), canRefresh: Boolean(refresh.canRefresh?.()), time: performance.now() };
    updatePull(0);
    rig.value.style.setProperty('--badge-grab-x', `${(grip.x / layout.width + .5) * 100}%`);
    rig.value.style.setProperty('--badge-grab-y', `${(grip.y / layout.height + .5) * 100}%`);
    velocity = zero(); rig.value.setPointerCapture(event.pointerId);
  }
  function move(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.startX, dy = event.clientY - pointer.startY;
    if (!dragging.value && Math.hypot(dx, dy) < 6) return;
    if (!dragging.value) { dragging.value = true; onDrag?.(); }
    const small = layout.width < 65, limit = small ? 14 : 28;
    const pulling = pointer.canRefresh && refresh.canRefresh?.() && dy > 0 && dy > Math.abs(dx) * 1.25;
    const pullLimit = small ? 48 : 64, threshold = small ? 60 : 80;
    const progress = pulling ? Math.min(1, dy / threshold) : 0;
    updatePull(progress);
    const gx = pointer.grip.x / layout.width, gy = pointer.grip.y / layout.height;
    const next = {
      angle: clamp(pointer.pose.angle + (gx * dy - gy * dx) * .62 + dx * .035, small ? 12 : 17),
      tilt: clamp(pointer.pose.tilt - dy * (.12 + Math.abs(gy) * .12), 9),
      yaw: clamp(pointer.pose.yaw + dx * (.13 + Math.abs(gx) * .12), 12),
    };
    if (pulling) for (const key of ['angle', 'tilt', 'yaw']) next[key] *= 1 - progress * .85;
    const projected = project(pointer.grip, next);
    next.x = clamp(pointer.pose.x + elastic(dx, limit) + pointer.projected.x - projected.x, limit);
    const vertical = pulling ? Math.min(dy * .8, pullLimit) : elastic(dy, limit * .65);
    next.y = clamp(pointer.pose.y + vertical + pointer.projected.y - projected.y, pulling ? pullLimit : limit * .75);
    const half = (Math.abs(Math.cos(rad(next.angle))) * layout.width + Math.abs(Math.sin(rad(next.angle))) * layout.height) / 2;
    next.x = Math.max(6 - layout.centerX + half, Math.min(innerWidth - 6 - layout.centerX - half, next.x));
    const halfHeight = (Math.abs(Math.sin(rad(next.angle))) * layout.width + Math.abs(Math.cos(rad(next.angle))) * layout.height) / 2;
    next.y = Math.max(6 - layout.centerY + halfHeight, Math.min(innerHeight - 6 - layout.centerY - halfHeight, next.y));
    const elapsed = Math.max(8, performance.now() - pointer.time);
    for (const key of axes) velocity[key] = clamp((next[key] - pose[key]) * 16 / elapsed, key === 'x' || key === 'y' ? 3 : 1.5);
    pose = next; pointer.time = performance.now(); paint();
  }
  function up(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const moved = dragging.value;
    const shouldRefresh = moved && pullState.value === 'armed' && pointer.canRefresh && refresh.canRefresh?.();
    releaseCapture(); dragging.value = false;
    updatePull(0);
    if (!moved) return;
    suppressUntil = performance.now() + 350;
    if (reduced) reset();
    else { lastTime = performance.now(); schedule(); }
    if (shouldRefresh) refresh.request?.();
  }
  function cancelled(event) {
    if (pointer?.id === event.pointerId) { suppressUntil = performance.now() + 350; reset(); }
  }
  function preference() { reduced = media.matches; if (reduced) reset(); }
  function visibility() { if (document.hidden) reset(); }
  onMounted(() => {
    ribbon = createBadgeRibbon(ribbonSvg.value);
    media = matchMedia('(prefers-reduced-motion: reduce)'); preference();
    observer = new ResizeObserver(() => { measure(); paint(); }); observer.observe(rig.value);
    measure(); paint();
    media.addEventListener('change', preference); document.addEventListener('visibilitychange', visibility);
  });
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame); releaseCapture(); observer?.disconnect(); ribbon?.dispose();
    media?.removeEventListener('change', preference); document.removeEventListener('visibilitychange', visibility);
  });
  return { dragging, pullState, down, move, up, cancelled, consumeClick: () => performance.now() < suppressUntil, reset, flip };
}
