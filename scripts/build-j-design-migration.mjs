import { readFileSync, writeFileSync } from 'node:fs'
const read = file => JSON.parse(readFileSync(file, 'utf8'))
const seed = read('database/baseline/j-design.json')
const baseline = read('database/baseline/records.json')
const quote = value => value == null ? 'NULL' : typeof value === 'boolean' ? String(Number(value)) : typeof value === 'number' ? String(value) : "'" + String(value).replaceAll('\\','\\\\').replaceAll("'","''") + "'"
const snake = name => name.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase())
const row = value => Object.fromEntries(Object.entries(value).map(([key,value]) => [snake(key), value]))
const marker = '2026-10-15-j-design-v1'
const guard = `NOT EXISTS (SELECT 1 FROM app_migrations WHERE id=${quote(marker)})`
let sql = `-- Style J: verified source material, additive records and guarded default updates.\n-- Runs once; later CMS edits and deletion markers are preserved.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n`
function insert(table, value) {
  sql += `INSERT INTO ${table} (${Object.keys(value).map(key=>'`'+key+'`').join(',')}) SELECT ${Object.values(value).map(quote).join(',')} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM ${table} WHERE id=${quote(value.id)});\n`
}
for (const [type, list] of [['products',seed.products],['articles',seed.articles]]) for (const item of list) {
  const fields = row(item)
  const value = Object.fromEntries(Object.keys(baseline.site_content[0]).map(key => [key, fields[key] ?? null]))
  Object.assign(value, { type, title: item.titleEn, category: item.categoryEn, summary: item.summaryEn, content: item.contentEn, status:'published', date:item.date || null, industry_ids:(item.industries || []).join(','), industry:(item.industries || [])[0] || '', show_on_home:false, home_order:0 })
  insert('site_content', value)
}
for (const item of seed.projects) {
  const fields = row(item)
  const value = Object.fromEntries(Object.keys(baseline.projects[0]).map(key => [key, fields[key] ?? '']))
  Object.assign(value,{status:'published',sort_order:0,show_on_home:false,home_order:0,image_alt_en:item.titleEn,image_alt_zh:item.titleZh})
  insert('projects',value)
}
for (const [table,images] of [['site_content',seed.images],['projects',seed.projectImages]]) for (const image of images) {
  const original=baseline[table].find(item=>item.id===image.id)
  if(original)sql+=`UPDATE ${table} SET image=${quote(image.image)} WHERE id=${quote(image.id)} AND image=${quote(original.image)} AND ${guard};\n`
}
for (const [index,item] of seed.certificates.entries()) {
  const value={id:item.id,title_en:item.title,title_zh:item.title,summary_en:item.summaryEn,summary_zh:item.summaryZh,issuer_en:'',issuer_zh:'',certificate_no:'',issued_at:null,expires_at:null,image:item.file,status:'published',sort_order:index*10}
  const original=baseline.certifications.find(record=>record.id===item.id)
  if(original)sql+=`UPDATE certifications SET ${Object.entries(value).filter(([key])=>!['id','status','sort_order'].includes(key)).map(([key,value])=>'`'+key+'`='+quote(value)).join(',')} WHERE id=${quote(item.id)} AND image=${quote(original.image)} AND ${guard};\n`
  else insert('certifications',value)
}
// Each configured value is updated only if it still equals the original default.
function updateJson(table,id,original,changes) {
  function walk(before,after,parts=[]) {
    if(after && typeof after==='object' && !Array.isArray(after)){for(const [key,value]of Object.entries(after))walk(before?.[key],value,[...parts,key]);return}
    const jsonPath='$'+parts.map(key=>'.'+JSON.stringify(key)).join('')
    const structured=Array.isArray(after)
    const newValue=structured?`CAST(${quote(JSON.stringify(after))} AS JSON)`:quote(after)
    const match=structured?`JSON_EXTRACT(configuration,${quote(jsonPath)})=CAST(${quote(JSON.stringify(before))} AS JSON)`:`JSON_UNQUOTE(JSON_EXTRACT(configuration,${quote(jsonPath)})) <=> ${quote(before)}`
    sql+=`UPDATE ${table} SET configuration=JSON_SET(configuration,${quote(jsonPath)},${newValue}) WHERE id=${quote(id)} AND ${match} AND ${guard};\n`
  }
  walk(original,changes)
}
const company=seed.company
const bilingual=(zh,en)=>({zh,en})
const stats=[
  {value:bilingual(company.founded,company.founded),suffix:bilingual('',''),label:bilingual('创立于天津','Established in Tianjin')},
  {value:bilingual(company.bases,company.bases),suffix:bilingual('',''),label:bilingual('制造基地','Manufacturing bases')},
  {value:bilingual(company.capacity,company.capacity),suffix:bilingual('t','t'),label:bilingual('年综合生产能力','Annual production capacity')},
  {value:bilingual(company.countries,company.countries),suffix:bilingual('',''),label:bilingual('国家与地区','Countries & regions')},
]
const about=read('database/baseline/about-tzme.json')
updateJson('site_settings','about-tzme',about,{
  home:{image:'/assets/tzme-j/factories/greenland-aerial.jpg',kicker:bilingual('OUR MANUFACTURING','OUR MANUFACTURING'),titleLine1:bilingual('从制造基地，','From manufacturing bases'),titleLine2:bilingual('到全球工程现场。','to projects worldwide.'),description:bilingual('以工程设计、结构制造和装配交付能力，为全球客户提供港口、矿山、能源等领域的非标机械装备与系统解决方案。','Engineering, structural fabrication and assembly for custom equipment across ports, mining and energy infrastructure.'),entries:stats},
  about:{image:'/assets/tzme-j/factories/greenland-aerial.jpg',titleLine1:bilingual('中国制造，','Engineered in China.'),titleLine2:bilingual('服务全球工程。','Built for global industry.'),description:bilingual(company.introZh,company.introEn),description2:bilingual('制造基地总占地面积约45万平方米，格林兰基地拥有225米海岸线，衔接大型设备装配与装船运输。','The manufacturing bases cover approximately 450,000 m². The Greenland base has a 225-metre coastline supporting large equipment assembly and shipment.'),entries:stats},
})
const contact=read('database/baseline/contact-settings.json')
updateJson('site_settings','contact',contact,{contact:{address:seed.contact.address,emails:seed.contact.emails,website:seed.contact.website}})
const website=read('database/baseline/site-settings.json')
updateJson('site_settings','website',website,{assets:{'/assets/hero-01.jpg':'/assets/tzme-j/banners/harbor-clean.png','/assets/hero-02.jpg':'/assets/tzme-j/banners/harbor-clean.png','/assets/p-port-1.jpg':'/assets/tzme-j/banners/harbor-clean.png'}})
const originalGlobal=JSON.parse(baseline.home_global_settings[0].configuration)
updateJson('home_global_settings',1,originalGlobal,{titleLine1:bilingual('中国设计。','Engineered in China.'),titleLine2:bilingual('服务世界。','Built for the world.'),statistics:[{value:'60',suffix:'+',label:bilingual('国家与地区','Countries & regions')},{value:'225',suffix:'m',label:bilingual('格林兰基地海岸线','Greenland base coastline')},{value:'6',suffix:'',label:bilingual('制造基地','Manufacturing bases')}]})
sql+=`INSERT INTO app_migrations (id) SELECT ${quote(marker)} WHERE ${guard};\nCOMMIT;\n`
writeFileSync('database/migrations/2026-10-15-j-design.sql',sql)
writeFileSync('server/src/main/resources/db/10-j-design.sql',sql)
console.log('Built J design migration: additive records and guarded updates, '+Buffer.byteLength(sql)+' bytes.')
