import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workbench = readFileSync('src/pages/bodyhub/VirtualEndoscopyWorkbench.tsx', 'utf8')
const projector = readFileSync('src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', 'utf8')
const exposure = readFileSync('src/pages/BodyExposureOS.tsx', 'utf8')

for (const procedure of ['Colonoscopy', 'Upper GI endoscopy', 'Bronchoscopy']) {
  assert.match(workbench, new RegExp(procedure.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}

assert.match(workbench, /Simulated reference view · not patient anatomy or procedural navigation/)
assert.match(workbench, /do not estimate patient geometry, lesion position, insertion distance, force, device settings, or a safe procedural trajectory/)
assert.match(workbench, /const clamp01/)
assert.match(workbench, /index \/ denominator/)
assert.match(projector, /'endoscopy'/)
assert.match(projector, /VirtualEndoscopyWorkbench/)
assert.match(exposure, /projectorDomain: 'endoscopy'/)
assert.match(exposure, /label: 'Scope'/)

console.log('Body virtual endoscopy: three educational scope routes, projector wiring, compact mode access, and fail-closed patient-navigation boundary verified.')
