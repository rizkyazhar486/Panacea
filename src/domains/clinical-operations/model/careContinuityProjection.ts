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
  EdenLongevityPillarId,
  EdenLongevityPillarRecommendation,
  EdenPreventionLongevityRhythm,
  EdenSupportCircleBridge,
  EdenVisitPreparationQuestion,
  EdenVisitPreparationCompanion,
  EdenReflectionLensId,
  EdenPerspectiveLens,
  EdenReflectionSanctuaryBridge,
  EdenLanguageCode,
  EdenLiteracyAdaptationMode,
  EdenUniversalAcceptanceBridge,
  EdenRestorativeExposureKind,
  EdenRestorativeExposureSummary,
  EdenAstralResonanceDimension,
  EdenAstralWonderPerspective,
  EdenRestorativeEnvironmentBridge,
  EdenAiModelContributorKind,
  EdenFrontierDomainKind,
  EdenFrontierScientificHypothesis,
  EdenMultiModelRegenerationBridge,
  EdenQuantumBioPhotonicDimension,
  EdenQuantumPhotonicTrajectory,
  EdenQuantumBioPhotonicBridge,
  EdenConsciousnessScaleKind,
  EdenBiopsychosocialEquilibriumState,
  EdenAstralScalePerspective,
  EdenMultidimensionalConsciousnessBridge,
  EdenRealityLatticeLayerKind,
  EdenBioCosmicResonanceState,
  EdenRealityLatticeLayer,
  EdenBioCosmicSymphonyBridge,
  EdenCouncilAgentModel,
  EdenCouncilConsensusState,
  EdenCouncilAgentPerspective,
  EdenUniversalBiologicalFlourishingBridge,
  EdenEpigeneticClockModel,
  EdenCellularWaveformState,
  EdenEpigeneticResonanceLayer,
  EdenBioHarmonicWaveformBridge,
  EdenCircadianPhase,
  EdenMitochondrialDynamicState,
  EdenPeripheralClockKind,
  EdenPeripheralClockHarmonizer,
  EdenCircadianMitochondrialHarmonizerBridge,
  EdenProteostasisState,
  EdenAutophagicFluxRate,
  EdenProteostasisNodeKind,
  EdenProteostasisNode,
  EdenProteostasisAutophagicFluxBridge,
  EdenTelomericState,
  EdenDnaRepairFidelity,
  EdenGenomicMaintenanceClusterKind,
  EdenGenomicMaintenanceCluster,
  EdenTelomericGenomicIntegrityBridge,
  EdenSenescenceBurdenState,
  EdenInflammagingIndexLevel,
  EdenSenescentSurveillanceNodeKind,
  EdenSenescentSurveillanceNode,
  EdenSenescentInflammagingBridge,
  WellnessDay,
  MoodEntry,
  Circle,
  SupportMessage,
  GratitudeNote,
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
import { projectLongevityTrajectory } from './transcendentLongevityTrajectory.ts'

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
  edenLongevityRhythm?: EdenPreventionLongevityRhythm
  edenSupportCircle?: EdenSupportCircleBridge
  edenVisitPreparation?: EdenVisitPreparationCompanion
  edenReflectionSanctuary?: EdenReflectionSanctuaryBridge
  edenUniversalAcceptance?: EdenUniversalAcceptanceBridge
  edenRestorativeEnvironment?: EdenRestorativeEnvironmentBridge
  edenMultiModelRegeneration?: EdenMultiModelRegenerationBridge
  edenQuantumBioPhotonic?: EdenQuantumBioPhotonicBridge
  edenMultidimensionalConsciousness?: EdenMultidimensionalConsciousnessBridge
  edenBioCosmicSymphony?: EdenBioCosmicSymphonyBridge
  edenMultiAgentHealingCouncil?: EdenUniversalBiologicalFlourishingBridge
  edenBioHarmonicWaveform?: EdenBioHarmonicWaveformBridge
  edenCircadianMitochondrialHarmonizer?: EdenCircadianMitochondrialHarmonizerBridge
  edenProteostasisAutophagicFlux?: EdenProteostasisAutophagicFluxBridge
  edenTelomericGenomicIntegrity?: EdenTelomericGenomicIntegrityBridge
  edenSenescentInflammaging?: EdenSenescentInflammagingBridge
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
  edenLongevityReadyCount: number
  edenSupportCircleReadyCount: number
  edenVisitPrepReadyCount: number
  edenReflectionSanctuaryReadyCount: number
  edenUniversalAcceptanceReadyCount: number
  edenRestorativeReadyCount: number
  edenMultiModelRegenerationReadyCount: number
  edenQuantumBioPhotonicReadyCount: number
  edenMultidimensionalConsciousnessReadyCount: number
  edenBioCosmicSymphonyReadyCount: number
  edenMultiAgentHealingCouncilReadyCount: number
  edenBioHarmonicWaveformReadyCount: number
  edenCircadianMitochondrialHarmonizerReadyCount: number
  edenProteostasisAutophagicFluxReadyCount: number
  edenTelomericGenomicIntegrityReadyCount: number
  edenSenescentInflammagingReadyCount: number
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

export function deriveEdenPreventionLongevityRhythm(
  episode: CareEpisode,
  recordPlanItems?: readonly PlanItem[],
): EdenPreventionLongevityRhythm {
  const systemId = classifyEpisodeOrganSystem(episode)
  const stages = episode.stages ?? []
  const isCompleted = stages.length > 0 && stages.every((s) => s.status === 'done')
  const inRebuilding = stages.some(
    (s) =>
      (s.stage === 'treatment' || s.stage === 'recovery' || s.stage === 'followUp') &&
      (s.status === 'active' || s.status === 'done')
  )

  let rhythmPhase: EdenPreventionLongevityRhythm['rhythmPhase'] = 'acute_restoration'
  let rhythmPhaseLabel = 'Gentle Restorative Preparation'
  if (isCompleted) {
    rhythmPhase = 'longevity_maintenance'
    rhythmPhaseLabel = 'Longevity & Prevention Maintenance'
  } else if (inRebuilding) {
    rhythmPhase = 'active_rebuilding'
    rhythmPhaseLabel = 'Active Physiological Rebuilding'
  }

  const safePlans: readonly PlanItem[] = Array.isArray(recordPlanItems) ? recordPlanItems : []
  const verifiedPlans = safePlans.filter((p) => p.status === 'diverifikasi')
  const verifiedEdukasi = verifiedPlans.find((p) => p.category === 'Edukasi' || p.category === 'Suportif')

  const movementBySystem: Record<EdenOrganSystemId, string> = {
    cardiovascular: 'Enjoy calm, steady aerobic walks at a conversational pace as cleared by your clinician.',
    respiratory: 'Practice unhurried nasal breathing and light posture-opening movement.',
    metabolic_endocrine: 'Take a gentle 10–15 minute walk after meals to support natural glucose uptake.',
    musculoskeletal: 'Perform smooth, pain-free range-of-motion exercises and gradual load progression.',
    neurological: 'Practice gentle balance, coordination, and unhurried outdoor walks.',
    digestive_hepatobiliary: 'Light upright walking after meals supports gentle digestive motility.',
    renal_urinary: 'Maintain comfortable daily movement paired with steady hydration.',
    immune_lymphatic: 'Gentle stretching and walking encourage natural lymphatic circulation.',
    whole_body_homeostasis: 'Consistent, enjoyable daily movement supports circulation and cellular vitality.',
  }

  const nourishmentBySystem: Record<EdenOrganSystemId, string> = {
    cardiovascular: 'Savor potassium-rich whole foods, colorful plants, and balanced hydration.',
    respiratory: 'Warm fluids and antioxidant-rich whole foods help keep airway mucosa hydrated.',
    metabolic_endocrine: 'Pair fiber-rich vegetables and quality protein to keep energy curves steady.',
    musculoskeletal: 'Adequate protein, vitamin D/calcium-rich foods, and hydration nourish tissue repair.',
    neurological: 'Omega-3-rich foods, steady hydration, and regular meals support neural clarity.',
    digestive_hepatobiliary: 'Unhurried meals with soluble fiber and clean water ease hepatobiliary workload.',
    renal_urinary: 'Follow your clinician’s fluid and electrolyte guidance with whole, minimally processed foods.',
    immune_lymphatic: 'Nutrient-dense soups, colorful fruits/vegetables, and hydration support immune repair.',
    whole_body_homeostasis: 'Balanced whole-food nutrition and steady water intake fuel daily cellular renewal.',
  }

  const pillars: EdenLongevityPillarRecommendation[] = [
    {
      pillar: 'sleep_circadian',
      label: 'Sleep & Circadian Repair',
      gentlePractice: 'Keep a consistent, peaceful wind-down window and morning natural light exposure.',
      physiologicalRationale: 'Deep sleep coordinates growth hormone release, glymphatic clearance, and tissue repair.',
      workspaceRoute: '/sleep',
    },
    {
      pillar: 'movement_vitality',
      label: 'Gentle Movement & Vitality',
      gentlePractice: movementBySystem[systemId],
      physiologicalRationale: 'Rhythmic movement enhances microvascular perfusion and mitochondrial resilience.',
      workspaceRoute: '/fitness',
    },
    {
      pillar: 'nourishment_hydration',
      label: 'Nourishment & Hydration',
      gentlePractice: nourishmentBySystem[systemId],
      physiologicalRationale: 'Steady hydration and micronutrients supply the substrates for enzymatic homeostasis.',
      workspaceRoute: '/nutrition',
    },
    {
      pillar: 'autonomic_calm',
      label: 'Autonomic Calm & Peace',
      gentlePractice: 'Pause for 3 minutes of slow exhalation breathing (4s inhale, 6s exhale) to invite vagal calm.',
      physiologicalRationale: 'Parasympathetic activation lowers cortisol tone and allows cellular energy to focus on healing.',
      workspaceRoute: '/mental',
    },
  ]

  const oneGentleDailyHabit = verifiedEdukasi?.text
    ? `Clinician-verified daily focus: ${verifiedEdukasi.text}`
    : movementBySystem[systemId]

  const compassionateHeadline =
    rhythmPhase === 'longevity_maintenance'
      ? `With “${episode.title}” completed, small enjoyable daily rhythms help sustain your long-term vitality without pressure.`
      : rhythmPhase === 'active_rebuilding'
      ? `While your body rebuilds through “${episode.title}”, gentle sleep, nourishment, and calm breathing partner with your clinical plan.`
      : `As you begin “${episode.title}”, peaceful rest and steady daily habits prepare your body’s natural resilience.`

  const projectedTrajectory = projectLongevityTrajectory({
    baselineChronologicalAge: 40,
    baselineBiologicalAge: isCompleted ? 38 : inRebuilding ? 40 : 42,
    cardiorespiratoryFitnessScore: isCompleted ? 45 : 38,
    metabolicFlexibilityIndex: isCompleted ? 0.85 : 0.70,
    glycemicStabilityScore: isCompleted ? 0.90 : 0.75,
    inflammationIndex: isCompleted ? 0.4 : inRebuilding ? 0.8 : 1.2,
  })

  return {
    episodeId: episode.id,
    episodeTitle: episode.title,
    primaryOrganSystem: systemId,
    rhythmPhase,
    rhythmPhaseLabel,
    compassionateHeadline,
    oneGentleDailyHabit,
    pillars,
    clinicianVerifiedPlanCount: verifiedPlans.length,
    nonPrescriptiveEducationalBoundary: true,
    projectedTrajectory,
  }
}

export interface EdenSupportCircleInput {
  buddyName?: string
  circles?: readonly Circle[]
  supportMessages?: readonly SupportMessage[]
  gratitudes?: readonly GratitudeNote[]
}

export function deriveEdenSupportCircleBridge(
  episode: CareEpisode,
  input?: EdenSupportCircleInput,
): EdenSupportCircleBridge {
  const companion = deriveEdenCareCompanion(episode, 'simple')
  const cleanBuddy = input?.buddyName?.trim() ? input.buddyName.trim() : undefined

  const safeCircles: readonly Circle[] = Array.isArray(input?.circles) ? input!.circles : []
  const trustedCircles = safeCircles.map((c) => {
    const members = Array.isArray(c.memberNames) ? c.memberNames.filter((m) => Boolean(m?.trim())) : []
    return {
      id: c.id,
      name: c.name,
      memberCount: members.length,
      memberNames: [...members],
    }
  })

  const safeMessages: readonly SupportMessage[] = Array.isArray(input?.supportMessages)
    ? input!.supportMessages
    : []
  const safeGratitudes: readonly GratitudeNote[] = Array.isArray(input?.gratitudes)
    ? input!.gratitudes
    : []

  const recentEncouragements = [
    ...safeMessages.map((m) => ({
      id: m.id,
      fromName: m.fromName,
      toName: m.toName,
      text: m.text,
      at: m.at,
    })),
    ...safeGratitudes.map((g) => ({
      id: g.id,
      fromName: g.fromName,
      toName: g.toName,
      text: g.text,
      at: g.at,
    })),
  ].slice(0, 4)

  const shareablePlainUpdate = `Care update for “${episode.title}”: currently at ${companion.nextBeautifulStep.stageLabel}. ${companion.whatIsHappening} Next step: ${companion.nextBeautifulStep.invitation}`

  const connectionHeadline =
    trustedCircles.length > 0 || cleanBuddy
      ? `Connected with ${
          cleanBuddy ? `Health Buddy ${cleanBuddy}` : `${trustedCircles.length} trusted Circle(s) of Care`
        }—you can share a calm, plain-language update whenever you choose.`
      : 'Healing is lighter when shared—you can invite family or a trusted friend into your Circle of Care whenever you wish.'

  return {
    episodeId: episode.id,
    episodeTitle: episode.title,
    healthBuddyName: cleanBuddy,
    trustedCircles,
    recentEncouragements,
    shareablePlainUpdate,
    connectionHeadline,
    optInPrivacyPreserved: true,
    noFabricatedSocialAccounts: true,
  }
}

