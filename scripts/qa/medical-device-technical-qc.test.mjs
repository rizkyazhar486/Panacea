import test from 'node:test'
import assert from 'node:assert/strict'
import {
  analyzeMedicalDeviceEventQc,
  analyzeMedicalDeviceEventStreamQc,
} from '../../src/lib/medicalDeviceTechnicalQc.ts'

const NOW = Date.parse('2026-09-20T06:00:05.000Z')

const waveform = {
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
    manufacturer: 'Acme',
    model: 'M100',
  },
  provenance: {
    capturedAt: '2026-09-20T06:00:00.000Z',
    receivedAt: '2026-09-20T06:00:01.000Z',
    sequence: 1,
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

test('a clean, fresh event passes with zero findings', () => {
  const report = analyzeMedicalDeviceEventQc(waveform, NOW)
  assert.equal(report.disposition, 'pass')
  assert.deepEqual(report.findings, [])
  assert.equal(report.clockSkewMs, 1000)
  assert.equal(report.livenessAgeMs, 4000)
  assert.equal(report.livenessState, 'fresh')
})

test('an invalid envelope fails closed through the QC layer instead of being scored', () => {
  const report = analyzeMedicalDeviceEventQc({ ...waveform, subjectId: '' }, NOW)
  assert.equal(report.disposition, 'fail')
  assert.equal(report.clockSkewMs, null)
  assert.ok(report.findings.every((finding) => finding.check === 'envelope'))
})

test('clock skew (Δt = receivedAt - capturedAt) is flagged warning then critical', () => {
  const warn = analyzeMedicalDeviceEventQc({
    ...waveform,
    provenance: { ...waveform.provenance, receivedAt: '2026-09-20T06:00:45.000Z' },
  }, Date.parse('2026-09-20T06:00:46.000Z'))
  assert.equal(warn.disposition, 'flagged')
  assert.ok(warn.findings.some((f) => f.check === 'clock-skew' && f.severity === 'warning'))

  const critical = analyzeMedicalDeviceEventQc({
    ...waveform,
    provenance: { ...waveform.provenance, receivedAt: '2026-09-20T06:03:00.000Z' },
  }, Date.parse('2026-09-20T06:03:01.000Z'))
  assert.equal(critical.disposition, 'fail')
  assert.ok(critical.findings.some((f) => f.check === 'clock-skew' && f.severity === 'critical'))
})

test('liveness reuses the Visit OS fresh/delayed/stale transport boundary', () => {
  const stale = analyzeMedicalDeviceEventQc(waveform, Date.parse('2026-09-20T06:05:00.000Z'))
  assert.equal(stale.livenessState, 'stale')
  assert.ok(stale.findings.some((f) => f.check === 'liveness'))
})

test('setting units are checked for blank or malformed tokens', () => {
  const setting = {
    ...waveform,
    id: 'evt-setting-1',
    kind: 'setting',
    source: { ...waveform.source, profileId: 'ventilator' },
    payload: { shape: 'setting', name: 'PEEP', value: 8, unit: 'cmH2O' },
  }
  assert.equal(analyzeMedicalDeviceEventQc(setting, NOW).disposition, 'pass')

  const malformed = analyzeMedicalDeviceEventQc({
    ...setting,
    payload: { ...setting.payload, unit: 'cm$$H2O' },
  }, NOW)
  assert.ok(malformed.findings.some((f) => f.check === 'unit'))
})

test('waveform chunk duration outside the plausible bounded-chunk window is flagged', () => {
  const tooLong = analyzeMedicalDeviceEventQc({
    ...waveform,
    payload: { ...waveform.payload, sampleRateHz: 1, sampleCount: 4000 },
  }, NOW)
  assert.ok(tooLong.findings.some((f) => f.check === 'signal-quality'))
})

test('duplicate and out-of-order sequence numbers on the same stream are replay findings', () => {
  const second = {
    ...waveform,
    id: 'evt-002',
    provenance: { ...waveform.provenance, receivedAt: '2026-09-20T06:00:02.000Z', sequence: 1 },
  }
  const reports = analyzeMedicalDeviceEventStreamQc([waveform, second], NOW)
  assert.equal(reports[0].disposition, 'pass')
  assert.equal(reports[1].disposition, 'fail')
  assert.ok(reports[1].findings.some((f) => f.check === 'replay'))

  const outOfOrder = {
    ...waveform,
    id: 'evt-003',
    provenance: { ...waveform.provenance, receivedAt: '2026-09-20T06:00:03.000Z', sequence: 0 },
  }
  const reordered = analyzeMedicalDeviceEventStreamQc([waveform, outOfOrder], NOW)
  assert.ok(reordered[1].findings.some((f) => f.check === 'replay' && f.severity === 'critical'))
})

test('a sequence gap is a non-blocking info finding, not a failure', () => {
  const gapped = {
    ...waveform,
    id: 'evt-004',
    provenance: { ...waveform.provenance, receivedAt: '2026-09-20T06:00:02.000Z', sequence: 5 },
  }
  const reports = analyzeMedicalDeviceEventStreamQc([waveform, gapped], NOW)
  assert.equal(reports[1].disposition, 'flagged')
  assert.ok(reports[1].findings.some((f) => f.check === 'replay' && f.severity === 'info'))
})

test('catalog profile identity drift on the same device stream is a critical finding', () => {
  const drifted = {
    ...waveform,
    id: 'evt-005',
    source: { ...waveform.source, profileId: 'ventilator' },
    kind: 'setting',
    payload: { shape: 'setting', name: 'PEEP', value: 8, unit: 'cmH2O' },
    provenance: { ...waveform.provenance, receivedAt: '2026-09-20T06:00:02.000Z', sequence: 2 },
  }
  const reports = analyzeMedicalDeviceEventStreamQc([waveform, drifted], NOW)
  assert.ok(reports[1].findings.some((f) => f.check === 'identity' && f.severity === 'critical'))
})

test('manufacturer/model drift on the same device stream is a warning, not a failure', () => {
  const rebadged = {
    ...waveform,
    id: 'evt-006',
    source: { ...waveform.source, manufacturer: 'OtherCo' },
    provenance: { ...waveform.provenance, receivedAt: '2026-09-20T06:00:02.000Z', sequence: 2 },
  }
  const reports = analyzeMedicalDeviceEventStreamQc([waveform, rebadged], NOW)
  assert.equal(reports[1].disposition, 'flagged')
  assert.ok(reports[1].findings.some((f) => f.check === 'identity' && f.severity === 'warning'))
})

test('waveform sample completeness compares reported samples against the inter-chunk gap', () => {
  const gappy = {
    ...waveform,
    id: 'evt-007',
    provenance: { capturedAt: '2026-09-20T06:00:20.000Z', receivedAt: '2026-09-20T06:00:21.000Z', sequence: 2 },
  }
  const reports = analyzeMedicalDeviceEventStreamQc([waveform, gappy], NOW)
  assert.ok(reports[0].findings.some((f) => f.check === 'sample-completeness'))

  const contiguous = {
    ...waveform,
    id: 'evt-008',
    provenance: { capturedAt: '2026-09-20T06:00:10.000Z', receivedAt: '2026-09-20T06:00:11.000Z', sequence: 2 },
  }
  const clean = analyzeMedicalDeviceEventStreamQc([waveform, contiguous], NOW)
  assert.ok(clean[0].findings.every((f) => f.check !== 'sample-completeness'))
})
