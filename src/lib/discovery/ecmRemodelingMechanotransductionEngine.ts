// src/lib/discovery/ecmRemodelingMechanotransductionEngine.ts
// T-CLIN-94: Extracellular Matrix (ECM) Remodeling, Lysyl Oxidase (LOX) & Mechanotransduction Engine

export interface EcmTissueInput {
  tissueType: 'HEPATIC_STROMA' | 'PULMONARY_INTERSTITIUM' | 'CARDIAC_MYOCARDIUM' | 'DERMAL_STROMA'
  lysylOxidaseLoxActivityRatio: number // 0.1 - 3.0 (normal ~1.0; elevated in fibrosis/desmoplasia)
  collagenTypeIDepositionRate: number // 0.2 - 5.0 ug/mm3/day
  matrixMetalloproteinaseMmpDegradationRatio?: number // 0.2 - 2.0 (collagenase activity)
  loxInhibitorBapnConcentrationUm?: number // beta-aminopropionitrile (LOX inhibitor)
}

export interface EcmMechanobiologyEvaluation {
  tissueType: 'HEPATIC_STROMA' | 'PULMONARY_INTERSTITIUM' | 'CARDIAC_MYOCARDIUM' | 'DERMAL_STROMA'
  matrixStiffnessYoungsModulusKpa: number // Young's modulus E (0.5 to 35.0 kPa)
  fibroticStromaClassification: 'NORMAL_PHYSIOLOGIC_SOFT' | 'EARLY_MECHANICAL_STIFFENING' | 'SEVERE_DESMOPLASTIC_FIBROSIS'
  covalentCrosslinkDensityPerMoleCollagen: number // allysine / pyridinoline crosslinks
  integrinFakFocalAdhesionActivation: number // 0.0 - 1.0
  yapTazNuclearLocalizationRatio: number // nuclear / cytoplasmic ratio (0.2 to 4.5)
  profibroticGeneInductionState: 'QUIESCENT' | 'MILD_COMPENSATORY' | 'DRIVEN_AUTO_AMPLIFYING'
  loxInhibitionPercentage: number
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Dupont et al. 2011 Nature; Levental et al. 2009 Cell'
  }
}

/**
 * Simulates collagen crosslinking by lysyl oxidase, tissue Young's modulus stiffening, and YAP/TAZ mechanotransduction.
 */
export function evaluateEcmMechanotransduction(input: EcmTissueInput): EcmMechanobiologyEvaluation {
  const loxBase = Math.max(0.05, input.lysylOxidaseLoxActivityRatio)
  const colDep = Math.max(0.1, input.collagenTypeIDepositionRate)
  const mmp = Math.max(0.1, input.matrixMetalloproteinaseMmpDegradationRatio ?? 1.0)
  const bapn = Math.max(0.0, input.loxInhibitorBapnConcentrationUm ?? 0.0)

  // BAPN inhibition kinetics: IC50 ~ 5.0 uM
  const loxInhibitionPct = bapn > 0.0 ? Number(((bapn / (bapn + 5.0)) * 95.0).toFixed(1)) : 0.0
  const effectiveLox = loxBase * (1.0 - loxInhibitionPct / 100.0)

  // Crosslink density (pyridinoline/allysine crosslinks per mole collagen)
  const crosslinks = Number((Math.max(0.1, (effectiveLox * colDep * 1.8) / mmp)).toFixed(2))

  // Young's modulus E (kPa) by tissue baseline
  const tissueBaselineKpa: Record<string, number> = {
    HEPATIC_STROMA: 1.2,
    PULMONARY_INTERSTITIUM: 1.8,
    CARDIAC_MYOCARDIUM: 8.0,
    DERMAL_STROMA: 3.5,
  }

  const baseKpa = tissueBaselineKpa[input.tissueType] ?? 2.0
  // Nonlinear stiffening as crosslink density scales
  const stiffnessKpa = Number((Math.min(35.0, baseKpa + Math.pow(crosslinks, 1.4) * 2.2)).toFixed(2))

  // Classification
  let classification: 'NORMAL_PHYSIOLOGIC_SOFT' | 'EARLY_MECHANICAL_STIFFENING' | 'SEVERE_DESMOPLASTIC_FIBROSIS' = 'NORMAL_PHYSIOLOGIC_SOFT'
  if (stiffnessKpa >= 12.0) {
    classification = 'SEVERE_DESMOPLASTIC_FIBROSIS'
  } else if (stiffnessKpa >= 4.5) {
    classification = 'EARLY_MECHANICAL_STIFFENING'
  } else {
    classification = 'NORMAL_PHYSIOLOGIC_SOFT'
  }

  // FAK and YAP/TAZ mechanotransduction
  // Above ~5 kPa, integrin clustering triggers rapid YAP/TAZ nuclear entry
  const fakActivation = Number((Math.min(1.0, stiffnessKpa / 15.0)).toFixed(3))
  const yapTazRatio = Number((Math.min(4.5, 0.4 + (stiffnessKpa / 6.0) * 0.9)).toFixed(2))

  let geneState: 'QUIESCENT' | 'MILD_COMPENSATORY' | 'DRIVEN_AUTO_AMPLIFYING' = 'QUIESCENT'
  if (yapTazRatio >= 2.2) {
    geneState = 'DRIVEN_AUTO_AMPLIFYING'
  } else if (yapTazRatio >= 1.0) {
    geneState = 'MILD_COMPENSATORY'
  } else {
    geneState = 'QUIESCENT'
  }

  return {
    tissueType: input.tissueType,
    matrixStiffnessYoungsModulusKpa: stiffnessKpa,
    fibroticStromaClassification: classification,
    covalentCrosslinkDensityPerMoleCollagen: crosslinks,
    integrinFakFocalAdhesionActivation: fakActivation,
    yapTazNuclearLocalizationRatio: yapTazRatio,
    profibroticGeneInductionState: geneState,
    loxInhibitionPercentage: loxInhibitionPct,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Dupont et al. 2011 Nature; Levental et al. 2009 Cell',
    },
  }
}
