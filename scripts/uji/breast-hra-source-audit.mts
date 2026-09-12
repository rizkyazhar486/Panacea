import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BREAST_HRA_RENDER_FORMULA,
  auditBreastHraSource,
  breastRenderEligible,
} from '../../src/lib/anatomy/breastHraSourceAudit.ts'

const audit = auditBreastHraSource()
assert.equal(BREAST_HRA_RENDER_FORMULA, 'BreastRenderEligible = ReachableModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ HRAFemaleSourceOnly')
assert.ok(audit.reachable, 'payudara: generated specialty module missing')
assert.ok(audit.sourceBacked, `payudara: source gate failed: ${audit.blockers.join(', ')}`)
assert.ok(breastRenderEligible(audit), 'payudara: BreastRenderEligible=false')
assert.ok(audit.structures > 0, 'payudara: no exact shipped structures')
assert.ok(audit.triangles > 0, 'payudara: no indexed triangles')
assert.deepEqual(audit.sources, ['hra-female'])
assert.ok(audit.kinds.length > 0)
assert.equal(audit.blockers.length, 0)

const root = process.cwd()
const bodyExplorer = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')
assert.match(bodyExplorer, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /Women's health.*obstetri.*obgin.*payudara/s)
assert.match(specialty, /<AtlasViewer3D/)
assert.match(specialty, /Nipple, areola, mammary lobes, lactiferous ducts/i)
assert.match(specialty, /HuBMAP Human Reference Atlas, female reference body \(CC BY 4\.0\)/)
assert.match(specialty, /['\"]payudara['\"]/)

console.log('breast HRA source audit:', audit)
