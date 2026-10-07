import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { localeMessages } from '../src/i18n/locales/index.js'

const path = 'database/baseline/home-capabilities.json'
if (!existsSync(path)) {
  const website = JSON.parse(readFileSync('database/baseline/site-settings.json', 'utf8'))
  const text = key => Object.fromEntries(Object.entries(localeMessages).map(([code, messages]) => [code, messages.site[key]]))
  const labels = ['concept', 'engineering', 'design', 'fabrication', 'assembly', 'delivery']
  const icons = ['idea', 'engineering', 'design', 'fabrication', 'assembly', 'delivery']
  const config = {
    enabled: true,
    kicker: text('ourCapabilities'), titleLine1: text('fromConcept'), titleLine2: text('toReality'),
    description: text('fromInitialConceptToFinalCommissioningOurEngineeringAndManufacturingCapabilitiesAre'),
    image: website.assets['/assets/hero-03.jpg'] || '',
    imageAlt: Object.fromEntries(Object.keys(localeMessages).map(code => [code, ''])),
    steps: labels.map((label, index) => ({ id: `capability-${label}`, label: text(label), enabled: true, iconMode: 'preset', iconName: icons[index], icon: '' })),
  }
  writeFileSync(path, JSON.stringify(config, null, 2) + '\n')
}
