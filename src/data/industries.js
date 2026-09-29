import en from '../i18n/locales/en.js'
import zh from '../i18n/locales/zh.js'

const defaults = [
  ['mining', 'mining', 'miningAndBulkMaterials'],
  ['ports', 'ports', 'portsAndTerminals'],
  ['metallurgy', 'metallurgy', 'steelAndMetallurgy'],
  ['energy', 'energy', 'energyAndIndustrialInfrastructure'],
  ['construction', 'construction', 'constructionAndHeavyInfrastructure'],
]

export const industrySeed = defaults.map(([id, titleKey, subtitleKey], index) => ({
  id,
  titleEn: en.site[titleKey],
  titleZh: zh.site[titleKey],
  subtitleEn: en.site[subtitleKey],
  subtitleZh: zh.site[subtitleKey],
  sortOrder: (index + 1) * 10,
  status: 'published',
}))
