// The server embeds only the same published data exposed by public GET APIs.
let values
function snapshot() {
  if (values !== undefined) return values
  try { values = JSON.parse(document.getElementById('site-bootstrap')?.textContent || '{}') }
  catch { values = {} }
  return values
}
export function peekPublicBootstrap(path) {
  if (typeof location === 'undefined' || /^\/admin(?:\/|$)/.test(location.pathname)) return undefined
  return snapshot()[path]
}
export function takePublicBootstrap(path) {
  const value = peekPublicBootstrap(path)
  if (value !== undefined) delete snapshot()[path]
  return value
}
