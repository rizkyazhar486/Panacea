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
  assert.equal(result.constitutional.decision, 'ALLOW')
  assert.equal(result.constitutional.executionGate, 1)
  assert.equal(result.constitutional.counts.hardPassed, 4)

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
  assert.equal(result.constitutional.decision, 'BLOCK')
  assert.ok(result.constitutional.failedHardAxiomIds.includes('A20'))
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
  assert.equal(actuation.constitutional.decision, 'BLOCK')
  assert.equal(actuation.constitutional.executionGate, 0)
  assert.ok(actuation.constitutional.failedHardAxiomIds.includes('A15'))
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

test('normalizes valid optional device metadata after validating string boundaries', () => {
  const alarm = normalizeMedicalDeviceEvent({
    ...base,
    kind: 'alarm',
    source: {
      ...base.source,
      profileId: 'ventilator',
      manufacturer: ' Acme Medical ',
      model: ' Vent-9 ',
      firmware: ' 4.2.1 ',
    },
    payload: {
      shape: 'alarm',
      code: ' HIGH_PRESSURE ',
      severity: 'high',
      state: 'active',
      message: ' Airway pressure high ',
    },
  })

  assert.equal(alarm.source.manufacturer, 'Acme Medical')
  assert.equal(alarm.source.model, 'Vent-9')
  assert.equal(alarm.source.firmware, '4.2.1')
  assert.equal(alarm.payload.message, 'Airway pressure high')

  const image = normalizeMedicalDeviceEvent({
    ...base,
    kind: 'image-reference',
    source: { ...base.source, profileId: 'ct', interface: 'dicomweb' },
    payload: {
      shape: 'image-reference',
      uri: ' dicomweb://study/1 ',
      studyInstanceUid: ' 1.2.3 ',
      seriesInstanceUid: ' 1.2.3.4 ',
      sopInstanceUid: ' 1.2.3.4.5 ',
      contentType: ' application/dicom ',
    },
  })

  assert.equal(image.payload.studyInstanceUid, '1.2.3')
  assert.equal(image.payload.seriesInstanceUid, '1.2.3.4')
  assert.equal(image.payload.sopInstanceUid, '1.2.3.4.5')
  assert.equal(image.payload.contentType, 'application/dicom')
})

test('rejects malformed optional metadata before normalization can throw a raw TypeError', () => {
  const cases = [
    {
      field: 'source.manufacturer',
      event: { ...base, source: { ...base.source, manufacturer: 42 } },
    },
    {
      field: 'alarm message',
      event: {
        ...base,
        kind: 'alarm',
        source: { ...base.source, profileId: 'ventilator' },
        payload: { shape: 'alarm', code: 'HIGH_PRESSURE', severity: 'high', state: 'active', message: 123 },
      },
    },
    {
      field: 'setting unit',
      event: {
        ...base,
        kind: 'setting',
        source: { ...base.source, profileId: 'ventilator' },
        payload: { shape: 'setting', name: 'PEEP', value: 5, unit: {} },
      },
    },
    {
      field: 'image reference contentType',
      event: {
        ...base,
        kind: 'image-reference',
        source: { ...base.source, profileId: 'ct', interface: 'dicomweb' },
        payload: { shape: 'image-reference', uri: 'dicomweb://study/1', contentType: 7 },
      },
    },
    {
      field: 'report contentType',
      event: {
        ...base,
        kind: 'report-reference',
        source: { ...base.source, profileId: 'central-laboratory-analyzer' },
        payload: { shape: 'report-reference', uri: 'report://1', reportType: 'lab', contentType: [] },
      },
    },
  ]

  for (const { field, event } of cases) {
    const result = validateMedicalDeviceEvent(event)
    assert.equal(result.accepted, false, field)
    assert.equal(result.disposition, 'quarantined', field)
    assert.ok(result.errors.some((error) => error.includes(field)), field)
  }

  assert.throws(
    () => normalizeMedicalDeviceEvent(cases[1].event),
    /alarm message must be a non-blank string when supplied/,
  )
})

test('rejects malformed optional DICOM identifiers instead of accepting untyped metadata', () => {
  for (const [field, value] of [
    ['studyInstanceUid', 123],
    ['seriesInstanceUid', {}],
    ['sopInstanceUid', '   '],
  ]) {
    const result = validateMedicalDeviceEvent({
      ...base,
      kind: 'image-reference',
      source: { ...base.source, profileId: 'ct', interface: 'dicomweb' },
      payload: {
        shape: 'image-reference',
        uri: 'dicomweb://study/1',
        [field]: value,
      },
    })

    assert.equal(result.accepted, false, field)
    assert.ok(result.errors.some((error) => error.includes(field)), field)
  }
})

