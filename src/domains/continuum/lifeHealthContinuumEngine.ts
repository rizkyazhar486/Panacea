/**
 * Pure deterministic 3-Phase Human Health Continuum Engine
 * (`before_illness` -> `during_illness` -> `after_illness`).
 *
 * Domain Purity Invariant:
 * - Zero DOM, storage, clock, RNG, or network calls.
 * - Missing sensor/vital metrics remain `null` (never coerced to 0).
 * - Syncs idempotently to `panacea_sync_outbox` (`panacea_continuum_episodes`) via callers.
 */
import {
  translateHippocraticBridge,
  type HippocraticBridgeResult,
  type HippocraticRecordInput,
  type LiteracyLensId,
} from '../education/hippocraticBridgeEngine.ts'
import { sha256Hex } from '../../lib/export/autoExportEngine.ts'

export type HealthContinuumPhase = 'before_illness' | 'during_illness' | 'after_illness'
export type RecoveryTrendState = 'better' | 'same' | 'worse' | 'unobserved'
export type DuringTriageLevel = 'emergency_igd' | 'clinician_today' | 'guided_self_care'

export interface ContinuumInput {
  readonly phase?: HealthContinuumPhase
  readonly language?: 'id' | 'en'
  readonly recoveryTrend?: RecoveryTrendState
  readonly activeSymptoms?: readonly string[]
  readonly postIllnessMedChecklist?: readonly { readonly name: string; readonly schedule: string; readonly taken?: boolean }[]
  readonly screeningReminders?: readonly string[]
  readonly localOutbreakNote?: string | null
  readonly followUpWindow?: string | null
  readonly vitals?: {
    readonly restingHrBpm?: number | null
    readonly spo2Pct?: number | null
    readonly systolicMmHg?: number | null
    readonly sleepHours?: number | null
    readonly steps?: number | null
  }
  readonly clinicalRecord?: HippocraticRecordInput
}

export interface ContinuumStateResult {
  readonly ok: true
  readonly activePhase: HealthContinuumPhase
  readonly inferredPhase: boolean
  readonly before_illness: {
    readonly dailyPreventiveHabit: string
    readonly readinessSummary: {
      readonly status: 'ready' | 'caution' | 'unobserved'
      readonly headline: string
      readonly restingHrBpm: number | null
      readonly sleepHours: number | null
      readonly steps: number | null
    }
    readonly familyScreeningReminders: readonly string[]
    readonly localOutbreakNote: string | null
  }
  readonly during_illness: {
    readonly symptomClarity: string
    readonly triageLevel: DuringTriageLevel
    readonly emergencyBanner: string | null
    readonly consultationPrepCard: {
      readonly chiefFocus: string
      readonly questions: readonly [string, string, string]
      readonly urgentTrigger: string
    }
    readonly dualLens: HippocraticBridgeResult
  }
  readonly after_illness: {
    readonly medicationChecklist: readonly { readonly name: string; readonly schedule: string; readonly taken: boolean }[]
    readonly recoveryTrend: RecoveryTrendState
    readonly returnToActivityMilestones: readonly string[]
    readonly followUpReminder: string
  }
  readonly truthClass: 'measured' | 'estimated' | 'curated_physiology'
  readonly clinicallyReviewed: false
  readonly epistemicNotice: string
}

export interface PhaseTransitionRecord {
  readonly ok: boolean
  readonly from: HealthContinuumPhase
  readonly to: HealthContinuumPhase
  readonly changed: boolean
  readonly reason: string
  readonly transitionedAtIso: string
}

export interface ContinuumOutboxEvent {
  readonly eventId: string
  readonly profileKey: string
  readonly entityType: 'panacea_continuum_episodes'
  readonly idempotencyKey: string
  readonly payloadJson: Readonly<{
    readonly phase: HealthContinuumPhase
    readonly literacyLens: LiteracyLensId
    readonly teachBackConfirmed: boolean
    readonly redFlagEscalated: boolean
    readonly nonPhiPassRef: string
    readonly clinicallyReviewed: false
    readonly recordedAtIso: string
  }>
  readonly status: 'pending'
  readonly createdAtIso: string
}

const VALID_PHASES: ReadonlySet<HealthContinuumPhase> = new Set([
  'before_illness',
  'during_illness',
  'after_illness',
])

const isPosFinite = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max

