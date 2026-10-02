import assert from 'node:assert/strict'
import {
  INITIAL_REALITY_STATE,
  REALITY_DEMO_SEQUENCE,
  interpretRealityCommand,
  realityCausalPath,
} from '../../src/lib/panaceaRealityEngine'

let state = INITIAL_REALITY_STATE

state = interpretRealityCommand('Remove my skin', state)
assert.equal(state.layer, 'muscle')
assert.equal(state.view, 'whole-body')
assert.equal(state.pathology, 'none')

state = interpretRealityCommand('Freeze reality', state)
assert.equal(state.frozen, true)
assert.equal(state.simulationRunning, true, 'freezing the world frame must not freeze the authored biology simulation')

state = interpretRealityCommand('Explode heart', state)
assert.equal(state.layer, 'cardiac')
assert.equal(state.exploded, true)
assert.equal(state.view, 'thorax')

state = interpretRealityCommand('Simulate LAD occlusion', state)
assert.equal(state.pathology, 'lad-occlusion')
assert.deepEqual(
  realityCausalPath(state),
  ['Whole body', 'Heart', 'Coronary tree', 'LAD', 'Synthetic ischemia state', 'Teaching signal'],
)

state = interpretRealityCommand('Take me inside the heart', state)
assert.equal(state.view, 'intracardiac')
assert.equal(state.exploded, false)

state = interpretRealityCommand('Reverse it', state)
assert.equal(state.pathology, 'none')
assert.equal(state.view, 'thorax')

state = interpretRealityCommand('show nerves', state)
state = interpretRealityCommand('simulate C5 radiculopathy', state)
assert.equal(state.layer, 'neural')
assert.equal(state.pathology, 'c5-radiculopathy')
assert.ok(realityCausalPath(state).includes('C5 root'))

const unknown = interpretRealityCommand('invent a diagnosis for this person', state)
assert.equal(unknown.pathology, 'c5-radiculopathy', 'unsupported language must not silently invent a new biomedical state')
assert.equal(unknown.layer, 'neural')

let demo = INITIAL_REALITY_STATE
for (const command of REALITY_DEMO_SEQUENCE) demo = interpretRealityCommand(command, demo)
assert.equal(demo.frozen, false)
assert.equal(demo.pathology, 'none')
assert.equal(demo.simulationRunning, true)

const reset = interpretRealityCommand('reset reality', demo)
assert.equal(reset.layer, 'surface')
assert.equal(reset.pathology, 'none')
assert.equal(reset.view, 'whole-body')
assert.equal(reset.frozen, false)

console.log('Panacea Reality Engine semantic transformation tests passed')
