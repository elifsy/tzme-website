import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, rankCsvHeaders, rankCsvTemplate, parseRankCsv, rankLabel } from '../src/utils/keywordRankings.js';

const monitors = [{ id: 'pc', keyword: '设备,"制造"', device: 'desktop', searchDepth: 100 }, { id: 'mobile', keyword: '港口机械', device: 'mobile', searchDepth: 20 }];
const row = (overrides = {}) => ['pc', monitors[0].keyword, '电脑端', '2026-10-29T09:00:00+08:00', '已检出', '12', 'https://www.tzme.net/products', '第一行\n第二行'].map((value, index) => overrides[index] ?? value);
const csv = rows => '\uFEFF' + [rankCsvHeaders, ...rows].map(cells => cells.map(csvCell).join(',')).join('\r\n');
test('CSV round trips UTF-8 quoted commas and multiline notes with explicit timezone', () => {
  const [result] = parseRankCsv(csv([row()]), monitors);
  assert.equal(result.position, 12); assert.equal(result.observedAt, '2026-10-29T01:00:00.000Z'); assert.equal(result.notes, '第一行\n第二行');
});
test('template never invents observations, and spreadsheet formulas are escaped', () => {
  assert.ok(rankCsvTemplate(monitors).startsWith('\uFEFF')); assert.throws(() => parseRankCsv(rankCsvTemplate(monitors), monitors));
  assert.equal(csvCell('=1+1'), '"\t=1+1"'); assert.equal(csvCell('@formula'), '"\t@formula"');
});
test('missing status never becomes not found and outside range has no rank', () => {
  assert.throws(() => parseRankCsv(csv([row({ 4: '' })]), monitors), /空白/);
  const [result] = parseRankCsv(csv([row({ 4: '未检出', 5: '', 6: '' })]), monitors); assert.equal(result.status, 'not_found'); assert.equal(result.position, null);
  assert.throws(() => parseRankCsv(csv([row({ 4: '未检出' })]), monitors));
});
test('rank and dimensions must match actual monitor scope', () => {
  for (const value of ['0', '101', '3.7', '', 'word']) assert.throws(() => parseRankCsv(csv([row({ 5: value })]), monitors));
  assert.throws(() => parseRankCsv(csv([row({ 2: '手机端' })]), monitors)); assert.throws(() => parseRankCsv(csv([row({ 0: 'missing' })]), monitors));
  assert.throws(() => parseRankCsv(csv([row({ 3: '2026-10-29 09:00' })]), monitors));
});
test('malformed CSV and oversized imports give actionable errors', () => {
  assert.throws(() => parseRankCsv('"unterminated', monitors), /未闭合/);
  assert.throws(() => parseRankCsv(csv(Array.from({ length: 501 }, () => row())), monitors), /500/);
  assert.throws(() => parseRankCsv(csv([row().slice(0, 7)]), monitors), /列数/);
});
test('unranked and failed labels do not invent numeric positions', () => {
  assert.equal(rankLabel('ranked', 8, 100), '第 8 名'); assert.equal(rankLabel('not_found', null, 100), '前 100 未检出'); assert.equal(rankLabel('error', null, 100), '采集失败'); assert.equal(rankLabel('', null, 100), '待采集');
});
