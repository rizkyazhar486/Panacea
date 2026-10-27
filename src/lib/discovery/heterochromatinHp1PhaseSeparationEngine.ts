// src/lib/discovery/heterochromatinHp1PhaseSeparationEngine.ts
// T-CLIN-116: Epigenetic Heterochromatin HP1-H3K9me3 Phase Separation & Telomeric Epigenome Erosion Engine

export interface HeterochromatinCondensationInput {
  h3k9me3HistoneMarkDensityRatio: number // normal ~1.0; age-eroded < 0.40
  hp1AlphaCbx5AbundanceRatio: number // normal 1.0; senescent < 0.35
  nuclearProgerinAccumulationIndex?: number // 0.0 to 1.0 (accelerates heterochromatin loss)
  suv39h1MethyltransferaseActivityRatio?: number // normal 1.0
  pericentromericSatelliteRnaTranscriptionNormalized?: number // 0.1 to 10.0 (marker of decondensation)
  heterochromatinStabilizerPresent?: boolean // e.g. HDAC activator or SUV39H1 agonist
}

export interface HeterochromatinCondensationEvaluation {
  heterochromatinCondensateVolumeFraction: number // fraction of nuclear volume in dense phase (0.05 to 0.35)
  hp1PhaseSeparationPropensityScore: number // 0.0 - 1.0 (LLPS condensation capacity)
  pericentromericSilencingClassification: 'ROBUST_CONSTITUTIVE_SILENCING' | 'PERMISSIVE_SUBTELOMERIC_EROSION' | 'COLLAPSED_HETEROCHROMATIN_ANARCHY'
  satelliteRepeatDerepressionFold: number // fold elevation in non-coding satellite transcripts
  cgasStingInflammatoryAxisPrimingIndex: number // 0.0 - 1.0 (cytoplasmic chromatin fragment sensing)
  epigenomicStructuralResiliencePercentage: number // 0% - 100%
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Larson et al. 2017 Nature; Strom et al. 2017 Nature; Villeponteau 1997 Exp Gerontol'
  }
}

/**
 * Simulates HP1alpha-H3K9me3 phase separation, pericentromeric satellite silencing, and age-associated heterochromatin erosion.
 */
export function evaluateHeterochromatinCondensationDynamics(
  input: HeterochromatinCondensationInput
): HeterochromatinCondensationEvaluation {
  const h3k9 = Math.min(1.5, Math.max(0.05, input.h3k9me3HistoneMarkDensityRatio))
  const hp1 = Math.min(1.5, Math.max(0.05, input.hp1AlphaCbx5AbundanceRatio))
  const progerin = Math.min(1.0, Math.max(0.0, input.nuclearProgerinAccumulationIndex ?? 0.0))
  const suv = Math.min(1.5, Math.max(0.05, input.suv39h1MethyltransferaseActivityRatio ?? 1.0))
  const hasStabilizer = input.heterochromatinStabilizerPresent ?? false

  // Progerin accelerates loss of H3K9me3 and disrupts the lamina-heterochromatin anchoring
  const progerinErosionPenalty = 1.0 - progerin * 0.65
  const stabilizerBonus = hasStabilizer ? 0.30 : 0.0

  // Effective H3K9me3 and HP1 binding affinity
  const effectiveMark = Math.max(0.05, (h3k9 * 0.6 + suv * 0.4) * progerinErosionPenalty + stabilizerBonus)
  const effectiveHp1 = Math.max(0.05, hp1 * progerinErosionPenalty + stabilizerBonus * 0.5)

  // LLPS Condensation Propensity: cooperative product of H3K9me3 binding and HP1 oligomerization
  const propensity = Number((Math.min(1.0, Math.max(0.02, effectiveMark * effectiveHp1 * 0.95))).toFixed(3))

  // Condensate volume fraction (normal eukaryotic nucleus is ~ 15-25% dense heterochromatin)
  const volumeFraction = Number((Math.min(0.35, Math.max(0.02, 0.04 + propensity * 0.22))).toFixed(3))

  // Pericentromeric silencing classification
  let silencing: 'ROBUST_CONSTITUTIVE_SILENCING' | 'PERMISSIVE_SUBTELOMERIC_EROSION' | 'COLLAPSED_HETEROCHROMATIN_ANARCHY' = 'ROBUST_CONSTITUTIVE_SILENCING'
  if (propensity < 0.25) {
    silencing = 'COLLAPSED_HETEROCHROMATIN_ANARCHY'
  } else if (propensity < 0.55) {
    silencing = 'PERMISSIVE_SUBTELOMERIC_EROSION'
  } else {
    silencing = 'ROBUST_CONSTITUTIVE_SILENCING'
  }

  // Satellite repeat derepression fold (HSATII / alpha-satellites can elevate > 20-fold when heterochromatin dissolves)
  const baseSatelliteFold = 1.0
  const derepressedFold = Number((Math.max(1.0, baseSatelliteFold + Math.pow(Math.max(0.0, 1.0 - propensity), 2.2) * 28.0)).toFixed(2))

  // cGAS-STING axis priming: decondensed chromatin is prone to blebbing into micronuclei, activating cGAS
  const cgasPriming = Number((Math.min(1.0, Math.max(0.01, (1.0 - propensity) * 0.85 + progerin * 0.35))).toFixed(3))

  // Epigenomic structural resilience %
  const resiliencePct = Number((propensity * 100.0).toFixed(1))

  return {
    heterochromatinCondensateVolumeFraction: volumeFraction,
    hp1PhaseSeparationPropensityScore: propensity,
    pericentromericSilencingClassification: silencing,
    satelliteRepeatDerepressionFold: derepressedFold,
    cgasStingInflammatoryAxisPrimingIndex: cgasPriming,
    epigenomicStructuralResiliencePercentage: resiliencePct,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Larson et al. 2017 Nature; Strom et al. 2017 Nature; Villeponteau 1997 Exp Gerontol',
    },
  }
}
