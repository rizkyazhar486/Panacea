/**
 * Pure deterministic domain engine for PanaceaMed's 5 Athletic & Holistic
 * Recovery Modalities (HBOT, Whole-Body Cryotherapy, Red Light/PBM,
 * X-Tone Electromagnetic MMS, X-Cryo Localized Cryotherapy), pre/post
 * Local session parameter tracker, pre/post biomarker delta calculator, and
 * non-financial session log helper (`clinicallyReviewed: false`).
 * Not a clinical dosing engine and not a Visa/EMV payment clearinghouse.
 *
 * Evidence & clinical boundary:
 * - Reference dose ranges represent investigational / sports-physiology literature
 *   bounds, not individualized medical prescriptions (`clinicallyReviewed: false`).
 * - Biomarker deltas are computed strictly from user/device-recorded values;
 *   unrecorded channels remain `null` and are never fabricated.
 */

export type RecoveryModalityId =
  | 'hbot'
  | 'whole_body_cryo'
  | 'red_light_pbm'
  | 'x_tone'
  | 'x_cryo'

export type RecoveryPerspective = 'athlete' | 'coach' | 'doctor' | 'scientist'

export interface ModalityProtocolSpec {
  readonly id: RecoveryModalityId
  readonly shortName: string
  readonly title: string
  readonly badge: string
  readonly defaultDoseSummary: string
  readonly physiologyMechanism: string
  readonly postRunCorrelation: string
  readonly perspectives: Readonly<Record<RecoveryPerspective, string>>
  readonly contraindications: readonly string[]
  readonly referenceBounds: {
    readonly durationMin: readonly [number, number]
    readonly primaryLabel: string
    readonly primaryUnit: string
    readonly primaryRange: readonly [number, number]
    readonly secondaryLabel?: string
    readonly secondaryUnit?: string
    readonly secondaryRange?: readonly [number, number]
  }
}

