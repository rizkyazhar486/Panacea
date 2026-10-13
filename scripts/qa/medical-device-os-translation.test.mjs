import test from 'node:test'
import assert from 'node:assert/strict'
import { translateMedicalDeviceForOs } from '../../src/lib/medicalDeviceOsTranslation.ts'

const scope = {
  subjectId: 'patient-01',
  encounterId: 'visit-01',
  sourceAuthorized: true,
  consentVerified: true,
}
const event = {
  id: 'evt-01',
  subjectId: 'patient-01',
  encounterId: 'visit-01',
  kind: 'alarm',
  direction: 'inbound-read-only',
  source: {
    profileId: 'ventilator',
    deviceId: 'vent-01',
    adapterId: 'ihe-dev-adapter',
    adapterVersion: '1',
    interface: 'ihe-dev-dec',
  },
  provenance: {
    capturedAt: '2026-10-13T08:00:00.000Z',
    receivedAt: '2026-10-13T08:00:02.000Z',
    sequence: 1,
  },
  payload: {
    shape: 'alarm',
    code: 'HIGH_PRESSURE',
    severity: 'high',
    state: 'active',
  },
}
const archive = {
  id: 'scan-01',
  subjectId: 'patient-01',
  importedAt: '2026-10-13T08:00:00.000Z',
  sourceType: 'paper-ecg',
  recordedWhen: { precision: 'date', value: '1987-02-14' },
  sourceDocument: { uri: 'archive://patient-01/scan-01', checksumSha256: 'b'.repeat(64) },
  extraction: 'human-attested',
}

test('current validated non-scalar event receives read-only explanation with exact event and ingest times', () => {
  const result = translateMedicalDeviceForOs({ mode: 'device-event', generation: 'current', event }, scope)
  assert.equal(result.accepted, true)
  assert.equal(result.disposition, 'technical-event')
  assert.equal(result.explanation?.truthLane, 'device-reported')
  assert.deepEqual(result.explanation?.sourceRecordedWhen, {
    precision: 'instant',
    value: '2026-10-13T08:00:00.000Z',
  })
  assert.equal(result.explanation?.ingestedAt, '2026-10-13T08:00:02.000Z')
  assert.equal(result.explanation?.clinicalPublicationEligible, false)
  assert.equal(result.explanation?.autonomousDeviceControlEnabled, false)
  assert.ok(result.explanation?.summary.includes('not a patient diagnosis'))
})

test('historical date-only paper ECG is accepted strictly as an archival reference', () => {
  const result = translateMedicalDeviceForOs({
    mode: 'historical-archive', generation: 'historical', artifact: archive,
  }, scope)
  assert.equal(result.accepted, true)
  assert.equal(result.disposition, 'archival-reference')
  assert.equal(result.explanation?.truthLane, 'archival-reference')
  assert.deepEqual(result.explanation?.sourceRecordedWhen, { precision: 'date', value: '1987-02-14' })
  assert.equal(result.explanation?.nextAction, 'verify-original-and-clinician-review')
  assert.equal(result.explanation?.clinicalPublicationEligible, false)
})

test('unknown historical capture time is preserved unknown and never fabricated', () => {
  const result = translateMedicalDeviceForOs({
    mode: 'historical-archive', generation: 'historical',
    artifact: { ...archive, recordedWhen: { precision: 'unknown' } },
  }, scope)
  assert.equal(result.accepted, true)
  assert.deepEqual(result.explanation?.sourceRecordedWhen, { precision: 'unknown' })
})

test('untrusted or absent consent and source authorization fail closed without explaining patient data', () => {
  for (const badScope of [
    { ...scope, consentVerified: false },
    { ...scope, sourceAuthorized: false },
    { ...scope, subjectId: '' },
  ]) {
    const result = translateMedicalDeviceForOs({ mode: 'device-event', generation: 'current', event }, badScope)
    assert.equal(result.accepted, false)
    assert.equal(result.disposition, 'quarantined')
    assert.equal(result.explanation, null)
    assert.ok(result.errors.length > 0)
  }
})

test('wrong patient or encounter rejects current or legacy records', () => {
  for (const input of [
    { mode: 'device-event', generation: 'current', event: { ...event, subjectId: 'other' } },
    { mode: 'device-event', generation: 'current', event: { ...event, encounterId: 'other' } },
    { mode: 'historical-archive', generation: 'historical', artifact: { ...archive, subjectId: 'other' } },
  ]) {
    const result = translateMedicalDeviceForOs(input, scope)
    assert.equal(result.accepted, false)
    assert.equal(result.explanation, null)
    assert.ok(result.errors.some((message) => message.includes('subject') || message.includes('encounter')))
  }
})

test('invalid historic date, checksum, extra measured values and unknown extraction are rejected', () => {
  const bad = [
    { ...archive, recordedWhen: { precision: 'date', value: '1987-02-30' } },
    { ...archive, recordedWhen: { precision: 'instant', value: 'some time ago' } },
    { ...archive, recordedWhen: { precision: 'unknown', value: 'invented date' } },
    { ...archive, sourceDocument: { uri: 'archive://scan', checksumSha256: 'invalid' } },
    { ...archive, measurement: { value: 80, unit: 'bpm' } },
    { ...archive, measurement: { value: Number.NaN, unit: 'bpm' } },
    { ...archive, extraction: 'automatic-clinical-approved' },
  ]
  for (const artifact of bad) {
    const result = translateMedicalDeviceForOs({ mode: 'historical-archive', generation: 'historical', artifact }, scope)
    assert.equal(result.accepted, false)
    assert.equal(result.explanation, null)
    assert.ok(result.errors.length > 0)
  }
})

test('emerging device events are research-only and never deemed clinically publishable', () => {
  const result = translateMedicalDeviceForOs({
    mode: 'device-event', generation: 'emerging', event,
  }, scope)
  assert.equal(result.accepted, true)
  assert.equal(result.disposition, 'research-only')
  assert.equal(result.explanation?.truthLane, 'research-only')
  assert.equal(result.explanation?.clinicalPublicationEligible, false)
  assert.equal(result.explanation?.nextAction, 'research-review')
})

test('forbidden actuation and unsupported envelopes cannot become explanations', () => {
  for (const corrupt of [
    { ...event, direction: 'bidirectional-regulated' },
    { ...event, payload: { ...event.payload, actuationRequested: true } },
    { ...event, source: { ...event.source, profileId: 'unlisted-future-device' } },
  ]) {
    const result = translateMedicalDeviceForOs({
      mode: 'device-event', generation: 'current', event: corrupt,
    }, scope)
    assert.equal(result.accepted, false)
    assert.equal(result.explanation, null)
    assert.ok(result.errors.length > 0)
  }
})

test('invalid mode and archival generation cannot be silently reclassified', () => {
  const first = translateMedicalDeviceForOs({ mode: 'historical-archive', generation: 'current', artifact: archive }, scope)
  assert.equal(first.accepted, false)
  const second = translateMedicalDeviceForOs({ mode: 'unknown', generation: 'historical', artifact: archive }, scope)
  assert.equal(second.accepted, false)
})
