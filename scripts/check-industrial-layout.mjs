import assert from 'node:assert/strict'
import * as THREE from 'three'
import { buildIndustrialScene, disposeObject } from '../src/three/industrialScene.js'
import { islandCoast, islandTerrace, islandRoads } from '../src/three/industrialIsland.js'

// Rendering is covered by the browser checks. This canvas stub lets the same
// production equipment geometry be checked without a GPU or browser install.
const context = { fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, setLineDash() {}, putImageData() {},
  createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }) }
const doc = { createElement: () => ({ getContext: () => context }) }
const keys = ['mining', 'ports', 'metallurgy', 'energy', 'construction', 'amusement', 'lifting-transport', 'environmental', 'steel-structures', 'testing']
const scene = buildIndustrialScene(keys.map(id => ({ id })), true, doc)
scene.world.updateMatrixWorld(true)
const inverse = scene.world.matrixWorld.clone().invert(), failures = [], checks = []
const distanceToSegment = (p, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], t = THREE.MathUtils.clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz), 0, 1)
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz)
}
function signedDistance(point, polygon) {
  let inside = false, distance = Infinity
  for (let index = 0; index < polygon.length; index++) {
    const a = polygon[index], b = polygon[(index + 1) % polygon.length]
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside
    distance = Math.min(distance, distanceToSegment(point, a, b))
  }
  return inside ? distance : -distance
}
const roads = islandRoads.map(nodes => new THREE.CatmullRomCurve3(nodes.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal').getPoints(180).map(p => [p.x, p.z]))
const roadDistance = point => Math.min(...roads.flatMap(nodes => nodes.slice(1).map((b, index) => distanceToSegment(point, nodes[index], b))))
function check(label, passed, clearance) {
  checks.push({ label, passed, clearance: +clearance.toFixed(3) })
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}: ${clearance.toFixed(3)}`)
  if (!passed) failures.push(label)
}
try {
  for (const [key, assembly] of Object.entries(scene.assemblies)) {
    const grounded = new Map(), projected = new Map()
    for (const root of [assembly.equipment, assembly.environment]) root.traverse(object => {
      // The bulk carrier is deliberately afloat; its unloading boom may also
      // overhang the berth. Everything that stands on land must stay inland.
      if (object.parent?.name === 'bulk-carrier') return
      const positions = object.geometry?.attributes.position
      if (!positions) return
      for (let instance = 0; instance < (object.isInstancedMesh ? object.count : 1); instance++) {
        const instanceMatrix = new THREE.Matrix4()
        if (object.isInstancedMesh) object.getMatrixAt(instance, instanceMatrix)
        const matrix = inverse.clone().multiply(object.matrixWorld).multiply(instanceMatrix)
        const rootMatrix = root.matrixWorld.clone().invert().multiply(object.matrixWorld).multiply(instanceMatrix)
        const groundedHeight = local => local.clone().applyMatrix4(rootMatrix).y
        const record = local => {
          const point = local.clone().applyMatrix4(matrix), p = [point.x, point.z], id = p.map(v => v.toFixed(3)).join(',')
          if (key !== 'ports' || root === assembly.environment) projected.set(id, p)
          const height = groundedHeight(local)
          if (height >= -.1 && height <= .5) grounded.set(id, p)
        }
        for (let index = 0; index < positions.count; index++) record(new THREE.Vector3().fromBufferAttribute(positions, index))
        // Sample actual indexed triangles and each instance, including interiors
        // and edges so a road cannot pass unnoticed through a rectangular base.
        const indices = object.geometry.index, count = indices?.count || positions.count
        for (let index = 0; index + 2 < count; index += 3) {
          const points = [0, 1, 2].map(offset => new THREE.Vector3().fromBufferAttribute(positions, indices ? indices.getX(index + offset) : index + offset))
          if (!points.every(p => { const height = groundedHeight(p); return height >= -.1 && height <= .5 })) continue
          record(points[0].clone().add(points[1]).add(points[2]).multiplyScalar(1 / 3))
          for (let edge = 0; edge < 3; edge++) for (const t of [.25, .5, .75]) record(points[edge].clone().lerp(points[(edge + 1) % 3], t))
        }
      }
    })
    assert.ok(grounded.size, `${key} has actual ground contact geometry`)
    const points = [...grounded.values()]
    const coast = Math.min(...points.map(p => signedDistance(p, islandCoast)))
    check(`${key} grounded parts stay on land`, coast >= (key === 'ports' ? .01 : .35), coast)
    const road = Math.min(...points.map(roadDistance)) - .8
    check(`${key} ground footprint clears road edges`, road >= .2, road)
    const envelope = Math.min(...[...projected.values()].map(p => signedDistance(p, islandCoast)))
    check(`${key} equipment envelope stays on the island`, envelope >= 0, envelope)
    if (assembly.group.position.y > .5) {
      const terrace = Math.min(...points.map(p => signedDistance(p, islandTerrace)))
      check(`${key} rests on its raised terrace`, terrace >= .08, terrace)
    }
  }
} finally { disposeObject(scene.world) }
assert.deepEqual(failures, [], 'Industrial layout clearances')
console.log(`PASS ${checks.length} equipment layout checks`)
