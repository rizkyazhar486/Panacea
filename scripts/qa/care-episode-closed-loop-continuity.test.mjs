// scripts/qa/care-episode-closed-loop-continuity.test.mjs
// Verification suite for Closed-Loop Diagnostic Result Routing (T-CLIN-80 / PAN-EXP-2026-01)
// and Clinical Referral Handoff Protocol & Reconciliation (T-CLIN-85) integrated into CareEpisode.

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  newCareEpisode,
  setStageStatus,
  addDiagnosticOrder,
  acknowledgeDiagnosticOrder,
  closeDiagnosticOrder,
  evaluateCareEpisodeDiagnosticSafety,
  setReferralHandoff,
  evaluateCareEpisodeReferralContinuity,
  detectStalls,
  episodeHealth,
  stallReason,
} from '../../src/lib/careEpisode.ts'

import { deriveCareJourneyTimelineEvents } from '../../src/domains/clinical-operations/model/careContinuityProjection.ts'

test('T-CLIN-80: addDiagnosticOrder appends and updates diagnostic results immutably', () => {
  const ep0 = newCareEpisode('Severe Sepsis Episode')
  const order1 = {
    orderId: 'ord-k-01',
    accessionNumber: 'ACC-LAB-881',
    patientId: 'pt-alpha-1',
    orderingClinicianId: 'doc-rizky',
    testName: 'Serum Potassium',
    resultValue: '6.8',
    numericValue: 6.8,
    unit: 'mEq/L',
    referenceRange: '3.5 - 5.0',
    severity: 'CRITICAL_EMERGENCY',
    resultTimestamp: '2026-11-03T10:00:00.000Z',
  }

  const ep1 = addDiagnosticOrder(ep0, order1, '2026-11-03T10:05:00.000Z')
  assert.equal(ep1.diagnosticOrders?.length, 1)
  assert.equal(ep1.diagnosticOrders[0].testName, 'Serum Potassium')
  assert.equal(ep1.updatedAt, '2026-11-03T10:05:00.000Z')

  // Updating existing order by orderId
  const updatedOrder1 = { ...order1, resultValue: '6.9', numericValue: 6.9 }
  const ep2 = addDiagnosticOrder(ep1, updatedOrder1, '2026-11-03T10:10:00.000Z')
  assert.equal(ep2.diagnosticOrders?.length, 1)
  assert.equal(ep2.diagnosticOrders[0].resultValue, '6.9')
  assert.equal(ep2.updatedAt, '2026-11-03T10:10:00.000Z')
})

test('T-CLIN-80: acknowledgeDiagnosticOrder and closeDiagnosticOrder enforce closed-loop action', () => {
  const ep0 = newCareEpisode('ACS Evaluation')
  const tropOrder = {
    orderId: 'ord-trop-01',
    accessionNumber: 'ACC-CARD-102',
    patientId: 'pt-cardio-9',
    orderingClinicianId: 'doc-rizky',
    testName: 'High-Sensitivity Troponin I',
    resultValue: '1.45',
    numericValue: 1.45,
    unit: 'ng/mL',
    referenceRange: '< 0.04',
    severity: 'CRITICAL_EMERGENCY',
    resultTimestamp: '2026-11-03T08:00:00.000Z',
  }

  const ep1 = addDiagnosticOrder(ep0, tropOrder)
  const eval1 = evaluateCareEpisodeDiagnosticSafety(ep1, Date.parse('2026-11-03T08:30:00.000Z'))
  assert.equal(eval1.length, 1)
  assert.equal(eval1[0].status, 'PENDING_CLINICIAN_REVIEW')
  assert.equal(eval1[0].acknowledgementOverdue, false)
  assert.equal(eval1[0].isClosed, false)

  // Clinician acknowledges result
  const ep2 = acknowledgeDiagnosticOrder(ep1, 'ord-trop-01', 'doc-rizky', '2026-11-03T08:35:00.000Z')
  const eval2 = evaluateCareEpisodeDiagnosticSafety(ep2, Date.parse('2026-11-03T08:40:00.000Z'))
  assert.equal(eval2[0].status, 'ACKNOWLEDGED_ACTION_PENDING')
  assert.equal(eval2[0].isClosed, false)
  assert.equal(eval2[0].escalationTarget, 'PRIMARY_CLINICIAN')

  // Clinician closes loop with documented action
  const action = 'Administered DAPT + Heparin, scheduled urgent Cath Lab activation'
  const ep3 = closeDiagnosticOrder(ep2, 'ord-trop-01', 'doc-rizky', action, '2026-11-03T08:45:00.000Z')
  const eval3 = evaluateCareEpisodeDiagnosticSafety(ep3, Date.parse('2026-11-03T09:00:00.000Z'))
  assert.equal(eval3[0].status, 'CLOSED_WITH_CLINICAL_ACTION')
  assert.equal(eval3[0].isClosed, true)
  assert.ok(eval3[0].auditDigest.startsWith('sha256:closed:'))
  assert.equal(ep3.diagnosticOrders?.[0].mandatedClinicalAction, action)
})

