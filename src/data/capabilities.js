export const MAX_CAPABILITY_STEPS = 8
export const capabilityIconNames = ['requirements', 'materials', 'fabrication', 'assembly', 'inspection', 'delivery', 'general', 'idea', 'engineering', 'design']
export const capabilityTextFields = ['kicker', 'titleLine1', 'titleLine2', 'description', 'imageAlt']
export const capabilityText = (value, locale) => value?.[locale] || value?.en || ''
export const validCapabilityImage = value => typeof value === 'string' && (value === '' || /^\/api\/uploads\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|gif|webp)$/.test(value))
export const validCapabilityBackground = value => validCapabilityImage(value) || (typeof value === 'string' && /^\/assets\/[a-zA-Z0-9_-]+\.(jpg|png|gif|webp)$/.test(value))

export function isCapabilitiesSettings(value) {
  const translated = item => item && typeof item.zh === 'string' && (item.en === undefined || typeof item.en === 'string')
  return value && typeof value.enabled === 'boolean' && typeof value.image === 'string'
    && validCapabilityBackground(value.image)
    && capabilityTextFields.every(key => translated(value[key]))
    && Array.isArray(value.steps) && value.steps.length <= MAX_CAPABILITY_STEPS
    && new Set(value.steps.map(step => step?.id)).size === value.steps.length
    && value.steps.every(step => step && typeof step.id === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(step.id) && translated(step.label)
      && (step.description === undefined || (translated(step.description) && Object.values(step.description).every(text => typeof text === 'string' && text.length <= 600)))
      && typeof step.enabled === 'boolean' && ['preset', 'image'].includes(step.iconMode)
      && capabilityIconNames.includes(step.iconName) && validCapabilityImage(step.icon))
}

export function capabilitiesDraft(value, localeCodes) {
  const draft = JSON.parse(JSON.stringify(value))
  for (const step of draft.steps) step.description = { zh: '', ...step.description }
  for (const text of [...capabilityTextFields.map(key => draft[key]), ...draft.steps.flatMap(step => [step.label, step.description])]) {
    for (const code of localeCodes) text[code] ??= ''
  }
  return draft
}
