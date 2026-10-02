import type { ClinicianContinuousCareDigest } from './continuousCareOperatingSystem.ts'

export interface ClinicianCareInboxRow {
  shareId: string
  patientLabel: string
  hasActivePlan: boolean
  planId?: string
  diagnosisLabels: readonly string[]
  latestReportAt?: string
  completion?: 'complete' | 'incomplete'
  missingRequiredCount: number
  triggeredRuleCount: number
  availableSignalCount: number
  measurementAttentionCount: number
  workflowPriority: ClinicianContinuousCareDigest['workflowPriority']
  requiresHumanReview: true
}

const priorityRank: Record<ClinicianCareInboxRow['workflowPriority'], number> = {
  routine: 0,
  'review-today': 1,
  'immediate-human-review': 2,
}

/**
 * Compresses a canonical ContinuousCareDigest into one scan-friendly inbox row.
 * It never invents clinical severity: workflowPriority is copied from the
 * clinician-authored rule engine and remains a work-queue signal only.
 */
export function summarizeClinicianCareDigest(
  shareId: string,
  patientLabel: string,
  digest: ClinicianContinuousCareDigest | null,
): ClinicianCareInboxRow {
  if (!digest) {
    return Object.freeze({
      shareId,
      patientLabel,
      hasActivePlan: false,
      diagnosisLabels: [],
      missingRequiredCount: 0,
      triggeredRuleCount: 0,
      availableSignalCount: 0,
      measurementAttentionCount: 0,
      workflowPriority: 'routine',
      requiresHumanReview: true,
    })
  }

  const latest = digest.latestDailyReport
  const attentionStates = new Set(['triggered', 'stale', 'unit-mismatch', 'source-unverified', 'blocked-by-consent'])

  return Object.freeze({
    shareId,
    patientLabel,
    hasActivePlan: true,
    planId: digest.planId,
    diagnosisLabels: digest.diagnosisRefs.map((item) => item.display),
    latestReportAt: latest?.authoredAt,
    completion: latest?.completion,
    missingRequiredCount: latest?.missingRequiredQuestionIds.length ?? 0,
    triggeredRuleCount: latest?.triggeredRuleIds.length ?? 0,
    availableSignalCount: digest.monitoredSignals.filter((signal) => signal.available).length,
    measurementAttentionCount: digest.measurementRules.filter((rule) => attentionStates.has(rule.state)).length,
    workflowPriority: digest.workflowPriority,
    requiresHumanReview: true,
  })
}

export function sortClinicianCareInbox(
  rows: readonly ClinicianCareInboxRow[],
): ClinicianCareInboxRow[] {
  return [...rows].sort((a, b) => {
    const priority = priorityRank[b.workflowPriority] - priorityRank[a.workflowPriority]
    if (priority !== 0) return priority

    // Incomplete reports should be seen before complete routine reports.
    const missing = b.missingRequiredCount - a.missingRequiredCount
    if (missing !== 0) return missing

    const aTime = a.latestReportAt ? Date.parse(a.latestReportAt) : Number.NEGATIVE_INFINITY
    const bTime = b.latestReportAt ? Date.parse(b.latestReportAt) : Number.NEGATIVE_INFINITY
    if (aTime !== bTime) return bTime - aTime

    return a.patientLabel.localeCompare(b.patientLabel)
  })
}

export const CLINICIAN_INBOX_SAFETY_CONTRACT =
  'Inbox ordering is workflow support from clinician-authored rules, not diagnosis, prognosis, emergency disposition, or autonomous treatment. Every row remains human-review required.'