export const HOLISTIC_RECOVERY_MODALITIES: readonly ModalityProtocolSpec[] = Object.freeze([
  {
    id: 'hbot',
    shortName: 'HBOT',
    title: 'Hyperbaric Oxygen Chamber (HBOT)',
    badge: 'PRESSURE & PLASMA O₂',
    defaultDoseSummary: '1.5–2.0 ATA · FiO₂ 1.00 · 60–90 min',
    physiologyMechanism:
      'Henry’s Law elevates physically dissolved plasma oxygen proportionally to pressure (ATA × FiO₂), widening O₂ diffusion gradients across transiently edematous skeletal muscle capillaries after high-strain running.',
    postRunCorrelation:
      'Used post-long-run when capillary micro-edema & soreness persist; monitor resting HR, SpO₂, and morning RMSSD HRV normalization.',
    perspectives: {
      athlete: 'Helps clear post-marathon heavy legs faster; equalize ears gently during pressurization and hydrate well beforehand.',
      coach: 'Schedule >3–4 h after peak glycolytic sessions if preserving natural hypoxic training adaptation; ideal during tournament/taper recovery.',
      doctor: 'Clinical hyperbaric (>1.5 ATA, 100% O₂) mandates barotrauma ear/sinus screening and clearance for pulmonary blebs or bleomycin exposure.',
      scientist: 'Inspired alveolar PO₂ ≈ (ATA × 760 − 47) × FiO₂ mmHg; shifts HIF-1α/VEGF signaling and mitochondrial Complex IV electron throughput.',
    },
    contraindications: ['Untreated pneumothorax (absolute)', 'Active sinus/middle-ear block', 'Uncontrolled claustrophobia', 'Recent thoracic surgery or bleomycin therapy'],
    referenceBounds: {
      durationMin: [30, 90],
      primaryLabel: 'Chamber Pressure',
      primaryUnit: 'ATA',
      primaryRange: [1.3, 2.4],
      secondaryLabel: 'Inspired O₂ (FiO₂ %)',
      secondaryUnit: '%',
      secondaryRange: [21, 100],
    },
  },
  {
    id: 'whole_body_cryo',
    shortName: 'Whole-Body Cryo',
    title: 'Whole-Body Cryotherapy (WBC)',
    badge: 'AUTONOMIC VAGAL REBOUND',
    defaultDoseSummary: '-110 to -160 °C · 2.0–3.5 min',
    physiologyMechanism:
      'Brief whole-body dry cryogenic air triggers intense cutaneous cold thermoreceptor firing -> α-adrenergic peripheral vasoconstriction -> baroreceptor-driven post-exit parasympathetic vagal rebound (RMSSD HRV surge).',
    postRunCorrelation:
      'Tracks acute norepinephrine/autonomic tone modulation and attenuation of DOMS perception; avoid directly after hypertrophy sessions where inflammation drives adaptation.',
    perspectives: {
      athlete: 'Dry cold chamber for 2–3 minutes with gloves, socks, and dry skin to calm heavy fatigue and boost alertness/sleep onset.',
      coach: 'Prioritize during congested race calendars for rapid soreness modulation; separate from strength-hypertrophy blocks.',
      doctor: 'Strict ≤3.5 min ceiling; screen for uncontrolled hypertension, Raynaud’s phenomenon, cold agglutinins, or unstable CAD.',
      scientist: 'Brief cutaneous shell gradient (-110 °C air) evokes reflexive sympathetic vasoconstriction followed by vagal overshoot without core hypothermia.',
    },
    contraindications: ['Uncontrolled hypertension (>160/100 mmHg)', 'Raynaud’s phenomenon or cold urticaria', 'Unstable angina / arrhythmia', 'Open wet wounds'],
    referenceBounds: {
      durationMin: [1.5, 3.5],
      primaryLabel: 'Chamber Temp',
      primaryUnit: '°C',
      primaryRange: [-160, -100],
    },
  },
  {
    id: 'red_light_pbm',
    shortName: 'Red Light / PBM',
    title: 'Red Light Therapy & Photobiomodulation (PBM)',
    badge: 'MITOCHONDRIAL COMPLEX IV',
    defaultDoseSummary: '660nm / 850nm · 50–100 mW/cm² · 10–15 min',
    physiologyMechanism:
      'Red (660 nm) and near-infrared (850 nm) photons are absorbed by mitochondrial Cytochrome c Oxidase (Complex IV), photodissociating inhibitory nitric oxide to restore ATP synthesis and redox signaling.',
    postRunCorrelation:
      'Arndt-Schulz biphasic dose window targets 4–40 J/cm² over quadriceps, hamstrings, or tendons before or immediately after strenuous blocks.',
    perspectives: {
      athlete: '10–15 min warm, painless light exposure over sore quads/calves; wear eye shields when facing bright panels.',
      coach: 'Non-blunting mitochondrial recovery support compatible with hypertrophy and endurance adaptation blocks.',
      doctor: 'Verify patient is not on photosensitizing drugs (tetracyclines, amiodarone, isotretinoin) and avoid active neoplastic sites.',
      scientist: 'Fluence J/cm² = (Irradiance mW/cm² × Seconds) / 1000; tissue penetration scales ~2–4 cm at 810–850 nm NIR window.',
    },
    contraindications: ['Photosensitizing medications', 'Direct retina exposure without shields', 'Active malignancy over target field', 'Acute hemorrhage'],
    referenceBounds: {
      durationMin: [5, 25],
      primaryLabel: 'Irradiance',
      primaryUnit: 'mW/cm²',
      primaryRange: [20, 150],
      secondaryLabel: 'Dual Wavelength Ratio (NIR)',
      secondaryUnit: 'nm',
      secondaryRange: [810, 850],
    },
  },
  {
    id: 'x_tone',
    shortName: 'X-Tone MMS',
    title: 'X-Tone Electromagnetic Muscle Stimulation (MMS)',
    badge: 'NEUROMUSCULAR RECRUITMENT',
    defaultDoseSummary: '20–65 Hz · 1.0–2.2 Tesla · 20–30 min',
    physiologyMechanism:
      'High-intensity pulsed magnetic flux induces Eddy currents directly depolarizing alpha-motor neurons across deep muscle bellies (glutes, core, quads) to drive venous/lymphatic flush or supramaximal neuromuscular readiness without joint shear.',
    postRunCorrelation:
      'Low frequency (10–25 Hz) promotes rhythmic muscle-pump recovery; higher tetanic bursts (50–75 Hz) maintain neuromuscular firing while sparing fatigued joints.',
    perspectives: {
      athlete: 'Hands-free muscle contractions through clothes to flush heavy legs (recovery mode) or prime glutes/core without impact stress.',
      coach: 'Use 15–25 Hz vasomotor flush post-race; save 50–80 Hz high-Tesla bursts for days >48 h clear of key sprints.',
      doctor: 'Absolute exclusion near cardiac pacemakers/ICDs, metallic orthopedic hardware directly under coil, intrauterine copper coils, or active DVT.',
      scientist: 'dB/dt induced electric field triggers motor axon action potentials above rheobase independent of CNS descending drive.',
    },
    contraindications: ['Cardiac pacemaker / ICD / neurostimulator (absolute)', 'Metallic implants in coil zone', 'Pregnancy / suspected DVT', 'History of epilepsy'],
    referenceBounds: {
      durationMin: [15, 35],
      primaryLabel: 'Pulse Frequency',
      primaryUnit: 'Hz',
      primaryRange: [10, 100],
      secondaryLabel: 'Magnetic Flux Density',
      secondaryUnit: 'Tesla',
      secondaryRange: [0.5, 2.5],
    },
  },
  {
    id: 'x_cryo',
    shortName: 'X-Cryo Local',
    title: 'X-Cryo Localized Precision Cryotherapy',
    badge: 'FOCAL JOINT & TENDON COOLING',
    defaultDoseSummary: '-25 to -30 °C airstream · 3–5 min per joint',
    physiologyMechanism:
      'Targeted sub-zero compressed air cools superficial articular capsules, Achilles/patellar tendons, and trigger points — slowing nociceptive C/Aδ nerve conduction velocity and attenuating localized effusion.',
    postRunCorrelation:
      'Enables focal ankle/knee analgesia and edema control right after track intervals without systemically blunting muscle adaptation across uncooled limbs.',
    perspectives: {
      athlete: 'Quick 3–5 minute targeted cooling sweep over an aching knee, shin splint, or Achilles right after a hard run.',
      coach: 'Prefer X-Cryo over systemic ice baths after strength-focused days to control joint irritation while preserving whole-body adaptation.',
      doctor: 'Maintain continuous sweeping nozzle motion and monitor skin ≥5 °C to prevent cryogenic frostbite or superficial peroneal nerve palsy.',
      scientist: 'Local skin cooling (~10–14 °C subdermal target) drops nerve conduction ~1–2 m/s per °C and slows focal enzymatic collagenase activity.',
    },
    contraindications: ['Sensory neuropathy over site', 'Peripheral arterial ischemia', 'Cold allergy / cryoglobulinemia', 'Stationary skin contact'],
    referenceBounds: {
      durationMin: [2, 7],
      primaryLabel: 'Airstream Temp',
      primaryUnit: '°C',
      primaryRange: [-35, -15],
    },
  },
])

