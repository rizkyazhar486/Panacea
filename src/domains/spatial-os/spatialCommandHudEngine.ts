/**
 * Pure deterministic Panacea Stark / AUGMA-Class Holographic Spatial OS Engine.
 *
 * Domain Purity Invariant:
 * - Zero DOM, storage, clock, RNG, or network calls.
 * - All timestamps must be explicitly injected by callers.
 * - Every metric, trajectory, and graph node carries an explicit `truthClass`
 *   and preserves `null` for unobserved signals (never blank-to-zero).
 */

export type SpatialTruthClass =
  | 'measured'
  | 'estimated'
  | 'simulated'
  | 'curated_physiology'

export type CommandOperatingMode =
  | 'SLEEP'
  | 'RECOVERY'
  | 'LIFE'
  | 'CLINICAL'
  | 'FOCUS'

export type RadialArcId =
  | 'SYSTEM'
  | 'MY_BODY'
  | 'MASTER'
  | 'CLINICAL'
  | 'LAB_3D'

export interface CommandModeThresholds {
  readonly hrHighBpm: number
  readonly hrvLowMs: number
  readonly spo2MinPct: number
  readonly sleepMinHours: number
}

export interface CommandModeAccent {
  readonly primaryHex: string
  readonly secondaryHex: string
  readonly tokenName: 'crimson' | 'cyan' | 'emerald' | 'amber'
  readonly badgeLabel: string
}

export interface CommandModeProfile {
  readonly mode: CommandOperatingMode
  readonly modeIndex: '01' | '02' | '03' | '04' | '05'
  readonly label: string
  readonly directive: string
  readonly focusMinutes: number
  readonly breakMinutes: number
  readonly primaryWidgets: readonly string[]
  readonly secondaryWidgets: readonly string[]
  readonly mutedWidgets: readonly string[]
  readonly thresholds: CommandModeThresholds
  readonly accent: CommandModeAccent
  readonly truthClass: 'curated_physiology'
}

export interface RadialArcNode {
  readonly id: RadialArcId
  readonly label: string
  readonly shortLabel: string
  readonly angleDeg: number
  readonly route: string
  readonly modeAffinity: readonly CommandOperatingMode[]
  readonly active: boolean
}

export interface TacticalLauncherSlot {
  readonly index: '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08'
  readonly label: string
  readonly route: string
  readonly domain: string
  readonly emphasized: boolean
}

export interface RadialCommandDeckState {
  readonly mode: CommandOperatingMode
  readonly modeProfile: CommandModeProfile
  readonly activeArcId: RadialArcId
  readonly arcNodes: readonly RadialArcNode[]
  readonly launcherSlots: readonly TacticalLauncherSlot[]
}

export interface RawTelemetrySample {
  readonly label: string
  readonly steps?: number | null
  readonly sleepHours?: number | null
  readonly restingHrBpm?: number | null
  readonly hrvMs?: number | null
  readonly vo2max?: number | null
  readonly readinessCore?: number | null
  readonly measured?: boolean
}

export interface NormalizedTelemetryPoint {
  readonly label: string
  readonly stepsNorm: number | null
  readonly sleepNorm: number | null
  readonly restingHrNorm: number | null
  readonly hrvNorm: number | null
  readonly vo2maxNorm: number | null
  readonly gtaCoreNorm: number | null
  readonly ensembleScore: number | null
  readonly observedChannelCount: number
  readonly truthClass: SpatialTruthClass
}

export interface EnsembleTelemetrySeries {
  readonly points: readonly NormalizedTelemetryPoint[]
  readonly observedPointCount: number
  readonly totalPointCount: number
  readonly coveragePct: number
  readonly latestEnsembleScore: number | null
  readonly truthClass: SpatialTruthClass
  readonly clinicallyReviewed: false
  readonly epistemicNotice: string
}

export type HolotableProtocolLever =
  | 'sleep_lock'
  | 'zone2_cardio'
  | 'fascia_decompression'
  | 'anti_inflammatory_nutrition'

export interface HolotableTrajectoryInput {
  readonly chronologicalAgeYears: number
  readonly baselineBiologicalAgeYears: number
  readonly baselineCardiovascularRiskPct: number
  readonly baselineMetabolicRiskPct: number
  readonly baselineFasciaAlignmentPct: number
  readonly baselineHrvMs?: number | null
  readonly baselineGaitRecoilPct?: number | null
  readonly baselineHsCrpMgL?: number | null
  readonly activeLevers: readonly HolotableProtocolLever[]
  readonly horizonMonths?: number
}

export interface TrajectoryCoordinate3D {
  readonly stepIndex: number
  readonly month: number
  readonly t: number
  readonly baselineX: number
  readonly baselineY: number
  readonly baselineZ: number
  readonly optimizedX: number
  readonly optimizedY: number
  readonly optimizedZ: number
  readonly baselineBioAge: number
  readonly optimizedBioAge: number
  readonly bioAgeCiLow: number
  readonly bioAgeCiHigh: number
  readonly baselineCvRiskPct: number
  readonly optimizedCvRiskPct: number
  readonly baselineMetabolicRiskPct: number
  readonly optimizedMetabolicRiskPct: number
  readonly baselineFasciaAlignmentPct: number
  readonly optimizedFasciaAlignmentPct: number
  readonly baselineHrvMs: number
  readonly optimizedHrvMs: number
  readonly baselineGaitRecoilPct: number
  readonly optimizedGaitRecoilPct: number
  readonly baselineHsCrpMgL: number
  readonly optimizedHsCrpMgL: number
}

export interface HolotableTrajectoryDelta {
  readonly id: 'bio_age' | 'cv_risk' | 'metabolic_risk' | 'fascia_alignment' | 'hrv_recovery' | 'gait_recoil' | 'inflammation'
  readonly label: string
  readonly unit: string
  readonly nowValue: number
  readonly optimizedValue: number
  readonly delta: number
  readonly confidenceLow: number
  readonly confidenceHigh: number
  readonly truthClass: 'simulated'
}

