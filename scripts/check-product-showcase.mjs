// Browser integration checks against the real local Vue app and Java/MySQL API.
// The settings save check restores the original configuration in finally.
import fs from 'node:fs/promises'
let helper = (await fs.readFile('scripts/check-j-design.mjs', 'utf8')).split('try{\n  for(let i=0;i<100;i++)')[0]
helper = helper.replace('docs/j-implementation-2026-10-15', 'docs/product-showcase-2026-10-17')
  .replace('port=9225', 'port=9263').replace('database/snapshots/j-browser-profile', 'database/snapshots/product-showcase-check-profile').replace("'--disable-gpu'", "'--use-angle=swiftshader','--enable-unsafe-swiftshader'")
  .replace("},20000)", "},60000)")

async function suite() {
  const api = async (url, method = 'GET', body) => {
    const response = await fetch(origin + url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
    return { status: response.status, body: response.status === 200 ? await response.json() : null }
  }
  const original = (await api('/api/product-showcase')).body
  const productData = (await api('/api/products')).body.filter(item => item.status === 'published')
  const industryData = (await api('/api/industries')).body.filter(item => item.status === 'published' && productData.some(product => product.industries?.includes(item.id)))
  const writes = [], validation = []
  let settingsWritten = false, savedSettings
  const marker = original.overview.title + '\n保存验证'
  const waitFor = async expression => {
    for (let attempt = 0; attempt < 120; attempt++) { if (await evaluate(expression)) return; await delay(100) }
    throw Error('Timed out waiting for ' + expression + ' on ' + await evaluate('location.href'))
  }
  try {
    for (let i = 0; i < 100; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break } catch { await delay(100) } }
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
    socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.id && pending.has(message.id)) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result) }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
      if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) errors.push({ url: message.params.response.url, status: message.params.response.status })
      if (message.method === 'Network.requestWillBeSent' && !['GET', 'HEAD', 'OPTIONS'].includes(message.params.request.method)) writes.push({ url: message.params.request.url, method: message.params.request.method })
    })
    await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable'); await width(1680, 1050)
    await navigate('/solutions?admin-preview=1'); await delay(1350)
    await check('Hero copy is loaded from the saved backend configuration', `document.querySelector('#products-page-title').innerText === ${JSON.stringify(original.overview.title)}`)
    await check('Optimized transparent scene loads', `document.querySelector('.equipment-scene-art').naturalWidth > 1000 && document.querySelector('.equipment-scene-art').src.endsWith('.webp')`)
    await check('All industries with published products are available', `document.querySelectorAll('[data-industry]').length === ${industryData.length}`)
    await check('Catalog starts with 12 real products and correct total', `document.querySelectorAll('.hc-card').length === 12 && document.querySelector('.catalog-result-count').textContent.includes('${productData.length}')`)
    await check('Backend priority order is respected', `document.querySelector('.hc-card').pathname === '/solutions/${original.overview.featuredProducts[0]}'`)
    await capture('products-desktop'); await capture('products-full', true)
    if (await evaluate(`!!document.querySelector('.industrial-viewer.is-ready')`)) {
      const key = original.overview.hotspots[0].industryId
      await click(`[data-industry-model="${key}"]`)
      await waitFor(`new URLSearchParams(location.search).get('industry') === ${JSON.stringify(key)}`)
      await check('A 3D label selects the matching industry filter without opening a product popup', `document.querySelector('[data-industry="${key}"]').getAttribute('aria-pressed') === 'true' && !document.querySelector('.scene-product-card') && document.querySelectorAll('.hc-card').length > 0`)
      await capture('products-hotspot')
      await click('.industrial-reset')
      await waitFor(`!new URLSearchParams(location.search).has('industry') && document.querySelectorAll('.hc-card').length === 12`)
      await check('Reset restores all products after selecting a 3D label', `!document.querySelector('.scene-product-card') && document.querySelector('.showcase-industries button').getAttribute('aria-pressed') === 'true'`)
    } else {
      await click('[data-hotspot-index="0"]')
      await check('An image hotspot shows its linked real product', `document.querySelector('.scene-product-card strong').textContent === ${JSON.stringify(productData.find(item => item.id === original.overview.hotspots[0].productId).titleZh)}`)
      await capture('products-hotspot')
      await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }); await delay(250)
      await check('Escape closes the image hotspot and restores keyboard focus', `!document.querySelector('.scene-product-card') && document.activeElement?.dataset.hotspotIndex === '0'`)
    }
    const fine = await evaluate(`matchMedia('(hover: hover) and (pointer: fine) and (min-width: 701px)').matches`)
    if (fine) {
      if (await evaluate(`!!document.querySelector('.industrial-viewer.is-ready')`)) {
        const before = (await call('Page.captureScreenshot', { format: 'png' })).data
        await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: 1220, y: 450, button: 'left', clickCount: 1 })
        await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1340, y: 410, buttons: 1, button: 'left' })
        await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 1340, y: 410, button: 'left', clickCount: 1 }); await delay(350)
        await check('Desktop scene reacts to dragging', String(before !== (await call('Page.captureScreenshot', { format: 'png' })).data))
      } else {
        await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1200, y: 300 }); await delay(150)
        await check('Desktop scene reacts to pointer movement', `parseFloat(document.querySelector('.equipment-scene').style.getPropertyValue('--scene-x')) !== 0`)
      }
    }
    for (const item of industryData) {
      await click(`[data-industry="${item.id}"]`); await delay(260)
      const count = productData.filter(product => product.industries?.includes(item.id)).length
      await check(`${item.titleZh}: industry selection updates URL, heading and product count`, `new URLSearchParams(location.search).get('industry') === '${item.id}' && document.querySelector('#catalog-heading').textContent === '${item.titleZh}装备' && document.querySelector('.catalog-result-count').textContent.includes('${count}')`)
      await check(`${item.titleZh}: related image is available`, `document.querySelector('.equipment-scene-art')?.naturalWidth > 0 && !document.querySelector('.image-unavailable')`)
    }
    await navigate('/solutions?admin-preview=1&industry=ports')
    const portCategory = productData.find(item => item.industries?.includes('ports')).categoryEn
    await evaluate(`Array.from(document.querySelectorAll('.equipment-categories button')).find(button => button.textContent.trim() === ${JSON.stringify(productData.find(item => item.categoryEn === portCategory).categoryZh)})?.click()`); await delay(300)
    const combinedCount = productData.filter(item => item.industries?.includes('ports') && item.categoryEn === portCategory).length
    await check('Category and industry filters combine', `new URLSearchParams(location.search).get('cat') === ${JSON.stringify(portCategory)} && document.querySelector('.catalog-result-count').textContent.includes('${combinedCount}')`)
    await input('#product-search', 'no-such-product-zz')
    await check('Search combines with filters and provides an empty state', `document.querySelectorAll('.hc-card').length === 0 && !!document.querySelector('.el-empty') && location.search.includes('industry=ports')`)
    await click('.product-filter-empty button'); await delay(400)
    await check('Clear filters restores the full catalog', `!new URLSearchParams(location.search).has('industry') && !new URLSearchParams(location.search).has('cat') && !new URLSearchParams(location.search).has('q') && document.querySelectorAll('.hc-card').length === 12`)
    await click('.category-expand')
    const categoryCount = new Set(productData.map(item => item.categoryEn || item.category)).size
    await check('Every populated product category can be expanded', `document.querySelectorAll('.equipment-categories [aria-pressed]').length === ${categoryCount + 1}`)
    await click('.catalog-more button')
    await check('More products expands the list and retains state in the URL', `document.querySelectorAll('.hc-card').length === 24 && new URLSearchParams(location.search).get('limit') === '24'`)
    const returnPath = await evaluate('location.pathname + location.search')
    await click('.hc-card'); await waitFor(`!!document.querySelector('.product-detail-specs') && !!document.querySelector('.j-detail-photo img')`)
    await check('Real product detail still loads', `!!document.querySelector('.product-detail-specs') && !!document.querySelector('.j-detail-photo img')`)
    await click('.j-detail-back'); await waitFor(`location.pathname + location.search === ${JSON.stringify(returnPath)} && document.querySelectorAll('.hc-card').length === 24`)
    await check('Returning from detail restores the visible count and filters', `location.pathname + location.search === ${JSON.stringify(returnPath)} && document.querySelectorAll('.hc-card').length === 24`)
    while (await evaluate(`!!document.querySelector('.catalog-more button')`)) await click('.catalog-more button')
    await check('All published products remain accessible', `document.querySelectorAll('.hc-card').length === ${productData.length} && new Set([...document.querySelectorAll('.hc-card')].map(a => a.pathname)).size === ${productData.length}`)
    for (const viewport of [320, 360, 390, 414, 700, 768, 1024, 1440, 1680, 1920]) {
      await width(viewport, 844); await navigate('/solutions?admin-preview=1'); await delay(200)
      await check(`Product center fits viewport ${viewport}`, 'document.documentElement.scrollWidth <= innerWidth + 1')
      await check(`All industry buttons remain reachable at ${viewport}`, `[...document.querySelectorAll('.showcase-industries button')].every(button => { const rect = button.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth + 1 && rect.width >= 40 })`)
      if (viewport === 390) { await delay(1000); await capture('products-mobile'); await capture('products-mobile-full', true) }
    }
    await width(390, 844); await navigate('/solutions?admin-preview=1&industry=metallurgy'); await delay(300)
    await check('Mobile industry scene fits and keeps product links', `document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('.has-three-d') && document.querySelectorAll('.showcase-related a').length > 0`)
    await check('Mobile navigation remains language-button free', `!document.querySelector('.hc-nav .hc-lang') || getComputedStyle(document.querySelector('.hc-nav .hc-lang')).display === 'none'`)
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
    await navigate('/solutions?admin-preview=1'); await delay(200)
    await check('Reduced-motion preference keeps the initial view static', `document.querySelector('.industrial-viewer') ? document.querySelector('.industrial-viewer').dataset.overview === 'true' : getComputedStyle(document.querySelector('.equipment-scene-art')).opacity === '1'`)
    await call('Emulation.setEmulatedMedia', { features: [] })
    await width(1440, 1000); await navigate('/admin/product-showcase?admin-preview=1'); await delay(900)
    await check('Backend editor and its preview load', `!!document.querySelector('.product-showcase-manager textarea') && !!document.querySelector('.admin-preview-iframe')?.contentDocument?.querySelector('.product-showcase')`)
    await capture('admin-showcase')
    await input('.product-showcase-manager textarea', marker)
    await check('Unsaved title changes update the real preview', `document.querySelector('.admin-preview-iframe').contentDocument.querySelector('#products-page-title').innerText === ${JSON.stringify(marker)} && !!document.querySelector('.admin-save-dot.is-dirty')`)
    await click('.admin-save-bar button'); await delay(600)
    savedSettings = (await api('/api/product-showcase')).body
    settingsWritten = savedSettings?.overview.title === marker
    await check('Backend save persists the configured title', `${settingsWritten} && !document.querySelector('.admin-save-dot.is-dirty')`)
    if (!settingsWritten) throw Error('The editor save did not persist')
    const restore = await api('/api/product-showcase', 'PUT', original)
    if (restore.status !== 200) throw Error('Could not restore original scene settings')
    settingsWritten = false
    await navigate('/solutions?admin-preview=1'); await delay(350)
    await check('Saved backend content is rendered after reload', `document.querySelector('#products-page-title').innerText === ${JSON.stringify(original.overview.title)}`)
    await navigate('/admin/product-showcase?industry=ports&admin-preview=1'); await delay(650)
    await check('Industry configuration deep link opens the matching preview', `document.querySelector('.showcase-industry-picker')?.innerText.includes('港口') && document.querySelector('.admin-preview-iframe').contentDocument.querySelector('#products-page-title').innerText === ${JSON.stringify(original.industries.ports.title)}`)
    await input('.product-showcase-manager textarea', original.industries.ports.title + '\n未保存内容')
    await click('.showcase-editor-toolbar a[href="/admin/products"]')
    await check('Unsaved industry edits are protected during navigation', `!!document.querySelector('.el-message-box') && location.pathname === '/admin/product-showcase'`)
    await click('.el-message-box__btns .el-button:not(.el-button--primary)')
    await input('.product-showcase-manager textarea', original.industries.ports.title)
    await check('Restoring original form content clears the unsaved state', `!document.querySelector('.admin-save-dot.is-dirty') && document.querySelector('.admin-save-bar button').disabled`)
    const custom = structuredClone(original)
    custom.industries.ports = { ...custom.industries.ports, title: '面向港口现场，\n做好制造与交付。', image: custom.overview.image, imageAlt: '配置验证场景', presentation: 'scene', hotspots: [{ label: '卸船装备', industryId: 'ports', productId: 'grab-ship-unloader', x: 61, y: 52 }] }
    const customSaved = await api('/api/product-showcase', 'PUT', custom)
    if (customSaved.status !== 200) throw Error('Custom industry scene was not saved')
    settingsWritten = true; savedSettings = customSaved.body
    await navigate('/solutions?admin-preview=1&industry=ports'); await delay(350)
    await check('Custom industry copy, artwork and hotspot are rendered from saved data', `document.querySelector('#products-page-title').innerText === ${JSON.stringify(custom.industries.ports.title)} && document.querySelector('.equipment-scene-art').alt === '配置验证场景' && document.querySelectorAll('.scene-hotspot').length === 1 && document.querySelector('.scene-hotspot').textContent.includes('卸船装备')`)
    await click('.scene-hotspot')
    await check('Custom industry hotspot opens its associated product', `document.querySelector('.scene-product-card a').pathname === '/solutions/grab-ship-unloader'`)
    const customRestore = await api('/api/product-showcase', 'PUT', original)
    if (customRestore.status !== 200) throw Error('Custom scene settings could not be restored')
    settingsWritten = false
    await navigate('/contact?admin-preview=1'); await check('Contact page and interactive Z remain available', `!!document.querySelector('.contact-hero') && !!document.querySelector('.contact-hero-art')`)
    const draftFixture = await call('Page.addScriptToEvaluateOnNewDocument', { source: `{
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const pathname = new URL(typeof args[0] === 'string' ? args[0] : args[0].url, location.href).pathname;
        if (!['/api/products', '/api/industries'].includes(pathname)) return response;
        const items = await response.json();
        if (pathname === '/api/industries') items.push({id:'qa-draft',titleZh:'草稿行业预览',titleEn:'',subtitleZh:'待发布的行业介绍',status:'draft',icon:''});
        else items.push({...items[0],id:'qa-draft-product',titleZh:'待发布装备预览',industries:['qa-draft'],status:'draft',showOnHome:false});
        return new Response(JSON.stringify(items), {status:200,headers:{'Content-Type':'application/json'}});
      };
    }` })
    await navigate('/admin/product-showcase?industry=qa-draft&admin-preview=1'); await delay(650)
    await check('Draft industries and their equipment can be previewed without publication', `document.querySelector('.admin-preview-iframe').contentDocument.querySelector('#products-page-title').innerText.includes('草稿行业预览') && document.querySelector('.admin-preview-iframe').contentDocument.querySelector('.showcase-related').innerText.includes('待发布装备预览')`)
    await navigate('/solutions?industry=qa-draft&admin-preview=1'); await delay(300)
    await check('Draft preview data stays absent from public industry navigation and catalog', `!document.querySelector('[data-industry="qa-draft"]') && ![...document.querySelectorAll('.hc-card')].some(card => card.pathname.includes('qa-draft-product')) && document.querySelector('#products-page-title').innerText === ${JSON.stringify(original.overview.title)}`)
    await call('Page.removeScriptToEvaluateOnNewDocument', { identifier: draftFixture.identifier })
    const negativeCases = [
      ['out-of-bounds hotspot', value => { value.overview.hotspots[0].x = 101 }],
      ['external image URL', value => { value.overview.image = 'https://example.com/image.png' }],
      ['unknown hotspot product', value => { value.overview.hotspots[0].productId = 'missing-product' }],
      ['mismatched industry and product', value => { value.overview.hotspots[0].industryId = 'ports' }],
      ['unlinked hotspot', value => { value.overview.hotspots[0].industryId = ''; value.overview.hotspots[0].productId = '' }],
      ['missing Chinese title', value => { value.overview.title = '' }],
      ['duplicate priority product', value => { value.overview.featuredProducts.push(value.overview.featuredProducts[0]) }],
      ['unknown industry', value => { value.industries['missing-industry'] = value.industries.ports }],
    ]
    for (const [label, mutate] of negativeCases) {
      const value = structuredClone(original); mutate(value)
      const result = await api('/api/product-showcase', 'PUT', value)
      validation.push({ label, status: result.status })
      await check(`API rejects ${label}`, String(result.status === 400))
    }
    const after = (await api('/api/product-showcase')).body
    await check('Rejected settings do not alter the saved configuration', String(JSON.stringify(after) === JSON.stringify(original)))
    await check('Browser operations only write the deliberate settings save', String(writes.length === 1 && writes[0].url.endsWith('/api/product-showcase') && writes[0].method === 'PUT'))
    if (errors.length) failures.push('Browser errors: ' + JSON.stringify(errors))
  } catch (error) { failures.push(error.stack); process.exitCode = 1 }
  finally {
    if (settingsWritten) {
      const latest = (await api('/api/product-showcase')).body
      if (JSON.stringify(latest) === JSON.stringify(savedSettings)) {
        const restored = await api('/api/product-showcase', 'PUT', original)
        if (restored.status !== 200) failures.push('Failed to restore original showcase settings')
      } else failures.push('Settings changed externally; original snapshot was not applied over newer edits')
    }
    await fs.writeFile(base + '/report.json', JSON.stringify({ at: new Date().toISOString(), checks, failures, errors, writes, validation, shots }, null, 2))
    console.log(JSON.stringify({ checks: checks.length, failures, errors: errors.length }))
    if (failures.length) process.exitCode = 1
    try { await call('Browser.close') } catch {} socket?.close(); browser.kill()
  }
}
await fs.mkdir('docs/product-showcase-2026-10-17', { recursive: true })
await fs.writeFile('docs/generated-product-showcase-check.mjs', helper + '\nawait (' + suite.toString() + ')()\n')
await import('../docs/generated-product-showcase-check.mjs')
