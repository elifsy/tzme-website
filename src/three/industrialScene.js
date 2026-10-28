import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createIndustrialIsland } from "./industrialIsland.js";
import { setIndustrialCabinAngle } from "./industrialCabins.js";

// Photo-informed schematic geometry. Each assembly is batched by material so
// the lattice structures remain inexpensive to render on smaller devices.
const Y = new THREE.Vector3(0, 1, 0);
const vector = (value) => new THREE.Vector3(...value);
const palette = {
  blue: [0x147eaf, 0.38, 0.52],
  blueDark: [0x155b80, 0.46, 0.5],
  cyan: [0x6bb5c9, 0.38, 0.3],
  yellow: [0xe9ac24, 0.4, 0.46],
  yellowDark: [0xad7417, 0.55, 0.4],
  red: [0xc74235, 0.5, 0.35],
  white: [0xe4edf0, 0.43, 0.35],
  concrete: [0xaabac0, 0.85, 0.08],
  steel: [0x71858e, 0.48, 0.65],
  dark: [0x273e49, 0.7, 0.35],
  glass: [0x255266, 0.25, 0.6],
  coal: [0x3d4449, 0.96, 0.05],
  navy: [0x12374b, 0.48, 0.45],
  rust: [0x8e4540, 0.68, 0.3],
  foam: [0xb5e5e8, 0.55, 0.1],
  green: [0x709c83, 0.58, 0.28],
};

class Assembly {
  constructor(materials) {
    this.materials = materials;
    this.batches = new Map();
    this.parts = [];
  }
  part(name, pivot, motion, build) {
    const assembly = new Assembly(this.materials);
    build(assembly);
    const part = assembly.finish(name);
    // Keep the original rest geometry, with a local pivot for mechanical motion.
    part.children.forEach((mesh) =>
      mesh.geometry?.translate(-pivot[0], -pivot[1], -pivot[2]),
    );
    part.position.fromArray(pivot);
    part.userData.motion = motion;
    this.parts.push(part);
    return part;
  }
  add(geometry, material, position = [0, 0, 0], quaternion, scale) {
    const matrix = new THREE.Matrix4().compose(
      vector(position),
      quaternion || new THREE.Quaternion(),
      scale ? vector(scale) : new THREE.Vector3(1, 1, 1),
    );
    const transformed = (
      geometry.index ? geometry.toNonIndexed() : geometry.clone()
    ).applyMatrix4(matrix);
    if (!this.batches.has(material)) this.batches.set(material, []);
    this.batches.get(material).push(transformed);
  }
  box(position, size, material, rotation = [0, 0, 0]) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    this.add(
      geometry,
      material,
      position,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      size,
    );
    geometry.dispose();
  }
  cylinder(
    position,
    radius,
    height,
    material,
    rotation = [0, 0, 0],
    top = radius,
    open = false,
  ) {
    const geometry = new THREE.CylinderGeometry(
      top,
      radius,
      height,
      16,
      1,
      open,
    );
    this.add(
      geometry,
      material,
      position,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    );
    geometry.dispose();
  }
  rod(from, to, radius, material) {
    const a = vector(from),
      b = vector(to),
      direction = b.clone().sub(a);
    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      direction.length(),
      7,
    );
    this.add(
      geometry,
      material,
      a.clone().add(b).multiplyScalar(0.5).toArray(),
      new THREE.Quaternion().setFromUnitVectors(Y, direction.normalize()),
    );
    geometry.dispose();
  }
  beam(from, to, width, depth, material) {
    const a = vector(from),
      b = vector(to),
      direction = b.clone().sub(a);
    const geometry = new THREE.BoxGeometry(width, direction.length(), depth);
    this.add(
      geometry,
      material,
      a.clone().add(b).multiplyScalar(0.5).toArray(),
      new THREE.Quaternion().setFromUnitVectors(Y, direction.normalize()),
    );
    geometry.dispose();
  }
  torus(position, radius, tube, material, rotation = [0, 0, 0]) {
    const geometry = new THREE.TorusGeometry(radius, tube, 6, 24);
    this.add(
      geometry,
      material,
      position,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    );
    geometry.dispose();
  }
  truss(from, to, width, height, material, sections = 10) {
    const a = vector(from),
      b = vector(to),
      direction = b.clone().sub(a).normalize();
    let right = new THREE.Vector3().crossVectors(direction, Y);
    if (right.lengthSq() < 0.01) right.set(1, 0, 0);
    right.normalize();
    const up = new THREE.Vector3().crossVectors(right, direction).normalize();
    const offsets = [
      right
        .clone()
        .multiplyScalar(-width / 2)
        .addScaledVector(up, -height / 2),
      right
        .clone()
        .multiplyScalar(width / 2)
        .addScaledVector(up, -height / 2),
      up.clone().multiplyScalar(height / 2),
    ];
    offsets.forEach((offset) =>
      this.rod(
        a.clone().add(offset).toArray(),
        b.clone().add(offset).toArray(),
        0.075,
        material,
      ),
    );
    for (let index = 0; index < sections; index++) {
      const start = a.clone().lerp(b, index / sections),
        end = a.clone().lerp(b, (index + 1) / sections);
      for (let face = 0; face < 3; face++) {
        this.rod(
          start.clone().add(offsets[face]).toArray(),
          end
            .clone()
            .add(offsets[(face + 1) % 3])
            .toArray(),
          0.038,
          material,
        );
        this.rod(
          start.clone().add(offsets[face]).toArray(),
          start
            .clone()
            .add(offsets[(face + 1) % 3])
            .toArray(),
          0.034,
          material,
        );
      }
    }
  }
  railing(from, to, height = 0.65, material = "yellow") {
    const a = vector(from),
      b = vector(to),
      count = Math.max(1, Math.ceil(a.distanceTo(b) / 0.9));
    for (let index = 0; index <= count; index++) {
      const point = a.clone().lerp(b, index / count);
      this.rod(
        point.toArray(),
        point.clone().addScaledVector(Y, height).toArray(),
        0.025,
        material,
      );
    }
    this.rod(
      a.clone().addScaledVector(Y, height).toArray(),
      b.clone().addScaledVector(Y, height).toArray(),
      0.026,
      material,
    );
    this.rod(
      a
        .clone()
        .addScaledVector(Y, height * 0.5)
        .toArray(),
      b
        .clone()
        .addScaledVector(Y, height * 0.5)
        .toArray(),
      0.018,
      material,
    );
  }
  finish(name) {
    const group = new THREE.Group();
    group.name = name;
    for (const [key, geometries] of this.batches) {
      const geometry = mergeGeometries(geometries, false);
      const mesh = new THREE.Mesh(geometry, this.materials[key]);
      mesh.castShadow = key !== "water";
      mesh.receiveShadow = true;
      group.add(mesh);
      geometries.forEach((item) => item.dispose());
    }
    if (this.parts.length) group.add(...this.parts);
    this.batches.clear();
    return group;
  }
}