export function evaluateLifeHealthContinuum(input: ContinuumInput): ContinuumStateResult {
  const safeInput = input ?? {}
  const lang: 'id' | 'en' = safeInput.language === 'en' ? 'en' : 'id'
  const symptoms = Array.isArray(safeInput.activeSymptoms)
    ? safeInput.activeSymptoms.map((s) => String(s).trim()).filter(Boolean)
    : []
  const trend: RecoveryTrendState = safeInput.recoveryTrend ?? 'unobserved'

  const inferredPhase = !safeInput.phase || !VALID_PHASES.has(safeInput.phase)
  const activePhase: HealthContinuumPhase = !inferredPhase
    ? (safeInput.phase as HealthContinuumPhase)
    : symptoms.length > 0
      ? 'during_illness'
      : trend !== 'unobserved' || (safeInput.postIllnessMedChecklist?.length ?? 0) > 0
        ? 'after_illness'
        : 'before_illness'

  const rhr = isPosFinite(safeInput.vitals?.restingHrBpm, 25, 220) ? safeInput.vitals!.restingHrBpm : null
  const spo2 = isPosFinite(safeInput.vitals?.spo2Pct, 40, 100) ? safeInput.vitals!.spo2Pct : null
  const sbp = isPosFinite(safeInput.vitals?.systolicMmHg, 50, 260) ? safeInput.vitals!.systolicMmHg : null
  const sleep = isPosFinite(safeInput.vitals?.sleepHours, 0, 24) ? safeInput.vitals!.sleepHours : null
  const steps = isPosFinite(safeInput.vitals?.steps, 0, 150000) ? safeInput.vitals!.steps : null

  const hasReadinessSignal = rhr !== null || sleep !== null || steps !== null
  const readinessStatus: 'ready' | 'caution' | 'unobserved' = !hasReadinessSignal
    ? 'unobserved'
    : (sleep !== null && sleep < 5.5) || (rhr !== null && rhr >= 92)
      ? 'caution'
      : 'ready'

  const readinessHeadline =
    readinessStatus === 'unobserved'
      ? lang === 'id'
        ? 'Belum ada data siap harian — hubungkan perangkat atau isi manual.'
        : 'No readiness signals yet — sync a wearable or log sleep.'
      : readinessStatus === 'caution'
        ? lang === 'id'
          ? 'Tubuh butuh pemulihan ekstra hari ini — utamakan tidur cukup.'
          : 'Extra recovery advised today — prioritize rest and hydration.'
        : lang === 'id'
          ? 'Ritme tubuh stabil — pertahankan jalan kaki 20–30 menit hari ini.'
          : 'Steady daily rhythm — sustain 20–30 min moderate movement today.'

  const bridgeRecord: HippocraticRecordInput = safeInput.clinicalRecord ?? {
    topicTitle: symptoms.length > 0 ? symptoms[0] : lang === 'id' ? 'Pemantauan Kesehatan Harian' : 'Daily Health Check',
    language: lang,
    symptomSummary: symptoms.join(', '),
    spo2Pct: spo2,
    systolicMmHg: sbp,
    redFlagSymptoms: symptoms,
    consentConfirmed: true,
    scopeId: 'continuum-local-scope',
  }

  const dualLens = translateHippocraticBridge(bridgeRecord)
  const urgentEscalation = dualLens.ok && dualLens.emergencyEscalationRequired

  const triageLevel: DuringTriageLevel = urgentEscalation
    ? 'emergency_igd'
    : symptoms.length > 0 || (safeInput.clinicalRecord?.labFindings?.some((l) => l.status === 'high' || l.status === 'low') ?? false)
      ? 'clinician_today'
      : 'guided_self_care'

  const checklist = (safeInput.postIllnessMedChecklist ?? []).map((item) => ({
    name: item.name.trim(),
    schedule: item.schedule.trim(),
    taken: Boolean(item.taken),
  }))

  const hasMeasured = rhr !== null || spo2 !== null || sbp !== null || sleep !== null || steps !== null

  return {
    ok: true,
    activePhase,
    inferredPhase,
    before_illness: {
      dailyPreventiveHabit:
        lang === 'id'
          ? 'Tidur 7–8 jam, minum air cukup, gerak ringan 30 menit.'
          : 'Sleep 7–8h, hydrate consistently, move 30 minutes today.',
      readinessSummary: {
        status: readinessStatus,
        headline: readinessHeadline,
        restingHrBpm: rhr,
        sleepHours: sleep,
        steps,
      },
      familyScreeningReminders:
        safeInput.screeningReminders && safeInput.screeningReminders.length > 0
          ? safeInput.screeningReminders
          : [
              lang === 'id' ? 'Cek tekanan darah & gula darah berkala keluarga.' : 'Routine family blood pressure & glucose check.',
              lang === 'id' ? 'Pastikan jadwal imunisasi anak & lansia lengkap.' : 'Verify routine childhood and elder vaccinations.',
            ],
      localOutbreakNote: safeInput.localOutbreakNote ?? null,
    },
    during_illness: {
      symptomClarity: urgentEscalation
        ? lang === 'id'
          ? 'Tanda gawat darurat terdeteksi — segera menuju IGD.'
          : 'Emergency red-flag pattern — go to ER immediately.'
        : symptoms.length > 0
          ? symptoms.join(' · ')
          : lang === 'id'
            ? 'Catat gejala utama sebelum konsultasi dokter.'
            : 'Record key symptoms clearly before speaking with your clinician.',
      triageLevel,
      emergencyBanner: triageLevel === 'emergency_igd' ? 'Ke IGD Sekarang' : null,
      consultationPrepCard: {
        chiefFocus: bridgeRecord.topicTitle,
        questions: dualLens.ok
          ? dualLens.patient_partner.questionsForDoctor
          : [
              'What is our immediate plan?',
              'Which danger signs mean I need urgent care?',
              'When should we review progress?',
            ],
        urgentTrigger: dualLens.ok ? dualLens.plain_universal.redFlagErTrigger : 'Ke IGD Sekarang bila memburuk.',
      },
      dualLens,
    },
    after_illness: {
      medicationChecklist: checklist,
      recoveryTrend: trend,
      returnToActivityMilestones:
        trend === 'worse'
          ? [lang === 'id' ? 'Istirahat penuh & hubungi dokter hari ini.' : 'Pause heavy activity and contact clinician today.']
          : [
              lang === 'id' ? 'Hari 1–3: jalan santai dalam rumah, pantau napas.' : 'Day 1–3: light indoor walking, monitor breathing.',
              lang === 'id' ? 'Minggu 1+: tambah aktivitas bertahap bila bebas demam.' : 'Week 1+: resume light exercise once fever-free.',
            ],
      followUpReminder:
        safeInput.followUpWindow?.trim() ||
        (lang === 'id' ? 'Kontrol ulang sesuai jadwal dokter (bawa catatan gejala & obat).' : 'Attend scheduled clinician follow-up with log and active meds.'),
    },
    truthClass: hasMeasured ? 'measured' : 'curated_physiology',
    clinicallyReviewed: false,
    epistemicNotice:
      '3-phase Health Continuum organizer (clinically_reviewed=false). Urgent symptoms escalate immediately to ER/clinician care.',
  }
}

