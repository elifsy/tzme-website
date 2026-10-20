import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const value = JSON.parse(readFileSync('server/src/main/resources/product-showcase-defaults.json', 'utf8'))
const literal = `CONVERT(0x${Buffer.from(JSON.stringify(value)).toString('hex')} USING utf8mb4)`
const sql = `-- Product center scene settings. Existing administrator changes are preserved.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\nINSERT INTO site_settings (id, configuration) SELECT 'product-showcase',${literal} WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE id='product-showcase');\nINSERT INTO app_migrations (id) SELECT '2026-10-17-product-showcase-v1' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-17-product-showcase-v1');\nCOMMIT;\n`
mkdirSync('database/migrations', { recursive: true })
writeFileSync('database/migrations/2026-10-17-product-showcase.sql', sql)
writeFileSync('server/src/main/resources/db/16-product-showcase.sql', sql)
