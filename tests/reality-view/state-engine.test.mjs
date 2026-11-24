import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildRealityViewState, relationsForCanonicalOntologyId,
} from '../../src/engines/reality-view/realityViewStateEngine.ts'
import { appendPurposeConsentDecision, createPurposeConsentLedger } from '../../src/lib/purposeConsentLedger.ts'
import { isRealityViewState } from '../../src/types/realityView.ts'

const patientId = 'synthetic-subject'
const nowIso = '2026-11-23T12:00:00Z'
const earlier = '2026-11-22T08:00:00Z'
const later = '2026-11-23T08:00:00Z'
const yesterday = '2026-11-22T12:00:00Z'
const tomorrow = '2026-11-24T12:00:00Z'

function reading({
  id, metric = 'heart-rate', unit = 'bpm', value = 70, recordedAt = earlier,
  subjectId = patientId, sourceKind = 'clinical-system', evidenceClass = 'observed_fhir',
  domain = 'vital', verified = true, accepted = true, reviewedAt = recordedAt,
  receivedAt = recordedAt, revokedAt, statusScore, hardSafetyReason, icd11Tm1Code,
}) {
  return {
    event: {
      id, subjectId, domain, metric, value, unit, recordedAt, confidence: 1,
      semanticState: 'measured',
      provenance: { sourceKind, sourceId: 'test-source', capturedAt: recordedAt, receivedAt },
      consent: {
        granted: true, purposes: ['personal-visualization'], grantedAt: earlier, revokedAt,
      },
      review: accepted
        ? { state: 'accepted', reviewerId: 'synthetic-reviewer', reviewedAt }
        : { state: 'pending' },
    },
    provenance: { id, fhirResourceType: 'Observation', sourceLabel: 'Synthetic fixture', recordedAt, verified, icd11Tm1Code },
    evidenceClass, statusScore, hardSafetyReason,
  }
}

function state(readings, timeAxisCursorIso = nowIso, options = {}) {
  return buildRealityViewState({ patientId, readings, nowIso, timeAxisCursorIso, consentLedger: createPurposeConsentLedger(), ...options })
}

test('past replay uses only observations and reviews known then; future keeps the observed snapshot', () => {
  const records = [
    reading({ id: 'old', value: 62, statusScore: 0.81 }),
    reading({ id: 'new', value: 70, recordedAt: later, statusScore: 0.9 }),
    reading({ id: 'later-review', value: 85, reviewedAt: later }),
    reading({ id: 'not-yet-recorded', value: 97, recordedAt: tomorrow }),
  ]
  const before = structuredClone(records)
  const past = state(records, yesterday)
  assert.equal(past.nodes['Left ventricle'].shaderUniforms.pulseBpm, 62)
  assert.deepEqual(past.nodes['Left ventricle'].provenance.map(({ id }) => id), ['old'])

  const present = state(records)
  const future = state(records, tomorrow)
  assert.equal(future.isFutureProjection, true)
  assert.deepEqual(future.nodes, present.nodes)
  assert.equal(future.nodes['Left ventricle'].statusScore, 0.9)
  assert.equal(future.nodes['Left ventricle'].shaderUniforms.pulseBpm, 70)
  assert.deepEqual(records, before)
})

test('atlas binding is exact, and normalized conduction is marked as an educational simulation', () => {
  const one = state([reading({ id: 'one' })], nowIso, { selectedMeshId: 'Left ventricle' })
  const two = state([reading({ id: 'two' })], nowIso, { selectedMeshId: 'left ventricle' })
  assert.equal(one.selectedMeshId, 'Left ventricle')
  assert.equal(two.selectedMeshId, null)
  assert.equal(isRealityViewState(one), true)
  const node = one.nodes['Left ventricle']
  const waveform = node.shaderUniforms.conductionState
  assert.equal(node.canonicalOntologyId, 'FMA:7101')
  assert.equal(node.evidenceClass, 'observed_fhir')
  assert.equal(node.conductionEvidenceClass, 'simulated_projection')
  assert.equal(node.conductionModel, 'aliev_panfilov')
  assert.ok(waveform instanceof Float32Array)
  assert.equal(waveform.length, 64)
  assert.ok(waveform.every(value => Number.isFinite(value) && value >= 0 && value <= 1))
  assert.notEqual(Math.max(...waveform), Math.min(...waveform))
  waveform[0] = 99
  assert.ok(two.nodes['Left ventricle'].shaderUniforms.conductionState[0] <= 1)
  assert.ok(relationsForCanonicalOntologyId('FMA:7101').some(link =>
    link.relation === 'PART_OF' && link.targetOntologyId === 'FMA:7088'))
  for (const wrong of ['FMA:710', 'fma:7101', 'LEFT_VENTRICLE', 'unknown', '']) {
    assert.deepEqual(relationsForCanonicalOntologyId(wrong), [])
  }
})

test('TM1 disclosure, merged provenance and partial coverage preserve the mesh identity', () => {
  const measurements = [
    reading({ id: 'fhir', icd11Tm1Code: 'TEST-TM1' }),
    reading({ id: 'sensor', sourceKind: 'wearable', evidenceClass: 'wearable_stream',
      metric: 'hrv', unit: 'ms', value: 43 }),
    reading({ id: 'ocr', sourceKind: 'import', evidenceClass: 'ocr_verified',
      domain: 'lab', metric: 'lab.sgpt', unit: 'U/L', value: 33 }),
  ]
  const hidden = state(measurements)
  const shown = state(measurements, nowIso, { dualCodingTm1Enabled: true })
  const left = hidden.nodes['Left ventricle']
  const right = shown.nodes['Left ventricle']
  assert.equal(left.provenance[0].icd11Tm1Code, undefined)
  assert.equal(right.provenance[0].icd11Tm1Code, 'TEST-TM1')
  assert.equal(right.meshId, left.meshId)
  assert.equal(right.canonicalOntologyId, left.canonicalOntologyId)
  assert.equal(right.statusScore, null)
  assert.deepEqual(right.readings.map(r => [r.evidenceClass, r.unit]), [
    ['observed_fhir', 'bpm'], ['wearable_stream', 'ms'],
  ])
  assert.equal(shown.nodes.Liver.evidenceClass, 'ocr_verified')
  assert.equal(isRealityViewState(shown), true)
})