function unloader(materials) {
  const a = new Assembly(materials);
  for (const x of [-2.1, 2.1])
    for (const z of [-2.0, 2.0]) {
      a.beam([x, 0.6, z], [x * 0.73, 6.9, z * 0.7], 0.48, 0.48, "blue");
      a.box([x, 0.45, z], [2.0, 0.42, 0.72], "blueDark");
      for (const shift of [-0.65, 0.65])
        a.cylinder([x + shift, 0.25, z], 0.28, 0.7, "dark", [
          Math.PI / 2,
          0,
          0,
        ]);
    }
  for (const z of [-1.6, 1.6]) {
    a.beam([-1.8, 6.7, z], [1.8, 6.7, z], 0.55, 0.55, "blue");
    a.rod([-2, 1.5, z], [1.5, 6.4, z], 0.095, "blue");
    a.rod([2, 1.5, z], [-1.5, 6.4, z], 0.095, "blue");
  }
  a.box([0, 7.1, -0.2], [5, 0.42, 4.5], "blue");
  a.box([0.3, 7.7, -2.8], [3.8, 1.3, 2.7], "blue");
  a.box([0.3, 8.42, -2.8], [4, 0.12, 2.9], "white");
  for (const x of [-0.8, 0.8]) {
    a.beam([x, 7.2, -0.7], [x, 14.6, -0.7], 0.25, 0.35, "blue");
    for (let step = 0; step < 8; step++)
      a.box(
        [x, 8 + step * 0.83, -0.9],
        [0.28, 0.4, 0.08],
        step % 2 ? "white" : "red",
      );
  }
  for (let level = 0; level < 8; level++)
    a.rod(
      [-0.8, 7.4 + level * 0.88, -0.7],
      [0.8, 8.28 + level * 0.88, -0.7],
      0.045,
      "cyan",
    );
  a.truss([0, 8.1, -5.2], [0, 8.8, 9.8], 1.35, 1.25, "blue", 15);
  a.beam([0, 8, -5.4], [0, 8.7, 10], 0.13, 1.25, "blueDark");
  a.rod([-0.8, 14.5, -0.7], [-0.5, 9.2, 9.5], 0.026, "steel");
  a.rod([0.8, 14.5, -0.7], [0.5, 9.2, 9.5], 0.026, "steel");
  a.rod([0, 14.5, -0.7], [0, 8.4, -5], 0.04, "steel");
  a.part(
    "unloader-trolley",
    [0, 0, 0],
    { type: "travel", axis: "z", distance: 0.9, speed: 1.3 },
    (trolley) => {
      trolley.box([0, 9, 8.1], [1.8, 0.4, 1.6], "red");
      for (const x of [-0.48, 0.48])
        trolley.rod([x, 8.8, 8.2], [x, 4.8, 8.2], 0.026, "steel");
      const scoop = new THREE.Shape()
        .moveTo(-0.75, 0.3)
        .lineTo(0, -0.55)
        .lineTo(0.75, 0.3)
        .lineTo(0.48, 0.43)
        .lineTo(0, -0.16)
        .lineTo(-0.48, 0.43)
        .closePath();
      const grab = new THREE.ExtrudeGeometry(scoop, {
        depth: 0.95,
        bevelEnabled: false,
      });
      trolley.add(grab, "dark", [0, 4.4, 7.7]);
      grab.dispose();
      trolley.rod([-0.5, 4.8, 8.2], [0, 5.4, 8.2], 0.065, "yellow");
      trolley.rod([0.5, 4.8, 8.2], [0, 5.4, 8.2], 0.065, "yellow");
    },
  );
  a.box([2.75, 7.65, 1.1], [1.6, 1.5, 1.85], "blue");
  a.box([2.75, 7.9, 2.04], [1.3, 0.75, 0.04], "glass");
  a.box([3.57, 7.9, 1.1], [0.04, 0.75, 1.4], "glass");
  a.box([2.75, 8.45, 1.1], [1.85, 0.13, 2.1], "white");
  a.railing([-2.5, 7.32, -2.2], [-2.5, 7.32, 2.1]);
  a.railing([-2.5, 7.32, -2.2], [2.5, 7.32, -2.2]);
  for (const x of [1.18, 1.68])
    a.rod([x, 7.4, -0.9], [x, 14.4, -0.9], 0.025, "white");
  for (let step = 0; step < 23; step++)
    a.rod(
      [1.18, 7.45 + step * 0.3, -0.9],
      [1.68, 7.45 + step * 0.3, -0.9],
      0.025,
      "white",
    );
  for (let step = 0; step < 21; step++)
    a.box(
      [2.35, 0.9 + step * 0.27, -2.1 + step * 0.17],
      [0.7, 0.08, 0.25],
      "steel",
    );
  a.railing([2.7, 1, -2.1], [2.7, 6.6, 1.4], 0.65);
  return a.finish("schematic-ship-unloader");
}

