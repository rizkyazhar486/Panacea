import test from 'node:test'
import assert from 'node:assert/strict'
import { assessPublicPage, isProductionAsset, productionAssetFailure } from './production-browser-verdict.mjs'
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

test('P0: error boundary is not a valid public home even with HTTP 200 and visible text', () => {
  const failures = assessPublicPage({ status: 200, title: 'Panaceamed.id', bodyTextChars: 180, rootErrorText: 'Something went wrong — Unable to preload CSS for Home-D8IB3ISB.css' })
  assert.match(failures.join(' '), /root ErrorBoundary/)
})

test('P0: missing or wrong-MIME home CSS prevents green production smoke', () => {
  const failures = assessPublicPage({ status: 200, title: 'Panacea', bodyTextChars: 400, assetFailures: ['/assets/Home-D8IB3ISB.css: HTTP 404', '/assets/Home-other.css: HTML instead of CSS'] })
  assert.equal(failures.length, 2)
  assert.match(failures[0], /Home-D8IB3ISB/)
})

test('P0: a healthy home with no root error or broken assets still passes', () => {
  assert.deepEqual(assessPublicPage({ status: 200, title: 'Panacea', bodyTextChars: 400, rootErrorText: '', assetFailures: [] }), [])
})

test('P0: classifies hashed and stable required CSS/JS using actual URLs', () => {
  const base = 'https://panaceamed.id'
  for (const path of ['/assets/Home-D8IB3ISB.css', '/assets/index-X.js', '/home-styles.css', '/panacea-green-material-v48.css?v=20260916-1']) {
    assert.equal(isProductionAsset('https://www.panaceamed.id' + path, base), true, path)
    assert.equal(isProductionAsset('https://panaceamed.id' + path, base), true, path)
  }
  for (const url of ['https://fonts.googleapis.com/assets/font.css', 'https://evil.test/home-styles.css', 'https://www.panaceamed.id.evil.test/assets/x.css', 'https://panaceamed.id/other.css', 'https://panaceamed.id/assets/image.png', 'not a URL']) assert.equal(isProductionAsset(url, base), false, url)
  assert.equal(isProductionAsset('http://localhost:4173/assets/home.css', 'http://localhost:4173'), true)
  assert.equal(isProductionAsset('http://localhost:4174/assets/home.css', 'http://localhost:4173'), false)
})
test('P0: actual asset classifier drives failed-request, HTTP and CSS MIME failures', () => {
  const base = 'https://www.panaceamed.id'
  for (const path of ['/assets/Home-X.css', '/home-styles.css', '/panacea-green-material-v48.css']) {
    const url = base + path
    assert.equal(productionAssetFailure({ url, status: 200, contentType: 'text/css; charset=utf-8' }, base), null)
    assert.match(productionAssetFailure({ url, requestFailure: 'net::ERR_FAILED' }, base), /ERR_FAILED/)
    for (const status of [404, 500]) assert.match(productionAssetFailure({ url, status, contentType: 'text/css' }, base), /HTTP/)
    assert.match(productionAssetFailure({ url, status: 200, contentType: 'text/html' }, base), /content-type text\/html/)
  }
  assert.match(productionAssetFailure({ url: base + '/assets/index-X.js', status: 404, contentType: 'text/html' }, base), /HTTP 404/)
  assert.equal(productionAssetFailure({ url: 'https://fonts.googleapis.com/font.css', requestFailure: 'timeout' }, base), null)
})