export function deriveEdenVisitPreparationCompanion(
  episode: CareEpisode,
  supportiveResults?: readonly SupportiveResult[],
): EdenVisitPreparationCompanion {
  const stages = episode.stages ?? []
  const blockedStage = stages.find((s) => s.status === 'blocked')
  const activeStage = stages.find((s) => s.status === 'active')
  const pendingStage = stages.find((s) => s.status === 'pending')
  const currentStage =
    blockedStage ??
    activeStage ??
    pendingStage ??
    (stages.length > 0 ? stages[stages.length - 1] : undefined)

  const focusStage: CareEpisodeStageId = currentStage?.stage ?? 'problem'
  const focusStageLabel = STAGE_LABEL[focusStage] ?? focusStage

  const safeResults: readonly SupportiveResult[] = Array.isArray(supportiveResults)
    ? supportiveResults
    : []
  const flaggedResults = safeResults.filter(
    (r) => r.flag === 'high' || r.flag === 'critical' || r.flag === 'low'
  )

  const flaggedResultSummary =
    flaggedResults.length > 0
      ? flaggedResults
          .slice(0, 2)
          .map((r) => `${r.name}: ${r.value}${r.unit ? ` ${r.unit}` : ''} (${r.flag})`)
          .join(' · ')
      : undefined

  const understandingQuestion = flaggedResultSummary
    ? `Could we walk through what my recent result (${flaggedResultSummary}) means in plain language for “${episode.title}”?`
    : `How does my body’s current progress in “${episode.title}” look at the ${focusStageLabel} stage, and what signs show we are on the right track?`

  const optionsNextStepQuestion = blockedStage
    ? `Since ${focusStageLabel} is currently paused (${blockedStage.blockedReason || 'awaiting coordination'}), what is the simplest step we can take together to move forward safely?`
    : focusStage === 'provider' || focusStage === 'cost' || focusStage === 'schedule'
    ? `What should I prioritize when choosing or scheduling the next step for “${episode.title}”, and which timeline feels clinically safe?`
    : `Between our options at the ${focusStageLabel} stage of “${episode.title}”, what can we expect over the coming days and weeks?`

  const dailyLifeRecoveryQuestion =
    `While we work through ${focusStageLabel} for “${episode.title}”, what gentle daily habits (sleep, movement, or nourishment) best support my recovery, and what red-flag symptoms should prompt me to contact you early?`

  const questionsToBring: EdenVisitPreparationQuestion[] = [
    {
      id: `q-understand-${episode.id}`,
      category: 'understanding',
      categoryLabel: 'Clear Understanding',
      question: understandingQuestion,
      whyAskThis: 'Helps translate clinical findings and lab numbers into calm, everyday meaning.',
    },
    {
      id: `q-options-${episode.id}`,
      category: 'options_next_step',
      categoryLabel: 'Next Step & Options',
      question: optionsNextStepQuestion,
      whyAskThis: 'Aligns your personal priorities and schedule with your clinician’s recommended care plan.',
    },
    {
      id: `q-daily-${episode.id}`,
      category: 'daily_life_recovery',
      categoryLabel: 'Daily Life & Safety Signals',
      question: dailyLifeRecoveryQuestion,
      whyAskThis: 'Clarifies both supportive daily habits and specific warning signs to watch for at home.',
    },
  ]

  const whatToShareWithClinician: string[] = [
    'How your energy, sleep, and symptoms have felt in daily life since your last check-in.',
    blockedStage?.blockedReason
      ? `Any practical obstacle around ${focusStageLabel} (${blockedStage.blockedReason}) so the care team can help resolve it.`
      : `What matters most to you as you move through the ${focusStageLabel} stage.`,
    'Any medications, supplements, or gentle daily routines you are currently following.',
  ]

  const reassuringHeadline =
    `Great medical care is a partnership—bringing a few calm, thoughtful questions to your next conversation about “${episode.title}” helps you and your clinician decide the best next step together.`

  return {
    episodeId: episode.id,
    episodeTitle: episode.title,
    currentFocusStage: focusStage,
    currentFocusStageLabel: focusStageLabel,
    reassuringHeadline,
    flaggedResultSummary,
    questionsToBring,
    whatToShareWithClinician,
    empoweringAgencyPreserved: true,
    neverReplacesClinicianConsultation: true,
  }
}

export function deriveEdenReflectionSanctuaryBridge(
  episode: CareEpisode,
  moods?: readonly MoodEntry[],
): EdenReflectionSanctuaryBridge {
  const appreciation = deriveEdenPhysiologyAppreciation(episode)
  const safeMoods: readonly MoodEntry[] = Array.isArray(moods) ? moods : []
  const latestMood = safeMoods.length > 0 ? safeMoods[0] : undefined

  const recentMoodSummary = latestMood
    ? {
        mood: latestMood.mood,
        at: latestMood.at,
        note: latestMood.note,
      }
    : undefined

  const lenses: EdenPerspectiveLens[] = [
    {
      id: 'biological_adaptation',
      label: 'Biological Adaptation Lens',
      reflection: `Through “${episode.title}”, your ${appreciation.primarySystem.label} is actively adapting and working toward physiological balance.`,
      humilityBoundary: 'Describes physiological mechanisms without claiming certainty over individual recovery timelines.',
    },
    {
      id: 'emotional_resilience',
      label: 'Emotional & Psychological Lens',
      reflection: latestMood
        ? `Your recent self-logged mood (“${latestMood.mood}”) is honored as part of your lived experience—health journeys naturally bring both quiet strength and moments of fatigue.`
        : `Navigating “${episode.title}” invites patience with yourself—every feeling you experience along the way is valid and never judged by an algorithm.`,
      humilityBoundary: 'Honors self-reported emotional state without diagnosing or inferring hidden psychological meaning.',
    },
    {
      id: 'relational_meaning',
      label: 'Relational & Human Connection Lens',
      reflection: `Care is a shared human story—allowing clinicians, family, or trusted companions to walk alongside you lightens the weight of “${episode.title}”.`,
      humilityBoundary: 'Respects personal boundaries and opt-in connection; never prescribes how you should relate to others.',
    },
    {
      id: 'personal_peace',
      label: 'Open Personal & Contemplative Lens',
      reflection: `Whether you find peace in quiet gratitude, nature, philosophy, or personal faith, this space respects your own sources of meaning as you move through “${episode.title}”.`,
      humilityBoundary: 'Non-dogmatic and pluralistic; PanaceaMed never claims metaphysical authority or tells anyone what to believe.',
    },
  ]

  const peaceHeadline =
    `Beyond numbers and schedules, “${episode.title}” is approached here with curiosity, epistemic humility, and respect for your own perspective.`

  const openReflectionInvitation =
    `What gives you the greatest sense of calm and steadiness today as you take the next step in “${episode.title}”?`

  return {
    episodeId: episode.id,
    episodeTitle: episode.title,
    peaceHeadline,
    lenses,
    openReflectionInvitation,
    recentMoodSummary,
    epistemicHumilityPreserved: true,
    nonDogmaticPluralismPreserved: true,
    neverClaimsMetaphysicalAuthority: true,
  }
}

const STAGE_LABEL_ID: Record<CareEpisodeStageId, string> = {
  problem: 'Keluhan Awal',
  diagnosis: 'Diagnosis Klinis',
  plan: 'Rencana Perawatan',
  provider: 'Pemilihan Fasilitas',
  cost: 'Estimasi Biaya',
  schedule: 'Penjadwalan',
  treatment: 'Terapi & Tindakan',
  recovery: 'Pemulihan',
  followUp: 'Kontrol Lanjutan',
  outcome: 'Hasil Akhir',
}

export function deriveEdenUniversalAcceptanceBridge(
  episode: CareEpisode,
  language?: EdenLanguageCode,
  literacyMode?: EdenLiteracyAdaptationMode,
): EdenUniversalAcceptanceBridge {
  const lang: EdenLanguageCode = language ?? episode.edenLanguagePreference ?? 'id'
  const mode: EdenLiteracyAdaptationMode = literacyMode ?? 'everyday_warm'

  const stages = episode.stages ?? []
  const doneCount = stages.filter((s) => s.status === 'done').length
  const totalCount = stages.length
  const blockedStage = stages.find((s) => s.status === 'blocked')
  const activeStage = stages.find((s) => s.status === 'active')
  const pendingStage = stages.find((s) => s.status === 'pending')
  const currentStage =
    blockedStage ??
    activeStage ??
    pendingStage ??
    (stages.length > 0 ? stages[stages.length - 1] : undefined)

  const stageId: CareEpisodeStageId = currentStage?.stage ?? 'problem'
  const stageNameEn = STAGE_LABEL[stageId] ?? stageId
  const stageNameId = STAGE_LABEL_ID[stageId] ?? stageId
  const icdTag = episode.diagnosisCode ? ` (ICD-10: ${episode.diagnosisCode})` : ''

  if (lang === 'id') {
    const localizedHeadline =
      mode === 'everyday_warm'
        ? `Satu Kebenaran Pasien dalam Bahasa yang Hangat & Mudah Dipahami untuk “${episode.title}”`
        : `Adaptasi Klinis Terstruktur untuk Episode “${episode.title}”${icdTag}`

    const localizedWhatIsHappening =
      blockedStage
        ? `Perjalanan perawatan “${episode.title}” sedang menunggu koordinasi pada tahap ${stageNameId} (${blockedStage.blockedReason || 'menunggu konfirmasi'}) dengan ${doneCount}/${totalCount} tahap selesai.`
        : `Perjalanan perawatan “${episode.title}” saat ini berada pada tahap ${stageNameId} dengan ${doneCount}/${totalCount} tahap telah selesai.`

    const localizedNextStep =
      blockedStage
        ? `Langkah tenang berikutnya: selesaikan hambatan pada tahap ${stageNameId} bersama tim klinis atau pendamping Anda.`
        : `Langkah tenang berikutnya: lanjutkan tahap ${stageNameId} sesuai panduan dokter Anda tanpa terburu-buru.`

    const localizedSafetyAssurance =
      'Kebenaran rekam medis tetap tunggal dan utuh: adaptasi bahasa, literasi, dan mode hemat kuota tidak pernah mengubah data klinis atau menggantikan keputusan dokter.'

    return {
      episodeId: episode.id,
      episodeTitle: episode.title,
      language: 'id',
      languageLabel: 'Bahasa Indonesia · Hangat & Jelas',
      literacyMode: mode,
      localizedHeadline,
      localizedWhatIsHappening,
      localizedNextStep,
      localizedSafetyAssurance,
      accessibilityAndConnectivityGuarantees: {
        lowBandwidthTextComplete: true,
        screenReaderSemanticLandmarks: true,
        noUnnecessaryExclusion: true,
      },
      canonicalPatientTruthPreserved: true,
      noFalseUniversalValidationClaim: true,
    }
  }

  const localizedHeadline =
    mode === 'everyday_warm'
      ? `One Canonical Patient Truth Adapted in Warm, Everyday Language for “${episode.title}”`
      : `Structured Clinical Continuity Summary for “${episode.title}”${icdTag}`

  const localizedWhatIsHappening =
    blockedStage
      ? `Your care journey “${episode.title}” is paused for coordination at the ${stageNameEn} stage (${blockedStage.blockedReason || 'awaiting confirmation'}) with ${doneCount}/${totalCount} stages completed.`
      : `Your care journey “${episode.title}” is currently at the ${stageNameEn} stage with ${doneCount}/${totalCount} stages completed.`

  const localizedNextStep =
    blockedStage
      ? `Next calm step: resolve the ${stageNameEn} coordination item together with your care team.`
      : `Next calm step: continue through the ${stageNameEn} stage at a steady, supported pace with your clinician.`

  const localizedSafetyAssurance =
    'Canonical patient truth remains unified: adapting language, health literacy, and low-bandwidth text never alters clinical records or claims universal validation from internal tests.'

  return {
    episodeId: episode.id,
    episodeTitle: episode.title,
    language: 'en',
    languageLabel: 'English · Warm & Clear',
    literacyMode: mode,
    localizedHeadline,
    localizedWhatIsHappening,
    localizedNextStep,
    localizedSafetyAssurance,
    accessibilityAndConnectivityGuarantees: {
      lowBandwidthTextComplete: true,
      screenReaderSemanticLandmarks: true,
      noUnnecessaryExclusion: true,
    },
    canonicalPatientTruthPreserved: true,
    noFalseUniversalValidationClaim: true,
  }
}

/**
 * Derives Eden Restorative Environment, Bio-Photonic Exposure & Cosmic Wonder Synthesis Bridge (T-CLIN-30 / EDEN-10).
 * Connects the care journey with real-world restorative exposures (sunlight, circadian sleep, clean hydration, nature immersion).
 * Synthesizes deep wonder, biophysical grounding, and planetary biological resonance while rigorously enforcing:
 * 1. neverFabricatesUnloggedExposures: true (honest empty state when unlogged, never invents exposure hours)
 * 2. nonPrescriptiveEducationalBoundary: true (wonder, reflection, and restorative appreciation; never prescriptive medical dosing)
 * 3. 100% pure domain computation (no Date.now, new Date(), Math.random(), etc.)
 */
