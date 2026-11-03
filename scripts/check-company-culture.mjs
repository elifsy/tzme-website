import fs from 'node:fs/promises';
const source=await fs.readFile('scripts/check-j-design.mjs','utf8');
const helper=source.split('try{\n  for(let i=0;i<100;i++)')[0]
  .replaceAll('docs/j-implementation-2026-10-15','docs/company-culture-2026-11-03')
  .replace('const port=9225','const port=9504')
  .replaceAll('database/snapshots/j-browser-profile','database/snapshots/company-culture-profile');
async function suite(){
  const layouts=[];
  async function wait(expression){for(let i=0;i<250;i++){if(await evaluate(expression))return;await delay(80)}throw Error('Timed out: '+expression)}
  async function shot(name){
    const clip=await evaluate("(()=>{const r=document.querySelector('.company-culture').getBoundingClientRect();return {x:r.x+scrollX-8,y:r.y+scrollY,width:r.width+16,height:r.height,scale:1}})()");
    const result=await call('Page.captureScreenshot',{format:'jpeg',quality:95,captureBeyondViewport:true,clip});await fs.writeFile(base+'/screenshots/'+name+'.jpg',Buffer.from(result.data,'base64'));
  }
  try{
    for(let i=0;i<100;i++){try{await fetch(`http://127.0.0.1:${port}/json/version`);break}catch{await delay(100)}}
    const target=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
    socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
    socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails)});
    await call('Page.enable');await call('Runtime.enable');await call('Page.bringToFront');await call('Emulation.setFocusEmulationEnabled',{enabled:true});
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await width(1440,1000);await call('Page.navigate',{url:origin+'/about?admin-preview=1'});
    await wait("!!document.querySelector('.company-culture.culture-animated')&&document.querySelectorAll('.certificate-card').length>0");await evaluate('document.fonts.ready');
    await check('Existing vision, mission and all six values are present', `document.querySelector('.culture-card-vision .culture-statement').textContent==='成为世界非标机械装备制造业领跑者。'&&document.querySelector('.culture-card-mission .culture-statement').textContent==='为员工谋幸福，让更多“有灵魂 会说话”的产品服务世界。'&&document.querySelectorAll('.culture-values-grid li').length===6&&!document.querySelector('.refine-values')`);
    await check('Cards wait below the viewport with a 32px reveal offset', "!document.querySelector('.company-culture').classList.contains('is-entered')&&getComputedStyle(document.querySelector('.culture-vision')).opacity==='0'&&new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.culture-vision')).transform).m42===32");
    await evaluate("document.querySelector('.company-culture').scrollIntoView({block:'start',behavior:'instant'})");await wait("document.querySelector('.company-culture').classList.contains('is-entered')");
    await check('Vision and mission reveal 140ms apart', "getComputedStyle(document.querySelector('.culture-vision')).animationDelay==='0s'&&getComputedStyle(document.querySelector('.culture-mission')).animationDelay==='0.14s'&&getComputedStyle(document.querySelector('.culture-values')).animationDelay==='0.28s'");
    await delay(1100);
    await check('Revealed content is fully visible', "[...document.querySelectorAll('.culture-reveal')].every(e=>Number(getComputedStyle(e).opacity)===1&&Math.abs(new DOMMatrixReadOnly(getComputedStyle(e).transform).m42)<.1)");
    const point=await evaluate("(()=>{const r=document.querySelector('.culture-card-vision').getBoundingClientRect();return{x:r.x+r.width*.5,y:r.y+r.height*.5}})()");
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await delay(350);
    await check('Hover lifts the card 6px after its entrance animation', "Math.abs(new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.culture-card-vision')).transform).m42+6)<.1");
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await delay(300);
    for(const w of [1920,1440,768,390,320]){
      await width(w,1000);await evaluate("document.querySelector('.company-culture').scrollIntoView({block:'start',behavior:'instant'})");await delay(120);
      const m=await evaluate("(()=>{const root=document.querySelector('.company-culture').getBoundingClientRect(),vision=document.querySelector('.culture-vision').getBoundingClientRect(),mission=document.querySelector('.culture-mission').getBoundingClientRect(),values=document.querySelector('.culture-values-grid');return {width:innerWidth,columns:getComputedStyle(values).gridTemplateColumns.split(' ').length,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,contained:vision.left>=root.left-1&&mission.left>=root.left-1&&vision.right<=root.right+1&&mission.right<=root.right+1,staggered:mission.left>vision.left,values:[...values.children].map(e=>({label:e.textContent.trim(),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}))}})()");layouts.push(m);
      await check(w+': staggered cards, readable value items and responsive columns fit the page', String(!m.pageOverflow&&m.contained&&m.staggered&&m.columns===(w<=600?2:3)&&m.values.every(v=>v.height>=48)));
      if([1440,390,320].includes(w))await shot('culture-'+w);
    }
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await call('Page.navigate',{url:origin+'/about?admin-preview=1&culture-motion=reduce'});
    await wait("document.readyState==='complete'&&!!document.querySelector('.company-culture')");
    await check('Reduced motion keeps culture content visible without reveal animation', "!document.querySelector('.company-culture').classList.contains('culture-animated')&&[...document.querySelectorAll('.culture-reveal')].every(e=>getComputedStyle(e).opacity==='1'&&getComputedStyle(e).animationName==='none')");
    await check('Certificates, facilities and the global map are still available', "!!document.querySelector('#manufacturing-bases')&&!!document.querySelector('#certificates-title')&&!!document.querySelector('#global-reach')");
    await check('No browser exceptions',String(errors.length===0));
  }catch(error){failures.push(error.stack)}finally{
    await fs.writeFile(base+'/report.json',JSON.stringify({checks,errors,failures,layouts},null,2));console.log(JSON.stringify({checks:checks.length,errors,failures}));if(failures.length)process.exitCode=1;
    try{await call('Browser.close')}catch{}socket?.close();browser.kill();
  }
}
await fs.mkdir('docs/company-culture-2026-11-03',{recursive:true});await fs.writeFile('docs/company-culture-2026-11-03/generated-check.mjs',helper+'\nawait ('+suite.toString()+')()');await import('../docs/company-culture-2026-11-03/generated-check.mjs');
