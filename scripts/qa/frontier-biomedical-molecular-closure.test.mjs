// scripts/qa/frontier-biomedical-molecular-closure.test.mjs
// Verification suite for T-CLIN-76 through T-CLIN-80

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  evaluateCellCycleCheckpoints,
  calculateE2fRelease,
  calculateMpfActivity,
} from '../../src/lib/discovery/cellCycleCheckpointEngine.ts'

import {
  isSpCas9Pam,
  calculateMismatchPenalty,
  simulatePrecisionGenomeEditing,
} from '../../src/lib/discovery/precisionGenomeEditingEngine.ts'

import {
  matchesDrachConsensus,
  scanM6aSites,
  evaluateRnaEpitranscriptomics,
} from '../../src/lib/discovery/rnaEpitranscriptomicsEngine.ts'

import {
  calculatePluripotencyStability,
  simulateDirectedDifferentiation,
} from '../../src/lib/discovery/pluripotencyLineageEngine.ts'

import {
  getSeverityWindowMinutes,
  evaluateClosedLoopResultRouting,
} from '../../src/domains/clinical-operations/model/closedLoopResultRouting.ts'

// ==========================================
// T-CLIN-76: Cell Cycle Phase Dynamics & Checkpoints
// ==========================================
test('T-CLIN-76: Cell cycle checkpoints, restriction point R & DNA damage arrest', () => {
  // 1. Normal unperturbed G1 progression
  const normalG1 = evaluateCellCycleCheckpoints({
    mitogenLevel: 0.9,
    dnaDamageDsbCount: 0,
    initialPhase: 'G1_EARLY',
  })
  assert.equal(normalG1.g1_s_checkpoint, 'PASSED')
  assert.equal(normalG1.restrictionPointPassed, true)
  assert.ok(normalG1.e2fReleaseFraction > 0.6)

  // 2. DNA damage arrest at G1/S via p53-p21 pathway
  const damagedG1 = evaluateCellCycleCheckpoints({
    mitogenLevel: 0.9,
    dnaDamageDsbCount: 8, // 8 DSBs
    p53Functional: true,
    initialPhase: 'G1_EARLY',
  })
  assert.equal(damagedG1.g1_s_checkpoint, 'ARRESTED')
  assert.equal(damagedG1.restrictionPointPassed, false)

  // 3. Spindle Assembly Checkpoint (SAC)
  const unattachedM = evaluateCellCycleCheckpoints({
    kinetochoreUnattachedCount: 3,
    initialPhase: 'M_MITOSIS',
  })
  assert.equal(unattachedM.spindle_assembly_checkpoint, 'ARRESTED')
  assert.equal(unattachedM.mitoticExitCompetent, false)

  const alignedM = evaluateCellCycleCheckpoints({
    kinetochoreUnattachedCount: 0,
    initialPhase: 'M_MITOSIS',
  })
  assert.equal(alignedM.spindle_assembly_checkpoint, 'PASSED')
  assert.equal(alignedM.mitoticExitCompetent, true)

  // 4. Invariants
  assert.equal(normalG1.truthClass, 'mechanistic_simulation_proxy')
  assert.equal(normalG1.clinically_reviewed, false)
  assert.equal(normalG1.neverManufacturesBiomarkers, true)
})

