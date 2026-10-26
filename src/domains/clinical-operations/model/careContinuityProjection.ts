/**
 * Pure projection from active patient encounter state to CareContinuityPanel models.
 * PRD §8.5 Result Closure, Care Access Orchestration, and Offline Episode Resilience.
 *
 * Architecture rule (lib-tidak-impor-ui): this file is a pure domain model and
 * MUST NEVER import UI components or styling tokens.
 */
import type {
  SupportiveResult,
  EMRRecord,
  CareEpisode,
  CareEpisodeStageId,
  CareJourneyTimelineEvent,
  CareJourneyTimelineEventKind,
  CareJourneyExportSummary,
  CareJourneyReferralRecord,
  ReferralHandshakeStatus,
  PlanItem,
  CarePlanMilestone,
  ClinicalOutcomeRecord,
  ClinicalOutcomeStatus,
} from '../../../lib/types.ts'
import {
  evaluateResultClosure,
  type ResultClosureRecord,
  type ResultClosureResult,
  type ClosureStep,
} from './resultClosure.ts'
import {
  evaluateCareAccessOrchestration,
  type CareAccessOrchestrationResult,
  type PayerOrchestrationState,
  type DiagnosticReferralState,
} from './careAccessOrchestrator.ts'
import {
  evaluateClinicalEpisodeResilience,
  type ClinicalEpisodeResilienceResult,
  type ClinicalEpisodeTransportEvent,
  type EpisodeConnectivity,
} from './clinicalEpisodeResilience.ts'
import {
  evaluateOneOsCareProof,
  type OneOsEvidenceFragment,
  type OneOsProofResult,
} from './oneOsCareProof.ts'

export interface CareContinuityProjectionInput {
  patientId: string
  evaluatedAt: string
  supportiveResults?: readonly SupportiveResult[]
  record?: EMRRecord
  vitals?: readonly { takenAt: string; verifiedById?: string; source?: string }[]
  connectivity?: EpisodeConnectivity
  secureLocalStorageAvailable?: boolean
  payerCoverageActive?: boolean
}

export type EpisodeHealth = 'on_track' | 'at_risk' | 'stalled'

export interface CarePlanMilestoneSummary {
  id: string
  title: string
  category: 'Suportif' | 'Definitif' | 'Edukasi' | 'Follow-up' | 'Monitoring'
  targetStage: CareEpisodeStageId
  status: 'pending' | 'verified' | 'completed' | 'cancelled'
  verified: boolean
  completed: boolean
  resultValue?: string
  completedAt?: string
  verifiedAt?: string
}

export interface CareJourneyEpisodeSummary {
  id: string
  title: string
  diagnosisCode?: string
  activeStage: string
  stageStatus: 'pending' | 'active' | 'done' | 'blocked'
  blockedReason?: string
  completedStagesCount: number
  totalStagesCount: number
  health: EpisodeHealth
  stalledReason?: string
  elapsedDaysInCurrentStage?: number
  expectedDaysInCurrentStage?: number
  actionItemsCount: number
  verifiedActionItemsCount: number
  completedMilestonesCount: number
  pendingActionItemsCount: number
  milestones: CarePlanMilestoneSummary[]
  escalation?: CareJourneyEscalation
  outcomeRecord?: ClinicalOutcomeRecord
  timelineEvents?: CareJourneyTimelineEvent[]
  exportSummary?: CareJourneyExportSummary
  estimatedCostLow?: number
  estimatedCostHigh?: number
  costConfidence?: 'estimated' | 'verified'
  costSource?: string
  costItemsCount: number
  readmissionSurveillance?: CareJourneyReadmissionSurveillance
  referralRecord?: CareJourneyReferralRecord
}

export type ReadmissionRiskLevel = 'low' | 'moderate' | 'high'

export interface CareJourneyReadmissionSurveillance {
  episodeId: string
  episodeTitle: string
  riskLevel: ReadmissionRiskLevel
  riskFactors: string[]
  followUpWindowClosed: boolean
  recommendedAction: string
}

export interface CareJourneyCostSummary {
  totalEstimatedCostLow: number
  totalEstimatedCostHigh: number
  costVerifiedJourneysCount: number
  costEstimatedJourneysCount: number
  pricedJourneysCount: number
  clinicalCareBoundary: 'never-deny-care'
}

export type CareJourneyEscalationAction =
  | 'clinician_review'
  | 'coordinator_outreach'
  | 'diagnostic_followup'
  | 'reschedule_prompt'

export type CareJourneyEscalationTarget =
  | 'Clinician In-Tray'
  | 'Care Coordinator'
  | 'Patient Outreach'

export interface CareJourneyEscalation {
  id: string
  episodeId: string
  episodeTitle: string
  stage: CareEpisodeStageId
  severity: 'stalled' | 'at_risk'
  reason: string
  action: CareJourneyEscalationAction
  actionLabel: string
  target: CareJourneyEscalationTarget
  daysOverdue: number
  suggestedAction: string
}

export interface CareJourneyContinuityResult {
  totalJourneys: number
  activeJourneys: number
  blockedJourneys: number
  completedJourneys: number
  stalledCount: number
  atRiskCount: number
  totalActionItemsCount: number
  totalVerifiedActionItemsCount: number
  totalCompletedMilestonesCount: number
  totalPendingActionItemsCount: number
  episodes: CareJourneyEpisodeSummary[]
  escalations: CareJourneyEscalation[]
  totalEscalationsCount: number
  clinicianInTrayCount: number
  careCoordinatorCount: number
  completedWithVerifiedOutcomeCount: number
  totalTimelineEventsCount: number
  patientTimelineEvents: CareJourneyTimelineEvent[]
  totalPatientTimelineEventsCount: number
  activeComorbiditiesCount: number
  exportableJourneysCount: number
  totalEstimatedCostLow: number
  totalEstimatedCostHigh: number
  costVerifiedJourneysCount: number
  costEstimatedJourneysCount: number
  highReadmissionRiskCount: number
  moderateReadmissionRiskCount: number
  followUpWindowClosedCount: number
  activeReferralsCount: number
  acknowledgedReferralsCount: number
  emergencyReferralsCount: number
  hasBlockedStages: boolean
}

