import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { auditMaleReproductiveSourceAcceptance } from '../../src/lib/anatomy/maleReproductiveSourceAcceptance'
import { partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const audit = auditMaleReproductiveSourceAcceptance()
assert.equal(audit.reachable, true, `urogenital module must be shipped: ${audit.blockers.join(', ')}`)
assert.equal(audit.renderEligible, true, `male reproductive source gate must pass: ${audit.blockers.join(', ')}`)
assert.deepEqual(audit.blockers, [], 'male reproductive source acceptance must fail closed on blockers')
assert.deepEqual(audit.unresolvedConcepts, [], 'canonical reproductive concepts must all resolve exact source geometry')
assert.deepEqual(audit.urinarySubstitution, [], 'urinary structures must never substitute for reproductive anatomy')
assert.ok(audit.reproductiveStructures >= 8, 'reproductive module must expose canonical organ breadth')
assert.ok(audit.triangles > 0, 'reproductive source structures must carry indexed geometry')
assert.deepEqual(audit.sources, ['bodyparts3d'], 'reproductive geometry must retain BodyParts3D source identity')

const parts = partsForModule('urogenital').filter((part) => part.kind === 'repro')
assert.ok(parts.every((part) => part.triangles > 0), 'every reproductive structure presented to the viewer must have geometry')
for (const concept of audit.concepts) {
  assert.equal(concept.resolved, true, `${concept.label} must resolve source-backed geometry`)
  assert.ok(concept.exactNames.length > 0, `${concept.label} must retain exact source names`)
}

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'specialty atlas must remain reachable from Body Exposure')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'specialty atlas tab must remain user-reachable')
assert.match(specialty, /Urogenital.*\['urogenital', 'prostat'\]/, 'urogenital module must remain reachable from the specialty selector')
assert.match(specialty, /partsForModule\(modul\)/, 'viewer metadata must come from the generated source atlas')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'selected specialty module must load its shipped GLB')
assert.match(specialty, /<AtlasViewer3D/, 'reproductive anatomy must use the interactive source-backed WebGL viewer')
assert.match(specialty, /SUMBER\[asal\]/, 'viewer must expose source provenance beside the rendered module')
assert.match(viewer, /body3dPixelRatio/, 'shared specialty renderer must bound mobile pixel ratio')
assert.match(viewer, /IntersectionObserver/, 'shared specialty renderer must suspend offscreen rendering')
assert.match(viewer, /visibilitychange/, 'shared specialty renderer must suspend background rendering')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'picking must remain constrained to verified source metadata')

console.log(`Male reproductive source/3D gate: ${audit.reproductiveStructures} exact reproductive structures, ${audit.triangles.toLocaleString()} indexed triangles, ${audit.concepts.length} canonical concepts, no urinary substitution, reachable shipped GLB WebGL, and mobile renderer lifecycle are locked.`)
