// Rebuild from Natural Earth's public domain 1:50m country GeoJSON.
// node scripts/build-world-map.mjs <path-to-ne_50m_admin_0_countries.geojson>
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

if (!process.argv[2]) throw new Error('Supply the Natural Earth country GeoJSON path')
const { features } = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const round = (value) => Math.round(value * 1000) / 1000
const project = (longitude, latitude) => [
  round(2 + (longitude + 180) / 360 * 96),
  round(4 + (85 - latitude) / 145 * 92),
]
function insideRing(longitude, latitude, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > latitude) !== (yj > latitude)
      && longitude < (xj - xi) * (latitude - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const polygons = features.filter((feature) => feature.properties.ADMIN !== 'Antarctica')
  .flatMap(({ geometry }) => geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates)
  .map((rings) => ({
    rings,
    minX: Math.min(...rings[0].map(([x]) => x)), maxX: Math.max(...rings[0].map(([x]) => x)),
    minY: Math.min(...rings[0].map(([, y]) => y)), maxY: Math.max(...rings[0].map(([, y]) => y)),
  }))
const dots = []
for (let latitude = -59; latitude <= 84; latitude += 2.5) {
  for (let longitude = -179; longitude <= 179; longitude += 2.5) {
    if (!polygons.some((polygon) => longitude >= polygon.minX && longitude <= polygon.maxX
      && latitude >= polygon.minY && latitude <= polygon.maxY
      && insideRing(longitude, latitude, polygon.rings[0])
      && !polygon.rings.slice(1).some((ring) => insideRing(longitude, latitude, ring)))) continue
    const [x, y] = project(longitude, latitude)
    dots.push(`M${round(x * 10)},${round(y * 4.6 - 1.5)}l1.5,1.5 -1.5,1.5 -1.5,-1.5z`)
  }
}
const overrides = {
  CN: { en: 'China', zh: '中国' }, TW: { en: 'Taiwan', zh: '台湾' },
  HK: { en: 'Hong Kong', zh: '香港' }, MO: { en: 'Macao', zh: '澳门' },
}
const countries = features.filter((feature) => feature.properties.ADMIN !== 'Antarctica')
  .map(({ properties: item }) => {
    const code = item.ISO_A2_EH !== '-99' ? item.ISO_A2_EH : item.ADM0_A3
    const [x, y] = project(item.LABEL_X, item.LABEL_Y)
    return { id: `country-${code}`, code, label: overrides[code] || { en: item.NAME_EN || item.NAME, zh: item.NAME_ZH || item.NAME_EN || item.NAME }, x, y }
  }).filter((item) => Number.isFinite(item.x) && Number.isFinite(item.y) && item.y >= 0 && item.y <= 100)
  .sort((a, b) => a.label.en.localeCompare(b.label.en))
const source = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'
writeFileSync(fileURLToPath(new URL('../assets/world-dots.svg', import.meta.url)),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 460"><!-- Natural Earth public domain land silhouette; no political boundaries. --><path fill="#659bb7" fill-opacity=".82" d="${dots.join('')}"/></svg>\n`)
writeFileSync(fileURLToPath(new URL('../src/data/mapCountries.json', import.meta.url)),
  JSON.stringify({ source, license: 'Public domain', countries }, null, 2) + '\n')
console.log(`Generated ${dots.length} map dots and ${countries.length} country/region presets.`)
