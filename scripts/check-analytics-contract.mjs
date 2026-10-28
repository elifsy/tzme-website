import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { clientAnalyticsEvents, analyticsEventNames } from '../src/data/analyticsEvents.js'
import { analyticsZh, analyticsEn } from '../src/i18n/analytics.js'

test('client and server accept the same anonymous interaction events', () => {
  const java = fs.readFileSync('server/src/main/java/com/tzme/cms/service/AnalyticsService.java', 'utf8')
  const names = [...java.match(/CLIENT_EVENTS = Set\.of\(([^]*?)\);/)[1].matchAll(/"([a-z_]+)"/g)].map(match => match[1])
  assert.deepEqual([...clientAnalyticsEvents].sort(), names.sort())
  assert.equal(new Set(clientAnalyticsEvents).size, clientAnalyticsEvents.length)
  assert.ok(!clientAnalyticsEvents.includes('inquiry_success'))
})
test('every report event has a readable label in both interface languages', () => {
  for (const name of analyticsEventNames) for (const labels of [analyticsZh, analyticsEn]) assert.ok(labels.analyticsAdmin.eventNames[name], name)
})
test('the source partner order contains exactly the 24 corresponding local logos', () => {
  const data = JSON.parse(fs.readFileSync('server/src/main/resources/partners-defaults.json', 'utf8'))
  assert.equal(data.items.length, 24)
  assert.equal(new Set(data.items.map(item => item.id)).size, 24)
  for (const [index, item] of data.items.entries()) {
    assert.equal(item.id, `partner-${index + 27}`)
    assert.ok(item.name.trim())
    assert.match(item.image, /^\/assets\/tzme-partners\/partner-\d+\.png$/)
    assert.ok(fs.statSync('public' + item.image).size > 0)
  }
})