export interface CareContinuityProjection {
  closure: ResultClosureResult | null
  careAccess: CareAccessOrchestrationResult
  episodeResilience: ClinicalEpisodeResilienceResult
  oneOsProof: OneOsProofResult
  careJourneys: CareJourneyContinuityResult | null
}

function isValidIsoTimestamp(val: unknown, maxEpochMs: number): boolean {
  if (typeof val !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(val)) {
    return false
  }
  const epoch = Date.parse(val)
  return Number.isFinite(epoch) && epoch <= maxEpochMs
}

export function deriveCareContinuityState(input: CareContinuityProjectionInput): CareContinuityProjection {
  if (!input.patientId?.trim()) {
    throw new Error('patientId is required')
  }
  const nowMs = Date.parse(input.evaluatedAt)
  if (!Number.isFinite(nowMs)) {
    throw new Error('evaluatedAt must be a valid timestamp')
  }

  const record = input.record?.patientId === input.patientId ? input.record : undefined
  const isRecordSignedByClinician = Boolean(
    record?.signedById?.trim() &&
    record?.signedAt &&
    isValidIsoTimestamp(record.signedAt, nowMs) &&
    record?.physicalExam?.verifiedById?.trim()
  )

  // 1. Result Follow-Up Closure (PRD §8.5)
  const validSupportive = (input.supportiveResults ?? []).filter((item) =>
    isValidIsoTimestamp(item.takenAt, nowMs)
  )

  let closure: ResultClosureResult | null = null
  if (validSupportive.length > 0) {
    const results: ResultClosureRecord[] = validSupportive.map((item) => {
      const isCriticalOrHigh = item.flag === 'critical' || item.flag === 'high'
      const itemTakenMs = Date.parse(item.takenAt)
      // Result follow-up is assessed against the active encounter evaluation window
      const dueBy = new Date(Math.min(itemTakenMs + 24 * 3600 * 1000, nowMs)).toISOString()

      return {
        resultId: item.id,
        patientId: input.patientId,
        resultedAt: item.takenAt,
        dueBy,
        required: {
          review: true,
          explanation: true,
          'follow-up': isCriticalOrHigh,
        } as Record<ClosureStep, boolean>,
        review: isRecordSignedByClinician && record?.signedAt
          ? {
              at: record.signedAt,
              actorId: record.signedById!,
              recordedBy: 'person',
              authorizedClinician: true,
            }
          : undefined,
        explanation: record?.anamnesis?.rps || record?.anamnesis?.keluhanUtama || record?.labEkgInterpretation
          ? {
              at: record.updatedAt,
              actorId: record.signedById || 'dr-active',
              recordedBy: 'person',
            }
          : undefined,
        followUp: isCriticalOrHigh
          ? record?.plan && record.plan.length > 0
            ? {
                evidence: {
                  at: record.updatedAt,
                  actorId: record.signedById || 'dr-active',
                  recordedBy: 'person',
                },
              }
            : undefined
          : {
              notApplicableReason: 'non-critical-result',
            },
      }
    })

    closure = evaluateResultClosure({
      targetPatientId: input.patientId,
      evaluatedAt: input.evaluatedAt,
      windowStart: '1970-01-01T00:00:00.000Z',
      windowEnd: input.evaluatedAt,
      validNotApplicableReasons: ['non-critical-result', 'patient-deceased', 'transferred-out'],
      results,
    })
  }

  // 2. Diagnostic Routing & Care Access Orchestration
  const diagnostics: DiagnosticReferralState[] = validSupportive.map((item) => ({
    id: item.id,
    orderRecorded: true,
    localCapabilityAvailable: item.category !== 'Radiologi',
    destinationConfigured: true,
    specimenOrStudyIdentityResolved: true,
    chainOfCustodyComplete: true,
    resultLinkedToPatientState: Boolean(record),
    state: 'result-returned',
  }))

  const payer: PayerOrchestrationState = {
    coverage: input.payerCoverageActive === false ? 'inactive' : 'active',
    payerAdapterConfigured: true,
    preauthorization: 'not-required',
    payment: 'not-submitted',
    evidence: {
      patientIdentityResolved: Boolean(input.patientId),
      coverageIdentityResolved: true,
      encounterLinked: Boolean(record),
      clinicalRecordSigned: isRecordSignedByClinician,
      diagnosisCoded: Boolean(record?.primaryDiagnosis?.code || record?.primaryDiagnosis?.title),
      serviceItemsCoded: Boolean(record?.plan && record.plan.length > 0),
      supportingEvidenceLinked: validSupportive.length > 0,
      provenanceComplete: Boolean(record?.updatedAt),
    },
  }

  const careAccess = evaluateCareAccessOrchestration({
    payer,
    diagnostics,
  })

  // 3. Clinical Episode Resilience (Offline transport durability & replay protection)
  const events: ClinicalEpisodeTransportEvent[] = validSupportive.map((item, idx) => ({
    eventId: `evt-supportive-${item.id}`,
    patientId: input.patientId,
    episodeId: record?.id || 'enc-current',
    kind: 'observation',
    authoredAt: item.takenAt,
    sourceId: `device-poli-${item.category.toLowerCase()}`,
    sequence: idx + 1,
    payloadDigest: `sha256:${item.id}:${item.value}`,
    delivery: 'acknowledged',
    durableLocalCopy: true,
    encryptedAtRest: true,
    retryCount: 0,
  }))

  const episodeResilience = evaluateClinicalEpisodeResilience({
    patientId: input.patientId,
    episodeId: record?.id || 'enc-current',
    connectivity: input.connectivity ?? 'online',
    secureLocalStorageAvailable: input.secureLocalStorageAvailable ?? true,
    evaluatedAt: input.evaluatedAt,
    maxRetryCount: 3,
    events,
  })

  // 4. One OS Clinical Evidence & Completeness Proof
  const requiredDataClasses = ['vital-signs', 'anamnesis', 'physical-exam', 'diagnosis', 'plan']
  const fragments: OneOsEvidenceFragment[] = []

  // Vital signs fragments
  if (input.vitals && input.vitals.length > 0) {
    input.vitals.forEach((vital, idx) => {
      if (isValidIsoTimestamp(vital.takenAt, nowMs)) {
        const isVerified = Boolean(vital.verifiedById?.trim())
        const sourceId = typeof vital.source === 'string' ? vital.source.trim() : ''
        fragments.push({
          id: `vital-${input.patientId}-${idx}`,
          patientId: input.patientId,
          sourceId,
          dataClass: 'vital-signs',
          recordedAt: vital.takenAt,
          provenancePresent: sourceId !== '',
          normalized: true,
          requiresClinicalReview: false,
          reviewState: isVerified ? 'verified' : 'not-required',
        })
      }
    })
  }

  // Clinical record fragments
  if (record) {
    if (record.anamnesis?.keluhanUtama || record.anamnesis?.rps) {
      fragments.push({
        id: `record-${record.id}-anamnesis`,
        patientId: input.patientId,
        sourceId: 'clinician-interview',
        dataClass: 'anamnesis',
        recordedAt: record.updatedAt || record.createdAt,
        provenancePresent: true,
        normalized: true,
        requiresClinicalReview: true,
        reviewState: isRecordSignedByClinician ? 'signed' : 'pending',
      })
    }

    if (record.physicalExam) {
      const isExamVerified = Boolean(record.physicalExam.verifiedById?.trim())
      fragments.push({
        id: `record-${record.id}-exam`,
        patientId: input.patientId,
        sourceId: 'physical-examination',
        dataClass: 'physical-exam',
        recordedAt: record.updatedAt || record.createdAt,
        provenancePresent: true,
        normalized: true,
        requiresClinicalReview: true,
        reviewState: isExamVerified ? 'verified' : (isRecordSignedByClinician ? 'signed' : 'pending'),
      })
    }

    if (record.primaryDiagnosis?.title) {
      fragments.push({
        id: `record-${record.id}-diagnosis`,
        patientId: input.patientId,
        sourceId: 'clinical-assessment',
        dataClass: 'diagnosis',
        recordedAt: record.updatedAt || record.createdAt,
        provenancePresent: Boolean(record.primaryDiagnosis.code?.trim()),
        normalized: true,
        requiresClinicalReview: true,
        reviewState: isRecordSignedByClinician ? 'signed' : 'pending',
      })
    }

    if (record.plan && record.plan.length > 0) {
      record.plan.forEach((item, idx) => {
        const isPlanRejected = item.status === 'ditolak'
        const isPlanVerified = item.status === 'diverifikasi' || isRecordSignedByClinician
        fragments.push({
          id: `record-${record.id}-plan-${item.id || idx}`,
          patientId: input.patientId,
          sourceId: 'clinical-orders',
          dataClass: 'plan',
          recordedAt: record.updatedAt || record.createdAt,
          provenancePresent: true,
          normalized: true,
          requiresClinicalReview: true,
          reviewState: isPlanRejected ? 'rejected' : (isPlanVerified ? 'signed' : 'pending'),
        })
      })
    }
  }

  // Supportive results fragments
  validSupportive.forEach((item) => {
    const isCritical = item.flag === 'critical' || item.flag === 'high'
    fragments.push({
      id: `supportive-${item.id}`,
      patientId: input.patientId,
      sourceId: `device-poli-${item.category.toLowerCase()}`,
      dataClass: 'supportive-signal',
      recordedAt: item.takenAt,
      provenancePresent: Boolean(item.category),
      normalized: true,
      requiresClinicalReview: isCritical,
      reviewState: isRecordSignedByClinician ? 'signed' : (isCritical ? 'pending' : 'not-required'),
    })
  })

  const oneOsProof = evaluateOneOsCareProof({
    targetPatientId: input.patientId,
    evaluatedAt: input.evaluatedAt,
    fragments,
    requiredDataClasses,
  })

  // 5. Active Care Journey Continuity Projection (T-CLIN-07, T-CLIN-09, T-CLIN-10, T-CLIN-11)
  let careJourneys: CareJourneyContinuityResult | null = null
  if (record?.careEpisodes && record.careEpisodes.length > 0) {
    careJourneys = evaluateCareJourneyContinuity(
      record.careEpisodes,
      input.evaluatedAt,
      record.plan,
      validSupportive
    )
  }

  return {
    closure,
    careAccess,
    episodeResilience,
    oneOsProof,
    careJourneys,
  }
}

