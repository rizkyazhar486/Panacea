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
assert.equal(summary.allPublicationBlocked, true)

for (const entry of ledger) {
  assert.equal(entry.publicationBlocked, true)
  assert.ok(entry.missingFields.includes('exact-asset-source'))
  assert.ok(entry.missingFields.includes('source-revision'))
  assert.ok(entry.missingFields.includes('license'))
  assert.ok(entry.missingFields.includes('attribution'))
  assert.ok(entry.missingFields.includes('transformation-history'))
  assert.ok(entry.missingFields.includes('qualified-reviewer'))
  assert.ok(entry.missingFields.includes('review-date'))
  assert.ok(entry.missingFields.includes('review-scope'))
  assert.ok(entry.missingFields.includes('review-disposition'))

  if (entry.readinessStatus === 'source-candidate-missing') {
    assert.ok(entry.missingFields.includes('source-candidate'))
    assert.equal(entry.matchedSourceNames.length, 0)
  } else {
    assert.ok(entry.matchedSourceNames.length > 0)
    assert.equal(entry.missingFields.includes('source-candidate'), false)
  }
}

console.log(JSON.stringify(summary, null, 2))
