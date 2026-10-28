import * as THREE from "three";
import { setIndustrialCabinAngle } from "./industrialCabins.js";

const accent = new THREE.Color(0x13869b);

// Animate articulated parts, never the grounded assembly. Materials are cloned
// per equipment so highlighting one industry cannot tint its neighbours.
export function createIndustrialMotion(assemblies) {
  const entries = new Map();
  let hovered = "",
    selected = "",
    previousTime = null;

  function entryFor(key) {
    const assembly = assemblies[key],
      root = assembly?.custom || assembly?.equipment;
    if (!root) return null;
    const existing = entries.get(key);
    if (existing?.root === root) return existing;
    if (existing) disposeEntry(existing);
    const parts = [],
      meshes = [],
      materials = new Map();
    root.traverse((object) => {
      if (!assembly.custom && object.userData.motion)
        parts.push({
          object,
          motion: object.userData.motion,
          position: object.position.clone(),
          rotation: object.rotation.clone(),
          angle: 0,
        });
      if (!object.isMesh) return;
      const original = object.material;
      const clone = (material) => {
        if (!material.emissive) return material;
        if (!materials.has(material))
          materials.set(material, {
            material: material.clone(),
            color: material.emissive.clone(),
            intensity: material.emissiveIntensity,
          });
        return materials.get(material).material;
      };
      object.material = Array.isArray(original)
        ? original.map(clone)
        : clone(original);
      meshes.push({ object, original });
    });
    let scan = null,
      bounds = null;
    // Static fabrications and replacement GLBs receive an inspection sweep;
    // uploaded models need no assumptions about their mechanical joints.
    if (!parts.length) {
      root.updateWorldMatrix(true, true);
      const inverse = root.matrixWorld.clone().invert();
      bounds = new THREE.Box3();
      root.traverse((object) => {
        if (!object.isMesh) return;
        if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
        bounds.union(
          object.geometry.boundingBox
            .clone()
            .applyMatrix4(inverse.clone().multiply(object.matrixWorld)),
        );
      });
      if (!bounds.isEmpty()) {
        const { min, max } = bounds;
        scan = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(min.x, 0, min.z),
            new THREE.Vector3(max.x, 0, min.z),
            new THREE.Vector3(max.x, 0, max.z),
            new THREE.Vector3(min.x, 0, max.z),
          ]),
          new THREE.LineBasicMaterial({
            color: accent,
            transparent: true,
            opacity: 0,
            depthWrite: false,
          }),
        );
        scan.name = "equipment-inspection-sweep";
        scan.visible = false;
        scan.raycast = () => {};
        root.add(scan);
      }
    }
    const entry = {
      root,
      parts,
      meshes,
      materials,
      scan,
      bounds,
      weight: 0,
      time: 0,
    };
    entries.set(key, entry);
    return entry;
  }

  function restore(entry) {
    entry.weight = 0;
    entry.time = 0;
    for (const part of entry.parts) {
      part.angle = 0;
      part.object.position.copy(part.position);
      part.object.rotation.copy(part.rotation);
      setIndustrialCabinAngle(part.object, 0);
    }
    for (const { material, color, intensity } of entry.materials.values()) {
      material.emissive.copy(color);
      material.emissiveIntensity = intensity;
    }
    if (entry.scan) entry.scan.visible = false;
  }
  function disposeEntry(entry) {
    restore(entry);
    entry.meshes.forEach(({ object, original }) => {
      object.material = original;
    });
    entry.materials.forEach(({ material }) => material.dispose());
    if (entry.scan) {
      entry.scan.removeFromParent();
      entry.scan.geometry.dispose();
      entry.scan.material.dispose();
    }
  }

  return {
    hover(key = "") {
      hovered = assemblies[key] ? key : "";
      if (hovered) entryFor(hovered);
      return hovered;
    },
    select(key = "") {
      const next = assemblies[key] ? key : "";
      if (selected !== next) {
        const previous = entries.get(selected);
        if (previous && selected !== hovered) restore(previous);
        selected = next;
      }
      if (selected) entryFor(selected);
      return selected;
    },
    clearHover() {
      hovered = "";
      // Camera dragging and pointer exit must not rewind the selected equipment.
      for (const [key, entry] of entries) if (key !== selected) restore(entry);
    },
    update(now, reduced = false) {
      const elapsed =
        previousTime === null
          ? 1 / 60
          : Math.max(0, (now - previousTime) / 1000);
      const dt = Math.min(elapsed, 0.05);
      previousTime = now;
      let running = false,
        changed = false;
      for (const [key, entry] of entries) {
        const active = key === hovered || key === selected;
        if (!active && !entry.weight) continue;
        changed = true;
        // Ease in real time even on a busy GPU; only mechanical travel is
        // capped so a slow frame cannot jump the wheel forward or prolong exit.
        entry.weight = reduced
          ? Number(active)
          : THREE.MathUtils.damp(entry.weight, Number(active), 9, elapsed);
        if (Math.abs(entry.weight - Number(active)) < 0.001)
          entry.weight = Number(active);
        if (!entry.weight) {
          restore(entry);
          continue;
        }
        if (!reduced) entry.time += dt;
        for (const part of entry.parts) {
          const { object, motion } = part;
          if (motion.type === "rotate") {
            part.angle = reduced
              ? 0
              : active
                ? part.angle + motion.speed * dt * entry.weight
                : THREE.MathUtils.damp(part.angle, 0, 10, elapsed);
            part.angle = Math.atan2(Math.sin(part.angle), Math.cos(part.angle));
            object.rotation[motion.axis] =
              part.rotation[motion.axis] + part.angle;
            // Keep passenger cabins upright as the wheel turns.
            setIndustrialCabinAngle(object, part.angle);
          } else {
            object.position[motion.axis] =
              part.position[motion.axis] +
              (reduced
                ? 0
                : Math.sin(entry.time * motion.speed) *
                  motion.distance *
                  entry.weight);
          }
        }
        for (const { material, color, intensity } of entry.materials.values()) {
          material.emissive.copy(color).lerp(accent, entry.weight * 0.22);
          material.emissiveIntensity = Math.max(intensity, 0.7);
        }
        if (entry.scan) {
          entry.scan.visible = !reduced;
          entry.scan.position.y = THREE.MathUtils.lerp(
            entry.bounds.min.y,
            entry.bounds.max.y,
            0.18 + ((entry.time * 0.36) % 1) * 0.65,
          );
          entry.scan.material.opacity = entry.weight * 0.55;
        }
        if (!reduced) running = true;
      }
      return { running, changed };
    },
    forget(key) {
      if (hovered === key) hovered = "";
      if (selected === key) selected = "";
      const entry = entries.get(key);
      if (entry) {
        disposeEntry(entry);
        entries.delete(key);
      }
    },
    reset() {
      hovered = "";
      selected = "";
      previousTime = null;
      entries.forEach(restore);
    },
    dispose() {
      hovered = "";
      selected = "";
      entries.forEach(disposeEntry);
      entries.clear();
    },
  };
}