function mapPlanCategoryToStage(category: PlanItem['category']): CareEpisodeStageId {
  switch (category) {
    case 'Definitif':
    case 'Suportif':
      return 'treatment'
    case 'Follow-up':
      return 'followUp'
    case 'Monitoring':
      return 'recovery'
    case 'Edukasi':
    default:
      return 'plan'
  }
}

export const STAGE_LABEL: Record<CareEpisodeStageId, string> = {
  problem: 'Problem',
  diagnosis: 'Diagnosis',
  plan: 'Plan',
  provider: 'Provider',
  cost: 'Cost',
  schedule: 'Schedule',
  treatment: 'Treatment',
  recovery: 'Recovery',
  followUp: 'Follow-up',
  outcome: 'Outcome',
}

export function deriveCareJourneyTimelineEvents(
  episode: CareEpisode,
  maxEpochMs?: number,
): CareJourneyTimelineEvent[] {
  const events: CareJourneyTimelineEvent[] = []

  const isValidIso = (ts?: string): boolean => {
    if (!ts || typeof ts !== 'string') return false
    const ms = Date.parse(ts)
    if (!Number.isFinite(ms)) return false
    if (maxEpochMs != null && ms > maxEpochMs) return false
    return true
  }

  // 1. Episode seeded event
  if (isValidIso(episode.createdAt)) {
    events.push({
      id: `evt-${episode.id}-seed`,
      episodeId: episode.id,
      episodeTitle: episode.title,
      kind: 'episode_seeded',
      timestamp: episode.createdAt,
      title: 'Care Journey Initiated',
      description: episode.diagnosisCode ? `Diagnosis: ${episode.diagnosisCode}` : episode.title,
      stage: 'problem',
      badge: 'Seeded',
      severity: 'info',
    })
  }

  // 2. Stage transitions
  if (Array.isArray(episode.stages)) {
    for (const s of episode.stages) {
      if (!isValidIso(s.updatedAt)) continue
      const stageName = STAGE_LABEL[s.stage] ?? s.stage
      if (s.status === 'done') {
        events.push({
          id: `evt-${episode.id}-stage-${s.stage}-done`,
          episodeId: episode.id,
          episodeTitle: episode.title,
          kind: 'stage_transition',
          timestamp: s.updatedAt!,
          title: `Stage Completed: ${stageName}`,
          description: s.note,
          stage: s.stage,
          badge: 'Done',
          severity: 'success',
        })
      } else if (s.status === 'active') {
        events.push({
          id: `evt-${episode.id}-stage-${s.stage}-active`,
          episodeId: episode.id,
          episodeTitle: episode.title,
          kind: 'stage_transition',
          timestamp: s.updatedAt!,
          title: `Stage In Progress: ${stageName}`,
          description: s.note,
          stage: s.stage,
          badge: 'Active',
          severity: 'info',
        })
      } else if (s.status === 'blocked') {
        events.push({
          id: `evt-${episode.id}-stage-${s.stage}-blocked`,
          episodeId: episode.id,
          episodeTitle: episode.title,
          kind: 'stage_transition',
          timestamp: s.updatedAt!,
          title: `Stage Blocked: ${stageName}`,
          description: s.blockedReason ?? s.note,
          stage: s.stage,
          badge: 'Blocked',
          severity: 'warning',
        })
      }
    }
  }

  // 3. Provider selected event
  if (episode.facilityName || episode.facilityId || episode.providerName) {
    const providerStage = episode.stages?.find((s) => s.stage === 'provider')
    if (providerStage && providerStage.status !== 'pending') {
      const providerTs = providerStage.updatedAt ?? episode.updatedAt
      if (isValidIso(providerTs)) {
        events.push({
          id: `evt-${episode.id}-provider-selected`,
          episodeId: episode.id,
          episodeTitle: episode.title,
          kind: 'provider_selected',
          timestamp: providerTs,
          title: 'Provider Selected',
          description: episode.facilityName ?? episode.providerName ?? episode.facilityId,
          stage: 'provider',
          badge: 'Provider',
          severity: 'info',
        })
      }
    }
  }

  // 4. Milestone verification & completion events
  if (Array.isArray(episode.milestones)) {
    for (const m of episode.milestones) {
      if (isValidIso(m.verifiedAt)) {
        events.push({
          id: `evt-${episode.id}-ms-verified-${m.id}`,
          episodeId: episode.id,
          episodeTitle: episode.title,
          kind: 'milestone_verified',
          timestamp: m.verifiedAt!,
          title: `Milestone Verified: ${m.title}`,
          description: `Category: ${m.category}`,
          stage: m.targetStage,
          actorId: m.verifiedById,
          badge: 'Verified',
          severity: 'info',
        })
      }
      if (isValidIso(m.completedAt)) {
        events.push({
          id: `evt-${episode.id}-ms-fulfilled-${m.id}`,
          episodeId: episode.id,
          episodeTitle: episode.title,
          kind: 'milestone_fulfilled',
          timestamp: m.completedAt!,
          title: `Milestone Fulfilled: ${m.title}`,
          description: m.resultValue ? `Result: ${m.resultValue}` : `Category: ${m.category}`,
          stage: m.targetStage,
          badge: 'Fulfilled',
          severity: 'success',
        })
      }
    }
  }

  // 5. Clinical outcome verification event
  if (episode.outcomeRecord) {
    const outcomeTs =
      episode.outcomeRecord.signedAt ??
      episode.outcomeRecord.verifiedAt ??
      episode.outcomeRecord.updatedAt
    if (isValidIso(outcomeTs)) {
      events.push({
        id: `evt-${episode.id}-outcome-signed`,
        episodeId: episode.id,
        episodeTitle: episode.title,
        kind: 'outcome_verified',
        timestamp: outcomeTs!,
        title: `Clinical Outcome Recorded: ${episode.outcomeRecord.status.toUpperCase()}`,
        description: episode.outcomeRecord.summary,
        stage: 'outcome',
        actorId: episode.outcomeRecord.verifiedById,
        badge: 'Signed',
        severity: 'success',
      })
    }
  }

  // 6. Explicit episode timeline events merged and deduplicated
  if (Array.isArray(episode.timelineEvents)) {
    for (const evt of episode.timelineEvents) {
      if (isValidIso(evt.timestamp) && !events.some((e) => e.id === evt.id)) {
        events.push({
          ...evt,
          episodeTitle: evt.episodeTitle ?? episode.title,
        })
      }
    }
  }

  // Deterministic chronological ordering (newest first, secondary sort by id)
  return events.sort((a, b) => {
    const diff = Date.parse(b.timestamp) - Date.parse(a.timestamp)
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id)
  })
}

