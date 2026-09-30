import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildHumanObservabilityFrame,
  observabilityGapForMetric,
  observationsByTruthClass,
} from '../../src/lib/humanObservability.ts'
import {
  appendPurposeConsentDecision,
  createPurposeConsentLedger,
} from '../../src/lib/purposeConsentLedger.ts'
import {
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
} from '../../src/lib/panaceaLongitudinalState.ts'
import {
  EMBODIED_WORKFLOW_OS_POLICY,
  buildEmbodiedInteractionGraph,
  buildEmbodiedWorkflowEpisode,
  buildEmbodiedWorkflowLongitudinalEvent,
  scoreProtocolStep,
} from '../../src/lib/embodiedWorkflowOS.ts'

const subjectId = 'observability-subject-1'
const consent = {
  granted: true,
  purposes: ['personal-visualization', 'clinical-support', 'ai-context'],
  grantedAt: '2026-09-01T00:00:00.000Z',
}

function event({
  id,
  metric,
  domain,
  value,
  recordedAt,
  semanticState = 'measured',
  sourceKind = 'wearable',
  unit,
}) {
  return {
    id,
    subjectId,
    domain,
    metric,
    value,
    unit,
    recordedAt,
    confidence: 0.9,
    semanticState,
    provenance: {
      sourceKind,
      sourceId: `${sourceKind}:${id}`,
      capturedAt: recordedAt,
      receivedAt: recordedAt,
      method: 'fixture',
      version: '1',
    },
    consent,
    review: { state: 'not-required' },
  }
}

let ledger = createPurposeConsentLedger()
ledger = appendPurposeConsentDecision(ledger, {
  id: 'grant-personal',
  subjectId,
  purpose: 'personal-visualization',
  action: 'grant',
  decidedAt: '2026-09-01T00:00:00.000Z',
  source: 'user',
})

let state = createLongitudinalPatientState(subjectId, '2026-09-01T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [
  event({
    id: 'heart-rate',
    metric: 'heart-rate',
    domain: 'vital',
    value: 72,
    recordedAt: '2026-09-03T10:00:00.000Z',
  }),
  event({
    id: 'simulated-readiness',
    metric: 'readiness-scenario',
    domain: 'readiness',
    value: 0.74,
    recordedAt: '2026-09-03T10:15:00.000Z',
    semanticState: 'simulated',
    sourceKind: 'derived',
  }),
  event({
    id: 'future-heart-rate',
    metric: 'heart-rate',
    domain: 'vital',
    value: 88,
    recordedAt: '2026-09-03T12:00:00.000Z',
  }),
])

test('human observability excludes future knowledge and preserves truth classes', () => {
  const frame = buildHumanObservabilityFrame({
    state,
    consentLedger: ledger,
    purpose: 'personal-visualization',
    at: '2026-09-03T11:00:00.000Z',
    expectations: [
      { metric: 'heart-rate', maxAgeMs: 2 * 60 * 60 * 1000 },
      { metric: 'spo2', maxAgeMs: 15 * 60 * 1000 },
    ],
  })

  assert.equal(frame.observations.length, 2)
  assert.equal(frame.observations.some((observation) => observation.eventId === 'future-heart-rate'), false)
  assert.equal(observationsByTruthClass(frame, 'observed').length, 1)
  assert.equal(observationsByTruthClass(frame, 'simulated').length, 1)
  assert.equal(observabilityGapForMetric(frame, 'heart-rate'), undefined)
  assert.equal(observabilityGapForMetric(frame, 'spo2')?.reason, 'missing')
  assert.deepEqual(frame.coverage.observedMetrics, ['heart-rate'])
  assert.equal(frame.boundary.missingDataMayBeFabricated, false)
  assert.equal(frame.boundary.autonomousClinicalActionAllowed, false)
})

