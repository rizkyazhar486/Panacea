import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const clinical = readFileSync(new URL('../../src/pages/ClinicalHub.tsx', import.meta.url), 'utf8')

const patient = clinical.indexOf('<ClinicalPatientContext />')
const ask = clinical.indexOf('aria-label="Ask and record"')
const tools = clinical.indexOf('aria-label="Clinical quick tools"')
const depth = clinical.indexOf('<SurfaceDepthNavigator')
const sharedLab = clinical.indexOf('<LabPasienUntukDokter />')
const validation = clinical.indexOf('<StudiValidasiKlinis')
const body = clinical.indexOf('<PersonalBodyUnifiedSurface')

for (const [name, index] of Object.entries({ patient, ask, tools, depth, sharedLab, validation, body })) {
  assert.ok(index >= 0, `Clinical first-viewport contract lost ${name}`)
}

// At 390x844 the landing must remain decision-first. Patient identity/context is
// useful before acting, but navigation depth and clinician-only work queues are
// secondary to Ask/primary actions and the two inline quick tools.
assert.ok(patient < ask, 'Patient context must precede Clinical actions')
assert.ok(ask < tools, 'Ask and primary clinical actions must precede quick tools')
assert.ok(tools < depth, 'Surface depth navigation returned above the decision-first Clinical tools')
assert.ok(tools < sharedLab, 'Clinician shared-lab queue returned above the decision-first Clinical tools')
assert.ok(tools < validation, 'Clinical-validation work queue returned above the decision-first Clinical tools')
assert.ok(depth < body && sharedLab < body && validation < body,
  'Secondary Clinical workspaces must remain reachable before the large Body surface')

console.log('clinical-first-viewport-contract: patient context → actions → quick tools precede depth navigation and clinician work queues.')
