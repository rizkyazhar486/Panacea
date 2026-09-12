import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FEMALE_REPRODUCTIVE_NAMES_NOT_SHIPPED_IN_OBSTETRI,
  OBSTETRIC_PELVIS_RENDER_FORMULA,
  auditObstetricPelvisSourceAcceptance,
} from '../../src/lib/anatomy/bodyObstetricPelvisSourceAcceptance.ts'
import { partsForModule } from '../../src/lib/systemAtlas.gen.ts'

assert.equal(
  OBSTETRIC_PELVIS_RENDER_FORMULA,
  'ObstetricPelvisEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ BodyParts3DSourceOnly ∧ MaleReferenceDisclosurePreserved',
)

const audit = auditObstetricPelvisSourceAcceptance()
assert.ok(audit.reachable, 'obstetri: Specialty module is not shipped/reachable')
assert.ok(audit.structures > 0, 'obstetri: no exact shipped structures')
assert.ok(audit.triangles > 0, 'obstetri: no positive indexed triangles')
assert.ok(audit.sourceOnly, `obstetri: expected BodyParts3D only, got ${audit.sources.join(', ')}`)
assert.deepEqual(audit.missingCanonical, [], `obstetri: missing canonical structures: ${audit.missingCanonical.join(', ')}`)
assert.deepEqual(audit.zeroGeometry, [], `obstetri: zero-triangle canonical structures: ${audit.zeroGeometry.join(', ')}`)
assert.deepEqual(
  audit.fabricatedFemaleReproductive,
  [],
  `obstetri: female reproductive geometry must not be substituted into male-reference pelvis: ${audit.fabricatedFemaleReproductive.join(', ')}`,
)
assert.equal(audit.referenceBody, 'BodyParts3D male-reference pelvic mechanics')
assert.equal(audit.femaleReproductiveGeometry, 'segregated-to-obgin-hra-female')
assert.equal(audit.blockers.length, 0, `obstetri: ${audit.blockers.join(', ')}`)
assert.ok(audit.renderEligible, 'obstetri: strict source-backed render gate failed')

const obstetriNames = new Set(partsForModule('obstetri').map((part) => part.name))
for (const name of FEMALE_REPRODUCTIVE_NAMES_NOT_SHIPPED_IN_OBSTETRI) {
  assert.ok(!obstetriNames.has(name), `obstetri must not claim female reproductive mesh: ${name}`)
}

const obgin = partsForModule('obgin')
assert.ok(obgin.length > 0, 'obgin: female-reference reproductive module must remain separately shipped')
assert.ok(obgin.every((part) => part.triangles > 0), 'obgin: female-reference module contains zero-triangle geometry')
assert.deepEqual([...new Set(obgin.map((part) => part.source))], ['hra-female'])

const root = process.cwd()
const body = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')
assert.match(body, /lazy\(\(\) => import\('\.\/bodyhub\/SpecialtyLab'\)\)/)
assert.match(body, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /<AtlasViewer3D/)
assert.match(specialty, /modul: \['obstetri', 'obgin', 'payudara'\]/)
assert.match(specialty, /This is the male reference pelvis — bone, pelvic floor and vessels/)
assert.match(specialty, /For the female organs themselves, open the Female pelvis module/)
assert.match(specialty, /overflow-x-auto/)
assert.match(specialty, /BodyParts3D 4\.0 .*CC BY 4\.0/)
assert.match(specialty, /HuBMAP Human Reference Atlas, female reference body \(CC BY 4\.0\)/)

console.log('obstetric pelvis source acceptance:', {
  module: audit.module,
  structures: audit.structures,
  triangles: audit.triangles,
  sources: audit.sources,
  referenceBody: audit.referenceBody,
})
