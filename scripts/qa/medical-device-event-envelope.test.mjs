import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeMedicalDeviceEvent,
  validateMedicalDeviceEvent,
} from '../../src/lib/medicalDeviceEventEnvelope.ts'

const base = {
  id: 'evt-001',
  subjectId: 'patient-001',
  encounterId: 'visit-001',
  kind: 'waveform',
  direction: 'inbound-read-only',
  source: {
    profileId: 'bedside-multiparameter-monitor',
    deviceId: 'monitor-17',
    adapterId: 'ihe-dec-adapter',
    adapterVersion: '1.0.0',
    interface: 'ihe-dev-dec',
  },
  provenance: {
    capturedAt: '2026-09-20T06:00:00.000Z',
    receivedAt: '2026-09-20T06:00:01.000Z',
    sequence: 42,
  },
  payload: {
    shape: 'waveform',
    channels: ['ECG-II'],
    sampleRateHz: 250,
    sampleCount: 2500,
    storage: {
      uri: 'waveform://visit-001/evt-001',
      checksumSha256: 'a'.repeat(64),
      contentType: 'application/vnd.panacea.waveform',
    },
  },
}

test('accepts a provenance-preserving external waveform reference', () => {
  const result = validateMedicalDeviceEvent(base)
  assert.equal(result.accepted, true)
  assert.deepEqual(result.errors, [])

  const normalized = normalizeMedicalDeviceEvent({
    ...base,
    id: ' evt-001 ',
    source: { ...base.source, deviceId: ' monitor-17 ' },
  })
  assert.equal(normalized.id, 'evt-001')
  assert.equal(normalized.source.deviceId, 'monitor-17')
})

test('rejects inline waveform arrays so high-frequency data is not flattened into the event envelope', () => {
  const result = validateMedicalDeviceEvent({
    ...base,
    payload: { ...base.payload, samples: [0.1, 0.2] },
  })
  assert.equal(result.accepted, false)
  assert.ok(result.errors.some((error) => error.includes('inline waveform samples')))
})

test('rejects unsupported profile-shape combinations and catalog-only vendor claims', () => {
  const unknown = validateMedicalDeviceEvent({
    ...base,
    source: { ...base.source, profileId: 'vendor-super-monitor' },
  })
  assert.equal(unknown.accepted, false)
  assert.ok(unknown.errors.some((error) => error.includes('catalog profile')))

  const mismatch = validateMedicalDeviceEvent({
    ...base,
    source: { ...base.source, profileId: 'central-laboratory-analyzer' },
  })
  assert.equal(mismatch.accepted, false)
  assert.ok(mismatch.errors.some((error) => error.includes('does not declare waveform')))
})

test('therapy-delivery events are observations only and can never request actuation', () => {
  const therapy = {
    ...base,
    id: 'evt-therapy-1',
    kind: 'therapy-delivery',
    source: { ...base.source, profileId: 'infusion-pump', interface: 'ihe-dev-ipec' },
    payload: {
      shape: 'therapy-delivery',
      therapyCode: 'local-device-code',
      status: 'delivered',
      amount: 12.5,
      unit: 'mL',
      actuationRequested: false,
    },
  }

  assert.equal(validateMedicalDeviceEvent(therapy).accepted, true)

  const actuation = validateMedicalDeviceEvent({
    ...therapy,
    direction: 'bidirectional-regulated',
    payload: { ...therapy.payload, actuationRequested: true },
  })
  assert.equal(actuation.accepted, false)
  assert.ok(actuation.errors.some((error) => error.includes('actuation')))
  assert.ok(actuation.errors.some((error) => error.includes('inbound-read-only')))
})

test('alarms, settings and image/report references require bounded kind-specific payloads', () => {
  const alarm = validateMedicalDeviceEvent({
    ...base,
    kind: 'alarm',
    source: { ...base.source, profileId: 'ventilator' },
    payload: { shape: 'alarm', code: 'HIGH_PRESSURE', severity: 'high', state: 'active' },
  })
  assert.equal(alarm.accepted, true)

  const emptySetting = validateMedicalDeviceEvent({
    ...base,
    kind: 'setting',
    source: { ...base.source, profileId: 'ventilator' },
    payload: { shape: 'setting', name: 'PEEP', value: '' },
  })
  assert.equal(emptySetting.accepted, false)

  const imageWithoutReference = validateMedicalDeviceEvent({
    ...base,
    kind: 'image-reference',
    source: { ...base.source, profileId: 'ct', interface: 'dicomweb' },
    payload: { shape: 'image-reference', studyInstanceUid: '1.2.3' },
  })
  assert.equal(imageWithoutReference.accepted, false)
  assert.ok(imageWithoutReference.errors.some((error) => error.includes('reference uri')))
})

test('invalid identity, timestamps and sequence values fail closed', () => {
  const result = validateMedicalDeviceEvent({
    ...base,
    subjectId: ' ',
    provenance: {
      capturedAt: '2026-09-20T06:01:00.000Z',
      receivedAt: '2026-09-20T06:00:00.000Z',
      sequence: -1,
    },
  })
  assert.equal(result.accepted, false)
  assert.ok(result.errors.some((error) => error.includes('subjectId')))
  assert.ok(result.errors.some((error) => error.includes('capturedAt')))
  assert.ok(result.errors.some((error) => error.includes('sequence')))
})
