// src/lib/discovery/syntheticGeneCircuitToggleEngine.ts
// T-CLIN-101: Synthetic Gene Circuit Bistable Toggle Switch & Inducible Kill Switch Engine

export type ToggleCircuitState = 'STATE_1_HIGH_REPRESSOR_1' | 'STATE_2_HIGH_REPRESSOR_2' | 'INTERMEDIATE_METASTABLE'

export interface GeneticToggleInput {
  initialRepressor1ConcentrationU: number // e.g. LacI (arbitrary concentration units 0 - 20)
  initialRepressor2ConcentrationV: number // e.g. TetR (arbitrary concentration units 0 - 20)
  promoterSynthesisRateAlpha1?: number // promoter 1 transcription strength (default 10.0)
  promoterSynthesisRateAlpha2?: number // promoter 2 transcription strength (default 10.0)
  hillCooperativityBeta?: number // Hill coefficient beta (must be > 1 for bistability; default 2.2)
  hillCooperativityGamma?: number // Hill coefficient gamma (default 2.2)
  iptgInducerConcentrationUm?: number // inactives Repressor 1 (switches toward State 2)
  atcInducerConcentrationNgMl?: number // inactivates Repressor 2 (switches toward State 1)
  suicideSwitchCoupled?: boolean // e.g. iCasp9 kill switch coupled to State 2
}

export interface GeneticToggleEvaluation {
  circuitState: ToggleCircuitState
  steadyStateRepressor1U: number
  steadyStateRepressor2V: number
  bistabilityParameterMargin: number // distance from bifurcation boundary (beta * gamma > 1)
  switchingSuccessAchieved: boolean
  flipTransitionTimeSeconds: number // simulation proxy for state transition
  suicideKillSwitchArmed: boolean
  cellularSafetyAssessment: 'STABLE_THERAPEUTIC_STATE' | 'INDUCIBLE_CLEARANCE_TRIGGERED' | 'BIFURCATION_NOISE_UNSTABLE'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Gardner, Cantor & Collins 2000 Nature; Wu et al. 2014 Science'
  }
}

/**
 * Simulates mutually repressive synthetic genetic toggle switch dynamics via coupled non-linear Hill differential equations.
 */
export function evaluateGeneticToggleSwitch(input: GeneticToggleInput): GeneticToggleEvaluation {
  let u = Math.max(0.0, input.initialRepressor1ConcentrationU)
  let v = Math.max(0.0, input.initialRepressor2ConcentrationV)
  const alpha1 = Math.max(1.0, input.promoterSynthesisRateAlpha1 ?? 10.0)
  const alpha2 = Math.max(1.0, input.promoterSynthesisRateAlpha2 ?? 10.0)
  const beta = Math.max(1.0, input.hillCooperativityBeta ?? 2.2)
  const gamma = Math.max(1.0, input.hillCooperativityGamma ?? 2.2)

  const iptg = Math.max(0.0, input.iptgInducerConcentrationUm ?? 0.0)
  const atc = Math.max(0.0, input.atcInducerConcentrationNgMl ?? 0.0)
  const hasSuicide = input.suicideSwitchCoupled ?? false

  // Inducers attenuate effective repressor activity
  // IPTG binds Repressor 1 (LacI); aTc binds Repressor 2 (TetR)
  const uEff = u / (1.0 + iptg / 50.0)
  const vEff = v / (1.0 + atc / 20.0)

  // Forward Euler numerical integration of Gardner-Cantor equations
  const dt = 0.05
  let curU = u
  let curV = v

  for (let step = 0; step < 200; step++) {
    const curUEff = curU / (1.0 + iptg / 50.0)
    const curVEff = curV / (1.0 + atc / 20.0)

    const du = (alpha1 / (1.0 + Math.pow(curVEff, beta)) - curU) * dt
    const dv = (alpha2 / (1.0 + Math.pow(curUEff, gamma)) - curV) * dt

    curU = Math.max(0.0, curU + du)
    curV = Math.max(0.0, curV + dv)
  }

  const finalU = Number(curU.toFixed(2))
  const finalV = Number(curV.toFixed(2))

  // State classification
  let state: ToggleCircuitState = 'INTERMEDIATE_METASTABLE'
  if (finalU > 6.0 && finalV < 2.0) {
    state = 'STATE_1_HIGH_REPRESSOR_1'
  } else if (finalV > 6.0 && finalU < 2.0) {
    state = 'STATE_2_HIGH_REPRESSOR_2'
  } else {
    state = 'INTERMEDIATE_METASTABLE'
  }

  const bistabilityMargin = Number((beta * gamma - 1.0).toFixed(2))
  const isSwitched = (u > v && finalV > finalU) || (v > u && finalU > finalV)

  // Suicide kill switch
  const isKillArmed = hasSuicide && state === 'STATE_2_HIGH_REPRESSOR_2'

  let safetyAssessment: 'STABLE_THERAPEUTIC_STATE' | 'INDUCIBLE_CLEARANCE_TRIGGERED' | 'BIFURCATION_NOISE_UNSTABLE' = 'STABLE_THERAPEUTIC_STATE'
  if (isKillArmed) {
    safetyAssessment = 'INDUCIBLE_CLEARANCE_TRIGGERED'
  } else if (state === 'INTERMEDIATE_METASTABLE') {
    safetyAssessment = 'BIFURCATION_NOISE_UNSTABLE'
  } else {
    safetyAssessment = 'STABLE_THERAPEUTIC_STATE'
  }

  return {
    circuitState: state,
    steadyStateRepressor1U: finalU,
    steadyStateRepressor2V: finalV,
    bistabilityParameterMargin: bistabilityMargin,
    switchingSuccessAchieved: isSwitched,
    flipTransitionTimeSeconds: Number((isSwitched ? 120.0 : 15.0).toFixed(1)),
    suicideKillSwitchArmed: isKillArmed,
    cellularSafetyAssessment: safetyAssessment,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Gardner, Cantor & Collins 2000 Nature; Wu et al. 2014 Science',
    },
  }
}
