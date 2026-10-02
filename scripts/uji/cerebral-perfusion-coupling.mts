import assert from 'node:assert/strict'
import {
  CEREBRAL_PERFUSION_BOUNDARY,
  CEREBRAL_PERFUSION_EVIDENCE,
  deriveCerebralPerfusionPressure,
} from '../../src/lib/physiology/cerebralPerfusionCoupling.ts'

const baseline = deriveCerebralPerfusionPressure({
  meanArterialPressureMmHg: 90,
  intracranialPressureMmHg: 10,
})
assert.equal(baseline.cerebralPerfusionPressureMmHg, 80)
assert.equal(baseline.pressureGradientDirection, 'arterial-to-intracranial')
assert.equal(baseline.truthClass, 'model-derived')

// Falsifiable coupling invariants: one-for-one MAP gain raises CPP, while
// one-for-one ICP gain lowers it by the same amount.
const higherMap = deriveCerebralPerfusionPressure({
  meanArterialPressureMmHg: 105,
  intracranialPressureMmHg: 10,
})
assert.equal(higherMap.cerebralPerfusionPressureMmHg - baseline.cerebralPerfusionPressureMmHg, 15)

const higherIcp = deriveCerebralPerfusionPressure({
  meanArterialPressureMmHg: 90,
  intracranialPressureMmHg: 25,
})
assert.equal(higherIcp.cerebralPerfusionPressureMmHg - baseline.cerebralPerfusionPressureMmHg, -15)

// Equal pressure gives no positive driving gradient; the model deliberately
// does not convert that state into a diagnosis or predicted cerebral flow.
const zeroGradient = deriveCerebralPerfusionPressure({
  meanArterialPressureMmHg: 40,
  intracranialPressureMmHg: 40,
})
assert.equal(zeroGradient.cerebralPerfusionPressureMmHg, 0)
assert.equal(zeroGradient.pressureGradientDirection, 'non-positive')

const reversed = deriveCerebralPerfusionPressure({
  meanArterialPressureMmHg: 30,
  intracranialPressureMmHg: 40,
})
assert.equal(reversed.cerebralPerfusionPressureMmHg, -10)
assert.equal(reversed.pressureGradientDirection, 'non-positive')

// Sabotage: impossible pressure inputs are rejected instead of producing a
// clinically plausible-looking derived value.
assert.throws(
  () => deriveCerebralPerfusionPressure({
    meanArterialPressureMmHg: Number.NaN,
    intracranialPressureMmHg: 10,
  }),
  /mean arterial pressure must be a non-negative finite number/i,
)
assert.throws(
  () => deriveCerebralPerfusionPressure({
    meanArterialPressureMmHg: 90,
    intracranialPressureMmHg: -1,
  }),
  /intracranial pressure must be a non-negative finite number/i,
)

for (const ref of ['NCBI Bookshelf NBK537271', 'NCBI Bookshelf NBK482119']) {
  assert.ok(CEREBRAL_PERFUSION_EVIDENCE.some((item) => item.reference === ref), `missing evidence ${ref}`)
}
for (const required of ['not equivalent to cerebral blood flow', 'does not infer autoregulatory reserve', 'does not assume a universal autoregulatory plateau']) {
  assert.ok(CEREBRAL_PERFUSION_BOUNDARY.toLowerCase().includes(required.toLowerCase()), `boundary missing ${required}`)
}

console.log('cerebral perfusion coupling: MAP-ICP pressure gradient, reciprocal invariants, and autoregulation boundary locked')
