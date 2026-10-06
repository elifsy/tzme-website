// One-time source migration. Existing keys in the baseline are retained on reruns.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { parse as parseTemplate } from '@vue/compiler-dom'

const baselinePath = 'database/baseline/site-settings.json'
const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : { assets: {}, values: {} }
for (const name of readdirSync('public/assets')) baseline.assets[`/assets/${name}`] ??= `/assets/${name}`
function valueKey(value) {
  const key = `text_${createHash('sha1').update(value).digest('hex').slice(0, 12)}`
  baseline.values[key] = value
  return key
}
const files = readdirSync('src/views').filter((name) => name.endsWith('.vue') && name !== 'AdminView.vue').map((name) => `src/views/${name}`)
files.push('src/components/SiteNav.vue', 'src/components/ProjectCard.vue')
for (const file of files) {
  let source = readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const { descriptor } = parseSfc(source)
  const template = descriptor.template
  const edits = []
  function walk(node) {
    if (node.type === 2) {
      const value = node.content.trim()
      if (value && !/^[\s→←▶✕☰×·•|+—…]+$/.test(value) && value !== 'in') {
        edits.push({ start: node.loc.start.offset, end: node.loc.end.offset, text: `{{ siteValue('${valueKey(value)}') }}` })
      }
    }
    if (node.type === 1) {
      for (const prop of node.props) {
        if (prop.type !== 6 || !prop.value) continue
        if (prop.name === 'src' && prop.value.content.startsWith('/assets/')) {
          edits.push({ start: prop.loc.start.offset, end: prop.loc.end.offset, text: `:src="siteAsset('${prop.value.content}')"` })
        } else if (['alt', 'title'].includes(prop.name) && prop.value.content) {
          edits.push({ start: prop.loc.start.offset, end: prop.loc.end.offset, text: `:${prop.name}="siteValue('${valueKey(prop.value.content)}')"` })
        }
      }
    }
    for (const child of node.children || []) walk(child)
  }
  walk(parseTemplate(template.content))
  let content = template.content
  for (const edit of edits.sort((a, b) => b.start - a.start)) content = content.slice(0, edit.start) + edit.text + content.slice(edit.end)
  content = content.replace(/\|\| '(\/assets\/[^']+)'/g, (_, path) => `|| siteAsset('${path}')`)
  const start = template.loc.start.offset
  source = source.slice(0, start) + content + source.slice(template.loc.end.offset)
  if (/siteAsset\(|siteValue\(/.test(content) && !source.includes('useSiteContent')) {
    source = source.replace('<script setup>', "<script setup>\nimport { useSiteContent } from '../services/website.js'\nconst { siteAsset, siteValue } = useSiteContent()")
  }
  writeFileSync(file, source)
}
mkdirSync('database/baseline', { recursive: true })
writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n')
console.log(`Database metadata: ${Object.keys(baseline.assets).length} assets, ${Object.keys(baseline.values).length} text values.`)
