import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { IMMUNE_RENDER_FORMULA, auditImmuneSourceAcceptance } from '../../src/lib/anatomy/immuneSourceAcceptance.ts'

assert.equal(
  IMMUNE_RENDER_FORMULA,
  'ImmuneRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ BodyParts3DSourceOnly',
)
const audit = auditImmuneSourceAcceptance()
assert.ok(audit.reachable, 'imunologi: Specialty module not reachable')
assert.ok(audit.structures > 0, 'imunologi: no exact shipped structures')
assert.ok(audit.triangles > 0, 'imunologi: no positive indexed triangles')
assert.ok(audit.exactSource, `imunologi: expected bodyparts3d only, got ${audit.sources.join(', ')}`)
assert.equal(audit.blockers.length, 0, `imunologi: ${audit.blockers.join(', ')}`)
assert.ok(audit.renderEligible, 'imunologi: source-backed render gate failed')

const root = process.cwd()
const body = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')
assert.match(body, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /<AtlasViewer3D/)
assert.match(specialty, /modul: \['imunologi', 'kulit'\]/)
assert.match(specialty, /overflow-x-auto/)
assert.match(specialty, /BodyParts3D 4\.0 .*CC BY 4\.0/)
assert.match(specialty, /imunologi: 'Bone marrow is shown at its major adult sites/)

console.log('immune source acceptance:', {
  module: audit.module,
  structures: audit.structures,
  triangles: audit.triangles,
  sources: audit.sources,
})
