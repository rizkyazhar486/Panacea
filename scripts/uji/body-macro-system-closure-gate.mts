import assert from 'node:assert/strict'
import {
  evaluateCurrentMacroSystemClosure,
  evaluateMacroDomainClosure,
  type MacroTargetPublicationRecord,
} from '../../src/lib/anatomy/macroSystemClosureGate.ts'
import { auditMacroArticularFascialReadiness } from '../../src/lib/anatomy/macroArticularFascialReadiness.ts'

const current = evaluateCurrentMacroSystemClosure()
for (const report of [current.articular, current.fascial]) {
  assert.equal(report.mayPromoteSystemRootToShipped, false)
  assert.notEqual(report.status, 'complete')
  assert.ok(report.requiredTargetIds.length > 0)
  assert.equal(report.completeTargetIds.length, 0)
}

const candidate = auditMacroArticularFascialReadiness()
  .find((entry) => entry.status !== 'source-candidate-missing')
assert.ok(candidate, 'fixture requires at least one real indexed source candidate')

const candidateDomain = candidate.target.domain
const incompleteRecord: MacroTargetPublicationRecord = {
  targetId: candidate.target.id,
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

const rejected = evaluateMacroDomainClosure(candidateDomain, [incompleteRecord])
assert.equal(rejected.mayPromoteSystemRootToShipped, false)
assert.ok(rejected.publicationRecordRejected.includes(incompleteRecord.targetId))

// A complete-looking record for one source-backed target must never promote the entire domain.
const singleApproved: MacroTargetPublicationRecord = {
  ...incompleteRecord,
  disposition: 'approved',
}
const partial = evaluateMacroDomainClosure(candidateDomain, [singleApproved])
assert.equal(partial.mayPromoteSystemRootToShipped, false)
assert.notEqual(partial.status, 'complete')
assert.ok(partial.completeTargetIds.includes(singleApproved.targetId))

// Unknown records cannot substitute for required target identities.
const unrelatedDomain = candidateDomain === 'articular' ? 'fascial' : 'articular'
const unrelated = evaluateMacroDomainClosure(unrelatedDomain, [{
  ...singleApproved,
  targetId: `${unrelatedDomain}:not-a-required-target`,
}])
assert.equal(unrelated.completeTargetIds.length, 0)
assert.equal(unrelated.mayPromoteSystemRootToShipped, false)

console.log(JSON.stringify({
  candidateTarget: candidate.target.id,
  articular: current.articular,
  fascial: current.fascial,
}, null, 2))
