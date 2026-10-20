import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
const base=path.resolve('docs/j-implementation-2026-10-15')
await fs.mkdir(base+'/screenshots',{recursive:true})
const port=9225, origin=process.env.J_CHECK_ORIGIN || 'http://127.0.0.1:5173'
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking',`--remote-debugging-port=${port}`,`--user-data-dir=${path.resolve('database/snapshots/j-browser-profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'})
let socket,seq=0
const pending=new Map(),errors=[],failures=[],checks=[],shots=[]
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))
function call(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Timeout '+method))},20000);pending.set(id,{resolve:v=>{clearTimeout(timeout);resolve(v)},reject});socket.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result?.value}
async function check(label,expression){const result=await evaluate(expression);checks.push({label,passed:result===true,result});console.log((result===true?'PASS ':'FAIL ')+label);if(result!==true)failures.push(label)}
async function navigate(route){await call('Page.navigate',{url:origin+route});for(let i=0;i<80;i++){await delay(100);if(await evaluate(`document.readyState==='complete'&&!!document.querySelector('.design-site, .admin-shell, .admin-layout')`))break}await delay(400);await evaluate(`document.querySelectorAll('img').forEach(img=>img.loading='eager')`);await evaluate(`Promise.all([...document.images].map(img=>img.decode().catch(()=>{})))`)}
async function click(selector){await evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);await delay(250)}
async function input(selector,value){await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}))})()`);await delay(200)}
async function width(width,height=1000){await call('Emulation.setDeviceMetricsOverride',{width,height,mobile:false,deviceScaleFactor:1})}
async function capture(name,full=false){
  if(full)await evaluate(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=650){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,65))}})()`)
  await evaluate(`scrollTo({top:0,behavior:'instant'})`);await delay(100)
  const metrics=await call('Page.getLayoutMetrics'), w=await evaluate('innerWidth'),h=full?Math.ceil(metrics.cssContentSize.height):await evaluate('innerHeight')
  const shot=await call('Page.captureScreenshot',{format:'jpeg',quality:88,captureBeyondViewport:true,clip:{x:0,y:0,width:w,height:h,scale:1}})
  await fs.writeFile(`${base}/screenshots/${name}.jpg`,Buffer.from(shot.data,'base64'));shots.push({name,width:w,height:h});console.log('SHOT '+name)
}
try{
  for(let i=0;i<100;i++){try{await fetch(`http://127.0.0.1:${port}/json/version`);break}catch{await delay(100)}}
  const target=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json()
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}))
  socket.addEventListener('message',event=>{const d=JSON.parse(event.data);if(d.id&&pending.has(d.id)){const p=pending.get(d.id);pending.delete(d.id);d.error?p.reject(Error(JSON.stringify(d.error))):p.resolve(d.result)}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails);if(d.method==='Network.responseReceived'&&d.params.response.status>=400)errors.push({url:d.params.response.url,status:d.params.response.status})})
  await call('Page.enable');await call('Runtime.enable');await call('Network.enable');await width(1440)
  await navigate('/');await evaluate(`localStorage.setItem('tzme-locale','zh')`);await navigate('/?qa=j')
  await check('Actual Vue homepage renders',`!!document.querySelector('.j-hero')&&!document.querySelector('.database-boot')`)
  await check('All homepage data loads',`!document.querySelector('.database-error')&&!!document.querySelector('.j-global')`)
  await check('Chinese banner original translation',`document.querySelector('h1').textContent.replace(/\\s/g,'').includes('成为全球非标机械设备制造领域的领导者')`)
  await check('Light navigation',`getComputedStyle(document.querySelector('.hc-nav')).backgroundColor==='rgb(255, 255, 255)'`)
  await check('Light footer and readable brand',`getComputedStyle(document.querySelector('.site-footer')).backgroundColor==='rgb(255, 255, 255)'&&getComputedStyle(document.querySelector('.hc-nav .site-logo')).width==='73px'`)
  await capture('home-desktop');await capture('home-full',true)
  await check('Only first banner is displayed without carousel controls',`document.querySelectorAll('.j-hero-photo').length===1&&document.querySelector('.j-hero-photo').getAttribute('src')==='/assets/tzme-j/banners/harbor-clean.png'&&!document.querySelector('.j-hero-controls,[aria-roledescription="carousel"]')`)
  await click('.j-film-button');await check('Manufacturing video opens',`!!document.querySelector('video')&&document.querySelector('video').src.includes('/assets/tzme-j/')`);await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await delay(300)
  await click('.world-map-point');await check('CMS map point responds',`!!document.querySelector('.world-map-label')`)
  await navigate('/solutions?industry=ports');await check('Industry filter retained',`document.querySelectorAll('.hc-card').length>0&&document.querySelectorAll('.hc-card').length<12`)
  await input('#product-search','zz-none-zz');await check('Product search empty state',`document.querySelectorAll('.hc-card').length===0&&!!document.querySelector('.el-empty')`)
  await navigate('/solutions?industry=ports');await click('.hc-card');await check('Real product detail & image',`!!document.querySelector('.j-detail-top .el-image')&&!!document.querySelector('.product-detail-specs')`)
  await click('.j-detail-photo .el-image__inner');await check('Product image preview',`!!document.querySelector('.el-image-viewer__wrapper')`);await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await delay(150)
  await click('.j-detail-back');await check('Product back preserves filters',`location.search.includes('industry=ports')`)
  await navigate('/projects?q='+encodeURIComponent('土耳其'));await check('New project in database list',`document.querySelectorAll('.project-card').length===1`);await click('.project-card');await check('Project detail has supplied data',`document.querySelector('.project-detail-metrics').textContent.includes('2,000')`);await check('Project gallery supplied pictures',`document.querySelectorAll('.j-gallery-thumbs .el-image').length===3`);await click('.project-back');await check('Project back keeps search',`document.querySelector('#project-search').value==='土耳其'`)
  await navigate('/contact');await click('.inquiry-submit button');await check('Required enquiry validation',`document.querySelectorAll('.el-form-item__error').length>=5`)
  await input('.inquiry-fields .el-form-item:first-child input','J Design QA');await check('English entry links to independent website',`document.querySelector('.hc-nav a.hc-lang-option').href==='https://www.tzmeglobal.com/'`)
  await check('Chinese enquiry draft remains available',`document.querySelector('.inquiry-fields .el-form-item:first-child input').value==='J Design QA'&&document.documentElement.lang.startsWith('zh')`)
  await navigate('/about');await check('Certificates remain database-driven',`document.querySelectorAll('.certificate-card').length===8`);await click('.j-pdf-cover');await check('Certificate PDF opens',`!!document.querySelector('.j-certificate-pdf')&&document.querySelector('.j-certificate-pdf').src.includes('/assets/tzme-j/certificates/')`);await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await delay(200)
  await click('.certificate-pagination .btn-next');await check('Certificate pagination works',`document.querySelector('.certificate-pagination .el-pager .is-active').textContent==='2'&&document.querySelectorAll('.certificate-card').length>0&&document.querySelectorAll('.certificate-card').length<8`)
  await navigate('/insights');await click('.news-category-options .el-button:nth-child(2)');await check('News category filter retained',`location.search.includes('category=')&&document.querySelectorAll('.news-row').length>0&&document.querySelectorAll('.news-row').length<6`);await click('.news-featured');await check('News detail and previous/next retained',`!!document.querySelector('.article-body')&&!!document.querySelector('.article-pagination a')`)
  const routes=[['about','/about'],['products','/solutions'],['product-detail','/solutions/grab-ship-unloader'],['projects','/projects'],['project-detail','/projects/turkey-grab-unloader'],['news','/insights'],['news-detail','/insights/canada-energy'],['contact','/contact']]
  for(const[name,route]of routes){await navigate(route);await check(name+' images load',`[...document.images].every(img=>img.naturalWidth>0)`);await check(name+' fits desktop',`document.documentElement.scrollWidth<=innerWidth+1`);await capture(name,true)}
  for(const deviceWidth of [360,390,768,1024]){await width(deviceWidth,844);for(const[name,route]of [['home','/'],...routes]){await navigate(route);await check(`${name} fits ${deviceWidth}`,`document.documentElement.scrollWidth<=innerWidth+1`);if(deviceWidth===390)await capture(name+'-mobile',name==='home'||name==='contact')}}
  await width(390,844);await navigate('/');await click('.hc-mobile-menu');await check('Mobile navigation drawer opens',`!!document.querySelector('.site-nav-drawer')`);await click('.hc-mobile-links a[href="/solutions"]');await check('Mobile navigation route',`location.pathname==='/solutions'`)
  await width(1440);await navigate('/admin');await check('Admin remains available',`!!document.querySelector('.el-menu,.admin-sidebar,.admin-shell,.cms-shell')&&!document.querySelector('.j-hero')`)
  if(errors.length)failures.push('Browser errors: '+JSON.stringify(errors))
  await fs.writeFile(base+'/qa-report.json',JSON.stringify({at:new Date().toISOString(),origin,checks,errors,failures,shots},null,2)+'\n')
  console.log(JSON.stringify({checks:checks.length,failed:failures,shots:shots.length}));if(failures.length)process.exitCode=1
}catch(error){console.error(error.stack);process.exitCode=1}finally{try{await call('Browser.close')}catch{}socket?.close();browser.kill()}
