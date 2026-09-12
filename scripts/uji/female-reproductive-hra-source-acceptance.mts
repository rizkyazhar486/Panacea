import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FEMALE_REPRODUCTIVE_RENDER_FORMULA,
  auditFemaleReproductiveHraSourceAcceptance,
} from '../../src/lib/anatomy/femaleReproductiveHraSourceAcceptance.ts'

assert.equal(
  FEMALE_REPRODUCTIVE_RENDER_FORMULA,
  'FemaleReproductiveRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ HRAFemaleSourceOnly',
)

const audit = auditFemaleReproductiveHraSourceAcceptance()
assert.ok(audit.reachable, 'obgin: generated female reproductive specialty module missing')
assert.ok(audit.sourceBacked, `obgin: source gate failed: ${audit.blockers.join(', ')}`)
assert.ok(audit.structures > 0, 'obgin: no exact shipped structures')
assert.ok(audit.triangles > 0, 'obgin: no positive indexed triangles')
assert.deepEqual(audit.sources, ['hra-female'], `obgin: unexpected source identity: ${audit.sources.join(', ')}`)
assert.ok(audit.exactSource, 'obgin: female reproductive geometry must remain HRA-female only')
assert.equal(audit.blockers.length, 0, `obgin: ${audit.blockers.join(', ')}`)
assert.ok(audit.renderEligible, 'obgin: strict source-backed female reproductive render gate failed')

const root = process.cwd()
const body = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')
assert.match(body, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /Women's health.*obstetri.*obgin.*payudara/s)
assert.match(specialty, /obgin:[\s\S]*Uterus, ovaries, uterine/)
assert.match(specialty, /<AtlasViewer3D/)
assert.ok(specialty.includes('berkas={`atlas/${modul}.glb`}'), 'SpecialtyLab must render the selected module GLB')
assert.match(specialty, /overflow-x-auto/)
assert.match(specialty, /HuBMAP Human Reference Atlas, female reference body \(CC BY 4\.0\)/)
assert.match(specialty, /This is the male reference pelvis[\s\S]*For the female organs themselves, open the Female pelvis module/)

console.log('female reproductive HRA source acceptance:', {
  module: audit.module,
  structures: audit.structures,
  triangles: audit.triangles,
  sources: audit.sources,
})
