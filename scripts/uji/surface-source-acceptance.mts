import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SURFACE_RENDER_FORMULA, auditSurfaceSourceAcceptance } from '../../src/lib/anatomy/surfaceSourceAcceptance.ts'

assert.equal(
  SURFACE_RENDER_FORMULA,
  'SurfaceRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ BodyParts3DSourceOnly',
)
const audit = auditSurfaceSourceAcceptance()
assert.ok(audit.reachable, 'kulit: Specialty module not reachable')
assert.ok(audit.structures > 0, 'kulit: no exact shipped structures')
assert.ok(audit.triangles > 0, 'kulit: no positive indexed triangles')
assert.ok(audit.exactSource, `kulit: expected bodyparts3d only, got ${audit.sources.join(', ')}`)
assert.equal(audit.blockers.length, 0, `kulit: ${audit.blockers.join(', ')}`)
assert.ok(audit.renderEligible, 'kulit: source-backed render gate failed')

const root = process.cwd()
const body = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')
assert.match(body, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /<AtlasViewer3D/)
assert.match(specialty, /modul: \['imunologi', 'kulit'\]/)
assert.match(specialty, /overflow-x-auto/)
assert.match(specialty, /BodyParts3D 4\.0 .*CC BY 4\.0/)
assert.match(specialty, /kulit: 'Skin is a single surface mesh/)

console.log('surface source acceptance:', {
  module: audit.module,
  structures: audit.structures,
  triangles: audit.triangles,
  sources: audit.sources,
})
