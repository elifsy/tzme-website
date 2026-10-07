export const MAX_CAPABILITY_STEPS = 8
export const capabilityIconNames = ['idea', 'engineering', 'design', 'fabrication', 'assembly', 'delivery', 'general']
export const capabilityTextFields = ['kicker', 'titleLine1', 'titleLine2', 'description', 'imageAlt']
export const capabilityText = (value, locale) => value?.[locale] || value?.en || ''
export const validCapabilityImage = value => typeof value === 'string' && (value === '' || /^\/api\/uploads\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|gif|webp)$/.test(value))
export const validCapabilityBackground = value => validCapabilityImage(value) || (typeof value === 'string' && /^\/assets\/[a-zA-Z0-9_-]+\.(jpg|png|gif|webp)$/.test(value))

export function isCapabilitiesSettings(value) {
  const translated = item => item && typeof item.en === 'string' && typeof item.zh === 'string'
  return value && typeof value.enabled === 'boolean' && typeof value.image === 'string'
    && validCapabilityBackground(value.image)
    && capabilityTextFields.every(key => translated(value[key]))
    && Array.isArray(value.steps) && value.steps.length <= MAX_CAPABILITY_STEPS
    && new Set(value.steps.map(step => step?.id)).size === value.steps.length
    && value.steps.every(step => step && typeof step.id === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(step.id) && translated(step.label)
      && typeof step.enabled === 'boolean' && ['preset', 'image'].includes(step.iconMode)
      && capabilityIconNames.includes(step.iconName) && validCapabilityImage(step.icon))
}

export function capabilitiesDraft(value, localeCodes) {
  const draft = JSON.parse(JSON.stringify(value))
  for (const text of [...capabilityTextFields.map(key => draft[key]), ...draft.steps.map(step => step.label)]) {
    for (const code of localeCodes) text[code] ??= ''
  }
  return draft
}