function ship(a, position) {
  const hullShape = () =>
    new THREE.Shape()
      .moveTo(-12.8, -1.85)
      .lineTo(10.6, -1.85)
      .quadraticCurveTo(14, -1.5, 14.5, 0)
      .quadraticCurveTo(14, 1.5, 10.6, 1.85)
      .lineTo(-12.8, 1.85)
      .quadraticCurveTo(-13.8, 0, -12.8, -1.85)
      .closePath();
  for (const [height, depth, material] of [
    [-0.25, 0.75, "rust"],
    [0.38, 1.25, "navy"],
  ]) {
    const geometry = new THREE.ExtrudeGeometry(hullShape(), {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.15,
      bevelThickness: 0.15,
      curveSegments: 14,
    });
    a.add(
      geometry,
      material,
      [position[0], height, position[2]],
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    );
    geometry.dispose();
  }
  const [x, , z] = position;
  a.box([x, 1.65, z], [24.5, 0.12, 3.4], "rust");
  for (const hold of [-7, -2.5, 2, 6.5]) {
    a.box([x + hold, 1.73, z], [3.7, 0.13, 2.55], "coal");
    for (const side of [-1.4, 1.4])
      a.box([x + hold, 1.9, z + side], [3.9, 0.3, 0.16], "rust");
    for (const end of [-1.9, 1.9])
      a.box([x + hold + end, 1.9, z], [0.16, 0.3, 2.9], "rust");
  }
  for (let level = 0; level < 3; level++) {
    a.box([x - 10.7, 2 + level * 0.7, z], [2.5, 0.7, 2.8], "white");
    a.box([x - 9.42, 2.1 + level * 0.7, z], [0.03, 0.25, 2.2], "glass");
  }
  a.box([x - 10.7, 4.08, z], [3, 0.12, 3.2], "white");
  a.cylinder([x - 11.6, 4.7, z - 0.5], 0.32, 1.3, "red");
  a.rod([x - 10.4, 4.1, z + 0.5], [x - 10.4, 6.1, z + 0.5], 0.045, "white");
  a.rod([x - 11.2, 5.3, z + 0.5], [x - 9.6, 5.3, z + 0.5], 0.03, "white");
  for (const side of [-1.9, 1.9])
    a.railing(
      [x - 12, 1.8, z + side],
      [x + 10.5, 1.8, z + side],
      0.45,
      "white",
    );
}

