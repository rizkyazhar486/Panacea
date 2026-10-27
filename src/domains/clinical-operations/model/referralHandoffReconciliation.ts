// src/domains/clinical-operations/model/referralHandoffReconciliation.ts
// T-CLIN-85: Clinical Referral Handoff Protocol & Diagnostic Reconciliation Loop

import { createHash } from 'node:crypto'

export type ReferralUrgencyTier = 'EMERGENCY_4H' | 'URGENT_48H' | 'ROUTINE_14D'

export type ReferralHandoffStatus =
  | 'SUBMITTED_PENDING_TRIAGE'
  | 'TRIAGED_ACCEPTED'
  | 'APPOINTMENT_SCHEDULED'
  | 'ENCOUNTER_COMPLETED_PENDING_REPORT'
  | 'CLOSED_LOOP_RECONCILED'
  | 'ESCALATED_OVERDUE_DROPOFF'

export interface ReferralHandoffOrder {
  referralId: string
  patientId: string
  referringClinicianId: string
  receivingFacilityId: string
  specialtyCode: string // e.g. 'CARDIOLOGY', 'ONCOLOGY', 'NEPHROLOGY'
  primaryDiagnosisIcd10: string
  urgencyTier: ReferralUrgencyTier
  submittedAtIso: string
  attachedDiagnosticReportIds: string[]
  triagedAtIso?: string
  scheduledAppointmentAtIso?: string
  consultationCompletedAtIso?: string
  receivingConsultantId?: string
  consultationSummaryNote?: string
  reconciledAtIso?: string
}

export interface ReferralReconciliationEvaluation {
  referralId: string
  status: ReferralHandoffStatus
  elapsedHours: number
  slaLimitHours: number
  isOverdueDropoff: boolean
  actionRequired: 'NONE_NORMAL_PROGRESSION' | 'REMIND_RECEIVING_FACILITY' | 'ESCALATE_TO_CARE_COORDINATOR' | 'IMMEDIATE_CLINICAL_OUTREACH'
  packetCompleteness: {
    hasVerifiedDiagnosis: boolean
    hasAttachedDiagnostics: boolean
    hasReceivingSpecialistAssigned: boolean
    isClosedLoopSigned: boolean
  }
  auditDigestSha256: string
}

const SLA_HOURS_MAP: Record<ReferralUrgencyTier, number> = {
  EMERGENCY_4H: 4,
  URGENT_48H: 48,
  ROUTINE_14D: 336, // 14 * 24 = 336 hours
}

/**
 * Evaluates referral handoff continuity, detects drop-off stalls, and enforces closed-loop specialist reconciliation.
 */
export function evaluateReferralHandoffContinuity(
  order: ReferralHandoffOrder,
  nowIso: string = new Date().toISOString()
): ReferralReconciliationEvaluation {
  const submittedTime = new Date(order.submittedAtIso).getTime()
  const currentTime = new Date(nowIso).getTime()
  const elapsedHours = Number(Math.max(0, (currentTime - submittedTime) / (1000 * 60 * 60)).toFixed(1))
  const slaLimit = SLA_HOURS_MAP[order.urgencyTier]

  const hasDiagnosis = Boolean(order.primaryDiagnosisIcd10 && order.primaryDiagnosisIcd10.trim().length > 0)
  const hasDiagnostics = Array.isArray(order.attachedDiagnosticReportIds) && order.attachedDiagnosticReportIds.length > 0
  const hasConsultant = Boolean(order.receivingConsultantId && order.receivingConsultantId.trim().length > 0)
  const isReconciled = Boolean(order.reconciledAtIso && order.receivingConsultantId && order.consultationSummaryNote)

  let status: ReferralHandoffStatus = 'SUBMITTED_PENDING_TRIAGE'
  let isOverdue = false
  let action: 'NONE_NORMAL_PROGRESSION' | 'REMIND_RECEIVING_FACILITY' | 'ESCALATE_TO_CARE_COORDINATOR' | 'IMMEDIATE_CLINICAL_OUTREACH' = 'NONE_NORMAL_PROGRESSION'

  if (isReconciled) {
    status = 'CLOSED_LOOP_RECONCILED'
    action = 'NONE_NORMAL_PROGRESSION'
  } else if (order.consultationCompletedAtIso) {
    status = 'ENCOUNTER_COMPLETED_PENDING_REPORT'
    const daysSinceVisit = (currentTime - new Date(order.consultationCompletedAtIso).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceVisit > 3.0) {
      status = 'ESCALATED_OVERDUE_DROPOFF'
      isOverdue = true
      action = 'REMIND_RECEIVING_FACILITY'
    }
  } else if (order.scheduledAppointmentAtIso) {
    status = 'APPOINTMENT_SCHEDULED'
    if (elapsedHours > slaLimit * 1.5) {
      status = 'ESCALATED_OVERDUE_DROPOFF'
      isOverdue = true
      action = 'ESCALATE_TO_CARE_COORDINATOR'
    }
  } else if (order.triagedAtIso) {
    status = 'TRIAGED_ACCEPTED'
    if (elapsedHours > slaLimit) {
      status = 'ESCALATED_OVERDUE_DROPOFF'
      isOverdue = true
      action = 'ESCALATE_TO_CARE_COORDINATOR'
    }
  } else {
    // Still in submitted pending triage
    if (elapsedHours > slaLimit) {
      status = 'ESCALATED_OVERDUE_DROPOFF'
      isOverdue = true
      action = order.urgencyTier === 'EMERGENCY_4H' ? 'IMMEDIATE_CLINICAL_OUTREACH' : 'ESCALATE_TO_CARE_COORDINATOR'
    }
  }

  // Cryptographic audit digest
  const digestPayload = JSON.stringify({
    referralId: order.referralId,
    patientId: order.patientId,
    status,
    elapsedHours,
    isOverdue,
    reconciledAtIso: order.reconciledAtIso ?? null,
  })
  const auditDigestSha256 = createHash('sha256').update(digestPayload).digest('hex')

  return {
    referralId: order.referralId,
    status,
    elapsedHours,
    slaLimitHours: slaLimit,
    isOverdueDropoff: isOverdue,
    actionRequired: action,
    packetCompleteness: {
      hasVerifiedDiagnosis: hasDiagnosis,
      hasAttachedDiagnostics: hasDiagnostics,
      hasReceivingSpecialistAssigned: hasConsultant,
      isClosedLoopSigned: isReconciled,
    },
    auditDigestSha256,
  }
}
