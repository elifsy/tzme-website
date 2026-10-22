import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = join(root, 'public/assets/tzme-j/certificates')
const output = join(directory, 'previews')
const manifestPath = join(root, 'src/data/certificatePreviews.json')
const edge = 720, quality = 85
let existing = {}
try { existing = JSON.parse(await readFile(manifestPath, 'utf8')) }
catch (error) { if (error.code !== 'ENOENT') throw error }

await mkdir(output, { recursive: true })
const manifest = {}, pending = []
let documentBytes = 0, previewBytes = 0
for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
  if (!entry.isFile() || !entry.name.endsWith('.pdf')) continue
  const bytes = await readFile(join(directory, entry.name))
  documentBytes += bytes.length
  const hash = createHash('sha256').update(`first-page:webp:${edge}:${quality}:v1:`).update(bytes).digest('hex').slice(0, 16)
  const filename = `${entry.name.slice(0, -4)}-${hash}.webp`
  const source = `/assets/tzme-j/certificates/${entry.name}`
  const image = `/assets/tzme-j/certificates/previews/${filename}`
  const previous = existing[source]
  let cached = false
  if (previous?.image === image && previous.width > 0 && previous.height > 0) {
    try { const info = await stat(join(output, filename)); cached = info.size > 0; if (cached) previewBytes += info.size }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  if (cached) manifest[source] = previous
  else { manifest[source] = null; pending.push({ bytes, source, image, filename }) }
}

if (pending.length) {
  const [{ getDocument }, { createCanvas }] = await Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), import('@napi-rs/canvas')])
  const resources = fileURLToPath(new URL('../node_modules/pdfjs-dist/', import.meta.url))
  const resource = name => join(resources, name).replaceAll('\\', '/') + '/'
  for (const item of pending) {
    const task = getDocument({ data: new Uint8Array(item.bytes), isEvalSupported: false,
      cMapUrl: resource('cmaps'), cMapPacked: true,
      standardFontDataUrl: resource('standard_fonts'),
      wasmUrl: resource('wasm'), iccUrl: resource('iccs') })
    try {
      const pdf = await task.promise, page = await pdf.getPage(1)
      const original = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: edge / Math.max(original.width, original.height) })
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
      await page.render({ canvasContext: canvas.getContext('2d'), viewport, background: '#ffffff' }).promise
      const bytes = canvas.toBuffer('image/webp', quality)
      await writeFile(join(output, item.filename), bytes)
      manifest[item.source] = { image: item.image, width: canvas.width, height: canvas.height }
      previewBytes += bytes.length
      console.log(`Preview ${item.source}: ${Math.round(bytes.length / 1024)} KB`)
    } finally { await task.destroy() }
  }
}

const json = JSON.stringify(manifest, null, 2) + '\n'
if (json !== JSON.stringify(existing, null, 2) + '\n') {
  await mkdir(dirname(manifestPath), { recursive: true })
  await writeFile(manifestPath, json)
}
console.log(`Certificate previews: ${Object.keys(manifest).length}, generated ${pending.length}, ${Math.round(documentBytes / 1024)} KB PDF → ${Math.round(previewBytes / 1024)} KB WebP`)
