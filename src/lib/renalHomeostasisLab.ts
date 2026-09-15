export interface RenalHomeostasisInputs {
  perfusionDrive: number
  filtrationCapacity: number
  sodiumReabsorption: number
  waterReabsorption: number
  raasDrive: number
  acidExcretion: number
}

export interface RenalHomeostasisOutputs {
  filtrationSignal: number
  sodiumRetentionSignal: number
  waterRetentionSignal: number
  volumeConservationSignal: number
  concentratingSignal: number
  acidBaseSupportSignal: number
  tubularWorkSignal: number
  homeostaticReserveSignal: number
  dominantAxis: 'filtration' | 'sodium-volume' | 'water-balance' | 'acid-base' | 'balanced'
}

export interface RenalTeachingEquation {
  expression: string
  label: string
  note: string
}

export interface RenalEvidenceRef {
  pmid: string
  title: string
  year: number
  url: string
  role: string
}

export const RENAL_HOMEOSTASIS_DEFAULTS: RenalHomeostasisInputs = {
  perfusionDrive: 0.62,
  filtrationCapacity: 0.72,
  sodiumReabsorption: 0.62,
  waterReabsorption: 0.58,
  raasDrive: 0.44,
  acidExcretion: 0.68,
}

export const RENAL_HOMEOSTASIS_BOUNDARY =
  'Normalized renal physiology teaching only. All controls and outputs are synthetic dimensionless signals; this lab does not calculate measured or estimated GFR, creatinine clearance, urine output, serum or urine electrolytes, osmolality, pH, bicarbonate, anion gap, fractional excretion, kidney-disease stage, volume status, dialysis need, fluid prescription, diuretic response, or patient-specific diagnosis or treatment.'

export const RENAL_TEACHING_EQUATIONS: readonly RenalTeachingEquation[] = [
  {
    expression: 'GFR ∝ Kf × net filtration pressure',
    label: 'Glomerular filtration concept',
    note: 'Directional teaching relationship only. No capillary pressure, oncotic pressure, Kf or patient GFR is entered or calculated.',
  },
  {
    expression: 'filtered load = GFR × plasma concentration',
    label: 'Filtered-load identity',
    note: 'Teaching identity showing that a filtered solute load depends on filtration and its plasma concentration; no patient concentration is modeled.',
  },
  {
    expression: 'excretion = filtration + secretion − reabsorption',
    label: 'Tubular mass-balance identity',
    note: 'Conceptual nephron bookkeeping only. It does not estimate urinary excretion of any specific solute.',
  },
  {
    expression: 'Cₓ = Uₓ × V / Pₓ',
    label: 'Renal clearance identity',
    note: 'Reference formula only. No urine concentration, plasma concentration or urine-flow value is accepted by this simulator.',
  },
  {
    expression: 'body Na⁺ content ↔ extracellular-volume regulation',
    label: 'Sodium-volume coupling',
    note: 'Systems concept only. Sodium and water regulation are related but not interchangeable; this model does not infer serum sodium concentration from total-body sodium handling.',
  },
] as const

