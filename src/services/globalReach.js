import { ref } from 'vue'
import { createGlobalReachSettings, MAX_GLOBAL_POINTS } from '../data/globalReach.js'

const cacheKey = 'tzme-home-global-cache'
function isMapPoints(points) {
  return Array.isArray(points) && points.length <= MAX_GLOBAL_POINTS
    && new Set(points.map((point) => point?.id)).size === points.length
    && points.every((point) => point && /^[a-zA-Z0-9_-]{1,80}$/.test(point.id)
      && Number.isFinite(point.x) && point.x >= 0 && point.x <= 100
      && Number.isFinite(point.y) && point.y >= 0 && point.y <= 100
      && typeof point.label?.en === 'string' && typeof point.label?.zh === 'string')
}
function isSettings(value) {
  return value && typeof value.enabled === 'boolean' && typeof value.showButton === 'boolean'
    && typeof value.image === 'string' && typeof value.buttonLink === 'string'
    && (value.mapMode == null || ['points', 'image'].includes(value.mapMode))
    && (value.mapPoints == null || isMapPoints(value.mapPoints))
    && ['kicker', 'titleLine1', 'titleLine2', 'description', 'imageAlt', 'buttonText']
      .every((key) => typeof value[key]?.en === 'string' && typeof value[key]?.zh === 'string')
    && Array.isArray(value.statistics) && value.statistics.length === 3
    && value.statistics.every((item) => item && typeof item.value === 'string' && typeof item.suffix === 'string'
      && typeof item.label?.en === 'string' && typeof item.label?.zh === 'string')
}
function cachedSettings() {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey))
    if (isSettings(cached)) return createGlobalReachSettings(cached)
  } catch { /* Use defaults when no valid cache is available. */ }
  return createGlobalReachSettings()
}
const settings = ref(cachedSettings())
function remember(value) {
  settings.value = createGlobalReachSettings(value)
  try { localStorage.setItem(cacheKey, JSON.stringify(value)) } catch { /* Server persistence still succeeded. */ }
}
export async function loadGlobalReach() {
  try {
    const response = await fetch('/api/home-global')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const value = await response.json()
    if (!isSettings(value)) throw new Error('Invalid global reach settings')
    remember(value)
    return { settings: settings.value, connected: true, supportsPointMap: typeof value.mapMode === 'string' && Array.isArray(value.mapPoints) }
  } catch {
    return { settings: settings.value, connected: false }
  }
}
export async function saveGlobalReach(value) {
  const response = await fetch('/api/home-global', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const saved = await response.json()
  if (!isSettings(saved) || typeof saved.mapMode !== 'string' || !Array.isArray(saved.mapPoints)) {
    throw new Error('Restart the updated Java service before saving map points')
  }
  remember(saved)
  return settings.value
}
export function useGlobalReach() {
  return { globalReach: settings, loadGlobalReach }
}
