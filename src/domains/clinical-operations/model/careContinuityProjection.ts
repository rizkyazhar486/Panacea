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
  EdenDisclosureDepth,
  EdenPlainLanguageTerm,
  EdenCareCompanionSummary,
  EdenCalmState,
  EdenLifeDimensionStatus,
  EdenLifeBalanceSynthesis,
  EdenLifeStoryAnchor,
  EdenLifeStoryBridge,
  EdenOrganSystemId,
  EdenPhysiologyAppreciation,
  LifeDomain,
  LifeEvent,
  Quest,
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
  edenCompanion?: EdenCareCompanionSummary
  edenLifeStoryBridge?: EdenLifeStoryBridge
  edenPhysiologyAppreciation?: EdenPhysiologyAppreciation
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
  edenReadyJourneysCount: number
  edenLifeStoryAlignedCount: number
  edenPhysiologyLinkedCount: number
  edenLifeBalance: EdenLifeBalanceSynthesis
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

export const EDEN_PLAIN_LANGUAGE_GLOSSARY: readonly EdenPlainLanguageTerm[] = [
  {
    technicalTerm: 'Provenance',
    humanTranslation: 'Where this information came from',
  },
  {
    technicalTerm: 'Interoperability',
    humanTranslation: 'Connecting your health information safely',
  },
  {
    technicalTerm: 'Homeostasis',
    humanTranslation: 'How your body maintains its balance',
  },
  {
    technicalTerm: 'Evidence confidence',
    humanTranslation: 'How well this information is supported',
  },
  {
    technicalTerm: 'Physiological system',
    humanTranslation: 'How this part of your body works',
  },
  {
    technicalTerm: 'Trajectory',
    humanTranslation: 'How things are changing over time',
  },
] as const

export function translateClinicalTermToEden(term: string): string {
  const normalized = term.trim().toLowerCase()
  const found = EDEN_PLAIN_LANGUAGE_GLOSSARY.find(
    (entry) => entry.technicalTerm.toLowerCase() === normalized
  )
  return found ? found.humanTranslation : term
}

