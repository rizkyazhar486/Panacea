import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const overlay = readFileSync(
  new URL('../../src/components/BodyExposurePatientOverlay.tsx', import.meta.url),
  'utf8',
)
const body = readFileSync(
  new URL('../../src/pages/BodyExposureOS.tsx', import.meta.url),
  'utf8',
)

assert.match(body, /BodyExposurePatientOverlay/, 'Body Exposure must mount the shared AI-EMR patient overlay')
assert.match(overlay, /projectEmrToBodyClinicalBridge/, 'overlay must reuse the canonical AI-EMR body bridge')
assert.match(overlay, /buildBodyClinicalFindings/, 'overlay must reuse the shared physical-exam routing')
assert.match(overlay, /state\.records\[activePatient\.id\]/, 'overlay must read the selected patient from the existing app store')
assert.match(overlay, /geometry remains reference-only/, 'reference anatomy boundary must remain visible')
assert.match(overlay, /do not morph atlas geometry into patient-specific anatomy/, 'patient-specific geometry claim must stay blocked')
assert.doesNotMatch(overlay, /localStorage|sessionStorage/, 'overlay must not create a second persisted patient-state authority')

console.log('Body Exposure AI-EMR patient-overlay integration contract verified.')
