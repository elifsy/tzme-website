import { readFileSync, writeFileSync } from 'node:fs'

// This versioned snapshot is self-contained: source documents under docs/ are not build inputs.
const catalog = JSON.parse(readFileSync('database/baseline/official-products.json', 'utf8'))
const marker = '2026-10-15-official-products-v1'
const quote = value => value == null ? 'NULL' : typeof value === 'boolean' ? String(Number(value)) : typeof value === 'number' ? String(value) : "'" + String(value).replaceAll('\\', '\\\\').replaceAll("'", "''") + "'"
const snake = name => name.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase())
const guard = `NOT EXISTS (SELECT 1 FROM app_migrations WHERE id=${quote(marker)})`
const ids = new Set()
let sql = `-- Official TZME product catalog: ${catalog.source}\n-- Add missing records once. Preserve CMS fields, deletion markers and home selections.\n-- Source mapping and editorial notes: database/baseline/official-products.json\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n`
function insert(table, fields) {
  sql += `INSERT INTO ${table} (${Object.keys(fields).map(key => '`' + key + '`').join(',')}) SELECT ${Object.values(fields).map(quote).join(',')} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM ${table} WHERE id=${quote(fields.id)});\n`
}
for (const industry of catalog.industries) {
  if (ids.has(industry.id)) throw Error(`Duplicate industry: ${industry.id}`)
  ids.add(industry.id)
  insert('industries', Object.fromEntries(Object.entries(industry).map(([key, value]) => [snake(key), value])))
}
ids.clear()
const columns = ['id', 'titleEn', 'titleZh', 'categoryEn', 'categoryZh', 'summaryEn', 'summaryZh', 'contentEn', 'contentZh', 'featuresEn', 'featuresZh', 'specificationsEn', 'specificationsZh', 'image', 'status', 'showOnHome', 'homeOrder']
for (const product of catalog.products) {
  if (ids.has(product.id)) throw Error(`Duplicate product: ${product.id}`)
  ids.add(product.id)
  if (!product.image.startsWith('/assets/tzme-products/') || !product.industries.length || !product.titleZh || !product.contentZh) throw Error(`Incomplete product: ${product.id}`)
  const fields = Object.fromEntries(columns.map(key => [snake(key), product[key]]))
  Object.assign(fields, { type: 'products', title: product.titleEn, category: product.categoryEn, summary: product.summaryEn, content: product.contentEn, industry: product.industries[0], industry_ids: product.industries.join(','), date: null })
  insert('site_content', fields)
}
// Only add proven application links. Existing links, text, images, status and homepage ordering remain intact.
for (const association of catalog.associations) for (const industry of association.industries) {
  const current = "COALESCE(NULLIF(industry_ids,''),industry,'')"
  sql += `UPDATE site_content SET industry_ids=CONCAT_WS(',',NULLIF(${current},''),${quote(industry)}) WHERE id=${quote(association.id)} AND type='products' AND status='published' AND FIND_IN_SET(${quote(industry)},${current})=0 AND EXISTS (SELECT 1 FROM industries WHERE id=${quote(industry)} AND status='published') AND ${guard};\n`
}
sql += `INSERT INTO app_migrations (id) SELECT ${quote(marker)} WHERE ${guard};\nCOMMIT;\n`
writeFileSync('database/migrations/2026-10-15-official-products.sql', sql)
writeFileSync('server/src/main/resources/db/11-official-products.sql', sql)
console.log(`Built official product migration: ${catalog.products.length} products, ${catalog.industries.length} industries.`)
