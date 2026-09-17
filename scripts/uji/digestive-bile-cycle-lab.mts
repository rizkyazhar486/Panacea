import assert from 'node:assert/strict'
import {
  DIGESTIVE_BILE_BOUNDARY,
  DIGESTIVE_BILE_DEFAULTS,
  DIGESTIVE_BILE_PROVENANCE,
  deriveBileCycle,
  normalizeBileCycleInputs,
} from '../../src/lib/digestiveBileCycleLab.ts'

const baseline = deriveBileCycle(DIGESTIVE_BILE_DEFAULTS)
for (const value of [baseline.intestinalDelivery, baseline.ilealReturn, baseline.fecalLoss, baseline.hepaticReturn]) {
  assert.ok(Number.isFinite(value) && value >= 0 && value <= 1)
}
const lowReabsorption = deriveBileCycle({ ...DIGESTIVE_BILE_DEFAULTS, ilealReabsorption: 0.2 })
const highReabsorption = deriveBileCycle({ ...DIGESTIVE_BILE_DEFAULTS, ilealReabsorption: 0.9 })
assert.ok(highReabsorption.ilealReturn > lowReabsorption.ilealReturn)
assert.ok(highReabsorption.fecalLoss < lowReabsorption.fecalLoss)
const normalized = normalizeBileCycleInputs({ hepaticSynthesisDrive: 4, mealRelease: -2, ilealReabsorption: Number.NaN })
assert.equal(normalized.hepaticSynthesisDrive, 1)
assert.equal(normalized.mealRelease, 0)
assert.equal(normalized.ilealReabsorption, 0)
assert.ok(DIGESTIVE_BILE_PROVENANCE.some((source) => source.pmid === '29080336'))
assert.match(DIGESTIVE_BILE_BOUNDARY, /synthetic dimensionless/i)
assert.match(DIGESTIVE_BILE_BOUNDARY, /not.*diagnos/i)
console.log('digestive bile-cycle lab: circulation direction, normalization, provenance and educational boundary locked')
