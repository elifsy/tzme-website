import fs from 'node:fs/promises'
let helper = (await fs.readFile('scripts/check-j-design.mjs', 'utf8')).split('try{\n  for(let i=0;i<100;i++)')[0]
helper = helper.replace('docs/j-implementation-2026-10-15', 'docs/product-showcase-3d-2026-10-17').replace('port=9225', 'port=9266')
  .replace('database/snapshots/j-browser-profile', 'database/snapshots/three-check-profile')
  .replace("'--disable-gpu'", "'--use-angle=swiftshader','--enable-unsafe-swiftshader'")
  .replace('},20000)', '},60000)')
async function suite() {
  const json = async (url, method = 'GET', body) => { const response = await fetch(origin + url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined }); return { status: response.status, value: response.ok ? await response.json() : null } }
  const original = (await json('/api/product-showcase')).value
  const industries = (await json('/api/industries')).value.filter(industry => industry.status === 'published')
  const products = (await json('/api/products')).value.filter(product => product.status === 'published')
  const active = industries.filter(industry => products.some(product => product.industries?.includes(industry.id)))
  let changed = false, fixtureId = ''
  const webgl = async () => { for (let index = 0; index < 100; index++) { if (await evaluate(`!!document.querySelector('.industrial-viewer.is-ready')`)) return true; await delay(150) } throw Error('WebGL scene did not initialize') }
  const button = async text => { await evaluate(`[...document.querySelectorAll('.industrial-viewer button')].find(button => button.innerText.trim().includes(${JSON.stringify(text)}))?.click()`); await delay(250) }
  const frameHash = async () => {
    const clip = await evaluate(`(()=>{const r=document.querySelector('.industrial-canvas-host canvas').getBoundingClientRect();return {x:Math.max(0,r.x),y:Math.max(0,r.y),width:Math.min(r.width,innerWidth-Math.max(0,r.x)),height:Math.min(r.height,innerHeight-Math.max(0,r.y)),scale:1}})()`)
    return (await call('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: false })).data
  }
  const settle = async () => {
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 20, y: 100 }); await evaluate(`document.activeElement?.blur()`); await delay(300)
    for (let index = 0; index < 100; index++) { if (await evaluate(`document.querySelector('.industrial-viewer')?.getAttribute('aria-busy') === 'false'`)) break; await delay(100) }
    await delay(500)
  }
  // Measure equipment anchors independently of responsive label collision avoidance.
  const positions = async () => evaluate(`Object.fromEntries([...document.querySelectorAll('[data-industry-model]')].map(node=>[node.dataset.industryModel,{x:Number(node.dataset.anchorX ?? parseFloat(node.style.left)),y:Number(node.dataset.anchorY ?? parseFloat(node.style.top))}]))`)
  const matchesInitial = async initial => {
    const current = await positions()
    const offsets = Object.keys(initial).map(key => current[key] ? Math.hypot(current[key].x-initial[key].x,current[key].y-initial[key].y) : Infinity)
    if (Math.max(...offsets) >= .05) console.log('Camera framing offsets: ' + JSON.stringify({ initial, current, offsets }))
    return offsets.every(offset => offset < .05)
  }
  const reset = async () => { await click('.industrial-reset'); await settle() }
  const drag = async (x, y, dx, dy) => { await call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); for (let step = 1; step <= 8; step++) { await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + dx * step / 8, y: y + dy * step / 8, buttons: 1, button: 'left' }); await delay(25) } await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + dx, y: y + dy, button: 'left', clickCount: 1 }); await settle() }
  const allVisible = `(()=>{const nodes=[...document.querySelectorAll('[data-industry-model]')];return nodes.length===${active.length} && nodes.every(node=>{const r=node.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1})})()`
  const noOverlappingLabels = `(()=>{const rects=[...document.querySelectorAll('[data-industry-model]')].filter(node=>node.getClientRects().length).map(node=>node.getBoundingClientRect());return rects.every((a,i)=>rects.slice(i+1).every(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)<1||Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)<1))})()`
  try {
    for (let index = 0; index < 100; index++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break } catch { await delay(100) } }
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
    socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.id && pending.has(message.id)) { const item = pending.get(message.id); pending.delete(message.id); message.error ? item.reject(Error(JSON.stringify(message.error))) : item.resolve(message.result) }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(item => item.value || item.description).join(' ').slice(0, 700))
    })
    await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable'); await width(1680, 1050)
    await navigate('/solutions?admin-preview=1'); await webgl(); await settle()
    await check('A real WebGL2 renderer draws the complete scene', `!!document.querySelector('canvas[data-renderer="webgl2"]')?.getContext('webgl2') && !!document.querySelector('.three-d-ready')`)
    await check('The selected continuous industrial island is the active 3D scene', `document.querySelector('canvas[data-renderer="webgl2"]').dataset.layout === 'industrial-island' && document.querySelectorAll('.industrial-leaders path').length === ${active.length}`)
    await check('Every published industry with products has a model', `document.querySelector('.industrial-viewer').dataset.industries.split(',').length === ${active.length} && document.querySelectorAll('.industrial-model-picker option').length === ${active.length}`)
    await check('All industry hotspots are visible in the initial desktop overview', allVisible)
    await check('Desktop industry labels do not cover each other', noOverlappingLabels)
    await check('Removed labels, roaming, tours, zoom buttons and fullscreen controls are absent', `!document.querySelector('.industrial-topbar,.industrial-movement,.industrial-tour-progress') && !/自由漫游|镜头巡游|放大查看|三维装备示意|三维装备展示/.test(document.querySelector('.industrial-viewer').innerText) && !document.querySelector('[aria-label="放大设备"],[aria-label="缩小设备"]')`)
    await check('Product catalog and all industry filters remain available', `document.querySelectorAll('.hc-card').length === 12 && document.querySelectorAll('[data-industry]').length === ${active.length}`)
    // CDP captures can temporarily expand the layout past the scrollbar; wait
    // for ResizeObserver to restore the normal canvas dimensions afterwards.
    await capture('three-desktop'); await settle()
    const initialFrame = await frameHash()
    const initialPositions = await positions()
    await drag(800, 500, 100, 65)
    await check('Dragging still rotates the actual equipment scene', String(initialFrame !== await frameHash()))
    await reset()
    await check('One reset restores the initial view and equipment positions after rotation', String(await matchesInitial(initialPositions)))
    await button('设备特写'); await settle()
    await check('Individual equipment inspection is retained', `document.querySelector('.industrial-viewer').dataset.mode === 'inspect'`)
    const beforeInspect = await frameHash(); await drag(1160, 430, 120, -110)
    await check('Equipment inspection retains unconstrained rotation', String(beforeInspect !== await frameHash()))
    await capture('three-equipment')
    const modelFrames = new Set()
    for (const industry of active) {
      await evaluate(`(()=>{const select=document.querySelector('[aria-label="选择查看设备"]');select.value=${JSON.stringify(industry.id)};select.dispatchEvent(new Event('change',{bubbles:true}))})()`); await settle()
      modelFrames.add(await frameHash())
      await check(`The ${industry.id} model supports individual inspection`, `document.querySelector('[aria-label="选择查看设备"]').value === ${JSON.stringify(industry.id)} && document.querySelector('.industrial-viewer').dataset.mode === 'inspect'`)
    }
    await check('Industry selections render distinct equipment models', String(modelFrames.size === active.length))
    await reset()
    await check('Reset exits isolated inspection and reveals every industry', `document.querySelector('.industrial-viewer').dataset.mode === 'orbit' && document.querySelector('.industrial-viewer').dataset.overview === 'true' && ${allVisible}`)
    for (const industry of active) {
      await click(`[data-industry-model="${industry.id}"]`); await settle()
      const count = products.filter(product => product.industries?.includes(industry.id)).length
      await check(`The ${industry.id} 3D label selects its industry and filters its products without a popup`, `new URLSearchParams(location.search).get('industry') === '${industry.id}' && !!document.querySelector('.industrial-viewer.is-ready') && document.querySelector('[data-industry="${industry.id}"]').getAttribute('aria-pressed') === 'true' && document.querySelector('[data-industry-model="${industry.id}"]').getAttribute('aria-pressed') === 'true' && !document.querySelector('.scene-product-card') && document.querySelectorAll('.hc-card').length === ${Math.min(12, count)} && document.querySelector('.catalog-result-count').textContent.includes('${count}')`)
      await reset()
      await check(`One reset returns from ${industry.id} to the complete initial state`, `!new URLSearchParams(location.search).has('industry') && document.querySelector('.industrial-viewer').dataset.overview === 'true' && document.querySelectorAll('.hc-card').length === 12 && ${allVisible}`)
    }
    const category = products.find(product => product.id === 'grab-ship-unloader').categoryEn
    await navigate('/solutions?admin-preview=1&industry=ports&cat=' + encodeURIComponent(category) + '&q=unloader&limit=24'); await webgl(); await settle()
    await click('[data-industry-model="ports"]'); await settle()
    await check('Repeated label selection retains the industry and existing category/search filters without a popup', `new URLSearchParams(location.search).get('industry') === 'ports' && new URLSearchParams(location.search).get('q') === 'unloader' && new URLSearchParams(location.search).has('cat') && !document.querySelector('.scene-product-card') && !!document.querySelector('.hc-card[href*="/solutions/grab-ship-unloader"]')`)
    await reset()
    await check('Reset clears industry, category, search, pagination and open details together', `['industry','cat','q','limit'].every(key=>!new URLSearchParams(location.search).has(key)) && !document.querySelector('.scene-product-card') && !document.querySelector('.catalog-active-filters') && document.querySelectorAll('.hc-card').length===12 && new URLSearchParams(location.search).get('admin-preview')==='1'`)
    await check('Reset after filtering restores the original camera framing', String(await matchesInitial(initialPositions)))
    await capture('three-reset')
    await width(390, 844); await navigate('/solutions?admin-preview=1'); await webgl(); await settle()
    await check('All industry models and labels also fit the mobile overview', `${allVisible} && document.documentElement.scrollWidth <= innerWidth + 1`)
    await check('Mobile industry labels do not cover each other', noOverlappingLabels)
    await capture('three-mobile'); await capture('three-mobile-full', true)
    await click('[data-industry-model="environmental"]'); await settle()
    await check('A mobile 3D label also selects the matching industry filter without a popup', `new URLSearchParams(location.search).get('industry') === 'environmental' && document.querySelector('[data-industry="environmental"]').getAttribute('aria-pressed') === 'true' && document.querySelector('#catalog-heading').textContent === '环保工程装备' && !document.querySelector('.scene-product-card')`)
    await reset()
    await check('A single reset restores the complete mobile overview', `!new URLSearchParams(location.search).has('industry') && ${allVisible}`)
    await width(1440, 1000); await navigate('/admin/product-showcase?admin-preview=1'); await delay(800)
    await check('Backend offers model replacements for all populated industries and no tour settings', `document.querySelectorAll('.model-upload').length === ${active.length} && !/镜头巡游时长|三维旋转与漫游/.test(document.querySelector('.product-showcase-manager').innerText)`)
    await capture('three-admin')
    const fixture = await evaluate(`(async()=>{const THREE=await import('/node_modules/three/build/three.module.js');const {GLTFExporter}=await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js');const scene=new THREE.Scene();scene.add(new THREE.Mesh(new THREE.BoxGeometry(1,2,1),new THREE.MeshStandardMaterial({color:0x087f91})));const bytes=await new GLTFExporter().parseAsync(scene,{binary:true});let encoded='';for(const byte of new Uint8Array(bytes))encoded+=String.fromCharCode(byte);return btoa(encoded)})()`)
    const upload = new FormData(); upload.append('file', new Blob([Buffer.from(fixture, 'base64')], { type: 'model/gltf-binary' }), 'replacement-test.glb')
    const uploaded = await fetch(origin + '/api/uploads/models', { method: 'POST', body: upload })
    if (uploaded.status !== 201) throw Error('GLB fixture upload was rejected: ' + uploaded.status)
    const fixtureUrl = (await uploaded.json()).url; fixtureId = fixtureUrl.split('/').at(-1)
    await check('A self-contained GLB remains uploadable', String(/^\/api\/uploads\/models\/[0-9a-f-]{36}\.glb$/.test(fixtureUrl)))
    const replacement = structuredClone(original); delete replacement.overview.threeD.tourDuration
    replacement.overview.threeD.models.testing = fixtureUrl
    const saved = await json('/api/product-showcase', 'PUT', replacement)
    if (saved.status !== 200) throw Error('New industry model assignment failed: ' + saved.status)
    changed = true
    await navigate('/solutions?admin-preview=1&industry=testing'); await webgl(); await settle()
    await check('A newly added industry can load its configured replacement GLB', `document.querySelector('.industrial-viewer.is-ready')?.dataset.customModels.includes('testing') && !document.querySelector('.industrial-model-message')`)
    const invalidConfig = structuredClone(replacement); invalidConfig.overview.threeD.models.testing = 'https://example.com/model.glb'
    await check('External model resources remain rejected', String((await json('/api/product-showcase', 'PUT', invalidConfig)).status === 400))
    const unknown = structuredClone(replacement); unknown.overview.threeD.models['missing-industry'] = ''
    await check('Unknown model industry keys are rejected', String((await json('/api/product-showcase', 'PUT', unknown)).status === 400))
    await json('/api/product-showcase', 'PUT', original); changed = false
    await navigate('/contact?admin-preview=1'); await check('Leaving the scene cleans up its canvas', `document.querySelectorAll('.industrial-viewer canvas').length === 0 && !!document.querySelector('.contact-hero')`)
    await navigate('/solutions?admin-preview=1'); await webgl(); await settle()
    await check('Returning creates a single fresh equipment scene', `document.querySelectorAll('.industrial-viewer canvas').length === 1`)
    await evaluate(`document.querySelector('canvas[data-renderer="webgl2"]').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`); await delay(500)
    await check('A lost WebGL context retains artwork and the product catalog', `!document.querySelector('.industrial-viewer') && getComputedStyle(document.querySelector('.equipment-scene-art')).opacity === '1' && document.querySelectorAll('.hc-card').length === 12`)
    const fallback = structuredClone(original); fallback.overview.threeD.enabled = false
    await json('/api/product-showcase', 'PUT', fallback); changed = true
    await navigate('/solutions?admin-preview=1'); await delay(300)
    await check('Disabling 3D still restores configured artwork and hotspots', `!document.querySelector('.industrial-viewer') && document.querySelector('.equipment-scene-art').naturalWidth > 0 && document.querySelectorAll('.scene-hotspot').length === ${original.overview.hotspots.length}`)
    await json('/api/product-showcase', 'PUT', original); changed = false
  } catch (error) { failures.push(error.stack) }
  finally {
    if (changed) { const restored = await json('/api/product-showcase', 'PUT', original); if (restored.status !== 200) failures.push('Original settings could not be restored') }
    if (fixtureId && /^[0-9a-f-]{36}\.glb$/.test(fixtureId)) { try { await fs.unlink('server/uploads/models/' + fixtureId) } catch {} }
    if (errors.length) failures.push('Browser errors: ' + JSON.stringify(errors))
    await fs.writeFile(base + '/report.json', JSON.stringify({ at: new Date().toISOString(), checks, errors, failures, shots }, null, 2))
    console.log(JSON.stringify({ checks: checks.length, failures, errors: errors.length })); if (failures.length) process.exitCode = 1
    try { await call('Browser.close') } catch {} socket?.close(); browser.kill()
  }
}
await fs.mkdir('docs/product-showcase-3d-2026-10-17', { recursive: true })
await fs.writeFile('docs/generated-three-check.mjs', helper + '\nawait (' + suite.toString() + ')()')
await import('../docs/generated-three-check.mjs')
