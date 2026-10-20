import assert from 'node:assert/strict'
import * as THREE from 'three'
import { pickIndustry } from '../src/three/industrialPicking.js'

const geometry = new THREE.BoxGeometry(2, 2, 2), material = new THREE.MeshBasicMaterial()
const box = z => { const mesh = new THREE.Mesh(geometry, material); mesh.position.z = z; mesh.updateMatrixWorld(); return mesh }
const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 8), new THREE.Vector3(0, 0, -1))
const rear = { group: new THREE.Group(), equipment: box(-4) }, front = { group: new THREE.Group(), equipment: box(0) }
const assemblies = { rear, front }
assert.equal(pickIndustry(ray, assemblies), 'front', 'The visible front equipment wins over an earlier catalog entry')
front.group.visible = false
assert.equal(pickIndustry(ray, assemblies), 'rear', 'Isolated or hidden equipment is not selected')
front.group.visible = true; front.custom = box(-6)
assert.equal(pickIndustry(ray, assemblies), 'rear', 'Replacement geometry is used instead of the hidden original')
front.environment = box(2)
assert.equal(pickIndustry(ray, assemblies), 'front', 'Associated vessels and equipment scenery are clickable')
assert.equal(pickIndustry(ray, assemblies, box(4)), null, 'Opaque island geometry prevents picking through the ground')
ray.ray.direction.set(1, 0, 0)
assert.equal(pickIndustry(ray, assemblies), null, 'Empty space does not select an industry')
geometry.dispose(); material.dispose()
console.log('PASS 6 industry picking checks')