function portEnvironment(materials) {
  const a = new Assembly(materials);
  for (const z of [-2, 2]) a.box([0, 0.04, z], [17.8, 0.08, 0.11], "steel");
  for (const x of [-8, -5, -2, 1, 4, 7]) {
    a.box([x, -0.25, 5.35], [0.35, 1.2, 0.45], "dark");
    a.cylinder([x, 0.2, 4.8], 0.17, 0.35, "dark");
  }
  for (const x of [-7, -4, -1, 2, 5])
    a.box([x, 0.04, 3], [1.8, 0.015, 0.08], "yellow");
  for (const x of [-8, 7.5]) {
    a.box([x, 0.5, -1.8], [1.8, 0.8, 1], "yellow");
    a.box([x - 0.6, 1.15, -1.8], [0.65, 0.6, 1], "white");
    for (const wheel of [-0.6, 0.6])
      a.cylinder([x + wheel, 0.22, -1.8], 0.24, 1.12, "dark", [
        Math.PI / 2,
        0,
        0,
      ]);
  }
  a.truss([7.5, 3.2, -3.6], [7.5, 4.6, 5], 0.9, 0.8, "blueDark", 8);
  for (const z of [-2.8, 1.5])
    for (const x of [6.9, 8.1])
      a.beam([x, 0.2, z], [x, 3.5, z], 0.16, 0.2, "blue");
  const environment = a.finish("port-quayside-equipment"),
    vessel = new Assembly(materials);
  ship(vessel, [0, 0, 8.5]);
  const boat = vessel.finish("bulk-carrier");
  boat.position.y = -1.3;
  environment.add(boat);
  return environment;
}

function stacker(materials) {
  const a = new Assembly(materials);
  a.box([0, 0.6, 0], [4.4, 0.7, 3.7], "yellowDark");
  for (const z of [-1.7, 1.7])
    for (let x = -1.8; x <= 1.8; x += 0.6)
      a.cylinder([x, 0.35, z], 0.3, 0.45, "dark", [Math.PI / 2, 0, 0]);
  a.cylinder([0, 1.2, 0], 1.65, 0.6, "steel");
  a.cylinder([0, 1.65, 0], 1.45, 0.4, "yellow");
  for (const z of [-1, 1]) {
    a.beam([-1.6, 1.5, z], [-0.8, 3.4, z], 0.22, 0.25, "yellow");
    a.beam([1.6, 1.5, z], [0.8, 3.4, z], 0.22, 0.25, "yellow");
    a.beam([0, 3.1, z * 0.7], [0, 9, z * 0.45], 0.19, 0.19, "yellow");
  }
  a.box([0.5, 3.1, 0], [4, 0.2, 3.1], "yellow");
  a.box([1, 3.85, -0.6], [2.7, 1.4, 1.5], "yellow");
  a.box([-0.7, 3.9, 1.1], [1.4, 1.5, 1.3], "yellow");
  a.box([-0.7, 4.05, 1.77], [1.1, 0.7, 0.04], "glass");
  a.box([-1.43, 4.05, 1.1], [0.04, 0.7, 0.9], "glass");
  a.truss([0, 3.6, 0], [-9.5, 5.3, 0], 1.25, 1.2, "yellow", 12);
  a.truss([0, 3.6, 0], [10, 4.35, 0], 1.1, 1.0, "yellow", 12);
  a.beam([0, 3.42, 0], [-9.3, 5.1, 0], 0.07, 0.8, "dark");
  a.beam([0, 3.42, 0], [9.7, 4.16, 0], 0.07, 0.8, "dark");
  for (const z of [-0.45, 0.45]) {
    a.rod([0, 8.9, z], [-8.8, 5.7, z], 0.025, "steel");
    a.rod([0, 8.9, z], [9, 4.8, z], 0.025, "steel");
  }
  a.cylinder([-9.6, 5.25, 0], 0.44, 1.6, "steel", [Math.PI / 2, 0, 0]);
  a.part(
    "reclaimer-bucket-wheel",
    [-9.6, 5.25, 0],
    { type: "rotate", axis: "z", speed: 0.95 },
    (wheel) => {
      wheel.torus([-9.6, 5.25, 0.6], 1.45, 0.1, "yellowDark");
      wheel.torus([-9.6, 5.25, -0.6], 1.45, 0.1, "yellowDark");
      for (let index = 0; index < 12; index++) {
        const angle = (index / 12) * Math.PI * 2,
          x = -9.6 + Math.cos(angle) * 1.45,
          y = 5.25 + Math.sin(angle) * 1.45;
        wheel.rod([-9.6, 5.25, 0.6], [x, y, 0.6], 0.065, "yellow");
        wheel.box([x, y, 0], [0.65, 0.47, 1.25], "yellow", [0, 0, angle]);
        wheel.box(
          [x + Math.cos(angle) * 0.23, y + Math.sin(angle) * 0.23, 0],
          [0.2, 0.47, 1.28],
          "steel",
          [0, 0, angle],
        );
      }
    },
  );
  a.railing([-2, 3.25, 1.55], [2, 3.25, 1.55], 0.7);
  a.railing([-2, 3.25, -1.55], [2, 3.25, -1.55], 0.7);
  for (let step = 0; step < 11; step++)
    a.box(
      [2.6, 0.8 + step * 0.23, -1.5 + step * 0.22],
      [0.65, 0.07, 0.32],
      "steel",
    );
  return a.finish("schematic-stacker-reclaimer");
}