export function computeHbotInspiredPo2MmHg(pressureAta: number, fio2Ratio: number): number {
  const ata = Math.max(1.0, Math.min(3.0, Number.isFinite(pressureAta) ? pressureAta : 1.5))
  const fio2 = Math.max(0.21, Math.min(1.0, Number.isFinite(fio2Ratio) ? fio2Ratio : 1.0))
  return Math.round((ata * 760 - 47) * fio2)
}

export function computePbmFluenceJcm2(irradianceMwCm2: number, durationSec: number): number {
  if (!Number.isFinite(irradianceMwCm2) || !Number.isFinite(durationSec) || irradianceMwCm2 <= 0 || durationSec <= 0) return 0
  return Number(((irradianceMwCm2 * durationSec) / 1000).toFixed(1))
}

export interface RecoveryBiomarkers {
  readonly hrvMs?: number | null
  readonly restingHr?: number | null
  readonly spo2Pct?: number | null
  readonly vo2max?: number | null
  readonly sleepH?: number | null
  readonly lactateMmolL?: number | null
}

export interface RecoveryCorrelationInput {
  readonly modalityId: RecoveryModalityId
  readonly durationMin: number
  readonly primaryValue: number
  readonly secondaryValue?: number
  readonly anatomicalSite?: string
  readonly pre: RecoveryBiomarkers
  readonly post: RecoveryBiomarkers
  readonly linkedWorkoutLabel?: string
}

