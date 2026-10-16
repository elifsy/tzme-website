import { readFileSync, writeFileSync } from 'node:fs'

const settings = JSON.parse(readFileSync('database/baseline/home-solutions.json', 'utf8'))
const quote = value => "'" + String(value).replaceAll('\\', '\\\\').replaceAll("'", "''") + "'"
const sql = `-- Homepage solution copy. Initialize once and preserve subsequent CMS changes.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\nINSERT INTO site_settings (id,configuration) SELECT 'home-solutions',${quote(JSON.stringify(settings))} WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE id='home-solutions');\nINSERT INTO app_migrations (id) SELECT '2026-10-15-home-solutions-v1' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-15-home-solutions-v1');\nCOMMIT;\n`
writeFileSync('database/migrations/2026-10-15-home-solutions.sql', sql)
writeFileSync('server/src/main/resources/db/12-home-solutions.sql', sql)
console.log('Built database-backed homepage solution copy migration.')
