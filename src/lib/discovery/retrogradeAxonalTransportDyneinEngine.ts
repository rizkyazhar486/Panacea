// src/lib/discovery/retrogradeAxonalTransportDyneinEngine.ts
// T-CLIN-114: Retrograde Neuroaxonal Transport, Dynein-Dynactin Cargo Motors & Motor Neuron Sparing Engine

export interface AxonalTransportInput {
  axonLengthMeters: number // e.g. 0.05 m (cranial) to 1.0 m (lumbar motor neuron)
  cytoplasmicDyneinProcessivityRatio: number // normal ~1.0; impaired < 0.40
  dynactinP150GluedAbundanceRatio?: number // normal 1.0; mutated/reduced < 0.5 (e.g. DCTN1)
  microtubuleTauHyperphosphorylationIndex?: number // 0.0 to 1.0 (detaches motors)
  mitochondrialAtpSupplyInAxonRatio?: number // local ATP availability (0.1 to 1.5)
  neurotrophinBdnfAvailabilityRatio?: number // BDNF/TrkB retrograde survival signal
}

export interface AxonalTransportEvaluation {
  retrogradeVelocityMicronsPerSec: number // normal fast retrograde 1.0 - 2.5 um/s
  estimatedEndosomeTransitTimeHours: number // time for signaling endosome to reach soma
  axonalSpheroidStallRiskScore: number // 0.0 - 1.0 (cargo congestion & swelling)
  somaNeurotrophicSurvivalSignalIntensity: number // 0.0 - 1.0 (retrograde BDNF/TrkB signaling)
  distalAxonopathyVulnerabilityTier: 'LOW_RESILIENT_AXON' | 'MODERATE_DYING_BACK_RISK' | 'CRITICAL_MOTOR_NEURONOPATHY'
  circulatingNeurofilamentLightChainProxyTier: 'NORMAL_PHYSIOLOGICAL_TURNOVER' | 'ELEVATED_NEUROAXONAL_BREAKDOWN' | 'SEVERE_ACTIVE_DEGENERATION'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Schiavo et al. 2013 Physiol Rev; De Vos et al. 2008 Annu Rev Neurosci'
  }
}

/**
 * Simulates retrograde axonal transport dynamics, dynein-dynactin motor processivity, axonal swellings, and neurodegeneration risks.
 */
export function evaluateAxonalTransportDynamics(input: AxonalTransportInput): AxonalTransportEvaluation {
  const lengthM = Math.min(1.2, Math.max(0.01, input.axonLengthMeters))
  const dynein = Math.min(1.5, Math.max(0.05, input.cytoplasmicDyneinProcessivityRatio))
  const dynactin = Math.min(1.5, Math.max(0.05, input.dynactinP150GluedAbundanceRatio ?? 1.0))
  const tauP = Math.min(1.0, Math.max(0.0, input.microtubuleTauHyperphosphorylationIndex ?? 0.10))
  const atp = Math.min(1.5, Math.max(0.1, input.mitochondrialAtpSupplyInAxonRatio ?? 1.0))
  const bdnf = Math.min(1.5, Math.max(0.05, input.neurotrophinBdnfAvailabilityRatio ?? 1.0))

  // Microtubule track integrity factor (hyperphosphorylated Tau causes microtubule disassembly)
  const trackIntegrity = Math.max(0.15, 1.0 - tauP * 0.75)

  // Dynein-Dynactin holoenzyme velocity (fast retrograde transport: baseline ~ 1.5 um/s)
  const baseVelocity = 1.60 // um/s
  const motorFactor = (dynein * 0.5 + dynactin * 0.5) * trackIntegrity * Math.min(1.2, atp)
  const velocity = Number((Math.max(0.10, baseVelocity * motorFactor)).toFixed(2))

  // Transit time in hours from distal synapse to soma: distance in um / (velocity um/s * 3600 s/hr)
  const distanceUm = lengthM * 1000000.0
  const transitHours = Number((distanceUm / (velocity * 3600.0)).toFixed(1))

  // Axonal stall and cargo swelling risk (accumulation of stationary endosomes and autophagosomes)
  const stallScore = Number((Math.min(1.0, Math.max(0.02, (1.0 - motorFactor) * 0.85 + (tauP * 0.35)))).toFixed(3))

  // Retrograde neurotrophic survival signal reaching soma
  // Attenuation increases exponentially with transit time and stall score
  const transitFactor = Math.exp(-transitHours / 250.0)
  const somaBdnfSignal = Number((Math.min(1.0, Math.max(0.01, bdnf * (1.0 - stallScore * 0.8) * transitFactor))).toFixed(3))

  // Axonopathy vulnerability tier
  let vulnerability: 'LOW_RESILIENT_AXON' | 'MODERATE_DYING_BACK_RISK' | 'CRITICAL_MOTOR_NEURONOPATHY' = 'LOW_RESILIENT_AXON'
  if (stallScore > 0.65 || somaBdnfSignal < 0.20) {
    vulnerability = 'CRITICAL_MOTOR_NEURONOPATHY'
  } else if (stallScore > 0.35 || lengthM > 0.70) {
    vulnerability = 'MODERATE_DYING_BACK_RISK'
  } else {
    vulnerability = 'LOW_RESILIENT_AXON'
  }

  // Neurofilament light chain (NfL) leakage proxy tier
  let nflTier: 'NORMAL_PHYSIOLOGICAL_TURNOVER' | 'ELEVATED_NEUROAXONAL_BREAKDOWN' | 'SEVERE_ACTIVE_DEGENERATION' = 'NORMAL_PHYSIOLOGICAL_TURNOVER'
  if (vulnerability === 'CRITICAL_MOTOR_NEURONOPATHY') {
    nflTier = 'SEVERE_ACTIVE_DEGENERATION'
  } else if (vulnerability === 'MODERATE_DYING_BACK_RISK') {
    nflTier = 'ELEVATED_NEUROAXONAL_BREAKDOWN'
  } else {
    nflTier = 'NORMAL_PHYSIOLOGICAL_TURNOVER'
  }

  return {
    retrogradeVelocityMicronsPerSec: velocity,
    estimatedEndosomeTransitTimeHours: transitHours,
    axonalSpheroidStallRiskScore: stallScore,
    somaNeurotrophicSurvivalSignalIntensity: somaBdnfSignal,
    distalAxonopathyVulnerabilityTier: vulnerability,
    circulatingNeurofilamentLightChainProxyTier: nflTier,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Schiavo et al. 2013 Physiol Rev; De Vos et al. 2008 Annu Rev Neurosci',
    },
  }
}
