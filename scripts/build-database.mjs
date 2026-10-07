import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { products, articles } from '../src/data/content.js'
import { industrySeed } from '../src/data/industries.js'
import { certificationSeed } from '../src/data/certifications.js'
import { projectSeed } from '../src/data/projects.js'
import { localeMessages } from '../src/i18n/locales/index.js'
import './build-contact-baseline.mjs'

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const recordPath = 'database/baseline/records.json'
const snapshot = existsSync('database/snapshots/current.json') ? readJson('database/snapshots/current.json').tables : {}
const snake = (name) => name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
function fields(record, names) {
  return Object.fromEntries(names.map((name) => [snake(name), record[name] ?? null]))
}
const contentFields = ['id', 'type', 'title', 'titleEn', 'titleZh', 'category', 'categoryEn', 'categoryZh', 'industry',
  'summary', 'summaryEn', 'summaryZh', 'image', 'status', 'date', 'content', 'contentEn', 'contentZh',
  'featuresEn', 'featuresZh', 'specificationsEn', 'specificationsZh', 'showOnHome', 'homeOrder']
const projectFields = ['id', 'titleEn', 'titleZh', 'industryEn', 'industryZh', 'locationEn', 'locationZh', 'imageAltEn', 'imageAltZh',
  'summaryEn', 'summaryZh', 'contentEn', 'contentZh', 'capacityLabelEn', 'capacityLabelZh', 'capacityEn', 'capacityZh',
  'technologyLabelEn', 'technologyLabelZh', 'technologyEn', 'technologyZh', 'scopeLabelEn', 'scopeLabelZh', 'scopeEn', 'scopeZh',
  'image', 'status', 'sortOrder', 'showOnHome', 'homeOrder']