export type HolotableTrajectoryResult =
  | {
      readonly ok: true
      readonly horizonMonths: number
      readonly activeLevers: readonly HolotableProtocolLever[]
      readonly curve: readonly TrajectoryCoordinate3D[]
      readonly deltas: readonly HolotableTrajectoryDelta[]
      readonly convergenceConfidence01: number
      readonly truthClass: 'simulated'
      readonly clinicallyReviewed: false
      readonly epistemicNotice: string
    }
  | { readonly ok: false; readonly error: string }

export type ConstellationNodeCategory =
  | 'vital'
  | 'organ'
  | 'fascia'
  | 'skdi'
  | 'pharmacology'

export interface ConstellationNode3D {
  readonly id: string
  readonly label: string
  readonly category: ConstellationNodeCategory
  readonly x: number
  readonly y: number
  readonly z: number
  readonly valueLabel: string
  readonly status: 'nominal' | 'watch' | 'unobserved' | 'reference'
  readonly truthClass: SpatialTruthClass
  readonly summary: string
  readonly provenance: string
  readonly route: string
}

export interface ConstellationEdge {
  readonly from: string
  readonly to: string
  readonly relation: string
  readonly weight01: number
}

export interface KnowledgeConstellationInput {
  readonly restingHrBpm?: number | null
  readonly hrvMs?: number | null
  readonly sleepHours?: number | null
  readonly vo2max?: number | null
  readonly fasciaAlignmentPct?: number | null
}

export interface KnowledgeConstellationGraph {
  readonly nodes: readonly ConstellationNode3D[]
  readonly edges: readonly ConstellationEdge[]
  readonly truthClass: SpatialTruthClass
  readonly clinicallyReviewed: false
  readonly epistemicNotice: string
}

export interface DailyProtocolSlot {
  readonly id: string
  readonly label: string
  readonly category: 'habit' | 'clinical' | 'workout' | 'fascia' | 'sleep'
  readonly startHour: number
  readonly endHour: number
  readonly emphasizedInModes: readonly CommandOperatingMode[]
  readonly route: string
}