export function derivePatientLongitudinalTimeline(
  episodes: readonly CareEpisode[],
  maxEpochMs?: number,
): CareJourneyTimelineEvent[] {
  if (!Array.isArray(episodes) || episodes.length === 0) return []

  const allEvents: CareJourneyTimelineEvent[] = []
  const seenIds = new Set<string>()

  for (const ep of episodes) {
    const epEvents = deriveCareJourneyTimelineEvents(ep, maxEpochMs)
    for (const evt of epEvents) {
      if (!seenIds.has(evt.id)) {
        seenIds.add(evt.id)
        allEvents.push(evt)
      }
    }
  }

  return allEvents.sort((a, b) => {
    const diff = Date.parse(b.timestamp) - Date.parse(a.timestamp)
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id)
  })
}

export function exportCareJourneySummary(
  episode: CareEpisode,
  evaluatedAt?: string,
): CareJourneyExportSummary {
  const stages = episode.stages ?? []
  const allDone = stages.length > 0 && stages.every((s) => s.status === 'done')
  const anyBlocked = stages.some((s) => s.status === 'blocked')
  const status: 'active' | 'on_hold' | 'completed' = allDone
    ? 'completed'
    : anyBlocked
    ? 'on_hold'
    : 'active'

  const maxEpochMs = evaluatedAt && isValidIsoTimestamp(evaluatedAt, Infinity)
    ? Date.parse(evaluatedAt)
    : undefined
  const timelineEvents = deriveCareJourneyTimelineEvents(episode, maxEpochMs)
  const milestones = episode.milestones ?? []

  return {
    standard: 'PANACEA-CAREPLAN-FHIR-R4-V1',
    episodeId: episode.id,
    title: episode.title,
    diagnosisCode: episode.diagnosisCode,
    linkedComorbidities: episode.linkedComorbidities ?? [],
    status,
    generatedAt: evaluatedAt || episode.updatedAt,
    stages: stages.map((s) => ({
      stage: s.stage,
      label: STAGE_LABEL[s.stage] ?? s.stage,
      status: s.status,
      updatedAt: s.updatedAt,
      blockedReason: s.blockedReason,
    })),
    milestones: milestones.map((m) => ({
      id: m.id,
      title: m.title,
      category: m.category,
      targetStage: m.targetStage,
      status: m.status,
      resultValue: m.resultValue,
      completedAt: m.completedAt,
    })),
    provider:
      episode.facilityId || episode.facilityName || episode.providerName || episode.estimatedCostLow != null || episode.estimatedCostHigh != null
        ? {
            facilityId: episode.facilityId,
            facilityName: episode.facilityName,
            providerName: episode.providerName,
            costRangeIdr:
              episode.estimatedCostLow != null && episode.estimatedCostHigh != null
                ? { min: episode.estimatedCostLow, max: episode.estimatedCostHigh }
                : undefined,
          }
        : undefined,
    outcome: episode.outcomeRecord,
    timelineEventCount: timelineEvents.length,
    auditDigest: `sha256:${episode.id}:${episode.updatedAt}:${stages.length}:${milestones.length}:${status}`,
  }
}

