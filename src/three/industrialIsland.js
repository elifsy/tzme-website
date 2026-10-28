import * as THREE from "three";

// Coordinates are shared by the coastline, roads and equipment placements.
// The inset on the south-west side is a real berth, rather than a model tile.
export const islandCoast = [
  [-24, -8],
  [-21, -14],
  [-13, -16],
  [-7, -15.3],
  [1, -16],
  [10, -14.8],
  [18, -12],
  [22, -8],
  [23, -2],
  [24, 3],
  [23.2, 7],
  [25.5, 11.7],
  [24.7, 15.8],
  [20.5, 18],
  [16.5, 17.4],
  [12.7, 14.3],
  [8, 13],
  [3.2, 9.8],
  [-0.8, 10],
  [-0.8, 13.7],
  [-4, 14.1],
  [-13.6, 14.1],
  [-15.5, 12.1],
  [-15.5, 7.8],
  [-21.5, 6.4],
  [-25, 3.4],
  [-25.3, -1.5],
];

export const islandRoads = [
  [
    [-23, -4],
    [-17, -4.4],
    [-10, -4.6],
    [-2, -4.9],
    [7, -4.7],
    [16, -4.45],
    [21.8, -2.2],
    [22.8, 2],
    [21.7, 6],
    [16, 5.3],
    [9, 4.75],
    [0, 5.25],
    [-8, 4.5],
    [-17, 4.5],
    [-23, 2.7],
  ],
  [
    [-10.1, -4.6],
    [-10.1, -0.2],
    [-10, 4.5],
    [-12.2, 7],
  ],
  [
    [-14.2, 6.9],
    [-9, 6.5],
    [-3, 6.4],
    [0, 5.25],
  ],
  [
    [8, -4.7],
    [12.4, -3.4],
    [12.7, 1],
    [12.8, 4.95],
  ],
  [
    [16, 5.3],
    [16.2, 9],
    [15.7, 12.9],
    [16, 15.8],
  ],
];

export const islandTerrace = [
  [-23, -9],
  [-20, -13.8],
  [-13, -15.5],
  [-7, -14.9],
  [1, -15.5],
  [10, -14.3],
  [18, -11.5],
  [21.4, -7.4],
  [18, -5.8],
  [8, -6],
  [-0.4, -6],
  [-11, -6.5],
  [-20.7, -6.2],
];

function roundedOutline(points, radius = 0.7) {
  const shape = new THREE.Shape();
  points.forEach((point, index) => {
    const current = new THREE.Vector2(...point),
      previous = new THREE.Vector2(
        ...points[(index + points.length - 1) % points.length],
      ),
      next = new THREE.Vector2(...points[(index + 1) % points.length]);
    const before = current
      .clone()
      .lerp(previous, Math.min(0.2, radius / current.distanceTo(previous)));
    const after = current
      .clone()
      .lerp(next, Math.min(0.2, radius / current.distanceTo(next)));
    if (!index) shape.moveTo(before.x, -before.y);
    else shape.lineTo(before.x, -before.y);
    shape.quadraticCurveTo(current.x, -current.y, after.x, -after.y);
  });
  shape.closePath();
  return shape;
}

