import test from 'node:test'
import assert from 'node:assert/strict'
import { assessPublicPage, isProductionAsset, productionAssetFailure, testedShas } from './production-browser-verdict.mjs'

test('E7: CSS MIME requires an exact media type, never a substring or parameter match', () => {
  const base = 'https://panaceamed.id'
  const url = base + '/assets/Home.css?token=synthetic-secret'
  for (const contentType of ['text/css', 'TEXT/CSS', ' text/css ; charset=utf-8']) {
    assert.equal(productionAssetFailure({ url, status: 200, contentType }, base), null, contentType)
  }
  for (const contentType of ['', 'text/css-invalid', 'application/text/css', 'text/html; note=text/css', 'text/css, text/html']) {
    const failure = productionAssetFailure({ url, status: 200, contentType }, base)
    assert.match(failure ?? '', /required asset ref=[0-9a-f]{16}: HTTP 200 content-type (?:text\/html|other)$/, contentType)
    assert.equal(failure.includes('synthetic-secret'), false)
    assert.equal(assessPublicPage({ status: 200, title: 'Panacea', bodyTextChars: 42, assetFailures: [failure] }).length, 1)
  }
})
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
  for (const path of ['/assets/Home-D8IB3ISB.css', '/assets/index-X.js', '/home-styles.css', '/panacea-green-material-v48.css?v=20260916-1', '/ui-iterations/panacea-green-material-v48.css?v=20260916-1']) {
    assert.equal(isProductionAsset('https://www.panaceamed.id' + path, base), true, path)
    assert.equal(isProductionAsset('https://panaceamed.id' + path, base), true, path)
  }
  for (const url of ['https://fonts.googleapis.com/assets/font.css', 'https://evil.test/home-styles.css', 'https://www.panaceamed.id.evil.test/assets/x.css', 'https://panaceamed.id/other.css', 'https://panaceamed.id/assets/image.png', 'not a URL']) assert.equal(isProductionAsset(url, base), false, url)
  assert.equal(isProductionAsset('http://localhost:4173/assets/home.css', 'http://localhost:4173'), true)
  assert.equal(isProductionAsset('http://localhost:4174/assets/home.css', 'http://localhost:4173'), false)
})
test('P0: actual asset classifier drives failed-request, HTTP and CSS MIME failures', () => {
  const base = 'https://www.panaceamed.id'
  for (const path of ['/assets/Home-X.css', '/home-styles.css', '/panacea-green-material-v48.css', '/ui-iterations/panacea-green-material-v48.css']) {
    const url = base + path
    assert.equal(productionAssetFailure({ url, status: 200, contentType: 'text/css; charset=utf-8' }, base), null)
    assert.match(productionAssetFailure({ url, requestFailure: 'net::ERR_FAILED' }, base), /request failed/)
    for (const status of [404, 500]) assert.match(productionAssetFailure({ url, status, contentType: 'text/css' }, base), /HTTP/)
    assert.match(productionAssetFailure({ url, status: 200, contentType: 'text/html' }, base), /content-type text\/html/)
  }
  assert.match(productionAssetFailure({ url: base + '/assets/index-X.js', status: 404, contentType: 'text/html' }, base), /HTTP 404/)
  assert.equal(productionAssetFailure({ url: 'https://fonts.googleapis.com/font.css', requestFailure: 'timeout' }, base), null)
})

test('E7: asset diagnostics redact URL path, query, raw errors, and MIME metadata', () => {
  const base = 'https://www.panaceamed.id'
  const secret = 'PRIVATE_TOKEN_X'
  const asset = base + '/assets/private-marker.css?token=' + secret
  const requestFailure = productionAssetFailure({ url: asset, requestFailure: 'network ' + secret }, base)
  const httpFailure = productionAssetFailure({ url: asset, status: 404, contentType: 'text/html; private=' + secret }, base)
  assert.match(requestFailure, /required asset ref=[0-9a-f]{16}: request failed/)
  assert.ok(httpFailure.includes('HTTP 404 content-type text/html'))
  assert.equal(requestFailure.includes('private-marker'), false)
  assert.equal(httpFailure.includes('private-marker'), false)
  for (const result of [requestFailure, httpFailure]) assert.equal(result.includes(secret), false)
  assert.equal(productionAssetFailure({ url: base + '/assets/healthy.css?token=' + secret, status: 200, contentType: 'text/css' }, base), null)
  assert.equal(productionAssetFailure({ url: 'https://fonts.googleapis.com/assets/remote.css', requestFailure: 'network ' + secret }, base), null)
})

const A = 'a'.repeat(40)
const B = 'b'.repeat(40)
test('ENG-E7-02: logs frontend and backend SHA when both are observed', () => {
  const r = testedShas({ frontendBuild: { commit: A }, health: { build: { commit: B } } })
  assert.equal(r.frontend, A); assert.equal(r.backend, B); assert.deepEqual(r.notes, [])
})
test('ENG-E7-02: missing build.json or health is unknown (null), never equal or invented', () => {
  const r = testedShas({ frontendBuild: null, health: null, expectSha: A })
  assert.equal(r.frontend, null); assert.equal(r.backend, null)
  assert.equal(r.frontendMatchesExpected, null); assert.equal(r.backendMatchesExpected, null)
  assert.match(r.notes.join(' '), /frontend TIDAK diketahui/); assert.match(r.notes.join(' '), /backend TIDAK diketahui/)
})
test('ENG-E7-02: malformed SHAs (short, uppercase, non-string, "unknown") are rejected as unknown', () => {
  for (const bad of ['abc123', 'A'.repeat(40), 'g'.repeat(40), 123, null, undefined, 'unknown', A + '0']) {
    const r = testedShas({ frontendBuild: { commit: bad }, health: { build: { commit: bad } } })
    assert.equal(r.frontend, null, String(bad)); assert.equal(r.backend, null, String(bad))
  }
})
test('ENG-E7-02: SHA different from EXPECT_SHA is flagged; equal is confirmed; paired controls differ only in the SHA', () => {
  const same = testedShas({ frontendBuild: { commit: A }, health: { build: { commit: A } }, expectSha: A })
  assert.equal(same.frontendMatchesExpected, true); assert.equal(same.backendMatchesExpected, true); assert.deepEqual(same.notes, [])
  const diff = testedShas({ frontendBuild: { commit: A }, health: { build: { commit: B } }, expectSha: A })
  assert.equal(diff.frontendMatchesExpected, true); assert.equal(diff.backendMatchesExpected, false)
  assert.match(diff.notes.join(' '), /backend bbbbbbbbb berbeda/)
})
test('ENG-E7-02: invalid EXPECT_SHA is ignored with a note, not treated as a match', () => {
  const r = testedShas({ frontendBuild: { commit: A }, health: { build: { commit: A } }, expectSha: 'main' })
  assert.equal(r.frontendMatchesExpected, null); assert.match(r.notes.join(' '), /EXPECT_SHA bukan 40-heksadesimal/)
})
test('ENG-E7-02: no arguments does not throw and reports both unknown', () => {
  const r = testedShas(); assert.equal(r.frontend, null); assert.equal(r.backend, null)
})
