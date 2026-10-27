// src/lib/discovery/nhejKuDnaPkcsSynapsisEngine.ts
// T-CLIN-111: Non-Homologous End Joining (NHEJ) Ku70/80 - DNA-PKcs Complex & Synapsis Engine

export interface NhejSynapsisInput {
  initialDoubleStrandBreaksPerNucleus: number // e.g. 10 to 100 DSBs following ionizing radiation
  ku70Ku80HeterodimerAbundanceRatio: number // normal ~1.0; deficient < 0.2
  dnaPkcsKinaseActivityRatio?: number // normal 1.0; inhibited < 0.15 (e.g. Peposertib / M3814)
  artemisEndonucleasePresent?: boolean
  xlfXrcc4LigaseIvAbundanceRatio?: number // ligase complex integrity (0.1 to 1.5)
  cellCyclePhase: 'G0_G1_PHASE' | 'S_PHASE' | 'G2_M_PHASE'
  dnaPkInhibitorConcentrationNm?: number // Peposertib (0 to 1000 nM)
}

export interface NhejSynapsisEvaluation {
  initialDsbCount: number
  kuRingEndCappingEfficiencyPct: number // % of broken ends bound by Ku70/80
  dnaPkcsSer2056AutophosphorylationIndex: number // 0.0 - 1.0 (activation & synapsis marker)
  synapticComplexStabilityScore: number // 0.0 - 1.0 (bridging stability)
  dsbClearanceRatePerHr: number // DSBs repaired per hour
  residualUnrepairedDsbsAt24Hr: number // critical biomarker for clonogenic survival
  nhejFidelityClassification: 'HIGH_FIDELITY_BLUNT_LIGATION' | 'MICROHOMOLOGY_INDEL_SCARRING' | 'ABERRANT_TRANSLOCATION_HAZARD'
  radiosensitizationEnhancementRatio: number // 1.0 = baseline radioresistance; > 2.5 = marked radiosensitivity
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Lieber 2010 Annu Rev Biochem; Davis & Chen 2013 DNA Repair'
  }
}

/**
 * Simulates non-homologous end joining (NHEJ) Ku ring binding, DNA-PKcs autophosphorylation, synaptic bridging, and radiosensitization.
 */
export function evaluateNhejSynapsisDynamics(input: NhejSynapsisInput): NhejSynapsisEvaluation {
  const dsb = Math.max(1, input.initialDoubleStrandBreaksPerNucleus)
  const ku = Math.min(1.5, Math.max(0.05, input.ku70Ku80HeterodimerAbundanceRatio))
  const artemis = input.artemisEndonucleasePresent ?? true
  const lig = Math.min(1.5, Math.max(0.05, input.xlfXrcc4LigaseIvAbundanceRatio ?? 1.0))
  const peposertib = Math.max(0.0, input.dnaPkInhibitorConcentrationNm ?? 0.0)

  // DNA-PKcs inhibition kinetics (IC50 ~ 25 nM for Peposertib)
  const baseKinase = Math.min(1.5, Math.max(0.05, input.dnaPkcsKinaseActivityRatio ?? 1.0))
  const kinaseInhibitionFactor = peposertib > 0.0 ? 1.0 / (1.0 + peposertib / 25.0) : 1.0
  const effectiveKinase = baseKinase * kinaseInhibitionFactor

  // Ku ring capping efficiency (Ku binds DSB ends with high nanomolar affinity)
  const kuCappingPct = Number((Math.min(99.0, ku * 95.0)).toFixed(1))

  // DNA-PKcs Ser2056 autophosphorylation requires Ku recruitment and active kinase
  const pSer2056 = Number((Math.min(1.0, (kuCappingPct / 100.0) * effectiveKinase * 0.98)).toFixed(3))

  // Cell cycle influence: NHEJ is predominant in G0/G1; in S/G2, resection favors HDR
  let cyclePenalty = 1.0
  if (input.cellCyclePhase === 'S_PHASE') cyclePenalty = 0.70
  if (input.cellCyclePhase === 'G2_M_PHASE') cyclePenalty = 0.85

  // Synaptic complex stability: mediated by XRCC4/LigIV/XLF and DNA-PKcs synapsis
  const synapsis = Number((Math.min(1.0, (pSer2056 * 0.5 + lig * 0.5) * cyclePenalty)).toFixed(3))

  // DSB clearance rate (typical repair half-life is ~ 0.5 - 2 hours in proficient cells)
  const baseClearancePerHour = 8.5 * synapsis * (artemis ? 1.0 : 0.6)
  const clearanceRate = Number(Math.max(0.2, baseClearancePerHour).toFixed(2))

  // Residual unrepaired DSBs at 24 hours: unrepaired DSBs persist if kinase is inhibited or Ku is deficient
  const unrepairedFraction = Math.max(0.02, Math.exp(-clearanceRate * 2.5 / 10.0))
  const residualDsbs = Number((dsb * unrepairedFraction).toFixed(1))

  // NHEJ fidelity classification
  let fidelity: 'HIGH_FIDELITY_BLUNT_LIGATION' | 'MICROHOMOLOGY_INDEL_SCARRING' | 'ABERRANT_TRANSLOCATION_HAZARD' = 'HIGH_FIDELITY_BLUNT_LIGATION'
  if (effectiveKinase < 0.20 || ku < 0.25) {
    fidelity = 'ABERRANT_TRANSLOCATION_HAZARD' // persistent ends fuse aberrantly via alternative end-joining
  } else if (!artemis || lig < 0.5) {
    fidelity = 'MICROHOMOLOGY_INDEL_SCARRING'
  } else {
    fidelity = 'HIGH_FIDELITY_BLUNT_LIGATION'
  }

  // Radiosensitization enhancement ratio (SER)
  const ser = Number((Math.max(1.0, 1.0 + (1.0 - effectiveKinase) * 2.2 + (residualDsbs / dsb) * 1.5)).toFixed(2))

  return {
    initialDsbCount: dsb,
    kuRingEndCappingEfficiencyPct: kuCappingPct,
    dnaPkcsSer2056AutophosphorylationIndex: pSer2056,
    synapticComplexStabilityScore: synapsis,
    dsbClearanceRatePerHr: clearanceRate,
    residualUnrepairedDsbsAt24Hr: residualDsbs,
    nhejFidelityClassification: fidelity,
    radiosensitizationEnhancementRatio: ser,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Lieber 2010 Annu Rev Biochem; Davis & Chen 2013 DNA Repair',
    },
  }
}
