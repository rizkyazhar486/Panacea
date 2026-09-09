import assert from 'node:assert/strict'
import {
  FISIOLOGI_LATIHAN,
  PHYSIOLOGY_EVIDENCE_BOUNDARY,
  PHYSIOLOGY_REFERENCE_SOURCES,
  SISTEM_FISIOLOGI,
} from '../../src/lib/physiology.ts'

// Keep this boundary on the latest PR merge-ref so browser/WebGL acceptance
// exercises the current stabilization workflow as well as physiology content.
assert.ok(SISTEM_FISIOLOGI.length >= 11, 'Physiology coverage must retain all major system cards.')
assert.ok(PHYSIOLOGY_REFERENCE_SOURCES.length >= 3, 'Physiology must expose a reference basis.')
assert.match(PHYSIOLOGY_EVIDENCE_BOUNDARY, /population-level/i)
assert.match(PHYSIOLOGY_EVIDENCE_BOUNDARY, /measured inputs/i)

const corpus = JSON.stringify(SISTEM_FISIOLOGI).toLowerCase()
for (const overclaim of [
  '220 − age at maximum',
  'dark urine after training is a dehydration signal',
  'direct cause of exercise-related nausea',
  'the fix is eating enough',
  'cerebral flow is defended almost unchanged',
  'only take over when pao₂ falls',
  'golgi tendon organs sense tension and inhibit it, protecting against overload',
  'dominant from ~10 seconds to ~2 minutes',
]) {
  assert.equal(corpus.includes(overclaim.toLowerCase()), false, `Physiology must not regress to the overclaim: ${overclaim}`)
}

for (const system of SISTEM_FISIOLOGI) {
  assert.ok(system.proses.length >= 3, `${system.key} must retain a mechanism sequence.`)
  assert.ok(system.angka.length >= 2, `${system.key} must retain reference variables.`)
  assert.ok(system.saatOlahraga.length > 60, `${system.key} must explain exercise response with context.`)
}

const keys = new Set(SISTEM_FISIOLOGI.map((system) => system.key))
for (const key of FISIOLOGI_LATIHAN) assert.ok(keys.has(key), `Workout physiology key ${key} must resolve to a system.`)

console.log(`Physiology precision boundary verified across ${SISTEM_FISIOLOGI.length} systems.`)
