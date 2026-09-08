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

const notRepresentedKnee = buildAnatomyContextHandoff(
  knee.region.key,
  { ...knee.structure, provenance: 'not-represented' },
  ['Femur.R'],
)
assert.equal(notRepresentedKnee.surgicalScenarioId, undefined, 'not-represented geometry must fail closed for surgery')
assert.equal(notRepresentedKnee.movementJointId, undefined, 'not-represented geometry must fail closed for biomechanics')

clearAnatomyContextHandoff()
assert.equal(consumeAnatomyContextHandoff('surgery'), null)
assert.equal(consumeAnatomyContextHandoff('biomechanics'), null)

publishAnatomyContextHandoff(kneeContext, 'surgery')
publishAnatomyContextHandoff(cuffContext, 'biomechanics')
assert.equal(consumeAnatomyContextHandoff('surgery')?.structureId, 'knee-complex')
assert.equal(consumeAnatomyContextHandoff('surgery'), null, 'surgical handoff must be one-shot')
assert.equal(consumeAnatomyContextHandoff('biomechanics')?.structureId, 'rotator-cuff', 'biomechanics context must remain isolated from surgery consumption')
assert.equal(consumeAnatomyContextHandoff('biomechanics'), null, 'biomechanics handoff must be one-shot')

publishAnatomyContextHandoff(kneeContext, 'surgery')
publishAnatomyContextHandoff(kneeContext, 'biomechanics')
clearAnatomyContextHandoff()
assert.equal(consumeAnatomyContextHandoff('surgery'), null, 'clear must remove surgery context')
assert.equal(consumeAnatomyContextHandoff('biomechanics'), null, 'clear must remove biomechanics context')

console.log('Z-Anatomy handoff uses explicit curated mappings; surgery and biomechanics are isolated one-shot contexts, source-node names never infer destinations, and curation does not imply qualified human review.')