test('refuses cross-patient rows, withdrawn consent, pending OCR, mismatched units, and conflicting IDs', () => {
  const wrongPatient = reading({ id: 'foreign', subjectId: 'another' })
  const withdrawn = reading({ id: 'withdrawn', revokedAt: later })
  const ocr = reading({ id: 'pending', sourceKind: 'import', evidenceClass: 'ocr_verified',
    domain: 'lab', metric: 'lab.sgpt', unit: 'U/L', accepted: false })
  const wrongUnit = reading({ id: 'units', unit: '%' })
  const mismatch = reading({ id: 'mismatch' })
  mismatch.provenance.recordedAt = later
  const conflictingRows = [reading({ id: 'same', value: 75 }), reading({ id: 'same', value: 150 })]
  const output = state([wrongPatient, withdrawn, ocr, wrongUnit, mismatch, ...conflictingRows])
  assert.deepEqual(output.nodes, {})
  assert.deepEqual(output.activeSystems, [])
  const repeated = reading({ id: 'replayed' })
  assert.equal(state([repeated, structuredClone(repeated)]).nodes['Left ventricle'].readings.length, 1)
})

test('a reviewed clinical flag escalates through the summary and never uses the simulation profile', () => {
  const high = reading({
    id: 'verified-bp', metric: 'blood-pressure-systolic', unit: 'mmHg', value: 190,
    hardSafetyReason: 'Clinician flagged this blood pressure measurement.',
  })
  const output = state([high])
  assert.equal(output.nodes['Left ventricle'].hardSafetyLock, true)
  assert.equal(output.quietModePrimaryAction.urgent, true)
  assert.equal(state([{ ...high, provenance: { ...high.provenance, verified: false } }]).quietModePrimaryAction.urgent, false)
})

test('newer wearable readings do not hide a reviewed finding from another source', () => {
  const recorded = reading({
    id: 'reviewed-bp', metric: 'blood-pressure-systolic', unit: 'mmHg', value: 190,
    hardSafetyReason: 'Clinician flagged a recorded measurement.',
  })
  const wearable = reading({
    id: 'newer-watch', recordedAt: later, sourceKind: 'wearable', evidenceClass: 'wearable_stream',
    verified: false, accepted: false,
  })
  const output = state([recorded, wearable])
  assert.equal(output.nodes['Left ventricle'].provenance.length, 2)
  assert.equal(output.quietModePrimaryAction.urgent, true)
})

test('current consent and review denials block stale copies of the same record in every timeline', () => {
  const allowed = reading({ id: 'shared-record', value: 70, statusScore: 0.9 })
  const revoked = reading({ id: 'shared-record', value: 70, revokedAt: later })
  const rejected = structuredClone(allowed)
  rejected.event.review = { state: 'rejected', reviewerId: 'synthetic-reviewer', reviewedAt: later }

  for (const denial of [revoked, rejected]) {
    for (const cursor of [yesterday, nowIso, tomorrow]) {
      for (const input of [[allowed, denial], [denial, allowed]]) {
        assert.deepEqual(state(input, cursor).nodes, {})
      }
    }
  }
  assert.equal(state([allowed]).nodes['Left ventricle'].statusScore, 0.9)
})

test('unrelated, unreceived and scheduled denials do not remove an admitted record', () => {
  const allowed = reading({ id: 'shared-record', statusScore: 0.9 })
  const differentPatient = reading({ id: 'shared-record', subjectId: 'different-subject', revokedAt: later })
  const futureReceive = reading({ id: 'shared-record', receivedAt: tomorrow, revokedAt: later })
  const futureDecision = reading({ id: 'shared-record', revokedAt: tomorrow, statusScore: 0.9 })
  const output = state([allowed, differentPatient, futureReceive, futureDecision])
  assert.equal(output.nodes['Left ventricle'].statusScore, 0.9)
  assert.equal(output.nodes['Left ventricle'].readings.length, 1)
})

test('the canonical purpose ledger governs current access to historical observations', () => {
  const sample = reading({ id: 'old-reading' })
  const purpose = 'personal-visualization'
  const empty = createPurposeConsentLedger()
  const revoke = { id: 'revoke-now', subjectId: patientId, purpose, action: 'revoke', decidedAt: later }
  const foreign = appendPurposeConsentDecision(empty, { ...revoke, subjectId: 'different-subject' })
  assert.equal(state([sample], yesterday, { consentLedger: foreign }).nodes['Left ventricle'].readings.length, 1)

  const denied = appendPurposeConsentDecision(empty, revoke)
  for (const cursor of [yesterday, nowIso, tomorrow]) {
    assert.deepEqual(state([sample], cursor, { consentLedger: denied }).nodes, {})
  }
  const corrupted = { ...denied, decisionIdsByPurpose: {} }
  assert.deepEqual(state([sample], yesterday, { consentLedger: corrupted }).nodes, {})
  assert.deepEqual(state([sample], yesterday, { consentLedger: undefined }).nodes, {})
})
