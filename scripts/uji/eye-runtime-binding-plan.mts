import assert from 'node:assert/strict'
import { buildEyeRuntimeBindingPlan } from '../../src/lib/anatomy/eyeRuntimeBindingPlan'

const exactBinding = {
  atlasNodeId: 'organ:eye',
  status: 'bound',
  selectedMeshNodeIds: ['mesh:eye'],
  candidates: [{
    meshNodeId: 'mesh:eye', sourceName: 'Eye', sourceFile: 'fixtures/eye.glb',
    reasons: ['exact-source-name'], score: 100,
  }],
} as any

const eligible = buildEyeRuntimeBindingPlan('organ:eye', exactBinding, [{ file: 'fixtures/eye.glb' }])
assert.equal(eligible.status, 'eligible')
assert.equal(eligible.targets.length, 1)
assert.equal(eligible.mayLoadAsset, false)
assert.equal(eligible.mayInferAnatomy, false)

const unloaded = buildEyeRuntimeBindingPlan('organ:eye', exactBinding, [])
assert.equal(unloaded.status, 'blocked')
assert.equal(unloaded.targets.length, 0)
assert.ok(unloaded.blockers.some((item) => item.startsWith('source-file-not-runtime-loaded:')))

const hintOnly = {
  ...exactBinding,
  candidates: [{ ...exactBinding.candidates[0], reasons: ['reviewed-contiguous-hint'] }],
} as any
const rejectedHint = buildEyeRuntimeBindingPlan('organ:eye', hintOnly, [{ file: 'fixtures/eye.glb' }])
assert.equal(rejectedHint.status, 'blocked')
assert.equal(rejectedHint.targets.length, 0)
console.log('Eye runtime binding plan: PASS')
