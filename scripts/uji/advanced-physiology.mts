import assert from 'node:assert/strict'
import {
  ADVANCED_PHYSIOLOGY_SYSTEMS,
  SYSTEMIC_COUPLING,
  advancedPhysiologySystem,
  arterialOxygenContentMlDl,
  homaIr,
  ratePressureProduct,
} from '../../src/lib/advancedPhysiology.ts'

assert.equal(ADVANCED_PHYSIOLOGY_SYSTEMS.length, 5)
assert.deepEqual(
  ADVANCED_PHYSIOLOGY_SYSTEMS.map((system) => system.key),
  ['endocrine', 'hepatic-metabolic', 'hematology-immune', 'autonomic', 'reproductive'],
)

for (const system of ADVANCED_PHYSIOLOGY_SYSTEMS) {
  assert.ok(system.phases.length >= 5, `${system.key} needs a clear physiological sequence`)
  assert.ok(system.layers.length >= 2, `${system.key} needs anatomical layers`)
  assert.ok(system.focusKeywords.length >= 3, `${system.key} needs real anatomy focus keywords`)
  assert.ok(system.formulae.length >= 1, `${system.key} needs equations or explicit constraints`)
  assert.ok(system.requiredMeasurements.length >= 1, `${system.key} must declare personalization inputs`)
}

assert.equal(advancedPhysiologySystem('autonomic').label, 'Autonomic & neurophysiology')
assert.equal(ratePressureProduct(70, 120), 8400)
assert.equal(ratePressureProduct(0, 120), undefined)
assert.equal(ratePressureProduct(Number.NaN, 120), undefined)

const homa = homaIr(90, 5)
assert.ok(homa !== undefined)
assert.ok(Math.abs(homa - 1.1111111111) < 1e-6)
assert.equal(homaIr(-1, 5), undefined)

const cao2 = arterialOxygenContentMlDl(15, 0.98, 100)
assert.ok(cao2 !== undefined)
assert.ok(Math.abs(cao2 - 20.0) < 0.1)
assert.equal(arterialOxygenContentMlDl(15, 1.2, 100), undefined)

assert.ok(SYSTEMIC_COUPLING.length >= 5)
for (const row of SYSTEMIC_COUPLING) {
  assert.ok(row.rest && row.exercise && row.recovery && row.sleep)
}

console.log('advanced physiology: definitions, formulas, guardrails, and coupling table validated')