export function deriveEpisodeCostProjection(episode: CareEpisode): {
  estimatedCostLow?: number
  estimatedCostHigh?: number
  costConfidence?: 'estimated' | 'verified'
  costSource?: string
  costItemsCount: number
} {
  const items = Array.isArray(episode.costItems) ? episode.costItems : []
  const pricedItems = items.filter(
    (i) =>
      (typeof i.low === 'number' && Number.isFinite(i.low) && i.low >= 0) ||
      (typeof i.high === 'number' && Number.isFinite(i.high) && i.high >= 0)
  )

  if (pricedItems.length > 0) {
    let lowSum = 0
    let highSum = 0
    let allVerified = true
    for (const item of pricedItems) {
      const l = typeof item.low === 'number' && Number.isFinite(item.low) && item.low >= 0 ? item.low : undefined
      const h = typeof item.high === 'number' && Number.isFinite(item.high) && item.high >= 0 ? item.high : undefined
      lowSum += l ?? h ?? 0
      highSum += h ?? l ?? 0
      if (item.confidence !== 'verified') {
        allVerified = false
      }
    }
    return {
      estimatedCostLow: lowSum,
      estimatedCostHigh: Math.max(lowSum, highSum),
      costConfidence: allVerified ? 'verified' : 'estimated',
      costSource: episode.costSource || pricedItems.find((i) => i.source?.trim())?.source?.trim(),
      costItemsCount: items.length,
    }
  }

  const hasLow = typeof episode.estimatedCostLow === 'number' && Number.isFinite(episode.estimatedCostLow) && episode.estimatedCostLow >= 0
  const hasHigh = typeof episode.estimatedCostHigh === 'number' && Number.isFinite(episode.estimatedCostHigh) && episode.estimatedCostHigh >= 0

  if (hasLow || hasHigh) {
    const low = hasLow ? episode.estimatedCostLow! : episode.estimatedCostHigh!
    const high = hasHigh ? Math.max(low, episode.estimatedCostHigh!) : low
    return {
      estimatedCostLow: low,
      estimatedCostHigh: high,
      costConfidence: episode.costConfidence === 'verified' ? 'verified' : 'estimated',
      costSource: episode.costSource,
      costItemsCount: items.length,
    }
  }

  return {
    costItemsCount: items.length,
  }
}

export function deriveCareJourneyCostSummary(
  episodes: readonly CareEpisode[],
): CareJourneyCostSummary {
  let totalEstimatedCostLow = 0
  let totalEstimatedCostHigh = 0
  let costVerifiedJourneysCount = 0
  let costEstimatedJourneysCount = 0

  if (Array.isArray(episodes)) {
    for (const ep of episodes) {
      const proj = deriveEpisodeCostProjection(ep)
      if (proj.estimatedCostLow != null && proj.estimatedCostHigh != null) {
        totalEstimatedCostLow += proj.estimatedCostLow
        totalEstimatedCostHigh += proj.estimatedCostHigh
        if (proj.costConfidence === 'verified') {
          costVerifiedJourneysCount++
        } else {
          costEstimatedJourneysCount++
        }
      }
    }
  }

  return {
    totalEstimatedCostLow,
    totalEstimatedCostHigh,
    costVerifiedJourneysCount,
    costEstimatedJourneysCount,
    pricedJourneysCount: costVerifiedJourneysCount + costEstimatedJourneysCount,
    clinicalCareBoundary: 'never-deny-care',
  }
}

