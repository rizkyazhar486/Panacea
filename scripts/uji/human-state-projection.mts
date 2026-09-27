import assert from 'node:assert/strict'
import {
  appendPurposeConsentDecision,
  createPurposeConsentLedger,
} from '../../src/lib/purposeConsentLedger.ts'
import {
  createLongitudinalPatientState,
  ingestLongitudinalEvent,
  type LongitudinalEvent,
} from '../../src/lib/panaceaLongitudinalState.ts'
import { boundaryConditionFromLongitudinalEvent } from '../../src/lib/physiology/longitudinalBoundary.ts'
import {
  createDomainEngineRegistry,
  runPhysiologicalSimulation,
  type DomainEngineContract,
} from '../../src/lib/physiology/runtime.ts'
import { projectHumanState } from '../../src/lib/humanStateProjection.ts'

const subjectId = 'subject-human-state-001'
const observedAt = '2026-09-28T00:00:00.000Z'

const heartRate: LongitudinalEvent<number> = {
  id: 'evt-heart-rate-1',
  subjectId,
  domain: 'vital',
  metric: 'heart-rate',
  value: 72,
  unit: 'bpm',
  recordedAt: observedAt,
  confidence: 0.98,
  provenance: {
    sourceKind: 'device',
    sourceId: 'device:fixture',
    capturedAt: observedAt,
    receivedAt: '2026-09-28T00:00:01.000Z',
  },
  consent: {
    granted: true,
    purposes: ['personal-visualization', 'clinical-support'],
    grantedAt: '2026-09-27T00:00:00.000Z',
  },
  review: { state: 'not-required' },
  semanticState: 'measured',
}

let state = createLongitudinalPatientState(subjectId, '2026-09-27T00:00:00.000Z')
state = ingestLongitudinalEvent(state, heartRate).state

const engine: DomainEngineContract<number> = {
  id: 'human-state-fixture',
  modelId: 'human-state-fixture-model',
  modelVersion: '1.0.0',
  parameterSetId: 'fixture',
  validationClass: 'synthetic',
  fidelity: 'infrastructure-fixture',
  dtSeconds: 1,
  consumes: [{ name: 'boundary.heart-rate', unit: 'bpm' }],
  produces: [
    { name: 'estimated.cardiac-drive', unit: '1', truthClass: 'model-derived' },
    { name: 'simulated.reserve', unit: '1', truthClass: 'simulated' },
  ],
  initialize: () => 0,
  step: ({ inputs }) => ({
    state: 1,
    outputs: [
      { name: 'estimated.cardiac-drive', unit: '1', value: inputs['boundary.heart-rate'].value / 100, sigma: 0.05 },
      { name: 'simulated.reserve', unit: '1', value: 0.8, sigma: 0.1 },
    ],
  }),
}

const registry = createDomainEngineRegistry(
  [engine],
  [{ name: 'boundary.heart-rate', unit: 'bpm' }],
)
const boundary = boundaryConditionFromLongitudinalEvent(heartRate, { name: 'boundary.heart-rate' })
const physiology = runPhysiologicalSimulation({
  registry,
  boundaryConditions: [boundary],
  untilSeconds: 0,
})

assert.equal(physiology.boundaries['boundary.heart-rate'].provenance.sourceEventId, heartRate.id)

let consentLedger = createPurposeConsentLedger()
consentLedger = appendPurposeConsentDecision(consentLedger, {
  id: 'grant-personal',
  subjectId,
  purpose: 'personal-visualization',
  action: 'grant',
  decidedAt: '2026-09-27T00:00:00.000Z',
  policyVersion: 'human-state-v1',
  source: 'user',
})

const body = projectHumanState({
  state,
  surface: 'body-exposure',
  physiology,
  consentLedger,
  at: '2026-09-28T00:05:00.000Z',
})
assert.equal(body.canonical.metrics.some((item) => item.metric === 'heart-rate'), true)
assert.deepEqual(body.physiology.observed.map((field) => field.name), ['boundary.heart-rate'])
assert.deepEqual(body.physiology.estimated.map((field) => field.name), ['estimated.cardiac-drive'])
assert.deepEqual(body.physiology.simulated.map((field) => field.name), ['simulated.reserve'])
assert.equal(body.physiology.blocked.length, 0)
assert.equal(body.physiology.estimated[0].sourceEventIds[0], heartRate.id)
assert.equal(body.invariants.counterfactualMayMutateCurrentState, false)

