import assert from 'node:assert/strict'
import {
  buildAnatomyContextHandoff,
  clearAnatomyContextHandoff,
  consumeAnatomyContextHandoff,
  publishAnatomyContextHandoff,
} from '../../src/lib/anatomyContextHandoff.ts'
import {
  WHOLE_BODY_REGIONS,
  type AtlasRegionKey,
  type AtlasStructureTarget,
} from '../../src/lib/wholeBodyAtlasBlueprint.ts'

function target(id: string): { region: AtlasRegionKey; structure: AtlasStructureTarget } {
  for (const region of WHOLE_BODY_REGIONS) {
    const structure = region.structures.find((item) => item.id === id)
    if (structure) return { region: region.key, structure }
  }
  throw new Error(`Missing atlas target fixture: ${id}`)
}

clearAnatomyContextHandoff()

const heart = target('heart-great-vessels')
const heartContext = buildAnatomyContextHandoff(
  heart.region,
  heart.structure,
  [' Heart ', 'Aorta', 'Heart', ''],
)
assert.equal(heartContext.surgicalScenarioId, 'transseptal-anatomy')
assert.equal(heartContext.movementJointId, undefined)
assert.deepEqual(
  heartContext.resolvedNodeNames,
  ['Heart', 'Aorta'],
  'resolved source names must remain deterministic, trimmed and deduplicated',
)

const knee = target('knee-complex')
const kneeContext = buildAnatomyContextHandoff(knee.region, knee.structure, ['Femur.r', 'Tibia.r'])
assert.equal(kneeContext.surgicalScenarioId, 'knee-medial-parapatellar-spatial')
assert.equal(kneeContext.movementJointId, 'knee')

publishAnatomyContextHandoff(kneeContext, 'surgery')
publishAnatomyContextHandoff(kneeContext, 'biomechanics')
assert.equal(
  consumeAnatomyContextHandoff('surgery')?.surgicalScenarioId,
  'knee-medial-parapatellar-spatial',
  'surgery must receive the curated surgical destination',
)
assert.equal(
  consumeAnatomyContextHandoff('surgery'),
  null,
  'handoff must be consumed once so later manual visits are not pinned to stale context',
)
assert.equal(
  consumeAnatomyContextHandoff('biomechanics')?.movementJointId,
  'knee',
  'consuming surgery must not erase the isolated biomechanics slot',
)
assert.equal(consumeAnatomyContextHandoff('biomechanics'), null)

const shoulder = target('shoulder-complex')
const shoulderContext = buildAnatomyContextHandoff(shoulder.region, shoulder.structure)
assert.equal(shoulderContext.surgicalScenarioId, undefined)
assert.equal(shoulderContext.movementJointId, 'shoulder')

// Exercise the provenance guard directly rather than depending on the current
// catalogue containing a not-represented fixture. Even a structure ID that has
// a curated route must fail closed when its geometry provenance says it is not
// represented.
const notRepresentedKnee: AtlasStructureTarget = {
  ...knee.structure,
  provenance: 'not-represented',
}
const missingContext = buildAnatomyContextHandoff(knee.region, notRepresentedKnee)
assert.equal(missingContext.surgicalScenarioId, undefined)
assert.equal(missingContext.movementJointId, undefined)

publishAnatomyContextHandoff(heartContext, 'surgery')
publishAnatomyContextHandoff(shoulderContext, 'biomechanics')
clearAnatomyContextHandoff()
assert.equal(consumeAnatomyContextHandoff('surgery'), null)
assert.equal(consumeAnatomyContextHandoff('biomechanics'), null)

console.log('Anatomy context handoff keeps curated surgery/biomechanics routes deterministic, isolated, consume-once, and geometry-provenance safe.')
