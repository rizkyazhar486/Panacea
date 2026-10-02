import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeVisitAdapterMeasurement } from '../../src/lib/visitDeviceAdapters.ts'

const kinds = [
  ['ble-gatt', 'bluetooth-le'],
  ['usb-serial', 'usb'],
  ['local-network', 'local-network'],
  ['vendor-cloud', 'vendor-cloud'],
  ['fhir-r4', 'fhir'],
]

const base = {
  device: {
    id: 'device-1',
    label: 'Clinical pulse oximeter',
    deviceClass: 'pulse-oximeter',
    evidenceClass: 'clinical',
    manufacturer: 'Example MedTech',
    model: 'PX-1',
    firmwareVersion: '1.4.2',
    supports: ['heart-rate', 'spo2'],
  },
  sampleId: 'sample-1',
  visitId: 'visit-1',
  subjectId: 'patient-1',
  metric: 'heart-rate',
  value: 72,
  unit: 'bpm',
  capturedAt: '2026-09-19T08:00:00.000Z',
  receivedAt: '2026-09-19T08:00:01.000Z',
  signalQuality: 0.97,
  standardCode: { system: 'loinc', code: '8867-4' },
}

test('every transport kind normalizes to the canonical Visit OS transport without claiming vendor support', () => {
  for (const [adapterKind, transport] of kinds) {
    const normalized = normalizeVisitAdapterMeasurement({
      ...base,
      adapter: { adapterId: `adapter-${adapterKind}`, adapterKind, adapterVersion: '1.0.0' },
    })
    assert.equal(normalized.descriptor.transport, transport)
    assert.equal(normalized.observation.deviceId, 'device-1')
    assert.equal(normalized.observation.metric, 'heart-rate')
  }
})

test('manufacturer, model, firmware, source timestamps, code and signal quality survive normalization', () => {
  const normalized = normalizeVisitAdapterMeasurement({
    ...base,
    adapter: { adapterId: 'adapter-ble', adapterKind: 'ble-gatt', adapterVersion: '2.3.1' },
  })
  assert.equal(normalized.descriptor.manufacturer, 'Example MedTech')
  assert.equal(normalized.descriptor.model, 'PX-1')
  assert.equal(normalized.descriptor.firmwareVersion, '1.4.2')
  assert.equal(normalized.observation.capturedAt, base.capturedAt)
  assert.equal(normalized.observation.receivedAt, base.receivedAt)
  assert.deepEqual(normalized.observation.standardCode, { system: 'loinc', code: '8867-4' })
  assert.equal(normalized.observation.signalQuality, 0.97)
  assert.deepEqual(normalized.adapter, {
    adapterId: 'adapter-ble',
    adapterKind: 'ble-gatt',
    adapterVersion: '2.3.1',
  })
  assert.equal(Object.isFrozen(normalized.adapter), true)
})

test('metric must be declared by the device', () => {
  assert.throws(() => normalizeVisitAdapterMeasurement({
    ...base,
    adapter: { adapterId: 'adapter-ble', adapterKind: 'ble-gatt', adapterVersion: '1' },
    metric: 'temperature',
    unit: '°C',
  }), /does not declare support/)
})

test('canonical unit mismatch fails before a sample can enter Visit OS', () => {
  assert.throws(() => normalizeVisitAdapterMeasurement({
    ...base,
    adapter: { adapterId: 'adapter-usb', adapterKind: 'usb-serial', adapterVersion: '1' },
    unit: 'Hz',
  }), /unit mismatch/)
})

test('invalid value, signal quality and source time fail closed', () => {
  const adapter = { adapterId: 'adapter-fhir', adapterKind: 'fhir-r4', adapterVersion: '1' }
  assert.throws(() => normalizeVisitAdapterMeasurement({ ...base, adapter, value: Number.NaN }), /value must be finite/)
  assert.throws(() => normalizeVisitAdapterMeasurement({ ...base, adapter, signalQuality: 1.1 }), /signalQuality/)
  assert.throws(() => normalizeVisitAdapterMeasurement({
    ...base,
    adapter,
    capturedAt: '2026-09-19T08:01:00.000Z',
    receivedAt: '2026-09-19T08:00:00.000Z',
  }), /capturedAt must not be later/)
})

test('blank provenance identifiers and standard codes are rejected', () => {
  assert.throws(() => normalizeVisitAdapterMeasurement({
    ...base,
    adapter: { adapterId: ' ', adapterKind: 'vendor-cloud', adapterVersion: '1' },
  }), /adapter.adapterId/)
  assert.throws(() => normalizeVisitAdapterMeasurement({
    ...base,
    adapter: { adapterId: 'vendor', adapterKind: 'vendor-cloud', adapterVersion: '1' },
    standardCode: { system: 'vendor', code: ' ' },
  }), /standardCode.code/)
})
