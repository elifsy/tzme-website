import * as THREE from "three";

// Fixed equipment volumes include the gaps between trusses and stay in their
// rest position while parts move. Only camera rays change during pointer moves.
export function createIndustrialRegions(assemblies, landscape) {
  const cache = new Map(),
    localRay = new THREE.Ray(),
    localPoint = new THREE.Vector3(),
    worldPoint = new THREE.Vector3();
  const occluders =
    landscape?.children.filter(
      (object) =>
        object.isMesh &&
        !object.isInstancedMesh &&
        object.name !== "harbour-water",
    ) || [];

  function refresh(key) {
    const keys = key === undefined ? Object.keys(assemblies) : [key];
    for (const id of keys) {
      const assembly = assemblies[id];
      if (!assembly) {
        cache.delete(id);
        continue;
      }
      assembly.group.updateWorldMatrix(true, true);
      const root = assembly.custom || assembly.equipment,
        world = assembly.group.matrixWorld.clone(),
        inverse = world.clone().invert();
      // Keep the associated vessel interactive without expanding the crane's
      // entire volume across the water between the ship and quay.
      const vessel = assembly.environment?.getObjectByName("bulk-carrier");
      const volumes = [];
      for (const object of [root, vessel].filter(Boolean)) {
        const bounds = new THREE.Box3();
        object.traverseVisible((mesh) => {
          if (!mesh.isMesh) return;
          let box;
          if (mesh.isInstancedMesh || mesh.isSkinnedMesh) {
            mesh.computeBoundingBox();
            box = mesh.boundingBox;
          } else {
            if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
            box = mesh.geometry.boundingBox;
          }
          if (box)
            bounds.union(
              box
                .clone()
                .applyMatrix4(inverse.clone().multiply(mesh.matrixWorld)),
            );
        });
        if (bounds.isEmpty()) continue;
        const size = bounds.getSize(new THREE.Vector3());
        const padding = new THREE.Vector3(
          THREE.MathUtils.clamp(size.x * 0.025, 0.15, 0.35),
          0.14,
          THREE.MathUtils.clamp(size.z * 0.025, 0.15, 0.35),
        );
        const enter = bounds.expandByVector(padding),
          exit = enter
            .clone()
            .expandByVector(new THREE.Vector3(0.25, 0.18, 0.25));
        volumes.push({ object, enter, exit });
      }
      cache.set(id, { root, world, inverse, volumes });
    }
  }

  function distance(raycaster, entry, bounds) {
    localRay.copy(raycaster.ray).applyMatrix4(entry.inverse);
    if (!localRay.intersectBox(bounds, localPoint)) return Infinity;
    worldPoint.copy(localPoint).applyMatrix4(entry.world);
    const value = raycaster.ray.origin.distanceTo(worldPoint);
    return value >= raycaster.near && value <= raycaster.far ? value : Infinity;
  }

  refresh();
  return {
    refresh,
    pick(raycaster, previous = "") {
      let closest = Infinity,
        retained = Infinity,
        selected = null;
      for (const [key, assembly] of Object.entries(assemblies)) {
        if (!assembly.group.visible) continue;
        if (cache.get(key)?.root !== (assembly.custom || assembly.equipment))
          refresh(key);
        const entry = cache.get(key);
        for (const volume of entry.volumes) {
          if (
            !volume.object.visible ||
            (volume.object !== entry.root && !assembly.environment?.visible)
          )
            continue;
          const hit = distance(raycaster, entry, volume.enter);
          if (hit < closest) {
            closest = hit;
            selected = key;
          }
          if (key === previous)
            retained = Math.min(
              retained,
              distance(raycaster, entry, volume.exit),
            );
        }
      }
      if (!selected && Number.isFinite(retained)) {
        selected = previous;
        closest = retained;
      }
      if (selected && landscape?.visible) {
        // The two land surfaces suffice for occlusion; water and hundreds of
        // shoreline rock instances never participate in hover triangle tests.
        const obstruction = raycaster.intersectObjects(occluders, false)[0];
        if (obstruction && obstruction.distance < closest - 0.001) return null;
      }
      return selected;
    },
    dispose() {
      cache.clear();
    },
  };
}
