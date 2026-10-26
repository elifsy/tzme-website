import { readFileSync, writeFileSync } from 'node:fs'

const { paragraphs } = JSON.parse(readFileSync('database/baseline/company-overview-zh.json', 'utf8'))
if (!Array.isArray(paragraphs) || paragraphs.length !== 3 || paragraphs.some(value => typeof value !== 'string' || !value.trim())) {
  throw Error('Supply all three Chinese company overview paragraphs')
}
const about = { description: paragraphs[0], description2: paragraphs.slice(1).join('\n\n') }
const fields = ['description', 'description2']
const quote = value => `CONVERT(0x${Buffer.from(value, 'utf8').toString('hex')} USING utf8mb4)`
for (const field of fields) {
  if (about[field].length > 2000) {
    throw Error(`Invalid Chinese company overview: ${field}`)
  }
}
const marker = '2026-10-24-company-overview-zh-v1'
const guard = `NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='${marker}')`
const changes = fields.map(field => `'$.about.${field}.zh',${quote(about[field])}`).join(',')
const sql = `-- Replace the Chinese company overview with the supplied three paragraphs.\n-- Change only the two About-page text fields, once; preserve later backend edits.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\nUPDATE site_settings SET configuration=JSON_SET(configuration,${changes}) WHERE id='about-tzme' AND JSON_TYPE(JSON_EXTRACT(configuration,'$.about'))='OBJECT' AND ${guard};\nINSERT INTO app_migrations (id) SELECT '${marker}' WHERE ${guard};\nCOMMIT;\n`
writeFileSync('database/migrations/2026-10-24-company-overview.sql', sql)
writeFileSync('server/src/main/resources/db/24-company-overview.sql', sql)
console.log('Built guarded Chinese company overview migration.')
