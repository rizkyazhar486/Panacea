import assert from 'node:assert/strict'
import {
  EYE_RUNTIME_BINDING_PLAN_BOUNDARY,
  buildEyeRuntimeBindingPlan,
} from '../../src/lib/anatomy/eyeRuntimeBindingPlan.ts'
import type { AtlasMeshBindingResult } from '../../src/lib/anatomy/atlasMeshBindingCompiler.ts'

const exactBinding: AtlasMeshBindingResult = {
  atlasNodeId: 'fixture:retina',
  status: 'bound',
  selectedMeshNodeIds: ['mesh:retina'],
  candidates: [
    {
      meshNodeId: 'mesh:retina',
      sourceName: 'Retina',
      sourceFile: 'fixtures/eye.glb',
      sourceRegion: 'kepala',
      hint: 'Retina',
      hintIndex: 0,
      score: 1400,
      reasons: ['exact-source-name', 'specificity-rank:0'],
    },
  ],
  matchedHints: ['Retina'],
  unresolvedHints: [],
  reasons: ['fixture exact binding'],
}

let plan = buildEyeRuntimeBindingPlan('fixture:retina', exactBinding, [{ file: 'fixtures/eye.glb' }])
assert.equal(plan.status, 'eligible')
assert.equal(plan.targets.length, 1)
assert.equal(plan.targets[0]?.meshNodeId, 'mesh:retina')
assert.equal(plan.targets[0]?.exactIdentityKind, 'exact-source-name')
assert.equal(plan.mayTraverseObject3D, false)
assert.equal(plan.mayLoadAsset, false)
assert.equal(plan.mayMutateGeometry, false)
assert.equal(plan.mayInferAnatomy, false)
assert.equal(plan.mayPromoteAcademicReview, false)
assert.equal(plan.patientSpecific, false)

const contiguousOnly: AtlasMeshBindingResult = {
  ...exactBinding,
  candidates: [{
    ...exactBinding.candidates[0]!,
    reasons: ['reviewed-contiguous-source-hint', 'specificity-rank:0'],
  }],
}
plan = buildEyeRuntimeBindingPlan('fixture:retina', contiguousOnly, [{ file: 'fixtures/eye.glb' }])
assert.equal(plan.status, 'blocked')
assert.ok(plan.blockers.includes('selected-mesh-not-exact-identity:mesh:retina'))
assert.deepEqual(plan.targets, [])

plan = buildEyeRuntimeBindingPlan('fixture:retina', exactBinding, [])
assert.equal(plan.status, 'blocked')
assert.ok(plan.blockers.includes('source-file-not-runtime-loaded:fixtures/eye.glb'))
assert.deepEqual(plan.targets, [])

plan = buildEyeRuntimeBindingPlan('fixture:wrong', exactBinding, [{ file: 'fixtures/eye.glb' }])
assert.equal(plan.status, 'blocked')
assert.ok(plan.blockers.includes('binding-canonical-id-mismatch'))

plan = buildEyeRuntimeBindingPlan(
  'fixture:retina',
  { ...exactBinding, status: 'partial' },
  [{ file: 'fixtures/eye.glb' }],
)
assert.equal(plan.status, 'blocked')
assert.ok(plan.blockers.includes('binding-not-exactly-bound:partial'))

const duplicateCandidateBinding: AtlasMeshBindingResult = {
  ...exactBinding,
  candidates: [exactBinding.candidates[0]!, { ...exactBinding.candidates[0]! }],
}
plan = buildEyeRuntimeBindingPlan('fixture:retina', duplicateCandidateBinding, [{ file: 'fixtures/eye.glb' }])
assert.equal(plan.status, 'blocked')
assert.ok(plan.blockers.includes('selected-mesh-candidate-not-unique:mesh:retina'))

assert.match(EYE_RUNTIME_BINDING_PLAN_BOUNDARY, /Reviewed contiguous hint matches alone are insufficient/)
assert.match(EYE_RUNTIME_BINDING_PLAN_BOUNDARY, /does not traverse Object3D/)
assert.match(EYE_RUNTIME_BINDING_PLAN_BOUNDARY, /promote academic review/)

console.log('eye-runtime-binding-plan: exact runtime-loaded identifier plan verified fail-closed')