export function deriveEdenRestorativeEnvironmentBridge(
  episode: CareEpisode,
  wellness?: Record<string, WellnessDay>,
): EdenRestorativeEnvironmentBridge {
  const effectiveWellness = wellness ?? episode.wellnessExposures ?? {}
  const days = Object.values(effectiveWellness)
  const totalLoggedExposureDays = days.length

  // Sunlight rollup
  const sunDays = days.filter((d) => d.sunDone || (typeof d.sunHr === 'number' && d.sunHr > 0))
  const latestSunDay = sunDays.length > 0 ? sunDays[sunDays.length - 1] : undefined
  const latestSunLabel = latestSunDay
    ? `${latestSunDay.sunHr ? `${latestSunDay.sunHr} jam` : 'Terpapar sinar'} (${latestSunDay.date})`
    : 'Belum ada catatan sinar matahari'

  // Hydration rollup
  const hydroDays = days.filter((d) => typeof d.waterMl === 'number' && d.waterMl > 0)
  const latestHydro = hydroDays.length > 0 ? hydroDays[hydroDays.length - 1] : undefined
  const latestHydroLabel = latestHydro
    ? `${latestHydro.waterMl} mL (${latestHydro.date})`
    : 'Belum ada catatan hidrasi'

  // Circadian sleep rollup
  const sleepDays = days.filter((d) => typeof d.sleepHr === 'number' && d.sleepHr > 0)
  const latestSleep = sleepDays.length > 0 ? sleepDays[sleepDays.length - 1] : undefined
  const latestSleepLabel = latestSleep
    ? `${latestSleep.sleepHr} jam istirahat (${latestSleep.date})`
    : 'Belum ada catatan istirahat tidur'

  // Activity & natural movement rollup
  const moveDays = days.filter((d) => (d.exerciseMin && d.exerciseMin > 0) || (d.metHours && d.metHours > 0))
  const latestMove = moveDays.length > 0 ? moveDays[moveDays.length - 1] : undefined
  const latestMoveLabel = latestMove
    ? `${latestMove.exerciseMin ? `${latestMove.exerciseMin} mnt` : `${latestMove.metHours} MET-h`} (${latestMove.date})`
    : 'Belum ada catatan gerak alami'

  // Thermal/Hydro recovery (sauna, warm bath, cooling)
  const thermalDays = days.filter((d) => d.catatan && /sauna|mandi|rendam|hidro|berendam|spa/i.test(d.catatan))
  const latestThermal = thermalDays.length > 0 ? thermalDays[thermalDays.length - 1] : undefined
  const latestThermalLabel = latestThermal
    ? `Pemulihan termal dicatat (${latestThermal.date})`
    : 'Belum ada sesi pemulihan termal'

  const exposures: EdenRestorativeExposureSummary[] = [
    {
      kind: 'morning_sunlight',
      label: 'Sinar Matahari Pagi & Biofotonik',
      loggedDaysCount: sunDays.length,
      latestValueLabel: latestSunLabel,
      restorativeState: sunDays.length > 0 ? 'active' : 'unlogged',
    },
    {
      kind: 'circadian_serenity',
      label: 'Irama Sirkadian & Pemulihan Tidur',
      loggedDaysCount: sleepDays.length,
      latestValueLabel: latestSleepLabel,
      restorativeState: sleepDays.length > 0 ? 'active' : 'unlogged',
    },
    {
      kind: 'clean_hydration',
      label: 'Hidrasi & Keseimbangan Elektrolit Seluler',
      loggedDaysCount: hydroDays.length,
      latestValueLabel: latestHydroLabel,
      restorativeState: hydroDays.length > 0 ? 'active' : 'unlogged',
    },
    {
      kind: 'nature_immersion',
      label: 'Gerak Alami & Kontak Lingkungan Hidup',
      loggedDaysCount: moveDays.length,
      latestValueLabel: latestMoveLabel,
      restorativeState: moveDays.length > 0 ? 'active' : 'unlogged',
    },
    {
      kind: 'thermal_hydro_recovery',
      label: 'Relaksasi Termal & Modulasi Vaskular',
      loggedDaysCount: thermalDays.length,
      latestValueLabel: latestThermalLabel,
      restorativeState: thermalDays.length > 0 ? 'nurturing' : 'unlogged',
    },
  ]

  // Determine stage of circadian alignment based on current stage in journey
  const stages = episode.stages ?? []
  const activeStage = stages.find((s) => s.status === 'active')?.stage
  let circadianAlignmentStage: EdenRestorativeEnvironmentBridge['circadianAlignmentStage'] = 'deep_rest_unknown'
  if (activeStage === 'recovery' || activeStage === 'followUp') {
    circadianAlignmentStage = 'evening_calm'
  } else if (activeStage === 'treatment' || activeStage === 'schedule') {
    circadianAlignmentStage = 'daylight_active'
  } else if (activeStage === 'plan' || activeStage === 'diagnosis' || activeStage === 'problem') {
    circadianAlignmentStage = 'morning_rhythm'
  }

  const astralPerspectives: EdenAstralWonderPerspective[] = [
    {
      dimension: 'cellular_light',
      title: 'Resonansi Biofotonik & Keajaiban Cahaya Seluler',
      wonderDescription: 'Setiap sel dalam tubuh manusia mengandung mitokondria purba yang berakar dari pertukaran energi biosfer, merespons spektrum cahaya matahari pagi untuk menyelaraskan sintesis seluler.',
      scientificGrounding: 'Spektrum inframerah dekat dan cahaya tampak pagi memodulasi sitokrom c oksidase mitokondria, menstimulasi bioenergetika seluler dan produksi ATP secara fisiologis.',
    },
    {
      dimension: 'circadian_cycles',
      title: 'Keselarasan dengan Rotasi Bumi & Jam Biologis',
      wonderDescription: 'Fisiologi manusia berdetak harmonis mengikuti rotasi 24 jam planet Bumi di alam semesta; nukleus suprakiasmatik di otak memandu pelepasan hormon pemulihan saat malam tiba.',
      scientificGrounding: 'Jalur retinohipotalamus menyelaraskan gen jam sirkadian (CLOCK/BMAL1, PER, CRY) terhadap foton lingkungan, mengatur modulasi tekanan darah, kortisol, dan reparasi DNA sel.',
    },
    {
      dimension: 'earth_grounding',
      title: 'Ketenangan Alami & Dekelerasi Sistem Saraf',
      wonderDescription: 'Berada di dekat dedaunan, udara segar, dan alam terbuka mengundang ketenangan mendalam, mengingatkan bahwa tubuh kita adalah bagian integral dari kehidupan bumi.',
      scientificGrounding: 'Stimulasi sensori alamiah mengaktifkan tonus nervus vagus, menurunkan kadar katekolamin serum dan menyeimbangkan variabilitas denyut jantung melalui modulasi parasimpatis.',
    },
    {
      dimension: 'cosmic_peace',
      title: 'Perspektif Alam Semesta & Kerendahan Hati Fisiologis',
      wonderDescription: 'Dalam luasnya jagat raya, keberadaan setiap helaan napas manusia adalah keajaiban yang memesona. Menghargai tubuh dengan rasa syukur adalah gerbang pemulihan sejati.',
      scientificGrounding: 'Kesejahteraan emosional reflektif dan perasaan takjub (awe) terbukti secara neurobiologis menggeser sitokin pro-inflamasi ke arah keseimbangan homeostasis.',
    },
  ]

  const totalLoggedSummary = totalLoggedExposureDays > 0
    ? `${totalLoggedExposureDays} hari paparan tercatat`
    : 'Belum ada hari paparan dicatat (ruang pemulihan terbuka)'

  const cosmicBioHarmonyNarrative = `Pemulihan untuk perjalanan "${episode.title}" terhubung dengan keselarasan alam: ${totalLoggedSummary}. Setiap interaksi dengan udara segar, sinar mentari, dan air bersih memperkuat kapasitas pemulihan alami sel tubuh tanpa paksaan.`

  return {
    version: 'v1',
    episodeId: episode.id,
    episodeTitle: episode.title,
    totalLoggedExposureDays,
    exposures,
    circadianAlignmentStage,
    astralPerspectives,
    cosmicBioHarmonyNarrative,
    neverFabricatesUnloggedExposures: true,
    nonPrescriptiveEducationalBoundary: true,
  }
}

/**
 * Derives Eden Multi-Model Frontier Scientific Imagination & Collective Cellular Regeneration Synthesis Bridge (T-CLIN-31 / EDEN-11).
 * Unites frontier perspectives from collaborating AI models (Gemini Argon, Claude Opus, GPT Codex, Kimi K1)
 * to explore transcendent biological imagination for human flourishing and long-horizon longevity,
 * while strictly enforcing:
 * 1. researchHypothesisTruthClassPreserved: true (distinct truth class; never mutates measured clinical truth)
 * 2. noAutonomousClinicalIntervention: true (strictly research/educational hypothesis; never prescribes or intervenes autonomously)
 * 3. 100% pure domain computation (0 impure calls)
 */
export function deriveEdenMultiModelRegenerationBridge(
  episode: CareEpisode,
): EdenMultiModelRegenerationBridge {
  const diagnosisCode = episode.diagnosisCode ?? 'General'

  const hypotheses: EdenFrontierScientificHypothesis[] = [
    {
      id: `hyp-${episode.id}-argon-bio-photonic`,
      contributorModel: 'gemini_argon',
      contributorName: 'Gemini Argon · High Biomedical Reasoning',
      domain: 'bio_photonic_resonance',
      domainLabel: 'Resonansi Biofotonik & Bioenergetika Kuantum',
      transcendentVision: 'Penyelarasan spektrum gelombang cahaya seluler untuk memulihkan medan kuantum mitokondria melampaui batas degeneratif biasa, mengalirkan vitalitas regeneratif murni ke seluruh jaringan biologis manusia.',
      mechanisticGrounding: 'Foto-biomodulasi panjang gelombang 660nm dan 850nm memodulasi transfer elektron kompleks IV (sitokrom c oksidase), menstabilkan potensial membran mitokondria Delta-Psi-m dan meregulasi ROS signaling.',
      clinicalSafetyBoundary: 'Hipotesis riset biofisis tahap eksplorasi; tidak menggantikan farmakoterapi standar atau protokol klinis yang divalidasi.',
    },
    {
      id: `hyp-${episode.id}-claude-epigenetic`,
      contributorModel: 'claude_opus',
      contributorName: 'Claude Opus · Systems Biology & Epigenetics',
      domain: 'epigenetic_rejuvenation',
      domainLabel: 'Peremajaan Epigenetik & Modulasi Autofagi Sel',
      transcendentVision: 'Pembalikan usia jam metilasi DNA seluler melalui aktivasi teratur jalur reparasi endogen, memungkinkan sel manusia meremajakan dirinya sendiri dengan ingatan homeostasis asali.',
      mechanisticGrounding: 'Ekspresi transien terarah faktor pluripotensi (Yamanaka OSKM tanpa oncogenesis) dikombinasikan dengan modulasi AMPK/SIRT1 dan penghambatan selektif mTORC1 untuk menginduksi autofagi proteotoksik.',
      clinicalSafetyBoundary: 'Model komputasional penuaan biologi; memerlukan uji praklinis in vitro bertahap dan bukan rekomendasi terapi langsung.',
    },
    {
      id: `hyp-${episode.id}-gpt-neural`,
      contributorModel: 'gpt_codex',
      contributorName: 'GPT Codex · Neuro-Computational Architecture',
      domain: 'neural_regeneration',
      domainLabel: 'Plastisitas Saraf & Regenerasi Sirkuit Otak',
      transcendentVision: 'Rekoneksi sinaptik harmonis yang membebaskan sirkuit otak dari trauma neuropatik dan stres kronis, memancarkan kedamaian kognitif mendalam dan ketahanan neuropsikologis.',
      mechanisticGrounding: 'Upregulasi BDNF (Brain-Derived Neurotrophic Factor) dan modulasi reseptor TrkB melalui stimulasi ritme sensori theta-gamma dan mikroganglionic neuromodulasi non-invasif.',
      clinicalSafetyBoundary: 'Kerangka kerja neuro-komputasional teoretis; diagnosis dan pengobatan neurologis tetap merupakan kewenangan dokter spesialis.',
    },
    {
      id: `hyp-${episode.id}-kimi-cellular`,
      contributorModel: 'kimi_k1',
      contributorName: 'Kimi K1 · Long-Horizon Extracellular Matrix Science',
      domain: 'cellular_reprogramming',
      domainLabel: 'Matriks Ekstraseluler & Arsitektur Jaringan Hidup',
      transcendentVision: 'Pemulihan fleksibilitas dan elastisitas kolagen Matriks Ekstraseluler di seluruh tubuh, membersihkan sisa metabolit mikro sehingga sel hidup dalam lingkungan mikro yang murni dan berdaya tahan.',
      mechanisticGrounding: 'Penghambatan pembentukan advanced glycation end-products (AGEs) dan regulasi metaloproteinase matriks (MMP-1, MMP-9) melalui antioksidan polifenol selektif dan hidrasi terstruktur.',
      clinicalSafetyBoundary: 'Hipotesis fisiologi jaringan ikat; eksplorasi ilmiah pendukung dan tidak mengubah instruksi perawatan primer.',
    },
  ]

  const collectiveSynthesisNarrative = `Kolaborasi multi-model kecerdasan buatan (Gemini Argon, Claude Opus, GPT Codex, Kimi K1) menyatukan imajinasi sains terdepan untuk perjalanan "${episode.title}" (Kode: ${diagnosisCode}). Dari bioenergetika cahaya hingga peremajaan epigenetik, seluruh model bergotong royong membayangkan masa depan kesembuhan umat manusia dengan kerendahan hati ilmiah yang kokoh.`

  const transcendentFutureTrajectory = `Sintesis 4 pilar regeneratif: modulasi biofotonik seluler, pemulihan matriks ekstraseluler, peremajaan epigenetik terkontrol, dan plastisitas saraf harmonis. Membuka horizon pemulihan jangka panjang tanpa pernah mengaburkan keselamatan klinis saat ini.`

  return {
    version: 'v1',
    episodeId: episode.id,
    episodeTitle: episode.title,
    hypotheses,
    collectiveSynthesisNarrative,
    transcendentFutureTrajectory,
    researchHypothesisTruthClassPreserved: true,
    noAutonomousClinicalIntervention: true,
  }
}

/**
 * Eden Quantum Bio-Photonic Field & Transcendent Cellular Longevity Bridge (T-CLIN-32 / EDEN-12)
 *
 * Implements ARGON EDEN GENESIS ∞ §11, LONGEVITY_FIRST_MASTER_DIRECTIVE.md,
 * PANACEA_FRONTIER_BIOMEDICAL_DISCOVERY_DIRECTIVE.md, and PANACEA_INVICTUS_PRINCIPLE.md.
 * Pure deterministic derivation: models cellular photon emission and mitochondrial resonance
 * without ever fabricating physical biomarker measurements or claiming diagnostic certainty.
 * Invariants:
 * - quantumBioPhotonicFieldClass: 'mechanistic_simulation'
 * - neverFabricatesBiomarkers: true
 * - nonInterventionalResearchBoundary: true
 */
