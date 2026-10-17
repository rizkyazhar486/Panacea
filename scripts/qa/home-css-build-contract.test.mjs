import test from 'node:test'
import assert from 'node:assert/strict'
import { verifyHomeOutput } from './home-css-build-contract.mjs'

test('P0: stable Home CSS with no per-deploy Home chunk passes', () => {
  assert.deepEqual(verifyHomeOutput({ assets: ['index-a.js', 'Other-Z.css'], hasStableCss: true, stableCssText: 'x'.repeat(2000) }), [])
})
test('P0: rejects old Home-D8IB3ISB.css dependency', () => {
  const failures = verifyHomeOutput({ assets: ['Home-D8IB3ISB.css'], hasStableCss: true, stableCssText: 'x'.repeat(2000) })
  assert.match(failures.join(' '), /hashed Home CSS/)
})
test('P0: rejects missing or empty stable Home stylesheet', () => {
  for (const stableCssText of ['', 'x']) assert.match(verifyHomeOutput({ assets: [], hasStableCss: true, stableCssText }).join(' '), /missing or empty/)
  assert.match(verifyHomeOutput({ assets: [], hasStableCss: false, stableCssText: 'x'.repeat(2000) }).join(' '), /missing or empty/)
})
