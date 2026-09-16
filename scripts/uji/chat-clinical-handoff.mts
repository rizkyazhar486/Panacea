import assert from 'node:assert/strict'
import { buildChatClinicalHandoff } from '../../src/lib/chatClinicalHandoff.ts'
import type { MinimizedAiContext } from '../../src/lib/aiContextPolicy.ts'

const context: MinimizedAiContext = {
  subjectId: 'chat-subject',
  generatedAt: '2026-09-17T02:00:00.000Z',
  stateRevision: 12,
  signals: [
    {
      metric: 'sleep-duration', domain: 'sleep', value: 6.5, unit: 'h', recordedAt: '2026-09-16T00:00:00.000Z', confidence: 0.9,
      sourceKind: 'wearable', sourceId: 'oura:ring', reviewState: 'not-required', ageDays: 1, freshness: 0.8, packingScore: 0.83, rawValueRedacted: false,
    },
    {
      metric: 'demo-lab', domain: 'lab', value: 12, unit: 'mg/dL', recordedAt: '2026-09-16T01:00:00.000Z', confidence: 0.95,
      sourceKind: 'clinical-system', sourceId: 'lab-system', reviewState: 'pending', ageDays: 1, freshness: 0.8, packingScore: 0.845, rawValueRedacted: false,
    },
  ],
  omitted: { expiredByAge: 0, outsideDomainPolicy: 0, capacity: 0, rawClinicalNotesRedacted: 0 },
  governance: { minimumNecessaryContext: true, packingScoreIsNotClinicalImportance: true, autonomousClinicalCommitAllowed: false },
}

const handoff = buildChatClinicalHandoff('handoff-1', 'Explain my recent health changes.', context)
assert.equal(handoff.evidence.length, 2)
assert.equal(handoff.evidenceCoverageFraction, 1)
assert.equal(handoff.pendingOrUnreviewedClinicalSignals, 1)
assert.equal(handoff.blockedClinicalAssertionCount, 1)
assert.match(handoff.conversationInstruction, /unverified context/i)
assert.equal(handoff.governance.answerMayPresentPendingClinicalDataAsVerified, false)
assert.equal(handoff.governance.answerMayAutonomouslyDiagnose, false)
assert.equal(handoff.governance.answerMayAutonomouslyPrescribe, false)
assert.equal(handoff.governance.answerMayAutonomouslyCommitToEmr, false)
assert.equal(handoff.governance.clinicianReviewRequiredForClinicalCommit, true)

console.log('Chat↔Clinical handoff verified: minimum-necessary context keeps provenance, pending clinical signals remain unverified, and diagnosis/prescription/EMR commit stay clinician-gated.')