export function deriveEdenCareCompanion(
  episode: CareEpisode,
  depth: EdenDisclosureDepth = episode.edenDepthPreference ?? 'simple',
): EdenCareCompanionSummary {
  const stages = Array.isArray(episode.stages) ? episode.stages : []
  const totalStages = stages.length
  const completedStages = stages.filter((s) => s.status === 'done').length
  const isAllDone = totalStages > 0 && completedStages === totalStages
  const blockedStage = stages.find((s) => s.status === 'blocked')
  const activeStage = stages.find((s) => s.status === 'active')
  const pendingStage = stages.find((s) => s.status === 'pending')
  const currentStage =
    blockedStage || activeStage || pendingStage || (stages.length > 0 ? stages[stages.length - 1] : undefined)
  const stageId: CareEpisodeStageId = currentStage ? currentStage.stage : 'problem'
  const stageLabel = STAGE_LABEL[stageId] ?? stageId

  const milestones = Array.isArray(episode.milestones) ? episode.milestones : []
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length
  const hasEmergencyReferral = episode.referralRecord?.urgency === 'emergency'

  const urgencyTone: 'calm' | 'attentive' | 'urgent_care' = hasEmergencyReferral
    ? 'urgent_care'
    : blockedStage
    ? 'attentive'
    : 'calm'

  const depthLabel =
    depth === 'simple'
      ? 'Simple · Just Live'
      : depth === 'explore'
      ? 'Explore · Understand More'
      : 'Deep · Scientific & Clinical'

  const wonderReflection =
    depth === 'simple'
      ? 'Every day, your body continuously adapts and works to restore its natural balance.'
      : depth === 'explore'
      ? 'How your body maintains its balance (homeostasis) is a coordinated partnership between your physiology and timely, supportive care.'
      : `Biological resilience and longitudinal trajectory (${completedStages}/${totalStages} stages completed) reflect adaptive physiological recovery.`

  const whatIsHappening = isAllDone
    ? depth === 'simple'
      ? `Your care journey for "${episode.title}" has completed all planned steps.`
      : depth === 'explore'
      ? `All ${totalStages} stages of "${episode.title}" are complete${episode.outcomeRecord ? ` with outcome recorded as ${episode.outcomeRecord.status.replace('_', ' ')}` : ''}.`
      : `Episode ${episode.id} (${episode.diagnosisCode || 'unclassified'}) completed ${completedStages}/${totalStages} stages; outcome status: ${episode.outcomeRecord?.status ?? 'pending clinician signature'}.`
    : blockedStage
    ? depth === 'simple'
      ? `We are currently pausing at the "${stageLabel}" step so your care team can help clear a small hurdle.`
      : depth === 'explore'
      ? `Stage "${stageLabel}" is temporarily paused (${blockedStage.blockedReason || 'awaiting coordination'}) while ${completedStages} of ${totalStages} steps are already complete.`
      : `Trajectory stage "${stageId}" (${stageLabel}) is blocked (${blockedStage.blockedReason || 'unspecified'}); ${completedStages}/${totalStages} stages done, ${completedMilestones}/${milestones.length} milestones fulfilled.`
    : depth === 'simple'
    ? `You are currently on the "${stageLabel}" step of your "${episode.title}" care journey (${completedStages} of ${totalStages} steps completed).`
    : depth === 'explore'
    ? `Your care journey is progressing through "${stageLabel}" (${completedStages}/${totalStages} stages complete, ${completedMilestones}/${milestones.length} care milestones fulfilled).`
    : `Active trajectory stage: "${stageId}" (${stageLabel}) for "${episode.title}" [ICD-10: ${episode.diagnosisCode || 'N/A'}]; ${completedStages}/${totalStages} stages completed.`

  const whyItMatters =
    depth === 'simple'
      ? `Taking "${stageLabel}" one step at a time helps your body recover smoothly without unnecessary stress.`
      : depth === 'explore'
      ? `Each step in "${stageLabel}" connects your health information safely so your clinician and care team can support how your body maintains its balance.`
      : `Longitudinal stage continuity at "${stageLabel}" preserves diagnostic chain-of-custody, provenance integrity, and clinical safety boundary (never-deny-care).`

  const nextInvitation = isAllDone
    ? episode.outcomeRecord
      ? 'Maintain your gentle daily wellness routine and scheduled check-ins.'
      : 'Confirm final outcome summary with your clinician at your next visit.'
    : blockedStage
    ? `Share or review what is needed to unblock "${stageLabel}" with your care coordinator.`
    : `Focus on one calm step today: complete or review "${stageLabel}".`

  const whatYouCanDo =
    depth === 'simple'
      ? nextInvitation
      : depth === 'explore'
      ? `${nextInvitation} (${milestones.length > 0 ? `${completedMilestones}/${milestones.length} care plan items fulfilled so far` : 'ready for encounter plan sync'}).`
      : `${nextInvitation} [Stage: ${stageId} · Tone: ${urgencyTone} · Boundary: never-deny-care].`

  const whatRemainsUncertain =
    episode.outcomeRecord?.verifiedById
      ? 'Clinical outcome is verified by an authorized clinician; long-term physiological adaptation continues over time.'
      : episode.costConfidence !== 'verified' && (episode.estimatedCostLow != null || episode.estimatedCostHigh != null)
      ? 'Final clinical outcome awaits clinician verification, and facility cost figures remain estimated until verified by billing.'
      : 'Final clinical outcome and physiological response remain under observation until verified by an authorized clinician.'

  return {
    episodeId: episode.id,
    episodeTitle: episode.title,
    depth,
    depthLabel,
    wonderReflection,
    whatIsHappening,
    whyItMatters,
    whatYouCanDo,
    whatRemainsUncertain,
    nextBeautifulStep: {
      stage: stageId,
      stageLabel,
      invitation: nextInvitation,
      urgencyTone,
    },
    plainLanguageGlossary: [...EDEN_PLAIN_LANGUAGE_GLOSSARY],
    clinicalSafetyPreserved: true,
  }
}