test('rejects undeclared fields so bounded envelopes cannot hide inline raw data', () => {
  const cases = [
    {
      label: 'event',
      expected: 'event contains unsupported field: debugBlob',
      event: { ...base, debugBlob: [1, 2, 3] },
    },
    {
      label: 'source',
      expected: 'source contains unsupported field: vendorSecret',
      event: { ...base, source: { ...base.source, vendorSecret: 'opaque' } },
    },
    {
      label: 'provenance',
      expected: 'provenance contains unsupported field: rawClock',
      event: { ...base, provenance: { ...base.provenance, rawClock: { ticks: [1, 2] } } },
    },
    {
      label: 'waveform payload',
      expected: 'waveform payload contains unsupported field: rawSamples',
      event: { ...base, payload: { ...base.payload, rawSamples: [0.1, 0.2, 0.3] } },
    },
    {
      label: 'waveform storage',
      expected: 'waveform storage contains unsupported field: inlineBytes',
      event: {
        ...base,
        payload: {
          ...base.payload,
          storage: { ...base.payload.storage, inlineBytes: [1, 2, 3] },
        },
      },
    },
    {
      label: 'alarm payload',
      expected: 'alarm payload contains unsupported field: pixels',
      event: {
        ...base,
        kind: 'alarm',
        source: { ...base.source, profileId: 'ventilator' },
        payload: {
          shape: 'alarm',
          code: 'HIGH_PRESSURE',
          severity: 'high',
          state: 'active',
          pixels: [1, 2, 3],
        },
      },
    },
  ]

  for (const { label, expected, event } of cases) {
    const result = validateMedicalDeviceEvent(event)
    assert.equal(result.accepted, false, label)
    assert.equal(result.disposition, 'quarantined', label)
    assert.ok(result.errors.includes(expected), label)
  }
})

test('validation receipts are deterministic and derive time from event provenance', () => {
  const first = validateMedicalDeviceEvent(base)
  const second = validateMedicalDeviceEvent(base)

  assert.deepEqual(first.constitutional, second.constitutional)
  assert.equal(first.constitutional.evaluatedAt, base.provenance.receivedAt)
})

test('invalid explicit evaluation time fails closed without injecting wall-clock time', () => {
  const result = validateMedicalDeviceEvent(base, 'not-a-timestamp')

  assert.equal(result.accepted, false)
  assert.equal(result.disposition, 'quarantined')
  assert.ok(result.errors.some((error) => error.includes('evaluatedAt')))
  assert.equal(result.constitutional.evaluatedAt, '1970-01-01T00:00:00.000Z')
})

test('non-object events use a deterministic validation receipt timestamp', () => {
  const first = validateMedicalDeviceEvent(null)
  const second = validateMedicalDeviceEvent(null)

  assert.deepEqual(first.constitutional, second.constitutional)
  assert.equal(first.constitutional.evaluatedAt, '1970-01-01T00:00:00.000Z')
})

test('rejects parseable non-ISO timestamps so provenance is runtime-stable', () => {
  const result = validateMedicalDeviceEvent({
    ...base,
    provenance: {
      ...base.provenance,
      capturedAt: 'September 20, 2026 06:00:00 UTC',
    },
  })
  assert.equal(result.accepted, false)
  assert.ok(result.errors.some((error) => error.includes('capturedAt')))
})

test('rejects impossible ISO calendar dates instead of Date.parse normalization', () => {
  const result = validateMedicalDeviceEvent({
    ...base,
    provenance: {
      ...base.provenance,
      capturedAt: '2026-02-30T06:00:00.000Z',
    },
  })
  assert.equal(result.accepted, false)
  assert.ok(result.errors.some((error) => error.includes('capturedAt')))
})

test('rejects out-of-range ISO clock components instead of rolling into the next day', () => {
  const result = validateMedicalDeviceEvent({
    ...base,
    provenance: {
      ...base.provenance,
      capturedAt: '2026-09-20T24:00:00.000Z',
      receivedAt: '2026-09-21T01:00:00.000Z',
    },
  })
  assert.equal(result.accepted, false)
  assert.ok(result.errors.some((error) => error.includes('capturedAt')))
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


test('accepts the ISO maximum offset and quarantines offsets beyond fourteen hours', () => {
  const boundary = validateMedicalDeviceEvent({
    ...base,
    provenance: {
      ...base.provenance,
      capturedAt: '2026-09-20T20:00:00.000+14:00',
      receivedAt: '2026-09-20T20:00:01.000+14:00',
    },
  })
  assert.equal(boundary.accepted, true)

  for (const capturedAt of [
    '2026-09-20T20:00:00.000+14:01',
    '2026-09-20T20:00:00.000-14:01',
    '2026-09-20T20:00:00.000+23:59',
  ]) {
    const result = validateMedicalDeviceEvent({
      ...base,
      provenance: {
        ...base.provenance,
        capturedAt,
        receivedAt: '2026-09-21T20:00:01.000Z',
      },
    })
    assert.equal(result.accepted, false, capturedAt)
    assert.equal(result.disposition, 'quarantined', capturedAt)
    assert.ok(result.errors.some((error) => error.includes('capturedAt')), capturedAt)
  }
})
