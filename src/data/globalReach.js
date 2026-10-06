// Both Vite and Java use this file for the initial, bilingual configuration.
import defaults from '../../server/src/main/resources/home-global-defaults.json'

export function createGlobalReachSettings(value = defaults) {
  const result = JSON.parse(JSON.stringify(value))
  result.mapMode ??= result.image === defaults.image ? 'points' : 'image'
  result.mapPoints ??= []
  return result
}

export const MAX_GLOBAL_POINTS = 100

export function globalReachText(text, locale) {
  return text?.[locale] ?? text?.en ?? ''
}

export function isGlobalReachUrl(value) {
  if (typeof value !== 'string' || !value || /[\s\\\u0000-\u001f\u007f]/.test(value)) return false
  try {
    const url = new URL(value, 'https://tzme.local')
    if (value.startsWith('/') && !value.startsWith('//')) return url.origin === 'https://tzme.local'
    return /^https?:\/\//i.test(value) && ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
  } catch { return false }
}