export function deriveEdenLifeBalanceSynthesis(
  episodes: readonly CareEpisode[],
  supportiveResults?: readonly SupportiveResult[],
): EdenLifeBalanceSynthesis {
  const safeEpisodes: readonly CareEpisode[] = Array.isArray(episodes) ? episodes : []
  const total = safeEpisodes.length
  let completed = 0
  let blocked = 0
  let hasEmergency = false
  let firstNextStep: string | undefined

  for (const ep of safeEpisodes) {
    const stages = ep.stages ?? []
    const isDone = stages.length > 0 && stages.every((s) => s.status === 'done')
    const isBlocked = stages.some((s) => s.status === 'blocked')
    if (isDone) {
      completed++
    } else if (isBlocked) {
      blocked++
    }
    if (ep.referralRecord?.urgency === 'emergency' && ep.referralRecord.status !== 'completed' && ep.referralRecord.status !== 'cancelled') {
      hasEmergency = true
    }
    if (!firstNextStep && !isDone) {
      const companion = deriveEdenCareCompanion(ep, 'simple')
      firstNextStep = companion.nextBeautifulStep.invitation
    }
  }

  const active = Math.max(0, total - completed)
  const safeResults: readonly SupportiveResult[] = Array.isArray(supportiveResults) ? supportiveResults : []
  const abnormalResults = safeResults.filter((r) => r.flag === 'critical' || r.flag === 'high')
  const hasCriticalDiag = abnormalResults.some((r) => r.flag === 'critical')
  const costSummary = deriveCareJourneyCostSummary(safeEpisodes)

  let calmState: EdenCalmState = 'serene'
  let calmStateLabel = 'Serene · Balanced Rhythm'
  if (hasEmergency || hasCriticalDiag) {
    calmState = 'timely_clinical_care'
    calmStateLabel = 'Timely Clinical Care · Priority Support'
  } else if (blocked > 0 || abnormalResults.length > 0) {
    calmState = 'gentle_attention'
    calmStateLabel = 'Gentle Attention · Step-by-Step Support'
  } else if (active > 0) {
    calmState = 'balanced_progress'
    calmStateLabel = 'Balanced Progress · Steady Recovery'
  }

  const harmonyHeadline =
    total === 0
      ? 'Your health space is calm and ready whenever you wish to explore or begin a care journey.'
      : calmState === 'timely_clinical_care'
      ? 'Your care team is prioritizing timely clinical attention while keeping your journey clear and supported.'
      : calmState === 'gentle_attention'
      ? `One step in your care journey needs gentle coordination (${completed} of ${total} journeys completed).`
      : calmState === 'balanced_progress'
      ? `Your care journeys are moving forward steadily in a calm, coordinated rhythm (${active} active, ${completed} completed).`
      : `All ${completed} tracked care journey(s) have reached completion in steady balance.`

  const biologicalAppreciation =
    'Every breath, heartbeat, and cellular repair process works together to maintain your body’s natural balance (homeostasis).'

  const oneUnifiedFocus =
    firstNextStep ||
    (total > 0
      ? 'Enjoy your daily rhythm of rest, hydration, and gentle movement while maintaining scheduled check-ins.'
      : 'Start or seed a care journey whenever you and your clinician want to track a goal together.')

  const dimensions: EdenLifeDimensionStatus[] = [
    {
      dimension: 'clinical_continuity',
      label: 'Care Journey Rhythm',
      plainSummary:
        total === 0
          ? 'No active care episodes required right now'
          : `${active} active · ${completed} completed${blocked > 0 ? ` · ${blocked} awaiting coordination` : ''}`,
      tone: hasEmergency ? 'urgent' : blocked > 0 ? 'attentive' : 'serene',
    },
    {
      dimension: 'diagnostic_clarity',
      label: 'Body Signals & Lab Clarity',
      plainSummary:
        !supportiveResults || supportiveResults.length === 0
          ? 'No pending lab or diagnostic alerts'
          : abnormalResults.length > 0
          ? `${abnormalResults.length} result(s) highlighted for clinician review`
          : `${supportiveResults.length} supportive result(s) within expected range`,
      tone: hasCriticalDiag ? 'urgent' : abnormalResults.length > 0 ? 'attentive' : 'serene',
    },
    {
      dimension: 'recovery_rhythm',
      label: 'Recovery & Daily Balance',
      plainSummary:
        completed > 0
          ? `${completed} journey(s) reached recovery/outcome milestones`
          : active > 0
          ? 'Steady step-by-step physiological recovery in progress'
          : ' Baseline daily wellness and homeostasis',
      tone: 'serene',
    },
    {
      dimension: 'financial_peace',
      label: 'Cost Transparency & Care Guarantee',
      plainSummary:
        costSummary.pricedJourneysCount > 0
          ? `${costSummary.pricedJourneysCount} journey(s) priced · Emergency/vital care is never denied`
          : 'No billing hurdles · Vital clinical care is never denied',
      tone: 'serene',
    },
  ]

  return {
    calmState,
    calmStateLabel,
    harmonyHeadline,
    biologicalAppreciation,
    oneUnifiedFocus,
    activeJourneysCount: active,
    completedJourneysCount: completed,
    dimensions,
    clinicalSafetyGuarantee: 'never-deny-care',
  }
}

