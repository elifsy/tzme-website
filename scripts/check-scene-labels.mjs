import test from 'node:test'
import assert from 'node:assert/strict'
import { createSceneLabels } from '../src/three/sceneLabels.js'

const viewport = { width: 1100, height: 650 }
const points = [
  { industryId: 'ports', productId: 'unloader', label: '港口' },
  { industryId: 'mining', productId: 'stacker', label: '矿山' },
]
const anchor = (x, y, visible = true) => ({ x, y, visible })
const update = (layout, anchors, now, options = {}) => layout.update(points, anchors, viewport, options, now)

test('labels keep their placement when projected heights repeatedly cross', () => {
  const layout = createSceneLabels()
  let previous
  for (let frame = 0; frame < 100; frame++) {
    const noise = frame % 2 ? .02 : -.02
    const { labels } = update(layout, { ports: anchor(50, 50 + noise), mining: anchor(52, 50 - noise) }, frame * 16)
    if (previous) for (let i = 0; i < labels.length; i++) {
      assert.equal(labels[i].id, previous[i].id)
      assert.ok(Math.hypot(labels[i].x - previous[i].x, labels[i].y - previous[i].y) < .1)
    }
    previous = labels
  }
})

test('camera motion keeps leader endpoints exactly on the current model projection', () => {
  const layout = createSceneLabels()
  for (let frame = 0; frame < 50; frame++) {
    const ports = anchor(25 + frame * .5, 40 + frame * .1)
    const { labels } = update(layout, { ports, mining: anchor(80, 60) }, frame * 16)
    assert.deepEqual(labels[0].target, { x: ports.x, y: ports.y })
    assert.ok(Math.abs(labels[0].x - ports.x) < .001)
    assert.ok(Math.abs(labels[0].y - (ports.y - 2.2)) < .001)
  }
})

test('collision changes interpolate instead of jumping and stop scheduling when settled', () => {
  const layout = createSceneLabels()
  const separated = { ports: anchor(35, 40), mining: anchor(60, 40) }
  update(layout, separated, 0)
  const crowded = { ports: anchor(60, 40), mining: anchor(60, 40) }
  const first = update(layout, crowded, 300)
  const exact = update(createSceneLabels(), crowded, 300, { reducedMotion: true })
  assert.equal(first.moving, true)
  assert.ok(Math.hypot(first.labels[1].x - 60, first.labels[1].y - 37.8) < Math.hypot(exact.labels[1].x - 60, exact.labels[1].y - 37.8))
  let settled
  for (let frame = 1; frame <= 100; frame++) settled = update(layout, crowded, 300 + frame * 16)
  assert.equal(settled.moving, false)
  assert.deepEqual(settled.labels.map(label => [label.x, label.y]), exact.labels.map(label => [label.x, label.y]))
})

test('offscreen and invalid anchors freeze safely, and reappearing labels use the new position', () => {
  const layout = createSceneLabels()
  const first = update(layout, { ports: anchor(50, 50) }, 0).labels[0]
  for (const ports of [anchor(900, -900, false), anchor(Infinity, NaN), undefined]) {
    const label = update(layout, { ports }, 16).labels[0]
    assert.equal(label.visible, false)
    assert.deepEqual([label.x, label.y, label.target], [first.x, first.y, first.target])
  }
  const shown = update(layout, { ports: anchor(30, 30) }, 64).labels[0]
  assert.equal(shown.visible, true)
  assert.deepEqual(shown.target, { x: 30, y: 30 })
  assert.equal(shown.x, 30)
})

test('zero coordinates stay valid, product identities survive reorder, and clear resets history', () => {
  const layout = createSceneLabels(), anchors = { ports: anchor(0, 0), mining: anchor(60, 60) }
  const first = update(layout, anchors, 0).labels
  assert.equal(first[0].visible, true)
  assert.deepEqual(first[0].target, { x: 0, y: 0 })
  const reordered = layout.update([...points].reverse(), anchors, viewport, {}, 16).labels
  assert.equal(first[0].id, reordered[1].id)
  layout.clear()
  assert.deepEqual(update(layout, anchors, 0), update(createSceneLabels(), anchors, 0))
})

test('reduced motion and mobile label spacing settle without an animation loop', () => {
  const layout = createSceneLabels()
  const anchors = { ports: anchor(50, 40), mining: anchor(50, 40) }
  const result = layout.update(points, anchors, { width: 390, height: 420 }, { compact: true, reducedMotion: true }, 0)
  assert.equal(result.moving, false)
  assert.ok(result.labels.every(label => Number.isFinite(label.x) && Number.isFinite(label.y)))
  assert.ok(Math.hypot(result.labels[0].x - result.labels[1].x, result.labels[0].y - result.labels[1].y) > 1)
})

test('viewport edges and temporary small resize measurements never push labels outside the scene', () => {
  const layout = createSceneLabels()
  for (let frame = 0; frame < 100; frame++) {
    const anchors = { ports: anchor(frame % 2 ? -3 : 103, frame % 2 ? 103 : -3), mining: anchor(50, 50) }
    const size = frame % 3 ? viewport : { width: 1, height: 1 }
    const { labels } = layout.update(points, anchors, size, {}, frame * 16)
    for (const label of labels) {
      assert.ok(label.x >= 0 && label.x <= 100)
      assert.ok(label.y >= 0 && label.y <= 100)
    }
  }
})
