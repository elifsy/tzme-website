import fs from 'node:fs/promises'

const source = await fs.readFile('scripts/check-j-design.mjs', 'utf8')
const helper = source.split('try{\n  for(let i=0;i<100;i++)')[0]
  .replace('docs/j-implementation-2026-10-15', 'docs/three-scroll-2026-10-24')
  .replace('port=9225', 'port=9403')
  .replace('database/snapshots/j-browser-profile', 'database/snapshots/three-scroll-profile')
  .replace("'--disable-gpu'", "'--use-angle=swiftshader','--enable-unsafe-swiftshader'")
  .replace('},20000)', '},60000)')

async function suite() {
  const zoomIn = '[aria-label="放大三维场景"]', zoomOut = '[aria-label="缩小三维场景"]'
  const positions = () => evaluate(`Object.fromEntries([...document.querySelectorAll('[data-industry-model]')].map(n=>[n.dataset.industryModel,[Number(n.dataset.anchorX),Number(n.dataset.anchorY)]]))`)
  const difference = (a, b) => Math.max(...Object.keys(a).map(key => b[key] ? Math.hypot(a[key][0] - b[key][0], a[key][1] - b[key][1]) : Infinity))
  const radius = points => Object.values(points).reduce((sum, [x, y]) => sum + Math.hypot(x - 50, y - 50), 0)
  const settle = async () => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(`document.querySelector('.industrial-viewer.is-ready')?.getAttribute('aria-busy')==='false'`)) { await delay(200); return }
      await delay(100)
    }
    throw Error('The 3D scene did not become ready')
  }
  const showScene = async () => { await evaluate(`document.querySelector('.industrial-viewer').scrollIntoView({block:'center',behavior:'instant'})`); await delay(200) }
  const wheelPoint = () => evaluate(`(()=>{const c=document.querySelector('.industrial-canvas-host canvas'),r=c.getBoundingClientRect();for(const [px,py] of [[.5,.5],[.6,.65],[.4,.7],[.75,.5]]){const x=r.left+r.width*px,y=r.top+r.height*py;if(y>120&&y<innerHeight-30&&x>0&&x<innerWidth&&document.elementFromPoint(x,y)===c)return{x,y}}throw Error('No unobstructed canvas position for the native wheel test')})()`)
  const picture = async name => {
    const clip = await evaluate(`(()=>{const r=document.querySelector('.equipment-scene').getBoundingClientRect(),x=Math.max(0,r.left);return{x,y:r.top+scrollY,width:Math.min(r.right,innerWidth)-x,height:r.height,scale:1}})()`)
    const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip })
    await fs.writeFile(base + '/screenshots/' + name + '.png', Buffer.from(shot.data, 'base64'))
  }
  try {
    for (let i = 0; i < 100; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break } catch { await delay(100) } }
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
    socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
    socket.addEventListener('message', event => {
      const d = JSON.parse(event.data)
      if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.reject(Error(JSON.stringify(d.error))) : p.resolve(d.result) }
      if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails)
      if (d.method === 'Network.responseReceived' && d.params.response.status >= 400) errors.push({ url: d.params.response.url, status: d.params.response.status })
    })
    await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable'); await call('Page.bringToFront')
    await call('Emulation.setFocusEmulationEnabled', { enabled: true })
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
    await width(1440, 1000); await navigate('/solutions?admin-preview=1'); await settle()
    const initial = await positions()
    await check('Separate zoom controls and reset are available', `document.querySelectorAll('.industrial-zoom button').length===2&&!!document.querySelector('.industrial-view-actions .industrial-reset')`)
    for (const mode of ['orbit', 'inspect']) {
      if (mode === 'inspect') { await click('.industrial-mode-buttons button:nth-child(2)'); await settle() }
      await showScene()
      await check(mode + ': wheel default action is not cancelled', `document.querySelector('.industrial-canvas-host canvas').dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:120}))`)
      const beforeWheel = await positions(), beforeScroll = await evaluate('scrollY'), point = await wheelPoint()
      await call('Input.dispatchMouseEvent', { type: 'mouseWheel', ...point, deltaX: 0, deltaY: 220 }); await delay(500)
      const afterScroll = await evaluate('scrollY')
      await check(mode + ': a real wheel gesture over the model scrolls the webpage', String(afterScroll > beforeScroll + 80))
      await check(mode + ': wheel scrolling leaves the camera unchanged', String(difference(beforeWheel, await positions()) < .05))
      await showScene()
      const beforeZoom = await positions()
      const selected = await evaluate(`document.querySelector('.industrial-model-picker select').value`)
      // Hidden equipment can project behind the inspection camera, so only its
      // selected equipment anchor is a meaningful size reference in that mode.
      const displayedRadius = points => radius(mode === 'inspect' ? { [selected]: points[selected] } : points)
      await click(zoomIn); await settle()
      const enlarged = await positions()
      await check(mode + ': plus enlarges the model', String(displayedRadius(enlarged) > displayedRadius(beforeZoom) * 1.05))
      await click(zoomOut); await settle()
      await check(mode + ': minus reverses the zoom step', String(difference(beforeZoom, await positions()) < .05))
      await check(mode + ': zoom keeps the chosen viewing mode', `document.querySelector('.industrial-viewer').dataset.mode===${JSON.stringify(mode)}&&!new URLSearchParams(location.search).has('industry')`)
      await evaluate(`document.querySelector('.industrial-canvas-host canvas').focus({preventScroll:true})`)
      await call('Input.dispatchKeyEvent', { type: 'keyDown', key: '+', code: 'Equal', windowsVirtualKeyCode: 187 })
      await call('Input.dispatchKeyEvent', { type: 'keyUp', key: '+', code: 'Equal', windowsVirtualKeyCode: 187 }); await settle()
      await check(mode + ': keyboard plus still zooms', String(displayedRadius(await positions()) > displayedRadius(beforeZoom) * 1.05))
      await call('Input.dispatchKeyEvent', { type: 'keyDown', key: '-', code: 'Minus', windowsVirtualKeyCode: 189 })
      await call('Input.dispatchKeyEvent', { type: 'keyUp', key: '-', code: 'Minus', windowsVirtualKeyCode: 189 }); await settle()
      await check(mode + ': keyboard minus reverses the step', String(difference(beforeZoom, await positions()) < .05))
    }
    await click('.industrial-reset'); await settle()
    await check('Reset restores the original panorama after inspection and zoom', String(difference(initial, await positions()) < .05))
    await check('Reset retains the existing filter and motion reset behavior', `document.querySelector('.industrial-viewer').dataset.overview==='true'&&document.querySelector('.industrial-viewer').dataset.animatedIndustry===''`)
    await showScene(); await picture('desktop')
    await width(390, 844); await navigate('/solutions?admin-preview=1'); await settle(); await showScene()
    await check('Mobile zoom controls fit and provide usable targets', `(()=>{const b=[...document.querySelectorAll('.industrial-view-actions button')];return b.length===3&&b.every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.width>=34&&r.height>=34})&&document.documentElement.scrollWidth<=innerWidth+1})()`)
    const mobile = await positions(); await click(zoomIn); await settle()
    await check('Mobile plus also enlarges the model', String(radius(await positions()) > radius(mobile) * 1.05))
    await click(zoomOut); await settle()
    await check('Mobile minus reverses its zoom step', String(difference(mobile, await positions()) < .05))
    await picture('mobile')
    const viewportShot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
    await fs.writeFile(base+'/screenshots/mobile-viewport.png',Buffer.from(viewportShot.data,'base64'))
    await check('Canvas help no longer suggests using the wheel to zoom', `document.querySelector('.industrial-canvas-host canvas').getAttribute('aria-label').includes('滚轮滚动网页')&&!document.querySelector('.industrial-hint').textContent.includes('滚轮或双指缩放')`)
    await check('No browser exceptions or failed requests', String(errors.length === 0))
    await fs.writeFile(base + '/report.json', JSON.stringify({ checks, errors, failures }, null, 2))
    console.log(JSON.stringify({ checks: checks.length, errors, failures })); if (failures.length) process.exitCode = 1
  } catch (error) { console.error(error.stack); process.exitCode = 1 }
  finally { try { await call('Browser.close') } catch {} socket?.close(); browser.kill() }
}
await fs.mkdir('docs/three-scroll-2026-10-24', { recursive: true })
await fs.writeFile('docs/three-scroll-2026-10-24/generated-check.mjs', helper + '\nawait (' + suite.toString() + ')()')
await import('../docs/three-scroll-2026-10-24/generated-check.mjs')