export interface RecoveryCorrelationResult {
  readonly deltaHrvMs: number | null
  readonly deltaRestingHr: number | null
  readonly deltaSpo2Pct: number | null
  readonly deltaLactateMmolL: number | null
  readonly parameterSummary: string
  readonly boundsStatus: 'within_reference_range' | 'caution_upper_bound'
  /** @deprecated Display alias retained for compatibility; not a clinical dose prescription. */
  readonly computedDoseLabel: string
  /** @deprecated Display alias retained for compatibility; use `boundsStatus`. */
  readonly doseCheckStatus: 'within_reference_range' | 'caution_upper_bound'
  readonly warnings: readonly string[]
  readonly summary: string
  readonly truthClass: 'recorded_delta' | 'protocol_reference'
  readonly clinicallyReviewed: false
}

export function analyzePrePostRecovery(input: RecoveryCorrelationInput): RecoveryCorrelationResult {
  const spec = HOLISTIC_RECOVERY_MODALITIES.find((m) => m.id === input.modalityId) ?? HOLISTIC_RECOVERY_MODALITIES[0]
  const warnings: string[] = []

  const [minDur, maxDur] = spec.referenceBounds.durationMin
  if (input.durationMin < minDur || input.durationMin > maxDur) {
    warnings.push(`Duration ${input.durationMin} min sits outside reference range (${minDur}–${maxDur} min).`)
  }
  const [minP, maxP] = spec.referenceBounds.primaryRange
  if (input.primaryValue < minP || input.primaryValue > maxP) {
    warnings.push(`${spec.referenceBounds.primaryLabel} ${input.primaryValue} ${spec.referenceBounds.primaryUnit} sits outside reference bounds (${minP}–${maxP}).`)
  }

  let parameterSummary = `${input.primaryValue} ${spec.referenceBounds.primaryUnit} · ${input.durationMin} min`
  if (input.modalityId === 'hbot') {
    const fio2Pct = input.secondaryValue ?? 100
    const po2 = computeHbotInspiredPo2MmHg(input.primaryValue, fio2Pct / 100)
    parameterSummary = `${input.primaryValue} ATA · FiO₂ ${fio2Pct}% (~${po2} mmHg PiO₂) · ${input.durationMin} min`
  } else if (input.modalityId === 'red_light_pbm') {
    const fluence = computePbmFluenceJcm2(input.primaryValue, input.durationMin * 60)
    parameterSummary = `${fluence} J/cm² @ ${input.primaryValue} mW/cm² (660/${input.secondaryValue ?? 850}nm) · ${input.durationMin} min`
    if (fluence > 60) warnings.push(`Calculated energy density ${fluence} J/cm² exceeds typical biphasic muscle range (4–40 J/cm²).`)
  } else if (input.modalityId === 'x_tone') {
    parameterSummary = `${input.primaryValue} Hz · ${input.secondaryValue ?? 1.5} T · ${input.durationMin} min`
  } else if (input.modalityId === 'x_cryo' && input.anatomicalSite) {
    parameterSummary = `${input.anatomicalSite} · ${input.primaryValue} °C · ${input.durationMin} min`
  }

  const diff = (a?: number | null, b?: number | null) =>
    typeof a === 'number' && Number.isFinite(a) && typeof b === 'number' && Number.isFinite(b)
      ? Number((b - a).toFixed(1))
      : null

  const deltaHrvMs = diff(input.pre.hrvMs, input.post.hrvMs)
  const deltaRestingHr = diff(input.pre.restingHr, input.post.restingHr)
  const deltaSpo2Pct = diff(input.pre.spo2Pct, input.post.spo2Pct)
  const deltaLactateMmolL = diff(input.pre.lactateMmolL, input.post.lactateMmolL)

  const hasRecordedDelta =
    deltaHrvMs !== null || deltaRestingHr !== null || deltaSpo2Pct !== null || deltaLactateMmolL !== null

  const deltaParts: string[] = []
  if (deltaHrvMs !== null) deltaParts.push(`ΔHRV ${deltaHrvMs >= 0 ? '+' : ''}${deltaHrvMs} ms`)
  if (deltaRestingHr !== null) deltaParts.push(`ΔRHR ${deltaRestingHr >= 0 ? '+' : ''}${deltaRestingHr} bpm`)
  if (deltaSpo2Pct !== null) deltaParts.push(`ΔSpO₂ ${deltaSpo2Pct >= 0 ? '+' : ''}${deltaSpo2Pct}%`)
  if (deltaLactateMmolL !== null) deltaParts.push(`ΔLactate ${deltaLactateMmolL >= 0 ? '+' : ''}${deltaLactateMmolL} mmol/L`)

  const boundsStatus = warnings.length > 0 ? 'caution_upper_bound' : 'within_reference_range'
  const summary = hasRecordedDelta
    ? `${spec.shortName} logged (${parameterSummary}): ${deltaParts.join(' · ')}.${input.linkedWorkoutLabel ? ` Linked workout: ${input.linkedWorkoutLabel}.` : ''}`
    : `${spec.shortName} parameters within reference range (${parameterSummary}). Record pre/post biometrics to quantify recovery deltas.`

  return {
    deltaHrvMs,
    deltaRestingHr,
    deltaSpo2Pct,
    deltaLactateMmolL,
    parameterSummary,
    boundsStatus,
    computedDoseLabel: parameterSummary,
    doseCheckStatus: boundsStatus,
    warnings,
    summary,
    truthClass: hasRecordedDelta ? 'recorded_delta' : 'protocol_reference',
    clinicallyReviewed: false,
  }
}

