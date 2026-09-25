import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MEDICAL_DEVICE_EVENT_ENVELOPE_BOUNDARY,
  createMedicalDeviceReplayLedger,
  medicalDeviceEventFreshness,
  runMedicalDeviceEventQc,
} from '../../src/lib/medicalDeviceEventEnvelope.ts'

function waveformEnvelope(overrides = {}) {
  return {
    id: 'evt-1',
    streamId: 'ecg-lead-ii-001',
    sequence: 1,
    deviceProfileId: 'ecg-telemetry',
    deviceId: 'device-001',
    shape: 'waveform',
    truthClass: 'measured',
    capturedAt: '2026-09-25T10:00:00.000Z',
    receivedAt: '2026-09-25T10:00:00.500Z',
    signalQuality: 0.92,
    deviceClockOffsetMs: 120,
    payload: {
      kind: 'waveform',
      channel: 'lead-ii',
      unit: 'mV',
      sampleRateHz: 250,
      sampleCount: 250,
      durationMs: 1000,
      storageRef: 'waveform-store://ecg-lead-ii-001/0001',
    },
    ...overrides,
  }
}

test('a well-formed waveform envelope passes every technical-QC analyzer', () => {
  const nowMs = Date.parse('2026-09-25T10:00:01.000Z')
  const result = runMedicalDeviceEventQc(waveformEnvelope(), { nowMs })
  assert.equal(result.ok, true)
  assert.equal(result.freshness, 'fresh')
  assert.ok(result.findings.length >= 6)
  assert.ok(result.findings.every((entry) => entry.ok))
})

test('identity check rejects an unknown device profile and a shape not declared by the profile', () => {
  const nowMs = Date.parse('2026-09-25T10:00:01.000Z')
  const unknownProfile = runMedicalDeviceEventQc(waveformEnvelope({ deviceProfileId: 'no-such-profile' }), { nowMs })
  assert.equal(unknownProfile.ok, false)
  assert.ok(unknownProfile.findings.some((f) => f.analyzer === 'transport-integrity' && !f.ok))

  const wrongShape = runMedicalDeviceEventQc(waveformEnvelope({ shape: 'therapy-delivery' }), { nowMs })
  assert.equal(wrongShape.ok, false)
})

test('timestamp order check fails when capturedAt is after receivedAt', () => {
  const nowMs = Date.parse('2026-09-25T10:00:01.000Z')
  const result = runMedicalDeviceEventQc(
    waveformEnvelope({ capturedAt: '2026-09-25T10:00:05.000Z', receivedAt: '2026-09-25T10:00:00.500Z' }),
    { nowMs },
  )
  assert.equal(result.ok, false)
  const timestampFinding = result.findings.find((f) => f.detail.includes('capturedAt must not be later'))
  assert.ok(timestampFinding && !timestampFinding.ok)
})

test('clock skew analyzer flags device offsets beyond the allowed bound and passes when undeclared', () => {
  const nowMs = Date.parse('2026-09-25T10:00:01.000Z')
  const skewed = runMedicalDeviceEventQc(waveformEnvelope({ deviceClockOffsetMs: 5000 }), { nowMs })
  assert.equal(skewed.ok, false)
  assert.ok(skewed.findings.some((f) => f.analyzer === 'clock-skew' && !f.ok))

  const undeclared = runMedicalDeviceEventQc(waveformEnvelope({ deviceClockOffsetMs: null }), { nowMs })
  assert.ok(undeclared.findings.find((f) => f.analyzer === 'clock-skew').ok)

  const withinCustomBound = runMedicalDeviceEventQc(waveformEnvelope({ deviceClockOffsetMs: 3000 }), {
    nowMs,
    maxAllowedClockSkewMs: 4000,
  })
  assert.ok(withinCustomBound.findings.find((f) => f.analyzer === 'clock-skew').ok)
})

test('signal quality analyzer requires a value within [0,1] when reported', () => {
  const nowMs = Date.parse('2026-09-25T10:00:01.000Z')
  const outOfRange = runMedicalDeviceEventQc(waveformEnvelope({ signalQuality: 1.4 }), { nowMs })
  assert.equal(outOfRange.ok, false)

  const notReported = runMedicalDeviceEventQc(waveformEnvelope({ signalQuality: null }), { nowMs })
  assert.ok(notReported.findings.find((f) => f.analyzer === 'signal-quality').ok)
})

