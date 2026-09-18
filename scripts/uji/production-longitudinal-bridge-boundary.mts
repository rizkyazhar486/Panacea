import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const files = [
  '../src/lib/healthStoreLongitudinalBridge.ts',
  '../src/lib/productionHealthStoreSelector.ts',
  '../src/lib/productionHealthLongitudinalSync.ts',
  '../src/lib/productionAppStateLongitudinalSync.ts',
  '../src/lib/productionPersonalLongitudinalSync.ts',
]

const source = files.map((relative) =>
  readFileSync(new URL(relative, import.meta.url), 'utf8'),
).join('\n')

assert.match(
  source,
  /panaceaLongitudinalState/,
  'production bridge no longer targets the canonical longitudinal kernel',
)
assert.doesNotMatch(source, /localStorage/, 'production bridge must not create browser persistence side effects')
assert.doesNotMatch(source, /\bfetch\s*\(/, 'production bridge must not perform network retrieval')
assert.doesNotMatch(source, /\bwindow\b/, 'production bridge must remain runtime-agnostic and pure')
assert.doesNotMatch(
  source,
  /longitudinalPatientState/,
  'production bridge must not revive the duplicate longitudinalPatientState store',
)

console.log('production longitudinal bridge purity boundary: ok')
