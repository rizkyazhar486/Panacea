import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  SPECIALTY_ORGAN_RENDER_FORMULA,
  SPECIALTY_ORGAN_TARGETS,
  auditSpecialtyOrganBreadth,
  auditSpecialtyOrganModule,
  renderEligible,
} from '../../src/lib/anatomy/specialtyOrganBreadthAudit.ts'

const audits = auditSpecialtyOrganBreadth()
assert.equal(audits.length, SPECIALTY_ORGAN_TARGETS.length)
assert.equal(
  SPECIALTY_ORGAN_RENDER_FORMULA,
  'RenderEligible = ReachableModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ SourceIdentityPresent',
)

const systems = new Set(audits.map((audit) => audit.system))
for (const required of ['digestive', 'reproductive', 'lymphatic-immune', 'integumentary-surface'] as const) {
  assert.ok(systems.has(required), `missing canonical breadth system: ${required}`)
}

for (const audit of audits) {
  assert.ok(audit.reachable, `${audit.module}: module is not shipped/reachable in generated atlas metadata`)
  assert.ok(audit.sourceBacked, `${audit.module}: not source-backed: ${audit.blockers.join(', ')}`)
  assert.ok(renderEligible(audit), `${audit.module}: RenderEligible gate failed`)
  assert.ok(audit.structures > 0, `${audit.module}: zero exact structures`)
  assert.ok(audit.triangles > 0, `${audit.module}: zero indexed triangles`)
  assert.ok(audit.sources.length > 0, `${audit.module}: missing source identity`)
  assert.equal(audit.blockers.length, 0, `${audit.module}: blocker(s): ${audit.blockers.join(', ')}`)
}

// Reachability is not inferred from the catalogue alone. The production Body Explorer
// must mount SpecialtyLab, SpecialtyLab must expose the exact modules, and the same
// surface must use the real atlas WebGL viewer rather than prose-only cards.
const root = process.cwd()
const bodyExplorer = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')
assert.match(bodyExplorer, /lazy\(\(\) => import\('\.\/bodyhub\/SpecialtyLab'\)\)/)
assert.match(bodyExplorer, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /<AtlasViewer3D/)
assert.match(specialty, /BodyParts3D 4\.0 .*CC BY 4\.0/)
assert.match(specialty, /Z-Anatomy \(CC BY-SA 4\.0\)/)
assert.match(specialty, /HuBMAP Human Reference Atlas, female reference body \(CC BY 4\.0\)/)

for (const target of SPECIALTY_ORGAN_TARGETS) {
  assert.match(specialty, new RegExp(`['\"]${target.module}['\"]`), `${target.module}: not exposed by SpecialtyLab`)
}

// Fail-closed regression: an absent module must remain blocked rather than borrowing
// geometry from a neighbouring module.
const impossible = auditSpecialtyOrganModule({
  system: 'digestive',
  module: '__not_real__',
  label: 'Impossible source gap',
})
assert.equal(impossible.reachable, false)
assert.equal(impossible.sourceBacked, false)
assert.equal(renderEligible(impossible), false)
assert.ok(impossible.blockers.includes('MODULE_NOT_SHIPPED'))
assert.ok(impossible.blockers.includes('NO_EXACT_SHIPPED_STRUCTURES'))
assert.ok(impossible.blockers.includes('SOURCE_IDENTITY_MISSING'))

console.log('specialty organ breadth audit:', audits.map(({ system, module, structures, triangles, sources }) => ({
  system, module, structures, triangles, sources,
})))
