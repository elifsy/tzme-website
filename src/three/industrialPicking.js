// Choose the nearest visible industry object, regardless of catalog order.
// Connected scenery makes front/back overlaps much more common than tiles.
export function pickIndustry(ray, assemblies, landscape) {
  let closest = Infinity,
    selected = null;
  for (const [key, assembly] of Object.entries(assemblies)) {
    if (!assembly.group.visible) continue;
    const objects = [
      assembly.custom || assembly.equipment,
      assembly.environment,
    ].filter((object) => object?.visible);
    const hit = ray.intersectObjects(objects, true)[0];
    if (hit && hit.distance < closest) {
      closest = hit.distance;
      selected = key;
    }
  }
  if (selected && landscape?.visible) {
    const obstruction = ray.intersectObject(landscape, true)[0];
    if (obstruction && obstruction.distance < closest - 0.001) return null;
  }
  return selected;
}
