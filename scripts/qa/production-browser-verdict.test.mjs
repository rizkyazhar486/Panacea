import test from 'node:test'
import assert from 'node:assert/strict'
import { assessPublicPage } from './production-browser-verdict.mjs'
test('E7: public home HTTP 200 with visible text and title passes structural check', () => {
  assert.deepEqual(assessPublicPage({ status: 200, title: 'PanaceaMed', bodyTextChars: 42 }), [])
})
test('E7: non-200 must fail even if the HTML body looks intact', () => {
  for (const status of [null, 0, 301, 302, 401, 403, 404, 429, 500, 503]) assert.match(assessPublicPage({ status, title: 'PanaceaMed', bodyTextChars: 100 }).join(' '), /HTTP/)
})
test('E7: blank/error landing fails even with HTTP 200', () => {
  for (const title of ['', ' ', null, undefined]) assert.match(assessPublicPage({ status: 200, title, bodyTextChars: 10 }).join(' '), /no document title/)
  for (const bodyTextChars of [0, -1, NaN, Infinity, undefined]) assert.match(assessPublicPage({ status: 200, title: 'PanaceaMed', bodyTextChars }).join(' '), /no visible text/)
})
