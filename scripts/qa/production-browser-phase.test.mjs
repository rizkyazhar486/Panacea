import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as verdict from './production-browser-verdict.mjs'

// Regression: live runner visits Home then a distinct Body route on one page.
// A stylesheet cancelled by the second navigation cannot retroactively fail Home.
test('E7: freeze public Home asset evidence before navigating to Body', () => {
  assert.equal(typeof verdict.captureHomeAssetFailures, 'function')
  const failed = ['https://www.panaceamed.id/assets/Home-missing.css: HTTP 404']
  const home = verdict.captureHomeAssetFailures(failed)
  failed.push('https://www.panaceamed.id/panacea-green-material-v48.css: net::ERR_ABORTED')
  assert.deepEqual(home, ['https://www.panaceamed.id/assets/Home-missing.css: HTTP 404'])
  assert.match(verdict.assessPublicPage({ status: 200, title: 'Panacea', bodyTextChars: 200, assetFailures: home }).join(' '), /Home-missing.css/)
})

test('E7: clean Home does not inherit a later cancelled Body navigation', () => {
  assert.equal(typeof verdict.captureHomeAssetFailures, 'function')
  const failed = []
  const home = verdict.captureHomeAssetFailures(failed)
  failed.push('https://www.panaceamed.id/panacea-green-material-v48.css: net::ERR_ABORTED')
  assert.deepEqual(verdict.assessPublicPage({ status: 200, title: 'Panacea', bodyTextChars: 200, assetFailures: home }), [])
})

test('E7: runner captures Home phase evidence before starting Body navigation', () => {
  const source = readFileSync(new URL('./production-browser-check.mjs', import.meta.url), 'utf8')
  const captured = source.indexOf('const homeAssetFailures = captureHomeAssetFailures(v.assetFailures)')
  const navigation = source.indexOf('await page.goto(BASE + b.path')
  assert.ok(captured > 0 && navigation > captured, 'freeze Home evidence before the second route')
  assert.match(source, /assetFailures: homeAssetFailures/)
})
