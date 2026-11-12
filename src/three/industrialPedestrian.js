import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { islandRoads } from "./industrialIsland.js";

// The loop uses the existing road junctions around the central equipment.
// It never closes across the quay, machinery platforms or the sea.
export function createIndustrialPedestrian() {
  const route = new THREE.CatmullRomCurve3(
    [
      islandRoads[1][0],
      ...islandRoads[0].slice(3, 5),
      ...islandRoads[3],
      ...islandRoads[0].slice(10, 13),
      islandRoads[1][2],
      islandRoads[1][1],
    ].map(([x, z]) => new THREE.Vector3(x, 0.23, z)),
    true,
    "centripetal",
  );
  route.arcLengthDivisions = 1024;
  const length = route.getLength(), samples = route.getSpacedPoints(512);
  const tangents = samples.map((_, index) => new THREE.Vector3()
    .subVectors(samples[(index + 1) % 512], samples[(index + 511) % 512])
    .normalize());
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.78, metalness: 0.02, flatShading: true,
  });
  const colors = { blue: 0x19627e, navy: 0x173b51, vest: 0xefaa36, stripe: 0xfaf0b8, skin: 0xd6a27f, boot: 0x293c46, helmet: 0xf6c542 };
  const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
  const cylinder = (radius, height, top = radius) => new THREE.CylinderGeometry(top, radius, height, 8);
  const sphere = (radius) => new THREE.SphereGeometry(radius, 10, 6);
  function part(geometry, color, position = [0, 0, 0]) {
    const value = geometry.index ? geometry.toNonIndexed() : geometry;
    if (value !== geometry) geometry.dispose();
    value.translate(...position);
    const tint = new THREE.Color(color), rgb = new Float32Array(value.attributes.position.count * 3);
    for (let index = 0; index < rgb.length; index += 3) { rgb[index] = tint.r; rgb[index + 1] = tint.g; rgb[index + 2] = tint.b; }
    value.setAttribute("color", new THREE.BufferAttribute(rgb, 3));
    return value;
  }
  function mesh(parent, pieces) {
    const geometry = mergeGeometries(pieces);
    pieces.forEach(piece => piece.dispose());
    const result = new THREE.Mesh(geometry, material);
    result.receiveShadow = true;
    // Static shadow maps belong to the equipment. A small moving contact
    // shadow below the worker avoids refreshing the island's shadow map.
    result.castShadow = false;
    result.updateMatrix(); result.matrixAutoUpdate = false;
    parent.add(result);
    return result;
  }
  function joint(parent, name, x, y, z = 0) {
    const result = new THREE.Group(); result.name = name; result.position.set(x, y, z); parent.add(result); return result;
  }
  const root = new THREE.Group(); root.name = "island-pedestrian";
  const rig = joint(root, "worker-body", 0, 0);
  mesh(rig, [
    part(cylinder(0.16, 0.42, 0.18), colors.blue, [0, 0.98, 0]),
    part(box(0.29, 0.32, 0.25), colors.vest, [0, 1.01, 0.008]),
    part(box(0.3, 0.035, 0.26), colors.stripe, [0, 0.94, 0.008]),
    part(box(0.025, 0.25, 0.26), colors.stripe, [-0.08, 1.04, 0.008]),
    part(box(0.025, 0.25, 0.26), colors.stripe, [0.08, 1.04, 0.008]),
    part(box(0.28, 0.13, 0.23), colors.navy, [0, 0.75, 0]),
    part(cylinder(0.062, 0.1), colors.skin, [0, 1.22, 0]),
    part(sphere(0.135), colors.skin, [0, 1.35, 0]),
    part(new THREE.SphereGeometry(0.158, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), colors.helmet, [0, 1.45, 0]),
    part(cylinder(0.184, 0.025), colors.helmet, [0, 1.455, 0.012]),
    part(box(0.033, 0.025, 0.24), colors.stripe, [0, 1.55, 0]),
    part(sphere(0.014), colors.navy, [-0.047, 1.363, 0.122]),
    part(sphere(0.014), colors.navy, [0.047, 1.363, 0.122]),
  ]);
  const arms = [], legs = [];
  for (const side of [-1, 1]) {
    const name = side < 0 ? "left" : "right";
    const shoulder = joint(rig, `${name}-shoulder`, side * 0.215, 1.12);
    shoulder.rotation.z = side * 0.06;
    mesh(shoulder, [part(cylinder(0.065, 0.24), colors.blue, [0, -0.12, 0])]);
    const elbow = joint(shoulder, `${name}-elbow`, 0, -0.24);
    elbow.rotation.x = -0.2;
    mesh(elbow, [
      part(cylinder(0.052, 0.21), colors.blue, [0, -0.105, 0]),
      part(sphere(0.054), colors.skin, [0, -0.24, 0]),
    ]);
    arms.push(shoulder);
    const hip = joint(rig, `${name}-hip`, side * 0.095, 0.72);
    mesh(hip, [part(cylinder(0.075, 0.36), colors.navy, [0, -0.18, 0])]);
    const knee = joint(hip, `${name}-knee`, 0, -0.36);
    mesh(knee, [part(cylinder(0.061, 0.36), colors.blue, [0, -0.18, 0])]);
    const ankle = joint(knee, `${name}-ankle`, 0, -0.36);
    mesh(ankle, [part(box(0.145, 0.1, 0.24), colors.boot, [0, -0.01, 0.065])]);
    legs.push({ hip, knee, ankle });
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), new THREE.MeshBasicMaterial({
    color: 0x254554, transparent: true, opacity: 0.14, depthWrite: false,
  }));
  shadow.name = "worker-contact-shadow";
  shadow.rotation.x = -Math.PI / 2; shadow.scale.y = 0.7; shadow.position.y = 0.002;
  shadow.updateMatrix(); shadow.matrixAutoUpdate = false; root.add(shadow);
  const direction = new THREE.Vector3(), period = 0.9, speed = 0.85, stance = 0.6;
  let distance = length * 0.63, time = 0, previous = null;
  function pose() {
    const progress = (distance / length) * 512, index = Math.floor(progress), mix = progress - index;
    root.position.lerpVectors(samples[index], samples[index + 1], mix);
    direction.lerpVectors(tangents[index], tangents[index + 1], mix);
    root.rotation.y = Math.atan2(direction.x, direction.z);
    const phase = (time / period) % 1;
    const bob = (1 - Math.cos(phase * Math.PI * 4)) * 0.006;
    rig.position.y = bob;
    const step = speed * period * stance / 2;
    legs.forEach(({ hip, knee, ankle }, side) => {
      const cycle = (phase + side * 0.5) % 1, swing = Math.max(0, (cycle - stance) / (1 - stance));
      const z = cycle < stance ? step * (1 - cycle / stance * 2) : step * (-1 + 2 * swing * swing * (3 - 2 * swing));
      const y = 0.06 + Math.sin(swing * Math.PI) * 0.12, down = 0.72 + bob - y;
      const reach = Math.min(0.7199, Math.hypot(down, z));
      const bend = Math.acos(THREE.MathUtils.clamp(reach / 0.72, -1, 1));
      hip.rotation.x = -Math.atan2(z, down) - bend;
      knee.rotation.x = bend * 2;
      ankle.rotation.x = -hip.rotation.x - knee.rotation.x - Math.sin(swing * Math.PI) * 0.16;
      arms[side].rotation.x = Math.cos((phase + side * 0.5) * Math.PI * 2) * 0.36;
    });
  }
  pose();
  return {
    root,
    pause() { previous = null; },
    update(now, walking = true) {
      if (!walking) { previous = null; return; }
      const delta = previous === null ? 0 : Math.min(0.1, Math.max(0, (now - previous) / 1000));
      previous = now;
      time = (time + delta) % period;
      distance = (distance + delta * speed) % length;
      pose();
    },
  };
}