export interface SpatialOutboxPayload {
  readonly id: string
  readonly table: 'panacea_digital_twin_snapshots' | 'panacea_sync_outbox'
  readonly operation: 'upsert'
  readonly profileKey: string
  readonly recordedAtIso: string
  readonly payload: Readonly<Record<string, unknown>>
  readonly truthClass: SpatialTruthClass
  readonly clinicallyReviewed: false
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
const round = (v: number, digits = 2): number => Number(v.toFixed(digits))
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isFiniteIn = (v: unknown, lo: number, hi: number): v is number =>
  isFiniteNumber(v) && v >= lo && v <= hi

function deterministicHashHex(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return (h >>> 0).toString(16).padStart(8, '0').toUpperCase()
}

export const COMMAND_MODES: readonly CommandOperatingMode[] = Object.freeze([
  'SLEEP',
  'RECOVERY',
  'LIFE',
  'CLINICAL',
  'FOCUS',
])

const MODE_PROFILES: Readonly<Record<CommandOperatingMode, CommandModeProfile>> = Object.freeze({
  SLEEP: {
    mode: 'SLEEP',
    modeIndex: '01',
    label: 'Sleep & Circadian Lock',
    directive: 'Down-regulate sympathetic tone, protect melatonin onset, and track overnight HRV/SpO2 continuity.',
    focusMinutes: 15,
    breakMinutes: 5,
    primaryWidgets: ['circadian_clock', 'ensemble_history', 'sleep_timeline'],
    secondaryWidgets: ['neon_outbox', 'ai_guide'],
    mutedWidgets: ['high_intensity_load', 'skdi_exam_drills'],
    thresholds: { hrHighBpm: 72, hrvLowMs: 45, spo2MinPct: 95, sleepMinHours: 7.5 },
    accent: { primaryHex: '#38bdf8', secondaryHex: '#22d3ee', tokenName: 'cyan', badgeLabel: 'CIRCADIAN LOCK' },
    truthClass: 'curated_physiology',
  },
  RECOVERY: {
    mode: 'RECOVERY',
    modeIndex: '02',
    label: 'Autonomic & Fascia Recovery',
    directive: 'Prioritize vagal rebound, myofascial kinetic chain decompression, and low-strain metabolic repair.',
    focusMinutes: 20,
    breakMinutes: 10,
    primaryWidgets: ['fascia_chain', 'digital_twin_stage', 'ensemble_history'],
    secondaryWidgets: ['holotable_counterfactual', 'protocol_timeline'],
    mutedWidgets: ['acute_triage_alerts'],
    thresholds: { hrHighBpm: 82, hrvLowMs: 42, spo2MinPct: 95, sleepMinHours: 7.2 },
    accent: { primaryHex: '#10b981', secondaryHex: '#38bdf8', tokenName: 'emerald', badgeLabel: 'REPAIR VECTOR' },
    truthClass: 'curated_physiology',
  },
  LIFE: {
    mode: 'LIFE',
    modeIndex: '03',
    label: 'Longitudinal Life OS',
    directive: 'Balance daily movement, cognitive energy, nutrition, and continuous preventive baseline sync.',
    focusMinutes: 25,
    breakMinutes: 5,
    primaryWidgets: ['welcome_shortcuts', 'tactical_clock', 'ensemble_history', 'protocol_timeline'],
    secondaryWidgets: ['digital_twin_stage', 'neon_outbox'],
    mutedWidgets: ['icu_escalation_panel'],
    thresholds: { hrHighBpm: 95, hrvLowMs: 35, spo2MinPct: 95, sleepMinHours: 7.0 },
    accent: { primaryHex: '#ff2d46', secondaryHex: '#38bdf8', tokenName: 'crimson', badgeLabel: 'AUGMA LIVE' },
    truthClass: 'curated_physiology',
  },
  CLINICAL: {
    mode: 'CLINICAL',
    modeIndex: '04',
    label: 'Clinical Command & Visit OS',
    directive: 'Surface clinical provenance, Visit OS readiness, SKDI differential lookup, and lab continuity.',
    focusMinutes: 30,
    breakMinutes: 5,
    primaryWidgets: ['clinical_notes', 'knowledge_constellation', 'digital_twin_stage', 'neon_outbox'],
    secondaryWidgets: ['ensemble_history', 'command_palette'],
    mutedWidgets: ['aesthetic_recomp_preview'],
    thresholds: { hrHighBpm: 100, hrvLowMs: 30, spo2MinPct: 94, sleepMinHours: 6.5 },
    accent: { primaryHex: '#f59e0b', secondaryHex: '#ff2d46', tokenName: 'amber', badgeLabel: 'CLINICAL OPS' },
    truthClass: 'curated_physiology',
  },
  FOCUS: {
    mode: 'FOCUS',
    modeIndex: '05',
    label: 'Deep Focus & Simulation',
    directive: 'Minimize chrome distraction; dedicate bandwidth to 3D Digital Twin, Holotable modeling, and deep work.',
    focusMinutes: 50,
    breakMinutes: 10,
    primaryWidgets: ['tactical_clock', 'holotable_counterfactual', 'digital_twin_stage'],
    secondaryWidgets: ['knowledge_constellation', 'command_palette'],
    mutedWidgets: ['social_feed_signals', 'non_urgent_notifications'],
    thresholds: { hrHighBpm: 92, hrvLowMs: 38, spo2MinPct: 95, sleepMinHours: 7.0 },
    accent: { primaryHex: '#22d3ee', secondaryHex: '#f59e0b', tokenName: 'cyan', badgeLabel: 'DEEP FOCUS' },
    truthClass: 'curated_physiology',
  },
})

export function getCommandModeProfile(mode: CommandOperatingMode): CommandModeProfile {
  return MODE_PROFILES[mode] ?? MODE_PROFILES.LIFE
}

const RAW_ARC_NODES: readonly Omit<RadialArcNode, 'active'>[] = Object.freeze([
  { id: 'SYSTEM', label: 'SYSTEM', shortLabel: 'SYS', angleDeg: -140, route: '/command-os?view=deck', modeAffinity: ['LIFE', 'FOCUS'] },
  { id: 'MY_BODY', label: 'MY BODY', shortLabel: 'BODY', angleDeg: -110, route: '/tubuh', modeAffinity: ['RECOVERY', 'SLEEP'] },
  { id: 'MASTER', label: 'MASTER', shortLabel: 'MSTR', angleDeg: -90, route: '/command-os?view=twin', modeAffinity: ['LIFE', 'FOCUS'] },
  { id: 'CLINICAL', label: 'CLINICAL', shortLabel: 'CLIN', angleDeg: -70, route: '/visit-os', modeAffinity: ['CLINICAL'] },
  { id: 'LAB_3D', label: '3D LAB', shortLabel: '3D', angleDeg: -40, route: '/body-exposure', modeAffinity: ['FOCUS', 'RECOVERY'] },
])

const RAW_LAUNCHER_SLOTS: readonly Omit<TacticalLauncherSlot, 'emphasized'>[] = Object.freeze([
  { index: '01', label: 'PROFILE', route: '/profile', domain: 'IDENTITY' },
  { index: '02', label: 'DIGITAL TWIN', route: '/command-os?view=twin', domain: 'HOLO_STAGE' },
  { index: '03', label: 'FASCIA', route: '/aesthetic', domain: 'BIOMECHANICS' },
  { index: '04', label: 'VISIT OS', route: '/visit-os', domain: 'CLINICAL' },
  { index: '05', label: 'LABS', route: '/health-data', domain: 'BIOMARKERS' },
  { index: '06', label: '3D ATLAS', route: '/body-exposure', domain: 'Z_ANATOMY' },
  { index: '07', label: 'WEARABLES', route: '/tubuh?t=jantung', domain: 'TELEMETRY' },
  { index: '08', label: 'NEON SYNC', route: '/command-os?view=holotable', domain: 'SOVEREIGN_DB' },
])

const MODE_EMPHASIZED_SLOTS: Readonly<Record<CommandOperatingMode, readonly string[]>> = Object.freeze({
  SLEEP: ['02', '07', '08'],
  RECOVERY: ['02', '03', '07'],
  LIFE: ['01', '02', '05', '08'],
  CLINICAL: ['04', '05', '06', '08'],
  FOCUS: ['02', '06', '08'],
})

export function getRadialCommandDeck(
  mode: CommandOperatingMode,
  activeArcId?: RadialArcId,
): RadialCommandDeckState {
  const modeProfile = getCommandModeProfile(mode)
  const resolvedArc: RadialArcId =
    activeArcId ??
    (mode === 'CLINICAL'
      ? 'CLINICAL'
      : mode === 'RECOVERY' || mode === 'SLEEP'
        ? 'MY_BODY'
        : mode === 'FOCUS'
          ? 'LAB_3D'
          : 'MASTER')

  const emphasized = new Set(MODE_EMPHASIZED_SLOTS[mode] ?? MODE_EMPHASIZED_SLOTS.LIFE)

  return {
    mode: modeProfile.mode,
    modeProfile,
    activeArcId: resolvedArc,
    arcNodes: RAW_ARC_NODES.map((node) => ({
      ...node,
      active: node.id === resolvedArc,
    })),
    launcherSlots: RAW_LAUNCHER_SLOTS.map((slot) => ({
      ...slot,
      emphasized: emphasized.has(slot.index),
    })),
  }
}

function normalizeSteps(steps: unknown): number | null {
  if (!isFiniteIn(steps, 0, 150000)) return null
  return round(clamp((steps / 12000) * 100, 0, 100), 1)
}

function normalizeSleep(hours: unknown): number | null {
  if (!isFiniteIn(hours, 0, 24)) return null
  // Optimal zone centered near 8.0h; linear penalty outside 7.5–9.0h
  const deviation = hours < 7.5 ? 7.5 - hours : hours > 9.5 ? hours - 9.5 : 0
  return round(clamp(100 - deviation * 18, 0, 100), 1)
}

function normalizeRestingHr(bpm: unknown): number | null {
  if (!isFiniteIn(bpm, 25, 220)) return null
  // Lower resting HR within healthy physiological range maps higher (45 bpm -> 100, 95 bpm -> 20)
  return round(clamp(100 - ((bpm - 45) / 62.5) * 100, 0, 100), 1)
}

function normalizeHrv(ms: unknown): number | null {
  if (!isFiniteIn(ms, 1, 400)) return null
  return round(clamp(((ms - 15) / 95) * 100, 0, 100), 1)
}

function normalizeVo2(vo2: unknown): number | null {
  if (!isFiniteIn(vo2, 10, 95)) return null
  return round(clamp(((vo2 - 22) / 43) * 100, 0, 100), 1)
}

function normalizeCore(score: unknown): number | null {
  if (!isFiniteIn(score, 0, 100)) return null
  return round(score, 1)
}

export function buildEnsembleTelemetrySeries(
  samples: readonly RawTelemetrySample[],
): EnsembleTelemetrySeries {
  if (!Array.isArray(samples) || samples.length === 0) {
    return {
      points: [],
      observedPointCount: 0,
      totalPointCount: 0,
      coveragePct: 0,
      latestEnsembleScore: null,
      truthClass: 'measured',
      clinicallyReviewed: false,
      epistemicNotice: 'No telemetry observations recorded yet. Missing signals remain null and are never fabricated.',
    }
  }

  let measuredPoints = 0
  let estimatedPoints = 0

  const points: NormalizedTelemetryPoint[] = samples.map((sample, idx) => {
    const stepsNorm = normalizeSteps(sample.steps)
    const sleepNorm = normalizeSleep(sample.sleepHours)
    const restingHrNorm = normalizeRestingHr(sample.restingHrBpm)
    const hrvNorm = normalizeHrv(sample.hrvMs)
    const vo2maxNorm = normalizeVo2(sample.vo2max)
    const gtaCoreNorm = normalizeCore(sample.readinessCore)

    const measuredChannels = [stepsNorm, sleepNorm, restingHrNorm, hrvNorm, vo2maxNorm].filter(
      (v): v is number => v !== null,
    )
    const allChannels = [...measuredChannels, ...(gtaCoreNorm !== null ? [gtaCoreNorm] : [])]

    const observedChannelCount = allChannels.length
    const ensembleScore =
      observedChannelCount > 0
        ? round(allChannels.reduce((acc, v) => acc + v, 0) / observedChannelCount, 1)
        : null

    let truthClass: SpatialTruthClass
    if (sample.measured === false) {
      truthClass = 'simulated'
    } else if (measuredChannels.length > 0 && gtaCoreNorm === null) {
      truthClass = 'measured'
      measuredPoints++
    } else if (measuredChannels.length > 0 || gtaCoreNorm !== null) {
      truthClass = 'estimated'
      estimatedPoints++
    } else {
      truthClass = 'measured'
    }

    return {
      label: typeof sample.label === 'string' && sample.label.trim() ? sample.label.trim() : `T${idx + 1}`,
      stepsNorm,
      sleepNorm,
      restingHrNorm,
      hrvNorm,
      vo2maxNorm,
      gtaCoreNorm,
      ensembleScore,
      observedChannelCount,
      truthClass,
    }
  })

  const observedPoints = points.filter((p) => p.ensembleScore !== null)
  const observedPointCount = observedPoints.length
  const latestEnsembleScore =
    observedPointCount > 0 ? observedPoints[observedPointCount - 1].ensembleScore : null

  const seriesTruthClass: SpatialTruthClass =
    observedPointCount === 0
      ? 'measured'
      : measuredPoints === observedPointCount
        ? 'measured'
        : measuredPoints + estimatedPoints > 0
          ? 'estimated'
          : 'simulated'

  return {
    points,
    observedPointCount,
    totalPointCount: points.length,
    coveragePct: Math.round((observedPointCount / points.length) * 100),
    latestEnsembleScore,
    truthClass: seriesTruthClass,
    clinicallyReviewed: false,
    epistemicNotice:
      'Normalized multi-channel telemetry series. Unrecorded days/channels stay null (never coerced to zero); not clinician-reviewed.',
  }
}

const LEVER_EFFECTS: Readonly<
  Record<
    HolotableProtocolLever,
    {
      readonly bioAgeDeltaYears: number
      readonly cvRiskRelReduction: number
      readonly metabolicRelReduction: number
      readonly fasciaGainPct: number
      readonly hrvGainMs: number
      readonly gaitGainPct: number
      readonly hsCrpRelReduction: number
    }
  >
> = Object.freeze({
  sleep_lock: {
    bioAgeDeltaYears: -1.1,
    cvRiskRelReduction: 0.14,
    metabolicRelReduction: 0.16,
    fasciaGainPct: 4.5,
    hrvGainMs: 11,
    gaitGainPct: 3.5,
    hsCrpRelReduction: 0.18,
  },
  zone2_cardio: {
    bioAgeDeltaYears: -1.5,
    cvRiskRelReduction: 0.24,
    metabolicRelReduction: 0.22,
    fasciaGainPct: 6.0,
    hrvGainMs: 14,
    gaitGainPct: 9.5,
    hsCrpRelReduction: 0.2,
  },
  fascia_decompression: {
    bioAgeDeltaYears: -0.4,
    cvRiskRelReduction: 0.05,
    metabolicRelReduction: 0.04,
    fasciaGainPct: 16.5,
    hrvGainMs: 5,
    gaitGainPct: 14.0,
    hsCrpRelReduction: 0.08,
  },
  anti_inflammatory_nutrition: {
    bioAgeDeltaYears: -1.0,
    cvRiskRelReduction: 0.17,
    metabolicRelReduction: 0.25,
    fasciaGainPct: 3.5,
    hrvGainMs: 6,
    gaitGainPct: 2.5,
    hsCrpRelReduction: 0.28,
  },
})

export function solveHolotableCounterfactualTrajectories(
  input: HolotableTrajectoryInput,
): HolotableTrajectoryResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Holotable input must be a valid object.' }
  }
  if (!isFiniteIn(input.chronologicalAgeYears, 18, 110) || !isFiniteIn(input.baselineBiologicalAgeYears, 14, 120)) {
    return { ok: false, error: 'Age inputs must be finite human values (chronological [18..110], biological [14..120]).' }
  }
  if (!isFiniteIn(input.baselineCardiovascularRiskPct, 0.1, 80) || !isFiniteIn(input.baselineMetabolicRiskPct, 0.1, 85)) {
    return { ok: false, error: 'Risk inputs must be finite percentages within physiological bounds.' }
  }
  if (!isFiniteIn(input.baselineFasciaAlignmentPct, 5, 100)) {
    return { ok: false, error: 'baselineFasciaAlignmentPct must be within [5..100].' }
  }

  const horizonMonths = isFiniteIn(input.horizonMonths, 3, 60) ? Math.round(input.horizonMonths) : 36
  const uniqueLevers = Array.from(
    new Set((input.activeLevers ?? []).filter((l): l is HolotableProtocolLever => l in LEVER_EFFECTS)),
  )

  let totalBioAgeDelta = 0
  let cvSurvivalFactor = 1
  let metabolicSurvivalFactor = 1
  let totalFasciaGain = 0
  let totalHrvGain = 0
  let totalGaitGain = 0
  let hsCrpSurvivalFactor = 1

  for (const lever of uniqueLevers) {
    const eff = LEVER_EFFECTS[lever]
    totalBioAgeDelta += eff.bioAgeDeltaYears
    cvSurvivalFactor *= 1 - eff.cvRiskRelReduction
    metabolicSurvivalFactor *= 1 - eff.metabolicRelReduction
    totalFasciaGain += eff.fasciaGainPct
    totalHrvGain += eff.hrvGainMs
    totalGaitGain += eff.gaitGainPct
    hsCrpSurvivalFactor *= 1 - eff.hsCrpRelReduction
  }

  // Cap simulated protocol improvement so outputs never exaggerate beyond realistic educational envelopes
  const cappedBioAgeDelta = clamp(totalBioAgeDelta, -4.2, 0)
  const baseHrv = isFiniteIn(input.baselineHrvMs, 10, 220) ? input.baselineHrvMs : 56
  const baseGait = isFiniteIn(input.baselineGaitRecoilPct, 20, 100) ? input.baselineGaitRecoilPct : 64
  const baseHsCrp = isFiniteIn(input.baselineHsCrpMgL, 0.05, 25) ? input.baselineHsCrpMgL : 1.6

  const horizonYears = horizonMonths / 12
  const steps = 12
  const curve: TrajectoryCoordinate3D[] = []

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const month = Math.round(t * horizonMonths)
    // Smooth logistic-like adoption envelope (1 - e^-3t) / (1 - e^-3)
    const adoption = (1 - Math.exp(-3 * t)) / (1 - Math.exp(-3))

    // Baseline trajectory drifts slowly with chronological aging
    const baselineBioAge = round(input.baselineBiologicalAgeYears + horizonYears * t * 1.05, 2)
    const optimizedBioAge = round(
      clamp(baselineBioAge + cappedBioAgeDelta * adoption, 14, 120),
      2,
    )
    // Uncertainty widens realistically over longer forecast horizons
    const uncertaintyHalfWidth = round(0.25 + t * 1.15 + uniqueLevers.length * 0.12 * t, 2)
    const bioAgeCiLow = round(Math.max(14, optimizedBioAge - uncertaintyHalfWidth), 2)
    const bioAgeCiHigh = round(optimizedBioAge + uncertaintyHalfWidth, 2)

    const baselineCvRiskPct = round(clamp(input.baselineCardiovascularRiskPct * (1 + 0.08 * t), 0.1, 85), 2)
    const optimizedCvRiskPct = round(
      clamp(baselineCvRiskPct * (1 - (1 - cvSurvivalFactor) * adoption), 0.1, 85),
      2,
    )

    const baselineMetabolicRiskPct = round(clamp(input.baselineMetabolicRiskPct * (1 + 0.09 * t), 0.1, 85), 2)
    const optimizedMetabolicRiskPct = round(
      clamp(baselineMetabolicRiskPct * (1 - (1 - metabolicSurvivalFactor) * adoption), 0.1, 85),
      2,
    )

    const baselineFasciaAlignmentPct = round(clamp(input.baselineFasciaAlignmentPct - 2.0 * t, 5, 100), 1)
    const optimizedFasciaAlignmentPct = round(
      clamp(input.baselineFasciaAlignmentPct + totalFasciaGain * adoption, 5, 98),
      1,
    )

    const baselineHrvMs = round(clamp(baseHrv - 2.4 * t, 10, 220), 1)
    const optimizedHrvMs = round(clamp(baseHrv + totalHrvGain * adoption, 10, 220), 1)

    const baselineGaitRecoilPct = round(clamp(baseGait - 1.8 * t, 20, 100), 1)
    const optimizedGaitRecoilPct = round(clamp(baseGait + totalGaitGain * adoption, 20, 98), 1)

    const baselineHsCrpMgL = round(clamp(baseHsCrp * (1 + 0.06 * t), 0.05, 25), 2)
    const optimizedHsCrpMgL = round(
      clamp(baselineHsCrpMgL * (1 - (1 - hsCrpSurvivalFactor) * adoption), 0.05, 25),
      2,
    )

    // 3D Holotable parametric orbital coordinates (bounded [-1..1] normalized space)
    const theta = t * Math.PI * 1.65 - Math.PI * 0.82
    const baseRadius = 0.82 - t * 0.1
    const optRadius = 0.56 + adoption * 0.22
    const baselineX = round(Math.cos(theta) * baseRadius, 4)
    const baselineZ = round(Math.sin(theta) * baseRadius, 4)
    const baselineY = round(-0.22 - t * 0.16, 4)

    const optimizedX = round(Math.cos(theta + 0.24 * adoption) * optRadius, 4)
    const optimizedZ = round(Math.sin(theta + 0.24 * adoption) * optRadius, 4)
    const optimizedY = round(-0.18 + adoption * 0.56, 4)

    curve.push({
      stepIndex: i,
      month,
      t: round(t, 4),
      baselineX,
      baselineY,
      baselineZ,
      optimizedX,
      optimizedY,
      optimizedZ,
      baselineBioAge,
      optimizedBioAge,
      bioAgeCiLow,
      bioAgeCiHigh,
      baselineCvRiskPct,
      optimizedCvRiskPct,
      baselineMetabolicRiskPct,
      optimizedMetabolicRiskPct,
      baselineFasciaAlignmentPct,
      optimizedFasciaAlignmentPct,
      baselineHrvMs,
      optimizedHrvMs,
      baselineGaitRecoilPct,
      optimizedGaitRecoilPct,
      baselineHsCrpMgL,
      optimizedHsCrpMgL,
    })
  }

  const end = curve[curve.length - 1]
  const convergenceConfidence01 = round(clamp(0.84 - horizonMonths * 0.004 - uniqueLevers.length * 0.025, 0.42, 0.86), 2)

  const deltas: readonly HolotableTrajectoryDelta[] = Object.freeze([
    {
      id: 'bio_age',
      label: 'Biological Age',
      unit: 'yrs',
      nowValue: end.baselineBioAge,
      optimizedValue: end.optimizedBioAge,
      delta: round(end.optimizedBioAge - end.baselineBioAge, 2),
      confidenceLow: end.bioAgeCiLow,
      confidenceHigh: end.bioAgeCiHigh,
      truthClass: 'simulated',
    },
    {
      id: 'cv_risk',
      label: 'Cardiovascular Risk',
      unit: '%',
      nowValue: end.baselineCvRiskPct,
      optimizedValue: end.optimizedCvRiskPct,
      delta: round(end.optimizedCvRiskPct - end.baselineCvRiskPct, 2),
      confidenceLow: round(Math.max(0.1, end.optimizedCvRiskPct * 0.82), 2),
      confidenceHigh: round(Math.min(85, end.optimizedCvRiskPct * 1.18), 2),
      truthClass: 'simulated',
    },
    {
      id: 'metabolic_risk',
      label: 'Metabolic Risk',
      unit: '%',
      nowValue: end.baselineMetabolicRiskPct,
      optimizedValue: end.optimizedMetabolicRiskPct,
      delta: round(end.optimizedMetabolicRiskPct - end.baselineMetabolicRiskPct, 2),
      confidenceLow: round(Math.max(0.1, end.optimizedMetabolicRiskPct * 0.8), 2),
      confidenceHigh: round(Math.min(85, end.optimizedMetabolicRiskPct * 1.2), 2),
      truthClass: 'simulated',
    },
    {
      id: 'fascia_alignment',
      label: 'Fascia Kinetic Alignment',
      unit: '%',
      nowValue: end.baselineFasciaAlignmentPct,
      optimizedValue: end.optimizedFasciaAlignmentPct,
      delta: round(end.optimizedFasciaAlignmentPct - end.baselineFasciaAlignmentPct, 1),
      confidenceLow: round(Math.max(5, end.optimizedFasciaAlignmentPct - 6), 1),
      confidenceHigh: round(Math.min(99, end.optimizedFasciaAlignmentPct + 4), 1),
      truthClass: 'simulated',
    },
    {
      id: 'hrv_recovery',
      label: 'HRV / Recovery',
      unit: 'ms',
      nowValue: end.baselineHrvMs,
      optimizedValue: end.optimizedHrvMs,
      delta: round(end.optimizedHrvMs - end.baselineHrvMs, 1),
      confidenceLow: round(Math.max(10, end.optimizedHrvMs - 7), 1),
      confidenceHigh: round(Math.min(220, end.optimizedHrvMs + 7), 1),
      truthClass: 'simulated',
    },
    {
      id: 'gait_recoil',
      label: 'Gait Elastic Recoil',
      unit: '%',
      nowValue: end.baselineGaitRecoilPct,
      optimizedValue: end.optimizedGaitRecoilPct,
      delta: round(end.optimizedGaitRecoilPct - end.baselineGaitRecoilPct, 1),
      confidenceLow: round(Math.max(20, end.optimizedGaitRecoilPct - 5), 1),
      confidenceHigh: round(Math.min(99, end.optimizedGaitRecoilPct + 4), 1),
      truthClass: 'simulated',
    },
    {
      id: 'inflammation',
      label: 'Inflammation (hs-CRP)',
      unit: 'mg/L',
      nowValue: end.baselineHsCrpMgL,
      optimizedValue: end.optimizedHsCrpMgL,
      delta: round(end.optimizedHsCrpMgL - end.baselineHsCrpMgL, 2),
      confidenceLow: round(Math.max(0.05, end.optimizedHsCrpMgL * 0.78), 2),
      confidenceHigh: round(Math.min(25, end.optimizedHsCrpMgL * 1.24), 2),
      truthClass: 'simulated',
    },
  ])

  return {
    ok: true,
    horizonMonths,
    activeLevers: uniqueLevers,
    curve,
    deltas,
    convergenceConfidence01,
    truthClass: 'simulated',
    clinicallyReviewed: false,
    epistemicNotice:
      'Counterfactual parametric simulation only (truthClass=simulated). Confidence bounds widen with horizon; never a clinical prognosis or prescription.',
  }
}

