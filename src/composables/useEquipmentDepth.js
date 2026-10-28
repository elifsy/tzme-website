import { onBeforeUnmount, onMounted, watch } from "vue";

// Only the image and its shadows move. Copy and controls keep stable hit targets.
export function useEquipmentDepth(target, enabled) {
  let view,
    element,
    motionQuery,
    frame = 0,
    point;
  function clear() {
    view?.cancelAnimationFrame(frame);
    frame = 0;
    point = undefined;
    for (const property of [
      "--depth-x",
      "--depth-y",
      "--shadow-x",
      "--ground-x",
    ])
      element?.style.removeProperty(property);
  }
  function paint() {
    frame = 0;
    if (!point || !element || !enabled.value || !motionQuery.matches)
      return clear();
    const bounds = element.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return clear();
    const x = Math.max(
      -6,
      Math.min(6, ((point.x - bounds.left) / bounds.width - 0.5) * 12),
    );
    const y = Math.max(
      -3.5,
      Math.min(3.5, ((point.y - bounds.top) / bounds.height - 0.5) * 7),
    );
    element.style.setProperty("--depth-x", `${x}px`);
    element.style.setProperty("--depth-y", `${y}px`);
    element.style.setProperty("--shadow-x", `${x * 0.35}px`);
    element.style.setProperty("--ground-x", `${-x * 0.6}px`);
  }
  function move(event) {
    if (!enabled.value || !motionQuery.matches || event.pointerType === "touch")
      return;
    point = { x: event.clientX, y: event.clientY };
    if (!frame) frame = view.requestAnimationFrame(paint);
  }
  onMounted(() => {
    element = target.value;
    if (!element) return;
    view = element.ownerDocument.defaultView;
    motionQuery = view.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 701px) and (prefers-reduced-motion: no-preference)",
    );
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", clear);
    motionQuery.addEventListener("change", clear);
    view.addEventListener("blur", clear);
  });
  watch(enabled, clear);
  onBeforeUnmount(() => {
    clear();
    element?.removeEventListener("pointermove", move);
    element?.removeEventListener("pointerleave", clear);
    motionQuery?.removeEventListener("change", clear);
    view?.removeEventListener("blur", clear);
  });
  return clear;
}
