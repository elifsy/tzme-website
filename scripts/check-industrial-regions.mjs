import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createIndustrialRegions } from '../src/three/industrialRegions.js'
import { pickIndustry } from '../src/three/industrialPicking.js'
import { disposeObject } from '../src/three/industrialScene.js'

const scene = new THREE.Group(), material = new THREE.MeshBasicMaterial(), ray = new THREE.Raycaster()
const box = (x, y, z, width = 1, height = 1, depth = 1) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
  mesh.position.set(x, y, z); return mesh
}
const frame = new THREE.Group()
frame.add(box(-2, 2, 0, .2, 4, .2), box(2, 2, 0, .2, 4, .2), box(0, 4, 0, 4.2, .2, .2))
const assembly = equipment => { const group = new THREE.Group(), environment = new THREE.Group(); group.add(equipment, environment); scene.add(group); return { group, equipment, environment, custom: null } }
const entries = { frame: assembly(frame) }
let regions = createIndustrialRegions(entries), count = 0
const cast = (x, y = 2, z = 12, previous = '') => { ray.set(new THREE.Vector3(x, y, z), new THREE.Vector3(0, 0, -1)); return regions.pick(ray, previous) }
const check = (label, run) => { run(); count++; console.log('PASS ' + label) }
try {
  check('The empty center of a truss remains part of the equipment hover region', () => {
    assert.equal(cast(0), 'frame')
    assert.equal(pickIndustry(ray, entries), null, 'The same ray misses every actual rod')
  })
  check('Moving across rods and gaps never alternates between hover and leave', () => {
    for (let x = -2.05; x <= 2.05; x += .035) assert.equal(cast(x), 'frame')
  })
  check('Moving mechanical parts cannot move or shrink the cached hover region', () => {
    frame.children[0].position.x = -8; frame.updateMatrixWorld(true)
    assert.equal(cast(0), 'frame')
    assert.equal(cast(-8), null)
    frame.children[0].position.x = -2
  })
  check('A small exit margin prevents edge flicker without capturing distant empty space', () => {
    assert.equal(cast(2.35), null); assert.equal(cast(2.35, 2, 12, 'frame'), 'frame')
    assert.equal(cast(2.7, 2, 12, 'frame'), null)
  })
  check('Overlapping regions select the front equipment regardless of catalog order', () => {
    entries.front = assembly(box(0, 2, 4, 2, 4, 2)); regions.refresh('front')
    assert.equal(cast(0), 'front')
    entries.front.group.visible = false; assert.equal(cast(0), 'frame')
    entries.front.group.visible = true
  })
  check('A replacement model refreshes its region and ignores the hidden original', () => {
    entries.front.custom = box(6, 2, 4, 2, 4, 2); entries.front.group.add(entries.front.custom); entries.front.equipment.visible = false
    regions.refresh('front'); assert.equal(cast(0), 'frame'); assert.equal(cast(6), 'front')
  })
  check('World rotation, scale and translation preserve the equipment region', () => {
    entries.frame.group.position.x = 18; entries.frame.group.rotation.y = .7; entries.frame.group.scale.setScalar(1.5)
    regions.refresh('frame')
    const target = new THREE.Vector3(0, 2, 0).applyMatrix4(entries.frame.group.matrixWorld)
    ray.set(target.clone().add(new THREE.Vector3(0, 0, 12)), new THREE.Vector3(0, 0, -1))
    assert.equal(regions.pick(ray), 'frame')
    entries.frame.group.position.x = 0; entries.frame.group.rotation.y = 0; entries.frame.group.scale.setScalar(1); regions.refresh('frame')
  })
  check('A vessel has its own region without activating the intervening sea', () => {
    const boat = new THREE.Group(); boat.name = 'bulk-carrier'; boat.add(box(-8, 1, 1, 2, 2, 3)); entries.frame.environment.add(boat)
    regions.refresh('frame'); assert.equal(cast(-8, 1), 'frame'); assert.equal(cast(-5, 1), null)
  })
  check('Opaque land blocks hidden equipment while water does not steal hover', () => {
    const landscape = new THREE.Group(), land = box(0, 2, 5, 4, 5, 1)
    landscape.add(land); scene.add(landscape); landscape.updateWorldMatrix(true, true)
    regions.dispose(); regions = createIndustrialRegions(entries, landscape)
    assert.equal(cast(0), null)
    landscape.visible = false; assert.equal(cast(0), 'frame')
    landscape.visible = true; land.name = 'harbour-water'
    regions.dispose(); regions = createIndustrialRegions(entries, landscape)
    assert.equal(cast(0), 'frame')
    landscape.visible = false
  })
  check('Inspecting a region requires no mesh or triangle raycasts', () => {
    const original = THREE.Mesh.prototype.raycast
    THREE.Mesh.prototype.raycast = () => { throw Error('Unexpected triangle test') }
    try { for (let x = -2; x <= 2; x += .02) assert.equal(cast(x), 'frame') } finally { THREE.Mesh.prototype.raycast = original }
  })
  check('Instanced replacement models include their instance transforms', () => {
    const instances = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, 2)
    instances.setMatrixAt(0, new THREE.Matrix4().makeTranslation(-3, 2, 0)); instances.setMatrixAt(1, new THREE.Matrix4().makeTranslation(3, 2, 0))
    entries.instances = assembly(instances); regions.refresh('instances')
    assert.equal(cast(3), 'instances'); assert.equal(cast(-3), 'instances')
  })
} finally { regions.dispose(); disposeObject(scene) }
console.log(`PASS ${count} industrial region checks`)
