const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const overlap = (a, b) => a.left < b.right + 1 && a.right > b.left - 1 && a.top < b.bottom + 1 && a.bottom > b.top - 1;
const keyOf = (point, index) => `${point.industryId}:${point.productId || index}`;

// Placement and interpolation share one position for the button and its leader.
// A label keeps its offset until avoiding a real collision requires a new one.
export function createSceneLabels() {
  const previous = new Map();
  let lastTime;
  return {
    clear() { previous.clear(); lastTime = undefined; },
    update(points, anchors, viewport, { compact = false, reducedMotion = false, name = point => point.label || '' } = {}, now = 0) {
      const delta = lastTime === undefined ? 16 : clamp(now - lastTime, 0, 200);
      lastTime = now;
      const alpha = reducedMotion ? 1 : 1 - Math.exp(-delta / 42);
      const occupied = [], ids = new Set();
      let moving = false;
      const labels = points.map((point, index) => {
        const id = keyOf(point, index), target = anchors[point.industryId];
        ids.add(id);
        const visible = Boolean(target?.visible && Number.isFinite(target.x) && Number.isFinite(target.y));
        let stored = previous.get(id);
        const width = Math.min(90, (name(point).length * (compact ? 8 : 10) + (compact ? 25 : 35)) / Math.max(1, viewport.width) * 100);
        const height = Math.min(30, (compact ? 23 : 29) / Math.max(1, viewport.height) * 100);
        const offsets = [[0, -2.2], [-width * .55, -2.2], [width * .55, -2.2], [0, -height - 3], [-width * .8, 1], [width * .8, 1], [0, height + 2]];
        const originX = visible ? target.x : stored?.anchorX ?? point.x ?? 50;
        const originY = visible ? target.y : stored?.anchorY ?? point.y ?? 50;
        const candidates = offsets.map(([dx, dy], slot) => {
          const x = clamp(originX + dx, width / 2 + 1, 99 - width / 2);
          const y = clamp(originY + dy, height + 6, 84);
          const rect = { left: x - width / 2, right: x + width / 2, top: y - height, bottom: y };
          const collisions = occupied.filter(other => overlap(rect, other)).length;
          return { x, y, slot, rect, collisions, score: collisions * 1000 + Math.hypot(x - originX, y - originY) + (y > originY ? 2 : 0) };
        });
        const best = candidates.reduce((a, b) => a.score <= b.score ? a : b);
        let chosen = stored ? candidates[stored.slot] || best : best;
        if (visible && stored && best.collisions < chosen.collisions && now - stored.changedAt >= 220) chosen = best;
        if (!stored) {
          stored = { x: chosen.x, y: chosen.y, anchorX: originX, anchorY: originY, visible, slot: chosen.slot, changedAt: now };
          previous.set(id, stored);
        }
        if (chosen.slot !== stored.slot) { stored.slot = chosen.slot; stored.changedAt = now; }
        // An offscreen anchor can project to infinity or flip across the camera.
        // Fade at its last valid position instead of drawing a line across the page.
        if (visible) {
          if (!stored.visible || reducedMotion) {
            stored.x = chosen.x; stored.y = chosen.y; stored.anchorX = originX; stored.anchorY = originY;
          } else {
            for (const [key, origin, anchorKey] of [['x', originX, 'anchorX'], ['y', originY, 'anchorY']]) {
              const offset = stored[key] - stored[anchorKey], desired = chosen[key] - origin;
              if (Math.abs(desired - offset) > .015) {
                stored[key] = origin + offset + (desired - offset) * alpha;
                moving = true;
              } else stored[key] = chosen[key];
              stored[anchorKey] = origin;
            }
          }
          stored.x = clamp(stored.x, width / 2 + 1, 99 - width / 2);
          stored.y = clamp(stored.y, height + 6, 84);
          occupied.push(chosen.rect);
        }
        stored.visible = visible;
        return { id, index, point, visible, x: stored.x, y: stored.y, target: { x: stored.anchorX, y: stored.anchorY } };
      });
      for (const id of previous.keys()) if (!ids.has(id)) previous.delete(id);
      return { labels, moving };
    },
  };
}
