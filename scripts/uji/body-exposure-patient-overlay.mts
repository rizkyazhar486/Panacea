import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { focusBodyClinicalProjection } from '../../src/lib/bodyClinicalSystemContext.ts'
import type { BodyClinicalBridgeProjection } from '../../src/lib/bodyClinicalBridge.ts'

const overlay = readFileSync(
  new URL('../../src/components/BodyExposurePatientOverlay.tsx', import.meta.url),
  'utf8',
)
const body = readFileSync(
  new URL('../../src/pages/BodyExposureOS.tsx', import.meta.url),
  'utf8',
)

assert.match(body, /BodyExposurePatientOverlay/, 'Body Exposure must mount the shared AI-EMR patient overlay')
assert.match(body, /selectedSystemId=\{selectedBodySystemId\}/, 'Body Exposure must pass the active system into the AI-EMR overlay')
assert.match(overlay, /projectEmrToBodyClinicalBridge/, 'overlay must reuse the canonical AI-EMR body bridge')
assert.match(overlay, /buildBodyClinicalFindings/, 'overlay must reuse the shared physical-exam routing')
assert.match(overlay, /focusBodyClinicalProjection/, 'overlay must focus recorded exam markers by selected body system')
assert.match(overlay, /Vitals remain patient-wide/, 'system focus must not relabel generic vitals as organ-specific measurements')
assert.match(overlay, /state\.records\[activePatient\.id\]/, 'overlay must read the selected patient from the existing app store')
assert.match(overlay, /geometry remains reference-only/, 'reference anatomy boundary must remain visible')
assert.match(overlay, /do not morph atlas geometry into patient-specific anatomy/, 'patient-specific geometry claim must stay blocked')
assert.doesNotMatch(overlay, /localStorage|sessionStorage/, 'overlay must not create a second persisted patient-state authority')


const projection = {
  patientId: 'patient-1',
  recordId: 'record-1',
  generatedAt: '2026-09-18T16:00:00.000Z',
  reviewState: 'record-signed',
  markers: [
    { key: 'jantung', label: 'Heart', x: 61, y: 34, status: 'abnormal', source: {"kind":"ai-emr","recordId":"record-1","patientId":"patient-1","updatedAt":"2026-09-18T16:00:00.000Z"}, reviewState: 'record-signed' },
    { key: 'paru', label: 'Lungs', x: 37, y: 32, status: 'normal', source: {"kind":"ai-emr","recordId":"record-1","patientId":"patient-1","updatedAt":"2026-09-18T16:00:00.000Z"}, reviewState: 'record-signed' },
    { key: 'leher', label: 'Neck', x: 50, y: 17, status: 'normal', source: {"kind":"ai-emr","recordId":"record-1","patientId":"patient-1","updatedAt":"2026-09-18T16:00:00.000Z"}, reviewState: 'record-signed' },
    { key: 'abdomen', label: 'Abdomen', x: 50, y: 47, status: 'unchecked', source: {"kind":"ai-emr","recordId":"record-1","patientId":"patient-1","updatedAt":"2026-09-18T16:00:00.000Z"}, reviewState: 'record-signed' },
    { key: 'ekstremitas', label: 'Extremities', x: 72, y: 82, status: 'unchecked', source: {"kind":"ai-emr","recordId":"record-1","patientId":"patient-1","updatedAt":"2026-09-18T16:00:00.000Z"}, reviewState: 'record-signed' },
  ],
  signals: [],
  findingCounts: { normal: 2, abnormal: 1, unchecked: 2 },
  boundary: {
    patientSpecificSignals: true,
    referenceAtlasGeometryPatientSpecific: false,
    diagnosticInferenceGenerated: false,
    autonomousClinicalActionAllowed: false,
  },
} satisfies BodyClinicalBridgeProjection

const cardiovascular = focusBodyClinicalProjection(projection, 'cardiovascular')
assert.equal(cardiovascular.label, 'Cardiovascular')
assert.deepEqual(cardiovascular.markers.map((marker) => marker.key), ['jantung', 'leher', 'ekstremitas'])
assert.deepEqual(cardiovascular.findingCounts, { normal: 1, abnormal: 1, unchecked: 1 })
assert.equal(cardiovascular.recordedFindings, 2)
assert.equal(cardiovascular.boundary.vitalsRemainPatientWide, true)
assert.equal(cardiovascular.boundary.diagnosticInferenceGenerated, false)

const respiratory = focusBodyClinicalProjection(projection, 'respiratory')
assert.deepEqual(respiratory.markers.map((marker) => marker.key), ['paru', 'leher'])
assert.deepEqual(respiratory.findingCounts, { normal: 2, abnormal: 0, unchecked: 0 })
assert.equal(respiratory.recordedFindings, 2)

console.log('Body Exposure AI-EMR patient-overlay integration contract verified.')
