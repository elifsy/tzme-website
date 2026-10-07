export const MAX_SOCIAL_LINKS = 8
export const socialPlatforms = ['linkedin', 'youtube', 'x', 'wechat', 'weibo', 'bilibili', 'facebook', 'instagram', 'link']

export function initialSocialLinks() {
  const presets = { en: ['linkedin', 'youtube', 'x'], zh: ['wechat', 'weibo', 'bilibili'] }
  return Object.fromEntries(Object.entries(presets).map(([code, platforms]) => [code, platforms.map(platform => ({
    id: `social-${code}-${platform}`, platform, label: '', icon: '', url: '', enabled: false,
  }))]))
}

export function validSocialUrl(value) {
  if (typeof value !== 'string' || value.length > 1000 || /[\s\\]/.test(value) || !/^https?:\/\//i.test(value)) return false
  try {
    const url = new URL(value)
    return Boolean(url.hostname) && !url.username && !url.password && url.href.length <= 1000
  } catch { return false }
}

export function validSocialIcon(value) {
  return typeof value === 'string' && (value === '' || /^\/api\/uploads\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|gif|webp)$/.test(value))
}

export function ensureSocialLinkLocales(config, localeCodes) {
  if (!config.contact.socialLinks || typeof config.contact.socialLinks !== 'object' || Array.isArray(config.contact.socialLinks)) config.contact.socialLinks = {}
  for (const code of localeCodes) if (!Array.isArray(config.contact.socialLinks[code])) config.contact.socialLinks[code] = []
  for (const [code, links] of Object.entries(config.contact.socialLinks)) {
    if (Array.isArray(links)) config.contact.socialLinks[code] = links.map(item => ({ ...item, icon: item.icon ?? '' }))
  }
  return config
}
