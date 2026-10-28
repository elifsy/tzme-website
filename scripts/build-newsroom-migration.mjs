import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const baseline = JSON.parse(readFileSync('database/baseline/newsroom.json', 'utf8'))
const marker = '2026-10-27-official-newsroom-v1'
const quote = value => value == null ? 'NULL' : typeof value === 'boolean' ? String(Number(value)) : typeof value === 'number' ? String(value) : "'" + String(value).replaceAll('\\', '\\\\').replaceAll("'", "''") + "'"
const guard = `NOT EXISTS (SELECT 1 FROM app_migrations WHERE id=${quote(marker)})`
const assets = new Map(baseline.assets.map(asset => [asset.path, asset]))
const ids = new Set(baseline.articles.map(article => article.id))
if (ids.size !== baseline.articles.length || !baseline.articles.length) throw Error('The newsroom snapshot contains missing or duplicate articles.')
for (const asset of baseline.assets) {
  if (!/^\/assets\/tzme-newsroom\/(images|documents)\/[a-z0-9-]+\.(jpg|png|pdf)$/.test(asset.path)) throw Error('Unexpected newsroom asset path.')
  const bytes = readFileSync('public' + asset.path)
  if (bytes.length !== asset.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw Error('Newsroom asset changed: ' + asset.path)
}
let sql = `-- Synchronize the current Newsroom from ${baseline.source}.\n-- Chinese translations preserve original facts, publication dates, article order and local copies of original media.\n-- Retire only the known sample stories. Run once; subsequent CMS edits are preserved.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n`
for (const article of baseline.articles) {
  if (!article.titleZh || !article.summaryZh || !article.contentZh || !/^\d{4}-\d{2}-\d{2}$/.test(article.date) || !assets.has(article.image) || !article.source.url.startsWith('https://www.tzmeglobal.com/')) throw Error('Incomplete article: ' + article.id)
  for (const match of article.contentZh.matchAll(/(?:src|href)="([^"\s]+)"/g)) {
    if (match[1].startsWith('/assets/') && !assets.has(match[1])) throw Error('Missing article asset: ' + match[1])
    if (match[1].startsWith('https://img03.71360.com')) throw Error('Article still depends on an external media URL.')
  }
  const record = {id:article.id,type:'articles',title:article.titleEn,title_en:article.titleEn,title_zh:article.titleZh,category:article.categoryEn,category_en:article.categoryEn,category_zh:article.categoryZh,summary:article.summaryEn,summary_en:article.summaryEn,summary_zh:article.summaryZh,content:article.contentEn,content_en:article.contentEn,content_zh:article.contentZh,image:article.image,date:article.date,status:'published',show_on_home:false,home_order:article.homeOrder}
  sql += `UPDATE site_content SET ${Object.entries(record).filter(([key]) => !['id','type'].includes(key)).map(([key,value]) => '`'+key+'`='+quote(value)).join(',')} WHERE id=${quote(article.id)} AND type='articles' AND ${guard};\n`
  sql += `INSERT INTO site_content (${Object.keys(record).map(key => '`'+key+'`').join(',')}) SELECT ${Object.values(record).map(quote).join(',')} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM site_content WHERE id=${quote(article.id)});\n`
}
for (const id of baseline.retiredIds) {
  if (ids.has(id)) throw Error('Cannot retire a synchronized article: ' + id)
  sql += `UPDATE site_content SET status='deleted',show_on_home=0 WHERE id=${quote(id)} AND type='articles' AND ${guard};\n`
}
sql += `INSERT INTO app_migrations (id) SELECT ${quote(marker)} WHERE ${guard};\nCOMMIT;\n`
writeFileSync('database/migrations/2026-10-27-newsroom.sql',sql)
writeFileSync('server/src/main/resources/db/27-newsroom.sql',sql)
if (process.argv.includes('--append-install') && !readFileSync('database/install.sql','utf8').includes(marker)) appendFileSync('database/install.sql','\n'+sql)
console.log(`Built Newsroom sync: ${baseline.articles.length} articles; ${baseline.assets.length} verified media files; ${baseline.retiredIds.length} sample stories retired.`)