function miningEnvironment(materials) {
  const a = new Assembly(materials);
  for (const z of [-1.8, 1.8]) a.box([0, 0.06, z], [25, 0.08, 0.1], "steel");
  for (const x of [-7, -1, 5])
    for (const z of [-3.4, 3.5]) {
      const pile = new THREE.ConeGeometry(2.6, 2.45, 24, 2);
      const positions = pile.attributes.position;
      for (let index = 0; index < positions.count; index++) {
        const noise =
          1 +
          Math.sin(positions.getX(index) * 14 + positions.getZ(index) * 19) *
            0.055;
        positions.setX(index, positions.getX(index) * noise);
        positions.setZ(index, positions.getZ(index) * noise);
      }
      pile.computeVertexNormals();
      a.add(pile, "coal", [x, 1.1, z]);
      pile.dispose();
    }
  a.box([0, 0.25, -5], [24, 0.18, 0.75], "dark");
  for (let x = -11; x < 12; x += 1)
    a.box([x, 0.17, -5], [0.1, 0.3, 1.1], "yellow");
  return a.finish("bulk-stockyard");
}

function jacket(materials) {
  const a = new Assembly(materials);
  for (const x of [-2.3, 2.3])
    for (const z of [-2.3, 2.3]) {
      a.cylinder([x, 3.2, z], 0.33, 6.4, "white", [0, 0, 0], 0.27, true);
      for (const y of [0.2, 6.4])
        a.torus([x, y, z], 0.37, 0.065, "steel", [Math.PI / 2, 0, 0]);
    }
  for (const y of [0.8, 3.1, 5.6])
    for (const side of [-2.3, 2.3]) {
      a.rod([-2.3, y, side], [2.3, y, side], 0.19, "white");
      a.rod([side, y, -2.3], [side, y, 2.3], 0.19, "white");
    }
  for (const side of [-2.3, 2.3]) {
    a.rod([-2.3, 0.8, side], [2.3, 5.6, side], 0.15, "white");
    a.rod([2.3, 0.8, side], [-2.3, 5.6, side], 0.15, "white");
    a.rod([side, 0.8, -2.3], [side, 5.6, 2.3], 0.15, "white");
    a.rod([side, 0.8, 2.3], [side, 5.6, -2.3], 0.15, "white");
  }
  a.rod([-2.3, 5.6, -2.3], [2.3, 5.6, 2.3], 0.15, "white");
  a.rod([2.3, 5.6, -2.3], [-2.3, 5.6, 2.3], 0.15, "white");
  return a.finish("schematic-offshore-jacket");
}

function energyEquipment(materials) {
  const a = new Assembly(materials);
  for (const x of [-4, -2.5, -1]) {
    a.cylinder(
      [x, 0.65, 4],
      0.54,
      4.5,
      "white",
      [Math.PI / 2, 0, 0],
      0.48,
      true,
    );
    for (const z of [1.75, 6.25]) a.torus([x, 0.65, z], 0.55, 0.045, "steel");
    for (const z of [2.2, 5.8])
      a.box([x, 0.1, z], [1.2, 0.2, 0.4], "yellowDark");
  }
  for (const [x, height] of [
    [1.5, 10.2],
    [3.2, 9.7],
    [4.9, 9.2],
    [6.6, 8.7],
  ]) {
    a.cylinder(
      [x, height / 2, -2.3],
      0.46,
      height,
      "white",
      [0, 0, 0],
      0.33,
      true,
    );
    a.torus([x, height, -2.3], 0.34, 0.045, "yellowDark", [Math.PI / 2, 0, 0]);
    a.torus([x, 0.05, -2.3], 0.48, 0.06, "steel", [Math.PI / 2, 0, 0]);
  }
  const equipment = a.finish("energy-tower-and-pipe-assembly"),
    structure = jacket(materials);
  structure.position.set(-2.3, 0, -1.8);
  equipment.add(structure);
  return equipment;
}

