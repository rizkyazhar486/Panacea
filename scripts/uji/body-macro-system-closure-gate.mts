import assert from 'node:assert/strict'
import {
  evaluateCurrentMacroSystemClosure,
  evaluateMacroDomainClosure,
  type MacroTargetPublicationRecord,
} from '../../src/lib/anatomy/macroSystemClosureGate.ts'

const current = evaluateCurrentMacroSystemClosure()
for (const report of [current.articular, current.fascial]) {
  assert.equal(report.mayPromoteSystemRootToShipped, false)
  assert.notEqual(report.status, 'complete')
  assert.ok(report.requiredTargetIds.length > 0)
  assert.equal(report.completeTargetIds.length, 0)
}

const incompleteRecord: MacroTargetPublicationRecord = {
  targetId: current.articular.requiredTargetIds[0]!,
  exactAssetSource: 'asset:test',
  sourceRevision: 'rev:test',
  license: 'test-only',
  attribution: 'test fixture only',
  transformationHistory: ['none-test-fixture'],
  reviewerIdentity: 'Fixture Reviewer',
  reviewerCredentials: 'Test fixture, not a real qualified reviewer',
  reviewDate: '2026-09-10',
  reviewScope: 'Test fixture only',
  disposition: 'changes-required',
}

const rejected = evaluateMacroDomainClosure('articular', [incompleteRecord])
assert.equal(rejected.mayPromoteSystemRootToShipped, false)
assert.ok(rejected.publicationRecordRejected.includes(incompleteRecord.targetId))

// A complete-looking record for one target must never promote the entire domain.
const singleApproved: MacroTargetPublicationRecord = {
  ...incompleteRecord,
  disposition: 'approved',
}
const partial = evaluateMacroDomainClosure('articular', [singleApproved])
assert.equal(partial.mayPromoteSystemRootToShipped, false)
assert.notEqual(partial.status, 'complete')

// Unknown records cannot substitute for required target identities.
const unrelated = evaluateMacroDomainClosure('fascial', [{
  ...singleApproved,
  targetId: 'fascial:not-a-required-target',
}])
assert.equal(unrelated.completeTargetIds.length, 0)
assert.equal(unrelated.mayPromoteSystemRootToShipped, false)

console.log(JSON.stringify({
  articular: current.articular,
  fascial: current.fascial,
}, null, 2))
