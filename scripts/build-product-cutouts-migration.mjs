import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, sep } from 'node:path'

const { products } = JSON.parse(readFileSync('database/baseline/product-presentation-images.json', 'utf8'))
const marker = '2026-10-20-product-cutouts-v1'
const assetRoot = resolve('public') + sep
const quote = value => "'" + String(value ?? '').replaceAll("'", "''") + "'"
const statements = products.map(product => {
  if (!/^[a-z0-9-]+$/.test(product.id) || !product.presentationImage.startsWith('/assets/')) throw new Error('Invalid product image mapping')
  const asset = resolve('public' + product.presentationImage)
  if (!asset.startsWith(assetRoot) || !existsSync(asset)) throw new Error(`Missing presentation image: ${product.id}`)
  const expected = product.expectedPresentationImage ? ` OR presentation_image=${quote(product.expectedPresentationImage)}` : ''
  return `UPDATE site_content SET presentation_image=${quote(product.presentationImage)}\nWHERE type='products' AND id=${quote(product.id)} AND image=${quote(product.sourceImage)}\n  AND (presentation_image IS NULL OR presentation_image=''${expected})\n  AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id=${quote(marker)});`
})
const sql = `-- Transparent equipment presentation images for the retained official product catalog.\n-- Original covers, business copy, future administrator replacements and explicit clears are preserved.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n${statements.join('\n')}\nINSERT INTO app_migrations (id) SELECT ${quote(marker)} WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id=${quote(marker)});\nCOMMIT;\n`
mkdirSync('database/migrations', { recursive: true })
writeFileSync('database/migrations/2026-10-20-product-cutouts.sql', sql)
writeFileSync('server/src/main/resources/db/19-product-cutouts.sql', sql)
console.log(`Built transparent presentation image migration: ${products.length} products, ${new Set(products.map(p => p.presentationImage)).size} images.`)