// ==========================================
// T-CLIN-77: Precision Genome Editing
// ==========================================
test('T-CLIN-77: Precision CRISPR, Base Editing (CBE/ABE) & Prime Editing kinetics', () => {
  // 1. PAM recognition
  assert.equal(isSpCas9Pam('AGG'), true)
  assert.equal(isSpCas9Pam('TGG'), true)
  assert.equal(isSpCas9Pam('TGA'), false)

  // 2. Mismatch penalty: seed vs non-seed
  const spacer = 'GTCACGTAGCTAGCTAGCTA'
  const seedMismatchTarget = 'GTCACGTAGCTAGCTAGCTA'.slice(0, 18) + 'TT' // 2 seed mismatches at end
  const distalMismatchTarget = 'AACACGTAGCTAGCTAGCTA' // 2 mismatches at 5' distal end

  const seedResult = calculateMismatchPenalty(spacer, seedMismatchTarget)
  const distalResult = calculateMismatchPenalty(spacer, distalMismatchTarget)
  assert.ok(seedResult.penaltyScore > distalResult.penaltyScore, 'Seed mismatches must incur higher penalty')

  // 3. CRISPR-Cas9 DSB vs Base Editors
  const cas9Out = simulatePrecisionGenomeEditing({
    spacerSequence: spacer,
    pamSequence: 'CGG',
    targetSequence: spacer,
    modality: 'CRISPR_CAS9_NUCLEASE',
    donorTemplateSupplied: false,
    cellCyclePhase: 'G1',
  })
  assert.equal(cas9Out.dnaDoubleStrandBreakFormed, true)
  assert.equal(cas9Out.primaryRepairPathway, 'NON_HOMOLOGOUS_END_JOINING_NHEJ')
  assert.ok(cas9Out.predictedIndelBystanderRate > 0.8)

  const abeOut = simulatePrecisionGenomeEditing({
    spacerSequence: spacer,
    pamSequence: 'CGG',
    targetSequence: spacer,
    modality: 'ADENINE_BASE_EDITOR_ABE',
  })
  assert.equal(abeOut.dnaDoubleStrandBreakFormed, false, 'ABE must not form double strand breaks')
  assert.ok(abeOut.predictedPrecisionEditingYield > 0.8, 'ABE must exhibit high precision yield')
  assert.ok(abeOut.predictedIndelBystanderRate < 0.05, 'ABE must have minimal indels')

  const peOut = simulatePrecisionGenomeEditing({
    spacerSequence: spacer,
    pamSequence: 'CGG',
    targetSequence: spacer,
    modality: 'PRIME_EDITOR_PE3',
    pegRnaPbsLength: 13,
    pegRnaRttLength: 14,
  })
  assert.equal(peOut.dnaDoubleStrandBreakFormed, false)
  assert.equal(peOut.primaryRepairPathway, 'MISMATCH_REPAIR_EVASION')
  assert.ok(peOut.predictedPrecisionEditingYield > 0.5)
})

// ==========================================
// T-CLIN-78: RNA Epitranscriptomics & m6A
// ==========================================
test('T-CLIN-78: RNA epitranscriptomics, DRACH motifs & m6A reader/writer kinetics', () => {
  // 1. DRACH motif consensus
  assert.equal(matchesDrachConsensus('GGACU'), true) // G (R), G (R/D), A, C, U (H)
  assert.equal(matchesDrachConsensus('AGACU'), true)
  assert.equal(matchesDrachConsensus('UGACA'), true)
  assert.equal(matchesDrachConsensus('CCACA'), false) // C at pos 0 is not D [A,G,U]
  assert.equal(matchesDrachConsensus('GGAUU'), false) // U at pos 3 is not C

  // 2. Transcript m6A scanning
  const rnaSeq = 'AUGGGACUAGACUUUUUGACAUAG' // Contains 3 DRACH motifs: GGACU, AGACU, UGACA
  const sites = scanM6aSites(rnaSeq, 0.8, 0.2)
  assert.equal(sites.length, 3)

  // 3. Reader dynamic fate
  const profile = evaluateRnaEpitranscriptomics({
    transcriptId: 'tx_myc_001',
    sequence5to3: rnaSeq,
    baselineHalfLifeHours: 10.0,
    machinery: {
      ythdf2_decayReader: 0.8, // Active decay
      ythdf1_translationReader: 0.8, // Active translation boost
    },
  })
  assert.equal(profile.identifiedM6aCount, 3)
  assert.ok(profile.predictedHalfLifeHours < 10.0, 'YTHDF2 must decrease mRNA half-life')
  assert.ok(profile.predictedTranslationEfficiencyFoldChange > 1.0, 'YTHDF1 must increase translation efficiency')
  assert.equal(profile.truthClass, 'mechanistic_simulation_proxy')
})

// ==========================================
// T-CLIN-79: Pluripotency Gene Regulatory Network
// ==========================================
test('T-CLIN-79: Pluripotency network stability & teratoma safety clearance', () => {
  // 1. Core pluripotency calculation
  const pluripotency = calculatePluripotencyStability({
    oct4_level: 0.55, // optimal stoichiometric level
    sox2_level: 0.6,
    nanog_level: 0.6,
    klf4_level: 0.5,
    myc_level: 0.4,
  })
  assert.ok(pluripotency > 0.85)

  // 2. Directed differentiation to Mesoderm (Cardiac)
  const cardiacDiff = simulateDirectedDifferentiation({
    targetLayer: 'MESODERM_CARDIAC',
    wntActivationChirDays: 2.0,
    cultureDurationDays: 14,
  })
  assert.equal(cardiacDiff.targetLayer, 'MESODERM_CARDIAC')
  assert.equal(cardiacDiff.dominantMarkerExpression.marker, 'BRACHYURY_T')
  assert.ok(cardiacDiff.lineagePurityPercentage > 80.0)
  assert.equal(cardiacDiff.teratomaSafetyClearancePassed, true, 'Residual OCT4 must clear safety threshold after 14d')

  // 3. Pluripotent control (teratoma clearance must fail)
  const undiff = simulateDirectedDifferentiation({
    targetLayer: 'PLURIPOTENT_PRIMED',
    cultureDurationDays: 5,
  })
  assert.equal(undiff.teratomaSafetyClearancePassed, false, 'Undifferentiated iPSC must fail teratoma safety clearance')
})