test('stale expected signals become explicit blind spots', () => {
  const frame = buildHumanObservabilityFrame({
    state,
    consentLedger: ledger,
    purpose: 'personal-visualization',
    at: '2026-09-03T11:00:00.000Z',
    expectations: [{ metric: 'heart-rate', maxAgeMs: 30 * 60 * 1000 }],
  })

  const gap = observabilityGapForMetric(frame, 'heart-rate')
  assert.equal(gap?.reason, 'stale')
  assert.equal(gap?.ageMs, 60 * 60 * 1000)
})

test('purpose revocation removes observations from the authorized frame', () => {
  const revoked = appendPurposeConsentDecision(ledger, {
    id: 'revoke-personal',
    subjectId,
    purpose: 'personal-visualization',
    action: 'revoke',
    decidedAt: '2026-09-03T10:30:00.000Z',
    source: 'user',
  })

  const frame = buildHumanObservabilityFrame({
    state,
    consentLedger: revoked,
    purpose: 'personal-visualization',
    at: '2026-09-03T11:00:00.000Z',
  })

  assert.equal(frame.observations.length, 0)
  assert.equal(frame.governance.ledgerAuthorized, false)
  assert.ok(frame.governance.purposeConsentFilteredEvents > 0)
  assert.equal(frame.boundary.covertCollectionAllowed, false)
})


test('simulated state cannot satisfy a live observed-signal expectation', () => {
  let truthState = createLongitudinalPatientState(subjectId, '2026-09-01T00:00:00.000Z')
  truthState = ingestLongitudinalBatch(truthState, [
    event({
      id: 'observed-spo2-old',
      metric: 'spo2',
      domain: 'vital',
      value: 97,
      recordedAt: '2026-09-03T09:00:00.000Z',
    }),
    event({
      id: 'simulated-spo2-fresh',
      metric: 'spo2',
      domain: 'vital',
      value: 99,
      recordedAt: '2026-09-03T10:55:00.000Z',
      semanticState: 'simulated',
      sourceKind: 'derived',
    }),
  ])

  const frame = buildHumanObservabilityFrame({
    state: truthState,
    consentLedger: ledger,
    purpose: 'personal-visualization',
    at: '2026-09-03T11:00:00.000Z',
    expectations: [{ metric: 'spo2', maxAgeMs: 30 * 60 * 1000 }],
  })

  const gap = observabilityGapForMetric(frame, 'spo2')
  assert.equal(gap?.reason, 'stale')
  assert.equal(gap?.latestRecordedAt, '2026-09-03T09:00:00.000Z')
  assert.equal(gap?.ageMs, 2 * 60 * 60 * 1000)
  assert.deepEqual(frame.coverage.observedMetrics, ['spo2'])
})


test('expectation identity keeps domain and unit-specific blind spots separate', () => {
  let identityState = createLongitudinalPatientState(subjectId, '2026-09-01T00:00:00.000Z')
  identityState = ingestLongitudinalBatch(identityState, [
    event({
      id: 'device-core-temperature-celsius',
      metric: 'core-temperature',
      domain: 'device',
      unit: 'celsius',
      value: 37,
      recordedAt: '2026-09-03T10:55:00.000Z',
    }),
    event({
      id: 'vital-core-temperature-fahrenheit',
      metric: 'core-temperature',
      domain: 'vital',
      unit: 'fahrenheit',
      value: 98.6,
      recordedAt: '2026-09-03T10:56:00.000Z',
    }),
  ])

  const frame = buildHumanObservabilityFrame({
    state: identityState,
    consentLedger: ledger,
    purpose: 'personal-visualization',
    at: '2026-09-03T11:00:00.000Z',
    expectations: [
      { metric: 'core-temperature', domain: 'device', unit: 'celsius', maxAgeMs: 30 * 60 * 1000 },
      { metric: 'core-temperature', domain: 'vital', unit: 'fahrenheit', maxAgeMs: 30 * 60 * 1000 },
      { metric: 'core-temperature', domain: 'vital', unit: 'celsius', maxAgeMs: 30 * 60 * 1000 },
    ],
  })

  assert.deepEqual(frame.coverage.gaps, [{
    metric: 'core-temperature',
    domain: 'vital',
    unit: 'celsius',
    reason: 'missing',
    required: true,
    maxAgeMs: 30 * 60 * 1000,
  }])
})