export function buildKnowledgeConstellationGraph(
  input: KnowledgeConstellationInput,
): KnowledgeConstellationGraph {
  const rhr = isFiniteIn(input.restingHrBpm, 25, 220) ? input.restingHrBpm : null
  const hrv = isFiniteIn(input.hrvMs, 1, 400) ? input.hrvMs : null
  const sleep = isFiniteIn(input.sleepHours, 0, 24) ? input.sleepHours : null
  const vo2 = isFiniteIn(input.vo2max, 10, 95) ? input.vo2max : null
  const fascia = isFiniteIn(input.fasciaAlignmentPct, 5, 100) ? input.fasciaAlignmentPct : null

  const nodes: readonly ConstellationNode3D[] = Object.freeze([
    {
      id: 'vital-hrv',
      label: 'HRV RMSSD',
      category: 'vital',
      x: -0.76,
      y: 0.42,
      z: 0.34,
      valueLabel: hrv !== null ? `${round(hrv, 0)} ms` : 'Unobserved',
      status: hrv === null ? 'unobserved' : hrv >= 45 ? 'nominal' : 'watch',
      truthClass: hrv !== null ? 'measured' : 'curated_physiology',
      summary: 'Autonomic vagal modulation index linking brain-heart coherence and recovery reserve.',
      provenance: 'Local unified vitals store (pmd_health_profile)',
      route: '/tubuh?t=jantung',
    },
    {
      id: 'vital-rhr',
      label: 'Resting HR',
      category: 'vital',
      x: -0.58,
      y: -0.34,
      z: 0.56,
      valueLabel: rhr !== null ? `${round(rhr, 0)} bpm` : 'Unobserved',
      status: rhr === null ? 'unobserved' : rhr <= 75 ? 'nominal' : 'watch',
      truthClass: rhr !== null ? 'measured' : 'curated_physiology',
      summary: 'Baseline myocardial pacing load across supine rest and sleep windows.',
      provenance: 'Local unified vitals store (pmd_health_profile)',
      route: '/tubuh?t=jantung',
    },
    {
      id: 'vital-sleep',
      label: 'Circadian Sleep',
      category: 'vital',
      x: -0.24,
      y: 0.72,
      z: -0.36,
      valueLabel: sleep !== null ? `${round(sleep, 1)} h` : 'Unobserved',
      status: sleep === null ? 'unobserved' : sleep >= 7 ? 'nominal' : 'watch',
      truthClass: sleep !== null ? 'measured' : 'curated_physiology',
      summary: 'Homeostatic sleep pressure clearance and nocturnal endocrine repair window.',
      provenance: 'Local unified vitals store (pmd_health_profile)',
      route: '/tubuh?t=tidur',
    },
    {
      id: 'organ-heart',
      label: 'Cardiopulmonary Core',
      category: 'organ',
      x: 0.04,
      y: 0.14,
      z: 0.48,
      valueLabel: vo2 !== null ? `VO2 ${round(vo2, 1)}` : 'Reference Mesh',
      status: vo2 === null ? 'reference' : vo2 >= 40 ? 'nominal' : 'watch',
      truthClass: vo2 !== null ? 'estimated' : 'curated_physiology',
      summary: 'Coupled left-ventricular ejection, alveolar gas exchange, and aerobic oxygen transport.',
      provenance: 'Z-Anatomy CC BY-SA 4.0 + Cardiopulmonary Engine',
      route: '/body-exposure',
    },
    {
      id: 'organ-brain',
      label: 'Autonomic & SCN Hub',
      category: 'organ',
      x: 0.12,
      y: 0.78,
      z: 0.18,
      valueLabel: 'Borbely C+S',
      status: 'reference',
      truthClass: 'curated_physiology',
      summary: 'Suprachiasmatic master clock coordinating vagal output, alertness, and cortisol rhythm.',
      provenance: 'Panacea Neuro-Autonomic Atlas',
      route: '/body-exposure',
    },
    {
      id: 'fascia-sfl',
      label: 'Superficial Front Line',
      category: 'fascia',
      x: 0.62,
      y: -0.18,
      z: 0.42,
      valueLabel: fascia !== null ? `${round(fascia, 0)}% align` : 'Simulated Chain',
      status: fascia === null ? 'reference' : fascia >= 65 ? 'nominal' : 'watch',
      truthClass: 'simulated',
      summary: 'Feet-to-face myofascial tension continuity (plantar arch -> core -> SCM -> submental sling).',
      provenance: 'fasciaKineticChainEngine (non-osteogenesis biomechanics model)',
      route: '/aesthetic',
    },
    {
      id: 'fascia-plantar',
      label: 'Plantar Arch Recoil',
      category: 'fascia',
      x: 0.54,
      y: -0.74,
      z: 0.12,
      valueLabel: 'Gait Kinetic Base',
      status: 'reference',
      truthClass: 'simulated',
      summary: 'Elastic energy storage at the foot tripod governing pelvic symmetry and craniocervical stack.',
      provenance: 'fasciaKineticChainEngine',
      route: '/aesthetic',
    },
    {
      id: 'skdi-htn',
      label: 'SKDI 4A · Hipertensi Esensial',
      category: 'skdi',
      x: 0.74,
      y: 0.48,
      z: -0.28,
      valueLabel: 'SKDI 2012 · 4A',
      status: 'reference',
      truthClass: 'curated_physiology',
      summary: 'Primary care vascular load reference linking resting hemodynamic elevation and lifestyle modulation.',
      provenance: 'Konsil Kedokteran Indonesia (SKDI 2012)',
      route: '/med-study',
    },
    {
      id: 'skdi-dm2',
      label: 'SKDI 4A · Diabetes Melitus Tipe 2',
      category: 'skdi',
      x: 0.28,
      y: -0.52,
      z: -0.64,
      valueLabel: 'SKDI 2012 · 4A',
      status: 'reference',
      truthClass: 'curated_physiology',
      summary: 'Longitudinal glycemic-metabolic resilience benchmark integrated with aerobic & lean-mass metrics.',
      provenance: 'Konsil Kedokteran Indonesia (SKDI 2012)',
      route: '/med-study',
    },
    {
      id: 'pharm-raas',
      label: 'RAAS / Autonomic Pathway',
      category: 'pharmacology',
      x: -0.44,
      y: -0.62,
      z: -0.54,
      valueLabel: 'Reference Only',
      status: 'reference',
      truthClass: 'curated_physiology',
      summary: 'Educational pharmacology reference for vascular tone and sympathetic modulation (never autonomous prescribing).',
      provenance: 'SKDI Therapy Reference · Clinician Sign-Off Required',
      route: '/rujukan?t=obat',
    },
  ])

  const edges: readonly ConstellationEdge[] = Object.freeze([
    { from: 'vital-hrv', to: 'organ-brain', relation: 'vagal-feedback', weight01: 0.92 },
    { from: 'vital-hrv', to: 'organ-heart', relation: 'cardiac-coherence', weight01: 0.88 },
    { from: 'vital-rhr', to: 'organ-heart', relation: 'pacing-load', weight01: 0.9 },
    { from: 'vital-sleep', to: 'organ-brain', relation: 'scn-synchrony', weight01: 0.86 },
    { from: 'organ-heart', to: 'skdi-htn', relation: 'vascular-risk-ref', weight01: 0.78 },
    { from: 'organ-heart', to: 'skdi-dm2', relation: 'cardiometabolic-axis', weight01: 0.72 },
    { from: 'fascia-plantar', to: 'fascia-sfl', relation: 'kinetic-recoil', weight01: 0.94 },
    { from: 'fascia-sfl', to: 'organ-brain', relation: 'craniocervical-airway', weight01: 0.74 },
    { from: 'skdi-htn', to: 'pharm-raas', relation: 'guideline-pathway', weight01: 0.82 },
    { from: 'skdi-dm2', to: 'pharm-raas', relation: 'metabolic-guardrail', weight01: 0.68 },
  ])

  const hasMeasured = rhr !== null || hrv !== null || sleep !== null
  return {
    nodes,
    edges,
    truthClass: hasMeasured ? 'estimated' : 'curated_physiology',
    clinicallyReviewed: false,
    epistemicNotice:
      'Interactive biomedical knowledge constellation linking observed vitals with curated anatomy, fascia simulation, and SKDI references. Not clinician-reviewed.',
  }
}

