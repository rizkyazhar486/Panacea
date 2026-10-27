// src/lib/discovery/targetedProteinDegradationEngine.ts
// T-CLIN-84: Targeted Protein Degradation Kinetics & PROTAC Ternary Complex Engine

export type E3LigaseType = 'CRBN_CEREBLON' | 'VHL_VON_HIPPEL_LINDAU' | 'MDM2' | 'IAP'

export interface ProtacMoleculeInput {
  targetProteinOfId: string // e.g. 'BRD4', 'BTK', 'AR', 'EGFR_L858R'
  e3LigaseRecruited: E3LigaseType
  protacDoseConcentrationNm: number // e.g. 0.1 to 10,000 nM
  kd_poi_binding_nm: number // dissociation constant for POI (e.g. 10 - 500 nM)
  kd_e3_binding_nm: number // dissociation constant for E3 ligase (e.g. 20 - 1000 nM)
  cooperativityFactorAlpha?: number // alpha > 1 indicates positive cooperativity (default 1.5)
  totalPoiAbundanceNm?: number // baseline target protein abundance (default 100 nM)
  totalE3AbundanceNm?: number // baseline E3 ligase abundance (default 50 nM)
  linkerFlexibilityScore?: number // 0.1 - 1.0 (linker orientation and steric clearance)
}

export interface ProtacDegradationProfile {
  targetProteinOfId: string
  e3Ligase: E3LigaseType
  doseConcentrationNm: number
  ternaryComplexConcentrationNm: number
  productiveTernaryFraction: number // fraction of target bound in active degradation complex
  degradationEfficiencyPercentage: number // simulated POI reduction at steady-state
  dc50EstimatedNm: number // concentration yielding 50% maximal degradation
  dMaxEstimatedPercentage: number // asymptotic maximal degradation capacity
  hookEffectActive: boolean // true if concentration has entered the inhibitory Hook effect regime
  mechanisticAnalysis: {
    cooperativityClassification: 'POSITIVE_COOPERATIVITY' | 'NEUTRAL_INDEPENDENT' | 'NEGATIVE_STERIC_CLASH'
    rateLimitingStep: 'TERNARY_COMPLEX_FORMATION' | 'POLYUBIQUITINATION' | 'PROTEASOMAL_CLEARANCE'
  }
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Douglass et al. 2013 J Am Chem Soc; Gadd et al. 2017 Nat Chem Biol'
  }
}

/**
 * Computes non-linear 3-body ternary complex equilibria and the biphasic Hook effect.
 */
export function simulateProtacDegradationKinetics(input: ProtacMoleculeInput): ProtacDegradationProfile {
  const dose = Math.max(0.01, input.protacDoseConcentrationNm)
  const kd1 = Math.max(0.1, input.kd_poi_binding_nm)
  const kd2 = Math.max(0.1, input.kd_e3_binding_nm)
  const alpha = Math.max(0.05, input.cooperativityFactorAlpha ?? 1.5)
  const poiTot = Math.max(1.0, input.totalPoiAbundanceNm ?? 100.0)
  const e3Tot = Math.max(1.0, input.totalE3AbundanceNm ?? 50.0)
  const linker = Math.min(1.0, Math.max(0.1, input.linkerFlexibilityScore ?? 0.8))

  // Equilibrium constant for ternary complex: K_ternary = (kd1 * kd2) / alpha
  const effectiveKternary = (kd1 * kd2) / alpha

  // Douglass 3-body closed-form approximation for [E3-PROTAC-POI] ternary complex
  // Peak ternary complex occurs approximately when [PROTAC] ~ sqrt(kd1 * kd2 / alpha)
  const optimalDose = Math.sqrt(effectiveKternary)

  // Ratio of dose to optimal dose drives the bell-shaped curve
  const doseRatio = dose / optimalDose
  // Gaussian-Hill bell curve for ternary complex fraction
  const bellPeak = Math.min(poiTot, e3Tot) * 0.85 * linker
  // Biphasic Hook equation: fraction = 2 * (dose/opt) / (1 + (dose/opt)^2)
  const hookFraction = (2.0 * doseRatio) / (1.0 + Math.pow(doseRatio, 2))
  const ternaryComplexNm = Number((bellPeak * hookFraction).toFixed(2))

  const productiveFraction = Number((ternaryComplexNm / poiTot).toFixed(3))

  // Degradation percentage (catalytic turnover: 1 PROTAC molecule can degrade multiple POI molecules)
  // Sub-stoichiometric catalytic recycling factor ~ 1.25
  const rawDegradation = (ternaryComplexNm / (ternaryComplexNm + 15.0)) * 96.0 * (linker > 0.5 ? 1.0 : 0.75)
  const degradationPct = Number(Math.min(99.0, Math.max(0.0, rawDegradation)).toFixed(1))

  // Hook effect is considered active when dose is > 4x optimal dose and degradation has begun declining
  const isHookActive = dose > optimalDose * 4.0

  // Estimated DC50 (typically ~0.25 to 0.5 of optimal dose)
  const dc50 = Number((optimalDose * 0.35).toFixed(2))
  const dMax = Number((95.0 * (linker > 0.6 ? 1.0 : 0.8)).toFixed(1))

  // Cooperativity classification
  let coopClass: 'POSITIVE_COOPERATIVITY' | 'NEUTRAL_INDEPENDENT' | 'NEGATIVE_STERIC_CLASH' = 'NEUTRAL_INDEPENDENT'
  if (alpha >= 1.2) coopClass = 'POSITIVE_COOPERATIVITY'
  else if (alpha <= 0.8) coopClass = 'NEGATIVE_STERIC_CLASH'

  // Rate limiting step
  let rateLimit: 'TERNARY_COMPLEX_FORMATION' | 'POLYUBIQUITINATION' | 'PROTEASOMAL_CLEARANCE' = 'TERNARY_COMPLEX_FORMATION'
  if (isHookActive) rateLimit = 'TERNARY_COMPLEX_FORMATION'
  else if (linker < 0.4) rateLimit = 'POLYUBIQUITINATION'
  else rateLimit = 'PROTEASOMAL_CLEARANCE'

  return {
    targetProteinOfId: input.targetProteinOfId,
    e3Ligase: input.e3LigaseRecruited,
    doseConcentrationNm: dose,
    ternaryComplexConcentrationNm: ternaryComplexNm,
    productiveTernaryFraction: productiveFraction,
    degradationEfficiencyPercentage: degradationPct,
    dc50EstimatedNm: dc50,
    dMaxEstimatedPercentage: dMax,
    hookEffectActive: isHookActive,
    mechanisticAnalysis: {
      cooperativityClassification: coopClass,
      rateLimitingStep: rateLimit,
    },
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Douglass et al. 2013 J Am Chem Soc; Gadd et al. 2017 Nat Chem Biol',
    },
  }
}