function merge(table, base) {
  const records = new Map(base.map((record) => [String(record.id), record]))
  for (const row of snapshot[table] || []) {
    const { db_id: ignored, ...saved } = row
    const merged = { ...records.get(String(row.id)) }
    for (const [key, value] of Object.entries(saved)) {
      if (value !== null || merged[key] === undefined) merged[key] = value
    }
    if (table === 'site_content' && saved.industry_ids == null && saved.industry) merged.industry_ids = saved.industry
    records.set(String(row.id), merged)
  }
  return [...records.values()]
}
let records
if (existsSync(recordPath) && !process.argv.includes('--refresh-baseline')) records = readJson(recordPath)
else {
  records = {
    industries: merge('industries', industrySeed.map((record) => fields(record, ['id', 'titleEn', 'titleZh', 'subtitleEn', 'subtitleZh', 'icon', 'sortOrder', 'status']))),
    site_content: merge('site_content', [...products.map((p) => ({ ...p, type: 'products' })), ...articles.map((a) => ({ ...a, type: 'articles' }))]
      .map((record) => ({ ...fields(record, contentFields), industry_ids: (record.industries || []).join(',') }))),
    certifications: merge('certifications', certificationSeed.map((record) => ({
      ...fields(record, ['id', 'titleEn', 'titleZh', 'issuerEn', 'issuerZh', 'summaryEn', 'summaryZh', 'certificateNo', 'image', 'status', 'sortOrder']),
      issued_at: record.issuedAt || null, expires_at: record.expiresAt || null,
    }))),
    projects: merge('projects', projectSeed.map((record) => fields(record, projectFields))),
    home_global_settings: merge('home_global_settings', [{ id: 1, configuration: JSON.stringify(readJson('server/src/main/resources/home-global-defaults.json')) }]),
    site_inquiries: snapshot.site_inquiries || [],
    inquiry_attachments: snapshot.inquiry_attachments || [],
  }
  // Existing database selections take priority over the source seed selections.
  const savedIds = new Set((snapshot.site_content || []).map((row) => row.id))
  let homeCount = records.site_content.filter((row) => savedIds.has(row.id) && row.type === 'products' && row.show_on_home).length
  for (const row of records.site_content) {
    if (row.type === 'products' && row.show_on_home && !savedIds.has(row.id)) row.show_on_home = homeCount++ < 5
  }
  mkdirSync('database/baseline', { recursive: true })
  writeFileSync(recordPath, JSON.stringify(records, null, 2) + '\n')
}
records.inquiry_attachments ||= []
const baseline = readJson('database/baseline/site-settings.json')
const settings = {
  ...baseline, translations: Object.fromEntries(Object.entries(localeMessages).map(([code, messages]) => [code, messages.site])),
  mapCountries: readJson('src/data/mapCountries.json').countries,
}
const contactPath = 'database/baseline/contact-settings.json'
if (process.argv.includes('--refresh-baseline')) {
  const saved = (snapshot.site_settings || []).find(row => row.id === 'contact')
  if (saved) {
    const value = typeof saved.configuration === 'string' ? JSON.parse(saved.configuration) : saved.configuration
    value.notification.enabled = false
    value.notification.smtp.password = ''
    delete value.notification.smtp.passwordConfigured
    delete value.notification.smtp.clearPassword
    writeFileSync(contactPath, JSON.stringify(value, null, 2) + '\n')
  }
}
const contact = readJson(contactPath)
if (contact.notification?.smtp?.password) throw new Error('Do not put SMTP credentials into committed baseline data')
const tables = { ...records, site_settings: [{ id: 'website', configuration: JSON.stringify(settings) }] }
function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value === 'number') { if (!Number.isFinite(value)) throw new Error('Invalid number'); return String(value) }
  if (value === '') return "''"
  // UTF-8 hex literals preserve rich text/newlines in every SQL mode and shell.
  return `CONVERT(0x${Buffer.from(String(value), 'utf8').toString('hex')} USING utf8mb4) COLLATE utf8mb4_unicode_ci`
}
const marker = '2026-10-database-baseline-v1'
let data = '-- Generated by npm run db:build. Readable source: database/baseline/.\n'
data += '-- Seeds run only once; existing rows and later admin edits are preserved.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n'
for (const [table, rows] of Object.entries(tables)) {
  data += `\n-- ${table}: ${rows.length} records\n`
  for (const row of rows) {
    const entries = Object.entries(row)
    if (table === 'site_content') {
      // Complete only absent legacy columns, preserving every non-null edit.
      const additions = entries.filter(([key, value]) => key !== 'id' && value !== null)
      data += `UPDATE \`${table}\` SET ${additions.map(([key, value]) => `\`${key}\` = COALESCE(\`${key}\`, ${sqlValue(value)})`).join(', ')}\n`
      data += `WHERE id = ${sqlValue(row.id)} AND NOT EXISTS (SELECT 1 FROM app_migrations WHERE id = '${marker}');\n`
    }
    data += `INSERT INTO \`${table}\` (${entries.map(([key]) => `\`${key}\``).join(', ')})\nSELECT ${entries.map(([, value]) => sqlValue(value)).join(', ')}\n`
    data += `WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id = '${marker}')\n`
    data += `AND NOT EXISTS (SELECT 1 FROM \`${table}\` WHERE id = ${sqlValue(row.id)});\n`
  }
}
data += `\nINSERT INTO app_migrations (id) SELECT '${marker}' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id = '${marker}');\nCOMMIT;\n`
const resources = 'server/src/main/resources/db'
const schema = readFileSync(resolve(resources, '01-schema.sql'), 'utf8')
// Existing deployments add the new inquiry fields before the comment migration.
const inquiryDefinition = schema.match(/CREATE TABLE IF NOT EXISTS site_inquiries \(([\s\S]*?)\) ENGINE=/)[1]
const newInquiryColumns = inquiryDefinition.trim().split(/\r?\n/).map(line => line.trim().replace(/,$/, ''))
  .filter(line => /^(locale|notes|mail_\w+)\s/.test(line))
