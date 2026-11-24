import assert from 'node:assert/strict'
import {
  advanceCareLoopStage,
  auditClosedLoopService,
  queryPersonalHealthMemory,
  type ClosedLoopCareItem,
  type MemoryRecordEntry,
} from '../../src/domains/clinical-operations/engine/closedLoopCareAndMemoryEngine.ts'

// 1. Closed-Loop Medical Service: constitutional authorization & closure invariants
const baseOrder: ClosedLoopCareItem = {
  loopId: 'loop_lab_hba1c_01',
  patientId: 'pt_001',
  kind: 'DIAGNOSTIC_ORDER',
  title: 'HbA1c + eGFR Renal Panel',
  priority: 'CRITICAL',
  stage: 'CREATED',
  createdAtIso: '2026-11-10T08:00:00Z',
  dueAtIso: '2026-11-18T08:00:00Z',
  linkedRecordIds: ['ord_01'],
  transitions: [],
}

// AI draft MUST be rejected from signing clinician review or closing loops (Law IV)
const aiSignAttempt = advanceCareLoopStage({
  item: baseOrder,
  nextStage: 'CLINICIAN_REVIEWED',
  actorRole: 'AI_ASSISTANT_DRAFT',
  actorId: 'medgemma-draft',
  timestampIso: '2026-11-11T09:00:00Z',
  note: 'AI auto-review attempt',
})
assert.equal(aiSignAttempt.ok, false)
assert.ok(aiSignAttempt.refusalReason?.includes('Law IV'))

// Closing before DOCTOR review MUST be rejected
const prematureClose = advanceCareLoopStage({
  item: baseOrder,
  nextStage: 'CLOSED',
  actorRole: 'NURSE',
  actorId: 'ns_01',
  timestampIso: '2026-11-11T09:00:00Z',
  note: 'Attempt premature close',
})
assert.equal(prematureClose.ok, false)

// Valid closed-loop progression: CREATED -> RESULT_RECEIVED -> CLINICIAN_REVIEWED (DOCTOR) -> CLOSED
const step1 = advanceCareLoopStage({
  item: baseOrder,
  nextStage: 'RESULT_OR_REPORT_RECEIVED',
  actorRole: 'LAB_SYSTEM',
  actorId: 'lis_prod',
  timestampIso: '2026-11-12T10:00:00Z',
  note: 'HbA1c 6.4%, eGFR 88',
})
assert.equal(step1.ok, true)

const step2 = advanceCareLoopStage({
  item: step1.item,
  nextStage: 'CLINICIAN_REVIEWED',
  actorRole: 'DOCTOR',
  actorId: 'dr_rizky_str',
  timestampIso: '2026-11-13T11:00:00Z',
  note: 'Reviewed lab results with patient',
})
assert.equal(step2.ok, true)

const step3 = advanceCareLoopStage({
  item: step2.item,
  nextStage: 'CLOSED',
  actorRole: 'DOCTOR',
  actorId: 'dr_rizky_str',
  timestampIso: '2026-11-13T11:30:00Z',
  note: 'Follow-up care plan confirmed and closed',
})
assert.equal(step3.ok, true)
assert.equal(step3.item.stage, 'CLOSED')

// 2. Overdue open-loop audit & Follow-Up Closure metric (FC)
const overdueReferral: ClosedLoopCareItem = {
  loopId: 'loop_ref_cardio_02',
  patientId: 'pt_001',
  kind: 'REFERRAL',
  title: 'Cardiology Echocardiography Referral',
  priority: 'CRITICAL',
  stage: 'PERFORMED_OR_SCHEDULED',
  createdAtIso: '2026-11-01T08:00:00Z',
  dueAtIso: '2026-11-15T08:00:00Z',
  linkedRecordIds: ['ref_02'],
  transitions: [],
}

