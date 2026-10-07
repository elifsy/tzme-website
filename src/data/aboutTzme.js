export const ABOUT_ENTRY_COUNT = 4
export const aboutTextFields = ['kicker', 'titleLine1', 'titleLine2', 'description', 'description2', 'imageAlt']
export const aboutText = (value, locale) => value?.[locale] || value?.en || ''
export const validAboutImage = value => typeof value === 'string' && (value === ''
  || /^\/api\/uploads\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|gif|webp)$/.test(value)
  || /^\/assets\/[a-zA-Z0-9_-]+\.(jpg|png|gif|webp)$/.test(value))

export function isAboutSettings(value) {
  const translated = item => item && typeof item.en === 'string' && typeof item.zh === 'string'
  return value && ['home', 'about'].every(key => {
    const section = value[key]
    return section && aboutTextFields.every(field => translated(section[field])) && validAboutImage(section.image)
      && Array.isArray(section.entries) && section.entries.length === ABOUT_ENTRY_COUNT
      && section.entries.every(entry => entry && ['value', 'suffix', 'label'].every(field => translated(entry[field])))
  })
}

export function aboutSettingsDraft(value, localeCodes) {
  const draft = JSON.parse(JSON.stringify(value))
  for (const section of Object.values(draft)) {
    for (const text of [...aboutTextFields.map(key => section[key]), ...section.entries.flatMap(entry => [entry.value, entry.suffix, entry.label])]) {
      for (const code of localeCodes) text[code] ??= ''
    }
  }
  return draft
}