let contactMigration = '-- Generated by npm run db:build. Existing contact configuration is preserved.\nSET NAMES utf8mb4;\n'
for (const column of newInquiryColumns) {
  const name = column.split(/\s/)[0]
  const type = column.split(/\s/)[1].replace(/\(.*\)/, '').toLowerCase()
  const statement = `ALTER TABLE site_inquiries ADD COLUMN ${column}`
  const modify = `ALTER TABLE site_inquiries MODIFY COLUMN ${column}`
  const exists = `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='site_inquiries' AND COLUMN_NAME='${name}'`
  contactMigration += `SET @tzme_contact_sql = IF(EXISTS (${exists}), IF(EXISTS (${exists} AND DATA_TYPE='${type}'), 'SELECT 1', '${modify.replaceAll("'", "''")}'), '${statement.replaceAll("'", "''")}');\n`
  contactMigration += 'PREPARE tzme_contact_statement FROM @tzme_contact_sql;\nEXECUTE tzme_contact_statement;\nDEALLOCATE PREPARE tzme_contact_statement;\n'
}
contactMigration += '\n' + schema.match(/CREATE TABLE IF NOT EXISTS inquiry_attachments \([\s\S]*?;/)[0] + '\n'
const inquiryStatus = inquiryDefinition.trim().split(/\r?\n/).map(line => line.trim().replace(/,$/, '')).find(line => line.startsWith('status '))
contactMigration += `ALTER TABLE site_inquiries MODIFY COLUMN ${inquiryStatus};\n`
const sharedSettingsColumns = schema.match(/CREATE TABLE IF NOT EXISTS site_settings \(([\s\S]*?)\) ENGINE=/)[1].trim().split(/\r?\n/).map(line => line.trim().replace(/,$/, '').replace(/\s+PRIMARY KEY\b/, ''))
contactMigration += `ALTER TABLE site_settings ${sharedSettingsColumns.map(column => 'MODIFY COLUMN ' + column).join(', ')};\n`
contactMigration += `INSERT INTO site_settings (id, configuration) SELECT 'contact', ${sqlValue(JSON.stringify(contact))} WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE id='contact');\n`
contactMigration += "INSERT INTO app_migrations (id) SELECT '2026-10-contact-inquiries-v1' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-contact-inquiries-v1');\n"
writeFileSync(resolve(resources, '04-contact.sql'), contactMigration)
mkdirSync('database/migrations', { recursive: true })
writeFileSync('database/migrations/2026-10-contact-inquiries.sql', contactMigration)
let socialMigration = '-- Generated by npm run db:build. Add per-language footer links without changing existing contact or mail settings.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n'
socialMigration += `UPDATE site_settings SET configuration = JSON_SET(configuration, '$.contact.socialLinks', CAST(${sqlValue(JSON.stringify(contact.contact.socialLinks || { en: [], zh: [] }))} AS JSON))\n`
socialMigration += "WHERE id='contact' AND JSON_VALID(configuration) AND NOT JSON_CONTAINS_PATH(configuration, 'one', '$.contact.socialLinks');\n"
socialMigration += "INSERT INTO app_migrations (id) SELECT '2026-10-social-links-v1' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-social-links-v1');\nCOMMIT;\n"
writeFileSync(resolve(resources, '05-social-links.sql'), socialMigration)
writeFileSync('database/migrations/2026-10-social-links.sql', socialMigration)
const industryIconDefinition = schema.match(/CREATE TABLE IF NOT EXISTS industries \(([\s\S]*?)\) ENGINE=/)[1]
  .trim().split(/\r?\n/).map(line => line.trim().replace(/,$/, '')).find(line => line.startsWith('icon '))
if (!industryIconDefinition) throw new Error('Missing annotated industry icon column')
const industryIconMarker = '2026-10-industry-icons-v1'
const industryIconAlter = `ALTER TABLE industries ADD COLUMN ${industryIconDefinition}`
let industryIconMigration = '-- Generated by npm run db:build. Add industry icons and preserve later admin edits.\nSET NAMES utf8mb4;\n'
industryIconMigration += `SET @tzme_industry_icon_sql = IF(EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='industries' AND COLUMN_NAME='icon'), 'SELECT 1', '${industryIconAlter.replaceAll("'", "''")}');\n`
industryIconMigration += 'PREPARE tzme_industry_icon_statement FROM @tzme_industry_icon_sql;\nEXECUTE tzme_industry_icon_statement;\nDEALLOCATE PREPARE tzme_industry_icon_statement;\nSTART TRANSACTION;\n'
industryIconMigration += `SET @tzme_industry_icons_done = EXISTS (SELECT 1 FROM app_migrations WHERE id='${industryIconMarker}');\n`
for (const industry of industrySeed) {
  industryIconMigration += `UPDATE industries SET icon=${sqlValue(industry.icon)} WHERE id=${sqlValue(industry.id)} AND COALESCE(icon, '')='' AND NOT @tzme_industry_icons_done;\n`
}
industryIconMigration += `INSERT INTO app_migrations (id) SELECT '${industryIconMarker}' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='${industryIconMarker}');\nCOMMIT;\n`
writeFileSync(resolve(resources, '06-industry-icons.sql'), industryIconMigration)
writeFileSync('database/migrations/2026-10-industry-icons.sql', industryIconMigration)
// Keep the existing-database comment migration in sync with the schema.
const commentMarker = '2026-10-column-comments-v1'
let comments = '-- Generated by npm run db:build from 01-schema.sql.\n'
comments += '-- 为已有数据库补充中文表和字段备注；版本标记确保只执行一次。\nSET NAMES utf8mb4;\n'
comments += `SET @tzme_comments_done = EXISTS (SELECT 1 FROM app_migrations WHERE id = '${commentMarker}');\n`
let columnCount = 0
const definitions = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\) ENGINE=[^;]*?COMMENT='((?:[^']|'')+)';/g)]
if (!definitions.length) throw new Error('No annotated tables found in schema')
for (const [, table, body, tableComment] of definitions) {
  const columns = body.trim().split(/\r?\n/).map((line) => line.trim().replace(/,$/, ''))
  for (const column of columns) {
    if (!/^[a-z_]+\s+/i.test(column) || !/\bCOMMENT\s+'/.test(column)) throw new Error(`Missing column comment: ${table}`)
  }
  columnCount += columns.length
  const modifications = columns.map((column) => 'MODIFY COLUMN ' + column.replace(/\s+PRIMARY KEY\b|\s+UNIQUE\b/g, ''))
  const statement = `ALTER TABLE \`${table}\`\n  ${[...modifications, `COMMENT='${tableComment}'`].join(',\n  ')}`
  comments += `\nSET @tzme_comments_sql = IF(@tzme_comments_done, 'SELECT 1', '${statement.replaceAll("'", "''")}');\n`
  comments += 'PREPARE tzme_comments_statement FROM @tzme_comments_sql;\nEXECUTE tzme_comments_statement;\nDEALLOCATE PREPARE tzme_comments_statement;\n'
}
comments += `\nINSERT INTO app_migrations (id) SELECT '${commentMarker}' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id = '${commentMarker}');\n`
writeFileSync(resolve(resources, '03-comments.sql'), comments)
mkdirSync('database/migrations', { recursive: true })
writeFileSync('database/migrations/2026-10-column-comments.sql', comments)
writeFileSync(resolve(resources, '02-data.sql'), data)
writeFileSync('database/install.sql', '-- Select your target database before executing this file.\n' + schema + '\n' + contactMigration + '\n' + socialMigration + '\n' + industryIconMigration + '\n' + comments + '\n' + data)
console.log(`Chinese database comments: ${definitions.length} tables, ${columnCount} columns.`)
for (const [table, rows] of Object.entries(tables)) console.log(`${table}: ${rows.length} baseline records`)
console.log('Saved database/install.sql and the Java SQL resources.')
console.log('Contact configuration: seeded once by the contact/inquiry migration, with SMTP notifications disabled.')
