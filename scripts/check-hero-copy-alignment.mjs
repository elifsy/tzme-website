import fs from 'node:fs/promises';
const source=await fs.readFile('scripts/check-j-design.mjs','utf8');
const helper=source.split('try{\n  for(let i=0;i<100;i++)')[0]
  .replaceAll('docs/j-implementation-2026-10-15','docs/hero-copy-alignment-2026-11-03')
  .replace('const port=9225','const port=9501')
  .replaceAll('database/snapshots/j-browser-profile','database/snapshots/hero-copy-alignment-profile')
  .replace("'--disable-gpu'","'--use-angle=swiftshader','--enable-unsafe-swiftshader'");
async function suite(){
  const measurements=[];
  async function wait(expression){for(let i=0;i<250;i++){if(await evaluate(expression))return;await delay(80)}throw Error('Timed out: '+expression)}
  try{
    for(let i=0;i<100;i++){try{await fetch(`http://127.0.0.1:${port}/json/version`);break}catch{await delay(100)}}
    const target=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
    socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
    socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}});
    await call('Page.enable');await call('Runtime.enable');await call('Page.bringToFront');
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await call('Page.addScriptToEvaluateOnNewDocument',{source:'window.alignmentLeaving=false'});
    const pages=[['/contact','.contact-hero-kicker'],['/about','.company-eyebrow'],['/insights','.news-intro-kicker'],['/solutions','.showcase-kicker'],['/solutions?industry=mining','.showcase-kicker']];
    for(const [w,h]of [[1920,1080],[1440,900],[1366,768],[1024,768],[768,1024],[390,844],[320,568],[844,390]]){
      await width(w,h);const group=[];
      for(const [route,kicker]of pages){
        await evaluate('window.alignmentLeaving=true');
        await call('Page.navigate',{url:origin+route+(route.includes('?')?'&':'?')+'admin-preview=1'});
        await wait(`window.alignmentLeaving===false&&document.readyState==='complete'&&!!document.querySelector(${JSON.stringify(kicker)})&&!!document.querySelector('h1.site-page-title')`);
        await evaluate('document.fonts.ready');await evaluate("scrollTo({top:0,behavior:'instant'})");
        const m=await evaluate(`(()=>{const k=document.querySelector(${JSON.stringify(kicker)}).getBoundingClientRect(),t=document.querySelector('h1.site-page-title').getBoundingClientRect(),n=document.querySelector('.hc-nav').getBoundingClientRect();return {kicker:k.top,title:t.top,nav:n.bottom}})()`);
        group.push({route,...m});
      }
      measurements.push({width:w,height:h,pages:group});
      await check(`${w}x${h}: product overview and selected-industry copy start at the same height as Contact, About and News`,String(group.every(p=>Math.abs(p.kicker-group[0].kicker)<1&&Math.abs(p.title-group[0].title)<1)));
      console.log('POSITIONS '+JSON.stringify({width:w,height:h,pages:group}));
    }
  }catch(error){failures.push(error.stack)}finally{
    await fs.writeFile(base+'/report.json',JSON.stringify({checks,failures,measurements},null,2));
    console.log(JSON.stringify({checks:checks.length,failures}));if(failures.length)process.exitCode=1;
    try{await call('Browser.close')}catch{}socket?.close();browser.kill();
  }
}
await fs.mkdir('docs/hero-copy-alignment-2026-11-03',{recursive:true});
await fs.writeFile('docs/hero-copy-alignment-2026-11-03/generated-check.mjs',helper+'\nawait ('+suite.toString()+')()');
await import('../docs/hero-copy-alignment-2026-11-03/generated-check.mjs');
