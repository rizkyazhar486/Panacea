import assert from 'node:assert/strict'
import {
  buildMacroEvidenceDebtLedger,
  summarizeMacroEvidenceDebt,
} from '../../src/lib/anatomy/macroEvidenceDebtLedger.ts'

const ledger = buildMacroEvidenceDebtLedger()
const summary = summarizeMacroEvidenceDebt()

assert.equal(ledger.length, 13)
assert.equal(summary.totalTargets, 13)
assert.equal(summary.articular.targetCount, 9)
assert.equal(summary.fascial.targetCount, 4)
assert.equal(summary.articular.sourceCandidateMissing, 0)
assert.equal(summary.fascial.sourceCandidateMissing, 1)
assert.equal(summary.articular.exactAssetSourceMissing, 0)
assert.equal(summary.fascial.exactAssetSourceMissing, 1)
assert.equal(summary.articular.licenseScopeVerificationRequired, 9)
assert.equal(summary.fascial.licenseScopeVerificationRequired, 4)
assert.equal(summary.allPublicationBlocked, true)

for (const entry of ledger) {
  assert.equal(entry.publicationBlocked, true)

  // The upstream repository revision, license metadata and attribution are
  // already pinned. They must not be reported as absent just because the
  // converted/shipped geometry and academic review are still incomplete.
  assert.equal(entry.missingFields.includes('source-revision'), false)
  assert.equal(entry.missingFields.includes('license'), false)
  assert.equal(entry.missingFields.includes('attribution'), false)

  // Known license metadata is not equivalent to verified license scope for the
  // converted artifact. Conversion/review debt remains publication-blocking.
  assert.ok(entry.missingFields.includes('license-scope-verification'))
  assert.ok(entry.missingFields.includes('transformation-history'))
  assert.ok(entry.missingFields.includes('qualified-reviewer'))
  assert.ok(entry.missingFields.includes('review-date'))
  assert.ok(entry.missingFields.includes('review-scope'))
  assert.ok(entry.missingFields.includes('review-disposition'))

  if (entry.targetId === 'fascial:superficial') {
    assert.ok(entry.missingFields.includes('source-candidate'))
    assert.ok(entry.missingFields.includes('exact-asset-source'))
  } else {
    assert.equal(entry.missingFields.includes('source-candidate'), false)
    assert.equal(entry.missingFields.includes('exact-asset-source'), false)
  }

  // Runtime readiness stays independent from pinned upstream provenance.
  if (entry.readinessStatus === 'source-candidate-missing') {
    assert.equal(entry.matchedSourceNames.length, 0)
  } else {
    assert.ok(entry.matchedSourceNames.length > 0)
  }
}

console.log(JSON.stringify(summary, null, 2))
