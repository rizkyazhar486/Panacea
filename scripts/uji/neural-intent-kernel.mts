import assert from 'node:assert/strict'
import {
  canProjectIntent,
  computeIntentDisplayConfidence,
  projectIntentToDigitalBody,
  validateIntentEvent,
  type IntentEvent,
} from '../../src/lib/neuralIntent'

const base: IntentEvent = {
  id: 'intent-1',
  subjectId: 'subject-1',
  action: 'reach',
  effector: 'right-upper-limb',
  evidenceClass: 'explicit',
  source: {
    kind: 'explicit-touch',
    sourceId: 'touch-ui',
    method: 'direct-selection',
  },
  capturedAt: '2026-09-17T10:00:00.000Z',
  receivedAt: '2026-09-17T10:00:00.100Z',
  consent: {
    granted: true,
    purposes: ['personal-visualization'],
    grantedAt: '2026-09-17T09:00:00.000Z',
  },
  status: 'confirmed',
  tags: [],
}

assert.equal(validateIntentEvent(base), true)
assert.equal(canProjectIntent(base, 'personal-visualization'), true)

assert.throws(
  () => validateIntentEvent({ ...base, evidenceClass: 'decoded' }),
  /source.*evidence/i,
)
assert.throws(() => validateIntentEvent({ ...base, id: '   ' }), /event.id/i)
assert.throws(() => validateIntentEvent({ ...base, subjectId: '' }), /event.subjectId/i)
assert.throws(
  () => validateIntentEvent({ ...base, source: { ...base.source, sourceId: '' } }),
  /sourceId/i,
)
assert.throws(
  () => validateIntentEvent({ ...base, capturedAt: 'not-a-date' }),
  /capturedAt/i,
)
assert.throws(
  () => validateIntentEvent({
    ...base,
    capturedAt: '2026-09-17T10:00:01.000Z',
    receivedAt: '2026-09-17T10:00:00.000Z',
  }),
  /capturedAt.*receivedAt/i,
)
assert.throws(
  () => validateIntentEvent({
    ...base,
    consent: { ...base.consent, expiresAt: '2026-09-17T08:59:59.000Z' },
  }),
  /expiresAt/i,
)
assert.throws(
  () => validateIntentEvent({ ...base, action: 'custom', customLabel: '  ' }),
  /customLabel/i,
)

const expectedConfidence = 0.8 * 0.5 * Math.exp(-1)
const actualConfidence = computeIntentDisplayConfidence({
  sourceConfidence: 0.8,
  signalQuality: 0.5,
  capturedAtMs: 0,
  evaluatedAtMs: 1_000,
  freshnessTauMs: 1_000,
})
assert.ok(Math.abs(actualConfidence - expectedConfidence) < 1e-12)

for (const invalid of [-0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY]) {
  assert.throws(() => computeIntentDisplayConfidence({
    sourceConfidence: invalid,
    signalQuality: 0.5,
    capturedAtMs: 0,
    evaluatedAtMs: 1_000,
    freshnessTauMs: 1_000,
  }), /sourceConfidence/i)
  assert.throws(() => computeIntentDisplayConfidence({
    sourceConfidence: 0.5,
    signalQuality: invalid,
    capturedAtMs: 0,
    evaluatedAtMs: 1_000,
    freshnessTauMs: 1_000,
  }), /signalQuality/i)
}
assert.throws(() => computeIntentDisplayConfidence({
  sourceConfidence: 0.5,
  signalQuality: 0.5,
  capturedAtMs: 2_000,
  evaluatedAtMs: 1_000,
  freshnessTauMs: 1_000,
}), /evaluatedAtMs/i)
assert.throws(() => computeIntentDisplayConfidence({
  sourceConfidence: 0.5,
  signalQuality: 0.5,
  capturedAtMs: 0,
  evaluatedAtMs: 1_000,
  freshnessTauMs: 0,
}), /freshnessTauMs/i)

const explicitProjection = projectIntentToDigitalBody(base)
assert.equal(explicitProjection?.state, 'intended')
assert.equal(explicitProjection?.confidence, undefined)

const observed: IntentEvent = {
  ...base,
  id: 'intent-observed',
  evidenceClass: 'observed',
  source: { kind: 'motion-observation', sourceId: 'motion-source', method: 'pose-observation' },
  status: 'candidate',
}
assert.equal(projectIntentToDigitalBody(observed)?.state, 'observed')

const decoded: IntentEvent = {
  ...base,
  id: 'intent-decoded',
  evidenceClass: 'decoded',
  source: {
    kind: 'bci-decoder',
    sourceId: 'ecog-array',
    version: 'array-v1',
    decoderId: 'gesture-decoder',
    decoderVersion: 'decoder-v1',
    method: 'parallel-gesture-decoder',
  },
  decoderConfidence: 0.8,
  signalQuality: 0.9,
  displayConfidence: 0.72,
  status: 'confirmed',
}
assert.equal(projectIntentToDigitalBody(decoded)?.state, 'decoded-candidate')

const simulated: IntentEvent = {
  ...base,
  id: 'intent-simulated',
  evidenceClass: 'simulated',
  source: { kind: 'simulation', sourceId: 'demo-generator', method: 'demo' },
  status: 'candidate',
  consent: {
    ...base.consent,
    purposes: ['personal-visualization', 'clinical-support', 'ai-context'],
  },
}
assert.equal(projectIntentToDigitalBody(simulated)?.state, 'simulated')
assert.equal(canProjectIntent(simulated, 'clinical-support'), false)
assert.equal(canProjectIntent(simulated, 'ai-context'), false)

const rejected: IntentEvent = { ...base, id: 'intent-rejected', status: 'rejected' }
assert.equal(projectIntentToDigitalBody(rejected), null)

const noConsent: IntentEvent = {
  ...base,
  id: 'intent-no-consent',
  consent: { ...base.consent, granted: false },
}
assert.equal(projectIntentToDigitalBody(noConsent), null)

console.log('Neural intent kernel contract verified: evidence classes remain distinct, confidence is bounded, and simulation cannot enter clinical/AI context.')
