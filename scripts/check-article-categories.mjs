import test from 'node:test'
import assert from 'node:assert/strict'
import { articleCategoryKey, groupArticleCategories, resolveArticleCategory, fixedArticleCategories, isDownloadArticle } from '../src/utils/articleCategories.js'
const fixed = ['公司新闻', '展会活动', '下载中心']

const source = [
  { id:'renamed', categoryEn:'News', category:'News', categoryZh:'公司新闻1' },
  { id:'unchanged-a', categoryEn:'News', category:'News', categoryZh:'公司新闻' },
  { id:'unchanged-b', categoryEn:'News', category:'News', categoryZh:'公司新闻' },
  { id:'unchanged-c', categoryEn:'News', category:'News', categoryZh:'公司新闻' },
]
test('renaming one imported article changes only its group, regardless of article order', () => {
  for (const articles of [source, [...source].reverse()]) {
    const groups=groupArticleCategories(articles)
    assert.deepEqual(new Set(groups.map(group=>group.id)),new Set([...fixed,'公司新闻1']))
    assert.equal(articles.filter(article=>articleCategoryKey(article)==='公司新闻1').length,1)
    assert.equal(articles.filter(article=>articleCategoryKey(article)==='公司新闻').length,3)
    assert.ok(groups.every(group=>group.id===group.titleZh))
  }
})
test('new Chinese-only articles join imported articles with the same Chinese category', () => {
  const articles=[source[1], {categoryEn:'',category:'公司新闻',categoryZh:'公司新闻'}, {categoryZh:'  公司新闻  '}]
  assert.deepEqual(groupArticleCategories(articles).map(group=>group.id),fixed)
})
test('old English filter links resolve to the corresponding current Chinese group', () => {
  assert.equal(resolveArticleCategory('News',source),'公司新闻')
  assert.equal(resolveArticleCategory('公司新闻1',source),'公司新闻1')
  assert.equal(resolveArticleCategory('Events',[{categoryEn:'Events',categoryZh:'展会活动'}]),'展会活动')
  assert.equal(resolveArticleCategory('Download Center',[{categoryEn:'Download Center',categoryZh:'下载中心'}]),'下载中心')
})
test('custom legacy links resolve only when the current group is unambiguous', () => {
  const articles=[{categoryEn:'Updates',categoryZh:'制造动态'}]
  assert.equal(resolveArticleCategory('Updates',articles),'制造动态')
  assert.equal(resolveArticleCategory('Updates',[...articles,{categoryEn:'Updates',categoryZh:'其他动态'}]),'Updates')
})
test('empty categories and invalid query values do not create empty filter buttons', () => {
  assert.deepEqual(groupArticleCategories([{},null,{categoryZh:'  '}]).map(group=>group.id),fixed)
  assert.equal(resolveArticleCategory(['News'],source),'')
  assert.equal(resolveArticleCategory(undefined,source),'')
  assert.equal(articleCategoryKey({categoryEn:'Legacy news'}),'Legacy news')
})
test('fixed categories survive removing or renaming every article and remain in a stable order', () => {
  assert.deepEqual(groupArticleCategories([]).map(group=>group.id), fixed)
  assert.deepEqual(groupArticleCategories([{categoryZh:'公司新闻1'}]).slice(0,3), fixedArticleCategories)
  assert.ok(groupArticleCategories([]).every(group=>group.fixed))
  assert.equal(groupArticleCategories([{categoryZh:'其他'}]).at(-1).fixed, false)
  assert.equal(resolveArticleCategory('Download Center',[]),'下载中心')
  assert.equal(isDownloadArticle({categoryZh:'下载中心'}),true)
  assert.equal(isDownloadArticle({categoryZh:'公司新闻'}),false)
})
