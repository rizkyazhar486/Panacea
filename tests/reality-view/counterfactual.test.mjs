import assert from 'node:assert/strict'
import test from 'node:test'
import { runCounterfactualIntervention } from '../../src/engines/reality-view/counterfactualSimulator.ts'

const patientId = 'synthetic-patient'
const meshId = 'synthetic-atlas-heart'
const counterfactualId = '9155c40b-8b1d-44fd-84c5-ba76e6b8e6ce'
const cursor = '2026-11-21T09:00:00.000Z'
const recordedAt = '2026-11-19T12:00:00.000Z'

const organ = Object.freeze({
  meshId,
  canonicalOntologyId: 'FMA:7088',
  indonesianLabel: 'Jantung',
  englishLabel: 'Heart',
  systemId: 'cardiovascular',
  evidenceClass: 'observed_fhir',
  statusScore: 0.81,
  shaderUniforms: Object.freeze({ perfusionIntensity: 0.5, highlightHue: '#00ffff' }),
  provenance: Object.freeze([Object.freeze({
    id: 'synthetic-observation',
    fhirResourceType: 'Observation',
    sourceLabel: 'Synthetic FHIR Observation',
    recordedAt,
    verified: true,
  })]),
  activeChevrons: Object.freeze([]),
  hardSafetyLock: false,
})
const state = Object.freeze({
  patientId,
  mode: 'quiet',
  timeAxisCursorIso: cursor,
  isFutureProjection: false,
  activeSystems: Object.freeze([organ.systemId]),
  selectedMeshId: meshId,
  dualCodingTm1Enabled: false,
  quietModeHeadline: 'Review your measurements.',
  quietModePrimaryAction: Object.freeze({ label: 'Daily check-in', actionType: 'daily_checkin', urgent: false }),
  nodes: Object.freeze({ [meshId]: organ }),
})

function context(genericIngredient) {
  return {
    patientId,
    reviewedAt: cursor,
    complete: true,
    activeMedicationRequests: genericIngredient ? [{
      genericIngredient,
      dailyDoseMg: 100,
      provenance: {
        id: 'synthetic-order',
        fhirResourceType: 'MedicationRequest',
        sourceLabel: 'Synthetic reconciled FHIR medication list',
        recordedAt,
        verified: true,
      },
    }] : [],
    eGfrMlMin173m2: 90,
    childPughClass: 'A',
    pharmacogenomicMarkers: [],
    documentedAllergies: [],
  }
}

function proposed(candidateDrugGeneric, reviewed) {
  return {
    type: 'medication_change',
    operation: 'add',
    standardDailyDoseMg: 1,
    targetMeshId: meshId,
    counterfactualId,
    candidateDrugGeneric,
    context: reviewed,
  }
}

test('blocking a known interaction never mutates observed patient evidence', () => {
  const future = Object.freeze({
    ...state, timeAxisCursorIso: '2027-01-01T00:00:00.000Z', isFutureProjection: true,
  })
  const baseline = structuredClone(future)
  const result = runCounterfactualIntervention(future, proposed('clopidogrel', context('omeprazole')))
  assert.equal(result.status, 'blocked')
  assert.equal(result.hardSafetyLock, true)
  assert.equal(result.ddiSafetyVerified, false)
  assert.equal(result.medicationScreen, 'flagged')
  assert.match(result.ddiWarnings.join(' '), /CYP2C19_INHIBITION_DDI/)
  assert.doesNotMatch(result.ddiWarnings.join(' '), /switch|dose|pantoprazole/i)
  assert.equal(result.activeChevrons.length, 1)
  const [chevron] = result.activeChevrons
  assert.equal(chevron.direction, 'critical')
  assert.equal(chevron.counterfactualId, counterfactualId)
  assert.equal(chevron.targetMeshId, meshId)
  assert.equal(chevron.evidenceClass, 'simulated_projection')
  assert.equal(chevron.confidenceInterval, null)
  assert.equal(chevron.horizonDays, null)
  assert.deepEqual(future, baseline)
  assert.equal(future.nodes[meshId].provenance, organ.provenance)
  assert.equal(future.nodes[meshId].statusScore, 0.81)
})