// ==========================================
// T-CLIN-80: Closed-Loop Diagnostic Result Routing (PAN-EXP-2026-01)
// ==========================================
test('T-CLIN-80: Closed-loop diagnostic result routing & fail-closed escalation protocol', () => {
  const resultTimestamp = '2026-10-27T10:00:00.000Z'
  const resultMs = Date.parse(resultTimestamp)

  const criticalOrder = {
    orderId: 'ord_k_crit_01',
    accessionNumber: 'ACC-88392',
    patientId: 'pt_heart_failure_09',
    orderingClinicianId: 'dr_cardiologist_42',
    testName: 'Serum Potassium',
    resultValue: '6.8 mmol/L (Critical High)',
    numericValue: 6.8,
    unit: 'mmol/L',
    referenceRange: '3.5 - 5.0 mmol/L',
    severity: 'CRITICAL_EMERGENCY',
    resultTimestamp,
  }

  // 1. Within 15 minutes: Pending primary clinician review
  const eval15m = evaluateClosedLoopResultRouting(criticalOrder, resultMs + 15 * 60000)
  assert.equal(eval15m.status, 'PENDING_CLINICIAN_REVIEW')
  assert.equal(eval15m.escalationTarget, 'PRIMARY_CLINICIAN')
  assert.equal(eval15m.acknowledgementOverdue, false)
  assert.equal(eval15m.isClosed, false)

  // 2. At 75 minutes (>60m): Escalated to Secondary On-Call
  const eval75m = evaluateClosedLoopResultRouting(criticalOrder, resultMs + 75 * 60000)
  assert.equal(eval75m.status, 'ESCALATED_TO_ON_CALL')
  assert.equal(eval75m.escalationTarget, 'SECONDARY_ON_CALL')
  assert.equal(eval75m.acknowledgementOverdue, true)
  assert.ok(eval75m.safetyActionRequired.includes('URGENT ESCALATION'))

  // 3. At 150 minutes (>120m): Critical Safety Alarm to Rapid Response
  const eval150m = evaluateClosedLoopResultRouting(criticalOrder, resultMs + 150 * 60000)
  assert.equal(eval150m.status, 'ESCALATED_CRITICAL_SAFETY')
  assert.equal(eval150m.escalationTarget, 'SAFETY_OFFICER_RAPID_RESPONSE')
  assert.ok(eval150m.safetyActionRequired.includes('CRITICAL ALARM'))

  // 4. Closed Loop with verified clinical action
  const closedOrder = {
    ...criticalOrder,
    acknowledgedAt: '2026-10-27T10:20:00.000Z',
    acknowledgedById: 'rn_lead_nurse',
    closedAt: '2026-10-27T10:25:00.000Z',
    closedById: 'dr_cardiologist_42',
    mandatedClinicalAction: 'Administered 10g calcium gluconate IV + 10 units insulin with D50W; repeat serum K+ in 2 hours',
  }

  const evalClosed = evaluateClosedLoopResultRouting(closedOrder, resultMs + 180 * 60000)
  assert.equal(evalClosed.status, 'CLOSED_WITH_CLINICAL_ACTION')
  assert.equal(evalClosed.isClosed, true)
  assert.equal(evalClosed.acknowledgementOverdue, false)
  assert.ok(evalClosed.auditDigest.startsWith('sha256:closed:'))

  // 5. Window checks
  assert.equal(getSeverityWindowMinutes('CRITICAL_EMERGENCY'), 60)
  assert.equal(getSeverityWindowMinutes('ABNORMAL_PRIORITY'), 1440)
  assert.equal(getSeverityWindowMinutes('ROUTINE_INFORMATIONAL'), 10080)
})

