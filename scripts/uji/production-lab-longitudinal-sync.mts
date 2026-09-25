import assert from 'node:assert/strict'
import {
  buildContextPacket,
  createLongitudinalPatientState,
  projectStateToSurface,
} from '../../src/lib/panaceaLongitudinalState.ts'
import { syncProductionLabStores } from '../../src/lib/productionLabLongitudinalSync.ts'

const context = {
  consent: {
    granted: true,
    purposes: ['personal-visualization', 'clinical-support', 'ai-context'] as const,
    grantedAt: '2026-09-01T00:00:00.000Z',
  },
  receivedAt: '2026-09-17T01:30:00.000Z',
  confidence: {
    labManualEntry: 0.7,
    bioAgeDerived: 0.65,
  },
} as const

const request = {
  state: createLongitudinalPatientState('subject-1', '2026-09-01T00:00:00.000Z'),
  subjectId: 'subject-1',
  labByType: {
    hba1c: [{ id: 'hba1c-1', tanggal: '2026-06-01', nilai: 5.4 }],
    ldl: [
      { id: 'ldl-1', tanggal: '2026-06-01', nilai: 92 },
      { id: 'ldl-2', tanggal: '2026-07-01', nilai: 88 },
    ],
  },
  bioAgeTrajectory: [
    { tanggal: '2026-08-01', usia: 40, phenoAge: 38.2, ageGap: -1.8, metode: 'phenoage-levine-2018' as const },
  ],
  context,
} as const

const first = syncProductionLabStores(request)
// 1 hba1c + 2 ldl + 2 bioage-trajectory metrics (phenoage, phenoage-age-gap) = 5
assert.equal(first.candidateEventCount, 5)
assert.equal(first.insertedEventCount, 5)
assert.equal(first.duplicateEventCount, 0)
assert.equal(first.skipped.length, 0)
assert.equal(first.state.revision, 5)
assert.ok(Object.values(first.state.eventsById).some((event) => event.provenance.sourceId === 'panaceamed:lab-log'))
assert.ok(Object.values(first.state.eventsById).some((event) => event.provenance.sourceId === 'panaceamed:bioage-trajectory'))
assert.ok(Object.values(first.state.eventsById)
  .filter((event) => event.domain === 'lab')
  .every((event) => event.review.state === 'pending'))
assert.ok(Object.values(first.state.eventsById)
  .filter((event) => event.domain === 'longevity')
  .every((event) => event.review.state === 'not-required'))

// ── Reachability through the canonical surface projection, not just storage ──
// This is the gap the workflow's `next_action` names: lab events must flow
// through projectStateToSurface/buildContextPacket, gated by the SAME
// consent/clinician-review rules as every other domain — not a lab-specific
// bypass.
const clinicalProjection = projectStateToSurface(first.state, 'clinical', '2026-09-17T02:00:00.000Z')
// Unreviewed lab values are correctly withheld from Clinical/AI-EMR until a
// clinician accepts them — this is the fail-closed behaviour, not a bug.
assert.equal(clinicalProjection.pendingClinicalReview, 2)
assert.ok(!clinicalProjection.metrics.some((m) => m.domain === 'lab'))

const chatbotPacket = buildContextPacket(first.state, 'ai-chatbot', '2026-09-17T02:00:00.000Z')
// ai-chatbot context may include still-pending (not-yet-rejected) lab signals,
// each carrying its true reviewState rather than a laundered 'accepted'.
const hba1cSignal = chatbotPacket.signals.find((s) => s.metric === 'lab-hba1c')
assert.ok(hba1cSignal)
assert.equal(hba1cSignal?.domain, 'lab')
assert.equal(hba1cSignal?.reviewState, 'pending')
assert.equal(hba1cSignal?.value, 5.4)
assert.equal(hba1cSignal?.unit, '%')

// The derived biological-age trajectory reaches Your Body (longevity domain)
// without needing clinician review, because it is not itself a lab domain event.
const yourBodyProjection = projectStateToSurface(first.state, 'your-body', '2026-09-17T02:00:00.000Z')
assert.ok(yourBodyProjection.metrics.some((m) => m.metric === 'phenoage' && m.domain === 'longevity'))

// ── Idempotent re-ingestion: same candidate set on the already-updated state ──
const second = syncProductionLabStores({ ...request, state: first.state })
assert.equal(second.candidateEventCount, 5)
assert.equal(second.insertedEventCount, 0)
assert.equal(second.duplicateEventCount, 5)
assert.equal(second.state.revision, 5)

// ── Subject mismatch fails closed ──────────────────────────────────────────
const wrongSubject = createLongitudinalPatientState('another-subject', '2026-09-01T00:00:00.000Z')
assert.throws(
  () => syncProductionLabStores({ ...request, state: wrongSubject }),
  /request.subjectId does not match state.subjectId/,
)

// ── Only the lab store, no trajectory yet (a realistic pre-baseline state) ──
const labOnly = syncProductionLabStores({
  state: createLongitudinalPatientState('subject-2', '2026-09-01T00:00:00.000Z'),
  subjectId: 'subject-2',
  labByType: { hba1c: [{ id: 'hba1c-2', tanggal: '2026-06-01', nilai: 5.4 }] },
  context,
})
assert.equal(labOnly.candidateEventCount, 1)
assert.equal(labOnly.insertedEventCount, 1)

// ── Skip reasons propagate through the orchestrator, not swallowed ─────────
const withSkip = syncProductionLabStores({
  state: createLongitudinalPatientState('subject-3', '2026-09-01T00:00:00.000Z'),
  subjectId: 'subject-3',
  labByType: { hba1c: [{ id: 'hba1c-3', tanggal: '2026-06-01', nilai: -5 }] },
  context,
})
assert.equal(withSkip.candidateEventCount, 0)
assert.equal(withSkip.insertedEventCount, 0)
assert.deepEqual(withSkip.skipped, [{ sourceRecordId: 'hba1c-3', reason: 'invalid-value', field: 'nilai' }])

console.log('Production lab + biological-age-trajectory stores sync idempotently into one longitudinal patient state, preserving pending clinician-review status.')