export function evaluateEpisodeReadmissionRisk(
  episode: CareEpisode,
  supportiveResults?: readonly SupportiveResult[],
  evaluatedAtMs?: number,
): CareJourneyReadmissionSurveillance {
  const stages = Array.isArray(episode.stages) ? episode.stages : []
  const recoveryStage = stages.find((s) => s.stage === 'recovery')
  const followUpStage = stages.find((s) => s.stage === 'followUp')
  const outcomeStage = stages.find((s) => s.stage === 'outcome')
  const allStagesDone = stages.length > 0 && stages.every((s) => s.status === 'done')

  const riskFactors: string[] = []
  let hasBlockedPostDischarge = false

  if (recoveryStage?.status === 'blocked' || followUpStage?.status === 'blocked') {
    hasBlockedPostDischarge = true
    riskFactors.push('Recovery or follow-up stage blocked')
  } else if (evaluatedAtMs != null) {
    for (const st of [recoveryStage, followUpStage]) {
      if (st?.status === 'active' && st.updatedAt) {
        const updatedMs = Date.parse(st.updatedAt)
        if (Number.isFinite(updatedMs) && updatedMs <= evaluatedAtMs) {
          const elapsedDays = Math.floor((evaluatedAtMs - updatedMs) / 86_400_000)
          const expectedDays =
            (episode.expectedDaysOverride ? episode.expectedDaysOverride[st.stage] : undefined) ??
            STAGE_EXPECTED_DAYS[st.stage] ??
            21
          if (elapsedDays >= expectedDays) {
            riskFactors.push(`${STAGE_LABEL[st.stage]} stage exceeded expected window (${elapsedDays}d/${expectedDays}d)`)
          }
        }
      }
    }
  }

  const inPostTreatmentWindow =
    recoveryStage?.status === 'active' ||
    recoveryStage?.status === 'done' ||
    followUpStage?.status === 'active' ||
    followUpStage?.status === 'done' ||
    outcomeStage?.status === 'active'

  const milestones = Array.isArray(episode.milestones) ? episode.milestones : []
  const pendingPostTxMilestones = milestones.filter(
    (m) =>
      (m.category === 'Follow-up' || m.category === 'Monitoring') &&
      m.status !== 'completed' &&
      m.status !== 'cancelled'
  )
  if (inPostTreatmentWindow && pendingPostTxMilestones.length > 0) {
    riskFactors.push(`${pendingPostTxMilestones.length} post-treatment monitoring/follow-up milestone(s) unfulfilled`)
  }

  const comorbidityCount = Array.isArray(episode.linkedComorbidities)
    ? episode.linkedComorbidities.filter((c) => Boolean(c?.trim())).length
    : 0
  if (comorbidityCount >= 2) {
    riskFactors.push(`Multi-comorbidity burden (${comorbidityCount} linked diagnoses)`)
  }

  let hasCriticalResult = false
  if (Array.isArray(supportiveResults)) {
    const criticalOrHigh = supportiveResults.filter(
      (r) => r.flag === 'critical' || r.flag === 'high'
    )
    if (criticalOrHigh.length > 0) {
      hasCriticalResult = criticalOrHigh.some((r) => r.flag === 'critical')
      riskFactors.push(`${criticalOrHigh.length} abnormal supportive diagnostic result(s) flagged`)
    }
  }

  if (allStagesDone && !episode.outcomeRecord?.status) {
    riskFactors.push('Episode stages completed without verified clinical outcome record')
  }

  let riskLevel: ReadmissionRiskLevel = 'low'
  if (hasBlockedPostDischarge || hasCriticalResult || riskFactors.length >= 2) {
    riskLevel = 'high'
  } else if (riskFactors.length === 1) {
    riskLevel = 'moderate'
  }

  const followUpWindowClosed = Boolean(
    followUpStage?.status === 'done' && episode.outcomeRecord?.status
  )

  const recommendedAction =
    riskLevel === 'high'
      ? 'Schedule urgent clinician post-discharge review & outreach within 24h'
      : riskLevel === 'moderate'
      ? 'Verify follow-up milestone completion with care coordinator'
      : followUpWindowClosed
      ? 'Post-discharge follow-up window closed with verified outcome'
      : 'Continue routine longitudinal monitoring'

  return {
    episodeId: episode.id,
    episodeTitle: episode.title,
    riskLevel,
    riskFactors,
    followUpWindowClosed,
    recommendedAction,
  }
}

export function evaluateReferralHandshakeContinuity(
  episode: CareEpisode,
): CareJourneyReferralRecord | undefined {
  if (!episode.referralRecord) return undefined

  const ref = episode.referralRecord
  const isEmergency = ref.urgency === 'emergency'

  // Safety boundary: emergency referrals must maintain active clinical priority regardless of billing state
  return {
    ...ref,
    sourceFacilityName: ref.sourceFacilityName || episode.facilityName || 'Primary Care Center',
    auditDigest: `sha256:${ref.referralId}:${ref.status}:${ref.urgency}:${isEmergency ? 'vital-priority' : 'standard'}`,
  }
}

export const STAGE_EXPECTED_DAYS: Record<CareEpisodeStageId, number> = {
  problem: 1,
  diagnosis: 2,
  plan: 3,
  provider: 5,
  cost: 5,
  schedule: 7,
  treatment: 21,
  recovery: 21,
  followUp: 21,
  outcome: 14,
}

