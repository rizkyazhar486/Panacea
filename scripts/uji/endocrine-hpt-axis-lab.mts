import assert from 'node:assert/strict'
import {
  ENDOCRINE_HPT_BOUNDARY,
  ENDOCRINE_HPT_DEFAULTS,
  ENDOCRINE_HPT_PROVENANCE,
  deriveHptAxis,
  normalizeHptInputs,
} from '../../src/lib/endocrineHptAxisLab.ts'

const baseline = deriveHptAxis(ENDOCRINE_HPT_DEFAULTS)
for (const value of [baseline.trhSignal, baseline.tshSignal, baseline.thyroidHormoneSignal, baseline.feedbackSignal]) {
  assert.ok(Number.isFinite(value) && value >= 0 && value <= 1)
}
const lowFeedback = deriveHptAxis({ ...ENDOCRINE_HPT_DEFAULTS, thyroidHormone: 0.2 })
const highFeedback = deriveHptAxis({ ...ENDOCRINE_HPT_DEFAULTS, thyroidHormone: 0.9 })
assert.ok(highFeedback.trhSignal < lowFeedback.trhSignal)
assert.ok(highFeedback.tshSignal < lowFeedback.tshSignal)
const normalized = normalizeHptInputs({ hypothalamicDrive: 9, pituitaryResponsiveness: -1, thyroidHormone: Number.NaN })
assert.equal(normalized.hypothalamicDrive, 1)
assert.equal(normalized.pituitaryResponsiveness, 0)
assert.equal(normalized.thyroidHormone, 0)
assert.ok(ENDOCRINE_HPT_PROVENANCE.some((source) => source.pmid === '27347897'))
assert.match(ENDOCRINE_HPT_BOUNDARY, /synthetic dimensionless/i)
assert.match(ENDOCRINE_HPT_BOUNDARY, /not.*diagnos/i)
console.log('endocrine HPT-axis lab: feedback direction, normalization, provenance and educational boundary locked')
