import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const roots = ['tzme-j', 'tzme-products', 'tzme-newsroom/images']
const output = 'public/assets/optimized'
const manifestPath = 'src/data/imageVariants.json'
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}
const manifest = {}
mkdirSync(output, { recursive: true })
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)])
const files = roots.flatMap(root => walk(path.join('public/assets', root))).filter(file => /\.(?:png|jpe?g|webp)$/i.test(file) && !file.includes('certificate-previews') && !file.endsWith('official-mark-small.webp'))
// A few legacy fallbacks are still referenced by existing published records.
for (const name of readdirSync('public/assets')) if (/\.(?:png|jpe?g|webp)$/i.test(name)) files.push(path.join('public/assets', name))
let generated = 0, originalBytes = 0, displayBytes = 0
for (const file of files) {
  const bytes = readFileSync(file), source = '/' + file.replaceAll('\\', '/').slice('public/'.length)
  if (bytes.length < 80000 && !source.endsWith('/brand/official-mark.jpg')) continue
  const fingerprint = createHash('sha256').update(bytes).update('variants-v1-q88').digest('hex').slice(0, 12)
  const cached = previous[source]
  if (cached?.fingerprint === fingerprint && cached.variants.every(item => existsSync('public' + item.src))) {
    manifest[source] = cached; originalBytes += bytes.length; displayBytes += cached.variants.at(-1).bytes; continue
  }
  const image = await loadImage(bytes)
  if (image.width < 640 && !source.endsWith('/brand/official-mark.jpg')) continue
  const logo = source.endsWith('/brand/official-mark.jpg')
  const targets = [...new Set((logo ? [160, 320] : [480, 960, 1600, 2400]).map(width => Math.min(width, image.width)))]
  const variants = []
  for (const width of targets) {
    const height = Math.max(1, Math.round(image.height * width / image.width))
    const canvas = createCanvas(width, height), context = canvas.getContext('2d')
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, width, height)
    const encoded = canvas.encodeSync('webp', logo || source.includes('/presentation/') ? 94 : 88)
    const filename = `${path.basename(file).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-')}-${fingerprint}-w${width}.webp`
    const src = '/assets/optimized/' + filename
    writeFileSync('public' + src, encoded)
    variants.push({ src, width, height, bytes: encoded.length })
    generated++
  }
  manifest[source] = { fingerprint, width: image.width, height: image.height, originalBytes: bytes.length, variants }
  originalBytes += bytes.length; displayBytes += variants.at(-1).bytes
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
writeFileSync('server/src/main/resources/image-variants.json', JSON.stringify(manifest) + '\n')
const logo = manifest['/assets/tzme-j/brand/official-mark.jpg']?.variants.at(-1)
if (logo) writeFileSync('public/assets/tzme-j/brand/official-mark-small.webp', readFileSync('public' + logo.src))
console.log(`Responsive images: ${Object.keys(manifest).length} sources, ${generated} generated; largest display variants ${Math.round(displayBytes / 1024)} KB / originals ${Math.round(originalBytes / 1024)} KB`)