consentLedger = appendPurposeConsentDecision(consentLedger, {
  id: 'revoke-personal',
  subjectId,
  purpose: 'personal-visualization',
  action: 'revoke',
  decidedAt: '2026-09-28T00:10:00.000Z',
  policyVersion: 'human-state-v1',
  source: 'user',
})

const revokedBody = projectHumanState({
  state,
  surface: 'body-exposure',
  physiology,
  consentLedger,
  at: '2026-09-28T00:11:00.000Z',
})
assert.equal(revokedBody.canonical.metrics.length, 0)
assert.equal(revokedBody.physiology.observed.length, 0)
assert.equal(revokedBody.physiology.estimated.length, 0)
assert.equal(revokedBody.physiology.simulated.length, 0)
assert.equal(revokedBody.physiology.blocked.length, 3)
assert.ok(revokedBody.physiology.blocked.every((field) => field.reason === 'unauthorized-lineage'))

const clinical = projectHumanState({
  state,
  surface: 'clinical',
  physiology,
  consentLedger,
  at: '2026-09-28T00:11:00.000Z',
})
assert.equal(clinical.canonical.metrics.some((item) => item.metric === 'heart-rate'), true)
assert.equal(clinical.physiology.estimated.length, 1)

const brokenPhysiology = {
  ...physiology,
  provenance: physiology.provenance.map((entry) => (
    entry.kind === 'boundary' ? { ...entry, sourceEventId: undefined } : entry
  )),
}
const missingLineage = projectHumanState({
  state,
  surface: 'clinical',
  physiology: brokenPhysiology,
  at: '2026-09-28T00:11:00.000Z',
})
assert.equal(missingLineage.physiology.observed.length, 0)
assert.equal(missingLineage.physiology.estimated.length, 0)
assert.equal(missingLineage.physiology.simulated.length, 0)
assert.equal(missingLineage.physiology.blocked.length, 3)
assert.ok(missingLineage.physiology.blocked.every((field) => field.reason === 'missing-lineage'))


const futureHeartRate: LongitudinalEvent<number> = {
  ...heartRate,
  id: 'evt-heart-rate-future',
  value: 88,
  recordedAt: '2026-09-29T00:00:00.000Z',
  provenance: {
    ...heartRate.provenance,
    capturedAt: '2026-09-29T00:00:00.000Z',
    receivedAt: '2026-09-29T00:00:01.000Z',
  },
}
const stateWithFuture = ingestLongitudinalEvent(state, futureHeartRate).state
const futureBoundary = boundaryConditionFromLongitudinalEvent(futureHeartRate, { name: 'boundary.heart-rate' })
const futurePhysiology = runPhysiologicalSimulation({
  registry,
  boundaryConditions: [futureBoundary],
  untilSeconds: 0,
})
const historical = projectHumanState({
  state: stateWithFuture,
  surface: 'clinical',
  physiology: futurePhysiology,
  at: '2026-09-28T12:00:00.000Z',
})
const historicalHeartRate = historical.canonical.metrics.find((item) => item.metric === 'heart-rate')
assert.equal(historicalHeartRate?.latest.id, heartRate.id, 'snapshot X(t) must not select a canonical observation from the future')
assert.equal(historicalHeartRate?.latest.value, 72)
assert.equal(historical.physiology.observed.length, 0)
assert.equal(historical.physiology.estimated.length, 0)
assert.equal(historical.physiology.simulated.length, 0)
assert.equal(historical.physiology.blocked.length, 3)
assert.ok(historical.physiology.blocked.every((field) => field.reason === 'not-yet-effective'))

console.log('human-state-projection: one shared state, body-exposure surface, consent-scoped physiology lineage, and observed/estimated/simulated separation verified')
