// An empty editor form; published settings always come from the Java API.
export function createGlobalReachSettings(value) {
  const emptyText = () => ({ en: '', zh: '' })
  const result = JSON.parse(JSON.stringify(value || {
    enabled: false, showButton: false, image: '', buttonLink: '', mapMode: 'points', mapPoints: [],
    kicker: emptyText(), titleLine1: emptyText(), titleLine2: emptyText(), description: emptyText(),
    imageAlt: emptyText(), buttonText: emptyText(),
    statistics: Array.from({ length: 3 }, () => ({ value: '', suffix: '', label: emptyText() })),
  }))
  result.mapMode ??= 'image'
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
