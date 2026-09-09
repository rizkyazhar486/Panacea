import assert from 'node:assert/strict'
import { planAnatomyStreaming, type AnatomyStreamingCandidate } from '../../src/lib/anatomyStreamingPlanner.ts'

const candidates: AnatomyStreamingCandidate[] = [
  { nodeId: 'heart', projectedRadiusPx: 260, clinicalWeight: 3, visible: true, selected: true, interacting: false, predictedNext: false },
  { nodeId: 'aorta', projectedRadiusPx: 180, clinicalWeight: 2, visible: true, selected: false, interacting: true, predictedNext: false },
  { nodeId: 'right-lung', projectedRadiusPx: 150, clinicalWeight: 2, visible: true, selected: false, interacting: false, predictedNext: false },
  { nodeId: 'left-lung', projectedRadiusPx: 150, clinicalWeight: 2, visible: true, selected: false, interacting: false, predictedNext: false },
  { nodeId: 'trachea', projectedRadiusPx: 60, clinicalWeight: 2, visible: false, selected: false, interacting: false, predictedNext: true },
  { nodeId: 'skin', projectedRadiusPx: 500, clinicalWeight: 1, visible: false, selected: false, interacting: false, predictedNext: false, residentLevel: 2 },
]

const budget = { gpuBytes: 45_000_000, maxDrawCalls: 40, maxResidentNodes: 5 }
const plan = planAnatomyStreaming(candidates, budget)
assert.equal(plan.overBudget, false)
assert.ok(plan.totalGpuBytes <= budget.gpuBytes)
assert.ok(plan.totalDrawCalls <= budget.maxDrawCalls)
assert.ok(plan.residentNodes <= budget.maxResidentNodes)

const heart = plan.entries.find((entry) => entry.nodeId === 'heart')
assert.ok(heart)
assert.notEqual(heart.action, 'unload')
assert.ok((heart.targetLevel ?? 0) >= 3)

const skin = plan.entries.find((entry) => entry.nodeId === 'skin')
assert.ok(skin)
assert.equal(skin.action, 'unload')

const trachea = plan.entries.find((entry) => entry.nodeId === 'trachea')
assert.ok(trachea)
assert.ok(['preload', 'load'].includes(trachea.action))

const deterministicA = planAnatomyStreaming(candidates, budget)
const deterministicB = planAnatomyStreaming([...candidates].reverse(), budget)
assert.deepEqual(deterministicA, deterministicB)

const tinyBudget = planAnatomyStreaming(candidates, { gpuBytes: 700_000, maxDrawCalls: 2, maxResidentNodes: 1 })
assert.equal(tinyBudget.overBudget, false)
assert.ok(tinyBudget.entries.find((entry) => entry.nodeId === 'heart'))
assert.ok(tinyBudget.residentNodes <= 1)

assert.throws(
  () => planAnatomyStreaming([...candidates, { ...candidates[0] }], budget),
  /Duplicate anatomy streaming candidate/,
)
assert.throws(
  () => planAnatomyStreaming(candidates, { gpuBytes: -1, maxDrawCalls: 1, maxResidentNodes: 1 }),
  /must not be negative/,
)

console.log('Anatomy streaming planner verified: deterministic priority, selected-structure preservation, preload/unload transitions, and hard GPU/draw-call/residency budgets.')
