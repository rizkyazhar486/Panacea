import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MEDICAL_DEVICE_EVENT_ENVELOPE_POLICY,
  assessMedicalDeviceEventLiveness,
  computeWaveformSampleCompleteness,
  sortAndDedupeMedicalDeviceEvents,
  validateMedicalDeviceEvent,
} from '../../src/lib/medicalDeviceEventEnvelope.ts'

const base = (overrides = {}) => ({
  eventId: 'evt-1',
  visitId: 'visit-1',
  subjectId: 'subject-1',
  deviceId: 'device-1',
  profileId: 'bedside-multiparameter-monitor',
  transport: 'ihe-dev-dec',
  capturedAt: '2026-09-25T00:00:00.000Z',
  receivedAt: '2026-09-25T00:00:00.100Z',
  sequence: 1,
  truthClass: 'measured',
  ...overrides,
})

const waveform = (overrides = {}) => ({
  ...base(),
  kind: 'waveform',
  channelLabel: 'lead-II',
  unit: 'mV',
  sampleRateHz: 250,
  windowDurationMs: 1000,
  samples: Array.from({ length: 250 }, (_, i) => Math.sin(i)),
  signalQuality: 0.9,
  ...overrides,
})

const alarm = (overrides = {}) => ({
  ...base({ profileId: 'ventilator', transport: 'ieee-11073-sdc', sequence: 2 }),
  kind: 'alarm',
  alarmCode: 'HIGH-PEEP',
  label: 'High PEEP alarm',
  severity: 'medium',
  state: 'active',
  ...overrides,
})

const setting = (overrides = {}) => ({
  ...base({ profileId: 'ventilator', transport: 'ieee-11073-sdc', sequence: 3 }),
  kind: 'setting',
  settingName: 'PEEP',
  value: 5,
  unit: 'cmH2O',
  ...overrides,
})

const therapy = (overrides = {}) => ({
  ...base({ profileId: 'infusion-pump', transport: 'ihe-dev-ipec', sequence: 4 }),
  kind: 'therapy-delivery',
  therapyName: 'norepinephrine',
  amount: 0.05,
  unit: 'mcg/kg/min',
  ...overrides,
})

const imageRef = (overrides = {}) => ({
  ...base({ profileId: 'ivus-oct-intravascular-imaging', transport: 'dicomweb', sequence: 5 }),
  kind: 'image-reference',
  studyInstanceUid: '1.2.840.1',
  modality: 'IVUS',
  ...overrides,
})

const reportRef = (overrides = {}) => ({
  ...base({ profileId: 'central-laboratory-analyzer', transport: 'hl7-v2', sequence: 6 }),
  kind: 'report-reference',
  reportId: 'rpt-1',
  reportType: 'chemistry-panel',
  status: 'final',
  ...overrides,
})

const deviceStatus = (overrides = {}) => ({
  ...base({ sequence: 7 }),
  kind: 'device-status',
  statusCode: 'ONLINE',
  label: 'Monitor connected',
  connected: true,
  batteryPercent: 88,
  ...overrides,
})

test('every non-scalar kind validates cleanly with a compatible declared profile/transport', () => {
  for (const event of [waveform(), alarm(), setting(), therapy(), imageRef(), reportRef(), deviceStatus()]) {
    const result = validateMedicalDeviceEvent(event, Date.parse('2026-09-25T00:00:05.000Z'))
    assert.deepEqual(result.errors, [], `unexpected errors for kind ${event.kind}: ${result.errors.join(',')}`)
    assert.equal(result.valid, true)
  }
})

test('event fails closed when the profile does not declare the matching data shape', () => {
  const mismatched = waveform({ profileId: 'central-laboratory-analyzer', transport: 'hl7-v2' })
  const result = validateMedicalDeviceEvent(mismatched)
  assert.equal(result.valid, false)
  assert.ok(result.errors.includes('profileId:kind-mismatch'))
})

test('event fails closed when transport is not declared by the profile', () => {
  const undeclaredTransport = alarm({ transport: 'dicomweb' })
  const result = validateMedicalDeviceEvent(undeclaredTransport)
  assert.equal(result.valid, false)
  assert.ok(result.errors.includes('transport:undeclared-for-profile'))
})

