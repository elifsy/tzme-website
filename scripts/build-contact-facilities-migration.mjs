import { readFileSync, writeFileSync } from 'node:fs'

const seed = JSON.parse(readFileSync('database/baseline/contact-facilities.json', 'utf8'))
const marker = '2026-10-16-contact-facilities-v1'
const json = value => `CAST(CONVERT(0x${Buffer.from(JSON.stringify(value), 'utf8').toString('hex')} USING utf8mb4) AS JSON)`
let sql = '-- 总部与下属企业照片、标题和简介归入同一企业记录。仅首次补充缺失配置，按企业 ID 关联，保留原联系方式、顺序、显示开关及邮件设置。\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n'
sql += `UPDATE site_settings SET configuration=JSON_SET(configuration,'$.contact.facility',${json(seed.headquarters)})\nWHERE id='contact' AND JSON_CONTAINS_PATH(configuration,'one','$.contact.facility')=0 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='${marker}');\n`
for (const [id, facility] of Object.entries(seed.subsidiaries)) {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) throw Error('Invalid subsidiary ID')
  const match = `JSON_SEARCH(configuration,'one','${id}',NULL,'$.subsidiaries[*].id')`
  const destination = `REPLACE(JSON_UNQUOTE(${match}),'.id','.facility')`
  sql += `UPDATE site_settings SET configuration=JSON_SET(configuration,${destination},${json(facility)})\nWHERE id='contact' AND ${match} IS NOT NULL AND JSON_CONTAINS_PATH(configuration,'one',${destination})=0 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='${marker}');\n`
}
sql += `INSERT INTO app_migrations (id) SELECT '${marker}' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='${marker}');\nCOMMIT;\n`
writeFileSync('database/migrations/2026-10-16-contact-facilities.sql', sql)
writeFileSync('server/src/main/resources/db/13-contact-facilities.sql', sql)
console.log('Built headquarters and subsidiary facility configuration migration.')