const routingResultAt = '2026-10-27T10:00:00.000Z'
const routingNow = Date.parse('2026-10-27T13:00:00.000Z')
const routingOrder = {
  orderId: 'synthetic-order-80', accessionNumber: 'synthetic-accession-80',
  patientId: 'synthetic-patient', orderingClinicianId: 'synthetic-clinician',
  testName: 'Synthetic diagnostic result', resultValue: 'Pending review',
  severity: 'CRITICAL_EMERGENCY', resultTimestamp: routingResultAt,
}
const acknowledgedRoutingOrder = {
  ...routingOrder,
  acknowledgedAt: '2026-10-27T10:20:00.000Z', acknowledgedById: 'synthetic-reviewer',
}
const closedRoutingOrder = {
  ...acknowledgedRoutingOrder,
  closedAt: '2026-10-27T10:25:00.000Z', closedById: 'synthetic-clinician',
  mandatedClinicalAction: 'Documented clinician follow-up plan',
}

function rejectsRouting(patch, field, base = routingOrder, now = routingNow) {
  const order = { ...base, ...patch }
  const before = structuredClone(order)
  assert.throws(() => evaluateClosedLoopResultRouting(order, now), {
    name: 'TypeError', message: `Invalid diagnostic routing input: ${field}`,
  })
  assert.deepEqual(order, before, 'rejected data must not mutate the original order')
}

test('T-CLIN-80: rejects malformed, ambiguous, impossible and future result timestamps', () => {
  for (const resultTimestamp of [undefined, null, 0, '', 'not-a-time', '2026-10-27',
    '2026-10-27T10:00:00', '2026-02-30T10:00:00Z', '2026-10-27T13:00:00.001Z']) {
    rejectsRouting({ resultTimestamp }, 'resultTimestamp')
  }
  const result = evaluateClosedLoopResultRouting({ ...routingOrder, resultTimestamp: '2026-10-27T17:00:00+07:00' }, routingNow)
  assert.equal(result.elapsedMinutesSinceResult, 180)
  assert.equal(result.status, 'ESCALATED_CRITICAL_SAFETY')
})

test('T-CLIN-80: evaluation requires an explicit finite representable clock', () => {
  for (const now of [undefined, null, '1793106000000', NaN, Infinity, -Infinity, 8.64e15 + 1]) {
    assert.throws(() => evaluateClosedLoopResultRouting(routingOrder, now), {
      name: 'TypeError', message: 'Invalid diagnostic routing input: evaluatedAtMs',
    })
  }
  const atResult = evaluateClosedLoopResultRouting(routingOrder, Date.parse(routingResultAt))
  assert.equal(atResult.elapsedMinutesSinceResult, 0)
  assert.equal(atResult.isClosed, false)
})

test('T-CLIN-80: rejects missing order objects and required identity/result fields', () => {
  for (const order of [null, undefined, [], 'result']) {
    assert.throws(() => evaluateClosedLoopResultRouting(order, routingNow), {
      name: 'TypeError', message: 'Invalid diagnostic routing input: order',
    })
  }
  for (const field of ['orderId', 'accessionNumber', 'patientId', 'orderingClinicianId', 'testName', 'resultValue']) {
    for (const value of [undefined, null, 0, {}, '', ' \t']) rejectsRouting({ [field]: value }, field)
  }
})

test('T-CLIN-80: unknown severity cannot suppress escalation or yield an undefined window', () => {
  for (const severity of [undefined, null, '', 'critical', 'constructor', '__proto__', 0, {}]) {
    rejectsRouting({ severity }, 'severity')
    assert.throws(() => getSeverityWindowMinutes(severity), {
      name: 'TypeError', message: 'Invalid diagnostic routing input: severity',
    })
  }
})

test('T-CLIN-80: numeric zero is valid but nonfinite results or missing units are rejected', () => {
  for (const numericValue of [NaN, Infinity, -Infinity, null, '0']) {
    rejectsRouting({ numericValue, unit: 'mmol/L' }, 'numericValue')
  }
  for (const unit of [undefined, null, '', ' ', 0]) rejectsRouting({ numericValue: 0, unit }, 'unit')
  for (const field of ['unit', 'referenceRange']) {
    for (const value of [null, 0, {}, '', ' ']) rejectsRouting({ [field]: value }, field)
  }
  assert.equal(evaluateClosedLoopResultRouting({ ...routingOrder, numericValue: 0, unit: 'mmol/L' }, routingNow).isClosed, false)
})

test('T-CLIN-80: partial or invalid acknowledgements never hide an outstanding alert', () => {
  rejectsRouting({ acknowledgedById: 'synthetic-reviewer' }, 'acknowledgedAt')
  for (const acknowledgedById of [undefined, null, 0, '', ' ']) {
    rejectsRouting({ acknowledgedAt: routingResultAt, acknowledgedById }, 'acknowledgedById')
  }
  for (const acknowledgedAt of ['invalid', '2026-02-30T10:00:00Z', '2026-10-27T09:59:59.999Z', '2026-10-27T13:00:00.001Z']) {
    rejectsRouting({ acknowledgedAt }, 'acknowledgedAt', acknowledgedRoutingOrder)
  }
  assert.equal(evaluateClosedLoopResultRouting(acknowledgedRoutingOrder, routingNow).status, 'ACKNOWLEDGED_ACTION_PENDING')
})

