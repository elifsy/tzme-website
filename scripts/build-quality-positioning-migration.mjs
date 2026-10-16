import { readFileSync, writeFileSync } from 'node:fs'

const { changes } = JSON.parse(readFileSync('database/baseline/quality-positioning.json', 'utf8'))
const marker = '2026-10-16-quality-positioning-v1'
const quote = value => `CONVERT(0x${Buffer.from(String(value), 'utf8').toString('hex')} USING utf8mb4) COLLATE utf8mb4_unicode_ci`
const jsonPath = parts => '$' + parts.map(key => '.' + JSON.stringify(key)).join('')
const guard = `NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='${marker}')`
let sql = '-- 中文官网以产品质量与制造交付为核心，弱化独立设计服务宣传。\n-- 仅首次更新仍等于已知原文案的字段；保留后台自定义内容、英文资料、图片、排序、显示状态、业务参数与邮件配置。\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n'
for (const change of changes) {
  if (!['site_settings', 'home_global_settings', 'site_content'].includes(change.table) || !change.before.length || change.before.some(v => typeof v !== 'string') || typeof change.after !== 'string') throw Error('Invalid quality copy change')
  const match = expression => `CAST(${expression} AS BINARY) IN (${change.before.map(value => `CAST(${quote(value)} AS BINARY)`).join(',')})`
  if (change.table === 'site_content') {
    if (!['title_zh', 'category_zh', 'summary_zh', 'content_zh', 'features_zh', 'specifications_zh'].includes(change.field) || !['products', 'articles'].includes(change.type)) throw Error('Invalid content field')
    sql += `UPDATE site_content SET ${change.field}=${quote(change.after)} WHERE id=${quote(change.id)} AND type='${change.type}' AND status<>'deleted' AND ${match(change.field)} AND ${guard};\n`
    continue
  }
  let destination
  if (change.item) {
    if (change.item.array !== 'steps' || !/^[a-zA-Z0-9-]+$/.test(change.item.id)) throw Error('Invalid process step ID')
    const located = `JSON_UNQUOTE(JSON_SEARCH(configuration,'one',${quote(change.item.id)},NULL,'$.steps[*].id'))`
    destination = `REPLACE(${located},'.id',${quote(jsonPath(change.item.field).slice(1))})`
  } else destination = quote(jsonPath(change.path))
  sql += `UPDATE ${change.table} SET configuration=JSON_SET(configuration,${destination},${quote(change.after)}) WHERE id=${quote(change.id)} AND ${match(`JSON_UNQUOTE(JSON_EXTRACT(configuration,${destination}))`)} AND ${guard};\n`
}
sql += `INSERT INTO app_migrations (id) SELECT '${marker}' WHERE ${guard};\nCOMMIT;\n`
writeFileSync('database/migrations/2026-10-16-quality-positioning.sql', sql)
writeFileSync('server/src/main/resources/db/14-quality-positioning.sql', sql)
console.log(`Built ${changes.length} guarded quality-positioning copy changes.`)
