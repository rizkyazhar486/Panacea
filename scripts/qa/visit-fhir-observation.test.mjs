import test from 'node:test'
import assert from 'node:assert/strict'
import { buildAcceptedVisitFhirObservation } from '../../src/lib/visitFhirObservation.ts'

const refs = {
  patientReference: 'Patient/ihs-patient-1',
  encounterReference: 'Encounter/ihs-encounter-1',
  practitionerReference: 'Practitioner/ihs-practitioner-1',
  deviceReference: 'Device/ihs-device-1',
}

const accepted = {
  id: 'visit:visit-1:sample-1',
  subjectId: 'patient-local-1',
  domain: 'vital',
  metric: 'heart-rate',
  value: 76,
  unit: 'bpm',
  recordedAt: '2026-09-19T08:00:00.000Z',
  confidence: 0.97,
  provenance: {
    sourceKind: 'device',
    sourceId: 'visit-os:device-1',
    capturedAt: '2026-09-19T08:00:00.000Z',
    receivedAt: '2026-09-19T08:00:01.000Z',
    method: 'visit-os;bluetooth-le;loinc:8867-4',
    version: '1.4.2',
  },
  consent: {
    granted: true,
    purposes: ['clinical-support'],
    grantedAt: '2026-09-19T07:50:00.000Z',
  },
  review: {
    state: 'accepted',
    reviewerId: 'doctor-1',
    reviewedAt: '2026-09-19T08:01:00.000Z',
  },
  tags: ['visit-os', 'clinician-reviewed'],
}

test('accepted heart-rate observation becomes final FHIR with patient, encounter, performer and device provenance', () => {
  const obs = buildAcceptedVisitFhirObservation(accepted, refs)
  assert.equal(obs.resourceType, 'Observation')
  assert.equal(obs.status, 'final')
  assert.equal(obs.code.coding[0].system, 'http://loinc.org')
  assert.equal(obs.code.coding[0].code, '8867-4')
  assert.equal(obs.valueQuantity.system, 'http://unitsofmeasure.org')
  assert.equal(obs.valueQuantity.code, '/min')
  assert.equal(obs.subject.reference, refs.patientReference)
  assert.equal(obs.encounter.reference, refs.encounterReference)
  assert.equal(obs.performer[0].reference, refs.practitionerReference)
  assert.equal(obs.device.reference, refs.deviceReference)
  assert.ok(obs.meta.tag.some((tag) => tag.code === 'accepted'))
})

test('verified Visit metrics use pinned LOINC and UCUM mappings', () => {
  const cases = [
    ['spo2', 98, '%', '59408-5', '%'],
    ['respiratory-rate', 16, '/min', '9279-1', '/min'],
    ['blood-pressure-systolic', 118, 'mmHg', '8480-6', 'mm[Hg]'],
    ['blood-pressure-diastolic', 74, 'mmHg', '8462-4', 'mm[Hg]'],
    ['temperature', 36.8, '°C', '8310-5', 'Cel'],
    ['weight', 70.2, 'kg', '29463-7', 'kg'],
  ]
  for (const [metric, value, unit, loinc, ucum] of cases) {
    const obs = buildAcceptedVisitFhirObservation({ ...accepted, id: `event-${metric}`, metric, value, unit }, refs)
    assert.equal(obs.code.coding[0].code, loinc)
    assert.equal(obs.valueQuantity.code, ucum)
  }
})

test('unreviewed or non-device events cannot be published as final Visit FHIR observations', () => {
  assert.throws(
    () => buildAcceptedVisitFhirObservation({ ...accepted, review: { state: 'pending' } }, refs),
    /clinician_accepted/,
  )
  assert.throws(
    () => buildAcceptedVisitFhirObservation({
      ...accepted,
      provenance: { ...accepted.provenance, sourceKind: 'manual' },
    }, refs),
    /device_provenance/,
  )
})

test('metrics without verified method/specimen mapping fail closed', () => {
  assert.throws(
    () => buildAcceptedVisitFhirObservation({ ...accepted, metric: 'glucose', unit: 'mg/dL' }, refs),
    /metric_not_verified:glucose/,
  )
  assert.throws(
    () => buildAcceptedVisitFhirObservation({ ...accepted, metric: 'peak-expiratory-flow', unit: 'L\/min' }, refs),
    /metric_not_verified:peak-expiratory-flow/,
  )
})

test('wrong internal unit cannot be relabeled into UCUM', () => {
  assert.throws(
    () => buildAcceptedVisitFhirObservation({ ...accepted, unit: 'Hz' }, refs),
    /unit_mismatch:heart-rate/,
  )
})

test('FHIR references are explicit and typed rather than inferred from local IDs', () => {
  assert.throws(
    () => buildAcceptedVisitFhirObservation(accepted, { ...refs, patientReference: 'patient-local-1' }),
    /Patient reference/,
  )
  assert.throws(
    () => buildAcceptedVisitFhirObservation(accepted, { ...refs, deviceReference: '' }),
    /Device reference/,
  )
})


test('FHIR publication fails closed when clinical-support consent is missing, denied, expired or revoked', () => {
  const evaluatedAt = '2026-09-19T08:02:00.000Z'
  const denied = { ...accepted, consent: { ...accepted.consent, granted: false } }
  const wrongPurpose = { ...accepted, consent: { ...accepted.consent, purposes: ['personal-visualization'] } }
  const expired = { ...accepted, consent: { ...accepted.consent, expiresAt: '2026-09-19T08:02:00.000Z' } }
  const revoked = { ...accepted, consent: { ...accepted.consent, revokedAt: '2026-09-19T08:01:30.000Z' } }

  for (const event of [denied, wrongPurpose, { ...accepted, consent: undefined }]) {
    assert.throws(
      () => buildAcceptedVisitFhirObservation(event, refs, evaluatedAt),
      /active_clinical_support_consent/,
    )
  }
  assert.throws(
    () => buildAcceptedVisitFhirObservation(expired, refs, evaluatedAt),
    /consent_expired/,
  )
  assert.throws(
    () => buildAcceptedVisitFhirObservation(revoked, refs, evaluatedAt),
    /consent_revoked/,
  )
})

test('FHIR publication accepts consent that is active for clinical support at evaluation time', () => {
  const event = {
    ...accepted,
    consent: {
      ...accepted.consent,
      expiresAt: '2026-09-19T09:00:00.000Z',
    },
  }
  const observation = buildAcceptedVisitFhirObservation(
    event,
    refs,
    '2026-09-19T08:02:00.000Z',
  )
  assert.equal(observation.status, 'final')
})

test('FHIR publication rejects malformed or not-yet-effective consent timestamps', () => {
  const malformed = {
    ...accepted,
    consent: { ...accepted.consent, grantedAt: 'not-a-timestamp' },
  }
  const futureGrant = {
    ...accepted,
    consent: { ...accepted.consent, grantedAt: '2026-09-19T08:03:00.000Z' },
  }
  assert.throws(
    () => buildAcceptedVisitFhirObservation(malformed, refs, '2026-09-19T08:02:00.000Z'),
    /valid ISO timestamp/,
  )
  assert.throws(
    () => buildAcceptedVisitFhirObservation(futureGrant, refs, '2026-09-19T08:02:00.000Z'),
    /consent_not_yet_effective/,
  )
})
