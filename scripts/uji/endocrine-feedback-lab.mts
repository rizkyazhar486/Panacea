import assert from 'node:assert/strict'
import {
  ENDOCRINE_EVIDENCE,
  ENDOCRINE_FEEDBACK_BOUNDARY,
  ENDOCRINE_FEEDBACK_DEFAULTS,
  ENDOCRINE_TEACHING_EQUATIONS,
  deriveEndocrineFeedback,
  normalizeEndocrineFeedbackInputs,
} from '../../src/lib/endocrineFeedbackLab.ts'

const baseline = deriveEndocrineFeedback(ENDOCRINE_FEEDBACK_DEFAULTS)
for (const [key, value] of Object.entries(baseline)) {
  if (key === 'dominantConstraint') continue
  assert.ok(typeof value === 'number' && value >= 0 && value <= 1)
}
const lowController = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, hypothalamicDrive: 0.1 })
const highController = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, hypothalamicDrive: 0.9 })
assert.ok(highController.pituitarySignal > lowController.pituitarySignal)
assert.ok(highController.hormoneSignal > lowController.hormoneSignal)
const lowClearance = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, hormoneClearance: 0.1 })
const highClearance = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, hormoneClearance: 0.9 })
assert.ok(highClearance.hormoneSignal < lowClearance.hormoneSignal)
const lowFeedback = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, feedbackGain: 0.1 })
const highFeedback = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, feedbackGain: 0.9 })
assert.ok(highFeedback.feedbackSuppressionSignal > lowFeedback.feedbackSuppressionSignal)
assert.ok(highFeedback.controllerResidualSignal < lowFeedback.controllerResidualSignal)
const normalized = normalizeEndocrineFeedbackInputs({ hypothalamicDrive: 4, glandCapacity: -3, feedbackGain: Number.NaN })
assert.equal(normalized.hypothalamicDrive, 1)
assert.equal(normalized.glandCapacity, 0)
assert.equal(normalized.feedbackGain, 0)
for (const token of ['dH/dt = secretion − clearance', 'θ = C / (C + Kd)', 'negative feedback: target signal ↑ → upstream drive ↓']) assert.ok(ENDOCRINE_TEACHING_EQUATIONS.some((item) => item.expression === token))
assert.deepEqual(ENDOCRINE_EVIDENCE.map((item) => item.pmid), ['29764284', '8701079', '16595713'])
for (const source of ENDOCRINE_EVIDENCE) assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
assert.match(ENDOCRINE_FEEDBACK_BOUNDARY, /synthetic dimensionless signals/i)
assert.match(ENDOCRINE_FEEDBACK_BOUNDARY, /patient-specific treatment/i)
console.log('endocrine feedback lab: directional control, provenance and safety boundary locked')