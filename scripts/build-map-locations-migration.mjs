import { readFileSync, writeFileSync } from 'node:fs'
import { chinaMapPosition, mapCityPresets, taiwanMapLabel } from '../src/data/mapLocations.js'

const filename = 'src/data/mapCountries.json'
const catalog = JSON.parse(readFileSync(filename, 'utf8'))
if (!catalog.countries.some(point => point.id === 'country-TW')) throw Error('The Taiwan map preset is missing')
const cityIds = new Set(mapCityPresets.map(point => point.id))
catalog.countries = [...catalog.countries.filter(point => !cityIds.has(point.id))
  .map(point => point.id === 'country-TW' ? { ...point, label: taiwanMapLabel }
    : point.id === 'country-CN' ? { ...point, ...chinaMapPosition } : point), ...mapCityPresets]
  .sort((a, b) => a.label.en.localeCompare(b.label.en))
writeFileSync(filename, JSON.stringify(catalog, null, 2) + '\n')

const marker = '2026-10-22-global-map-locations-v1'
const guard = `NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='${marker}')`
const quote = value => `CONVERT(0x${Buffer.from(value, 'utf8').toString('hex')} USING utf8mb4)`
let sql = '-- Add Abu Dhabi and Dubai as editable city presets and highlighted locations.\n-- Rename the existing Taiwan label without replacing custom points, copy or statistics.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n'
for (const [table, id, array] of [['site_settings', "'website'", 'mapCountries'], ['home_global_settings', '1', 'mapPoints']]) {
  const path = `JSON_UNQUOTE(JSON_SEARCH(configuration,'one','country-TW',NULL,'$.${array}[*].id'))`
  for (const [language, oldName] of [['zh', '台湾'], ['en', 'Taiwan']]) {
    const labelPath = `REPLACE(${path},'.id','.label.${language}')`
    sql += `UPDATE ${table} SET configuration=JSON_SET(configuration,${labelPath},${quote(taiwanMapLabel[language])}) WHERE id=${id} AND ${path} IS NOT NULL AND CAST(JSON_UNQUOTE(JSON_EXTRACT(configuration,${labelPath})) AS BINARY)=CAST(${quote(oldName)} AS BINARY) AND ${guard};\n`
  }
  for (const city of mapCityPresets) {
    const point = array === 'mapCountries' ? city : { id: city.id, label: city.label, x: city.x, y: city.y }
    const limit = array === 'mapPoints' ? ` AND JSON_LENGTH(JSON_EXTRACT(configuration,'$.${array}'))<100` : ''
    sql += `UPDATE ${table} SET configuration=JSON_ARRAY_APPEND(configuration,'$.${array}',CAST(${quote(JSON.stringify(point))} AS JSON)) WHERE id=${id} AND JSON_TYPE(JSON_EXTRACT(configuration,'$.${array}'))='ARRAY' AND JSON_SEARCH(configuration,'one',${quote(city.id)},NULL,'$.${array}[*].id') IS NULL${limit} AND ${guard};\n`
  }
}
sql += `INSERT INTO app_migrations (id) SELECT '${marker}' WHERE ${guard};\nCOMMIT;\n`
writeFileSync('database/migrations/2026-10-22-global-map-locations.sql', sql)
writeFileSync('server/src/main/resources/db/22-global-map-locations.sql', sql)
console.log(`Map catalog: ${catalog.countries.length} locations; built guarded city and label migration.`)

const chinaMarker = '2026-10-22-china-map-tianjin-v1'
const chinaGuard = `NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='${chinaMarker}')`
let chinaSql = '-- Anchor the China preset and selected marker at Tianjin.\n-- Update coordinates only, once; later backend edits remain editable.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n'
for (const [table, id, array] of [['site_settings', "'website'", 'mapCountries'], ['home_global_settings', '1', 'mapPoints']]) {
  const path = `JSON_UNQUOTE(JSON_SEARCH(configuration,'one','country-CN',NULL,'$.${array}[*].id'))`
  chinaSql += `UPDATE ${table} SET configuration=JSON_SET(configuration,REPLACE(${path},'.id','.x'),${chinaMapPosition.x},REPLACE(${path},'.id','.y'),${chinaMapPosition.y}) WHERE id=${id} AND ${path} IS NOT NULL AND ${chinaGuard};\n`
}
chinaSql += `INSERT INTO app_migrations (id) SELECT '${chinaMarker}' WHERE ${chinaGuard};\nCOMMIT;\n`
writeFileSync('database/migrations/2026-10-22-china-map-tianjin.sql', chinaSql)
writeFileSync('server/src/main/resources/db/23-china-map-tianjin.sql', chinaSql)
console.log(`China map origin: Tianjin (${chinaMapPosition.x}, ${chinaMapPosition.y}); built guarded coordinate migration.`)
