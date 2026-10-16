import { readFileSync, writeFileSync } from 'node:fs'

const seed = JSON.parse(readFileSync('database/baseline/capability-process-details.json', 'utf8'))
const marker = '2026-10-16-capability-process-v1'
const quote = value => `CONVERT(0x${Buffer.from(String(value), 'utf8').toString('hex')} USING utf8mb4) COLLATE utf8mb4_unicode_ci`
let sql = '-- 制造与质量交互流程说明：按步骤 ID 和原中文名称匹配，仅首次补充缺失说明，保留后台自定义、图片、顺序和显示状态。\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n'
for (const [id, value] of Object.entries(seed)) {
  if (!/^[a-zA-Z0-9-]+$/.test(id) || typeof value.description.zh !== 'string' || value.description.zh.length > 600) throw Error('Invalid process detail seed')
  const found = `JSON_SEARCH(configuration,'one',${quote(id)},NULL,'$.steps[*].id')`
  const path = field => `REPLACE(JSON_UNQUOTE(${found}),'.id','.${field}')`
  sql += `UPDATE site_settings SET configuration=JSON_SET(configuration,${path('description')},CAST(${quote(JSON.stringify(value.description))} AS JSON))\nWHERE id='capabilities' AND ${found} IS NOT NULL AND CAST(JSON_UNQUOTE(JSON_EXTRACT(configuration,${path('label.zh')})) AS BINARY)=CAST(${quote(value.labelZh)} AS BINARY) AND JSON_CONTAINS_PATH(configuration,'one',${path('description')})=0 AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='${marker}');\n`
}
sql += `INSERT INTO app_migrations (id) SELECT '${marker}' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='${marker}');\nCOMMIT;\n`
writeFileSync('database/migrations/2026-10-16-capability-process.sql', sql)
writeFileSync('server/src/main/resources/db/15-capability-process.sql', sql)
console.log('Built configurable manufacturing process descriptions migration.')