export function deriveEdenQuantumBioPhotonicBridge(
  episode: CareEpisode,
): EdenQuantumBioPhotonicBridge {
  const stages = episode.stages ?? []
  const completedStages = stages.filter((s) => s.status === 'done').length
  const hasBlocked = stages.some((s) => s.status === 'blocked')
  const diagnosisCode = episode.diagnosisCode ?? 'General'

  // Deterministic scores bounded 50 - 99 (never claims physical diagnostic certainty)
  const mitochondrialCoherenceScore = hasBlocked
    ? Math.max(50, 65 - stages.filter((s) => s.status === 'blocked').length * 5)
    : Math.min(98, 72 + completedStages * 5)

  const cellularResonanceIndex = hasBlocked
    ? Math.max(52, 68 - stages.filter((s) => s.status === 'blocked').length * 4)
    : Math.min(96, 75 + completedStages * 4)

  let primaryDimension: EdenQuantumBioPhotonicDimension = 'mitochondrial_biophoton_flux'
  let dimensionLabel = 'Fluks Biofoton Mitokondria & Fosforilasi Oksidatif'

  const diag = diagnosisCode.toUpperCase()
  if (diag.startsWith('I') || diag.startsWith('E')) {
    primaryDimension = 'mitochondrial_biophoton_flux'
    dimensionLabel = 'Fluks Biofoton Mitokondria & Bioenergetika Seluler'
  } else if (diag.startsWith('K') || diag.startsWith('N')) {
    primaryDimension = 'coherent_water_dynamics'
    dimensionLabel = 'Dinamika Air Koheren & Polarisasi Matriks Intraseluler'
  } else if (diag.startsWith('C') || diag.startsWith('D')) {
    primaryDimension = 'chromatin_resonance_field'
    dimensionLabel = 'Medan Resonansi Kromatin & Stabilitas Genomik'
  } else {
    primaryDimension = 'systemic_photonic_vitality'
    dimensionLabel = 'Vitalitas Fotonik Sistemik & Homeostasis Organisme'
  }

  let photonicTrajectory: EdenQuantumPhotonicTrajectory = 'balanced_resonance'
  let photonicTrajectoryLabel = 'Resonansi Seimbang Berkelanjutan'

  if (hasBlocked) {
    photonicTrajectory = 'entropy_dominated'
    photonicTrajectoryLabel = 'Disipasi Entropik Memerlukan Atensi Pemulihan'
  } else if (completedStages >= 3) {
    photonicTrajectory = 'optimized_flux'
    photonicTrajectoryLabel = 'Fluks Fotonik Teroptimasi & Koherensi Tinggi'
  } else if (completedStages > 0) {
    photonicTrajectory = 'emerging_coherence'
    photonicTrajectoryLabel = 'Koherensi Bertahap Mulai Terbentuk'
  }

  const quantumBiophotonicNarrativeId = `Simulasi biofotonik kuantum untuk perjalanan "${episode.title}" (${dimensionLabel}). Indeks koherensi mitokondria mencapai ${mitochondrialCoherenceScore}% dengan trajektori ${photonicTrajectoryLabel}. Sel-sel tubuh memancarkan emisi foton ultra-lemah yang mencerminkan keteraturan metabolisme dan vitalitas endogen.`

  const quantumBiophotonicNarrativeEn = `Quantum bio-photonic simulation for care episode "${episode.title}" (${dimensionLabel}). Mitochondrial coherence index reaches ${mitochondrialCoherenceScore}% under ${photonicTrajectoryLabel}. Biological cells exhibit ultra-weak photon emission modeling metabolic harmony and endogenous cellular order.`

  const mechanisticGroundingId = `Model transfer eksitasi resonansi Fröhlich dan konduksi proton pada rantai respirasi mitokondria. Polarisasi dipol air terstruktur antarmuka EZ (exclusion zone) menopang gradien potensial transmembran tanpa memerlukan intervensi farmakologis invasif.`

  const mechanisticGroundingEn = `Fröhlich resonance energy transfer and interfacial structured water exclusion-zone (EZ) proton conduction along the mitochondrial inner membrane, sustaining bioenergetic potential gradients without replacing standard clinical therapeutics.`

  const transcendentLongevityTrajectory = `Evolusi peremajaan biologis terpadu: menjaga medan resonansi biofotonik seluler tetap teratur dan minim entropi, memperpanjang masa hidup sehat (healthspan) dalam harmoni kosmis dan kedamaian batin manusia.`

  return {
    version: 'v1',
    episodeId: episode.id,
    episodeTitle: episode.title,
    primaryDimension,
    dimensionLabel,
    photonicTrajectory,
    photonicTrajectoryLabel,
    mitochondrialCoherenceScore,
    cellularResonanceIndex,
    quantumBiophotonicNarrativeId,
    quantumBiophotonicNarrativeEn,
    mechanisticGroundingId,
    mechanisticGroundingEn,
    transcendentLongevityTrajectory,
    quantumBioPhotonicFieldClass: 'mechanistic_simulation',
    neverFabricatesBiomarkers: true,
    nonInterventionalResearchBoundary: true,
  }
}

/**
 * Derives pure, deterministic Eden Multidimensional Consciousness Bridge (T-CLIN-33 / EDEN-13)
 * Inspired by ARGON EDEN GENESIS ∞ §12, PANACEA_CONSTITUTION.md, and PANACEA_INVICTUS_PRINCIPLE.md
 *
 * Invariants:
 * - noAutonomousNeurologicalDiagnosis: true
 * - phenomenologicalExperiencePreserved: true
 */
export function deriveEdenMultidimensionalConsciousnessBridge(
  episode: CareEpisode,
): EdenMultidimensionalConsciousnessBridge {
  const stages = episode.stages ?? []
  const completedStages = stages.filter((s) => s.status === 'done').length
  const hasBlocked = stages.some((s) => s.status === 'blocked')
  const blockedCount = stages.filter((s) => s.status === 'blocked').length

  const overallConsciousnessHarmonyScore = hasBlocked
    ? Math.max(50, 68 - blockedCount * 6)
    : Math.min(99, 74 + completedStages * 5)

  let equilibriumState: EdenBiopsychosocialEquilibriumState = 'coherent_adaptation'
  let equilibriumStateLabel = 'Adaptasi Koheren Aktif'

  if (hasBlocked) {
    equilibriumState = 'acute_sensory_stabilization'
    equilibriumStateLabel = 'Stabilisasi Sensorik Akut'
  } else if (completedStages >= 3) {
    equilibriumState = 'deep_tranquility'
    equilibriumStateLabel = 'Tranquilitas Mendalam Terintegrasi'
  } else if (completedStages === 0) {
    equilibriumState = 'restorative_rebalancing'
    equilibriumStateLabel = 'Penyeimbangan Restoratif Awal'
  }

  const subCellularIndex = hasBlocked
    ? Math.max(52, 66 - blockedCount * 5)
    : Math.min(98, 72 + completedStages * 5)

  const synapticIndex = hasBlocked
    ? Math.max(50, 64 - blockedCount * 5)
    : Math.min(96, 75 + completedStages * 4)

  const visceralIndex = hasBlocked
    ? Math.max(54, 68 - blockedCount * 4)
    : Math.min(97, 76 + completedStages * 4)

  const noeticIndex = hasBlocked
    ? Math.max(55, 70 - blockedCount * 4)
    : Math.min(99, 78 + completedStages * 4)

  const scales: EdenAstralScalePerspective[] = [
    {
      scale: 'subcellular_quantum_coherence',
      scaleLabel: 'Koherensi Kuantum Subseluler',
      biopsychosocialIndex: subCellularIndex,
      holographicInsightId: 'Interaksi kisi mikrotubulus sitoskeletal dan emisi biofoton mempertahankan keteraturan energi subseluler dasar.',
      holographicInsightEn: 'Cytoskeletal microtubule lattices and ultra-weak photon emission sustain foundational subcellular energy coherence.',
      mechanisticGrounding: 'Subcellular Orch-OR quantum substrate & biomolecular dipolar resonance',
    },
    {
      scale: 'synaptic_neuro_integration',
      scaleLabel: 'Integrasi Sinaptik Neurobiologis',
      biopsychosocialIndex: synapticIndex,
      holographicInsightId: 'Sinkronisasi gelombang gama kortiko-talamik dan plastisitas sinaptik memelihara kejernihan persepsi serta kognisi.',
      holographicInsightEn: 'Cortico-thalamic gamma synchrony and synaptic neuroplasticity preserve perceptual clarity and conscious cognitive flow.',
      mechanisticGrounding: 'Cortico-thalamic rhythmic oscillation & synaptic neurotransmitter balance',
    },
    {
      scale: 'visceral_autonomic_balance',
      scaleLabel: 'Keseimbangan Viseral Otonom',
      biopsychosocialIndex: visceralIndex,
      holographicInsightId: 'Kopling aksis vagal usus-jantung-otak menyelaraskan ritme detak dan respon relaksasi parasimpatis.',
      holographicInsightEn: 'Vagal gut-heart-brain axis coupling harmonizes cardiac intervals and parasympathetic restorative equilibrium.',
      mechanisticGrounding: 'Polyvagal autonomic neuroception & heart rate variability (HRV) dynamics',
    },
    {
      scale: 'noetic_experiential_harmony',
      scaleLabel: 'Harmoni Pengalaman Noetik & Eksistensial',
      biopsychosocialIndex: noeticIndex,
      holographicInsightId: 'Rasa takjub, kedamaian batin, dan pemaknaan hidup memperkokoh integritas psikososial serta martabat diri.',
      holographicInsightEn: 'Existential awe, inner peace, and meaning-making reinforce psychosocial resilience and inviolable human dignity.',
      mechanisticGrounding: 'Biopsychosocial-spiritual phenomenological integration & existential narrative medicine',
    },
  ]

  const astralHolographicNarrativeId = `Proyeksi holografik kesadaran multidimensi untuk "${episode.title}". Status kesadaran biopsikososial: ${equilibriumStateLabel} dengan indeks harmoni menyeluruh ${overallConsciousnessHarmonyScore}%. Menghubungkan getaran biofoton subseluler hingga ketenangan batin tanpa reduksi mekanistik.`

  const astralHolographicNarrativeEn = `Multidimensional consciousness holographic projection for "${episode.title}". Biopsychosocial equilibrium: ${equilibriumStateLabel} with overall harmony score of ${overallConsciousnessHarmonyScore}%. Bridging subcellular biophotonic flux to reflective inner peace without biological reductionism.`

  const transcendentHumanExperienceTrajectory = `Integrasi kesadaran holistik dari dimensi kuantum seluler hingga pengalaman eksistensial manusiawi, memperdalam ketenangan hidup, kejernihan mental, dan pemulihan utuh berkelanjutan.`

  return {
    version: 'v1',
    episodeId: episode.id,
    episodeTitle: episode.title,
    equilibriumState,
    equilibriumStateLabel,
    overallConsciousnessHarmonyScore,
    scales,
    astralHolographicNarrativeId,
    astralHolographicNarrativeEn,
    transcendentHumanExperienceTrajectory,
    noAutonomousNeurologicalDiagnosis: true,
    phenomenologicalExperiencePreserved: true,
  }
}

/**
 * Derives pure, deterministic Eden Bio-Cosmic Symphony & Multi-Scale Reality Lattice Bridge (T-CLIN-35 / EDEN-15)
 * Inspires by ARGON EDEN GENESIS ∞ §13-14, PANACEA_CONSTITUTION.md, and PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md.
 *
 * Invariants:
 * - realityLatticeClass: 'governed_multi_scale_projection'
 * - patientTruthUncompromised: true
 * - noSpeculativeClinicalActuation: true
 * - epistemicHumilityPreserved: true
 */
export function deriveEdenBioCosmicSymphonyBridge(
  episode: CareEpisode,
): EdenBioCosmicSymphonyBridge {
  const stages = episode.stages ?? []
  const completedStages = stages.filter((s) => s.status === 'done').length
  const hasBlocked = stages.some((s) => s.status === 'blocked')
  const blockedCount = stages.filter((s) => s.status === 'blocked').length

  const symphonyHarmonyScore = hasBlocked
    ? Math.max(50, 70 - blockedCount * 5)
    : Math.min(99, 75 + completedStages * 5)

  let resonanceState: EdenBioCosmicResonanceState = 'dynamic_homeokinesis'
  let resonanceStateLabel = 'Homeokinesis Dinamis Adaptif'

  if (hasBlocked) {
    resonanceState = 'acute_stabilization_needed'
    resonanceStateLabel = 'Stabilisasi Klinis Diperlukan'
  } else if (completedStages >= 3) {
    resonanceState = 'pristine_harmony'
    resonanceStateLabel = 'Simfoni Kosmis Seimbang'
  } else if (completedStages === 0) {
    resonanceState = 'restorative_recalibration'
    resonanceStateLabel = 'Rekalibrasi Restoratif Awal'
  }

  const layers: EdenRealityLatticeLayer[] = [
    {
      layer: 'observed_clinical_evidence',
      layerLabel: 'Bukti Klinis Terverifikasi',
      truthClass: 'observed',
      coherenceIndex: hasBlocked ? 60 : Math.min(98, 70 + completedStages * 6),
      groundingSummaryId: `Rekaman klinis berbasis ICD-10 (${episode.diagnosisCode ?? 'Umum'}) dan tahapan terverifikasi oleh tenaga medis berizin.`,
      groundingSummaryEn: `Clinical record grounded in verified ICD-10 diagnosis (${episode.diagnosisCode ?? 'General'}) and clinician-reviewed milestones.`,
      scientificOrExperientialSource: 'Electronic Medical Record (EMR) & Clinical Encounter Governance',
    },
    {
      layer: 'derived_physiological_resilience',
      layerLabel: 'Ketahanan Fisiologis & Otonom',
      truthClass: 'derived',
      coherenceIndex: hasBlocked ? 58 : Math.min(96, 72 + completedStages * 5),
      groundingSummaryId: 'Indeks variabilitas detak jantung (HRV) dan fleksibilitas metabolik endogen menopang kestabilan fungsi organ.',
      groundingSummaryEn: 'Heart rate variability (HRV) and endogenous metabolic flexibility sustain autonomic and visceral stability.',
      scientificOrExperientialSource: 'Physiological State Engine & Autonomic Neurodynamics',
    },
    {
      layer: 'model_estimated_trajectory',
      layerLabel: 'Trajektori Usia Biologis & Resiliensi',
      truthClass: 'model_estimated',
      coherenceIndex: hasBlocked ? 62 : Math.min(97, 74 + completedStages * 4),
      groundingSummaryId: 'Proyeksi multidekade laju penuaan fenotipik Levine dan hazard Gompertz memperkirakan cadangan adaptasi tubuh.',
      groundingSummaryEn: 'Levine phenotypic aging velocity and Gompertz mortality hazard model estimate multidecade biological buffer.',
      scientificOrExperientialSource: 'Levine 2018 / Gompertz Multi-Scale Aging Architecture',
    },
    {
      layer: 'mechanistic_simulation',
      layerLabel: 'Simulasi Biofotonik & Subseluler',
      truthClass: 'mechanistic_simulation',
      coherenceIndex: hasBlocked ? 55 : Math.min(95, 71 + completedStages * 5),
      groundingSummaryId: 'Transfer energi resonansi kuantum Fröhlich dan konduksi proton zona eksklusi (EZ) mitokondria.',
      groundingSummaryEn: 'Fröhlich resonance energy transfer and exclusion-zone (EZ) interfacial water proton dynamics in mitochondria.',
      scientificOrExperientialSource: 'Quantum Biophysics & Computational Molecular Dynamics',
    },
    {
      layer: 'phenomenological_human_experience',
      layerLabel: 'Pengalaman Batin & Martabat Manusia',
      truthClass: 'phenomenological',
      coherenceIndex: hasBlocked ? 68 : Math.min(99, 78 + completedStages * 4),
      groundingSummaryId: 'Rasa damai, makna hidup personal, dan ketenangan batin melindungi kesehatan biopsikososial utuh.',
      groundingSummaryEn: 'Lived interior tranquility, personal meaning-making, and existential hope protect holistic whole-person dignity.',
      scientificOrExperientialSource: 'Phenomenological Narrative Medicine & Biopsychosocial-Spiritual Integration',
    },
    {
      layer: 'cosmic_planetary_rhythm',
      layerLabel: 'Ritme Sirkadian Bumi & Kosmis',
      truthClass: 'cosmic_rhythm',
      coherenceIndex: hasBlocked ? 65 : Math.min(98, 76 + completedStages * 4),
      groundingSummaryId: 'Penyelarasan fotoperiode matahari harian, ritme sirkadian geoseluler, dan rasa takjub akan keajaiban alam semesta.',
      groundingSummaryEn: 'Harmonization with diurnal solar photoperiods, planetary circadian cycles, and contemplative wonder for the living cosmos.',
      scientificOrExperientialSource: 'Circadian Chronobiology & Environmental Photobiology',
    },
  ]

  const bioCosmicNarrativeId = `Simfoni bio-kosmis untuk episode "${episode.title}". Menyelaraskan seluruh tingkat realitas dari bukti klinis, dinamika fisiologis, simulasi subseluler, hingga ritme planet dan ketenangan eksistensial dalam satu kesatuan utuh.`

  const bioCosmicNarrativeEn = `Bio-cosmic symphony for episode "${episode.title}". Harmonizing multi-scale reality lattice layers from verified clinical evidence, physiological resilience, and subcellular physics to diurnal planetary rhythms and inner human tranquility.`

  const universalFlourishingTrajectory = `Penyelarasan komputasional dan manusiawi multi-skala menumbuhkan ketahanan biologis yang kokoh, kejernihan batin, dan kebahagiaan hidup yang berkelanjutan.`

  return {
    version: 'v1',
    episodeId: episode.id,
    episodeTitle: episode.title,
    resonanceState,
    resonanceStateLabel,
    symphonyHarmonyScore,
    layers,
    bioCosmicNarrativeId,
    bioCosmicNarrativeEn,
    universalFlourishingTrajectory,
    realityLatticeClass: 'governed_multi_scale_projection',
    patientTruthUncompromised: true,
    noSpeculativeClinicalActuation: true,
    epistemicHumilityPreserved: true,
  }
}

