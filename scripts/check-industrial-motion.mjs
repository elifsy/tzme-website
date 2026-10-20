import assert from 'node:assert/strict'
import * as THREE from 'three'
import { buildIndustrialScene, disposeObject } from '../src/three/industrialScene.js'
import { createIndustrialMotion } from '../src/three/industrialMotion.js'

const context = { fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, setLineDash() {}, putImageData() {},
  createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }) }
const doc = { createElement: () => ({ getContext: () => context }) }
const keys = ['mining', 'ports', 'metallurgy', 'energy', 'construction', 'amusement', 'lifting-transport', 'environmental', 'steel-structures', 'testing']
const scene = buildIndustrialScene(keys.map(id => ({ id })), true, doc)
const motion = createIndustrialMotion(scene.assemblies)
const snapshot = object => ({ position: object.position.toArray(), rotation: object.quaternion.toArray(), scale: object.scale.toArray() })
const roots = new Map(Object.values(scene.assemblies).map(assembly => [assembly.group, snapshot(assembly.group)]))
const parts = new Map(), originals = new Map(), instances = new Map()
scene.world.traverse(object => {
  if (object.userData.motion || object.name.startsWith('gondola-')) parts.set(object, snapshot(object))
  if (object.isMesh) originals.set(object, object.material)
  if (object.isInstancedMesh) instances.set(object, object.instanceMatrix.array.slice())
})
let now = 0, count = 0
const tick = (frames, reduced = false) => { let result; for (let i = 0; i < frames; i++) result = motion.update(now += 1000 / 60, reduced); return result }
const check = (label, callback) => { callback(); count++; console.log('PASS ' + label) }
const same = (object, rest) => assert.deepEqual(snapshot(object), rest)
try {
  check('Every equipment type responds independently without moving its foundation', () => {
    for (const key of keys) {
      motion.hover(key)
      assert.equal(tick(90).running, true)
      const assembly = scene.assemblies[key]
      const moving = [...parts].filter(([object]) => { let parent = object; while (parent && parent !== assembly.equipment) parent = parent.parent; return parent === assembly.equipment })
      if (moving.length) assert.ok(moving.some(([object, rest]) => JSON.stringify(snapshot(object)) !== JSON.stringify(rest)), key)
      else assert.equal(assembly.equipment.getObjectByName('equipment-inspection-sweep').visible, true, key)
      for (const [root, rest] of roots) same(root, rest)
      for (const [mesh, original] of originals) if (mesh.material !== original) {
        assert.equal(original.emissive.getHex(), 0, 'Shared source materials are untouched')
      }
      motion.hover('')
      assert.equal(tick(100).running, false, 'Release stops rendering')
      for (const [object, rest] of parts) same(object, rest)
      for (const [object, rest] of instances) assert.deepEqual(object.instanceMatrix.array, rest)
    }
  })
  check('Ferris wheel cabins stay upright while their attachment points rotate', () => {
    motion.hover('amusement'); tick(80)
    const rotor = scene.assemblies.amusement.equipment.getObjectByName('ferris-wheel-rotor')
    rotor.updateWorldMatrix(true, true)
    const cabins = rotor.children.filter(child => child.isInstancedMesh)
    assert.equal(cabins.length, 3, 'All cabins and windows use only three instance batches')
    assert.equal(cabins.reduce((sum, child) => sum + child.count, 0), 32)
    const matrix = new THREE.Matrix4(), up = new THREE.Vector3()
    for (const child of cabins) for (let index = 0; index < child.count; index++) {
      child.getMatrixAt(index, matrix); matrix.premultiply(child.matrixWorld)
      up.set(0, 1, 0).transformDirection(matrix)
      assert.ok(up.distanceTo(new THREE.Vector3(0, 1, 0)) < 1e-6, 'Cabin world orientation stays upright')
    }
    motion.reset()
  })
  check('Reset immediately restores all articulated parts, including halfway through a hover', () => {
    motion.hover('ports'); tick(15); motion.hover('mining'); tick(10); motion.reset()
    for (const [object, rest] of parts) same(object, rest)
    assert.deepEqual(tick(1), { running: false, changed: false })
  })
  check('Reduced motion gives a static highlight and schedules no continuous animation', () => {
    for (const key of keys) {
      motion.hover(key); assert.equal(tick(2, true).running, false)
      for (const [object, rest] of parts) same(object, rest)
      const sweep = scene.assemblies[key].equipment.getObjectByName('equipment-inspection-sweep')
      if (sweep) assert.equal(sweep.visible, false)
    }
    motion.reset()
  })
  check('Switching rapidly between industries restores the previous equipment', () => {
    motion.hover('mining'); tick(15); motion.hover('lifting-transport'); tick(100)
    const bucket = scene.assemblies.mining.equipment.getObjectByName('reclaimer-bucket-wheel')
    same(bucket, parts.get(bucket))
    motion.reset()
  })
  check('Long idle intervals cannot jump a rotating mechanism forward', () => {
    motion.hover('mining'); tick(50)
    const bucket = scene.assemblies.mining.equipment.getObjectByName('reclaimer-bucket-wheel'), before = bucket.rotation.z
    motion.update(now += 120000)
    assert.ok(Math.abs(bucket.rotation.z - before) <= .95 * .05 + 1e-10)
    motion.reset()
  })
  check('Hover release settles in real time even when frames arrive slowly', () => {
    motion.hover('lifting-transport'); tick(30); motion.hover('')
    let result
    for (let index = 0; index < 4; index++) result = motion.update(now += 250)
    assert.equal(result.running, false)
    for (const [object, rest] of parts) same(object, rest)
    motion.reset()
  })
  check('Replacement GLBs use an inspection sweep without assuming movable joints', () => {
    const assembly = scene.assemblies.energy, replacement = new THREE.Group()
    const material = new THREE.MeshStandardMaterial({ color: 0xdddddd })
    const basic = new THREE.MeshBasicMaterial({ color: 0x777777 })
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), [material, basic]); mesh.position.y = 2; replacement.add(mesh)
    mesh.userData.motion = { type: 'travel', axis: 'y', distance: 5, speed: 4 }
    assembly.custom = replacement; assembly.group.add(replacement)
    motion.hover('energy'); tick(40)
    assert.equal(replacement.getObjectByName('equipment-inspection-sweep').visible, true)
    assert.equal(mesh.position.y, 2, 'GLB metadata is never treated as a built-in mechanical joint')
    assert.notEqual(mesh.material[0], material); assert.equal(mesh.material[1], basic)
    motion.reset(); assert.equal(replacement.getObjectByName('equipment-inspection-sweep').visible, false)
  })
  check('Inspection lines cannot steal raycast clicks from real equipment', () => {
    for (const assembly of Object.values(scene.assemblies)) {
      const sweep = (assembly.custom || assembly.equipment).getObjectByName('equipment-inspection-sweep')
      if (!sweep) continue
      const hits = []; sweep.raycast(new THREE.Raycaster(), hits); assert.equal(hits.length, 0)
    }
  })
  check('Replacing a hovered GLB releases its effects before the model is disposed', () => {
    const root = scene.assemblies.energy.custom, mesh = root.children.find(child => child.isMesh)
    motion.hover('energy'); tick(20)
    let disposed = 0
    mesh.material[0].addEventListener('dispose', () => disposed++)
    motion.forget('energy')
    assert.equal(disposed, 1)
    assert.equal(root.getObjectByName('equipment-inspection-sweep'), undefined)
    assert.equal(tick(1).running, false)
  })
  check('Disposal restores original shared materials and removes transient effects', () => {
    motion.dispose()
    for (const [mesh, original] of originals) assert.equal(mesh.material, original)
    scene.world.traverse(object => assert.notEqual(object.name, 'equipment-inspection-sweep'))
    for (const [object, rest] of parts) same(object, rest)
  })
} finally { motion.dispose(); disposeObject(scene.world) }
console.log(`PASS ${count} industrial motion checks`)
