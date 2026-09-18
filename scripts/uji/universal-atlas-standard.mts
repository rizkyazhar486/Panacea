import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BODY_SYSTEM_SOURCE_WAVE } from '../../src/lib/bodySystemSourceWave.ts'
import {
  UNIVERSAL_ATLAS_DEPTHS,
  UNIVERSAL_ATLAS_REQUIREMENTS,
  universalRequirementsForSystem,
} from '../../src/lib/anatomy/universalAtlasStandard.ts'

assert.deepEqual(
  UNIVERSAL_ATLAS_DEPTHS.map((depth) => depth.id),
  ['gross', 'microanatomy', 'cellular', 'subcellular', 'chemistry', 'genomic'],
)

for (const system of BODY_SYSTEM_SOURCE_WAVE) {
  const requirements = universalRequirementsForSystem(system.id)
  assert.ok(
    requirements.some((item) => item.system === system.id),
    `every body system must own at least one universal-depth target: ${system.id}`,
  )
  assert.ok(
    requirements.some((item) => item.system === 'cross-system'),
    `cross-system chemistry/genomic targets must remain visible: ${system.id}`,
  )
}

const allExamples = UNIVERSAL_ATLAS_REQUIREMENTS.flatMap((item) => item.examples.map((value) => value.toLowerCase()))
for (const required of [
  'nail plate',
  'sebaceous gland',
  'areola',
  'glomerulus',
  'proximal tubule',
  'lens',
  'auricle',
  'cornea',
  'eyelid',
  'tunica intima',
  'tunica media',
  'vagina',
  'testis',
  'atp',
  'nad+',
  'nadh',
  'glucose',
]) {
  assert.ok(allExamples.includes(required), `universal atlas target missing: ${required}`)
}

const projector = readFileSync(new URL('../../src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', import.meta.url), 'utf8')
const rail = readFileSync(new URL('../../src/pages/bodyhub/UniversalAtlasDepthRail.tsx', import.meta.url), 'utf8')
const multisystem = readFileSync(new URL('../../src/pages/bodyhub/MultisystemScaleNavigator.tsx', import.meta.url), 'utf8')
const microscope = readFileSync(new URL('../../src/pages/bodyhub/SemanticMicroscopeStage.tsx', import.meta.url), 'utf8')
const chemistry = readFileSync(new URL('../../src/pages/bodyhub/MolecularChemistryStage.tsx', import.meta.url), 'utf8')

assert.match(projector, /UniversalAtlasDepthRail/)
assert.match(projector, /semanticScale=\{semanticZoom\.scale\}/)
assert.match(rail, /Universal standard · every structure/)
assert.match(rail, /Body → histology → cell → organelle → chemistry → genome/)
assert.doesNotMatch(multisystem, /Eye 4D Gold Standard/)
assert.doesNotMatch(multisystem, /Current organ benchmark/)
assert.match(microscope, /MolecularChemistryStage/)
for (const token of ['Glucose', 'ATP', 'NAD⁺', 'NADH', '5793', '5957', '5893', '439153']) {
  assert.ok(chemistry.includes(token), `chemistry stage missing verified core reference: ${token}`)
}

console.log('universal-atlas-standard: every body system is held to one gross→histology→cell→organelle→chemistry→genome target')