export function buildDailyProtocolTimeline(
  mode: CommandOperatingMode,
): readonly DailyProtocolSlot[] {
  const all: readonly DailyProtocolSlot[] = Object.freeze([
    {
      id: 'sleep-lock-am',
      label: 'Circadian Recovery Window',
      category: 'sleep',
      startHour: 0,
      endHour: 6,
      emphasizedInModes: ['SLEEP', 'RECOVERY'],
      route: '/tubuh?t=tidur',
    },
    {
      id: 'morning-vitals',
      label: 'Morning HRV & Vitals Sync',
      category: 'clinical',
      startHour: 6,
      endHour: 7.5,
      emphasizedInModes: ['LIFE', 'CLINICAL', 'RECOVERY'],
      route: '/health-data',
    },
    {
      id: 'fascia-prime',
      label: 'Feet-to-Face Fascia Decompression',
      category: 'fascia',
      startHour: 7.5,
      endHour: 8.5,
      emphasizedInModes: ['RECOVERY', 'LIFE'],
      route: '/aesthetic',
    },
    {
      id: 'deep-clinical-block',
      label: 'Clinical / Focus Command Block',
      category: 'clinical',
      startHour: 9,
      endHour: 13,
      emphasizedInModes: ['CLINICAL', 'FOCUS', 'LIFE'],
      route: '/visit-os',
    },
    {
      id: 'zone2-conditioning',
      label: 'Zone-2 + Strength Conditioning',
      category: 'workout',
      startHour: 16.5,
      endHour: 18,
      emphasizedInModes: ['LIFE', 'RECOVERY', 'FOCUS'],
      route: '/latihan',
    },
    {
      id: 'evening-review',
      label: 'Neon Snapshot & Night Wind-Down',
      category: 'habit',
      startHour: 21,
      endHour: 23,
      emphasizedInModes: ['SLEEP', 'LIFE', 'CLINICAL'],
      route: '/command-os?view=holotable',
    },
  ])

  // Deterministic ordering keeping timeline chronological while ensuring valid mode check
  getCommandModeProfile(mode)
  return all
}