test('T-CLIN-80: critical alert escalation triggers stalls and elevates episodeHealth', () => {
  let ep = newCareEpisode('Septic Shock Resuscitation')
  ep = setStageStatus(ep, 'treatment', 'active')

  const lactateOrder = {
    orderId: 'ord-lac-01',
    accessionNumber: 'ACC-ICU-404',
    patientId: 'pt-sepsis-77',
    orderingClinicianId: 'doc-rizky',
    testName: 'Venous Blood Lactate',
    resultValue: '4.8',
    numericValue: 4.8,
    unit: 'mmol/L',
    referenceRange: '0.5 - 2.0',
    severity: 'CRITICAL_EMERGENCY',
    resultTimestamp: '2026-11-03T06:00:00.000Z',
  }

  ep = addDiagnosticOrder(ep, lactateOrder)

  // At 30m: on track (window is 60m)
  const evalTime30m = new Date('2026-11-03T06:30:00.000Z')
  const stalls30m = detectStalls(ep, evalTime30m)
  assert.equal(stalls30m.filter((s) => s.severity === 'stalled').length, 0)
  assert.equal(episodeHealth(ep, evalTime30m), 'on_track')

  // At 75m: unacknowledged >60m -> Escalated to Secondary On-Call
  const evalTime75m = new Date('2026-11-03T07:15:00.000Z')
  const stalls75m = detectStalls(ep, evalTime75m)
  const diagStalls75m = stalls75m.filter((s) => s.reason?.includes('On-Call'))
  assert.equal(diagStalls75m.length, 1)
  assert.equal(diagStalls75m[0].severity, 'stalled')
  assert.equal(episodeHealth(ep, evalTime75m), 'stalled')
  assert.ok(stallReason(diagStalls75m[0]).includes('Secondary On-Call Physician'))

  // At 135m: unacknowledged >120m -> Rapid Response & Safety Officer
  const evalTime135m = new Date('2026-11-03T08:15:00.000Z')
  const stalls135m = detectStalls(ep, evalTime135m)
  const criticalStalls = stalls135m.filter((s) => s.reason?.includes('CRITICAL ALARM'))
  assert.equal(criticalStalls.length, 1)
  assert.equal(criticalStalls[0].severity, 'stalled')
  assert.equal(episodeHealth(ep, evalTime135m), 'stalled')
  assert.ok(stallReason(criticalStalls[0]).includes('Safety Officer & Rapid Response'))
})

test('T-CLIN-85: setReferralHandoff and evaluateCareEpisodeReferralContinuity enforce SLA limits', () => {
  let ep = newCareEpisode('Refractory STEMI')
  const referral = {
    referralId: 'ref-cardio-99',
    patientId: 'pt-stemi-01',
    referringClinicianId: 'doc-rizky',
    receivingFacilityId: 'hosp-harapan-kita',
    specialtyCode: 'CARDIOLOGY',
    primaryDiagnosisIcd10: 'I21.0',
    urgencyTier: 'EMERGENCY_4H',
    submittedAtIso: '2026-11-03T00:00:00.000Z',
    attachedDiagnosticReportIds: ['rep-ekg-01', 'rep-trop-01'],
    triagedAtIso: '2026-11-03T00:30:00.000Z',
  }

  ep = setReferralHandoff(ep, referral)
  assert.equal(ep.referralHandoff?.referralId, 'ref-cardio-99')
  assert.equal(ep.referralRecord?.urgency, 'emergency')
  assert.equal(ep.referralRecord?.status, 'acknowledged')

  // Under SLA: 2 hours elapsed (limit is 4 hours)
  const eval2h = evaluateCareEpisodeReferralContinuity(ep, '2026-11-03T02:00:00.000Z')
  assert.ok(eval2h)
  assert.equal(eval2h.elapsedHours, 2)
  assert.equal(eval2h.slaLimitHours, 4)
  assert.equal(eval2h.isOverdueDropoff, false)
  assert.equal(eval2h.actionRequired, 'NONE_NORMAL_PROGRESSION')

  // Overdue dropoff: 7 hours elapsed (1.5x of 4h SLA = 6h)
  const eval7h = evaluateCareEpisodeReferralContinuity(ep, '2026-11-03T07:00:00.000Z')
  assert.ok(eval7h)
  assert.equal(eval7h.isOverdueDropoff, true)
  assert.equal(eval7h.actionRequired, 'ESCALATE_TO_CARE_COORDINATOR')

  // Reconciled referral returns closed loop
  const reconciledRef = {
    ...referral,
    receivingConsultantId: 'sp-jp-budiman',
    consultationCompletedAtIso: '2026-11-03T04:00:00.000Z',
    consultationSummaryNote: 'Primary PCI successful with 1 DES to LAD, TIMI III flow restored',
    reconciledAtIso: '2026-11-03T05:00:00.000Z',
  }
  ep = setReferralHandoff(ep, reconciledRef)
  const evalReconciled = evaluateCareEpisodeReferralContinuity(ep, '2026-11-03T06:00:00.000Z')
  assert.ok(evalReconciled)
  assert.equal(evalReconciled.status, 'CLOSED_LOOP_RECONCILED')
  assert.equal(evalReconciled.packetCompleteness.isClosedLoopSigned, true)
  assert.equal(evalReconciled.isOverdueDropoff, false)
})

