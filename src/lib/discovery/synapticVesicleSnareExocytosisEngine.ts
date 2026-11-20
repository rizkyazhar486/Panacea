// src/lib/discovery/synapticVesicleSnareExocytosisEngine.ts
// T-CLIN-123: Neurotransmitter Vesicle Exocytosis, SNARE Complex & Synaptotagmin Calcium Sensor Engine

export interface SynapticVesicleExocytosisInput {
  presynapticCalciumMicrodomainPeakUm: number // local active zone [Ca2+] (resting ~0.1 uM; action potential peak 10 - 50 uM)
  readilyReleasablePoolVesicleCount: number // RRP (normal 5 to 30 vesicles per active zone)
  snareComplexAssemblyIntegrityRatio?: number // normal 1.0; cleaved by BoNT < 0.15
  synaptotagmin1CalciumCooperativityIndex?: number // normal ~4.0 to 5.0 (Hill coefficient)
  complexinClampProficiencyRatio?: number // normal 1.0; uninhibited baseline leak if < 0.25
  botulinumNeurotoxinCleavagePresent?: 'NONE' | 'BONT_A_CLEAVED_SNAP25' | 'BONT_B_CLEAVED_SYNAPTOBREVIN'
}

export interface SynapticExocytosisEvaluation {
  calciumOccupancyFractionSyt1: number // fraction of 5 Ca2+ binding sites occupied on Syt1 C2A/C2B
  vesicleFusionProbabilityPerActionPotential: number // release probability Pv (normal 0.15 - 0.40; high-fidelity > 0.60)
  exocyticLatencyMilliseconds: number // ultrafast synaptic delay (normal 0.3 - 0.8 ms)
  evokedNeurotransmitterReleaseQuantalCount: number // number of vesicles fusing per AP
  spontaneousMiniatureEpscLeakRateHz: number // "mini" frequency (normal 0.2 - 1.5 Hz; clamped by Complexin)
  synapticTransmissionStatus: 'PHYSIOLOGICAL_HIGH_FIDELITY' | 'DESYNCHRONIZED_FACILITATING' | 'NEUROTOXIC_SNARE_PARALYSIS'
  botulinumToxinInhibitionPercentage: number
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Sudhof 2012 Neuron; Rizo 2018 Annu Rev Biophys; Jahn & Scheller 2006 Nat Rev Mol Cell Biol'
  }
}

/**
 * Simulates active-zone SNARE bundle zippering, Synaptotagmin-1 Ca2+ cooperativity, exocytic fusion latency, and BoNT cleavage paralysis.
 */
export function evaluateSynapticExocytosisDynamics(
  input: SynapticVesicleExocytosisInput
): SynapticExocytosisEvaluation {
  const ca = Math.max(0.05, input.presynapticCalciumMicrodomainPeakUm)
  const rrp = Math.max(1, input.readilyReleasablePoolVesicleCount)
  const baseSnare = Math.min(1.5, Math.max(0.01, input.snareComplexAssemblyIntegrityRatio ?? 1.0))
  const complexin = Math.min(1.5, Math.max(0.05, input.complexinClampProficiencyRatio ?? 1.0))
  const toxin = input.botulinumNeurotoxinCleavagePresent ?? 'NONE'

  // Botulinum toxin cleavage: BoNT/A (SNAP-25) or BoNT/B (VAMP2) reduces functional SNAREs by > 90%
  let toxinInhibitionPct = 0.0
  let effectiveSnare = baseSnare
  if (toxin === 'BONT_A_CLEAVED_SNAP25') {
    toxinInhibitionPct = 94.0
    effectiveSnare = baseSnare * 0.06
  } else if (toxin === 'BONT_B_CLEAVED_SYNAPTOBREVIN') {
    toxinInhibitionPct = 98.0
    effectiveSnare = baseSnare * 0.02
  }

  // Synaptotagmin-1 calcium cooperativity: Hill equation with KD ~ 15 uM and n ~ 4.2 (Sudhof 2012)
  const kd = 15.0 // uM
  const hillCoeff = Math.min(5.0, Math.max(2.0, input.synaptotagmin1CalciumCooperativityIndex ?? 4.2))
  const caOccupancy = Math.pow(ca, hillCoeff) / (Math.pow(kd, hillCoeff) + Math.pow(ca, hillCoeff))
  const roundedCaOccupancy = Number((Math.min(1.0, Math.max(0.0, caOccupancy))).toFixed(3))

  // Release probability (Pv) per vesicle: requires Ca2+-bound Syt1 and zippered trans-SNARE pin
  const rawPv = Math.min(0.95, roundedCaOccupancy * effectiveSnare * 0.85)
  const pv = Number((Math.max(0.0, rawPv)).toFixed(3))

  // Evoked quantal release count: binomial expectation m = RRP * Pv
  const quantalRelease = Number((rrp * pv).toFixed(1))

  // Exocytic fusion latency (ms): ultrafast release at high Ca2+ (0.4 ms); slows if Ca2+ or SNAREs are sub-optimal
  const latency = effectiveSnare > 0.2
    ? Number((Math.max(0.35, 0.40 + (1.0 - roundedCaOccupancy) * 1.8)).toFixed(2))
    : 12.0 // essentially paralyzed

  // Spontaneous release ("mini" frequency in Hz): clamped by Complexin; uninhibited if Complexin is deficient
  const baseMiniHz = 0.5
  const miniLeakHz = Number((Math.max(0.05, (baseMiniHz / complexin) * effectiveSnare)).toFixed(2))

  // Transmission status
  let status: 'PHYSIOLOGICAL_HIGH_FIDELITY' | 'DESYNCHRONIZED_FACILITATING' | 'NEUROTOXIC_SNARE_PARALYSIS' = 'PHYSIOLOGICAL_HIGH_FIDELITY'
  if (effectiveSnare < 0.15 || toxinInhibitionPct > 80.0) {
    status = 'NEUROTOXIC_SNARE_PARALYSIS'
  } else if (pv < 0.15 || latency > 1.2) {
    status = 'DESYNCHRONIZED_FACILITATING'
  } else {
    status = 'PHYSIOLOGICAL_HIGH_FIDELITY'
  }

  return {
    calciumOccupancyFractionSyt1: roundedCaOccupancy,
    vesicleFusionProbabilityPerActionPotential: pv,
    exocyticLatencyMilliseconds: latency,
    evokedNeurotransmitterReleaseQuantalCount: quantalRelease,
    spontaneousMiniatureEpscLeakRateHz: miniLeakHz,
    synapticTransmissionStatus: status,
    botulinumToxinInhibitionPercentage: toxinInhibitionPct,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Sudhof 2012 Neuron; Rizo 2018 Annu Rev Biophys; Jahn & Scheller 2006 Nat Rev Mol Cell Biol',
    },
  }
}