test('T-CLIN-80: corrupt closure cannot be promoted to a completed clinical action', () => {
  rejectsRouting({ closedById: 'synthetic-clinician' }, 'closedAt', acknowledgedRoutingOrder)
  for (const closedAt of ['invalid', '2026-02-30T10:00:00Z', '2026-10-27T10:19:59.999Z', '2026-10-27T13:00:00.001Z']) {
    rejectsRouting({ closedAt }, 'closedAt', closedRoutingOrder)
  }
  for (const closedById of [undefined, null, 0, '', ' ']) rejectsRouting({ closedById }, 'closedById', closedRoutingOrder)
  for (const mandatedClinicalAction of [undefined, null, 0, {}, '', ' ']) {
    rejectsRouting({ mandatedClinicalAction }, 'mandatedClinicalAction', closedRoutingOrder)
  }
  rejectsRouting({ acknowledgedAt: undefined, acknowledgedById: undefined }, 'acknowledgedAt', closedRoutingOrder)
  const valid = Object.freeze({ ...closedRoutingOrder })
  assert.equal(evaluateClosedLoopResultRouting(valid, routingNow).isClosed, true)
  assert.deepEqual(valid, closedRoutingOrder)
})

test('T-CLIN-80: chronology admits simultaneous events and equivalent offset timestamps', () => {
  const result = evaluateClosedLoopResultRouting({
    ...closedRoutingOrder, resultTimestamp: '2026-10-27T17:00:00+07:00',
    acknowledgedAt: routingResultAt, closedAt: routingResultAt,
  }, Date.parse(routingResultAt))
  assert.equal(result.isClosed, true)
  assert.equal(result.elapsedMinutesSinceResult, 0)
})

test('T-CLIN-80: valid escalation boundaries stay deterministic', () => {
  const at = Date.parse(routingResultAt)
  for (const [minutes, status] of [[60, 'PENDING_CLINICIAN_REVIEW'], [61, 'ESCALATED_TO_ON_CALL'],
    [120, 'ESCALATED_TO_ON_CALL'], [121, 'ESCALATED_CRITICAL_SAFETY']]) {
    const first = evaluateClosedLoopResultRouting(routingOrder, at + minutes * 60000)
    assert.equal(first.status, status)
    assert.deepEqual(evaluateClosedLoopResultRouting(routingOrder, at + minutes * 60000), first)
  }
})

test('T-CLIN-80: timely acknowledgement does not become overdue as evaluation time advances', () => {
  const result = evaluateClosedLoopResultRouting(acknowledgedRoutingOrder, routingNow)
  assert.equal(result.status, 'ACKNOWLEDGED_ACTION_PENDING')
  assert.equal(result.acknowledgementOverdue, false)
  assert.equal(result.elapsedMinutesSinceResult, 180)
  assert.equal(result.isClosed, false)
})

test('T-CLIN-80: closure preserves actual acknowledgement lateness across severity boundaries', () => {
  const at = Date.parse(routingResultAt)
  for (const [severity, window] of [['CRITICAL_EMERGENCY', 60], ['ABNORMAL_PRIORITY', 1440], ['ROUTINE_INFORMATIONAL', 10080]]) {
    for (const [offsetMinutes, overdue] of [[window, false], [window + 1, true]]) {
      const acknowledgedAt = new Date(at + offsetMinutes * 60000).toISOString()
      const evaluatedAtMs = at + (window + 120) * 60000
      const acknowledged = { ...acknowledgedRoutingOrder, severity, acknowledgedAt }
      const pendingAction = evaluateClosedLoopResultRouting(acknowledged, evaluatedAtMs)
      assert.equal(pendingAction.acknowledgementOverdue, overdue)
      const closed = evaluateClosedLoopResultRouting({
        ...closedRoutingOrder, severity, acknowledgedAt, closedAt: acknowledgedAt,
      }, evaluatedAtMs)
      assert.equal(closed.status, 'CLOSED_WITH_CLINICAL_ACTION')
      assert.equal(closed.isClosed, true)
      assert.equal(closed.acknowledgementOverdue, overdue, 'closing a result must not erase late acknowledgement')
    }
  }
})