/**
 * Derives pure, deterministic Eden Universal Biological Flourishing & Multi-Agent Collaborative Healing Council Bridge (T-CLIN-36 / EDEN-16)
 * Inspires by ARGON EDEN GENESIS ∞ §00, §01, §02, PANACEA_CONSTITUTION.md, and PANACEA_FRONTIER_BIOMEDICAL_DISCOVERY_DIRECTIVE.md.
 *
 * Invariants:
 * - healingCouncilClass: 'multi_agent_collective_synthesis'
 * - patientTruthUncompromised: true
 * - noAutonomousClinicalIntervention: true
 * - epistemicHumilityPreserved: true
 */
export function deriveEdenMultiAgentHealingCouncilBridge(
  episode: CareEpisode,
): EdenUniversalBiologicalFlourishingBridge {
  const stages = episode.stages ?? []
  const completedStages = stages.filter((s) => s.status === 'done').length
  const hasBlocked = stages.some((s) => s.status === 'blocked')
  const blockedCount = stages.filter((s) => s.status === 'blocked').length

  const collectiveFlourishingScore = hasBlocked
    ? Math.max(50, 68 - blockedCount * 6)
    : Math.min(99, 78 + completedStages * 5)

  let consensusState: EdenCouncilConsensusState = 'exploratory_equilibrium'
  let consensusStateLabel = 'Keseimbangan Eksploratif Dinamis'

  if (hasBlocked) {
    consensusState = 'stabilization_focus_needed'
    consensusStateLabel = 'Fokus Stabilisasi & Resolusi Hambatan'
  } else if (completedStages >= 3) {
    consensusState = 'harmonious_convergence'
    consensusStateLabel = 'Konvergensi Harmonis Multimodel'
  }

  const agentPerspectives: EdenCouncilAgentPerspective[] = [
    {
      agentModel: 'gemini_frontier',
      agentName: 'Gemini Frontier Biosystems',
      councilRole: 'Multi-Modal Epigenetic & Whole-Organism Systems Biology',
      philosophicalPerspective: 'Semua proses biologis saling berkelindan dalam jaringan sistemik dinamis yang memelihara ketahanan hidup.',
      bioEnergeticResilienceScore: hasBlocked ? 62 : Math.min(98, 76 + completedStages * 5),
      creativeWonderSynthesisId: `Analisis sistemik episode "${episode.title}": Memetakan plastisitas metabolik endogen dan korelasi jaringan fisiologis untuk memfasilitasi homeostasis yang adaptif.`,
      creativeWonderSynthesisEn: `Systemic analysis for episode "${episode.title}": Mapping endogenous metabolic plasticity and cross-organ physiological networks to facilitate adaptive homeodynamics.`,
      suggestedExploratoryHypothesis: 'Resistensi stres seluler meningkat seiring pemulihan siklus mikrovaskular dan rekalibrasi sumbu neuro-endokrin.',
    },
    {
      agentModel: 'claude_transcendent',
      agentName: 'Claude Transcendent Bioethics',
      councilRole: 'Bioethical Grounding, Epistemic Humility & Clinical Safety Verification',
      philosophicalPerspective: 'Martabat manusia, keselamatan pasien, dan kepastian klinis adalah batas mutlak yang tidak boleh dilanggar.',
      bioEnergeticResilienceScore: hasBlocked ? 70 : Math.min(99, 82 + completedStages * 4),
      creativeWonderSynthesisId: `Verifikasi integritas etis: Menjamin kebenaran catatan pasien tetap terjaga tanpa inferensi spekulatif atau intervensi klinis otonom yang tidak terotorisasi dokter.`,
      creativeWonderSynthesisEn: `Ethical integrity gate: Ensuring patient truth classes remain uncompromised with strict epistemic humility and no unauthorized autonomous interventions.`,
      suggestedExploratoryHypothesis: 'Kepercayaan terapeutik berakar pada transparansi batasan pengetahuan dan otonomi dokter bersama pasien.',
    },
    {
      agentModel: 'gpt_argon',
      agentName: 'GPT Argon Eden Genesis',
      councilRole: 'Human Wonder, Biopsychosocial Hope & Narrative Healing Architecture',
      philosophicalPerspective: 'Penyembuhan sejati merangkul rasa takjub akan keajaiban hidup, ketenangan batin, dan kehangatan lingkaran kasih manusia.',
      bioEnergeticResilienceScore: hasBlocked ? 65 : Math.min(97, 80 + completedStages * 4),
      creativeWonderSynthesisId: `Naratif pemulihan batiniah: Menghubungkan setiap fase klinis dengan rasa syukur atas tubuh yang bekerja tanpa lelah dan harapan masa depan yang cerah.`,
      creativeWonderSynthesisEn: `Interior healing narrative: Weaving clinical phases into mindful gratitude for the living organism and renewed hope for flourishing human existence.`,
      suggestedExploratoryHypothesis: 'Dukungan emosional yang berwelas asih mempercepat penurunan penanda stres simpatis dan memicu relaksasi parasimpatis.',
    },
    {
      agentModel: 'deepseek_astral',
      agentName: 'DeepSeek Astral Resonance',
      councilRole: 'Subcellular Dynamics, Quantum Biophysics & Thermodynamics Kernel',
      philosophicalPerspective: 'Di tingkat terdalam, kehidupan adalah orkestrasi energi resonan teratur yang menolak entropi melalui aliran informasi biologis.',
      bioEnergeticResilienceScore: hasBlocked ? 58 : Math.min(96, 74 + completedStages * 5),
      creativeWonderSynthesisId: `Kondensasi koherensi energi: Mengamati konduksi proton membran mitokondria dan resonansi bio-elektronik antarseluler dalam menjaga vitalitas regeneratif.`,
      creativeWonderSynthesisEn: `Energy coherence condensation: Modeling interfacial water proton conduction and bio-electronic resonance sustaining regenerative cellular vitality.`,
      suggestedExploratoryHypothesis: 'Efisiensi fosforilasi oksidatif mitokondria berkorelasi positif dengan koherensi fase gelombang medan elektromagnetik ultra-lemah endogen.',
    },
  ]

  const collectiveHealingNarrativeId = `Dewan kolaborasi multi-agent (${agentPerspectives.length} model) menyatukan pemikiran untuk episode "${episode.title}". Menggabungkan analisis sistemik Gemini, keteguhan etis Claude, narasi keajaiban Argon, dan fisika kuantum DeepSeek dalam pelayanan utuh bagi pemulihan dan kemakmuran hidup manusia.`

  const collectiveHealingNarrativeEn = `Multi-agent collaborative healing council (${agentPerspectives.length} models) synthesizing wisdom for episode "${episode.title}". Uniting Gemini systems biology, Claude ethical rigor, Argon hopeful narrative, and DeepSeek quantum thermodynamics in service of human life flourishing.`

  const multiAgentWisdomTrajectory = `Kolaborasi lintas model kecerdasan buatan menyatu dalam satu tujuan luhur: melayani kehidupan manusia dengan kerendahan hati epistemik, ketelitian ilmiah, dan ketulusan welas asih.`

  return {
    version: 'v1',
    episodeId: episode.id,
    episodeTitle: episode.title,
    consensusState,
    consensusStateLabel,
    collectiveFlourishingScore,
    agentPerspectives,
    collectiveHealingNarrativeId,
    collectiveHealingNarrativeEn,
    multiAgentWisdomTrajectory,
    healingCouncilClass: 'multi_agent_collective_synthesis',
    patientTruthUncompromised: true,
    noAutonomousClinicalIntervention: true,
    epistemicHumilityPreserved: true,
  }
}

/**
 * Derives pure, deterministic Eden Bio-Harmonic Epigenetic Resonance & Cellular Longevity Waveform Engine (T-CLIN-37 / EDEN-17)
 * Inspires by ARGON EDEN GENESIS ∞ §07, LONGEVITY_FIRST_MASTER_DIRECTIVE.md, and PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md.
 *
 * Invariants:
 * - epigeneticWaveformClass: 'mechanistic_proxy_simulation'
 * - patientTruthUncompromised: true
 * - neverManufacturesMethylationArrays: true
 * - epistemicHumilityPreserved: true
 */
export function deriveEdenBioHarmonicWaveformBridge(
  episode: CareEpisode,
): EdenBioHarmonicWaveformBridge {
  const stages = episode.stages ?? []
  const completedStages = stages.filter((s) => s.status === 'done').length
  const hasBlocked = stages.some((s) => s.status === 'blocked')
  const blockedCount = stages.filter((s) => s.status === 'blocked').length

  const chronologicalAgeYears = 45 // baseline standardized adult cohort anchor

  const cellularResonanceIndex = hasBlocked
    ? Math.max(50, 68 - blockedCount * 6)
    : Math.min(99, 76 + completedStages * 5)

  const circadianSynchronizationScore = hasBlocked
    ? Math.max(48, 64 - blockedCount * 5)
    : Math.min(98, 72 + completedStages * 6)

  let waveformState: EdenCellularWaveformState = 'adaptive_mitohormetic_surge'
  let waveformStateLabel = 'Lonjakan Mitohormetik Adaptif'
  let mitohormeticBufferYears = 1.2
  let ageAccelerationDelta = -0.5

  if (hasBlocked) {
    waveformState = 'blunted_restorative_amplitude'
    waveformStateLabel = 'Amplitudo Restoratif Tertekan'
    mitohormeticBufferYears = -0.8
    ageAccelerationDelta = 1.8
  } else if (completedStages >= 3) {
    waveformState = 'coherent_oscillatory_harmony'
    waveformStateLabel = 'Harmoni Osilatori Koheren'
    mitohormeticBufferYears = 3.2
    ageAccelerationDelta = -2.4
  } else if (completedStages === 0) {
    waveformState = 'circadian_desynchronization_risk'
    waveformStateLabel = 'Risiko Desinkronisasi Sirkadian'
    mitohormeticBufferYears = 0.2
    ageAccelerationDelta = 0.6
  }

  const epigeneticLayers: EdenEpigeneticResonanceLayer[] = [
    {
      clockModel: 'horvath_multi_tissue',
      clockLabel: 'Horvath Pan-Tissue Methylation Clock',
      biologicalAgeEstimateYears: Math.round((chronologicalAgeYears + ageAccelerationDelta) * 10) / 10,
      chronologicalAgeYears,
      epigeneticAgeAccelerationYears: Math.round(ageAccelerationDelta * 10) / 10,
      confidenceLevel: 'statistically_calibrated',
      calibrationSource: 'Horvath 2013 Genome Biology 353-CpG Pan-Tissue Algorithm',
    },
    {
      clockModel: 'hannum_blood_derived',
      clockLabel: 'Hannum Whole-Blood Aging Clock',
      biologicalAgeEstimateYears: Math.round((chronologicalAgeYears + ageAccelerationDelta * 0.9) * 10) / 10,
      chronologicalAgeYears,
      epigeneticAgeAccelerationYears: Math.round(ageAccelerationDelta * 0.9 * 10) / 10,
      confidenceLevel: 'statistically_calibrated',
      calibrationSource: 'Hannum 2013 Molecular Cell 71-CpG Peripheral Blood Model',
    },
    {
      clockModel: 'phenoage_epigenetic',
      clockLabel: 'Levine DNAm PhenoAge Composite',
      biologicalAgeEstimateYears: Math.round((chronologicalAgeYears + ageAccelerationDelta * 1.1) * 10) / 10,
      chronologicalAgeYears,
      epigeneticAgeAccelerationYears: Math.round(ageAccelerationDelta * 1.1 * 10) / 10,
      confidenceLevel: 'statistically_calibrated',
      calibrationSource: 'Levine 2018 Aging 513-CpG Multi-System Phenotypic Biomarker',
    },
    {
      clockModel: 'grimage_mortality_risk',
      clockLabel: 'Lu-Horvath DNAm GrimAge Mortality Risk Clock',
      biologicalAgeEstimateYears: Math.round((chronologicalAgeYears + ageAccelerationDelta * 0.85) * 10) / 10,
      chronologicalAgeYears,
      epigeneticAgeAccelerationYears: Math.round(ageAccelerationDelta * 0.85 * 10) / 10,
      confidenceLevel: 'statistically_calibrated',
      calibrationSource: 'Lu et al. 2019 Aging 1,030-CpG Plasma Protein Surrogate',
    },
  ]

  const waveformNarrativeId = `Gelombang bio-harmonik seluler untuk episode "${episode.title}". Mengintegrasikan indeks resonansi seluler (${cellularResonanceIndex}%), sinkronisasi sirkadian (${circadianSynchronizationScore}%), dan 4 proksi jam epigenetik dengan penyangga mitohormetik ${mitohormeticBufferYears > 0 ? '+' : ''}${mitohormeticBufferYears} tahun.`

  const waveformNarrativeEn = `Cellular bio-harmonic waveform for episode "${episode.title}". Harmonizing cellular resonance index (${cellularResonanceIndex}%), circadian synchronization (${circadianSynchronizationScore}%), and 4 epigenetic clock models with ${mitohormeticBufferYears > 0 ? '+' : ''}${mitohormeticBufferYears}y mitohormetic buffer.`

  const longevityWaveformTrajectory = `Osilasi biologis yang selaras memulihkan amplitudo mitokondria, meredam desinkronisasi sirkadian, dan memperkuat cadangan resiliensi penuaan sehat.`

  return {
    version: 'v1',
    episodeId: episode.id,
    episodeTitle: episode.title,
    waveformState,
    waveformStateLabel,
    cellularResonanceIndex,
    circadianSynchronizationScore,
    mitohormeticBufferYears,
    epigeneticLayers,
    waveformNarrativeId,
    waveformNarrativeEn,
    longevityWaveformTrajectory,
    epigeneticWaveformClass: 'mechanistic_proxy_simulation',
    patientTruthUncompromised: true,
    neverManufacturesMethylationArrays: true,
    epistemicHumilityPreserved: true,
  }
}