export function transitionContinuumPhase(
  from: HealthContinuumPhase,
  to: HealthContinuumPhase,
  reason: string,
  transitionedAtIso: string,
): PhaseTransitionRecord {
  const cleanReason = reason.trim()
  const isoValid = /^\d{4}-\d{2}-\d{2}T/.test(transitionedAtIso)
  if (!VALID_PHASES.has(from) || !VALID_PHASES.has(to) || !cleanReason || !isoValid) {
    return {
      ok: false,
      from,
      to,
      changed: false,
      reason: cleanReason || 'Invalid phase transition metadata',
      transitionedAtIso,
    }
  }
  return {
    ok: true,
    from,
    to,
    changed: from !== to,
    reason: cleanReason,
    transitionedAtIso,
  }
}

export function buildContinuumOutboxEvent(params: {
  readonly profileKey: string
  readonly phase: HealthContinuumPhase
  readonly literacyLens: LiteracyLensId
  readonly teachBackConfirmed: boolean
  readonly redFlagEscalated: boolean
  readonly nonPhiPassRef: string
  readonly recordedAtIso: string
}): ContinuumOutboxEvent {
  const cleanKey = params.profileKey.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'rizkyazhar486'
  const cleanPass = params.nonPhiPassRef.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'PMD-PASS'
  const digest = sha256Hex(
    `${cleanKey}|${params.phase}|${params.literacyLens}|${params.teachBackConfirmed}|${params.redFlagEscalated}|${cleanPass}|${params.recordedAtIso.slice(0, 10)}`,
  )
  return {
    eventId: `CONT-${digest.slice(0, 12).toUpperCase()}`,
    profileKey: cleanKey,
    entityType: 'panacea_continuum_episodes',
    idempotencyKey: `${cleanKey}:continuum:${params.phase}:${digest.slice(0, 16)}`,
    payloadJson: {
      phase: params.phase,
      literacyLens: params.literacyLens,
      teachBackConfirmed: Boolean(params.teachBackConfirmed),
      redFlagEscalated: Boolean(params.redFlagEscalated),
      nonPhiPassRef: cleanPass,
      clinicallyReviewed: false,
      recordedAtIso: params.recordedAtIso,
    },
    status: 'pending',
    createdAtIso: params.recordedAtIso,
  }
}
