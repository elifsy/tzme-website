import imageProfiles from '../data/equipmentPresentationImages.json'

export const equipmentLayouts = [
  { value: 'auto', label: '自动匹配设备比例', description: '根据设备主体比例选择布局，更换展示图后会重新匹配。' },
  { value: 'vertical', label: 'A · 左文右景', description: '介绍与咨询在左，设备在右侧前景，适合高瘦或低矮宽厚的设备。' },
  { value: 'exhibit', label: 'B · 开放式展台', description: '设备在左、介绍在右，用柔和投影表现方正、厚重设备的体积。' },
  { value: 'panorama', label: 'C · 宽幅场景', description: '标题与说明前置，设备横向展开，适合索道、管道、长臂和桁架。' },
]
const manualLayouts = new Set(equipmentLayouts.slice(1).map(item => item.value))
const analyzedImages = new Map()

// Previously saved platform selections retain an intentional side-by-side layout.
export const normalizeEquipmentLayout = value => value === 'platform' ? 'vertical' : value

export function knownEquipmentImage(source) {
  return imageProfiles[source] || null
}

export function resolveEquipmentLayout(preference, metrics, cutout = true) {
  const selected = normalizeEquipmentLayout(preference)
  if (manualLayouts.has(selected)) return selected
  if (!cutout) return 'exhibit'
  const hint = normalizeEquipmentLayout(metrics?.layoutHint)
  if (manualLayouts.has(hint)) return hint
  const bounds = metrics?.bounds
  if (!bounds) return 'exhibit'
  const ratio = (bounds.maxX - bounds.minX + 1) / (bounds.maxY - bounds.minY + 1)
  return ratio < .85 ? 'vertical' : ratio >= 2.55 ? 'panorama' : ratio < 1.5 ? 'exhibit' : 'vertical'
}

// Shipped image silhouettes need no canvas work. New uploads are measured once
// at a bounded resolution, then reused by the website and editor preview.
export function measureEquipmentImage(image, source) {
  const width = image.naturalWidth, height = image.naturalHeight
  const known = knownEquipmentImage(source)
  if (known?.width === width && known.height === height) return known
  const key = `${image.currentSrc || image.src}|${width}x${height}`
  if (analyzedImages.has(key)) return analyzedImages.get(key)
  const metrics = { width, height, bounds: { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 }, transparent: false }
  try {
    const canvas = image.ownerDocument.createElement('canvas')
    const scale = Math.min(1, 640 / Math.max(width, height))
    canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale))
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1, transparent = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] <= 16) { transparent++; continue }
      const index = i / 4, x = index % canvas.width, y = Math.floor(index / canvas.width)
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
    }
    if (maxX >= minX && maxY >= minY && transparent / (canvas.width * canvas.height) > .02) {
      metrics.transparent = true
      // Retain a small margin around fine cables and antialiased edges.
      metrics.bounds = {
        minX: Math.max(0, Math.floor((minX - 2) * width / canvas.width)),
        minY: Math.max(0, Math.floor((minY - 2) * height / canvas.height)),
        maxX: Math.min(width - 1, Math.ceil((maxX + 3) * width / canvas.width) - 1),
        maxY: Math.min(height - 1, Math.ceil((maxY + 3) * height / canvas.height) - 1),
      }
    }
  } catch {
    // Cross-origin images and opaque photos still retain their complete proportions.
  }
  if (analyzedImages.size >= 64) analyzedImages.delete(analyzedImages.keys().next().value)
  analyzedImages.set(key, metrics)
  return metrics
}

export function equipmentFrameStyle(metrics, stage, layout) {
  if (!metrics?.width || !stage.width || !stage.height) return undefined
  const bounds = metrics.bounds, width = bounds.maxX - bounds.minX + 1, height = bounds.maxY - bounds.minY + 1
  const inset = stage.mobile ? 18 : ({ vertical: 32, panorama: 40, exhibit: 80 }[layout] || 32)
  const scale = Math.max(0, Math.min((stage.width - inset) / width, (stage.height - inset) / height))
  return {
    width: `${width * scale}px`, height: `${height * scale}px`,
    '--equipment-subject-half-height': `${height * scale / 2}px`,
    '--equipment-image-width': `${100 * metrics.width / width}%`,
    '--equipment-image-height': `${100 * metrics.height / height}%`,
    '--equipment-image-left': `${-100 * bounds.minX / width}%`,
    '--equipment-image-top': `${-100 * bounds.minY / height}%`,
  }
}
