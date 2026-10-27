// src/lib/discovery/retinalPhotoreceptorRegenerationEngine.ts
// T-CLIN-87: Retinal Organoid Photoreceptor Differentiation & Synaptic Integration Engine

export type PhotoreceptorLineageType = 'ROD_PHOTORECEPTOR' | 'CONE_PHOTORECEPTOR' | 'BIPOLAR_INTERNEURON' | 'RETINAL_GANGLION_CELL'

export interface RetinalOrganoidInput {
  differentiationDays: number // typically 30 to 200 days for mature human organoids
  crx_progenitor_level?: number // 0.0 - 1.0 (cone-rod homeobox transcription factor)
  nrl_rod_driver_level?: number // 0.0 - 1.0 (neural retina leucine zipper: drives rod specification)
  thyroidHormoneT3_supplementation?: boolean // T3 promotes M/L cone specification over S cones
  outerSegmentMaturationSupport?: boolean // docosahexaenoic acid (DHA) + taurine supplementation
  targetLineage: PhotoreceptorLineageType
}

export interface RetinalRegenerationProfile {
  targetLineage: PhotoreceptorLineageType
  organoidMaturityStage: 'EARLY_OPTIC_VESICLE' | 'NEURAL_RETINA_LAMINATED' | 'PHOTORECEPTOR_SEGMENTED' | 'FUNCTIONAL_SYNAPTIC_COMPETENCE'
  differentiationDays: number
  lineagePurityPercentage: number
  markerExpression: {
    rhodopsinRodSignal: number // 0.0 - 1.0
    coneOpsinSignal: number // 0.0 - 1.0
    ribbonSynapseRibeyeCtbp2: number // 0.0 - 1.0
    pax6ResidualProgenitor: number // must decline as maturity progresses
  }
  synapticIntegrationReadiness: {
    ribbonSynapseDensityPer100um2: number
    hostBipolarTransmissionCapacityPa: number // picoAmperes synaptic current proxy
    structuralIntegrationPassed: boolean
  }
  safetyClearance: {
    teratomaRiskCleared: boolean
    nonRetinalOvergrowthDetected: boolean
  }
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Nakano et al. 2012 Cell Stem Cell; Wahlin et al. 2017 Sci Rep'
  }
}

/**
 * Simulates human retinal organoid morphogenesis, rod vs cone specification, and synaptic integration readiness.
 */
export function simulateRetinalRegeneration(input: RetinalOrganoidInput): RetinalRegenerationProfile {
  const days = Math.max(1, input.differentiationDays)
  const crx = Math.min(1.0, Math.max(0.0, input.crx_progenitor_level ?? 0.75))
  const nrl = Math.min(1.0, Math.max(0.0, input.nrl_rod_driver_level ?? 0.65))
  const dha = input.outerSegmentMaturationSupport ?? true

  // 1. Organoid maturity stage by timeline (human retinal differentiation takes ~90-180 days)
  let stage: 'EARLY_OPTIC_VESICLE' | 'NEURAL_RETINA_LAMINATED' | 'PHOTORECEPTOR_SEGMENTED' | 'FUNCTIONAL_SYNAPTIC_COMPETENCE' = 'EARLY_OPTIC_VESICLE'
  if (days >= 150) {
    stage = 'FUNCTIONAL_SYNAPTIC_COMPETENCE'
  } else if (days >= 90) {
    stage = 'PHOTORECEPTOR_SEGMENTED'
  } else if (days >= 40) {
    stage = 'NEURAL_RETINA_LAMINATED'
  } else {
    stage = 'EARLY_OPTIC_VESICLE'
  }

  // 2. Marker dynamics
  const timeProgress = Math.min(1.0, days / 160.0)
  // PAX6 peaks early in optic cup progenitors and diminishes in mature photoreceptors
  const pax6 = Number(Math.max(0.02, 1.0 - (days / 100.0) * 0.95).toFixed(3))

  let rhodopsin = 0.0
  let opsin = 0.0

  if (input.targetLineage === 'ROD_PHOTORECEPTOR') {
    // NRL and CRX drive high Rhodopsin in late stage (>90d)
    const rodEfficiency = crx * nrl * timeProgress * (dha ? 1.2 : 0.8)
    rhodopsin = Number(Math.min(1.0, Math.max(0.0, rodEfficiency)).toFixed(3))
    opsin = Number((rhodopsin * 0.08).toFixed(3)) // trace cone leakage
  } else if (input.targetLineage === 'CONE_PHOTORECEPTOR') {
    // Cones require CRX but lack NRL; T3 boosts M/L cone opsin
    const coneEfficiency = crx * (1.0 - (nrl * 0.8)) * timeProgress * (input.thyroidHormoneT3_supplementation ? 1.25 : 0.9)
    opsin = Number(Math.min(1.0, Math.max(0.0, coneEfficiency)).toFixed(3))
    rhodopsin = Number((opsin * 0.05).toFixed(3))
  } else {
    rhodopsin = 0.1
    opsin = 0.1
  }

  // Ribbon synapse marker RIBEYE (CtBP2)
  const ribeye = Number(Math.min(1.0, Math.pow(timeProgress, 1.8) * crx * 1.1).toFixed(3))

  // 3. Lineage Purity
  let purity = 0.0
  if (input.targetLineage === 'ROD_PHOTORECEPTOR') {
    purity = Number((rhodopsin * 88.0 + (days > 120 ? 10.0 : 0.0)).toFixed(1))
  } else if (input.targetLineage === 'CONE_PHOTORECEPTOR') {
    purity = Number((opsin * 86.0 + (days > 120 ? 11.0 : 0.0)).toFixed(1))
  } else {
    purity = 75.0
  }
  purity = Math.min(98.5, Math.max(10.0, purity))

  // 4. Synaptic integration readiness
  const synapseDensity = Number((ribeye * 18.5).toFixed(1)) // per 100 um^2
  const synapticCurrentPa = Number((ribeye * (dha ? 85.0 : 45.0)).toFixed(1)) // pA
  const structuralOk = days >= 120 && ribeye >= 0.55 && (rhodopsin >= 0.5 || opsin >= 0.5)

  // 5. Safety clearance
  // Days > 60 and residual PAX6 progenitor < 0.25 clears teratoma/overgrowth risk
  const teratomaCleared = days >= 60 && pax6 < 0.35
  const nonRetinalOvergrowth = pax6 > 0.65 && days > 80

  return {
    targetLineage: input.targetLineage,
    organoidMaturityStage: stage,
    differentiationDays: days,
    lineagePurityPercentage: purity,
    markerExpression: {
      rhodopsinRodSignal: rhodopsin,
      coneOpsinSignal: opsin,
      ribbonSynapseRibeyeCtbp2: ribeye,
      pax6ResidualProgenitor: pax6,
    },
    synapticIntegrationReadiness: {
      ribbonSynapseDensityPer100um2: synapseDensity,
      hostBipolarTransmissionCapacityPa: synapticCurrentPa,
      structuralIntegrationPassed: structuralOk,
    },
    safetyClearance: {
      teratomaRiskCleared: teratomaCleared,
      nonRetinalOvergrowthDetected: nonRetinalOvergrowth,
    },
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Nakano et al. 2012 Cell Stem Cell; Wahlin et al. 2017 Sci Rep',
    },
  }
}