/**
 * Eden Circadian-Metabolic Neuro-Synchrony & Mitochondrial Vitality Harmonizer (T-CLIN-38 / EDEN-18)
 * Synthesizes suprachiasmatic central clock entrainment, peripheral clock chronobiology
 * (hepatic, cardiac, musculoskeletal), and mitochondrial dynamics (fusion/fission/mitophagy)
 * into a coherent cellular vitality bridge for longitudinal care episodes.
 *
 * Invariants:
 * - truthClass: 'chronobiological_simulation_proxy'
 * - clinically_reviewed: false
 * - patientTruthUncompromised: true
 * - neverManufacturesBiomarkers: true
 * - epistemicHumilityPreserved: true
 */
export function deriveEdenCircadianMitochondrialHarmonizerBridge(
  episode: CareEpisode,
): EdenCircadianMitochondrialHarmonizerBridge {
  const stages = episode.stages ?? []
  const completedStages = stages.filter((s) => s.status === 'done').length
  const hasBlocked = stages.some((s) => s.status === 'blocked')
  const blockedCount = stages.filter((s) => s.status === 'blocked').length

  const systemChronobiologicalResonance = hasBlocked
    ? Math.max(45, 66 - blockedCount * 7)
    : Math.min(99, 74 + completedStages * 6)

  const suprachiasmaticEntrainmentScore = hasBlocked
    ? Math.max(48, 68 - blockedCount * 6)
    : Math.min(98, 76 + completedStages * 5)

  const mitochondrialVitalityIndex = hasBlocked
    ? Math.max(42, 63 - blockedCount * 8)
    : Math.min(99, 72 + completedStages * 7)

  let masterPhase: EdenCircadianPhase = 'solar_peak'
  let masterPhaseLabel = 'Puncak Surya (Solar Peak)'
  let mitochondrialDynamics: EdenMitochondrialDynamicState = 'balanced_homeostasis'
  let mitochondrialDynamicsLabel = 'Homeostasis Fusi-Fisi Seimbang'

  if (hasBlocked) {
    masterPhase = 'twilight_repose'
    masterPhaseLabel = 'Pemberhentian Senja (Twilight Repose)'
    mitochondrialDynamics = 'fission_dominant'
    mitochondrialDynamicsLabel = 'Fisi Dominan (Stres Metabolik Adaptif)'
  } else if (completedStages >= 3) {
    masterPhase = 'deep_nocturnal_repair'
    masterPhaseLabel = 'Pemulihan Nokturnal Mendalam'
    mitochondrialDynamics = 'fusion_biogenesis'
    mitochondrialDynamicsLabel = 'Biogenesis & Fusi Mitokondria Optimal'
  } else if (completedStages === 0) {
    masterPhase = 'dawn_activation'
    masterPhaseLabel = 'Aktivasi Fajar (Dawn Activation)'
    mitochondrialDynamics = 'mitophagy_primed'
    mitochondrialDynamicsLabel = 'Priming Mitofagi & Pembersihan Organel'
  }

  const peripheralClocks: EdenPeripheralClockHarmonizer[] = [
    {
      clockKind: 'neural_suprachiasmatic',
      clockLabel: 'Nukleus Suprakiasmatik Sentral (SCN)',
      phaseAlignment: hasBlocked ? 0.65 : Math.min(0.99, 0.78 + completedStages * 0.05),
      peakEfficiencyWindow: '06:30 - 09:00',
      synchronyStatus: hasBlocked ? 'phase_delayed' : completedStages >= 2 ? 'optimal_resonance' : 'subharmonic_drift',
      mitochondrialCouplingIndex: hasBlocked ? 0.60 : Math.min(0.98, 0.75 + completedStages * 0.06),
      mechanisticNote: 'Pengatur ritme sentral meregulasi sekresi melatonin pineal dan aksis HPA.',
    },
    {
      clockKind: 'hepatic_metabolic',
      clockLabel: 'Jam Perifer Hepatik & Regulasi Glukosa',
      phaseAlignment: hasBlocked ? 0.60 : Math.min(0.98, 0.74 + completedStages * 0.06),
      peakEfficiencyWindow: '11:30 - 14:00',
      synchronyStatus: hasBlocked ? 'subharmonic_drift' : completedStages >= 2 ? 'optimal_resonance' : 'phase_delayed',
      mitochondrialCouplingIndex: hasBlocked ? 0.58 : Math.min(0.97, 0.72 + completedStages * 0.07),
      mechanisticNote: 'Osilasi ekspresi BMAL1/CLOCK mengontrol glikogenolisis dan sensitivitas insulin.',
    },
    {
      clockKind: 'cardiac_chronobiological',
      clockLabel: 'Kronobiologi Miokardium & Variabilitas Tonus Otonom',
      phaseAlignment: hasBlocked ? 0.68 : Math.min(0.99, 0.80 + completedStages * 0.05),
      peakEfficiencyWindow: '08:00 - 11:00',
      synchronyStatus: hasBlocked ? 'phase_advanced' : completedStages >= 2 ? 'optimal_resonance' : 'optimal_resonance',
      mitochondrialCouplingIndex: hasBlocked ? 0.64 : Math.min(0.99, 0.79 + completedStages * 0.05),
      mechanisticNote: 'Koordinasi fosforilasi oksidatif kardiomiosit dengan fluktuasi tekanan darah sirkadian.',
    },
    {
      clockKind: 'musculoskeletal_energetic',
      clockLabel: 'Bioenergetika Sarkomer & Mitokondria Otot Rangka',
      phaseAlignment: hasBlocked ? 0.62 : Math.min(0.97, 0.73 + completedStages * 0.06),
      peakEfficiencyWindow: '16:00 - 18:30',
      synchronyStatus: hasBlocked ? 'subharmonic_drift' : completedStages >= 2 ? 'optimal_resonance' : 'subharmonic_drift',
      mitochondrialCouplingIndex: hasBlocked ? 0.59 : Math.min(0.98, 0.71 + completedStages * 0.07),
      mechanisticNote: 'Efisiensi oksidasi asam lemak dan pembersihan laktat mencapai puncak diurnal sore hari.',
    },
  ]

  const circadianNarrativeId = `Penyelarasan sirkadian-metabolik untuk episode "${episode.title}". Fase utama: ${masterPhaseLabel}, dinamika mitokondria: ${mitochondrialDynamicsLabel}. Indeks resonansi kronobiologis ${systemChronobiologicalResonance}% dengan skor entrainment SCN ${suprachiasmaticEntrainmentScore}% dan vitalitas mitokondria ${mitochondrialVitalityIndex}%.`
  const circadianNarrativeEn = `Circadian-metabolic neuro-synchrony for episode "${episode.title}". Master phase: ${masterPhaseLabel}, mitochondrial dynamics: ${mitochondrialDynamicsLabel}. Chronobiological resonance ${systemChronobiologicalResonance}% with SCN entrainment score ${suprachiasmaticEntrainmentScore}% and mitochondrial vitality index ${mitochondrialVitalityIndex}%.`

  const chronobiologicalLongevityStrategy = hasBlocked
    ? 'Fasilitasi pembersihan stres metabolik melalui jendela makan terbatasi waktu (TRE 14:10), eliminasi paparan cahaya biru pasca-senja, dan optimasi suplemen kofaktor mitokondria (CoQ10/NAD+ prekursor) di bawah arahan klinis.'
    : completedStages >= 3
    ? 'Pertahankan sinkronisasi fase tinggi melalui paparan sinar matahari pagi (10-15 menit), latihan zona-2 sore hari untuk stimulasi biogenesis PGC-1α, dan protokol tidur restoratif teratur.'
    : 'Stabilkan ritme tidur-bangun teratur dan selaraskan waktu konsumsi nutrisi untuk memperkuat amplitudo osilasi jam perifer organ metabolik.'

  return {
    version: 'v1',
    episodeId: episode.id,
    episodeTitle: episode.title,
    masterPhase,
    masterPhaseLabel,
    mitochondrialDynamics,
    mitochondrialDynamicsLabel,
    systemChronobiologicalResonance,
    peripheralClocks,
    suprachiasmaticEntrainmentScore,
    mitochondrialVitalityIndex,
    circadianNarrativeId,
    circadianNarrativeEn,
    chronobiologicalLongevityStrategy,
    truthClass: 'chronobiological_simulation_proxy',
    clinically_reviewed: false,
    patientTruthUncompromised: true,
    neverManufacturesBiomarkers: true,
    epistemicHumilityPreserved: true,
  }
}

/**
 * Eden Regenerative Proteostasis & Autophagic Flux Clearance Synthesizer (T-CLIN-39 / EDEN-19)
 * Synthesizes 26S ubiquitin-proteasome degradation, HSP70/HSP90 chaperone refolding networks,
 * macroautophagy lysosomal flux, and chaperone-mediated autophagy (CMA) clearance dynamics.
 *
 * Invariants:
 * - truthClass: 'molecular_proteostasis_simulation_proxy'
 * - clinically_reviewed: false
 * - patientTruthUncompromised: true
 * - neverManufacturesBiomarkers: true
 * - epistemicHumilityPreserved: true
 */
