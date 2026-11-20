// src/lib/discovery/hscQuiescenceNicheCxcl12Engine.ts
// T-CLIN-127: Hematopoietic Stem Cell (HSC) Quiescence, Endosteal Niche CXCL12-CXCR4 & Thrombopoietin Engine

export interface HscNicheInput {
  boneMarrowCxcl12ConcentrationNgMl?: number // normal niche 15 - 35 ng/mL
  hscCxcr4ReceptorDensityRatio: number // normal 1.0; downregulated in mobilization < 0.25
  thrombopoietinTpoSignalingRatio?: number // normal 1.0 (maintains p57Kip2 dormancy)
  boneMarrowHypoxicNichePo2MmHg?: number // physiological hypoxia: 10 - 25 mmHg
  plerixaforAmd3100ConcentrationUm?: number // CXCR4 mobilization antagonist (0 to 10 uM)
  proInflammatoryInterferonDrive?: boolean // IFN-alpha/gamma forces HSCs into cycle
}

export interface HscQuiescenceEvaluation {
  nicheRetentionAnchoringScore: number // 0.0 - 1.0 (CXCL12-CXCR4 adhesion)
  g0QuiescentFractionPercentage: number // normal > 85% of LT-HSCs in G0
  p57Kip2CyclinInhibitorExpressionIndex: number // 0.0 - 1.0 (dormancy marker)
  peripheralBloodCd34MobilizationYieldPerHour: number // mobilized stem cells per uL blood
  hscLongTermSelfRenewalCapacityStatus: 'PRESERVED_LONG_TERM_DORMANCY' | 'TRANSIENT_PROLIFERATIVE_EXPANSION' | 'EXHAUSTED_STEM_CELL_COLLAPSE'
  plerixaforMobilizationFoldIncrease: number
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Sugiyama et al. 2006 Immunity; Qian et al. 2007 Cell Stem Cell; Morrison & Scadden 2014 Nature'
  }
}

/**
 * Simulates hematopoietic stem cell CXCL12-CXCR4 niche retention, TPO-p57Kip2 quiescence, Plerixafor mobilization, and stem cell exhaustion.
 */
export function evaluateHscQuiescenceDynamics(input: HscNicheInput): HscQuiescenceEvaluation {
  const cxcl12 = Math.min(50, Math.max(2, input.boneMarrowCxcl12ConcentrationNgMl ?? 25))
  const cxcr4 = Math.min(1.5, Math.max(0.05, input.hscCxcr4ReceptorDensityRatio))
  const tpo = Math.min(1.5, Math.max(0.05, input.thrombopoietinTpoSignalingRatio ?? 1.0))
  const po2 = Math.min(80, Math.max(5, input.boneMarrowHypoxicNichePo2MmHg ?? 18))
  const amd3100 = Math.max(0.0, input.plerixaforAmd3100ConcentrationUm ?? 0.0)
  const isIfn = input.proInflammatoryInterferonDrive ?? false

  // Plerixafor / AMD3100 competitive antagonism of CXCR4 (IC50 ~ 0.5 uM)
  const amdBlock = amd3100 > 0.0 ? 1.0 / (1.0 + amd3100 / 0.5) : 1.0
  const effectiveCxcr4 = cxcr4 * amdBlock

  // Niche retention score: dependent on CXCL12-CXCR4 binding and hypoxia
  const hypoxiaFactor = po2 <= 25 ? 1.0 : Math.max(0.5, 1.0 - (po2 - 25) / 50.0)
  const retentionScore = Number((Math.min(1.0, Math.max(0.02, (cxcl12 / 25.0) * effectiveCxcr4 * hypoxiaFactor * 0.95))).toFixed(3))

  // p57Kip2 (CDKN1C) CDK inhibitor: driven by TPO/c-Mpl signaling and hypoxia
  const p57Index = Number((Math.min(1.0, Math.max(0.05, (tpo / 1.0) * 0.95 * hypoxiaFactor * (isIfn ? 0.35 : 1.0)))).toFixed(3))

  // G0 Quiescent fraction %: > 85% in pristine LT-HSCs; drops if IFN or TPO loss forces into cycle
  const baseG0 = 92.0
  const g0Pct = Number((Math.min(98.0, Math.max(10.0, baseG0 * (retentionScore * 0.5 + p57Index * 0.5)))).toFixed(1))

  // Peripheral blood CD34+ cell mobilization yield (cells/uL)
  // Loss of retention (e.g. by Plerixafor) drives rapid egress into sinusoids
  const baseYield = 4.0 // basal circulating CD34+ per uL
  const mobilizationFold = Number((Math.max(1.0, 1.0 + (1.0 - retentionScore) * 12.0 + (amd3100 > 0 ? 8.5 : 0.0))).toFixed(1))
  const cd34Yield = Number((baseYield * mobilizationFold).toFixed(1))

  // Stem cell status classification
  let status: 'PRESERVED_LONG_TERM_DORMANCY' | 'TRANSIENT_PROLIFERATIVE_EXPANSION' | 'EXHAUSTED_STEM_CELL_COLLAPSE' = 'PRESERVED_LONG_TERM_DORMANCY'
  if (g0Pct < 30.0 || (isIfn && p57Index < 0.25)) {
    status = 'EXHAUSTED_STEM_CELL_COLLAPSE'
  } else if (g0Pct < 70.0 || retentionScore < 0.45) {
    status = 'TRANSIENT_PROLIFERATIVE_EXPANSION'
  } else {
    status = 'PRESERVED_LONG_TERM_DORMANCY'
  }

  return {
    nicheRetentionAnchoringScore: retentionScore,
    g0QuiescentFractionPercentage: g0Pct,
    p57Kip2CyclinInhibitorExpressionIndex: p57Index,
    peripheralBloodCd34MobilizationYieldPerHour: cd34Yield,
    hscLongTermSelfRenewalCapacityStatus: status,
    plerixaforMobilizationFoldIncrease: mobilizationFold,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Sugiyama et al. 2006 Immunity; Qian et al. 2007 Cell Stem Cell; Morrison & Scadden 2014 Nature',
    },
  }
}
