import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  SPECIALTY_MSK_RENDER_FORMULA,
  SPECIALTY_MSK_TARGETS,
  auditSpecialtyMskBreadth,
  mskRenderEligible,
} from '../../src/lib/anatomy/specialtyMskSourceAudit.ts'

const audits = auditSpecialtyMskBreadth()
assert.equal(audits.length, SPECIALTY_MSK_TARGETS.length)
assert.equal(
  SPECIALTY_MSK_RENDER_FORMULA,
  'MSKRenderEligible = ReachableModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ SourceIdentityPresent',
)
for (const audit of audits) {
  assert.ok(audit.reachable, `${audit.module}: generated atlas module missing`)
  assert.ok(audit.sourceBacked, `${audit.module}: source-backed geometry gate failed: ${audit.blockers.join(', ')}`)
  assert.ok(mskRenderEligible(audit), `${audit.module}: MSKRenderEligible=false`)
  assert.ok(audit.structures > 0)
  assert.ok(audit.triangles > 0)
  assert.ok(audit.sources.length > 0)
  assert.ok(audit.kinds.length > 0)
  assert.equal(audit.blockers.length, 0)
}

const root = process.cwd()
const bodyExplorer = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')
assert.match(bodyExplorer, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /Musculoskeletal.*ortopedi.*lutut/s)
assert.match(specialty, /<AtlasViewer3D/)
assert.match(specialty, /Cruciate and collateral ligaments, meniscus/)
assert.match(specialty, /BodyParts3D 4\.0 .*CC BY 4\.0/)

console.log('specialty MSK source audit:', audits.map(({ module, structures, triangles, sources, kinds }) => ({
  module, structures, triangles, sources, kinds,
})))
