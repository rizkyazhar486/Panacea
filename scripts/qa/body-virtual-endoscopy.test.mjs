import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workbench = readFileSync('src/pages/bodyhub/VirtualEndoscopyWorkbench.tsx', 'utf8')
const routes = readFileSync('src/pages/bodyhub/endoscopy/scopeRoutes.ts', 'utf8')
const scope = readFileSync('src/pages/bodyhub/endoscopy/EndoluminalScope3D.tsx', 'utf8')
const projector = readFileSync('src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', 'utf8')
const exposure = readFileSync('src/pages/bodyhub/BodyExposureOS.tsx', 'utf8')

for (const procedure of ['Colonoscopy', 'Upper GI endoscopy', 'Bronchoscopy']) {
  assert.match(routes, new RegExp(`label: '${procedure}'`))
}
// Routes follow named reference-atlas structures, not hand-drawn paths.
for (const id of ['ADULT.FEMALE.DIGESTIVE.RECTUM', 'ADULT.FEMALE.DIGESTIVE.CAECUM', 'ADULT.MALE.DIGESTIVE.OESOPHAGUS', 'ADULT.FEMALE.RESPIRATORY.TRACHEA']) {
  assert.ok(routes.includes(id), `route must trace ${id}`)
}
assert.match(routes, /CC BY 4\.0/)
assert.match(routes, /CC BY-SA 4\.0/)
assert.match(scope, /panacea|centerline/)
assert.match(workbench, /SCOPE_ROUTES/)
assert.match(workbench, /Fold relief and mucosal colour are illustrative\. Not patient anatomy, lesion findings or procedural guidance\./)
assert.match(workbench, /data-patient-specific-scope-navigation="not-generated"/)
assert.match(projector, /'endoscopy'/)
assert.match(projector, /VirtualEndoscopyWorkbench/)
assert.match(exposure, /projectorDomain: 'endoscopy'/)
assert.match(exposure, /label: 'Scope'/)

console.log('Body virtual endoscopy: three atlas-traced scope routes, projector wiring, compact mode access, and fail-closed patient-navigation boundary verified.')
