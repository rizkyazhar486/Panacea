import assert from 'node:assert/strict'
import {
  buildContextPacket,
  canEnterClinicalRecord,
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
  projectStateToSurface,
  SEMANTIC_STATES,
  validateLongitudinalEvent,
  type LongitudinalEvent,
  type SemanticState,
} from '../../src/lib/panaceaLongitudinalState.ts'

const consent = {
  granted: true,
  purposes: ['clinical-support', 'personal-visualization'] as const,
  grantedAt: '2026-09-28T00:00:00.000Z',
}

function event(id: string, semanticState: SemanticState): LongitudinalEvent<number> {
  return {
    id,
    subjectId: 'subject-truth-boundary',
    domain: 'vital',
    metric: `metric-${id}`,
    value: 1,
    unit: 'arb',
    recordedAt: '2026-09-28T01:00:00.000Z',
    confidence: 0.7,
    semanticState,
    provenance: {
      sourceKind: semanticState === 'ai-draft' || semanticState === 'simulated' ? 'derived' : 'import',
      sourceId: `source-${id}`,
      capturedAt: '2026-09-28T01:00:00.000Z',
      receivedAt: '2026-09-28T01:00:01.000Z',
    },
    consent,
    review: { state: 'not-required' },
  }
}

const speculativeStates: SemanticState[] = ['ai-draft', 'simulated', 'reference', 'unavailable']
const futureSpeculativeStates = ['model-estimated', 'counterfactual', 'hypothesis', 'stale', 'unknown', 'unsupported'] as const
for (const semanticState of futureSpeculativeStates) {
  assert.ok(
    (SEMANTIC_STATES as readonly string[]).includes(semanticState),
    `${semanticState} must be representable as a first-class longitudinal truth class`,
  )
  const futureEvent = { ...event(`future-${semanticState}`, 'measured'), semanticState: semanticState as SemanticState }
  assert.doesNotThrow(() => validateLongitudinalEvent(futureEvent))
  assert.equal(
    canEnterClinicalRecord(futureEvent, Date.parse('2026-09-28T02:00:00.000Z')),
    false,
    `${semanticState} must remain outside patient clinical truth until deliberate evidence-bearing promotion`,
  )
}

const speculative = speculativeStates.map((semanticState) => event(semanticState, semanticState))
const { semanticState: _missingTruthClass, ...unclassified } = event('unclassified', 'measured')

for (const item of speculative) {
  assert.equal(
    canEnterClinicalRecord(item, Date.parse('2026-09-28T02:00:00.000Z')),
    false,
    `${item.semanticState} must not enter the clinical record without deliberate truth-state promotion`,
  )
}

assert.equal(
  canEnterClinicalRecord(unclassified, Date.parse('2026-09-28T02:00:00.000Z')),
  false,
  'missing semanticState must fail closed at the clinical-record boundary',
)

const observed = event('measured', 'measured')
assert.equal(
  canEnterClinicalRecord(observed, Date.parse('2026-09-28T02:00:00.000Z')),
  true,
  'an observed vital with active clinical consent should remain eligible',
)

let state = createLongitudinalPatientState('subject-truth-boundary', '2026-09-28T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [...speculative, unclassified, observed])

const clinical = projectStateToSurface(state, 'clinical', '2026-09-28T02:00:00.000Z')
assert.deepEqual(
  clinical.metrics.map((snapshot) => snapshot.latest.semanticState),
  ['measured'],
  'clinical projection must fail closed on speculative/reference/unavailable truth classes',
)
assert.equal(
  clinical.blockedByTruthClass,
  speculativeStates.length + 1,
  'clinical projection must expose explicit speculative and missing truth classes withheld by the boundary',
)

const emr = projectStateToSurface(state, 'ai-emr', '2026-09-28T02:00:00.000Z')
assert.deepEqual(emr.metrics.map((snapshot) => snapshot.latest.semanticState), ['measured'])
assert.equal(emr.blockedByTruthClass, speculativeStates.length + 1)


const simulatedHistory = {
  ...event('simulated-history', 'simulated'),
  metric: 'shared-clinical-metric',
  value: 100,
  recordedAt: '2026-09-28T00:30:00.000Z',
  provenance: {
    ...event('simulated-history', 'simulated').provenance,
    capturedAt: '2026-09-28T00:30:00.000Z',
    receivedAt: '2026-09-28T00:30:01.000Z',
  },
}
const measuredLatest = {
  ...event('measured-latest', 'measured'),
  metric: 'shared-clinical-metric',
  value: 1,
}
let trendState = createLongitudinalPatientState('subject-truth-boundary', '2026-09-28T00:00:00.000Z')
trendState = ingestLongitudinalBatch(trendState, [simulatedHistory, measuredLatest])
const clinicalHistory = projectStateToSurface(trendState, 'clinical', '2026-09-28T02:00:00.000Z')
assert.equal(clinicalHistory.metrics.length, 1)
assert.equal(
  clinicalHistory.metrics[0]?.previous,
  undefined,
  'clinical snapshot history must not expose a speculative previous event behind an admitted measured latest value',
)
assert.equal(
  clinicalHistory.metrics[0]?.eventCount,
  1,
  'clinical snapshot eventCount must count only events visible through the same truth/consent/review boundary',
)

const clinicalPacket = buildContextPacket(trendState, 'clinical', '2026-09-28T02:00:00.000Z')
assert.equal(clinicalPacket.signals.length, 1)
assert.equal(
  clinicalPacket.signals[0]?.trend,
  null,
  'clinical trend derivation must not mix speculative historical values into an admitted measured signal',
)

const body = projectStateToSurface(state, 'body-exposure', '2026-09-28T02:00:00.000Z')
assert.equal(
  body.metrics.some((snapshot) => snapshot.latest.semanticState === 'simulated'),
  true,
  'simulation remains available to non-clinical projections with explicit semantic state',
)

console.log('speculative truth boundary: clinical/AI-EMR projections reject speculative truth while non-clinical projection preserves explicit simulation')