function furnace(materials) {
  const a = new Assembly(materials);
  a.box([0, 0.25, 0], [9, 0.5, 8], "steel");
  a.cylinder([0, 2.7, 0], 3.3, 4.6, "white", [0, 0, 0], 3.3, true);
  for (const y of [0.65, 4.9])
    a.torus([0, y, 0], 3.35, 0.14, "steel", [Math.PI / 2, 0, 0]);
  for (let index = 0; index < 12; index++) {
    const angle = (index * Math.PI) / 6,
      x = Math.cos(angle) * 3.35,
      z = Math.sin(angle) * 3.35;
    a.beam([x, 0.65, z], [x, 4.9, z], 0.17, 0.22, "steel");
    a.box([x * 1.015, 2.7, z * 1.015], [0.38, 0.48, 0.15], "dark", [
      0,
      -angle + Math.PI / 2,
      0,
    ]);
  }
  a.cylinder([0, 5, 0], 3.35, 0.22, "white");
  a.part(
    "furnace-electrodes",
    [0, 0, 0],
    { type: "travel", axis: "y", distance: 0.35, speed: 1.6 },
    (electrodes) => {
      for (const x of [-1.4, 0, 1.4])
        electrodes.cylinder([x, 5.95, 0], 0.24, 1.8, "dark");
    },
  );
  a.box([4, 2.5, 0], [1.3, 4.7, 2.5], "blueDark");
  a.rod([2, 5.3, -1], [4, 5.3, -1], 0.4, "steel");
  a.rod([4, 5.3, -1], [4, 7.6, -1], 0.4, "steel");
  return a.finish("schematic-electric-furnace");
}

function bridgeLauncher(materials) {
  const a = new Assembly(materials);
  for (const x of [-5.5, 5.5]) {
    a.box([x, 2, 0], [1.2, 4, 2.2], "concrete");
    a.box([x, 4.1, 0], [2, 0.5, 5], "concrete");
  }
  for (let index = -4; index <= 4; index++)
    a.box([index * 1.25, 4.65, 0], [1.18, 0.65, 4.8], "white");
  for (const z of [-2.35, 2.35]) {
    a.truss([-9, 6.8, z], [9, 6.8, z], 0.5, 1.3, "blue", 12);
    for (const x of [-6, 6])
      a.beam([x, 4.8, z], [x, 6.6, z], 0.38, 0.38, "blueDark");
  }
  a.part(
    "launcher-trolleys",
    [0, 0, 0],
    { type: "travel", axis: "x", distance: 1.1, speed: 1.15 },
    (trolley) => {
      for (const x of [-4, 4]) {
        trolley.box([x, 7.6, 0], [1.8, 0.4, 5.5], "blueDark");
        for (const z of [-1.7, 1.7])
          trolley.rod([x, 7.4, z], [x, 5.1, z], 0.045, "steel");
      }
    },
  );
  return a.finish("schematic-bridge-erection-machine");
}

function ferrisWheel(materials) {
  const a = new Assembly(materials),
    radius = 4.4;
  for (const z of [-1.5, 1.5]) {
    a.beam([-2.7, 0, z], [0, 5.5, z * 0.3], 0.24, 0.24, "white");
    a.beam([2.7, 0, z], [0, 5.5, z * 0.3], 0.24, 0.24, "white");
    a.box([0, 0.1, z], [6.2, 0.2, 0.6], "blueDark");
  }
  a.rod([0, 5.5, -1], [0, 5.5, 1], 0.22, "steel");
  const wheel = new Assembly(materials),
    cabinPivots = [[], []];
  for (const z of [-0.35, 0.35]) {
    wheel.torus([0, 0, z], radius, 0.1, "cyan");
    for (let index = 0; index < 16; index++) {
      const angle = (index * Math.PI) / 8,
        x = Math.cos(angle) * radius,
        y = Math.sin(angle) * radius;
      wheel.rod([0, 0, z], [x, y, z], 0.033, "white");
      if (z > 0) {
        wheel.rod([x, y, -0.35], [x, y, 0.35], 0.05, "steel");
        cabinPivots[index % 2].push([x, y, 0]);
      }
    }
  }
  const rotor = wheel.finish("ferris-wheel-rotor");
  rotor.position.y = 5.5;
  rotor.userData.motion = { type: "rotate", axis: "z", speed: 0.38 };
  const seat = new THREE.BoxGeometry(0.65, 0.6, 0.9).translate(0, -0.45, 0);
  const window = new THREE.BoxGeometry(0.48, 0.22, 0.025).translate(
    0,
    -0.35,
    0.46,
  );
  for (const [name, geometry, material, pivots] of [
    ["yellow", seat, materials.yellow, cabinPivots[0]],
    ["blue", seat, materials.blue, cabinPivots[1]],
    ["windows", window, materials.glass, cabinPivots.flat()],
  ]) {
    const cabins = new THREE.InstancedMesh(geometry, material, pivots.length);
    cabins.name = `ferris-cabins-${name}`;
    cabins.userData.uprightPivots = pivots;
    cabins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    cabins.castShadow = true;
    cabins.receiveShadow = true;
    cabins.frustumCulled = false;
    rotor.add(cabins);
  }
  setIndustrialCabinAngle(rotor, 0);
  a.parts.push(rotor);
  return a.finish("schematic-ferris-wheel");
}