const EDEN_LIFE_DOMAIN_LABELS: Record<LifeDomain, string> = {
  physical: 'Physical',
  mental: 'Mental',
  social: 'Social',
  relationships: 'Relationships',
  sex: 'Intimacy',
  money: 'Financial',
  career: 'Career',
  study: 'Study & Knowledge',
  recreation: 'Recreation & Play',
  family: 'Family',
  purpose: 'Purpose',
  creativity: 'Creativity',
}

const EDEN_LIFE_CHAPTER_BOUNDS: readonly { name: string; from: number; to: number }[] = [
  { name: 'Origin', from: -1, to: 12 },
  { name: 'Growth', from: 13, to: 22 },
  { name: 'Foundation', from: 23, to: 35 },
  { name: 'Family & Career', from: 36, to: 50 },
  { name: 'Mastery', from: 51, to: 65 },
  { name: 'Legacy', from: 66, to: 999 },
]

function parseIsoYmd(iso?: string): { year: number; month: number; day: number } | undefined {
  if (typeof iso !== 'string') return undefined
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim())
  if (!m) return undefined
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
  }
}

function resolveLifeChapterForEpisode(
  patientDob?: string,
  episodeAt?: string,
): { name: string; ageRange: string } {
  const birth = parseIsoYmd(patientDob)
  const event = parseIsoYmd(episodeAt)
  if (!birth || !event) {
    return { name: 'Living Chapter', ageRange: 'Ongoing' }
  }
  let age = event.year - birth.year
  if (event.month < birth.month || (event.month === birth.month && event.day < birth.day)) {
    age -= 1
  }
  const bound =
    EDEN_LIFE_CHAPTER_BOUNDS.find((b) => age >= b.from && age <= b.to) ??
    EDEN_LIFE_CHAPTER_BOUNDS[EDEN_LIFE_CHAPTER_BOUNDS.length - 1]
  const ageRange = bound.to >= 999 ? `${bound.from}+` : `${Math.max(bound.from, 0)}–${bound.to}`
  return { name: bound.name, ageRange }
}

