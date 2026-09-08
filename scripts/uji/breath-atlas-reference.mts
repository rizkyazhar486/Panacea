import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BREATH_ATLAS_REFERENCE_BOUNDARY,
  BREATH_ATLAS_REFERENCE_URL,
  BREATH_ATLAS_SCIENCE_BOUNDARY,
  BREATH_ATLAS_STATIONS,
  BREATH_ATLAS_TOPIC,
  THEBUGGEDDEV_ANATOMY_REPOSITORY,
  THEBUGGEDDEV_ANATOMY_REVIEWED_REVISION,
} from '../../src/lib/breathAtlas.ts'
import { BODY_PROJECTION_TARGETS } from '../../src/lib/bodyProjectionContract.ts'

const registry = JSON.parse(readFileSync('data/source-registry/anatomy/thebuggeddev-breath-atlas.json', 'utf8'))
const panelSource = readFileSync('src/pages/bodyhub/BreathAtlasPanel.tsx', 'utf8')
const deepDiveSource = readFileSync('src/pages/bodyhub/PhysiologyDeepDivePanel.tsx', 'utf8')

assert.equal(registry.homepage, BREATH_ATLAS_REFERENCE_URL)
assert.equal(registry.repository, THEBUGGEDDEV_ANATOMY_REPOSITORY)
assert.equal(registry.license.status, 'CHECK_REQUIRED')
assert.equal(registry.license.commercialUse, 'UNKNOWN')
assert.equal(registry.usage.runtime, false)
assert.equal(registry.usage.buildTime, false)
assert.equal(registry.adapter.status, 'NOT_APPLICABLE')
assert.match(registry.provenance.authority, new RegExp(THEBUGGEDDEV_ANATOMY_REVIEWED_REVISION))

assert.ok(BREATH_ATLAS_TOPIC, 'Existing spirometry evidence anchor must resolve.')
assert.equal(BREATH_ATLAS_TOPIC.id, 'spirometry')
for (const term of ['lung', 'bronchus', 'diaphragm', 'alveolus']) {
  assert.ok(BREATH_ATLAS_TOPIC.searchTerms.includes(term), `Respiratory focus must retain ${term}.`)
}
assert.ok(BREATH_ATLAS_STATIONS.length >= 4)
assert.match(BREATH_ATLAS_REFERENCE_BOUNDARY, /does not import code, meshes, textures/i)
assert.match(BREATH_ATLAS_SCIENCE_BOUNDARY, /source anatomy stays dimensionally unchanged/i)
assert.match(BREATH_ATLAS_SCIENCE_BOUNDARY, /nothing here measures a patient/i)

assert.ok(panelSource.includes(THEBUGGEDDEV_ANATOMY_REPOSITORY))
assert.ok(panelSource.includes(BREATH_ATLAS_REFERENCE_URL))
assert.ok(deepDiveSource.includes('BreathAtlasPanel'))
assert.equal(/<iframe\b/i.test(panelSource), false, 'External Breath Atlas must not be runtime-embedded.')
assert.equal(/setInterval\s*\(/.test(panelSource), false, 'Breath Atlas panel must not introduce a polling/render loop.')

const pulmonary = BODY_PROJECTION_TARGETS.find((target) => target.id === 'pulmonary-core')
assert.ok(pulmonary)
assert.equal(pulmonary.preferredSourceIds.includes(registry.id), false, 'External product reference must not become a preferred anatomy source.')
assert.equal(pulmonary.patientSpecificAllowed, false)

console.log('Breath Atlas: mandatory references, no-copy license boundary, shared-Body3D focus, and reference-only respiratory semantics verified.')