test('sample-completeness analyzer catches dropped waveform samples beyond tolerance', () => {
  const nowMs = Date.parse('2026-09-25T10:00:01.000Z')
  const dropped = runMedicalDeviceEventQc(
    waveformEnvelope({
      payload: {
        kind: 'waveform',
        channel: 'lead-ii',
        unit: 'mV',
        sampleRateHz: 250,
        sampleCount: 200,
        durationMs: 1000,
        storageRef: 'waveform-store://ecg-lead-ii-001/0001',
      },
    }),
    { nowMs },
  )
  assert.equal(dropped.ok, false)
  assert.ok(dropped.findings.some((f) => f.detail.includes('deviates from expected')))
})

test('alarm, therapy-delivery and image/report reference payloads validate their required fields', () => {
  const nowMs = Date.parse('2026-09-25T10:00:01.000Z')

  const alarm = runMedicalDeviceEventQc(
    waveformEnvelope({
      shape: 'alarm',
      deviceProfileId: 'bedside-multiparameter-monitor',
      payload: { kind: 'alarm', code: 'SPO2-LOW', severity: 'warning', message: 'SpO2 below threshold', active: true },
    }),
    { nowMs },
  )
  assert.equal(alarm.ok, true)

  const therapyMissingUnit = runMedicalDeviceEventQc(
    waveformEnvelope({
      shape: 'therapy-delivery',
      deviceProfileId: 'infusion-pump',
      payload: { kind: 'therapy-delivery', therapyType: 'volumetric-infusion', rate: 50 },
    }),
    { nowMs },
  )
  assert.equal(therapyMissingUnit.ok, false)

  const imageRef = runMedicalDeviceEventQc(
    waveformEnvelope({
      shape: 'image-reference',
      deviceProfileId: 'ct',
      payload: { kind: 'image-reference', storageRef: 'dicomweb://study/1.2.3', mimeType: 'application/dicom' },
    }),
    { nowMs },
  )
  assert.equal(imageRef.ok, true)
})

test('liveness analyzer classifies fresh, delayed and stale receivedAt age without judging clinical severity', () => {
  const receivedAt = '2026-09-25T10:00:00.000Z'
  const fresh = medicalDeviceEventFreshness(receivedAt, Date.parse('2026-09-25T10:00:10.000Z'))
  const delayed = medicalDeviceEventFreshness(receivedAt, Date.parse('2026-09-25T10:01:00.000Z'))
  const stale = medicalDeviceEventFreshness(receivedAt, Date.parse('2026-09-25T10:05:00.000Z'))
  assert.equal(fresh.freshness, 'fresh')
  assert.equal(delayed.freshness, 'delayed')
  assert.equal(stale.freshness, 'stale')

  const staleResult = runMedicalDeviceEventQc(waveformEnvelope({ receivedAt }), {
    nowMs: Date.parse('2026-09-25T10:05:00.000Z'),
  })
  assert.equal(staleResult.ok, false)
  assert.ok(staleResult.findings.some((f) => f.analyzer === 'device-health' && !f.ok))
})

test('replay ledger rejects duplicate and out-of-order sequences on the same stream', () => {
  const ledger = createMedicalDeviceReplayLedger()
  const nowMs = Date.parse('2026-09-25T10:00:01.000Z')

  const first = runMedicalDeviceEventQc(waveformEnvelope({ sequence: 1 }), { nowMs, replayLedger: ledger })
  assert.equal(first.ok, true)

  const replayed = runMedicalDeviceEventQc(waveformEnvelope({ sequence: 1 }), { nowMs, replayLedger: ledger })
  assert.equal(replayed.ok, false)
  assert.ok(replayed.findings.some((f) => f.detail.includes('replay or reorder')))

  const outOfOrder = runMedicalDeviceEventQc(waveformEnvelope({ sequence: 0 }), { nowMs, replayLedger: ledger })
  assert.equal(outOfOrder.ok, false)

  const next = runMedicalDeviceEventQc(waveformEnvelope({ sequence: 2 }), { nowMs, replayLedger: ledger })
  assert.equal(next.ok, true)
})

test('the boundary statement keeps QC framed as technical, not clinical', () => {
  assert.match(MEDICAL_DEVICE_EVENT_ENVELOPE_BOUNDARY, /never a diagnosis/)
})
