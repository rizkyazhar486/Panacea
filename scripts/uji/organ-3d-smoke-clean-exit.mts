import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  new URL('../../scripts/qa/organ-model-3d-smoke.mjs', import.meta.url),
  'utf8',
)

assert.doesNotMatch(
  source,
  /Promise\.race\s*\(/,
  'organ 3D smoke must not leave losing timeout promises alive after a successful mesh proof',
)
assert.match(
  source,
  /const batasWaktu = Date\.now\(\) \+ 45_000/,
  'organ 3D smoke must retain a finite 45s per-organ terminal deadline',
)
assert.match(
  source,
  /if \(Date\.now\(\) >= batasWaktu\) return res\(\{ habisWaktu: true \}\)/,
  'organ 3D smoke must resolve its own timeout instead of racing a dangling Node timer',
)
assert.match(
  source,
  /await page\.close\(\)\.catch\(\(\) => \{\}\)[\s\S]*?await context\.close\(\)\.catch\(\(\) => \{\}\)[\s\S]*?await browser\.close\(\)/,
  'organ 3D smoke must explicitly close page, context, then browser',
)

console.log('organ 3D smoke cleanup: no dangling race timer and explicit Playwright teardown')