const audit = auditClosedLoopService([step3.item, overdueReferral], '2026-11-24T08:00:00Z')
assert.equal(audit.totalEligibleLoops, 2)
assert.equal(audit.closedLoops, 1)
assert.equal(audit.openLoops, 1)
assert.equal(audit.overdueCriticalCount, 1)
assert.equal(audit.followUpClosureRatePct, 50)

// 3. Evidence-Grounded Personal Health Memory (WP-10)
const records: MemoryRecordEntry[] = [
  {
    id: 'rec_med_01',
    category: 'MEDICATION',
    label: 'Atorvastatin 20mg',
    valueText: 'Atorvastatin 20 mg malam',
    effectiveDate: '2025-04-10',
    sourceId: 'satusehat-rx',
    semanticState: 'clinician-reviewed',
  },
  {
    id: 'rec_vax_01',
    category: 'VACCINATION',
    label: 'Influenza Quadrivalent',
    effectiveDate: '2025-10',
    isApproximateDate: true,
    sourceId: 'manual-backfill',
    semanticState: 'patient-reported',
  },
  {
    id: 'rec_wt_2021',
    category: 'VITAL',
    label: 'Body Weight',
    numericValue: 79.5,
    unit: 'kg',
    effectiveDate: '2021-06-01',
    sourceId: 'smart-scale',
    semanticState: 'measured',
  },
  {
    id: 'rec_wt_2026',
    category: 'VITAL',
    label: 'Body Weight',
    numericValue: 73.2,
    unit: 'kg',
    effectiveDate: '2026-11-20',
    sourceId: 'smart-scale',
    semanticState: 'measured',
  },
  {
    id: 'rec_sim_fake',
    category: 'VITAL',
    label: 'Body Weight',
    numericValue: 55.0,
    unit: 'kg',
    effectiveDate: '2030-01-01',
    sourceId: 'counterfactual-sim',
    semanticState: 'simulated',
  },
]

const medAns = queryPersonalHealthMemory({ question: 'What medications have I previously recorded?', records, nowIso: '2026-11-24T08:00:00Z' })
assert.equal(medAns.certainty, 'EXACT_RECORD_FACT')
assert.equal(medAns.fabricatedDataUsed, false)
assert.equal(medAns.citations[0].recordId, 'rec_med_01')

const vaxAns = queryPersonalHealthMemory({ question: 'When was my last vaccination?', records, nowIso: '2026-11-24T08:00:00Z' })
assert.equal(vaxAns.certainty, 'APPROXIMATE_HISTORICAL_DATE')
assert.equal(vaxAns.citations[0].effectiveDate, '2025-10')

const wtAns = queryPersonalHealthMemory({ question: 'How has my weight changed over the past five years?', records, nowIso: '2026-11-24T08:00:00Z' })
assert.ok(wtAns.summary.includes('-6.3'), `expected -6.3 delta excluding simulated 55kg, got: ${wtAns.summary}`)
assert.equal(wtAns.citations.some((c) => c.recordId === 'rec_sim_fake'), false)

const procAns = queryPersonalHealthMemory({ question: 'What surgeries or procedures are in my history?', records, nowIso: '2026-11-24T08:00:00Z' })
assert.equal(procAns.certainty, 'MISSING_OR_UNRECORDED')

const pendingAns = queryPersonalHealthMemory({
  question: 'What results or referrals are still awaiting follow-up?',
  records,
  careLoops: [step3.item, overdueReferral],
  nowIso: '2026-11-24T08:00:00Z',
})
assert.equal(pendingAns.citations.length, 1)
assert.equal(pendingAns.citations[0].recordId, 'loop_ref_cardio_02')

const gapAns = queryPersonalHealthMemory({ question: 'What information is missing from my record?', records, nowIso: '2026-11-24T08:00:00Z' })
assert.equal(gapAns.certainty, 'MISSING_OR_UNRECORDED')
assert.ok(gapAns.missingRequiredDomains.includes('ALLERGY'))

console.log('aureum-closed-loop-and-memory: Law-IV AI-draft guard, closed-loop FC=50%, overdue critical audit, 6 evidence-grounded memory queries PASS')