function concreteTexture(doc, compact) {
  const canvas = doc.createElement("canvas"),
    resolution = compact ? 768 : 1536;
  canvas.width = canvas.height = resolution;
  const ctx = canvas.getContext("2d"),
    unit = resolution / 56;
  const p = ([x, z]) => [(x + 28) * unit, ((z + 23) / 46) * resolution];
  ctx.fillStyle = "#dce4e8";
  ctx.fillRect(0, 0, resolution, resolution);
  // Deterministic texture keeps resets visually stable and avoids a new asset.
  let seed = 731;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let index = 0; index < 16000; index++) {
    ctx.fillStyle = random() > 0.5 ? "#ffffff16" : "#6e87900b";
    ctx.fillRect(
      random() * resolution,
      random() * resolution,
      1 + random() * 2,
      1 + random() * 2,
    );
  }
  ctx.strokeStyle = "#94aab44a";
  ctx.lineWidth = 0.035 * unit;
  for (let x = -26; x <= 27; x += 3.4) {
    ctx.beginPath();
    ctx.moveTo(...p([x, -23]));
    ctx.lineTo(...p([x, 23]));
    ctx.stroke();
  }
  for (let z = -23; z <= 23; z += 3.4) {
    ctx.beginPath();
    ctx.moveTo(...p([-28, z]));
    ctx.lineTo(...p([28, z]));
    ctx.stroke();
  }
  for (const nodes of islandRoads) {
    const curve = new THREE.CatmullRomCurve3(
      nodes.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      false,
      "centripetal",
    );
    const samples = curve.getPoints(90);
    const stroke = (color, width, dash = []) => {
      ctx.beginPath();
      samples.forEach((point, index) =>
        index
          ? ctx.lineTo(...p([point.x, point.z]))
          : ctx.moveTo(...p([point.x, point.z])),
      );
      ctx.strokeStyle = color;
      ctx.lineWidth = width * unit;
      ctx.setLineDash(dash.map((value) => value * unit));
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    };
    stroke("#92a9b6a0", 1.6);
    stroke("#f6f8f8", 1.48);
    stroke("#b6c8ce7a", 0.045, [0.32, 0.35]);
    ctx.setLineDash([]);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function landMesh(points, top, bottom, topMaterial, sideMaterial) {
  const geometry = new THREE.ExtrudeGeometry(roundedOutline(points), {
    depth: top - bottom,
    bevelEnabled: true,
    bevelSize: 0.16,
    bevelThickness: 0.12,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 5,
  });
  const uv = geometry.attributes.uv;
  for (let index = 0; index < uv.count; index++)
    uv.setXY(index, (uv.getX(index) + 28) / 56, (uv.getY(index) + 23) / 46);
  const mesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial]);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = bottom;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function waterSurface(doc, compact) {
  const size = compact ? 384 : 640,
    canvas = doc.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d"),
    pixels = ctx.createImageData(size, size);
  const smooth = (a, b, value) => {
    const t = THREE.MathUtils.clamp((value - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const distanceToShore = (x, z) => {
    let distance = Infinity;
    for (let index = 0; index < islandCoast.length; index++) {
      const a = islandCoast[index],
        b = islandCoast[(index + 1) % islandCoast.length],
        dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = THREE.MathUtils.clamp(
        ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz),
        0,
        1,
      );
      distance = Math.min(
        distance,
        Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz),
      );
    }
    return distance;
  };
  // Depth colour and broken shore wash follow the actual coast, including the
  // harbour inlet. The outer sea fades into the page without a rectangular edge.
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1),
        v = y / (size - 1),
        px = (u - 0.5) * 65,
        pz = 3 + (v - 0.5) * 52;
      const distance = distanceToShore(px, pz),
        depth = smooth(0.25, 8, distance);
      const swell =
        Math.sin(px * 1.7 + pz * 3.2 + Math.sin(pz * 0.7)) * 0.5 +
        Math.sin(px * 4.5 - pz * 2.1) * 0.22;
      const ripple = Math.pow(
        Math.max(0, Math.sin(pz * 13 + px * 3 + Math.sin(px * 2.3) * 2)),
        14,
      );
      const wash =
        Math.pow(
          Math.max(0, Math.sin(distance * 9 + Math.sin(px * 2 + pz) * 0.8)),
          8,
        ) *
        (1 - smooth(0.25, 1.5, distance));
      const fade =
        smooth(0, 0.17, Math.min(u, 1 - u)) *
        smooth(0, 0.16, Math.min(v, 1 - v));
      const light = swell * 4 + ripple * 7 + wash * 33,
        offset = (y * size + x) * 4;
      pixels.data[offset] = 58 - depth * 29 + light;
      pixels.data[offset + 1] = 167 - depth * 33 + light;
      pixels.data[offset + 2] = 179 - depth * 17 + light;
      pixels.data[offset + 3] = Math.round(fade * 244);
    }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  // Seamless multi-directional waves provide real light/reflection response.
  // No idle animation loop is needed: orbiting changes the reflected highlights.
  const normalCanvas = doc.createElement("canvas"),
    normalSize = compact ? 256 : 512;
  normalCanvas.width = normalCanvas.height = normalSize;
  const normalCtx = normalCanvas.getContext("2d"),
    normals = normalCtx.createImageData(normalSize, normalSize);
  const waves = [
    [2, 7, 0.28],
    [-3, 11, 0.12],
    [7, 19, 0.045],
    [-13, 31, 0.014],
    [23, 43, 0.006],
  ];
  for (let y = 0; y < normalSize; y++)
    for (let x = 0; x < normalSize; x++) {
      const u = (x / normalSize) * Math.PI * 2,
        v = (y / normalSize) * Math.PI * 2;
      let dx = 0,
        dy = 0;
      for (const [kx, ky, amplitude] of waves) {
        const slope = Math.cos(u * kx + v * ky + amplitude * 7) * amplitude;
        dx += kx * slope * 0.09;
        dy += ky * slope * 0.09;
      }
      const length = Math.hypot(dx, dy, 1),
        offset = (y * normalSize + x) * 4;
      normals.data[offset] = (1 - dx / length) * 127.5;
      normals.data[offset + 1] = (1 - dy / length) * 127.5;
      normals.data[offset + 2] = (1 + 1 / length) * 127.5;
      normals.data[offset + 3] = 255;
    }
  normalCtx.putImageData(normals, 0, 0);
  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(3, 3);
  normalMap.anisotropy = 4;
  const material = new THREE.MeshPhysicalMaterial({
    map: texture,
    normalMap,
    normalScale: new THREE.Vector2(0.2, 0.2),
    roughness: 0.33,
    metalness: 0.04,
    clearcoat: 0.4,
    clearcoatRoughness: 0.35,
    clearcoatNormalMap: normalMap,
    clearcoatNormalScale: new THREE.Vector2(0.12, 0.12),
    ior: 1.333,
    envMapIntensity: 0.55,
    transparent: true,
    depthWrite: false,
  });
  // Fade only the water at the viewport boundary, keeping shoreline equipment
  // crisp even when a narrow phone viewport clips the larger sea plane.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      "varying vec4 vWaterClip;\n" +
      shader.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvWaterClip = gl_Position;",
      );
    shader.fragmentShader =
      "varying vec4 vWaterClip;\n" +
      shader.fragmentShader.replace(
        "#include <alphamap_fragment>",
        `#include <alphamap_fragment>
      vec2 waterScreen = vWaterClip.xy / vWaterClip.w * .5 + .5;
      vec2 waterEdge = min(waterScreen, 1.0 - waterScreen);
      diffuseColor.a *= smoothstep(0.0, .09, waterEdge.x) * smoothstep(0.0, .10, waterEdge.y);`,
      );
  };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(65, 52), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, -0.88, 3);
  mesh.name = "harbour-water";
  mesh.renderOrder = -1;
  mesh.receiveShadow = true;
  return mesh;
}

