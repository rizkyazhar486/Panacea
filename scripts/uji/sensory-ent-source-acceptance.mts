import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  SENSORY_ENT_RENDER_FORMULA,
  auditSensoryEntSourceAcceptance,
  sensoryEntRenderEligible,
} from '../../src/lib/anatomy/sensoryEntSourceAcceptance.ts'

assert.equal(
  SENSORY_ENT_RENDER_FORMULA,
  'SensoryEntRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ SourceIdentityPresent',
)

const audits = auditSensoryEntSourceAcceptance()
assert.equal(audits.length, 2)
assert.deepEqual(audits.map((audit) => audit.module), ['tht', 'telinga'])

for (const audit of audits) {
  assert.equal(audit.reachable, true, `${audit.module}: module not shipped`)
  assert.ok(audit.structures > 0, `${audit.module}: no exact shipped structures`)
  assert.ok(audit.triangles > 0, `${audit.module}: no indexed triangles`)
  assert.ok(audit.sources.length > 0, `${audit.module}: source identity missing`)
  assert.equal(audit.blockers.length, 0, `${audit.module}: ${audit.blockers.join(', ')}`)
  assert.equal(sensoryEntRenderEligible(audit), true, `${audit.module}: render eligibility failed`)
}

const root = process.cwd()
const bodyExplorer = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')

assert.match(bodyExplorer, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /Neuro & senses.*mata.*tht.*telinga/s)
assert.match(specialty, /<AtlasViewer3D/)
assert.ok(
  specialty.includes('berkas={`atlas/${modul}.glb`}'),
  'SpecialtyLab must route the selected source GLB into AtlasViewer3D',
)
assert.match(specialty, /The nose, pharynx and larynx/i)
assert.match(specialty, /ossicles, tympanic membrane, cochlea, vestibule/i)
assert.match(specialty, /overflow-x-auto/)

console.log('sensory/ENT source acceptance:', audits)
