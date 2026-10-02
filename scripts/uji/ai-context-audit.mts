import assert from 'node:assert/strict'
import { buildAiContextAuditRecord } from '../../src/lib/aiContextAudit.ts'
import type { MinimizedAiContext } from '../../src/lib/aiContextPolicy.ts'

const context: MinimizedAiContext = {
  subjectId: 'subject-opaque',
  generatedAt: '2026-09-28T00:00:00.000Z',
  stateRevision: 7,
  signals: [{
    metric: 'sensitive-metric-name',
    domain: 'clinical-note',
    value: '[clinical note content omitted; use reviewed metadata/context only]',
    recordedAt: '2026-09-27T00:00:00.000Z',
    confidence: 0.9,
    sourceKind: 'clinical-system',
    sourceId: 'sensitive-source-id',
    reviewState: 'accepted',
    ageDays: 1,
    freshness: 0.9,
    packingScore: 0.9,
    rawValueRedacted: true,
  }],
  omitted: {
    expiredByAge: 2,
    outsideDomainPolicy: 3,
    capacity: 4,
    rawClinicalNotesRedacted: 1,
  },
  governance: {
    minimumNecessaryContext: true,
    packingScoreIsNotClinicalImportance: true,
    autonomousClinicalCommitAllowed: false,
  },
}

const audit = buildAiContextAuditRecord(context)
assert.equal(audit.schemaVersion, 'panacea.ai-context-audit.v1')
assert.equal(audit.includedSignals, 1)
assert.deepEqual(audit.sourceKinds, ['clinical-system'])
assert.deepEqual(audit.reviewStates, ['accepted'])
assert.equal(audit.governance.rawClinicalNoteRedactionObserved, true)
assert.equal(audit.governance.autonomousClinicalCommitAllowed, false)

const serialized = JSON.stringify(audit)
assert.doesNotMatch(serialized, /sensitive-metric-name/)
assert.doesNotMatch(serialized, /sensitive-source-id/)
assert.doesNotMatch(serialized, /clinical note content omitted/)
assert.doesNotMatch(serialized, /"value"/)

console.log('AI context audit verified: governance metadata remains observable without duplicating patient content.')
