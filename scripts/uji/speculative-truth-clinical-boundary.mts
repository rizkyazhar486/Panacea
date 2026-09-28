import assert from 'node:assert/strict'
import {
  canEnterClinicalRecord,
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
  projectStateToSurface,
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
const speculative = speculativeStates.map((semanticState) => event(semanticState, semanticState))

for (const item of speculative) {
  assert.equal(
    canEnterClinicalRecord(item, Date.parse('2026-09-28T02:00:00.000Z')),
    false,
    `${item.semanticState} must not enter the clinical record without deliberate truth-state promotion`,
  )
}

const observed = event('measured', 'measured')
assert.equal(
  canEnterClinicalRecord(observed, Date.parse('2026-09-28T02:00:00.000Z')),
  true,
  'an observed vital with active clinical consent should remain eligible',
)

let state = createLongitudinalPatientState('subject-truth-boundary', '2026-09-28T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [...speculative, observed])

const clinical = projectStateToSurface(state, 'clinical', '2026-09-28T02:00:00.000Z')
assert.deepEqual(
  clinical.metrics.map((snapshot) => snapshot.latest.semanticState),
  ['measured'],
  'clinical projection must fail closed on speculative/reference/unavailable truth classes',
)
assert.equal(
  clinical.blockedByTruthClass,
  speculativeStates.length,
  'clinical projection must expose how many latest metrics were withheld by the truth-class boundary',
)

const emr = projectStateToSurface(state, 'ai-emr', '2026-09-28T02:00:00.000Z')
assert.deepEqual(emr.metrics.map((snapshot) => snapshot.latest.semanticState), ['measured'])
assert.equal(emr.blockedByTruthClass, speculativeStates.length)

const body = projectStateToSurface(state, 'body-exposure', '2026-09-28T02:00:00.000Z')
assert.equal(
  body.metrics.some((snapshot) => snapshot.latest.semanticState === 'simulated'),
  true,
  'simulation remains available to non-clinical projections with explicit semantic state',
)

console.log('speculative truth boundary: clinical/AI-EMR projections reject speculative truth while non-clinical projection preserves explicit simulation')
