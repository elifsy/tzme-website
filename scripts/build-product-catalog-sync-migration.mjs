import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const catalog = JSON.parse(readFileSync('database/baseline/product-catalog-sync.json', 'utf8'))
const marker = '2026-10-20-official-catalog-sync-v1'
const quote = value => "'" + String(value).replaceAll('\\', '\\\\').replaceAll("'", "''") + "'"
const guard = `NOT EXISTS (SELECT 1 FROM app_migrations WHERE id=${quote(marker)})`
const kept = new Set(catalog.products.map(product => product.id))
if (kept.size !== catalog.products.length) throw Error('Duplicate catalog product')
let sql = `-- Align the existing product catalog with all pages of ${catalog.source}.\n-- Retire surplus products using the CMS deletion status; preserve retained product copy and photos.\n-- Run once, so subsequent administrator additions, edits and selections remain possible.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n`
for (const product of catalog.removed) {
  if (kept.has(product.id) || product.replacementId && !kept.has(product.replacementId)) throw Error('Invalid replacement: ' + product.id)
  if (product.replacementId) {
    // Move active home selections before hiding the old record; retain an already selected target's order.
    sql += `UPDATE site_content AS target JOIN site_content AS legacy ON legacy.id=${quote(product.id)} AND legacy.type='products'\nSET target.show_on_home=1, target.home_order=legacy.home_order\nWHERE target.id=${quote(product.replacementId)} AND target.type='products' AND target.status='published' AND COALESCE(target.show_on_home,0)=0 AND legacy.show_on_home=1 AND ${guard};\n`
    const from = '$.products."' + product.id + '"', to = '$.products."' + product.replacementId + '"'
    sql += `UPDATE site_settings SET configuration=JSON_SET(configuration,${quote(to)},JSON_EXTRACT(configuration,${quote(from)}))\nWHERE id='home-solutions' AND JSON_VALID(configuration) AND JSON_CONTAINS_PATH(configuration,'one',${quote(from)}) AND NOT JSON_CONTAINS_PATH(configuration,'one',${quote(to)}) AND ${guard};\n`
  }
  sql += `UPDATE site_settings SET configuration=JSON_REMOVE(configuration,${quote('$.products."' + product.id + '"')}) WHERE id='home-solutions' AND JSON_VALID(configuration) AND ${guard};\n`
  sql += `UPDATE site_content SET status='deleted',show_on_home=0 WHERE type='products' AND id=${quote(product.id)} AND ${guard};\n`
}
// Patch only known references that still contain the old ID. Other scene text, models and camera settings stay intact.
for (const patch of catalog.showcasePatches) {
  sql += `UPDATE site_settings SET configuration=JSON_SET(configuration,${quote(patch.path)},${quote(patch.to)})\nWHERE id='product-showcase' AND JSON_VALID(configuration) AND JSON_UNQUOTE(JSON_EXTRACT(configuration,${quote(patch.path)}))=${quote(patch.from)} AND ${guard};\n`
}
sql += `INSERT INTO app_migrations (id) SELECT ${quote(marker)} WHERE ${guard};\nCOMMIT;\n`
mkdirSync('database/migrations', { recursive: true })
writeFileSync('database/migrations/2026-10-20-product-catalog-sync.sql', sql)
writeFileSync('server/src/main/resources/db/20-product-catalog-sync.sql', sql)
console.log(`Built catalog alignment: ${catalog.products.length} official products; ${catalog.removed.length} surplus products retired.`)
