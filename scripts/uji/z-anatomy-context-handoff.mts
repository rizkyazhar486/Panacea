import assert from 'node:assert/strict'
import {
  buildAnatomyContextHandoff,
  clearAnatomyContextHandoff,
  consumeAnatomyContextHandoff,
  publishAnatomyContextHandoff,
} from '../../src/lib/anatomyContextHandoff.ts'
import { WHOLE_BODY_REGIONS } from '../../src/lib/wholeBodyAtlasBlueprint.ts'

function target(id: string) {
  for (const region of WHOLE_BODY_REGIONS) {
    const structure = region.structures.find((item) => item.id === id)
    if (structure) return { region, structure }
  }
  throw new Error(`Missing atlas fixture: ${id}`)
}

const knee = target('knee-complex')
const kneeContext = buildAnatomyContextHandoff(
  knee.region.key,
  knee.structure,
  ['Femur.R', ' Tibia.R ', 'Femur.R'],
)
assert.equal(kneeContext.surgicalScenarioId, 'knee-medial-parapatellar-spatial')
assert.equal(kneeContext.movementJointId, 'knee')
assert.deepEqual(kneeContext.resolvedNodeNames, ['Femur.R', 'Tibia.R'])

const heart = target('heart-great-vessels')
const heartContext = buildAnatomyContextHandoff(heart.region.key, heart.structure, ['Heart'])
assert.equal(heartContext.surgicalScenarioId, 'transseptal-anatomy')
assert.equal(heartContext.movementJointId, undefined, 'cardiac geometry must not acquire a biomechanics joint by inference')

const cuff = target('rotator-cuff')
const cuffContext = buildAnatomyContextHandoff(cuff.region.key, cuff.structure)
assert.equal(cuffContext.movementJointId, 'shoulder')
assert.equal(cuffContext.surgicalScenarioId, undefined, 'rotator cuff must not be routed to an unrelated surgical scenario')

const bowel = target('stomach-bowel')
const bowelContext = buildAnatomyContextHandoff(bowel.region.key, bowel.structure, ['Ileum'])
assert.equal(bowelContext.surgicalScenarioId, undefined)
assert.equal(bowelContext.movementJointId, undefined)
assert.equal(bowelContext.resolvedNodeNames[0], 'Ileum', 'source-node names must not create a route by fuzzy inference')

clearAnatomyContextHandoff()
assert.equal(consumeAnatomyContextHandoff('surgery'), null)
publishAnatomyContextHandoff(kneeContext, 'surgery')
assert.equal(consumeAnatomyContextHandoff('surgery')?.structureId, 'knee-complex')
assert.equal(consumeAnatomyContextHandoff('surgery'), null, 'surgical handoff must be one-shot')

console.log('Z-Anatomy handoff uses explicit reviewed mappings; source-node names never infer surgery or biomechanics destinations.')