export function deriveEdenLifeStoryBridge(
  episode: CareEpisode,
  lifeEvents?: readonly LifeEvent[],
  quests?: readonly Quest[],
  patientDob?: string,
): EdenLifeStoryBridge {
  const stages = episode.stages ?? []
  const isCompleted = stages.length > 0 && stages.every((s) => s.status === 'done')
  const chapter = resolveLifeChapterForEpisode(patientDob, episode.createdAt)

  const healthStoryAnchors: EdenLifeStoryAnchor[] = [
    {
      id: `${episode.id}_started`,
      at: episode.createdAt,
      title: `Started: ${episode.title}`,
      kind: 'started',
    },
  ]

  for (const stage of stages) {
    if (stage.status === 'blocked' && stage.updatedAt) {
      healthStoryAnchors.push({
        id: `${episode.id}_blocked_${stage.stage}`,
        at: stage.updatedAt,
        title: `Paused for coordination: ${episode.title}`,
        kind: 'blocked',
        note: stage.blockedReason,
      })
    }
  }

  if (isCompleted) {
    healthStoryAnchors.push({
      id: `${episode.id}_completed`,
      at: episode.updatedAt,
      title: `Completed: ${episode.title}`,
      kind: 'completed',
    })
  }

  const safeEvents: readonly LifeEvent[] = Array.isArray(lifeEvents) ? lifeEvents : []
  const selfAuthoredTurningPoints = safeEvents
    .filter((e) => Boolean(e.isTurningPoint))
    .map((e) => ({
      id: e.id,
      at: e.at,
      title: e.title,
      impact: e.impact,
      domains: Array.isArray(e.domains) ? [...e.domains] : [],
    }))

  const safeQuests: readonly Quest[] = Array.isArray(quests) ? quests : []
  const activeQuests = safeQuests
    .filter((q) => q.status === 'active')
    .map((q) => ({
      id: q.id,
      title: q.title,
      domain: q.domain,
      progressCurrent: q.progressCurrent,
      progressTarget: q.progressTarget,
      unit: q.unit,
      targetNote: q.targetNote,
    }))

  const domainCounter = new Map<LifeDomain, number>()
  domainCounter.set('physical', 1)
  for (const e of safeEvents) {
    for (const d of e.domains ?? []) {
      domainCounter.set(d, (domainCounter.get(d) ?? 0) + 1)
    }
  }
  for (const q of activeQuests) {
    domainCounter.set(q.domain, (domainCounter.get(q.domain) ?? 0) + 1)
  }

  const activeLifeDomains = [...domainCounter.entries()]
    .map(([domain, count]) => ({
      domain,
      label: EDEN_LIFE_DOMAIN_LABELS[domain] ?? domain,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  const storyContinuityNarrative =
    selfAuthoredTurningPoints.length > 0 || activeQuests.length > 0
      ? `In your ${chapter.name} chapter (${chapter.ageRange} yrs), “${episode.title}” weaves alongside ${selfAuthoredTurningPoints.length} self-authored turning point(s) and ${activeQuests.length} active life quest(s)—keeping you as the protagonist of one unified life story.`
      : `In your ${chapter.name} chapter (${chapter.ageRange} yrs), “${episode.title}” is tracked as one real health thread in your whole life story—meaning and turning points remain yours to author.`

  const gentleReflectionPrompt = isCompleted
    ? 'This care thread has reached completion—if it marked a meaningful moment in your life, you may record it in your own words in Life Story.'
    : activeQuests.length > 0
    ? `As this care journey progresses, notice how your recovery rhythm supports your active quest: “${activeQuests[0].title}”.`
    : 'Health is one thread in your whole life story—whenever a moment feels meaningful to you, you can log it in your own words in Life Story.'

  return {
    episodeId: episode.id,
    episodeTitle: episode.title,
    lifeChapterName: chapter.name,
    lifeChapterAgeRange: chapter.ageRange,
    healthStoryAnchors,
    selfAuthoredTurningPoints,
    activeQuests,
    activeLifeDomains,
    storyContinuityNarrative,
    gentleReflectionPrompt,
    selfAuthoredNeverInferred: true,
  }
}

interface OrganSystemProfile {
  id: EdenOrganSystemId
  label: string
  bodyTwinRoute: string
  livingWonderHeadline: string
  homeostaticMechanismSummary: string
  coupledSystems: {
    id: EdenOrganSystemId
    label: string
    couplingExplanation: string
  }[]
}

const EDEN_ORGAN_SYSTEM_PROFILES: Record<EdenOrganSystemId, OrganSystemProfile> = {
  cardiovascular: {
    id: 'cardiovascular',
    label: 'Cardiovascular & Circulatory System',
    bodyTwinRoute: '/body',
    livingWonderHeadline:
      'Your heart and blood vessels continuously coordinate oxygen and nutrient delivery to billions of cells with every heartbeat.',
    homeostaticMechanismSummary:
      'Vascular smooth muscle tone, baroreceptor feedback, and cardiac output adapt dynamically to support steady tissue perfusion.',
    coupledSystems: [
      {
        id: 'respiratory',
        label: 'Respiratory Gas Exchange',
        couplingExplanation: 'Pulmonary alveoli oxygenate circulating blood and clear carbon dioxide in synchronized cardiopulmonary rhythm.',
      },
      {
        id: 'renal_urinary',
        label: 'Renal Fluid & Pressure Balance',
        couplingExplanation: 'Kidneys regulate intravascular volume and electrolytes to keep arterial pressure within a healthy window.',
      },
    ],
  },
  respiratory: {
    id: 'respiratory',
    label: 'Respiratory & Pulmonary System',
    bodyTwinRoute: '/body',
    livingWonderHeadline:
      'Each calm breath draws oxygen across a delicate alveolar surface to energize cellular metabolism throughout your body.',
    homeostaticMechanismSummary:
      'Mucociliary clearance, bronchial tone, and alveolar-capillary diffusion work together to maintain balanced blood oxygenation.',
    coupledSystems: [
      {
        id: 'cardiovascular',
        label: 'Pulmonary-Cardiac Circulation',
        couplingExplanation: 'Right and left heart chambers partner with pulmonary vessels to distribute freshly oxygenated blood.',
      },
      {
        id: 'immune_lymphatic',
        label: 'Mucosal Airway Defense',
        couplingExplanation: 'Airway immune cells and lymphatic drainage protect and repair respiratory tissues.',
      },
    ],
  },
  metabolic_endocrine: {
    id: 'metabolic_endocrine',
    label: 'Metabolic & Endocrine Signaling System',
    bodyTwinRoute: '/body',
    livingWonderHeadline:
      'Your endocrine glands and metabolic pathways finely tune cellular energy, glucose balance, and hormone rhythms around the clock.',
    homeostaticMechanismSummary:
      'Pancreatic, thyroid, hepatic, and cellular receptor feedback loops coordinate fuel utilization and restorative repair.',
    coupledSystems: [
      {
        id: 'cardiovascular',
        label: 'Vascular Endothelial Health',
        couplingExplanation: 'Balanced glucose and lipid metabolism protects microcirculation and arterial elasticity.',
      },
      {
        id: 'neurological',
        label: 'Neuroendocrine & Circadian Rhythm',
        couplingExplanation: 'Hypothalamic-pituitary signaling aligns sleep, appetite, and cellular energy recovery.',
      },
    ],
  },
  musculoskeletal: {
    id: 'musculoskeletal',
    label: 'Musculoskeletal & Biomechanical System',
    bodyTwinRoute: '/body',
    livingWonderHeadline:
      'Your bones, joints, tendons, and muscle fibers remodel and adapt in response to gentle movement and load.',
    homeostaticMechanismSummary:
      'Collagen synthesis, synovial lubrication, and neuromuscular coordination restore structural strength step by step.',
    coupledSystems: [
      {
        id: 'neurological',
        label: 'Neuromuscular Motor Control',
        couplingExplanation: 'Proprioceptive nerves and motor pathways guide balanced joint alignment and protective reflexes.',
      },
      {
        id: 'cardiovascular',
        label: 'Microvascular Tissue Repair',
        couplingExplanation: 'Local capillary blood flow delivers amino acids, oxygen, and growth factors to healing tissues.',
      },
    ],
  },
  neurological: {
    id: 'neurological',
    label: 'Nervous System & Neuroplasticity',
    bodyTwinRoute: '/body',
    livingWonderHeadline:
      'Billions of neurons and glial cells continuously adapt, regulate autonomic calm, and coordinate sensation and movement.',
    homeostaticMechanismSummary:
      'Autonomic vagal balance, synaptic plasticity, and neurovascular coupling support cognitive clarity and restorative rest.',
    coupledSystems: [
      {
        id: 'cardiovascular',
        label: 'Cerebrovascular Perfusion',
        couplingExplanation: 'Autoregulated cerebral blood flow matches oxygen and glucose delivery to active neural networks.',
      },
      {
        id: 'metabolic_endocrine',
        label: 'Autonomic-Endocrine Harmony',
        couplingExplanation: 'Parasympathetic recovery signals help quiet stress hormones and support cellular repair.',
      },
    ],
  },
  digestive_hepatobiliary: {
    id: 'digestive_hepatobiliary',
    label: 'Digestive & Hepatobiliary System',
    bodyTwinRoute: '/body',
    livingWonderHeadline:
      'Your digestive tract and liver transform nourishment into cellular building blocks while maintaining a protective mucosal barrier.',
    homeostaticMechanismSummary:
      'Enzymatic digestion, bile flow, hepatic metabolism, and gut microbiome signaling sustain whole-body nutrition.',
    coupledSystems: [
      {
        id: 'metabolic_endocrine',
        label: 'Hepatic-Metabolic Nutrient Routing',
        couplingExplanation: 'Portal circulation and liver enzymes buffer blood nutrients after every meal.',
      },
      {
        id: 'immune_lymphatic',
        label: 'Gut-Associated Immune Balance',
        couplingExplanation: 'Intestinal mucosal immunity and lymphatic vessels maintain calm tolerance and defense.',
      },
    ],
  },
  renal_urinary: {
    id: 'renal_urinary',
    label: 'Renal & Fluid Homeostasis System',
    bodyTwinRoute: '/body',
    livingWonderHeadline:
      'Your kidneys filter blood continuously to keep water, minerals, and acid-base balance in a remarkably steady state.',
    homeostaticMechanismSummary:
      'Glomerular filtration and tubular reabsorption conserve essential electrolytes while clearing metabolic byproducts.',
    coupledSystems: [
      {
        id: 'cardiovascular',
        label: 'Hemodynamic & Blood Pressure Balance',
        couplingExplanation: 'Renal sodium-water regulation partners with arterial vessels to stabilize circulation.',
      },
      {
        id: 'metabolic_endocrine',
        label: 'Mineral & Erythropoietic Signaling',
        couplingExplanation: 'Renal hormones support bone mineral balance and red blood cell production.',
      },
    ],
  },
  immune_lymphatic: {
    id: 'immune_lymphatic',
    label: 'Immune Defense & Lymphatic Repair System',
    bodyTwinRoute: '/body',
    livingWonderHeadline:
      'Your immune cells and lymphatic network patrol, clear cellular debris, and guide tissue healing with remarkable precision.',
    homeostaticMechanismSummary:
      'Innate and adaptive immune pathways resolve inflammation and restore tissue equilibrium after infection or injury.',
    coupledSystems: [
      {
        id: 'cardiovascular',
        label: 'Lymphatic-Vascular Fluid Return',
        couplingExplanation: 'Lymphatic vessels return interstitial fluid and immune messengers back into circulation.',
      },
      {
        id: 'respiratory',
        label: 'Barrier & Mucosal Surveillance',
        couplingExplanation: 'Coordinated mucosal defenses protect respiratory and systemic tissues during recovery.',
      },
    ],
  },
  whole_body_homeostasis: {
    id: 'whole_body_homeostasis',
    label: 'Whole-Body Homeostasis & Cellular Resilience',
    bodyTwinRoute: '/body',
    livingWonderHeadline:
      'Across every organ system, your body coordinates circulation, cellular repair, and autonomic balance to support recovery.',
    homeostaticMechanismSummary:
      'Integrated cardiovascular, metabolic, immune, and nervous system feedback loops work together to maintain physiological stability.',
    coupledSystems: [
      {
        id: 'cardiovascular',
        label: 'Systemic Oxygen & Nutrient Delivery',
        couplingExplanation: 'Steady circulation nourishes tissues and supports every stage of clinical recovery.',
      },
      {
        id: 'neurological',
        label: 'Restorative Autonomic Rhythm',
        couplingExplanation: 'Sleep and parasympathetic calm coordinate whole-body cellular repair.',
      },
    ],
  },
}

function classifyEpisodeOrganSystem(episode: CareEpisode): EdenOrganSystemId {
  const code = (episode.diagnosisCode ?? '').trim().toUpperCase()
  if (code.startsWith('I')) return 'cardiovascular'
  if (code.startsWith('J')) return 'respiratory'
  if (code.startsWith('E')) return 'metabolic_endocrine'
  if (code.startsWith('M') || code.startsWith('S')) return 'musculoskeletal'
  if (code.startsWith('G') || code.startsWith('F')) return 'neurological'
  if (code.startsWith('K')) return 'digestive_hepatobiliary'
  if (code.startsWith('N')) return 'renal_urinary'
  if (code.startsWith('A') || code.startsWith('B') || code.startsWith('D')) return 'immune_lymphatic'

  const title = (episode.title ?? '').toLowerCase()
  if (/\b(heart|cardiac|hypertension|coronary|vascular|angina|arrhythmia|atrial)\b/.test(title)) {
    return 'cardiovascular'
  }
  if (/\b(lung|asthma|copd|pneumonia|respiratory|bronch|airway|pulmonary)\b/.test(title)) {
    return 'respiratory'
  }
  if (/\b(diabet|thyroid|metabolic|lipid|glucose|endocrine|hba1c)\b/.test(title)) {
    return 'metabolic_endocrine'
  }
  if (/\b(knee|meniscus|fracture|joint|spine|lumbar|orthop|muscle|tendon|rehab)\b/.test(title)) {
    return 'musculoskeletal'
  }
  if (/\b(neuro|migraine|stroke|nerve|sleep|cognitive|seizure)\b/.test(title)) {
    return 'neurological'
  }
  if (/\b(gastr|liver|hepato|gallstone|cholecyst|biliary|digest|colon|ulcer)\b/.test(title)) {
    return 'digestive_hepatobiliary'
  }
  if (/\b(renal|kidney|urinary|nephr)\b/.test(title)) {
    return 'renal_urinary'
  }
  if (/\b(infect|viral|immune|lymph|sepsis|fever)\b/.test(title)) {
    return 'immune_lymphatic'
  }
  return 'whole_body_homeostasis'
}

export function deriveEdenPhysiologyAppreciation(
  episode: CareEpisode,
): EdenPhysiologyAppreciation {
  const systemId = classifyEpisodeOrganSystem(episode)
  const profile = EDEN_ORGAN_SYSTEM_PROFILES[systemId]

  return {
    episodeId: episode.id,
    episodeTitle: episode.title,
    primarySystem: {
      id: profile.id,
      label: profile.label,
      bodyTwinRoute: profile.bodyTwinRoute,
    },
    coupledSystems: profile.coupledSystems.map((c) => ({ ...c })),
    livingWonderHeadline: profile.livingWonderHeadline,
    homeostaticMechanismSummary: profile.homeostaticMechanismSummary,
    truthClass: 'educational_physiology_reference',
    neverFabricatesMeasuredVitals: true,
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
    const edenCompanion = deriveEdenCareCompanion(ep)
    const edenLifeStoryBridge = deriveEdenLifeStoryBridge(ep)
    const edenPhysiologyAppreciation = deriveEdenPhysiologyAppreciation(ep)

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
      edenCompanion,
      edenLifeStoryBridge,
      edenPhysiologyAppreciation,
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
  const edenReadyJourneysCount = summaries.filter(
    (s) => Boolean(s.edenCompanion?.clinicalSafetyPreserved)
  ).length
  const edenLifeStoryAlignedCount = summaries.filter(
    (s) => Boolean(s.edenLifeStoryBridge?.selfAuthoredNeverInferred)
  ).length
  const edenPhysiologyLinkedCount = summaries.filter(
    (s) => Boolean(s.edenPhysiologyAppreciation?.neverFabricatesMeasuredVitals)
  ).length
  const edenLifeBalance = deriveEdenLifeBalanceSynthesis(episodes, supportiveResults)

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
    edenReadyJourneysCount,
    edenLifeStoryAlignedCount,
    edenPhysiologyLinkedCount,
    edenLifeBalance,
    hasBlockedStages: blockedJourneys > 0 || stalledCount > 0,
  }
}