function gantryCrane(materials) {
  const a = new Assembly(materials);
  for (const x of [-5.5, 5.5])
    for (const z of [-1.8, 1.8]) {
      a.beam([x * 1.08, 0.3, z], [x, 7, z * 0.6], 0.35, 0.4, "red");
      a.box([x * 1.08, 0.3, z], [2, 0.45, 0.65], "yellow");
      for (const shift of [-0.6, 0.6])
        a.cylinder([x * 1.08 + shift, 0.22, z], 0.26, 0.7, "dark", [
          Math.PI / 2,
          0,
          0,
        ]);
    }
  for (const z of [-1.1, 1.1]) {
    a.box([0, 7.2, z], [14, 1.1, 0.55], "red");
    a.railing([-6.8, 7.8, z], [6.8, 7.8, z], 0.5, "yellow");
  }
  a.part(
    "gantry-trolley-and-hook",
    [0, 0, 0],
    { type: "travel", axis: "x", distance: 2.3, speed: 1.25 },
    (trolley) => {
      trolley.box([-1.3, 8, 0], [1.6, 0.6, 3], "blue");
      for (const z of [-0.55, 0.55])
        trolley.rod([-1.3, 7.8, z], [-1.3, 3.6, z], 0.035, "steel");
      trolley.box([-1.3, 3.5, 0], [0.9, 0.4, 1.3], "yellow");
      trolley.torus([-1.3, 3, 0], 0.32, 0.075, "dark");
    },
  );
  a.box([-4.6, 6.1, 0.4], [1.2, 1.4, 1.4], "blue");
  a.box([-4.6, 6.25, 1.12], [0.9, 0.7, 0.03], "glass");
  return a.finish("schematic-gantry-crane");
}

function sedimentationDrive(materials) {
  const a = new Assembly(materials);
  a.cylinder([0, 0.7, 0], 3.9, 0.6, "green");
  a.torus([0, 1.05, 0], 3.65, 0.1, "steel", [Math.PI / 2, 0, 0]);
  for (const x of [-1.65, 1.65]) {
    a.cylinder([x, 1.5, 0], 0.65, 1.1, "blueDark");
    a.cylinder([x, 2.4, 0], 0.43, 0.9, "steel");
    a.cylinder([x, 3.2, 0], 0.36, 0.8, "green");
    for (const y of [1.1, 1.8, 2.75])
      a.torus([x, y, 0], 0.62, 0.07, "steel", [Math.PI / 2, 0, 0]);
    for (const z of [-0.8, 0.8])
      a.beam([x - 0.65, 0, z], [x - 0.65, 0.55, z], 0.14, 0.14, "steel");
  }
  a.box([0, 1.15, -1.7], [2, 0.3, 1.5], "green");
  for (let index = 0; index < 16; index++) {
    const angle = (index * Math.PI) / 8;
    a.cylinder(
      [Math.cos(angle) * 3.6, 1.04, Math.sin(angle) * 3.6],
      0.07,
      0.12,
      "steel",
    );
  }
  a.part(
    "sedimentation-scraper",
    [0, 1.13, 0],
    { type: "rotate", axis: "y", speed: 0.6 },
    (scraper) => {
      scraper.beam([-3.4, 1.13, 0], [3.4, 1.13, 0], 0.1, 0.18, "steel");
      scraper.cylinder([0, 1.2, 0], 0.24, 0.2, "green");
    },
  );
  return a.finish("schematic-sedimentation-drive");
}

function steelHall(materials) {
  const a = new Assembly(materials);
  for (const x of [-5, -2.5, 0, 2.5, 5]) {
    for (const z of [-3.1, 3.1]) {
      a.beam([x, 0, z], [x, 4.5, z], 0.23, 0.23, "blueDark");
      a.box([x, 0.1, z], [0.7, 0.2, 0.7], "concrete");
      a.truss([x, 4.5, z], [x, 6.1, 0], 0.22, 0.4, "steel", 4);
    }
  }
  for (const z of [-3.1, -1.6, 0, 1.6, 3.1])
    a.beam(
      [-5, 6.1 - Math.abs(z) * 0.516, z],
      [5, 6.1 - Math.abs(z) * 0.516, z],
      0.12,
      0.12,
      "steel",
    );
  for (const z of [-3.1, 3.1]) {
    a.rod([-5, 0.3, z], [-2.5, 4.5, z], 0.065, "steel");
    a.rod([-2.5, 0.3, z], [-5, 4.5, z], 0.065, "steel");
  }
  return a.finish("schematic-steel-building-module");
}

