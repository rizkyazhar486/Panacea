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
  assert.ok(typeof value === 'number' && value >= 0 && value <= 1, `${key} must remain a normalized 0–1 teaching signal`)
}

const lowController = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, hypothalamicDrive: 0.1 })
const highController = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, hypothalamicDrive: 0.9 })
assert.ok(highController.pituitarySignal > lowController.pituitarySignal, 'higher upstream drive must raise pituitary signal')
assert.ok(highController.hormoneSignal > lowController.hormoneSignal, 'higher upstream drive must raise downstream hormone signal')

const lowPituitary = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, pituitaryGain: 0.1 })
const highPituitary = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, pituitaryGain: 0.9 })
assert.ok(highPituitary.pituitarySignal > lowPituitary.pituitarySignal, 'higher pituitary gain must amplify tropic signal')

const lowGland = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, glandCapacity: 0.1 })
const highGland = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, glandCapacity: 0.9 })
assert.ok(highGland.hormoneSignal > lowGland.hormoneSignal, 'higher target-gland capacity must raise hormone signal')

const lowSensitivity = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, receptorSensitivity: 0.1 })
const highSensitivity = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, receptorSensitivity: 0.9 })
assert.ok(highSensitivity.receptorEffectSignal > lowSensitivity.receptorEffectSignal, 'higher receptor sensitivity must raise target-response signal')
assert.ok(highSensitivity.feedbackSuppressionSignal > lowSensitivity.feedbackSuppressionSignal, 'stronger target response must feed back more strongly when feedback gain is held constant')

const lowClearance = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, hormoneClearance: 0.1 })
const highClearance = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, hormoneClearance: 0.9 })
assert.ok(highClearance.hormoneSignal < lowClearance.hormoneSignal, 'higher clearance must lower synthetic hormone signal')

const lowFeedback = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, feedbackGain: 0.1 })
const highFeedback = deriveEndocrineFeedback({ ...ENDOCRINE_FEEDBACK_DEFAULTS, feedbackGain: 0.9 })
assert.ok(highFeedback.feedbackSuppressionSignal > lowFeedback.feedbackSuppressionSignal, 'higher feedback gain must raise suppression signal')
assert.ok(highFeedback.controllerResidualSignal < lowFeedback.controllerResidualSignal, 'higher feedback gain must suppress residual controller drive')

const normalized = normalizeEndocrineFeedbackInputs({ hypothalamicDrive: 4, glandCapacity: -3, feedbackGain: Number.NaN })
assert.equal(normalized.hypothalamicDrive, 1)
assert.equal(normalized.glandCapacity, 0)
assert.equal(normalized.feedbackGain, 0)

for (const token of ['dH/dt = secretion − clearance', 'θ = C / (C + Kd)', 'negative feedback: target signal ↑ → upstream drive ↓']) {
  assert.ok(ENDOCRINE_TEACHING_EQUATIONS.some((item) => item.expression === token), `formula ledger must preserve ${token}`)
}

assert.deepEqual(ENDOCRINE_EVIDENCE.map((item) => item.pmid), ['29764284', '8701079', '16595713'])
for (const source of ENDOCRINE_EVIDENCE) assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
assert.match(ENDOCRINE_FEEDBACK_BOUNDARY, /synthetic dimensionless signals/i)
assert.match(ENDOCRINE_FEEDBACK_BOUNDARY, /does not calculate serum hormone concentrations/i)
assert.match(ENDOCRINE_FEEDBACK_BOUNDARY, /patient-specific treatment/i)

console.log('endocrine feedback lab: directional control, receptor response, feedback, provenance and safety boundary locked')
