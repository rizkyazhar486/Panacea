import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { focusBodyClinicalProjection, BODY_CLINICAL_SYSTEM_FOCUS_LIST } from '../../src/lib/bodyClinicalSystemContext.ts'
import { BODY_SYSTEM_SOURCE_WAVE } from '../../src/lib/bodySystemSourceWave.ts'
import type { BodyClinicalBridgeProjection } from '../../src/lib/bodyClinicalBridge.ts'

const twin = readFileSync(new URL('../../src/components/ClinicalBodyTwin.tsx', import.meta.url), 'utf8')
const context = readFileSync(new URL('../../src/components/ClinicalPatientContext.tsx', import.meta.url), 'utf8')
const emr = readFileSync(new URL('../../src/pages/EMR.tsx', import.meta.url), 'utf8')

assert.match(twin, /focusBodyClinicalProjection/, 'ClinicalBodyTwin must reuse the shared system-focus contract, not a second one')
assert.match(twin, /focusSystemId\s*=\s*null/, 'focus must be optional and default to the unfocused, patient-wide view')
assert.match(twin, /Vitals remain patient-wide/, 'system focus inside Clinical must not relabel generic vitals as organ-specific')
assert.match(context, /onFocusSystemChange=\{setFocusSystemId\}/, 'Clinical must let the operator drive the same system focus shown in Body Exposure')
assert.doesNotMatch(twin, /localStorage|sessionStorage/, 'focus state must not create a second persisted patient-state authority')
assert.doesNotMatch(emr, /focusSystemId|onFocusSystemChange/, 'AI-EMR longitudinal record view must keep showing the full unfocused patient context')

// Every Body Exposure system must resolve to a Clinical focus definition, so the
// selector in Clinical never silently drops a system Body Exposure exposes.
for (const system of BODY_SYSTEM_SOURCE_WAVE) {
  const listed = BODY_CLINICAL_SYSTEM_FOCUS_LIST.find((entry) => entry.id === system.id)
  assert.ok(listed, `Clinical system-focus list is missing Body Exposure system "${system.id}"`)
}

const projection = {
  patientId: 'patient-1',
  recordId: 'record-1',
  generatedAt: '2026-09-18T16:00:00.000Z',
  reviewState: 'record-signed',
  markers: [
    { key: 'jantung', label: 'Heart', x: 61, y: 34, status: 'abnormal', source: { kind: 'ai-emr', recordId: 'record-1', patientId: 'patient-1', updatedAt: '2026-09-18T16:00:00.000Z' }, reviewState: 'record-signed' },
    { key: 'paru', label: 'Lungs', x: 37, y: 32, status: 'normal', source: { kind: 'ai-emr', recordId: 'record-1', patientId: 'patient-1', updatedAt: '2026-09-18T16:00:00.000Z' }, reviewState: 'record-signed' },
    { key: 'kulit', label: 'Skin', x: 28, y: 58, status: 'unchecked', source: { kind: 'ai-emr', recordId: 'record-1', patientId: 'patient-1', updatedAt: '2026-09-18T16:00:00.000Z' }, reviewState: 'record-signed' },
  ],
  signals: [],
  findingCounts: { normal: 1, abnormal: 1, unchecked: 1 },
  boundary: {
    patientSpecificSignals: true,
    referenceAtlasGeometryPatientSpecific: false,
    diagnosticInferenceGenerated: false,
    autonomousClinicalActionAllowed: false,
  },
} satisfies BodyClinicalBridgeProjection

const respiratory = focusBodyClinicalProjection(projection, 'respiratory')
assert.deepEqual(respiratory.markers.map((marker) => marker.key), ['paru'])
assert.equal(respiratory.findingCounts.normal, 1)

console.log('Clinical body-twin system-focus contract verified.')