test('gap lookup requires signal identity when a metric has multiple blind spots', () => {
  const frame = buildHumanObservabilityFrame({
    state: createLongitudinalPatientState(subjectId, '2026-09-01T00:00:00.000Z'),
    consentLedger: ledger,
    purpose: 'personal-visualization',
    at: '2026-09-03T11:00:00.000Z',
    expectations: [
      { metric: 'core-temperature', domain: 'device', unit: 'celsius', maxAgeMs: 30 * 60 * 1000 },
      { metric: 'core-temperature', domain: 'vital', unit: 'celsius', maxAgeMs: 30 * 60 * 1000 },
    ],
  })

  assert.throws(
    () => observabilityGapForMetric(frame, 'core-temperature'),
    /ambiguous observability gap lookup: core-temperature/,
  )
  assert.equal(
    observabilityGapForMetric(frame, 'core-temperature', { domain: 'vital', unit: 'celsius' })?.domain,
    'vital',
  )
})


test('embodied workflow OS converts authorized hand-object evidence into explicit protocol gaps', () => {
  const protocol = {
    id: 'bench-demo',
    version: '1',
    label: 'Bench demonstration',
    contextKinds: ['laboratory'],
    provenanceRef: 'approved-protocol:bench-demo:v1',
    steps: [
      {
        id: 'select-pipette',
        label: 'Select pipette',
        requirements: [
          { id: 'pipette-grasp', objectLabels: ['pipette'], actionLabels: ['grasp'] },
        ],
      },
      {
        id: 'dispense-tube',
        label: 'Dispense into tube',
        requirements: [
          { id: 'tube-dispense', objectLabels: ['tube'], actionLabels: ['dispense'] },
        ],
      },
    ],
  }

  const frameA = {
    id: 'frame-a',
    workspaceId: 'bench-a',
    capturedAt: '2026-09-29T10:00:00.000Z',
    source: { kind: 'head-mounted-camera', id: 'headcam-a', modelVersion: 'fixture-1' },
    detections: [
      { id: 'hand-a', kind: 'hand', label: 'right hand', handedness: 'right', confidence: 0.98 },
      { id: 'pipette-a', kind: 'instrument', label: 'pipette', confidence: 0.96 },
    ],
    relations: [
      {
        id: 'interaction-a',
        handDetectionId: 'hand-a',
        objectDetectionId: 'pipette-a',
        actionLabel: 'grasp',
        spatialConfidence: 0.94,
        temporalConfidence: 0.92,
        contactConfidence: 0.93,
        actionConfidence: 0.90,
      },
    ],
  }

  const firstEpisode = buildEmbodiedWorkflowEpisode({
    id: 'episode-a',
    contextKind: 'laboratory',
    frames: [frameA],
    protocol,
  })

  assert.equal(buildEmbodiedInteractionGraph(frameA).length, 1)
  assert.equal(firstEpisode.stepEvidence[0].state, 'supported-candidate')
  assert.equal(firstEpisode.stepEvidence[1].state, 'unobserved')
  assert.equal(firstEpisode.protocolCoverage, 0.5)
  assert.equal(firstEpisode.protocolCoverageGap, 0.5)
  assert.equal(firstEpisode.boundary.protocolComplianceEstablished, false)
  assert.equal(EMBODIED_WORKFLOW_OS_POLICY.autonomousClinicalActionAllowed, false)
})