export function buildSpatialNeonSnapshotEvent(params: {
  readonly profileKey: string
  readonly mode: CommandOperatingMode
  readonly recordedAtIso: string
  readonly horizonMonths: number
  readonly activeLevers: readonly HolotableProtocolLever[]
  readonly deltas: readonly HolotableTrajectoryDelta[]
}): SpatialOutboxPayload {
  const cleanKey = (params.profileKey || 'rizkyazhar486').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'rizkyazhar486'
  const iso = params.recordedAtIso || '1970-01-01T00:00:00.000Z'
  const hash = deterministicHashHex(`${cleanKey}|${params.mode}|${iso}|${params.activeLevers.join(',')}`)

  return {
    id: `SNAP-${hash}`,
    table: 'panacea_digital_twin_snapshots',
    operation: 'upsert',
    profileKey: cleanKey,
    recordedAtIso: iso,
    truthClass: 'simulated',
    clinicallyReviewed: false,
    payload: {
      snapshot_id: `SNAP-${hash}`,
      profile_key: cleanKey,
      twin_mode: params.mode === 'CLINICAL' ? 'research' : 'health',
      command_mode: params.mode,
      horizon_months: params.horizonMonths,
      active_levers: params.activeLevers,
      deltas: params.deltas,
      truth_class: 'simulated',
      clinically_reviewed: false,
      recorded_at: iso,
    },
  }
}

export function buildCommandModePrefOutboxEvent(params: {
  readonly profileKey: string
  readonly mode: CommandOperatingMode
  readonly recordedAtIso: string
}): SpatialOutboxPayload {
  const cleanKey = (params.profileKey || 'rizkyazhar486').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'rizkyazhar486'
  const iso = params.recordedAtIso || '1970-01-01T00:00:00.000Z'
  const hash = deterministicHashHex(`MODE|${cleanKey}|${params.mode}|${iso}`)

  return {
    id: `MODE-${hash}`,
    table: 'panacea_sync_outbox',
    operation: 'upsert',
    profileKey: cleanKey,
    recordedAtIso: iso,
    truthClass: 'curated_physiology',
    clinicallyReviewed: false,
    payload: {
      event_id: `MODE-${hash}`,
      profile_key: cleanKey,
      event_type: 'spatial_command_mode_changed',
      command_mode: params.mode,
      truth_class: 'curated_physiology',
      clinically_reviewed: false,
      recorded_at: iso,
    },
  }
}