export interface RecoveryLedgerTransaction {
  readonly id: string
  readonly at: string
  readonly modalityId: RecoveryModalityId
  readonly modalityName: string
  readonly parameterSummary: string
  readonly sessionDigest: string
  /** @deprecated Storage compatibility alias; self-logged parameter summary only. */
  readonly doseLabel: string
  readonly deltaSummary: string
  readonly linkedWorkout?: string
  readonly biometricSource?: string
  /** @deprecated Storage compatibility alias; non-financial local session digest (not Visa/EMV). */
  readonly emvReceiptToken: string
  /** @deprecated Internal check-digit invariant flag (non-payment). */
  readonly luhnCheckValid: boolean
  readonly pre: RecoveryBiomarkers
  readonly post: RecoveryBiomarkers
  readonly clinicallyReviewed: false
}

function luhnCheckDigit(num15: string): string {
  let sum = 0
  let dbl = true
  for (let i = num15.length - 1; i >= 0; i -= 1) {
    let d = Number(num15[i])
    if (dbl) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    dbl = !dbl
  }
  return String((10 - (sum % 10)) % 10)
}

export function verifyLuhnNumber(fullDigits: string): boolean {
  if (!/^\d{16}$/.test(fullDigits)) return false
  let sum = 0
  let dbl = false
  for (let i = fullDigits.length - 1; i >= 0; i -= 1) {
    let d = Number(fullDigits[i])
    if (dbl) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    dbl = !dbl
  }
  return sum % 10 === 0
}

export function createRecoveryLedgerTransaction(
  accountId: string,
  input: RecoveryCorrelationInput,
  correlation: RecoveryCorrelationResult,
  atIso: string,
  biometricSource?: string,
): RecoveryLedgerTransaction {
  const spec = HOLISTIC_RECOVERY_MODALITIES.find((m) => m.id === input.modalityId) ?? HOLISTIC_RECOVERY_MODALITIES[0]
  let h = 2166136261 >>> 0
  const seed = `${accountId}|${input.modalityId}|${atIso}|${correlation.parameterSummary}`
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0
  }
  // Private internal check-digit prefix (990010, non-card-network) for local record integrity.
  const body15 = `990010${String(h % 1_000_000_000).padStart(9, '0')}`
  const checkId16 = `${body15}${luhnCheckDigit(body15)}`
  const sessionDigest = `LOG-${h.toString(16).toUpperCase().padStart(8, '0')}`

  return {
    id: `TRX-REC-${h.toString(16).toUpperCase().padStart(8, '0')}`,
    at: atIso,
    modalityId: input.modalityId,
    modalityName: spec.shortName,
    parameterSummary: correlation.parameterSummary,
    sessionDigest,
    doseLabel: correlation.parameterSummary,
    deltaSummary: correlation.summary,
    linkedWorkout: input.linkedWorkoutLabel,
    biometricSource: biometricSource || undefined,
    emvReceiptToken: sessionDigest,
    luhnCheckValid: verifyLuhnNumber(checkId16),
    pre: input.pre,
    post: input.post,
    clinicallyReviewed: false,
  }
}
