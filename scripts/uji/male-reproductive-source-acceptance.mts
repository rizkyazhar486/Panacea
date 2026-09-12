import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  MALE_REPRODUCTIVE_CONCEPTS,
  MALE_REPRODUCTIVE_RENDER_FORMULA,
  auditMaleReproductiveSourceAcceptance,
} from '../../src/lib/anatomy/maleReproductiveSourceAcceptance.ts'

assert.equal(
  MALE_REPRODUCTIVE_RENDER_FORMULA,
  'MaleReproductiveRenderEligible = ReachableWebGLModule ∧ ExactSourceNamedReproductiveStructures ∧ PositiveIndexedTriangles ∧ BodyParts3DSourceOnly ∧ NoUrinarySubstitution',
)

const audit = auditMaleReproductiveSourceAcceptance()
assert.ok(audit.reachable, 'urogenital: Specialty WebGL module is not shipped/reachable')
assert.ok(audit.reproductiveStructures > 0, 'urogenital: no source-classified reproductive structures')
assert.ok(audit.triangles > 0, 'urogenital: reproductive structures have no positive indexed triangles')
assert.deepEqual(audit.sources, ['bodyparts3d'], `urogenital: unexpected reproductive source identity: ${audit.sources.join(', ')}`)
assert.ok(audit.sourceOnly, 'urogenital: reproductive geometry must remain BodyParts3D-only')
assert.equal(audit.concepts.length, MALE_REPRODUCTIVE_CONCEPTS.length)
assert.deepEqual(audit.unresolvedConcepts, [], `urogenital: unresolved male reproductive concepts: ${audit.unresolvedConcepts.join(', ')}`)
assert.deepEqual(audit.urinarySubstitution, [], `urogenital: urinary geometry substituted for reproductive anatomy: ${audit.urinarySubstitution.join(', ')}`)
assert.equal(audit.blockers.length, 0, `urogenital: ${audit.blockers.join(', ')}`)
assert.ok(audit.renderEligible, 'urogenital: strict source-backed male reproductive render gate failed')

for (const concept of audit.concepts) {
  assert.ok(concept.resolved, `${concept.id}: canonical source structures are not fully resolved`)
  assert.ok(concept.exactNames.length > 0, `${concept.id}: no exact source names resolved`)
}

const byId = new Map(audit.concepts.map((concept) => [concept.id, concept]))
for (const paired of ['testes', 'epididymides', 'seminal-vesicles', 'deferent-ducts']) {
  assert.ok((byId.get(paired)?.exactNames.length ?? 0) >= 2, `${paired}: bilateral source geometry is incomplete`)
  assert.equal(new Set(byId.get(paired)?.exactNames ?? []).size, byId.get(paired)?.exactNames.length)
}

const root = process.cwd()
const body = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')
assert.match(body, /lazy\(\(\) => import\('\.\/bodyhub\/SpecialtyLab'\)\)/)
assert.match(body, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /label: 'Urogenital', modul: \['urogenital', 'prostat'\]/)
assert.match(specialty, /<AtlasViewer3D/)
assert.ok(specialty.includes('berkas={`atlas/${modul}.glb`}'), 'SpecialtyLab must render the selected module GLB')
assert.match(specialty, /overflow-x-auto/)
assert.match(specialty, /BodyParts3D 4\.0 \(Database Center for Life Science, CC BY 4\.0\)/)
assert.match(specialty, /educational material/i)

console.log('male reproductive source acceptance:', {
  module: audit.module,
  reproductiveStructures: audit.reproductiveStructures,
  urinaryStructuresInSameModule: audit.urinaryStructuresInSameModule,
  triangles: audit.triangles,
  sources: audit.sources,
  concepts: audit.concepts.map(({ id, exactNames }) => ({ id, exactNames })),
})
