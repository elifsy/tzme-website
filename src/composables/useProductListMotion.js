import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

export function useProductListMotion(page, ready) {
  const enabled = ref(false), revealed = ref(new Set());
  const nodes = new Map(), animations = new Map();
  let observer, media;
  function cancelEntry(id) {
    animations.get(id)?.cancel();
    animations.delete(id);
  }
  function stagger(element) {
    return parseFloat(getComputedStyle(element).getPropertyValue('--product-enter-delay')) || 0;
  }
  function reveal(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer?.unobserve(entry.target);
      const element = entry.target, id = element.dataset.productId;
      if (revealed.value.has(id)) continue;
      revealed.value.add(id);
      if (!enabled.value || !element.animate) continue;
      // Delayed observers must not hide content already exposed by fast scrolling.
      const arrivingBelow = element.getBoundingClientRect().top >= window.innerHeight - 40;
      const animation = element.animate([
        { opacity: arrivingBelow ? 0 : 1, transform: 'translateY(24px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 600, delay: stagger(element), easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
      animations.set(id, animation);
      animation.finished.catch(() => {}).finally(() => {
        if (animations.get(id) === animation) animations.delete(id);
      });
    }
  }
  function register(element, id) {
    const previous = nodes.get(id);
    if (element === previous) return;
    if (previous) observer?.unobserve(previous);
    cancelEntry(id);
    if (!element) { nodes.delete(id); return; }
    nodes.set(id, element);
    if (enabled.value && !revealed.value.has(id)) observer?.observe(element);
  }
  function beforeEnter(element) {
    if (!enabled.value) return;
    // TransitionGroup owns filter/pagination entrances; do not animate twice.
    revealed.value.add(element.dataset.productId);
  }
  function remove(element, done) {
    cancelEntry(element.dataset.productId);
    done();
  }
  function updatePreference() {
    enabled.value = ready.value && !media.matches;
    observer?.disconnect();
    for (const id of animations.keys()) cancelEntry(id);
    if (!enabled.value || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(reveal, { rootMargin: '0px 0px 40px 0px', threshold: 0.04 });
    for (const [id, element] of nodes) {
      if (revealed.value.has(id)) continue;
      const box = element.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) revealed.value.add(id);
      else observer.observe(element);
    }
  }
  watch(ready, () => { if (media) updatePreference(); }, { flush: 'post' });
  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)');
    updatePreference();
    media.addEventListener('change', updatePreference);
  });
  onBeforeUnmount(() => {
    observer?.disconnect();
    media?.removeEventListener('change', updatePreference);
    for (const id of animations.keys()) cancelEntry(id);
    nodes.clear();
  });
  return { enabled, revealed, register, beforeEnter, remove, cancelEntry };
}