test('event fails closed on unknown profile id and on receive-before-capture clock order', () => {
  const unknownProfile = alarm({ profileId: 'not-a-real-profile' })
  assert.ok(validateMedicalDeviceEvent(unknownProfile).errors.includes('profileId:unknown'))

  const badClock = alarm({ capturedAt: '2026-09-25T00:00:05.000Z', receivedAt: '2026-09-25T00:00:00.000Z' })
  assert.ok(validateMedicalDeviceEvent(badClock).errors.includes('clock-order'))
})

test('waveform sample completeness matches valid_samples / expected_samples * 100, capped at 100', () => {
  const full = waveform()
  assert.equal(computeWaveformSampleCompleteness(full), 100)

  const partial = waveform({ samples: Array.from({ length: 125 }, () => 0.1) })
  assert.equal(computeWaveformSampleCompleteness(partial), 50)

  const withGaps = waveform({ samples: [...Array.from({ length: 200 }, () => 0.1), NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN] })
  assert.equal(computeWaveformSampleCompleteness(withGaps), 80)

  const noWindow = waveform({ windowDurationMs: 0 })
  assert.equal(computeWaveformSampleCompleteness(noWindow), null)
})

test('waveform validation rejects empty sample batches and out-of-range signal quality', () => {
  const empty = waveform({ samples: [] })
  assert.ok(validateMedicalDeviceEvent(empty).errors.includes('samples:empty'))

  const badQuality = waveform({ signalQuality: 1.5 })
  assert.ok(validateMedicalDeviceEvent(badQuality).errors.includes('signalQuality:out-of-range'))
})

test('therapy-delivery and device-status reject negative amount / out-of-range battery', () => {
  assert.ok(validateMedicalDeviceEvent(therapy({ amount: -1 })).errors.includes('amount:negative'))
  assert.ok(validateMedicalDeviceEvent(deviceStatus({ batteryPercent: 150 })).errors.includes('batteryPercent:out-of-range'))
})

test('dedupe keeps the latest-received copy per (deviceId, kind, sequence) and drops invalid events', () => {
  const older = alarm({ eventId: 'a-old', state: 'active', receivedAt: '2026-09-25T00:00:00.100Z' })
  const newer = alarm({ eventId: 'a-new', state: 'acknowledged', receivedAt: '2026-09-25T00:00:00.900Z' })
  const invalid = alarm({ eventId: 'a-bad', sequence: 99, alarmCode: '' })

  const out = sortAndDedupeMedicalDeviceEvents([older, newer, invalid])
  assert.equal(out.length, 1)
  assert.equal(out[0].eventId, 'a-new')
  assert.equal(out[0].state, 'acknowledged')
})

test('dedupe orders remaining events by capturedAt then sequence', () => {
  const first = setting({
    eventId: 's1',
    sequence: 10,
    capturedAt: '2026-09-25T00:00:01.000Z',
    receivedAt: '2026-09-25T00:00:01.100Z',
  })
  const second = setting({
    eventId: 's2',
    sequence: 11,
    capturedAt: '2026-09-25T00:00:02.000Z',
    receivedAt: '2026-09-25T00:00:02.100Z',
  })
  const out = sortAndDedupeMedicalDeviceEvents([second, first])
  assert.deepEqual(out.map((event) => event.eventId), ['s1', 's2'])
})

test('liveness uses transport freshness thresholds, not clinical severity', () => {
  const now = Date.parse('2026-09-25T00:02:00.000Z')
  assert.equal(assessMedicalDeviceEventLiveness('2026-09-25T00:01:50.000Z', now), 'live')
  assert.equal(assessMedicalDeviceEventLiveness('2026-09-25T00:00:30.000Z', now), 'delayed')
  assert.equal(assessMedicalDeviceEventLiveness('2026-09-24T23:59:00.000Z', now), 'stale')
  assert.equal(assessMedicalDeviceEventLiveness('not-a-timestamp', now), 'stale')
})

test('policy documents the no-flatten-to-scalar-fhir and replay-protection boundary', () => {
  assert.equal(MEDICAL_DEVICE_EVENT_ENVELOPE_POLICY.waveformMustNotFlattenToScalarFhir, true)
  assert.equal(MEDICAL_DEVICE_EVENT_ENVELOPE_POLICY.imageAndReportRemainReferencesOnly, true)
  assert.equal(MEDICAL_DEVICE_EVENT_ENVELOPE_POLICY.replayProtectionRequired, true)
  assert.equal(MEDICAL_DEVICE_EVENT_ENVELOPE_POLICY.transportMustBeDeclaredByProfile, true)
})
