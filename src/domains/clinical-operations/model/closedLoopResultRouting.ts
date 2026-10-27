// src/domains/clinical-operations/model/closedLoopResultRouting.ts
// PanaceaMed T-CLIN-80: Closed-Loop Diagnostic Result Closure & High-Consequence Alert Routing Protocol (PAN-EXP-2026-01)

export type DiagnosticResultSeverity = 'CRITICAL_EMERGENCY' | 'ABNORMAL_PRIORITY' | 'ROUTINE_INFORMATIONAL'

export type ClosedLoopClosureStatus =
  | 'PENDING_CLINICIAN_REVIEW'
  | 'ACKNOWLEDGED_ACTION_PENDING'
  | 'CLOSED_WITH_CLINICAL_ACTION'
  | 'ESCALATED_TO_ON_CALL'
  | 'ESCALATED_CRITICAL_SAFETY'

export interface DiagnosticResultOrder {
  orderId: string
  accessionNumber: string
  patientId: string
  orderingClinicianId: string
  testName: string // e.g. "Serum Potassium", "Blood Culture", "Troponin I"
  resultValue: string
  numericValue?: number
  unit?: string
  referenceRange?: string
  severity: DiagnosticResultSeverity
  resultTimestamp: string // ISO-8601
  acknowledgedAt?: string
  acknowledgedById?: string
  closedAt?: string
  closedById?: string
  mandatedClinicalAction?: string
}

export interface ClosedLoopRoutingEvaluation {
  orderId: string
  accessionNumber: string
  severity: DiagnosticResultSeverity
  status: ClosedLoopClosureStatus
  elapsedMinutesSinceResult: number
  maxAllowedAcknowledgementWindowMinutes: number
  acknowledgementOverdue: boolean
  escalationTarget?: 'PRIMARY_CLINICIAN' | 'SECONDARY_ON_CALL' | 'SAFETY_OFFICER_RAPID_RESPONSE'
  auditDigest: string
  safetyActionRequired: string
  isClosed: boolean
}

/**
 * Returns maximum allowed window in minutes before fail-closed escalation triggers.
 */
export function getSeverityWindowMinutes(severity: DiagnosticResultSeverity): number {
  switch (severity) {
    case 'CRITICAL_EMERGENCY':
      return 60 // 1 hour mandatory acknowledgement window
    case 'ABNORMAL_PRIORITY':
      return 1440 // 24 hours mandatory window
    case 'ROUTINE_INFORMATIONAL':
      return 10080 // 7 days window
  }
}

/**
 * Evaluates the real-time closed-loop routing and escalation state of a diagnostic result.
 */
export function evaluateClosedLoopResultRouting(
  order: DiagnosticResultOrder,
  evaluatedAtMs = Date.now()
): ClosedLoopRoutingEvaluation {
  const resultMs = Date.parse(order.resultTimestamp)
  const elapsedMs = Math.max(0, evaluatedAtMs - (Number.isFinite(resultMs) ? resultMs : evaluatedAtMs))
  const elapsedMinutes = Math.floor(elapsedMs / 60000)

  const maxWindow = getSeverityWindowMinutes(order.severity)
  const isOverdue = elapsedMinutes > maxWindow

  // Check if fully closed with clinician action
  if (order.closedAt && order.closedById && order.mandatedClinicalAction?.trim()) {
    return {
      orderId: order.orderId,
      accessionNumber: order.accessionNumber,
      severity: order.severity,
      status: 'CLOSED_WITH_CLINICAL_ACTION',
      elapsedMinutesSinceResult: elapsedMinutes,
      maxAllowedAcknowledgementWindowMinutes: maxWindow,
      acknowledgementOverdue: false,
      auditDigest: `sha256:closed:${order.orderId}:${order.closedById}:${order.closedAt}`,
      safetyActionRequired: 'Result loop fully closed with documented physician action',
      isClosed: true,
    }
  }

  // Check if acknowledged but pending action
  if (order.acknowledgedAt && order.acknowledgedById) {
    return {
      orderId: order.orderId,
      accessionNumber: order.accessionNumber,
      severity: order.severity,
      status: 'ACKNOWLEDGED_ACTION_PENDING',
      elapsedMinutesSinceResult: elapsedMinutes,
      maxAllowedAcknowledgementWindowMinutes: maxWindow,
      acknowledgementOverdue: isOverdue,
      escalationTarget: 'PRIMARY_CLINICIAN',
      auditDigest: `sha256:ack:${order.orderId}:${order.acknowledgedById}:${order.acknowledgedAt}`,
      safetyActionRequired: 'Physician must enter mandated clinical plan to close loop',
      isClosed: false,
    }
  }

  // Unacknowledged: determine escalation tier based on elapsed time and severity
  let status: ClosedLoopClosureStatus = 'PENDING_CLINICIAN_REVIEW'
  let target: 'PRIMARY_CLINICIAN' | 'SECONDARY_ON_CALL' | 'SAFETY_OFFICER_RAPID_RESPONSE' = 'PRIMARY_CLINICIAN'
  let actionRequired = 'Ordering clinician must review and acknowledge result'

  if (order.severity === 'CRITICAL_EMERGENCY') {
    if (elapsedMinutes > 120) {
      status = 'ESCALATED_CRITICAL_SAFETY'
      target = 'SAFETY_OFFICER_RAPID_RESPONSE'
      actionRequired = 'CRITICAL ALARM: Unacknowledged >2h; dispatching Clinical Safety Officer & Rapid Response'
    } else if (elapsedMinutes > 60) {
      status = 'ESCALATED_TO_ON_CALL'
      target = 'SECONDARY_ON_CALL'
      actionRequired = 'URGENT ESCALATION: Unacknowledged >60m; rerouted to Secondary On-Call Physician'
    } else {
      status = 'PENDING_CLINICIAN_REVIEW'
      target = 'PRIMARY_CLINICIAN'
      actionRequired = 'STAT Review Required: High-consequence critical diagnostic value'
    }
  } else if (order.severity === 'ABNORMAL_PRIORITY') {
    if (isOverdue) {
      status = 'ESCALATED_TO_ON_CALL'
      target = 'SECONDARY_ON_CALL'
      actionRequired = 'Escalation: Abnormal result unreviewed >24h; routed to coverage pool'
    } else {
      status = 'PENDING_CLINICIAN_REVIEW'
      target = 'PRIMARY_CLINICIAN'
      actionRequired = 'Priority review required within 24 hours'
    }
  }

  return {
    orderId: order.orderId,
    accessionNumber: order.accessionNumber,
    severity: order.severity,
    status,
    elapsedMinutesSinceResult: elapsedMinutes,
    maxAllowedAcknowledgementWindowMinutes: maxWindow,
    acknowledgementOverdue: isOverdue,
    escalationTarget: target,
    auditDigest: `sha256:pending:${order.orderId}:${status}:${elapsedMinutes}m`,
    safetyActionRequired: actionRequired,
    isClosed: false,
  }
}
