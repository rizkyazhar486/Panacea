import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const bridge = readFileSync(
  new URL('../../src/lib/neuralIntentLongitudinalBridge.ts', import.meta.url),
  'utf8',
)
const kernel = readFileSync(
  new URL('../../src/lib/panaceaLongitudinalState.ts', import.meta.url),
  'utf8',
)

assert.match(bridge, /panaceaLongitudinalState/, 'intent bridge must use the canonical longitudinal kernel')
assert.doesNotMatch(bridge, /longitudinalPatientState/, 'intent bridge must not revive the duplicate patient-state store')
assert.doesNotMatch(bridge, /localStorage|sessionStorage/, 'intent bridge must not create browser persistence')
assert.doesNotMatch(bridge, /\bfetch\s*\(/, 'intent bridge must not retrieve or submit data over the network')
assert.doesNotMatch(bridge, /\bwindow\b/, 'intent bridge must remain runtime-agnostic')
assert.match(bridge, /purpose !== 'clinical-support' && purpose !== 'ai-context'/, 'simulated intent clinical/AI stripping disappeared')
assert.match(bridge, /intent\.status === 'rejected'/, 'rejected intent skip boundary disappeared')
assert.match(kernel, /'intent'/, 'canonical longitudinal intent domain disappeared')
assert.match(kernel, /'rehab-tracking'/, 'canonical rehab-tracking consent purpose disappeared')
assert.match(
  kernel,
  /CLINICIAN_REVIEW_DOMAINS[^\n]*'intent'/,
  'intent domain is no longer clinician-review gated for clinical surfaces',
)

console.log('neural intent canonical bridge boundary: ok')
