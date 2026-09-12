import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIGESTIVE_RENDER_FORMULA, auditDigestiveSourceAcceptance } from '../../src/lib/anatomy/digestiveSourceAcceptance.ts'

assert.equal(
  DIGESTIVE_RENDER_FORMULA,
  'DigestiveRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ ExpectedSourceIdentity',
)

const audits = auditDigestiveSourceAcceptance()
assert.equal(audits.length, 2)
for (const audit of audits) {
  assert.ok(audit.reachable, `${audit.module}: Specialty module not reachable`)
  assert.ok(audit.structures > 0, `${audit.module}: no exact shipped structures`)
  assert.ok(audit.triangles > 0, `${audit.module}: no positive indexed triangles`)
  assert.ok(audit.exactSource, `${audit.module}: expected source ${audit.expectedSource}, got ${audit.sources.join(', ')}`)
  assert.equal(audit.blockers.length, 0, `${audit.module}: ${audit.blockers.join(', ')}`)
  assert.ok(audit.renderEligible, `${audit.module}: source-backed render gate failed`)
}

const root = process.cwd()
const body = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')
assert.match(body, /lazy\(\(\) => import\('\.\/bodyhub\/SpecialtyLab'\)\)/)
assert.match(body, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /<AtlasViewer3D/)
assert.match(specialty, /modul: \['gastro', 'bilier', 'nefrologi'\]/)
assert.match(specialty, /overflow-x-auto/)
assert.match(specialty, /BodyParts3D 4\.0 .*CC BY 4\.0/)
assert.match(specialty, /HuBMAP Human Reference Atlas, female reference body \(CC BY 4\.0\)/)

console.log('digestive source acceptance:', audits.map(({ module, structures, triangles, sources }) => ({ module, structures, triangles, sources })))