test('T-CLIN-80 & T-CLIN-85: deriveCareJourneyTimelineEvents records diagnostic and referral events', () => {
  let ep = newCareEpisode('DKA Protocol Management')
  const glucOrder = {
    orderId: 'ord-glu-10',
    accessionNumber: 'ACC-END-55',
    patientId: 'pt-dka-03',
    orderingClinicianId: 'doc-rizky',
    testName: 'Point-of-Care Blood Glucose',
    resultValue: '480',
    numericValue: 480,
    unit: 'mg/dL',
    referenceRange: '70 - 140',
    severity: 'CRITICAL_EMERGENCY',
    resultTimestamp: '2026-11-03T02:00:00.000Z',
    acknowledgedAt: '2026-11-03T02:15:00.000Z',
    acknowledgedById: 'doc-rizky',
    closedAt: '2026-11-03T02:25:00.000Z',
    closedById: 'doc-rizky',
    mandatedClinicalAction: 'Initiated IV regular insulin infusion 0.1 U/kg/h with 0.9% NaCl',
  }

  const referral = {
    referralId: 'ref-endo-12',
    patientId: 'pt-dka-03',
    referringClinicianId: 'doc-rizky',
    receivingFacilityId: 'hosp-rscm',
    specialtyCode: 'ENDOCRINOLOGY',
    primaryDiagnosisIcd10: 'E10.1',
    urgencyTier: 'URGENT_48H',
    submittedAtIso: '2026-11-03T03:00:00.000Z',
    attachedDiagnosticReportIds: ['rep-abg-01', 'rep-glu-01'],
    triagedAtIso: '2026-11-03T04:00:00.000Z',
    reconciledAtIso: '2026-11-03T08:00:00.000Z',
    receivingConsultantId: 'sp-pd-pradana',
    consultationSummaryNote: 'Euglycemic DKA resolved, transitioned to subcutaneous basal-bolus regimen',
  }

  ep = addDiagnosticOrder(ep, glucOrder)
  ep = setReferralHandoff(ep, referral)

  const events = deriveCareJourneyTimelineEvents(ep)
  assert.ok(events.length >= 7)

  // Verify diagnostic events
  const diagResultEvt = events.find((e) => e.id.includes('diag-ord-glu-10-result'))
  assert.ok(diagResultEvt)
  assert.equal(diagResultEvt.kind, 'diagnostic_result_routed')
  assert.equal(diagResultEvt.badge, 'Critical Alert')

  const diagAckEvt = events.find((e) => e.id.includes('diag-ord-glu-10-ack'))
  assert.ok(diagAckEvt)
  assert.equal(diagAckEvt.actorId, 'doc-rizky')

  const diagCloseEvt = events.find((e) => e.id.includes('diag-ord-glu-10-closed'))
  assert.ok(diagCloseEvt)
  assert.equal(diagCloseEvt.severity, 'success')
  assert.ok(diagCloseEvt.description?.includes('insulin'))

  // Verify referral events
  const refSubmitEvt = events.find((e) => e.id.includes('ref-ref-endo-12-submitted'))
  assert.ok(refSubmitEvt)
  assert.equal(refSubmitEvt.kind, 'referral_reconciliation_updated')

  const refReconEvt = events.find((e) => e.id.includes('ref-ref-endo-12-reconciled'))
  assert.ok(refReconEvt)
  assert.equal(refReconEvt.severity, 'success')
  assert.equal(refReconEvt.actorId, 'sp-pd-pradana')

  // Verify chronological ordering (newest first)
  for (let i = 0; i < events.length - 1; i++) {
    const tA = Date.parse(events[i].timestamp)
    const tB = Date.parse(events[i + 1].timestamp)
    assert.ok(tA >= tB, `Events must be ordered newest first: ${events[i].id} (${events[i].timestamp}) vs ${events[i + 1].id} (${events[i + 1].timestamp})`)
  }
})
