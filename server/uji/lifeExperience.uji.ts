import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseFrontierState } from '../../src/lib/frontierState'
import { validNews } from '../../src/lib/newsFeed'
import { KARYA } from '../../src/lib/ringkasanKarya'
import { OPEN_LEARNING_BOOKS, ORIGINAL_STORIES } from '../../src/lib/openLearningBooks'

test('corrupt stored frontier state cannot crash its seven tools', () => {
  for (const value of [null, false, 1, [], 'bad']) assert.deepEqual(parseFrontierState(value), {})
  const state = parseFrontierState({ autopilot: ['Health', 'Health', 'missing', null, 'Time', 'Money', 'Career'], social: { Support: 'bad', Reach: 500 }, weeklyHours: 2000, future: {}, horizon: -1 })
  assert.deepEqual(state.autopilot, ['Health', 'Time', 'Money'])
  assert.equal(state.social?.Support, 5)
  assert.equal(state.social?.Reach, 10)
  assert.equal(state.weeklyHours, 168)
  assert.equal(state.future, undefined)
  assert.equal(state.horizon, undefined)
})
test('news rejects unsafe links, missing sources, future dates and duplicates', () => {
  const item = { title: 'A headline', source: 'Publisher', link: 'https://example.org/news', pubDate: '2026-01-01', region: 'international' }
  const now = Date.parse('2026-02-01')
  assert.equal(validNews([item, item, { ...item, link: 'javascript:alert(1)' }, { ...item, source: '' }, { ...item, pubDate: '2027-01-01' }], now).length, 1)
  assert.deepEqual(validNews(null, now), [])
})
test('open reading sources and original stories remain unique and complete', () => {
  assert.equal(OPEN_LEARNING_BOOKS.length, 10)
  assert.equal(new Set(KARYA.map(item => item.id)).size, KARYA.length)
  for (const book of OPEN_LEARNING_BOOKS) assert.equal(new URL(book.url!).hostname, 'openstax.org')
  assert.equal(ORIGINAL_STORIES.length, 6)
  for (const story of ORIGINAL_STORIES) assert(story.body.length > 100 && story.prompt.length > 20)
})
