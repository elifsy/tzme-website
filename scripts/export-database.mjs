import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const binary = process.env.TZME_MYSQL_CLI || 'mysql'
const dumpBinary = process.env.TZME_MYSQLDUMP_CLI || binary.replace(/mysql(\.exe)?$/i, 'mysqldump$1')
const database = process.env.TZME_DB_NAME || 'tzme_corporate'
if (!process.env.TZME_DB_USER || !process.env.TZME_DB_PASSWORD) throw new Error('Set TZME_DB_USER and TZME_DB_PASSWORD')
function query(sql) {
  const result = spawnSync(binary, [
    `--host=${process.env.TZME_DB_HOST || '127.0.0.1'}`, `--port=${process.env.TZME_DB_PORT || '3306'}`,
    `--user=${process.env.TZME_DB_USER}`, '--default-character-set=utf8mb4', '--batch', '--raw', '--skip-column-names',
    database, `--execute=${sql}`,
  ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, MYSQL_PWD: process.env.TZME_DB_PASSWORD } })
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'MySQL export failed')
  return result.stdout.trim()
}
const tables = query('SHOW TABLES').split(/\r?\n/).filter(Boolean)
const snapshot = { exportedAt: new Date().toISOString(), database, tables: {} }
for (const table of tables) {
  if (!/^[a-zA-Z0-9_]+$/.test(table)) throw new Error('Unsupported table name')
  const columns = query(`SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='${table}' ORDER BY ORDINAL_POSITION`)
    .split(/\r?\n/).map((line) => line.split('\t'))
  const fields = columns.map(([column, type]) => `'${column}', ${type === 'bit' ? `CAST(\`${column}\` AS UNSIGNED)` : `\`${column}\``}`).join(', ')
  const rows = query(`SELECT JSON_OBJECT(${fields}) FROM \`${table}\``).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  snapshot.tables[table] = rows
  console.log(`${table}: ${rows.length} records exported`)
}
const directory = resolve('database/snapshots')
mkdirSync(directory, { recursive: true })
const dump = spawnSync(dumpBinary, [
  `--host=${process.env.TZME_DB_HOST || '127.0.0.1'}`, `--port=${process.env.TZME_DB_PORT || '3306'}`,
  `--user=${process.env.TZME_DB_USER}`, '--default-character-set=utf8mb4', '--single-transaction',
  '--no-tablespaces', '--skip-add-drop-table', '--set-gtid-purged=OFF', '--complete-insert', '--hex-blob', database,
], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, MYSQL_PWD: process.env.TZME_DB_PASSWORD } })
if (dump.status !== 0) throw new Error(dump.stderr || dump.error?.message || 'MySQL SQL backup failed')
writeFileSync(resolve(directory, 'export.sql'), dump.stdout, 'utf8')
writeFileSync(resolve(directory, 'current.json'), JSON.stringify(snapshot, null, 2) + '\n')
console.log('Saved database/snapshots/export.sql and current.json (excluded from Git).')