export function createIndustrialIsland(doc, compact) {
  const landscape = new THREE.Group();
  landscape.name = "continuous-industrial-island";
  const topMaterial = new THREE.MeshStandardMaterial({
    color: 0xf7f9fa,
    map: concreteTexture(doc, compact),
    roughness: 0.88,
    metalness: 0.02,
  });
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: 0xb7c6cb,
    roughness: 0.9,
  });
  landscape.add(landMesh(islandCoast, 0.08, -1.32, topMaterial, sideMaterial));
  landscape.add(landMesh(islandTerrace, 0.55, 0.08, topMaterial, sideMaterial));
  landscape.add(waterSurface(doc, compact));
  const coastline = roundedOutline(islandCoast).getSpacedPoints(
    compact ? 115 : 170,
  );
  const rockGeometry = new THREE.DodecahedronGeometry(0.46, 0),
    rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x98a9b1,
      roughness: 1,
      flatShading: true,
    });
  const rocks = new THREE.InstancedMesh(
    rockGeometry,
    rockMaterial,
    coastline.length * 2,
  );
  const dummy = new THREE.Object3D(),
    tint = new THREE.Color();
  let count = 0;
  coastline.forEach((point, index) => {
    const x = point.x,
      z = -point.y;
    // Leave the straight quay face free for the vessel to berth.
    if (x > -16 && x < 1.5 && z > 9) return;
    const normal = new THREE.Vector2(x, z).normalize();
    for (let row = 0; row < 2; row++) {
      const jitter = Math.sin(index * 18.7 + row * 9.4);
      dummy.position.set(
        x + normal.x * (0.18 + row * 0.36),
        -0.75 - row * 0.24 + jitter * 0.06,
        z + normal.y * (0.18 + row * 0.36),
      );
      dummy.rotation.set(index * 0.71, index * 1.6, row + index * 0.38);
      dummy.scale.set(
        0.9 + (jitter + 1) * 0.26,
        0.8 + Math.abs(jitter) * 0.4,
        0.8 + (jitter + 1) * 0.2,
      );
      dummy.updateMatrix();
      rocks.setMatrixAt(count, dummy.matrix);
      tint.setHSL(0.55, 0.06, 0.54 + ((jitter + 1) / 2) * 0.15);
      rocks.setColorAt(count++, tint);
    }
  });
  rocks.count = count;
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  rocks.name = "coastal-rock-revetment";
  landscape.add(rocks);
  // Frame the land, not the large transparent water gradient.
  const framingPoints = islandCoast.map(
    ([x, z]) => new THREE.Vector3(x, 0.2, z),
  );
  return { landscape, framingPoints };
}