test('protocol scoring reassigns broad matches so specific evidence is not falsely missed', () => {
  const step = {
    id: 'pipette-use',
    label: 'Use pipette',
    requirements: [
      { id: 'pipette-any-action', objectLabels: ['pipette'] },
      { id: 'pipette-grasp', objectLabels: ['pipette'], actionLabels: ['grasp'] },
    ],
  }
  const interactions = [
    {
      id: 'grasp-high',
      capturedAt: '2026-09-29T10:00:00.000Z',
      objectLabel: 'pipette',
      actionLabel: 'grasp',
      handedness: 'right',
      confidence: 0.98,
    },
    {
      id: 'move-lower',
      capturedAt: '2026-09-29T10:00:01.000Z',
      objectLabel: 'pipette',
      actionLabel: 'move',
      handedness: 'right',
      confidence: 0.84,
    },
  ]

  const scored = scoreProtocolStep(step, interactions)

  assert.equal(scored.coverage, 1)
  assert.equal(scored.state, 'supported-candidate')
  assert.deepEqual(scored.matchedRequirementIds, ['pipette-any-action', 'pipette-grasp'])
  assert.deepEqual(scored.missingRequirementIds, [])
  assert.deepEqual(scored.supportingInteractionIds, ['move-lower', 'grasp-high'])
})

test('protocol scoring still forbids reusing one interaction for two requirements', () => {
  const step = {
    id: 'pipette-use',
    label: 'Use pipette',
    requirements: [
      { id: 'pipette-any-action', objectLabels: ['pipette'] },
      { id: 'pipette-grasp', objectLabels: ['pipette'], actionLabels: ['grasp'] },
    ],
  }
  const interactions = [{
    id: 'grasp-only',
    capturedAt: '2026-09-29T10:00:00.000Z',
    objectLabel: 'pipette',
    actionLabel: 'grasp',
    handedness: 'right',
    confidence: 0.98,
  }]

  const scored = scoreProtocolStep(step, interactions)

  assert.equal(scored.coverage, 0.5)
  assert.equal(scored.state, 'partial')
  assert.equal(scored.matchedRequirementIds.length, 1)
  assert.equal(scored.missingRequirementIds.length, 1)
  assert.deepEqual(scored.supportingInteractionIds, ['grasp-only'])
})

test('embodied workflow OS writes only a model-estimated derived summary until human review', () => {
  const episode = buildEmbodiedWorkflowEpisode({
    id: 'episode-reviewed-boundary',
    contextKind: 'laboratory',
    frames: [{
      id: 'frame-boundary',
      workspaceId: 'bench-a',
      capturedAt: '2026-09-29T10:00:00.000Z',
      source: { kind: 'head-mounted-camera', id: 'headcam-a' },
      detections: [
        { id: 'hand-boundary', kind: 'hand', label: 'left hand', handedness: 'left', confidence: 0.97 },
        { id: 'tube-boundary', kind: 'container', label: 'tube', confidence: 0.95 },
      ],
      relations: [{
        id: 'interaction-boundary',
        handDetectionId: 'hand-boundary',
        objectDetectionId: 'tube-boundary',
        actionLabel: 'position',
        spatialConfidence: 0.92,
        temporalConfidence: 0.91,
        contactConfidence: 0.90,
        actionConfidence: 0.89,
      }],
    }],
  })

  const event = buildEmbodiedWorkflowLongitudinalEvent(episode, {
    subjectId,
    purpose: 'clinical-support',
    consent,
    receivedAt: '2026-09-29T10:01:00.000Z',
  })

  assert.equal(event.domain, 'other')
  assert.equal(event.metric, 'embodied-workflow-episode')
  assert.equal(event.semanticState, 'model-estimated')
  assert.equal(event.provenance.sourceKind, 'derived')
  assert.equal(JSON.stringify(event.value).includes('xMin'), false)
  assert.equal(JSON.stringify(event.value).includes('rawMedia'), true)

  const reviewed = buildEmbodiedWorkflowLongitudinalEvent(episode, {
    subjectId,
    purpose: 'clinical-support',
    consent,
    receivedAt: '2026-09-29T10:01:00.000Z',
    review: {
      state: 'accepted',
      reviewerId: 'clinician-reviewer-1',
      reviewedAt: '2026-09-29T10:02:00.000Z',
    },
  })
  assert.equal(reviewed.semanticState, 'clinician-reviewed')
})
