import type { ClinicalReviewLedger } from './clinicalReviewWorkflow.ts'
import type { LongitudinalPatientState } from './panaceaLongitudinalState.ts'
import type { PurposeConsentLedger } from './purposeConsentLedger.ts'

export interface LongitudinalAuditManifest {
  subjectId: string
  exportedAt: string
  stateRevision: number
  counts: {
    events: number
    metrics: number
    provenanceSources: number
    consentDecisions: number
    clinicalReviewDecisions: number
  }
  coverage: {
    eventsWithSourceId: number
    eventsWithConfidence: number
    eventsWithConsentEnvelope: number
    eventsWithReviewState: number
    provenanceCoverageFraction: number
    governanceMetadataCoverageFraction: number
  }
  events: readonly {
    id: string
    metric: string
    domain: string
    recordedAt: string
    confidence: number
    provenance: {
      sourceKind: string
      sourceId: string
      capturedAt: string
      receivedAt: string
      method?: string
      version?: string
    }
    consentPurposes: readonly string[]
    captureConsentGranted: boolean
    reviewState: string
  }[]
  consentDecisions: readonly {
    id: string
    purpose: string
    action: string
    decidedAt: string
    policyVersion?: string
    source?: string
  }[]
  clinicalReviewDecisions: readonly {
    id: string
    eventId: string
    outcome: string
    reviewerId: string
    reviewedAt: string
    rationaleCode?: string
  }[]
  boundaries: {
    containsRawClinicalNarrative: false
    containsAuthenticationSecrets: false
    provesClinicalValidity: false
    provesRegulatoryCompliance: false
  }
}

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

/**
 * Export a deterministic governance/provenance manifest without raw clinical
 * narrative or credentials. Coverage formulas are descriptive audit completeness:
 *
 * `ProvenanceCoverage = events with nonblank sourceId / total events`
 * `GovernanceMetadataCoverage = events with consent+review metadata / total events`
 *
 * These values do not establish clinical validity, security certification, or
 * regulatory compliance.
 */
export function buildLongitudinalAuditManifest(
  state: LongitudinalPatientState,
  consentLedger: PurposeConsentLedger,
  reviewLedger: ClinicalReviewLedger,
  exportedAt = new Date().toISOString(),
): LongitudinalAuditManifest {
  parseIso(exportedAt, 'exportedAt')

  const events = Object.values(state.eventsById)
    .sort((left, right) => Date.parse(left.recordedAt) - Date.parse(right.recordedAt) || left.id.localeCompare(right.id))
    .map((event) => ({
      id: event.id,
      metric: event.metric,
      domain: event.domain,
      recordedAt: event.recordedAt,
      confidence: event.confidence,
      provenance: { ...event.provenance },
      consentPurposes: [...event.consent.purposes].sort(),
      captureConsentGranted: event.consent.granted,
      reviewState: event.review.state,
    }))

  const consentDecisions = Object.values(consentLedger.decisionsById)
    .filter((decision) => decision.subjectId === state.subjectId)
    .sort((left, right) => Date.parse(left.decidedAt) - Date.parse(right.decidedAt) || left.id.localeCompare(right.id))
    .map((decision) => ({
      id: decision.id,
      purpose: decision.purpose,
      action: decision.action,
      decidedAt: decision.decidedAt,
      policyVersion: decision.policyVersion,
      source: decision.source,
    }))

  const clinicalReviewDecisions = Object.values(reviewLedger.decisionsById)
    .filter((decision) => decision.subjectId === state.subjectId)
    .sort((left, right) => Date.parse(left.reviewedAt) - Date.parse(right.reviewedAt) || left.id.localeCompare(right.id))
    .map((decision) => ({
      id: decision.id,
      eventId: decision.eventId,
      outcome: decision.outcome,
      reviewerId: decision.reviewerId,
      reviewedAt: decision.reviewedAt,
      rationaleCode: decision.rationaleCode,
    }))

  const total = events.length
  const eventsWithSourceId = events.filter((event) => event.provenance.sourceId.trim()).length
  const eventsWithConfidence = events.filter((event) => Number.isFinite(event.confidence) && event.confidence >= 0 && event.confidence <= 1).length
  const eventsWithConsentEnvelope = events.filter((event) => Array.isArray(event.consentPurposes)).length
  const eventsWithReviewState = events.filter((event) => Boolean(event.reviewState)).length
  const governed = events.filter((event) => Array.isArray(event.consentPurposes) && Boolean(event.reviewState)).length

  return {
    subjectId: state.subjectId,
    exportedAt,
    stateRevision: state.revision,
    counts: {
      events: total,
      metrics: Object.keys(state.metricEventIds).length,
      provenanceSources: new Set(events.map((event) => event.provenance.sourceId)).size,
      consentDecisions: consentDecisions.length,
      clinicalReviewDecisions: clinicalReviewDecisions.length,
    },
    coverage: {
      eventsWithSourceId,
      eventsWithConfidence,
      eventsWithConsentEnvelope,
      eventsWithReviewState,
      provenanceCoverageFraction: total ? eventsWithSourceId / total : 1,
      governanceMetadataCoverageFraction: total ? governed / total : 1,
    },
    events,
    consentDecisions,
    clinicalReviewDecisions,
    boundaries: {
      containsRawClinicalNarrative: false,
      containsAuthenticationSecrets: false,
      provesClinicalValidity: false,
      provesRegulatoryCompliance: false,
    },
  }
}