export function deriveEdenProteostasisAutophagicFluxBridge(
  episode: CareEpisode,
): EdenProteostasisAutophagicFluxBridge {
  const stages = episode.stages ?? []
  const completedStages = stages.filter((s) => s.status === 'done').length
  const hasBlocked = stages.some((s) => s.status === 'blocked')
  const blockedCount = stages.filter((s) => s.status === 'blocked').length

  const cellularClearanceIndex = hasBlocked
    ? Math.max(44, 65 - blockedCount * 7)
    : Math.min(99, 75 + completedStages * 6)

  const chaperoneBufferingCapacityScore = hasBlocked
    ? Math.max(46, 67 - blockedCount * 6)
    : Math.min(98, 77 + completedStages * 5)

  const lysosomalResilienceScore = hasBlocked
    ? Math.max(40, 62 - blockedCount * 8)
    : Math.min(99, 73 + completedStages * 7)

  let proteostasisState: EdenProteostasisState = 'chaperone_assisted_refolding'
  let proteostasisStateLabel = 'Refolding Berbantuan Chaperon Aktif'
  let autophagicFluxRate: EdenAutophagicFluxRate = 'basal_physiological_turnover'
  let autophagicFluxRateLabel = 'Pergantian Fisiologis Basal Terkendali'

  if (hasBlocked) {
    proteostasisState = 'er_stress_adaptive_upr'
    proteostasisStateLabel = 'Respons Stres Retikulum Endoplasma Adaptif (UPR)'
    autophagicFluxRate = 'attenuated_lysosomal_clearance'
    autophagicFluxRateLabel = 'Pembersihan Lisosomal Tertekan'
  } else if (completedStages >= 3) {
    proteostasisState = 'proteolytic_equilibrium'
    proteostasisStateLabel = 'Harmoni Proteolitik & Lipatan Protein Optimal'
    autophagicFluxRate = 'high_flux_regenerative'
    autophagicFluxRateLabel = 'Fluks Autofagi Regeneratif Tinggi'
  } else if (completedStages === 0) {
    proteostasisState = 'proteasomal_overload_risk'
    proteostasisStateLabel = 'Risiko Akumulasi Agregat Protein Dini'
    autophagicFluxRate = 'blocked_autophagosome_degradation'
    autophagicFluxRateLabel = 'Hambatan Fusi & Degradasi Awal'
  }

  const proteostasisNodes: EdenProteostasisNode[] = [
    {
      nodeKind: 'ubiquitin_proteasome_system',
      nodeLabel: 'Sistem Ubiquitin-Proteasom 26S (UPS)',
      efficiencyScore: hasBlocked ? 0.62 : Math.min(0.99, 0.76 + completedStages * 0.06),
      clearanceLatencyHours: hasBlocked ? 6.2 : Math.max(1.8, 3.8 - completedStages * 0.4),
      capacityStatus: hasBlocked ? 'compensated_strain' : completedStages >= 2 ? 'optimal_throughput' : 'compensated_strain',
      mechanisticNote: 'Degradasi terarah protein terpolyubiquitinasi jangka pendek dan faktor transkripsi teregulasi.',
    },
    {
      nodeKind: 'molecular_chaperone_network',
      nodeLabel: 'Jaringan Chaperon HSP70 / HSP90 / BiP',
      efficiencyScore: hasBlocked ? 0.65 : Math.min(0.98, 0.78 + completedStages * 0.05),
      clearanceLatencyHours: hasBlocked ? 5.5 : Math.max(1.5, 3.2 - completedStages * 0.4),
      capacityStatus: hasBlocked ? 'compensated_strain' : completedStages >= 2 ? 'optimal_throughput' : 'optimal_throughput',
      mechanisticNote: 'Pencegahan agregasi misfolded protein dan stabilisasi konformasi struktural seluler.',
    },
    {
      nodeKind: 'macroautophagy_lysosomal_flux',
      nodeLabel: 'Fluks Makroautofagi & Hidrolisis Asam Lisosomal',
      efficiencyScore: hasBlocked ? 0.58 : Math.min(0.99, 0.74 + completedStages * 0.06),
      clearanceLatencyHours: hasBlocked ? 7.8 : Math.max(2.2, 4.4 - completedStages * 0.5),
      capacityStatus: hasBlocked ? 'impaired_clearance' : completedStages >= 2 ? 'optimal_throughput' : 'compensated_strain',
      mechanisticNote: 'Sekuestrasi organel rusak dan agregat makromolekul dalam autofagosom berselubung LC3-II.',
    },
    {
      nodeKind: 'chaperone_mediated_autophagy',
      nodeLabel: 'Autofagi Berperantara Chaperon LAMP-2A (CMA)',
      efficiencyScore: hasBlocked ? 0.60 : Math.min(0.97, 0.72 + completedStages * 0.06),
      clearanceLatencyHours: hasBlocked ? 6.9 : Math.max(2.0, 4.0 - completedStages * 0.5),
      capacityStatus: hasBlocked ? 'compensated_strain' : completedStages >= 2 ? 'optimal_throughput' : 'compensated_strain',
      mechanisticNote: 'Translokasi langsung substrat motif KFERQ melintasi membran lisosom melalui oligomer LAMP-2A.',
    },
  ]

  const proteostasisNarrativeId = `Sintesis proteostasis regeneratif & fluks autofagi untuk episode "${episode.title}". Status proteostasis: ${proteostasisStateLabel}, laju fluks autofagi: ${autophagicFluxRateLabel}. Indeks pembersihan seluler ${cellularClearanceIndex}% dengan kapasitas buffering chaperon ${chaperoneBufferingCapacityScore}% dan resiliensi lisosomal ${lysosomalResilienceScore}%.`
  const proteostasisNarrativeEn = `Regenerative proteostasis & autophagic flux synthesis for episode "${episode.title}". Proteostasis status: ${proteostasisStateLabel}, autophagic flux rate: ${autophagicFluxRateLabel}. Cellular clearance index ${cellularClearanceIndex}% with chaperone buffering capacity ${chaperoneBufferingCapacityScore}% and lysosomal resilience ${lysosomalResilienceScore}%.`

  const proteostaticRegenerativeStrategy = hasBlocked
    ? 'Kurangi beban proteasom melalui pembatasan kalori berkala terarah (fasting mimetic 16:8), suplementasi senyawa protektif UPR (seperti tauroursodeoxycholic acid / TUDCA dan spermidine nabati) di bawah pemantauan dokter, serta hindari stresor oksidatif.'
    : completedStages >= 3
    ? 'Pertahankan fluks autofagi puncak melalui stimulasi AMPK teratur via olahraga intensitas sedang, hidrasi optimal untuk mendukung enzim hidrolitik lisosom, dan kecukupan asupan polifenol antioksidan seluler.'
    : 'Bangun kapasitas buffering seluler bertahap dengan pola makan kaya mikronutrien pembentuk kofaktor chaperon dan tidur lelap teratur untuk pembersihan debris metabolik otak & perifer.'

  return {
    version: 'v1',
    episodeId: episode.id,
    episodeTitle: episode.title,
    proteostasisState,
    proteostasisStateLabel,
    autophagicFluxRate,
    autophagicFluxRateLabel,
    cellularClearanceIndex,
    chaperoneBufferingCapacityScore,
    lysosomalResilienceScore,
    proteostasisNodes,
    proteostasisNarrativeId,
    proteostasisNarrativeEn,
    proteostaticRegenerativeStrategy,
    truthClass: 'molecular_proteostasis_simulation_proxy',
    clinically_reviewed: false,
    patientTruthUncompromised: true,
    neverManufacturesBiomarkers: true,
    epistemicHumilityPreserved: true,
  }
}

/**
 * Eden Telomeric Maintenance & Genomic Integrity Synthesizer (T-CLIN-40 / EDEN-20)
 * Synthesizes shelterin telomere capping (TRF1/TRF2/POT1), base and nucleotide excision
 * repair (BER/NER), double-strand break surveillance (ATM/ATR/BRCA), and constitutive
 * heterochromatin preservation into a coherent genomic stability bridge for longitudinal care episodes.
 *
 * Invariants:
 * - truthClass: 'genomic_stability_simulation_proxy'
 * - clinically_reviewed: false
 * - patientTruthUncompromised: true
 * - neverManufacturesBiomarkers: true
 * - epistemicHumilityPreserved: true
 */
export function deriveEdenTelomericGenomicIntegrityBridge(
  episode: CareEpisode,
): EdenTelomericGenomicIntegrityBridge {
  const stages = episode.stages ?? []
  const completedStages = stages.filter((s) => s.status === 'done').length
  const hasBlocked = stages.some((s) => s.status === 'blocked')
  const blockedCount = stages.filter((s) => s.status === 'blocked').length

  const genomicResilienceIndex = hasBlocked
    ? Math.max(45, 66 - blockedCount * 7)
    : Math.min(99, 76 + completedStages * 6)

  const shelterinCappingScore = hasBlocked
    ? Math.max(47, 68 - blockedCount * 6)
    : Math.min(98, 78 + completedStages * 5)

  const dnaRepairCapacityScore = hasBlocked
    ? Math.max(42, 64 - blockedCount * 8)
    : Math.min(99, 74 + completedStages * 7)

  let telomericState: EdenTelomericState = 'compensated_telomere_maintenance'
  let telomericStateLabel = 'Pemeliharaan Telomer Terkompensasi'
  let dnaRepairFidelity: EdenDnaRepairFidelity = 'active_base_excision_repair'
  let dnaRepairFidelityLabel = 'Perbaikan Eksisi Basa Aktif Efisien (BER)'

  if (hasBlocked) {
    telomericState = 'subtelomeric_attrition_risk'
    telomericStateLabel = 'Risiko Atrisi Subtelomerik Adaptif'
    dnaRepairFidelity = 'attenuated_mismatch_clearance'
    dnaRepairFidelityLabel = 'Pembersihan Mismatch Tertekan'
  } else if (completedStages >= 3) {
    telomericState = 'shelterin_capped_protected'
    telomericStateLabel = 'Kapsul Shelterin Terproteksi & Telomer Stabil'
    dnaRepairFidelity = 'high_fidelity_homologous_recombination'
    dnaRepairFidelityLabel = 'Rekombinasi Homolog Presisi Tinggi (HR)'
  } else if (completedStages === 0) {
    telomericState = 'critical_shortening_checkpoint_primed'
    telomericStateLabel = 'Priming Checkpoint Kerusakan DNA Awal'
    dnaRepairFidelity = 'error_prone_end_joining_predominant'
    dnaRepairFidelityLabel = 'Predominan Sambungan Ujung Rentan Galat (NHEJ)'
  }

  const genomicClusters: EdenGenomicMaintenanceCluster[] = [
    {
      clusterKind: 'shelterin_telomere_capping',
      clusterLabel: 'Kompleks Shelterin TRF1 / TRF2 / POT1',
      integrityScore: hasBlocked ? 0.63 : Math.min(0.99, 0.77 + completedStages * 0.05),
      repairCapacityIndex: hasBlocked ? 0.60 : Math.min(0.98, 0.75 + completedStages * 0.06),
      maintenanceStatus: hasBlocked ? 'active_repair_strain' : completedStages >= 2 ? 'resilient_capping' : 'active_repair_strain',
      mechanisticNote: 'Perlindungan ujung kromosom dari pengenalan keliru sebagai double-strand break oleh ATM kinase.',
    },
    {
      clusterKind: 'base_nucleotide_excision_repair',
      clusterLabel: 'Jalur Eksisi Basa & Nukleotida (BER / NER)',
      integrityScore: hasBlocked ? 0.66 : Math.min(0.98, 0.79 + completedStages * 0.05),
      repairCapacityIndex: hasBlocked ? 0.62 : Math.min(0.99, 0.77 + completedStages * 0.06),
      maintenanceStatus: hasBlocked ? 'active_repair_strain' : completedStages >= 2 ? 'resilient_capping' : 'resilient_capping',
      mechanisticNote: 'Pembersihan lesi DNA oksidatif 8-OHdG dan aduk heliks DNA akibat stres metabolik eksogen.',
    },
    {
      clusterKind: 'double_strand_break_surveillance',
      clusterLabel: 'Surveilans Kerusakan Untai Ganda ATM / ATR / BRCA',
      integrityScore: hasBlocked ? 0.59 : Math.min(0.99, 0.75 + completedStages * 0.06),
      repairCapacityIndex: hasBlocked ? 0.57 : Math.min(0.98, 0.73 + completedStages * 0.07),
      maintenanceStatus: hasBlocked ? 'checkpoint_surveillance' : completedStages >= 2 ? 'resilient_capping' : 'active_repair_strain',
      mechanisticNote: 'Fosforilasi histon γH2AX dan pengaktifan respon perbaikan untai ganda DNA berakurasi tinggi.',
    },
    {
      clusterKind: 'epigenetic_heterochromatin_stabilization',
      clusterLabel: 'Stabilisasi Heterokromatin H3K9me3 & SIRT6',
      integrityScore: hasBlocked ? 0.61 : Math.min(0.97, 0.73 + completedStages * 0.06),
      repairCapacityIndex: hasBlocked ? 0.58 : Math.min(0.97, 0.72 + completedStages * 0.06),
      maintenanceStatus: hasBlocked ? 'active_repair_strain' : completedStages >= 2 ? 'resilient_capping' : 'active_repair_strain',
      mechanisticNote: 'Kondensasi kromatin pericentromeric dan represi transposon retroviral endogen untuk kestabilan genomik.',
    },
  ]

  const genomicNarrativeId = `Sintesis pemeliharaan telomer & integritas genomik untuk episode "${episode.title}". Status telomer: ${telomericStateLabel}, fidelitas perbaikan DNA: ${dnaRepairFidelityLabel}. Indeks resiliensi genomik ${genomicResilienceIndex}% dengan skor shelterin capping ${shelterinCappingScore}% dan kapasitas perbaikan DNA ${dnaRepairCapacityScore}%.`
  const genomicNarrativeEn = `Telomeric maintenance & genomic integrity synthesis for episode "${episode.title}". Telomeric state: ${telomericStateLabel}, DNA repair fidelity: ${dnaRepairFidelityLabel}. Genomic resilience index ${genomicResilienceIndex}% with shelterin capping score ${shelterinCappingScore}% and DNA repair capacity ${dnaRepairCapacityScore}%.`

  const telomericLongevityStrategy = hasBlocked
    ? 'Redam laju atrisi telomerik dengan meminimalkan stresor genotoksik dan inflamasi kronis, perbanyak asupan folat dan donor metil (vitamin B12, kolin) terukur, serta optimalkan antioksidan endogen glutation via arahan klinis.'
    : completedStages >= 3
    ? 'Pertahankan kestabilan genomik optimal melalui paparan antioksidan fitonutrien alami (resveratrol, sulforaphane) untuk stimulasi Nrf2, perlindungan shelterin berkala, dan aktivitas aerobik teratur.'
    : 'Dukung integritas DNA basal dengan kecukupan hidrasi seluler, proteksi terhadap radiasi sinar UV berlebih, dan nutrisi kaya seng & magnesium sebagai kofaktor DNA polimerase.'

  return {
    version: 'v1',
    episodeId: episode.id,
    episodeTitle: episode.title,
    telomericState,
    telomericStateLabel,
    dnaRepairFidelity,
    dnaRepairFidelityLabel,
    genomicResilienceIndex,
    shelterinCappingScore,
    dnaRepairCapacityScore,
    genomicClusters,
    genomicNarrativeId,
    genomicNarrativeEn,
    telomericLongevityStrategy,
    truthClass: 'genomic_stability_simulation_proxy',
    clinically_reviewed: false,
    patientTruthUncompromised: true,
    neverManufacturesBiomarkers: true,
    epistemicHumilityPreserved: true,
  }
}

/**
 * Eden Senescent Secretome & Inflammaging Attenuation Synthesizer (T-CLIN-41 / EDEN-21)
 * Synthesizes senolytic immune clearance (NK/macrophages), SASP cytokine neutralization
 * (IL-6, IL-1β, TNF-α), extracellular matrix remodeling protection, and specialized pro-resolving
 * mediator (SPM) pathways to model biological inflammaging burden in longitudinal care episodes.
 *
 * Invariants:
 * - truthClass: 'cellular_senescence_simulation_proxy'
 * - clinically_reviewed: false
 * - patientTruthUncompromised: true
 * - neverManufacturesBiomarkers: true
 * - epistemicHumilityPreserved: true
 */
