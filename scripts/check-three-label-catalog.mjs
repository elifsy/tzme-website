import fs from 'node:fs/promises';

const source = await fs.readFile('scripts/check-j-design.mjs', 'utf8');
const helper = source.split('try{\n  for(let i=0;i<100;i++)')[0]
  .replaceAll('docs/j-implementation-2026-10-15', 'docs/three-label-catalog-2026-11-01')
  .replace('const port=9225', 'const port=9498')
  .replaceAll('database/snapshots/j-browser-profile', 'database/snapshots/three-label-catalog-profile')
  .replace("'--disable-gpu'", "'--use-angle=swiftshader','--enable-unsafe-swiftshader'")
  .replace('},20000)', '},60000)');

async function suite() {
  const label = key => `[data-industry-model="${key}"]`;
  async function wait(expression) {
    for (let i = 0; i < 300; i++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw Error('Timed out: ' + expression);
  }
  async function settle() {
    await wait("!!document.querySelector('.industrial-viewer.is-ready')&&document.querySelector('.industrial-viewer').getAttribute('aria-busy')==='false'");
    await delay(150);
  }
  async function showScene() {
    await evaluate("document.querySelector('.equipment-scene').scrollIntoView({block:'center',behavior:'instant'})");
    await delay(100);
  }
  async function go(query = '') {
    await evaluate('window.catalogTestLeaving=true');
    await call('Page.navigate', { url: origin + '/solutions?admin-preview=1' + query });
    await wait("window.catalogTestLeaving===false&&document.readyState==='complete'&&!!document.querySelector('.equipment-scene')");
    await showScene();
    await settle();
  }
  async function pressLabel(key) {
    await evaluate(`document.querySelector(${JSON.stringify(label(key))}).click()`);
  }
  async function expectCatalog(before, key, query) {
    await wait(`window.catalogScrolls.length===${before + 1}`);
    await wait("Math.abs(document.querySelector('#equipment-catalog').getBoundingClientRect().top)<=2");
    await check(key + ': catalog aligns at the viewport top, hides previous content and preserves filters', `location.search===${JSON.stringify(query)}&&(()=>{const r=document.querySelector('#equipment-catalog').getBoundingClientRect(),previous=document.querySelector('#industry-explorer').getBoundingClientRect();return Math.abs(r.top)<=2&&previous.bottom<=2&&document.querySelector('#catalog-heading').getBoundingClientRect().top>=0})()`);
  }
  async function catalogScreenshot(name) {
    const shot = await call('Page.captureScreenshot', { format: 'jpeg', quality: 90, captureBeyondViewport: false });
    await fs.writeFile(base + '/screenshots/' + name + '.jpg', Buffer.from(shot.data, 'base64'));
  }
  try {
    for (let i = 0; i < 100; i++) {
      try { await fetch(`http://127.0.0.1:${port}/json/version`); break; }
      catch { await delay(100); }
    }
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const item = pending.get(message.id); pending.delete(message.id);
        message.error ? item.reject(Error(JSON.stringify(message.error))) : item.resolve(message.result);
      }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    });
    await call('Page.enable'); await call('Runtime.enable'); await call('Page.bringToFront');
    await call('Emulation.setFocusEmulationEnabled', { enabled: true });
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await call('Page.addScriptToEvaluateOnNewDocument', { source: `
      window.catalogScrolls=[];
      window.catalogTestLeaving=false;
      const nativeScrollTo=window.scrollTo.bind(window);
      window.scrollTo=function(options,...rest){const catalog=document.querySelector('#equipment-catalog');if(catalog&&options&&typeof options==='object'&&Math.abs(options.top-(catalog.getBoundingClientRect().top+scrollY))<=2)window.catalogScrolls.push({industry:new URLSearchParams(location.search).get('industry'),options});return nativeScrollTo(options,...rest)};
    ` });
    for (const device of [{ width: 1440, height: 1000 }, { width: 1280, height: 800 }, { width: 390, height: 844 }]) {
      await width(device.width, device.height); await go();
      console.log('DEVICE ' + device.width);
      await evaluate(`(()=>{const viewer=document.querySelector('.industrial-viewer');window.busyRetap=false;const observer=new MutationObserver(()=>{if(viewer.dataset.overview==='false'&&viewer.getAttribute('aria-busy')==='true'){observer.disconnect();window.busyRetap=true;document.querySelector('[data-industry-model="ports"]').click()}});observer.observe(viewer,{attributes:true,attributeFilter:['aria-busy','data-overview']});document.querySelector('[data-industry-model="ports"]').click()})()`);
      await settle();
      await check(device.width + ': first click focuses and filters without scrolling; rapid retap waits for focus', `window.busyRetap&&window.catalogScrolls.length===0&&new URLSearchParams(location.search).get('industry')==='ports'&&document.querySelector('.industrial-viewer').dataset.overview==='false'&&document.querySelector('.industrial-viewer').dataset.animatedIndustry==='ports'&&document.querySelector('[data-industry="ports"]').getAttribute('aria-pressed')==='true'`);
      await check(device.width + ': focused label advertises its product action', `document.querySelector('[data-industry-model="ports"]').getAttribute('aria-label')==='查看港口行业产品'`);
      const portQuery = await evaluate('location.search');
      await pressLabel('ports'); await expectCatalog(0, device.width + ' ports', portQuery);
      await showScene();
      await pressLabel('mining'); await settle();
      await check(device.width + ': choosing a different label focuses its model before allowing catalog navigation', "window.catalogScrolls.length===1&&new URLSearchParams(location.search).get('industry')==='mining'&&document.querySelector('.industrial-viewer').dataset.animatedIndustry==='mining'");
      const miningQuery = await evaluate('location.search');
      await evaluate(`document.querySelector('[data-industry-model="mining"]').focus({preventScroll:true})`);
      await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
      await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
      await expectCatalog(1, device.width + ' keyboard', miningQuery);
      await showScene(); await evaluate("document.querySelector('.industrial-reset').click()"); await settle();
      await check(device.width + ': reset restores panorama and makes the next label click a focus action again', "!new URLSearchParams(location.search).has('industry')&&document.querySelector('.industrial-viewer').dataset.overview==='true'");
      await pressLabel('ports'); await settle();
      await check(device.width + ': first label click after reset does not scroll to products', "window.catalogScrolls.length===2&&new URLSearchParams(location.search).get('industry')==='ports'");
      await evaluate("document.querySelector('.industrial-mode-buttons button:last-child').click()"); await settle();
      await pressLabel('ports'); await expectCatalog(2, device.width + ' equipment inspection', portQuery);
      await check(device.width + ': catalog navigation keeps the selected equipment and viewing mode', "document.querySelector('.industrial-viewer').dataset.mode==='inspect'&&document.querySelector('.industrial-viewer').dataset.animatedIndustry==='ports'");
      await catalogScreenshot('catalog-' + device.width);
    }
    const products = await (await fetch(origin + '/api/products')).json();
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    for (const device of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      await width(device.width, device.height); await go();
      await check(device.width + ': overview picker prompts for an industry, including its first option', `document.querySelector('[aria-label="选择查看设备"]').value===''&&!new URLSearchParams(location.search).has('industry')`);
      const choices = await evaluate(`Array.from(document.querySelector('[aria-label="选择查看设备"]').options).filter(o=>o.value).map(o=>({id:o.value,title:o.textContent.trim()}))`);
      for (const mode of ['orbit', 'inspect']) {
        if (mode === 'inspect') { await evaluate("document.querySelector('.industrial-mode-buttons button:last-child').click()"); await settle(); }
        for (const choice of mode === 'inspect' ? [...choices].reverse() : choices) {
          await evaluate(`(()=>{const s=document.querySelector('[aria-label="选择查看设备"]');s.value=${JSON.stringify(choice.id)};s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
          await settle();
          const count = Math.min(12, products.filter(p=>p.status==='published'&&p.industries?.includes(choice.id)).length);
          await check(`${device.width} picker ${mode}/${choice.id}: model, page copy, industry and product results stay synchronized`, `new URLSearchParams(location.search).get('industry')===${JSON.stringify(choice.id)}&&document.querySelector('[aria-label="选择查看设备"]').value===${JSON.stringify(choice.id)}&&document.querySelector('.industrial-viewer').dataset.mode===${JSON.stringify(mode)}&&document.querySelector('.industrial-viewer').dataset.animatedIndustry===${JSON.stringify(choice.id)}&&document.querySelector(${JSON.stringify('[data-industry="'+choice.id+'"]')}).getAttribute('aria-pressed')==='true'&&document.querySelector('.showcase-kicker').textContent.includes(${JSON.stringify(choice.title.replace(/装备$/, ''))})&&document.querySelector('#catalog-heading').textContent.trim()===${JSON.stringify(choice.title)}&&document.querySelectorAll('.equipment-product-card').length===${count}&&window.catalogScrolls.length===0`);
        }
      }
      const selectedKey = choices[0].id;
      const pickerQuery = await evaluate('location.search');
      await pressLabel(selectedKey); await expectCatalog(0, device.width + ' picker followed by label', pickerQuery);
      await showScene(); await evaluate("document.querySelector('.industrial-reset').click()"); await settle();
      await check(device.width + ': reset clears picker and industry together after dropdown inspection', `document.querySelector('[aria-label="选择查看设备"]').value===''&&!new URLSearchParams(location.search).has('industry')&&document.querySelector('.industrial-viewer').dataset.overview==='true'&&document.querySelectorAll('.equipment-product-card').length===12`);
    }
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    const product = products.find(item => item.status === 'published' && item.industries?.includes('ports'));
    const category = product.categoryEn || product.category || product.categoryZh;
    await width(1440, 1000); await go('&industry=ports&cat=' + encodeURIComponent(category) + '&q=' + encodeURIComponent(product.titleZh));
    const filteredQuery = await evaluate('location.search');
    await pressLabel('ports'); await expectCatalog(0, 'Filtered deep link', filteredQuery);
    await check('Existing type and keyword filters, product links and loading remain intact', `document.querySelectorAll('.equipment-product-card').length>0&&!!document.querySelector('.equipment-product-card[href*=${JSON.stringify(product.id)}]')&&!document.querySelector('.scene-product-card')&&document.documentElement.scrollWidth<=innerWidth+1`);
    await go('&industry=amusement');
    const amusementQuery = await evaluate('location.search');
    await pressLabel('amusement'); await expectCatalog(0, 'Amusement industry', amusementQuery);
    await catalogScreenshot('amusement-catalog');
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await go(); await pressLabel('ports'); await settle(); await check('Reduced motion retains the first-click focus action', 'window.catalogScrolls.length===0');
    const reducedQuery = await evaluate('location.search');
    await pressLabel('ports'); await expectCatalog(0, 'Reduced motion', reducedQuery);
    await check('Reduced motion scrolls without animation', "window.catalogScrolls[0].options.behavior==='instant'");
    await check('No browser exceptions', String(errors.length === 0));
  } catch (error) {
    failures.push(error.stack);
    console.log('STATE ' + JSON.stringify(await evaluate("({query:location.search,scrolls:window.catalogScrolls,active:document.activeElement?.outerHTML?.slice(0,600),viewer:{...document.querySelector('.industrial-viewer')?.dataset}})").catch(() => null)));
  }
  finally {
    await fs.writeFile(base + '/report.json', JSON.stringify({ checks, errors, failures }, null, 2));
    console.log(JSON.stringify({ checks: checks.length, errors, failures }));
    if (failures.length) process.exitCode = 1;
    try { await call('Browser.close'); } catch {} socket?.close(); browser.kill();
  }
}
await fs.mkdir('docs/three-label-catalog-2026-11-01', { recursive: true });
await fs.writeFile('docs/three-label-catalog-2026-11-01/generated-check.mjs', helper + '\nawait (' + suite.toString() + ')()');
await import('../docs/three-label-catalog-2026-11-01/generated-check.mjs');