test('a proposed interaction perpetrator also triggers the directional rule', () => {
  const result = runCounterfactualIntervention(state, proposed('omeprazole', context('clopidogrel')))
  assert.equal(result.hardSafetyLock, true)
  assert.match(result.ddiWarnings.join(' '), /CYP2C19_INHIBITION_DDI/)
})

test('PGx and documented allergy rules both create a safety hold', () => {
  const pgx = {
    ...context(),
    pharmacogenomicMarkers: ['HLA-B*15:02_POSITIVE'],
    documentedAllergies: [' Carbamazepine '],
  }
  const result = runCounterfactualIntervention(state, proposed('carbamazepine', pgx))
  assert.equal(result.hardSafetyLock, true)
  assert.match(result.ddiWarnings.join(' '), /CPIC_LEVEL_A_CONTRAINDICATION/)
  assert.match(result.ddiWarnings.join(' '), /DOCUMENTED_DRUG_ALLERGY_CONTRAINDICATION/)
  assert.equal(result.clinicallyReviewed, false)
})

test('a rule screen without flags yields neither clearance nor an invented projection', () => {
  const result = runCounterfactualIntervention(state, proposed('warfarin', context()))
  assert.equal(result.medicationScreen, 'no_flags_in_covered_rules')
  assert.equal(result.status, 'unavailable')
  assert.equal(result.ddiSafetyVerified, false)
  assert.deepEqual(result.activeChevrons, [])
})

test('incomplete, mismatched, retrospective and unsupported inputs fail closed', () => {
  const mismatched = runCounterfactualIntervention(state, proposed('warfarin', { ...context(), patientId: 'different-patient' }))
  assert.equal(mismatched.reason, 'incomplete_context')
  const retrospective = runCounterfactualIntervention({ ...state, timeAxisCursorIso: recordedAt }, proposed('warfarin', context()))
  assert.equal(retrospective.reason, 'incomplete_context')
  const unverified = context('amiodarone')
  unverified.activeMedicationRequests[0].provenance.verified = false
  assert.equal(runCounterfactualIntervention(state, proposed('warfarin', unverified)).reason, 'incomplete_context')
  const unknownDrug = runCounterfactualIntervention(state, proposed('unsupported-drug', context()))
  assert.equal(unknownDrug.reason, 'unsupported_medication')
  assert.equal(unknownDrug.ddiSafetyVerified, false)
})

test('medication changes address the exact existing order', () => {
  const target = { targetMeshId: meshId, counterfactualId }
  const baseRequest = {
    ...target,
    type: 'medication_change',
    candidateDrugGeneric: 'warfarin',
    context: context('warfarin'),
  }
  const wrong = runCounterfactualIntervention(state, { ...baseRequest, operation: 'stop', medicationRequestId: 'other-order' })
  assert.equal(wrong.reason, 'invalid_request')
  const result = runCounterfactualIntervention(state, { ...baseRequest, operation: 'stop', medicationRequestId: 'synthetic-order' })
  assert.equal(result.status, 'unavailable')
  assert.equal(result.ddiSafetyVerified, false)
})

test('lifestyle interventions stay unavailable until adequate models exist', () => {
  for (const type of ['sleep_hrv_recovery', 'sodium_diet_shift']) {
    const result = runCounterfactualIntervention(state, { type, targetMeshId: meshId, counterfactualId })
    assert.equal(result.evidenceClass, 'simulated_projection')
    assert.equal(result.reason, 'projection_unavailable')
    assert.deepEqual(result.activeChevrons, [])
    assert.equal(result.medicationScreen, 'not_run')
  }
})
