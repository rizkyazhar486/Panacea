/**
 * Pure projection from active patient encounter state to CareContinuityPanel models.
 * PRD §8.5 Result Closure, Care Access Orchestration, and Offline Episode Resilience.
 *
 * Architecture rule (lib-tidak-impor-ui): this file is a pure domain model and
 * MUST NEVER import UI components or styling tokens.
 */
import type { SupportiveResult, EMRRecord } from '../../../lib/types'
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

export interface CareContinuityProjection {
  closure: ResultClosureResult | null
  careAccess: CareAccessOrchestrationResult
  episodeResilience: ClinicalEpisodeResilienceResult
  oneOsProof: OneOsProofResult
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

  return {
    closure,
    careAccess,
    episodeResilience,
    oneOsProof,
  }
}
