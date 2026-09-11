import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BODY_PROJECTION_TARGETS,
  PROCEDURE_PROJECTION_TARGETS,
  canPublishProcedure,
  canPublishProjection,
  type BodySystemId,
} from '../../src/lib/bodyProjectionContract.js'

const REQUIRED_SYSTEMS: BodySystemId[] = [
  'digestive', 'cardiovascular', 'pulmonary', 'brain-neuro', 'eye', 'ear', 'ent', 'endocrine',
  'female-reproductive', 'male-reproductive', 'urinary', 'integumentary', 'lymphatic', 'musculoskeletal', 'sensory-receptors',
]

const systems = new Set(BODY_PROJECTION_TARGETS.map((target) => target.system))
for (const system of REQUIRED_SYSTEMS) assert.ok(systems.has(system), `missing requested body projection system: ${system}`)

const targetIds = BODY_PROJECTION_TARGETS.map((target) => target.id)
assert.equal(new Set(targetIds).size, targetIds.length, 'body projection target ids must be unique')
assert.ok(BODY_PROJECTION_TARGETS.every((target) => target.preferredSourceIds.length > 0), 'every projection target needs a source candidate')
assert.ok(BODY_PROJECTION_TARGETS.every((target) => target.patientSpecificAllowed === false), 'reference atlas contract must never silently allow patient-specific geometry')
assert.ok(BODY_PROJECTION_TARGETS.every((target) => !canPublishProjection(target)), 'no roadmap target may publish before geometry, evidence and human academic review are recorded')

const thermoreceptor = BODY_PROJECTION_TARGETS.find((target) => target.id === 'thermoreceptor-reference')
assert.ok(thermoreceptor)
assert.equal(thermoreceptor.geometryStatus, 'reference-only')
assert.match(thermoreceptor.note ?? '', /distributed/i)

const chemoreceptor = BODY_PROJECTION_TARGETS.find((target) => target.id === 'chemoreceptor-reference')
assert.ok(chemoreceptor)
assert.equal(chemoreceptor.geometryStatus, 'reference-only')

const requiredHints = ['heart', 'lung', 'brain', 'eye', 'cochlea', 'nasal cavity', 'thyroid', 'parathyroid', 'vagina', 'penis', 'testis', 'kidney', 'skin', 'lymph node']
const hintText = BODY_PROJECTION_TARGETS.flatMap((target) => target.anatomyHints).join(' ').toLowerCase()
for (const hint of requiredHints) assert.ok(hintText.includes(hint), `requested anatomy coverage target missing: ${hint}`)

const procedureIds = PROCEDURE_PROJECTION_TARGETS.map((procedure) => procedure.id)
assert.equal(new Set(procedureIds).size, procedureIds.length, 'procedure projection ids must be unique')
assert.ok(PROCEDURE_PROJECTION_TARGETS.length >= 40, 'procedure contract should cover the requested multi-system operation set')
for (const procedure of PROCEDURE_PROJECTION_TARGETS) {
  assert.equal(procedure.reviewRequired, true)
  assert.equal(procedure.productionReady, false, `${procedure.id} cannot become production-ready in the roadmap contract without explicit review work`)
  assert.equal(canPublishProcedure(procedure), false)
  for (const targetId of procedure.anatomyTargetIds) assert.ok(targetIds.includes(targetId), `${procedure.id} references unknown anatomy target ${targetId}`)
}

for (const file of ['data/source-registry/anatomy/z-anatomy.json', 'data/source-registry/anatomy/hubmap-hra.json', 'data/source-registry/anatomy/nih-3d.json']) {
  const source = JSON.parse(readFileSync(file, 'utf8')) as { id?: string; license?: { status?: string }; provenance?: unknown }
  assert.ok(source.id, `${file} must preserve source identity`)
  assert.equal(source.license?.status, 'VERIFIED', `${file} must have verified license metadata before it can be a preferred projection source`)
}

const zAnatomy = JSON.parse(readFileSync('data/source-registry/anatomy/z-anatomy.json', 'utf8')) as {
  usage?: { runtime?: boolean; buildTime?: boolean }
  adapter?: { status?: string }
  license?: { commercialUse?: string; scope?: string }
}
assert.equal(zAnatomy.usage?.runtime, false, 'Z-Anatomy must remain build-time rather than a remote runtime embed')
assert.equal(zAnatomy.usage?.buildTime, true)
assert.equal(zAnatomy.adapter?.status, 'PLANNED', 'projection contract must not pretend the Z-Anatomy ingestion adapter is already active')
assert.equal(zAnatomy.license?.commercialUse, 'CONDITIONAL')
assert.match(zAnatomy.license?.scope ?? '', /every imported anatomical asset/i, 'asset-level licensing must remain explicit')

console.log(`✓ body projection contract: ${BODY_PROJECTION_TARGETS.length} system targets, ${PROCEDURE_PROJECTION_TARGETS.length} review-gated procedures, zero auto-publish targets`)
