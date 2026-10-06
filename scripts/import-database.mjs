import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

if (!process.env.TZME_DB_USER || !process.env.TZME_DB_PASSWORD) throw new Error('Set TZME_DB_USER and TZME_DB_PASSWORD')
const file = resolve(process.argv[2] || 'database/install.sql')
const result = spawnSync(process.env.TZME_MYSQL_CLI || 'mysql', [
  `--host=${process.env.TZME_DB_HOST || '127.0.0.1'}`, `--port=${process.env.TZME_DB_PORT || '3306'}`,
  `--user=${process.env.TZME_DB_USER}`, '--default-character-set=utf8mb4',
  process.env.TZME_DB_NAME || 'tzme_corporate',
], {
  input: readFileSync(file), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  env: { ...process.env, MYSQL_PWD: process.env.TZME_DB_PASSWORD },
})
if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'MySQL import failed')
console.log(`Imported ${file}.`)
