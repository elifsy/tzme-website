import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { localeMessages } from '../src/i18n/locales/index.js'

const path = 'database/baseline/about-tzme.json'
if (!existsSync(path)) {
  const website = JSON.parse(readFileSync('database/baseline/site-settings.json', 'utf8'))
  const text = key => Object.fromEntries(Object.entries(localeMessages).map(([code, messages]) => [code, messages.site[key] || localeMessages.en.site[key] || '']))
  const constant = value => Object.fromEntries(Object.keys(localeMessages).map(code => [code, String(value ?? '')]))
  const numeric = key => constant(website.values[key])
  const entry = (value, suffix, label) => ({ value, suffix, label: text(label) })
  const base = () => ({
    kicker: text('aboutTzme'), titleLine1: text('engineering'), titleLine2: text('withoutLimits'),
    description: constant(''), description2: constant(''), image: '', imageAlt: constant(''), entries: [],
  })
  const home = {
    ...base(), description: text('tzmeDeliversEngineeredEquipmentAndCustomisedIndustrialSolutionsForSomeOfThe'),
    image: website.assets['/assets/rnd-2.jpg'] || '',
    entries: [
      entry(numeric('text_91032ad7bbcb'), constant('+'), 'yearsOfExperience'),
      entry(text('global'), constant(''), 'projectCapability'),
      entry(text('endToEnd'), constant(''), 'engineeringAndManufacturing'),
      // The fourth homepage entry reuses the founding year already displayed on the About page.
      entry(numeric('text_2e8c0277e396'), constant(''), 'foundedInTianjin'),
    ],
  }
  const about = {
    ...base(), description: text('tianjinHeavySteelMachineryEquipmentCoLtdDesignsFabricatesAndDeliversEngineered'),
    description2: text('roughly90OfOurOutputIsExportedMainlyToMiningHousesPort'),
    image: website.assets['/assets/hero-03.jpg'] || '',
    entries: [
      entry(numeric('text_6f7af8cfeebd'), numeric('text_8efd86fb78a5'), 'annualOutput'),
      entry(numeric('text_3957f15e6313'), numeric('text_6f6f0f6a0fb3'), 'siteArea5Bases'),
      entry(numeric('text_af3e133428b9'), constant('+'), 'exportCountries'),
      entry(numeric('text_2e8c0277e396'), constant(''), 'foundedInTianjin'),
    ],
  }
  writeFileSync(path, JSON.stringify({ home, about }, null, 2) + '\n')
}
