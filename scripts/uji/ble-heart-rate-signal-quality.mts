import assert from 'node:assert/strict'
import {
  heartRateSignalQuality,
  parseHeartRateMeasurement,
} from '../../src/lib/useLiveHeartRate.ts'
import {
  createVisitOperatingSession,
  ingestVisitDeviceObservation,
  registerMedicalDevice,
  setMedicalDeviceConnection,
  startVisit,
  type VisitDeviceObservation,
} from '../../src/lib/visitOperatingSystem.ts'

function measurement(flags: number, valueBytes: number[]): DataView {
  return new DataView(new Uint8Array([flags, ...valueBytes]).buffer)
}

// Bits 1-2 of the flags byte are the GATT-defined sensor-contact status.
// 00/01 both mean the strap does not report contact at all.
assert.deepEqual(parseHeartRateMeasurement(measurement(0x00, [72])), { bpm: 72, sensorContact: 'unsupported' })
assert.deepEqual(parseHeartRateMeasurement(measurement(0x02, [72])), { bpm: 72, sensorContact: 'unsupported' })
// 10 = the strap supports contact detection but is off the skin right now.
assert.deepEqual(parseHeartRateMeasurement(measurement(0x04, [65])), { bpm: 65, sensorContact: 'not-detected' })
// 11 = skin contact detected.
assert.deepEqual(parseHeartRateMeasurement(measurement(0x06, [72])), { bpm: 72, sensorContact: 'detected' })
// Bit 0 still selects the uint16 little-endian bpm width, unchanged by the contact bits.
assert.deepEqual(parseHeartRateMeasurement(measurement(0x07, [0x2c, 0x01])), { bpm: 300, sensorContact: 'detected' })

assert.equal(heartRateSignalQuality('detected'), 1)
assert.equal(heartRateSignalQuality('not-detected'), 0.2)
assert.equal(heartRateSignalQuality('unsupported'), null)

// End-to-end: the Visit OS must fail closed on an off-body reading rather than
// treating skin-contact noise as a promotable live vital, and must accept a
// skin-contact-confirmed reading with a real, non-fabricated signal quality.
let state = createVisitOperatingSession({
  visitId: 'visit-ble-001',
  subjectId: 'patient-001',
  clinicianId: 'doctor-001',
  createdAt: '2026-09-19T09:00:00.000Z',
  consent: {
    clinicalData: { granted: true, purposes: ['clinical-support'], grantedAt: '2026-09-19T09:00:00.000Z' },
    media: { camera: true, microphone: false, ambientAi: false, acknowledgedAt: '2026-09-19T09:00:00.000Z' },
  },
})
state = registerMedicalDevice(state, {
  id: 'ble-heart-rate',
  label: 'BLE Heart Rate Service',
  deviceClass: 'vital-signs-monitor',
  evidenceClass: 'consumer',
  transport: 'bluetooth-le',
  supports: ['heart-rate'],
}, '2026-09-19T09:00:01.000Z')
state = startVisit(state, '2026-09-19T09:00:02.000Z')
state = setMedicalDeviceConnection(state, 'ble-heart-rate', 'live', '2026-09-19T09:00:03.000Z')

const offBody = parseHeartRateMeasurement(measurement(0x04, [65]))
const offBodySample: VisitDeviceObservation = {
  id: 'ble-hr-off-body',
  visitId: state.visitId,
  subjectId: state.subjectId,
  deviceId: 'ble-heart-rate',
  metric: 'heart-rate',
  value: offBody.bpm,
  unit: 'bpm',
  capturedAt: '2026-09-19T09:00:05.000Z',
  receivedAt: '2026-09-19T09:00:05.000Z',
  signalQuality: heartRateSignalQuality(offBody.sensorContact),
}
const offBodyResult = ingestVisitDeviceObservation(state, offBodySample)
assert.equal(offBodyResult.accepted, false)
assert.equal(offBodyResult.reason, 'low-signal-quality')

const onSkin = parseHeartRateMeasurement(measurement(0x06, [72]))
const onSkinResult = ingestVisitDeviceObservation(state, {
  ...offBodySample,
  id: 'ble-hr-on-skin',
  value: onSkin.bpm,
  signalQuality: heartRateSignalQuality(onSkin.sensorContact),
})
assert.equal(onSkinResult.accepted, true)
assert.equal(onSkinResult.state.latestByMetric['heart-rate']?.signalQuality, 1)

console.log('BLE heart-rate signal quality: GATT sensor-contact bits (spec 0x2A37) parsed, off-body readings fail closed at the Visit OS ingest gate, and on-skin readings carry a real promotable signal quality.')