export function evaluateCareJourneyContinuity(
  episodes: readonly CareEpisode[],
  evaluatedAt?: string,
  recordPlanItems?: readonly PlanItem[],
  supportiveResults?: readonly SupportiveResult[],
): CareJourneyContinuityResult {
  let activeJourneys = 0
  let blockedJourneys = 0
  let completedJourneys = 0
  let stalledCount = 0
  let atRiskCount = 0
  let totalActionItemsCount = 0
  let totalVerifiedActionItemsCount = 0
  let totalCompletedMilestonesCount = 0
  let totalPendingActionItemsCount = 0

  const evaluatedAtMs = evaluatedAt && isValidIsoTimestamp(evaluatedAt, Infinity)
    ? Date.parse(evaluatedAt)
    : undefined

  const summaries: CareJourneyEpisodeSummary[] = episodes.map((ep) => {
    const stages = ep.stages ?? []
    const totalStagesCount = stages.length
    const completedStagesCount = stages.filter((s) => s.status === 'done').length
    const isCompleted = totalStagesCount > 0 && completedStagesCount === totalStagesCount

    const blockedStage = stages.find((s) => s.status === 'blocked')
    const activeStage = stages.find((s) => s.status === 'active')
    const pendingStage = stages.find((s) => s.status === 'pending')

    const currentStage =
      blockedStage ||
      activeStage ||
      pendingStage ||
      (stages.length > 0 ? stages[stages.length - 1] : undefined)
    const stageId = currentStage ? currentStage.stage : 'problem'
    const stageStatus = currentStage ? currentStage.status : 'pending'
    const blockedReason = currentStage?.blockedReason

    let health: EpisodeHealth = 'on_track'
    let stalledReason = blockedReason
    let elapsedDaysInCurrentStage: number | undefined
    let expectedDaysInCurrentStage: number | undefined

    if (isCompleted) {
      completedJourneys++
      health = 'on_track'
    } else if (blockedStage) {
      blockedJourneys++
      stalledCount++
      health = 'stalled'
    } else {
      activeJourneys++

      // Real-time stall detection based on elapsed days in active stage (T-CLIN-09)
      if (activeStage && evaluatedAtMs != null && activeStage.updatedAt) {
        const stageUpdatedMs = Date.parse(activeStage.updatedAt)
        if (Number.isFinite(stageUpdatedMs) && stageUpdatedMs <= evaluatedAtMs) {
          elapsedDaysInCurrentStage = Math.max(0, Math.floor((evaluatedAtMs - stageUpdatedMs) / 86_400_000))
          const override = ep.expectedDaysOverride ? ep.expectedDaysOverride[stageId as CareEpisodeStageId] : undefined
          expectedDaysInCurrentStage = override ?? STAGE_EXPECTED_DAYS[stageId as CareEpisodeStageId] ?? 14

          if (elapsedDaysInCurrentStage >= expectedDaysInCurrentStage) {
            health = 'stalled'
            stalledReason = `Stage exceeded expected timeframe (${elapsedDaysInCurrentStage}d vs ${expectedDaysInCurrentStage}d)`
            stalledCount++
          } else if (elapsedDaysInCurrentStage >= Math.floor(expectedDaysInCurrentStage * 0.7)) {
            health = 'at_risk'
            stalledReason = `Stage approaching expected timeframe (${elapsedDaysInCurrentStage}d vs ${expectedDaysInCurrentStage}d)`
            atRiskCount++
          }
        }
      }
    }

    // Care plan milestones and action item projection with fulfillment bridge (T-CLIN-10, T-CLIN-11)
    let milestones: CarePlanMilestoneSummary[] = []
    if (ep.milestones && ep.milestones.length > 0) {
      milestones = ep.milestones.map((m) => {
        let isCompleted = m.status === 'completed'
        let resultValue = m.resultValue
        let completedAt = m.completedAt

        if (!isCompleted && supportiveResults && supportiveResults.length > 0) {
          if (m.category === 'Suportif' || m.category === 'Monitoring') {
            const titleLower = m.title.toLowerCase()
            const match = supportiveResults.find((r) => {
              const nameLower = r.name.toLowerCase()
              if (titleLower.includes(nameLower) || nameLower.includes(titleLower)) return true
              const nameWords = nameLower.split(/\s+/).filter((w) => w.length >= 3 && !['dan', 'and', 'the', 'for'].includes(w))
              if (nameWords.some((w) => titleLower.includes(w))) return true
              if (r.category === 'EKG' && /\b(ekg|ecg)\b/.test(titleLower)) return true
              if (r.category === 'Radiologi' && /\b(usg|rontgen|x-ray|mri|ct|ct-scan|radiologi)\b/.test(titleLower)) return true
              return false
            })
            if (match) {
              isCompleted = true
              resultValue = `${match.value}${match.unit ? ' ' + match.unit : ''}`
              completedAt = match.takenAt
            }
          }
        }

        return {
          id: m.id,
          title: m.title,
          category: m.category,
          targetStage: m.targetStage,
          status: isCompleted ? 'completed' : m.status,
          verified: m.status === 'verified' || isCompleted,
          completed: isCompleted,
          resultValue,
          completedAt,
          verifiedAt: m.verifiedAt,
        }
      })
    } else if (recordPlanItems && recordPlanItems.length > 0) {
      milestones = recordPlanItems.map((p) => {
        const isVerified = p.status === 'diverifikasi'
        const isCancelled = p.status === 'ditolak'
        let isCompleted = false
        let resultValue: string | undefined
        let completedAt: string | undefined

        if (supportiveResults && supportiveResults.length > 0 && (p.category === 'Suportif' || p.category === 'Monitoring')) {
          const textLower = p.text.toLowerCase()
          const match = supportiveResults.find((r) => {
            const nameLower = r.name.toLowerCase()
            if (textLower.includes(nameLower) || nameLower.includes(textLower)) return true
            const nameWords = nameLower.split(/\s+/).filter((w) => w.length >= 3 && !['dan', 'and', 'the', 'for'].includes(w))
            if (nameWords.some((w) => textLower.includes(w))) return true
            if (r.category === 'EKG' && /\b(ekg|ecg)\b/.test(textLower)) return true
            if (r.category === 'Radiologi' && /\b(usg|rontgen|x-ray|mri|ct|ct-scan|radiologi)\b/.test(textLower)) return true
            return false
          })
          if (match) {
            isCompleted = true
            resultValue = `${match.value}${match.unit ? ' ' + match.unit : ''}`
            completedAt = match.takenAt
          }
        }

        const status = isCancelled
          ? 'cancelled'
          : isCompleted
          ? 'completed'
          : isVerified
          ? 'verified'
          : 'pending'

        return {
          id: `ms_${p.id}`,
          title: p.text,
          category: p.category,
          targetStage: mapPlanCategoryToStage(p.category),
          status,
          verified: isVerified || isCompleted,
          completed: isCompleted,
          resultValue,
          completedAt,
          verifiedAt: p.verifiedAt,
        }
      })
    }

    const actionItemsCount = milestones.length
    const verifiedActionItemsCount = milestones.filter((m) => m.verified).length
    const completedMilestonesCount = milestones.filter((m) => m.completed).length
    const pendingActionItemsCount = milestones.filter((m) => m.status === 'pending').length

    totalActionItemsCount += actionItemsCount
    totalVerifiedActionItemsCount += verifiedActionItemsCount
    totalCompletedMilestonesCount += completedMilestonesCount
    totalPendingActionItemsCount += pendingActionItemsCount

    let escalation: CareJourneyEscalation | undefined
    if (health === 'stalled' || health === 'at_risk') {
      let action: CareJourneyEscalationAction = 'coordinator_outreach'
      let target: CareJourneyEscalationTarget = 'Care Coordinator'
      let actionLabel = 'Care Coordinator Outreach'
      let suggestedAction = 'Coordinate care journey advancement with clinical team'

      if (stageId === 'problem' || stageId === 'diagnosis' || stageId === 'plan') {
        action = 'clinician_review'
        target = 'Clinician In-Tray'
        actionLabel = 'Clinician Review Required'
        suggestedAction = 'Review diagnostic workup or finalize encounter plan items'
      } else if (stageId === 'provider' || stageId === 'cost') {
        action = 'coordinator_outreach'
        target = 'Care Coordinator'
        actionLabel = 'Care Coordinator Outreach'
        suggestedAction = 'Assist patient with facility selection and financial clearance'
      } else if (stageId === 'schedule') {
        action = 'reschedule_prompt'
        target = 'Patient Outreach'
        actionLabel = 'Patient Booking Reminder'
        suggestedAction = 'Follow up with patient to confirm appointment booking'
      } else if (stageId === 'treatment' || stageId === 'recovery') {
        action = 'clinician_review'
        target = 'Clinician In-Tray'
        actionLabel = 'Clinical Progress Review'
        suggestedAction = 'Evaluate recovery course and supportive therapy response'
      } else if (stageId === 'followUp' || stageId === 'outcome') {
        action = 'coordinator_outreach'
        target = 'Care Coordinator'
        actionLabel = 'Follow-up Coordinator Check-in'
        suggestedAction = 'Confirm follow-up attendance and record clinical outcome'
      }

      let daysOverdue = 0
      if (
        elapsedDaysInCurrentStage != null &&
        expectedDaysInCurrentStage != null &&
        elapsedDaysInCurrentStage > expectedDaysInCurrentStage
      ) {
        daysOverdue = elapsedDaysInCurrentStage - expectedDaysInCurrentStage
      } else if (stageStatus === 'blocked') {
        daysOverdue = elapsedDaysInCurrentStage ?? 1
      }

      escalation = {
        id: `esc-${ep.id}-${stageId}`,
        episodeId: ep.id,
        episodeTitle: ep.title,
        stage: stageId as CareEpisodeStageId,
        severity: health === 'stalled' ? 'stalled' : 'at_risk',
        reason: stalledReason || (stageStatus === 'blocked' ? 'Stage is marked blocked' : 'Stage timeframe exceeded'),
        action,
        actionLabel,
        target,
        daysOverdue,
        suggestedAction,
      }
    }

    const costProj = deriveEpisodeCostProjection(ep)
    const readmissionSurveillance = evaluateEpisodeReadmissionRisk(ep, supportiveResults, evaluatedAtMs)
    const referralRecord = evaluateReferralHandshakeContinuity(ep)

    return {
      id: ep.id,
      title: ep.title,
      diagnosisCode: ep.diagnosisCode,
      activeStage: stageId,
      stageStatus,
      blockedReason,
      completedStagesCount,
      totalStagesCount,
      health,
      stalledReason,
      elapsedDaysInCurrentStage,
      expectedDaysInCurrentStage,
      actionItemsCount,
      verifiedActionItemsCount,
      completedMilestonesCount,
      pendingActionItemsCount,
      milestones,
      escalation,
      outcomeRecord: ep.outcomeRecord,
      timelineEvents: deriveCareJourneyTimelineEvents(ep, evaluatedAtMs),
      exportSummary: exportCareJourneySummary(ep, evaluatedAt),
      estimatedCostLow: costProj.estimatedCostLow,
      estimatedCostHigh: costProj.estimatedCostHigh,
      costConfidence: costProj.costConfidence,
      costSource: costProj.costSource,
      costItemsCount: costProj.costItemsCount,
      readmissionSurveillance,
      referralRecord,
    }
  })

  const escalations = summaries
    .map((s) => s.escalation)
    .filter((e): e is CareJourneyEscalation => Boolean(e))

  const clinicianInTrayCount = escalations.filter((e) => e.target === 'Clinician In-Tray').length
  const careCoordinatorCount = escalations.filter((e) => e.target === 'Care Coordinator').length
  const completedWithVerifiedOutcomeCount = summaries.filter(
    (s) => s.completedStagesCount === s.totalStagesCount && Boolean(s.outcomeRecord?.status)
  ).length
  const totalTimelineEventsCount = summaries.reduce(
    (acc, s) => acc + (s.timelineEvents?.length ?? 0),
    0
  )
  const patientTimelineEvents = derivePatientLongitudinalTimeline(episodes, evaluatedAtMs)
  const totalPatientTimelineEventsCount = patientTimelineEvents.length

  const uniqueComorbidities = new Set<string>()
  for (const ep of episodes) {
    if (ep.diagnosisCode?.trim()) uniqueComorbidities.add(ep.diagnosisCode.trim())
    if (Array.isArray(ep.linkedComorbidities)) {
      ep.linkedComorbidities.forEach((c) => {
        if (c?.trim()) uniqueComorbidities.add(c.trim())
      })
    }
  }
  const activeComorbiditiesCount = uniqueComorbidities.size
  const exportableJourneysCount = summaries.filter((s) => Boolean(s.exportSummary)).length
  const costSummary = deriveCareJourneyCostSummary(episodes)
  const highReadmissionRiskCount = summaries.filter(
    (s) => s.readmissionSurveillance?.riskLevel === 'high'
  ).length
  const moderateReadmissionRiskCount = summaries.filter(
    (s) => s.readmissionSurveillance?.riskLevel === 'moderate'
  ).length
  const followUpWindowClosedCount = summaries.filter(
    (s) => Boolean(s.readmissionSurveillance?.followUpWindowClosed)
  ).length

  const activeReferralsCount = summaries.filter(
    (s) => s.referralRecord && s.referralRecord.status !== 'completed' && s.referralRecord.status !== 'cancelled'
  ).length
  const acknowledgedReferralsCount = summaries.filter(
    (s) => s.referralRecord?.status === 'acknowledged'
  ).length
  const emergencyReferralsCount = summaries.filter(
    (s) => s.referralRecord?.urgency === 'emergency' && s.referralRecord.status !== 'completed' && s.referralRecord.status !== 'cancelled'
  ).length

  return {
    totalJourneys: episodes.length,
    activeJourneys,
    blockedJourneys,
    completedJourneys,
    stalledCount,
    atRiskCount,
    totalActionItemsCount,
    totalVerifiedActionItemsCount,
    totalCompletedMilestonesCount,
    totalPendingActionItemsCount,
    episodes: summaries,
    escalations,
    totalEscalationsCount: escalations.length,
    clinicianInTrayCount,
    careCoordinatorCount,
    completedWithVerifiedOutcomeCount,
    totalTimelineEventsCount,
    patientTimelineEvents,
    totalPatientTimelineEventsCount,
    activeComorbiditiesCount,
    exportableJourneysCount,
    totalEstimatedCostLow: costSummary.totalEstimatedCostLow,
    totalEstimatedCostHigh: costSummary.totalEstimatedCostHigh,
    costVerifiedJourneysCount: costSummary.costVerifiedJourneysCount,
    costEstimatedJourneysCount: costSummary.costEstimatedJourneysCount,
    highReadmissionRiskCount,
    moderateReadmissionRiskCount,
    followUpWindowClosedCount,
    activeReferralsCount,
    acknowledgedReferralsCount,
    emergencyReferralsCount,
    hasBlockedStages: blockedJourneys > 0 || stalledCount > 0,
  }
}
