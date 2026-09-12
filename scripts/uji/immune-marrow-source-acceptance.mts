import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  IMMUNE_MARROW_RENDER_FORMULA,
  auditImmuneMarrowSourceAcceptance,
} from '../../src/lib/anatomy/immuneMarrowSourceAcceptance.ts'

assert.equal(
  IMMUNE_MARROW_RENDER_FORMULA,
  'ImmuneMarrowRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ BodyParts3DSourceOnly ∧ NoSeparateMarrowMesh',
)

const audit = auditImmuneMarrowSourceAcceptance()
assert.ok(audit.reachable, 'imunologi: generated specialty module missing')
assert.ok(audit.sourceBacked, `imunologi: source gate failed: ${audit.blockers.join(', ')}`)
assert.ok(audit.structures > 0, 'imunologi: no exact shipped structures')
assert.ok(audit.triangles > 0, 'imunologi: no positive indexed triangles')
assert.deepEqual(audit.sources, ['bodyparts3d'])
assert.ok(audit.exactSource, 'imunologi: expected BodyParts3D only')
assert.deepEqual(
  audit.explicitMarrowStructures,
  [],
  `imunologi: separate marrow-like mesh unexpectedly present: ${audit.explicitMarrowStructures.join(', ')}`,
)
assert.equal(audit.separateMarrowMeshPresent, false)
assert.equal(audit.blockers.length, 0, `imunologi: ${audit.blockers.join(', ')}`)
assert.ok(audit.renderEligible, 'imunologi: source-backed render gate failed')

const root = process.cwd()
const body = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')
assert.match(body, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /Systemic.*imunologi.*kulit/s)
assert.match(specialty, /<AtlasViewer3D/)
assert.ok(specialty.includes('berkas={`atlas/${modul}.glb`}'), 'SpecialtyLab must render the selected module GLB')
assert.match(specialty, /overflow-x-auto/)
assert.match(specialty, /imunologi: 'Bone marrow is shown at its major adult sites .* marrow itself has no separate mesh\.'/s)
assert.match(specialty, /BodyParts3D 4\.0 .*CC BY 4\.0/)

console.log('immune marrow source acceptance:', {
  module: audit.module,
  structures: audit.structures,
  triangles: audit.triangles,
  sources: audit.sources,
  explicitMarrowStructures: audit.explicitMarrowStructures,
  separateMarrowMeshPresent: audit.separateMarrowMeshPresent,
})
