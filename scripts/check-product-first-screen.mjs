import fs from 'node:fs/promises';

const source = await fs.readFile('scripts/check-j-design.mjs', 'utf8');
const helper = source.split('try{\n  for(let i=0;i<100;i++)')[0]
  .replaceAll('docs/j-implementation-2026-10-15', 'docs/product-first-screen-2026-11-02')
  .replace('const port=9225', 'const port=9500')
  .replaceAll('database/snapshots/j-browser-profile', 'database/snapshots/product-first-screen-profile')
  .replace("'--disable-gpu'", "'--use-angle=swiftshader','--enable-unsafe-swiftshader'")
  .replace('},20000)', '},60000)');

async function suite() {
  const layouts = [];
  const devices = [
    [1920,1080], [1440,900], [1366,768], [1280,720], [1024,768],
    [820,1180], [768,1024], [430,932], [390,844], [375,667],
    [320,568], [844,390], [667,375],
  ];
  const screenshots = new Set(['1440x900','1366x768','768x1024','390x844','320x568','844x390']);
  async function wait(expression) {
    for (let i = 0; i < 350; i++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw Error('Timed out: ' + expression);
  }
  const measurement = `(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};
    const copy=document.querySelector('.product-showcase-copy'),nav=rect('.hc-nav'),screen=rect('.product-showcase-screen'),intro=rect('.product-showcase'),industry=rect('#industry-explorer'),scene=rect('.equipment-scene'),panel=rect('.industrial-bottom-panel');
    const buttons=[...document.querySelectorAll('.showcase-industries button')].map(e=>{const r=e.getBoundingClientRect();return {name:e.textContent.trim(),x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}});
    const title=getComputedStyle(document.querySelector('.showcase-story h1')),text=getComputedStyle(document.querySelector('.showcase-story p'));
    return {width:innerWidth,height:innerHeight,industry:new URLSearchParams(location.search).get('industry')||'overview',nav,screen,intro,industryBar:industry,scene,panel,buttons,copyHeight:copy.clientHeight,copyOverflow:Math.max(0,copy.scrollHeight-copy.clientHeight),titleSize:title.fontSize,textSize:text.fontSize,pageOverflow:document.documentElement.scrollWidth>innerWidth+1};
  })()`;
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
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await width(1440,900); await call('Page.navigate', { url: origin + '/solutions?admin-preview=1' });
    await wait("!!document.querySelector('.industrial-viewer.is-ready')");
    await evaluate('document.fonts.ready');
    for (const [w,h] of devices) {
      await width(w,h);
      for (const industry of ['', 'mining', 'steel-structures']) {
        await evaluate(industry ? `document.querySelector('[data-industry="${industry}"]').click()` : "document.querySelector('.showcase-industries button').click()");
        await wait("document.querySelector('.industrial-viewer')?.getAttribute('aria-busy')==='false'");
        await wait(industry ? `document.querySelector('.showcase-story h1')?.textContent.includes(${JSON.stringify(industry==='mining'?'从开采到转运':'钢结构工程')})` : "!!document.querySelector('.showcase-counts')");
        await evaluate("scrollTo({top:0,behavior:'instant'});document.querySelector('.product-showcase-copy').scrollTop=0");
        await delay(180);
        const m = await evaluate(measurement); layouts.push(m);
        const name = `${w}x${h} ${industry||'overview'}`;
        await check(name + ': navigation, intro and every industry fit the first viewport', String(!m.pageOverflow && Math.abs(m.screen.y-m.nav.bottom)<=2 && m.screen.bottom<=h+2 && Math.abs(m.industryBar.y-m.intro.bottom)<=2 && m.buttons.every(b=>b.y>=0&&b.bottom<=h+2&&b.x>=-1&&b.right<=w+1)));
        await check(name + ': scene and model controls remain usable', String(m.scene.height>=(w>h?120:150)&&m.panel.bottom<=m.scene.bottom+2&&m.panel.x>=-1&&m.panel.right<=w+1));
        await check(name + ': title and product actions remain visible without text overlaps', `(()=>{const copy=document.querySelector('.product-showcase-copy').getBoundingClientRect(),story=document.querySelector('.showcase-story').getBoundingClientRect(),title=document.querySelector('.showcase-story h1').getBoundingClientRect(),kicker=document.querySelector('.showcase-kicker').getBoundingClientRect();return title.top>=Math.max(story.top,kicker.bottom)-1&&title.bottom<=story.bottom+1&&[...document.querySelectorAll('.showcase-primary,.showcase-overview')].every(e=>{const r=e.getBoundingClientRect();return r.top>=Math.max(copy.top,story.bottom)-1&&r.bottom<=copy.bottom+1&&r.left>=copy.left-1&&r.right<=copy.right+1})})()`);
        console.log('LAYOUT '+JSON.stringify({name,sceneHeight:m.scene.height,copyOverflow:m.copyOverflow,title:m.titleSize,description:m.textSize}));
        if (screenshots.has(`${w}x${h}`) && industry !== 'steel-structures') {
          const shot=await call('Page.captureScreenshot',{format:'jpeg',quality:90,captureBeyondViewport:false});
          await fs.writeFile(base+'/screenshots/'+w+'x'+h+'-'+(industry||'overview')+'.jpg',Buffer.from(shot.data,'base64'));
        }
      }
    }
    await check('No browser exceptions', String(errors.length===0));
  } catch (error) { failures.push(error.stack); }
  finally {
    await fs.writeFile(base+'/report.json', JSON.stringify({checks,errors,failures,layouts},null,2));
    console.log(JSON.stringify({checks:checks.length,errors,failures}));
    if(failures.length)process.exitCode=1;
    try{await call('Browser.close')}catch{}socket?.close();browser.kill();
  }
}
await fs.mkdir('docs/product-first-screen-2026-11-02',{recursive:true});
await fs.writeFile('docs/product-first-screen-2026-11-02/generated-check.mjs',helper+'\nawait ('+suite.toString()+')()');
await import('../docs/product-first-screen-2026-11-02/generated-check.mjs');