function qualityScanner(materials) {
  const a = new Assembly(materials);
  for (const x of [-3.4, 3.4]) {
    a.box([x, 0.15, 0], [1.8, 0.3, 2.8], "yellow");
    a.box([x, 2.1, 0], [1.0, 4.1, 1.4], "white");
    a.box([x, 2.35, 0.72], [0.55, 0.8, 0.04], "dark");
  }
  for (const y of [0.75, 4]) a.box([0, y, 0], [6.5, 0.7, 1.15], "white");
  a.part(
    "traversing-scanner-heads",
    [0, 0, 0],
    { type: "travel", axis: "x", distance: 1.7, speed: 1.4 },
    (heads) => {
      heads.box([0, 1.15, 0], [1, 0.4, 1.35], "blue");
      heads.box([0, 3.5, 0], [1, 0.4, 1.35], "blue");
    },
  );
  a.box([0, 2, -1.65], [5.3, 0.12, 5.5], "foam");
  for (const z of [-3.4, -2.4, -1.4])
    a.cylinder([0, 1.85, z], 0.17, 5.4, "steel", [0, 0, Math.PI / 2]);
  a.box([4.8, 1.5, 0], [1.4, 3, 1.5], "white");
  a.box([4.8, 2.1, 0.77], [0.9, 0.65, 0.03], "glass");
  return a.finish("schematic-paper-quality-scanner");
}

export function buildIndustrialScene(
  industries = [],
  compact = false,
  doc = document,
) {
  const materials = Object.fromEntries(
    Object.entries(palette).map(([key, [color, roughness, metalness]]) => [
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        side: key === "white" ? THREE.DoubleSide : THREE.FrontSide,
      }),
    ]),
  );
  const world = new THREE.Group();
  world.name = "TZME-industrial-showcase";
  world.rotation.y = 0.3;
  const { landscape, framingPoints } = createIndustrialIsland(doc, compact);
  world.add(landscape);
  const definitions = {
    mining: {
      model: stacker,
      environment: miningEnvironment,
      position: [-12, 0.7, -9.7],
      scale: 0.61,
      angle: -0.11,
      anchor: [-1.4, 11, 0],
    },
    metallurgy: {
      model: furnace,
      position: [0.3, 0.7, -10.1],
      scale: 0.85,
      angle: 0.08,
    },
    energy: {
      model: energyEquipment,
      position: [13.2, 0.7, -10],
      scale: 0.62,
      angle: -0.12,
      anchor: [4, 12.4, -2.3],
    },
    construction: {
      model: bridgeLauncher,
      position: [-17.2, 0.23, 0.3],
      scale: 0.59,
      angle: -0.15,
    },
    amusement: {
      model: ferrisWheel,
      position: [-4.3, 0.23, -0.8],
      scale: 0.7,
      angle: -0.18,
    },
    "steel-structures": {
      model: steelHall,
      position: [5.5, 0.23, 0.4],
      scale: 0.86,
      angle: 0.14,
    },
    testing: {
      model: qualityScanner,
      position: [17.5, 0.23, 1.9],
      scale: 0.72,
      angle: -0.14,
    },
    "lifting-transport": {
      model: gantryCrane,
      position: [9.5, 0.23, 8.4],
      scale: 0.72,
      angle: -0.12,
    },
    environmental: {
      model: sedimentationDrive,
      position: [20.3, 0.23, 13.4],
      scale: 0.83,
      angle: 0.15,
    },
    ports: {
      model: unloader,
      environment: portEnvironment,
      position: [-7.5, 0.23, 9.7],
      scale: 0.73,
      angle: 0,
      anchor: [-3, 12, 1.8],
    },
  };
  const assemblies = {};
  let additional = 0;
  for (const industry of industries) {
    const angle = additional * 2.39996;
    const definition = definitions[industry.id] || {
      model: steelHall,
      position: [Math.cos(angle) * 10, 0.25, -3 + Math.sin(angle) * 6],
      scale: 0.4,
      angle: angle * 0.1,
    };
    if (!definitions[industry.id]) additional++;
    const group = new THREE.Group();
    group.name = industry.id;
    const equipment = definition.model(materials),
      environment = definition.environment
        ? definition.environment(materials)
        : new THREE.Group();
    group.add(environment, equipment);
    const bounds = new THREE.Box3().setFromObject(equipment),
      center = bounds.getCenter(new THREE.Vector3());
    const anchor = new THREE.Object3D();
    anchor.position.fromArray(
      definition.anchor || [center.x, bounds.max.y + 1.5, center.z],
    );
    group.add(anchor);
    group.scale.setScalar(definition.scale);
    group.rotation.y = definition.angle || 0;
    group.position.fromArray(definition.position);
    world.add(group);
    assemblies[industry.id] = {
      key: industry.id,
      group,
      equipment,
      environment,
      anchor,
      original: equipment,
      custom: null,
    };
  }
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    new THREE.ShadowMaterial({ opacity: 0.12 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.48;
  ground.receiveShadow = true;
  world.add(ground);
  return { world, assemblies, materials, ground, landscape, framingPoints };
}

export function disposeObject(root, disposeMaterials = true) {
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  root.traverse((object) => {
    if (object.isInstancedMesh) object.dispose();
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : object.material
        ? [object.material]
        : []) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value?.isTexture) textures.add(value);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  if (disposeMaterials) {
    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
  }
}