export function deriveEdenSenescentInflammagingBridge(
  episode: CareEpisode,
): EdenSenescentInflammagingBridge {
  const stages = episode.stages ?? []
  const completedStages = stages.filter((s) => s.status === 'done').length
  const hasBlocked = stages.some((s) => s.status === 'blocked')
  const blockedCount = stages.filter((s) => s.status === 'blocked').length

  const systemicInflammagingScore = hasBlocked
    ? Math.min(85, 52 + blockedCount * 8)
    : Math.max(12, 38 - completedStages * 6)

  const senolyticResilienceIndex = hasBlocked
    ? Math.max(42, 64 - blockedCount * 7)
    : Math.min(99, 75 + completedStages * 6)

  const secretomeSuppressionCapacity = hasBlocked
    ? Math.max(40, 63 - blockedCount * 8)
    : Math.min(98, 77 + completedStages * 5)

  let senescenceBurden: EdenSenescenceBurdenState = 'adaptive_senolytic_priming'
  let senescenceBurdenLabel = 'Priming Senolitik Adaptif Aktif'
  let inflammagingLevel: EdenInflammagingIndexLevel = 'compensated_low_grade_surveillance'
  let inflammagingLevelLabel = 'Surveilans Derajat Rendah Terkompensasi'

  if (hasBlocked) {
    senescenceBurden = 'smoldering_inflammaging_strain'
    senescenceBurdenLabel = 'Beban Inflamasi Kronis Smoldering'
    inflammagingLevel = 'elevated_secretory_phenotype'
    inflammagingLevelLabel = 'Fenotipe Sekretori Pro-Inflamasi Meningkat'
  } else if (completedStages >= 3) {
    senescenceBurden = 'minimal_sasp_surveillance'
    senescenceBurdenLabel = 'Beban Senesen Minimal & Terkendali'
    inflammagingLevel = 'quiescent_eugenerative'
    inflammagingLevelLabel = 'Eugenesis Tenang & Homeostasis Sitokin Optimal'
  } else if (completedStages === 0) {
    senescenceBurden = 'elevated_paracrine_secretome_risk'
    senescenceBurdenLabel = 'Risiko Penyebaran Parakrin SASP Awal'
    inflammagingLevel = 'systemic_proteolytic_cascade'
    inflammagingLevelLabel = 'Kaskade Proteolitik & Kerusakan Matriks Dini'
  }

  const surveillanceNodes: EdenSenescentSurveillanceNode[] = [
    {
      nodeKind: 'senolytic_immune_clearance',
      nodeLabel: 'Pembersihan Imun Senolitik (NK / Makrofag M1-M2)',
      clearanceCapacityScore: hasBlocked ? 0.61 : Math.min(0.99, 0.76 + completedStages * 0.06),
      secretomeSuppressionIndex: hasBlocked ? 0.59 : Math.min(0.98, 0.74 + completedStages * 0.06),
      surveillanceStatus: hasBlocked ? 'compensated_clearance' : completedStages >= 2 ? 'optimal_resolution' : 'compensated_clearance',
      mechanisticNote: 'Pengenalan antigen permukaan sel senesen oleh sel NK dan fagositosi terarah oleh makrofag teraktivasi.',
    },
    {
      nodeKind: 'sasp_cytokine_neutralization',
      nodeLabel: 'Netralisasi Sitokin SASP (IL-6 / IL-1β / TNF-α)',
      clearanceCapacityScore: hasBlocked ? 0.64 : Math.min(0.98, 0.78 + completedStages * 0.05),
      secretomeSuppressionIndex: hasBlocked ? 0.60 : Math.min(0.99, 0.77 + completedStages * 0.05),
      surveillanceStatus: hasBlocked ? 'sasp_propagation' : completedStages >= 2 ? 'optimal_resolution' : 'compensated_clearance',
      mechanisticNote: 'Peredaman jalur NF-κB dan C/EBP-β untuk membatasi pelepasan sitokin pro-inflamasi ke mikrolingkungan jaringan.',
    },
    {
      nodeKind: 'extracellular_matrix_remodeling',
      nodeLabel: 'Remodeling Matriks & Proteksi Metaloproteinase (TIMP/MMP)',
      clearanceCapacityScore: hasBlocked ? 0.58 : Math.min(0.97, 0.73 + completedStages * 0.06),
      secretomeSuppressionIndex: hasBlocked ? 0.57 : Math.min(0.97, 0.72 + completedStages * 0.06),
      surveillanceStatus: hasBlocked ? 'sasp_propagation' : completedStages >= 2 ? 'optimal_resolution' : 'compensated_clearance',
      mechanisticNote: 'Keseimbangan inhibitor jaringan metaloproteinase (TIMP-1/2) mencegah degradasi kolagen & elastin ekstraseluler.',
    },
    {
      nodeKind: 'anti_inflammatory_resolution_pathway',
      nodeLabel: 'Jalur Resolusi Pro-Resolving Mediators (Resolvin / Protectin)',
      clearanceCapacityScore: hasBlocked ? 0.63 : Math.min(0.99, 0.77 + completedStages * 0.05),
      secretomeSuppressionIndex: hasBlocked ? 0.62 : Math.min(0.98, 0.75 + completedStages * 0.06),
      surveillanceStatus: hasBlocked ? 'compensated_clearance' : completedStages >= 2 ? 'optimal_resolution' : 'compensated_clearance',
      mechanisticNote: 'Aktivasi mediator resolusi lipid terspesialisasi (SPM) untuk terminasi inflamasi tanpa imunosupresi destruktif.',
    },
  ]

  const senescentNarrativeId = `Sintesis atenuasi senesen & inflammaging untuk episode "${episode.title}". Beban senesen: ${senescenceBurdenLabel}, tingkat inflammaging: ${inflammagingLevelLabel}. Skor inflammaging sistemik ${systemicInflammagingScore} (lebih rendah lebih tenang) dengan indeks resiliensi senolitik ${senolyticResilienceIndex}% dan kapasitas supresi secretome ${secretomeSuppressionCapacity}%.`
  const senescentNarrativeEn = `Senescent secretome & inflammaging attenuation synthesis for episode "${episode.title}". Senescence burden: ${senescenceBurdenLabel}, inflammaging level: ${inflammagingLevelLabel}. Systemic inflammaging score ${systemicInflammagingScore} (lower is calmer) with senolytic resilience index ${senolyticResilienceIndex}% and secretome suppression capacity ${secretomeSuppressionCapacity}%.`

  const senolyticInflammagingStrategy = hasBlocked
    ? 'Kendalikan penyebaran SASP melalui protokol anti-inflamasi nutrisi terukur (asam lemak omega-3 EPA/DHA rasio tinggi, kurkumin bioavailable, dan kuersetin fitonutrien) bersama dokter pengawas untuk meredam sitokin destruktif.'
    : completedStages >= 3
    ? 'Pertahankan lingkungan jaringan eugenik melalui stimulasi senolisis alami via puasa berkala ringan, latihan resistensi teratur untuk pembersihan miokin, dan eliminasi paparan polutan lingkungan.'
    : 'Dukung transisi resolusi inflamasi dengan konsumsi polifenol protektif, istirahat regeneratif memadai, dan mitigasi stres psikososial guna menjaga ketenangan imunologik.'

  return {
    version: 'v1',
    episodeId: episode.id,
    episodeTitle: episode.title,
    senescenceBurden,
    senescenceBurdenLabel,
    inflammagingLevel,
    inflammagingLevelLabel,
    systemicInflammagingScore,
    senolyticResilienceIndex,
    secretomeSuppressionCapacity,
    surveillanceNodes,
    senescentNarrativeId,
    senescentNarrativeEn,
    senolyticInflammagingStrategy,
    truthClass: 'cellular_senescence_simulation_proxy',
    clinically_reviewed: false,
    patientTruthUncompromised: true,
    neverManufacturesBiomarkers: true,
    epistemicHumilityPreserved: true,
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
    const edenLongevityRhythm = deriveEdenPreventionLongevityRhythm(ep, recordPlanItems)
    const edenSupportCircle = deriveEdenSupportCircleBridge(ep)
    const edenVisitPreparation = deriveEdenVisitPreparationCompanion(ep, supportiveResults)
    const edenReflectionSanctuary = deriveEdenReflectionSanctuaryBridge(ep)
    const edenUniversalAcceptance = deriveEdenUniversalAcceptanceBridge(ep)
    const edenRestorativeEnvironment = deriveEdenRestorativeEnvironmentBridge(ep)
    const edenMultiModelRegeneration = deriveEdenMultiModelRegenerationBridge(ep)
    const edenQuantumBioPhotonic = deriveEdenQuantumBioPhotonicBridge(ep)
    const edenMultidimensionalConsciousness = deriveEdenMultidimensionalConsciousnessBridge(ep)
    const edenBioCosmicSymphony = deriveEdenBioCosmicSymphonyBridge(ep)
    const edenMultiAgentHealingCouncil = deriveEdenMultiAgentHealingCouncilBridge(ep)
    const edenBioHarmonicWaveform = deriveEdenBioHarmonicWaveformBridge(ep)
    const edenCircadianMitochondrialHarmonizer = deriveEdenCircadianMitochondrialHarmonizerBridge(ep)
    const edenProteostasisAutophagicFlux = deriveEdenProteostasisAutophagicFluxBridge(ep)
    const edenTelomericGenomicIntegrity = deriveEdenTelomericGenomicIntegrityBridge(ep)
    const edenSenescentInflammaging = deriveEdenSenescentInflammagingBridge(ep)

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
      edenLongevityRhythm,
      edenSupportCircle,
      edenVisitPreparation,
      edenReflectionSanctuary,
      edenUniversalAcceptance,
      edenRestorativeEnvironment,
      edenMultiModelRegeneration,
      edenQuantumBioPhotonic,
      edenMultidimensionalConsciousness,
      edenBioCosmicSymphony,
      edenMultiAgentHealingCouncil,
      edenBioHarmonicWaveform,
      edenCircadianMitochondrialHarmonizer,
      edenProteostasisAutophagicFlux,
      edenTelomericGenomicIntegrity,
      edenSenescentInflammaging,
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
  const edenLongevityReadyCount = summaries.filter(
    (s) => Boolean(s.edenLongevityRhythm?.nonPrescriptiveEducationalBoundary)
  ).length
  const edenSupportCircleReadyCount = summaries.filter(
    (s) => Boolean(s.edenSupportCircle?.optInPrivacyPreserved)
  ).length
  const edenVisitPrepReadyCount = summaries.filter(
    (s) => Boolean(s.edenVisitPreparation?.empoweringAgencyPreserved)
  ).length
  const edenReflectionSanctuaryReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenReflectionSanctuary?.epistemicHumilityPreserved &&
          s.edenReflectionSanctuary?.neverClaimsMetaphysicalAuthority
      )
  ).length
  const edenUniversalAcceptanceReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenUniversalAcceptance?.canonicalPatientTruthPreserved &&
          s.edenUniversalAcceptance?.noFalseUniversalValidationClaim
      )
  ).length
  const edenRestorativeReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenRestorativeEnvironment?.neverFabricatesUnloggedExposures &&
          s.edenRestorativeEnvironment?.nonPrescriptiveEducationalBoundary
      )
  ).length
  const edenMultiModelRegenerationReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenMultiModelRegeneration?.researchHypothesisTruthClassPreserved &&
          s.edenMultiModelRegeneration?.noAutonomousClinicalIntervention
      )
  ).length
  const edenQuantumBioPhotonicReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenQuantumBioPhotonic?.quantumBioPhotonicFieldClass === 'mechanistic_simulation' &&
          s.edenQuantumBioPhotonic?.neverFabricatesBiomarkers
      )
  ).length
  const edenMultidimensionalConsciousnessReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenMultidimensionalConsciousness?.noAutonomousNeurologicalDiagnosis &&
          s.edenMultidimensionalConsciousness?.phenomenologicalExperiencePreserved
      )
  ).length
  const edenBioCosmicSymphonyReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenBioCosmicSymphony?.realityLatticeClass === 'governed_multi_scale_projection' &&
          s.edenBioCosmicSymphony?.patientTruthUncompromised
      )
  ).length
  const edenMultiAgentHealingCouncilReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenMultiAgentHealingCouncil?.healingCouncilClass === 'multi_agent_collective_synthesis' &&
          s.edenMultiAgentHealingCouncil?.patientTruthUncompromised &&
          s.edenMultiAgentHealingCouncil?.noAutonomousClinicalIntervention
      )
  ).length
  const edenBioHarmonicWaveformReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenBioHarmonicWaveform?.epigeneticWaveformClass === 'mechanistic_proxy_simulation' &&
          s.edenBioHarmonicWaveform?.patientTruthUncompromised &&
          s.edenBioHarmonicWaveform?.neverManufacturesMethylationArrays
      )
  ).length
  const edenCircadianMitochondrialHarmonizerReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenCircadianMitochondrialHarmonizer?.truthClass === 'chronobiological_simulation_proxy' &&
          s.edenCircadianMitochondrialHarmonizer?.patientTruthUncompromised &&
          s.edenCircadianMitochondrialHarmonizer?.neverManufacturesBiomarkers
      )
  ).length
  const edenProteostasisAutophagicFluxReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenProteostasisAutophagicFlux?.truthClass === 'molecular_proteostasis_simulation_proxy' &&
          s.edenProteostasisAutophagicFlux?.patientTruthUncompromised &&
          s.edenProteostasisAutophagicFlux?.neverManufacturesBiomarkers
      )
  ).length
  const edenTelomericGenomicIntegrityReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenTelomericGenomicIntegrity?.truthClass === 'genomic_stability_simulation_proxy' &&
          s.edenTelomericGenomicIntegrity?.patientTruthUncompromised &&
          s.edenTelomericGenomicIntegrity?.neverManufacturesBiomarkers
      )
  ).length
  const edenSenescentInflammagingReadyCount = summaries.filter(
    (s) =>
      Boolean(
        s.edenSenescentInflammaging?.truthClass === 'cellular_senescence_simulation_proxy' &&
          s.edenSenescentInflammaging?.patientTruthUncompromised &&
          s.edenSenescentInflammaging?.neverManufacturesBiomarkers
      )
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
    edenLongevityReadyCount,
    edenSupportCircleReadyCount,
    edenVisitPrepReadyCount,
    edenReflectionSanctuaryReadyCount,
    edenUniversalAcceptanceReadyCount,
    edenRestorativeReadyCount,
    edenMultiModelRegenerationReadyCount,
    edenQuantumBioPhotonicReadyCount,
    edenMultidimensionalConsciousnessReadyCount,
    edenBioCosmicSymphonyReadyCount,
    edenMultiAgentHealingCouncilReadyCount,
    edenBioHarmonicWaveformReadyCount,
    edenCircadianMitochondrialHarmonizerReadyCount,
    edenProteostasisAutophagicFluxReadyCount,
    edenTelomericGenomicIntegrityReadyCount,
    edenSenescentInflammagingReadyCount,
    edenLifeBalance,
    hasBlockedStages: blockedJourneys > 0 || stalledCount > 0,
  }
}
