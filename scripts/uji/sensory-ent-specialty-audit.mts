import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  SENSORY_ENT_RENDER_FORMULA,
  SENSORY_ENT_TARGETS,
  auditSensoryEntBreadth,
  auditSensoryEntTarget,
  sensoryEntRenderEligible,
} from '../../src/lib/anatomy/sensoryEntSpecialtyAudit.ts'

const audits = auditSensoryEntBreadth()
assert.equal(audits.length, 3)
assert.equal(SENSORY_ENT_RENDER_FORMULA, 'SensoryRenderEligible = ReachableModule ∧ ExactNamedGeometry ∧ PositiveIndexedTriangles ∧ ExpectedSourceIdentity')
for (const audit of audits) {
  assert.ok(audit.reachable, `${audit.module}: generated specialty module is not reachable`)
  assert.ok(audit.sourceBacked, `${audit.module}: source gate failed: ${audit.blockers.join(', ')}; missing=${audit.missingExactNames.join(', ')}`)
  assert.ok(sensoryEntRenderEligible(audit), `${audit.module}: SensoryRenderEligible failed`)
  assert.ok(audit.structures > 0)
  assert.ok(audit.triangles > 0)
  assert.ok(audit.sources.includes(audit.expectedSource))
  assert.deepEqual(audit.missingExactNames, [])
  assert.equal(audit.resolvedExactNames.length, audit.requiredExactNames.length)
}

const byModule = new Map(audits.map((audit) => [audit.module, audit]))
assert.equal(byModule.get('telinga')?.expectedSource, 'z-anatomy')
assert.equal(byModule.get('mata')?.expectedSource, 'bodyparts3d')
assert.equal(byModule.get('tht')?.expectedSource, 'bodyparts3d')
assert.ok(byModule.get('mata')?.resolvedExactNames.includes('Optic part of left retina'))
assert.ok(byModule.get('mata')?.resolvedExactNames.includes('Optic part of right retina'))

const root = process.cwd()
const bodyExplorer = readFileSync(join(root, 'src/pages/BodyExplorer.tsx'), 'utf8')
const specialty = readFileSync(join(root, 'src/pages/bodyhub/SpecialtyLab.tsx'), 'utf8')
assert.match(bodyExplorer, /lazy\(\(\) => import\('\.\/bodyhub\/SpecialtyLab'\)\)/)
assert.match(bodyExplorer, /key: 'spesialisasi', label: 'Specialty labs'/)
assert.match(specialty, /<AtlasViewer3D/)
assert.match(specialty, /modul: \['neurologi', 'medula-spinalis', 'mata', 'tht', 'telinga'\]/)
assert.match(specialty, /Z-Anatomy \(CC BY-SA 4\.0\), derived from BodyParts3D/)
assert.match(specialty, /BodyParts3D 4\.0 \(Database Center for Life Science, CC BY 4\.0\)/)
assert.match(specialty, /three ossicles, tympanic membrane, cochlea, vestibule/i)
for (const target of SENSORY_ENT_TARGETS) assert.match(specialty, new RegExp(`['\"]${target.module}['\"]`))

const impossible = auditSensoryEntTarget({
  domain: 'middle-inner-ear', module: 'telinga', label: 'Synthetic absent ear structure', expectedSource: 'z-anatomy', requiredExactNames: ['__structure_not_shipped__'],
})
assert.equal(impossible.sourceBacked, false)
assert.equal(sensoryEntRenderEligible(impossible), false)
assert.ok(impossible.blockers.includes('REQUIRED_EXACT_STRUCTURE_MISSING'))
assert.deepEqual(impossible.resolvedExactNames, [])
assert.deepEqual(impossible.missingExactNames, ['__structure_not_shipped__'])

console.log('sensory/ENT specialty audit:', audits.map(({ module, structures, triangles, sources, resolvedExactNames }) => ({ module, structures, triangles, sources, requiredExactStructures: resolvedExactNames.length })))
