import assert from 'node:assert/strict'
import {
  ACID_BASE_COUPLING_BOUNDARY,
  ACID_BASE_COUPLING_CONSTANTS,
  ACID_BASE_COUPLING_EVIDENCE,
  deriveAcidBaseCoupling,
} from '../../src/lib/physiology/acidBaseCoupling.ts'

const close = (actual: number, expected: number, tolerance = 1e-12) =>
  Math.abs(actual - expected) <= tolerance

const baseline = deriveAcidBaseCoupling({
  bicarbonateMmolL: 24,
  bicarbonateSource: 'arterial-blood-gas-bicarbonate',
  arterialPaco2MmHg: 40,
})

assert.ok(close(baseline.pH, 7.401029995663981))
assert.equal(baseline.respiratoryComponent, 1.2)
assert.equal(baseline.metabolicComponent, 24)
assert.equal(baseline.truthClass, 'model-derived')

// Falsifiable directional invariants:
// at fixed bicarbonate, CO2 retention lowers pH;
// at fixed PaCO2, lower bicarbonate lowers pH.
const hypercapnic = deriveAcidBaseCoupling({
  bicarbonateMmolL: 24,
  bicarbonateSource: 'arterial-blood-gas-bicarbonate',
  arterialPaco2MmHg: 60,
})
assert.ok(close(hypercapnic.pH, 7.2249387366082995))
assert.ok(hypercapnic.pH < baseline.pH)

const lowBicarbonate = deriveAcidBaseCoupling({
  bicarbonateMmolL: 12,
  bicarbonateSource: 'arterial-blood-gas-bicarbonate',
  arterialPaco2MmHg: 40,
})
assert.ok(close(lowBicarbonate.pH, 7.1))
assert.ok(lowBicarbonate.pH < baseline.pH)

// Ratio invariance: doubling both buffer components leaves pH unchanged.
const scaled = deriveAcidBaseCoupling({
  bicarbonateMmolL: 48,
  bicarbonateSource: 'arterial-blood-gas-bicarbonate',
  arterialPaco2MmHg: 80,
})
assert.ok(close(scaled.pH, baseline.pH))

// Sabotage guards: do not silently treat chemistry total CO2 as bicarbonate,
// and reject non-physically-defined denominator/numerator inputs.
assert.throws(
  () => deriveAcidBaseCoupling({
    bicarbonateMmolL: 24,
    bicarbonateSource: 'serum-total-co2-surrogate',
    arterialPaco2MmHg: 40,
  }),
  /total CO2 cannot be silently substituted/i,
)
assert.throws(
  () => deriveAcidBaseCoupling({
    bicarbonateMmolL: 0,
    bicarbonateSource: 'arterial-blood-gas-bicarbonate',
    arterialPaco2MmHg: 40,
  }),
  /bicarbonate must be a positive finite number/i,
)
assert.throws(
  () => deriveAcidBaseCoupling({
    bicarbonateMmolL: 24,
    bicarbonateSource: 'arterial-blood-gas-bicarbonate',
    arterialPaco2MmHg: Number.NaN,
  }),
  /arterial PaCO2 must be a positive finite number/i,
)

assert.deepEqual(ACID_BASE_COUPLING_CONSTANTS, {
  pKa: 6.1,
  co2SolubilityMmolLPerMmHg: 0.03,
})
for (const ref of ['NCBI Bookshelf NBK308', 'NCBI Bookshelf NBK493167', 'NCBI Bookshelf NBK536919']) {
  assert.ok(ACID_BASE_COUPLING_EVIDENCE.some((item) => item.reference === ref), `missing evidence ${ref}`)
}
assert.match(ACID_BASE_COUPLING_BOUNDARY, /model-derived/i)
assert.match(ACID_BASE_COUPLING_BOUNDARY, /does not diagnose/i)
assert.match(ACID_BASE_COUPLING_BOUNDARY, /total CO2 is not silently substituted/i)
assert.match(ACID_BASE_COUPLING_BOUNDARY, /37 °C/i)

console.log('acid-base coupling: Henderson-Hasselbalch renal-respiratory ratio invariants and source-boundary sabotage guards locked')