export const RENAL_EVIDENCE: readonly RenalEvidenceRef[] = [
  {
    pmid: '40700075',
    title: 'Understanding Renal Tubular Function: Key Mechanisms, Clinical Relevance, and Comprehensive Urine Assessment.',
    year: 2025,
    url: 'https://pubmed.ncbi.nlm.nih.gov/40700075/',
    role: 'Recent review anchor for glomerular filtration plus tubular secretion/reabsorption and renal handling of water, electrolytes and acid-base physiology.',
  },
  {
    pmid: '40175029',
    title: 'Sodium and Water Disorders.',
    year: 2025,
    url: 'https://pubmed.ncbi.nlm.nih.gov/40175029/',
    role: 'Review anchor for renal sodium/water homeostasis and the coordinated roles of RAAS, sympathetic signaling, vasopressin, natriuretic peptides and aquaporin-mediated water handling.',
  },
  {
    pmid: '25502115',
    title: 'Salt feedback on the renin-angiotensin-aldosterone system.',
    year: 2015,
    url: 'https://pubmed.ncbi.nlm.nih.gov/25502115/',
    role: 'Physiology review anchor for RAAS as a salt/water and arterial-pressure control system, including renal salt sensing and renin feedback.',
  },
] as const

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function normalizeRenalHomeostasisInputs(inputs: Partial<RenalHomeostasisInputs> = {}): RenalHomeostasisInputs {
  return {
    perfusionDrive: clamp01(inputs.perfusionDrive ?? RENAL_HOMEOSTASIS_DEFAULTS.perfusionDrive),
    filtrationCapacity: clamp01(inputs.filtrationCapacity ?? RENAL_HOMEOSTASIS_DEFAULTS.filtrationCapacity),
    sodiumReabsorption: clamp01(inputs.sodiumReabsorption ?? RENAL_HOMEOSTASIS_DEFAULTS.sodiumReabsorption),
    waterReabsorption: clamp01(inputs.waterReabsorption ?? RENAL_HOMEOSTASIS_DEFAULTS.waterReabsorption),
    raasDrive: clamp01(inputs.raasDrive ?? RENAL_HOMEOSTASIS_DEFAULTS.raasDrive),
    acidExcretion: clamp01(inputs.acidExcretion ?? RENAL_HOMEOSTASIS_DEFAULTS.acidExcretion),
  }
}

function classifyDominantAxis(
  filtration: number,
  sodiumRetention: number,
  waterRetention: number,
  acidSupport: number,
): RenalHomeostasisOutputs['dominantAxis'] {
  const constraints = [
    ['filtration', 1 - filtration] as const,
    ['sodium-volume', Math.abs(sodiumRetention - 0.5) * 1.45] as const,
    ['water-balance', Math.abs(waterRetention - 0.5) * 1.45] as const,
    ['acid-base', 1 - acidSupport] as const,
  ]
  const [axis, severity] = constraints.reduce((highest, current) => current[1] > highest[1] ? current : highest)
  return severity < 0.34 ? 'balanced' : axis
}

export function deriveRenalHomeostasis(inputsLike: Partial<RenalHomeostasisInputs> = {}): RenalHomeostasisOutputs {
  const inputs = normalizeRenalHomeostasisInputs(inputsLike)

  const filtrationSignal = clamp01(
    0.08 + inputs.perfusionDrive * 0.46 + inputs.filtrationCapacity * 0.46,
  )
  const sodiumRetentionSignal = clamp01(
    0.08 + inputs.sodiumReabsorption * 0.58 + inputs.raasDrive * 0.34,
  )
  const waterRetentionSignal = clamp01(
    0.10 + inputs.waterReabsorption * 0.62 + inputs.raasDrive * 0.18 + sodiumRetentionSignal * 0.10,
  )
  const volumeConservationSignal = clamp01(
    sodiumRetentionSignal * 0.52 + waterRetentionSignal * 0.48,
  )
  const concentratingSignal = clamp01(
    0.12 + inputs.waterReabsorption * 0.60 + sodiumRetentionSignal * 0.18 + inputs.raasDrive * 0.10,
  )
  const acidBaseSupportSignal = clamp01(
    0.12 + inputs.acidExcretion * 0.68 + filtrationSignal * 0.20,
  )
  const tubularWorkSignal = clamp01(
    filtrationSignal * 0.30 + sodiumRetentionSignal * 0.34 + waterRetentionSignal * 0.20 + inputs.acidExcretion * 0.16,
  )
  const homeostaticReserveSignal = clamp01(
    filtrationSignal * 0.34 + acidBaseSupportSignal * 0.24 +
    (1 - Math.abs(volumeConservationSignal - 0.58)) * 0.26 +
    (1 - Math.abs(concentratingSignal - 0.58)) * 0.16,
  )

  return {
    filtrationSignal,
    sodiumRetentionSignal,
    waterRetentionSignal,
    volumeConservationSignal,
    concentratingSignal,
    acidBaseSupportSignal,
    tubularWorkSignal,
    homeostaticReserveSignal,
    dominantAxis: classifyDominantAxis(filtrationSignal, sodiumRetentionSignal, waterRetentionSignal, acidBaseSupportSignal),
  }
}

export function renalPercent(value: number): number {
  return Math.round(clamp01(value) * 100)
}
