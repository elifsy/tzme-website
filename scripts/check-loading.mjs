import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const manifest = JSON.parse(fs.readFileSync('src/data/imageVariants.json', 'utf8'))
const imageModule = fs.readFileSync('src/utils/responsiveImages.js', 'utf8').replace(/import images from [^\n]+\n/, `const images = ${JSON.stringify(manifest)}\n`)
const { displayImage, responsiveImage } = await import('data:text/javascript;base64,' + Buffer.from(imageModule).toString('base64'))
test('every responsive image has existing size-ordered assets with the original aspect ratio', () => {
  for (const [source, entry] of Object.entries(manifest)) {
    assert.ok(fs.existsSync('public' + source), source)
    let previous = 0
    for (const item of entry.variants) {
      assert.ok(item.width > previous && item.width <= entry.width, source)
      assert.equal(fs.statSync('public' + item.src).size, item.bytes, item.src)
      assert.ok(Math.abs(item.height - entry.height * item.width / entry.width) < 1, source)
      previous = item.width
    }
  }
})
test('the shared logo and manufacturing photo avoid their oversized originals', () => {
  const logo = displayImage('/assets/tzme-j/brand/official-mark.jpg', 160)
  const factory = displayImage('/assets/tzme-j/factories/greenland-aerial.jpg')
  assert.ok(fs.statSync('public' + logo).size < 15000)
  assert.ok(fs.statSync('public' + factory).size < 500000)
})
test('responsive markup preserves unmanaged uploads and uses browser-selectable widths', () => {
  const upload = '/api/uploads/images/11111111-1111-1111-1111-111111111111.png'
  assert.equal(displayImage(upload), upload)
  assert.equal(responsiveImage(upload).srcset, undefined)
  const data = responsiveImage('/assets/tzme-j/factories/greenland-aerial.jpg', '50vw')
  assert.equal(data.sizes, '50vw'); assert.match(data.srcset, /480w,.*960w,.*1600w/)
})

const { apiRequest } = await import('../src/services/api.js')
globalThis.document = { getElementById: () => null }
globalThis.location = { pathname: '/' }
let calls = 0
globalThis.fetch = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 15)); return new Response(JSON.stringify({ call: calls }), { headers: { 'Content-Type': 'application/json' } }) }
test('concurrent public reads share one request but later reads remain fresh', async () => {
  calls = 0
  const [first, second] = await Promise.all([apiRequest('/api/performance-test'), apiRequest('/api/performance-test')])
  assert.equal(calls, 1); assert.deepEqual(first, second)
  await apiRequest('/api/performance-test'); assert.equal(calls, 2)
})
test('admin refreshes and independently abortable requests are not merged', async () => {
  calls = 0; location.pathname = '/admin/products'
  await Promise.all([apiRequest('/api/performance-admin'), apiRequest('/api/performance-admin')]); assert.equal(calls, 2)
  calls = 0; location.pathname = '/'
  await Promise.all([apiRequest('/api/performance-abort', { signal: new AbortController().signal }), apiRequest('/api/performance-abort', { signal: new AbortController().signal })]); assert.equal(calls, 2)
})
