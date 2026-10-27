// src/lib/discovery/dnaRepairPathwayChoiceEngine.ts
// T-CLIN-81: DNA Double-Strand Break (DSB) Repair Pathway Choice Engine: NHEJ vs HDR vs MMEJ

export type CellCyclePhaseDsb = 'G0_G1' | 'EARLY_S' | 'LATE_S_G2' | 'MITOSIS'

export interface DsbMolecularEnvironmentInput {
  cellCyclePhase: CellCyclePhaseDsb
  ku70_80_abundance?: number // 0.0 - 1.0 (default 0.8)
  p53bp1_activity?: number // 0.0 - 1.0 (favors NHEJ, blocks resection)
  brca1_ctip_activity?: number // 0.0 - 1.0 (promotes resection, favors HDR)
  rad51_recombinase_level?: number // 0.0 - 1.0 (catalyzes strand invasion)
  homologousDonorAvailable: boolean // whether sister chromatid or exogenous donor template is present
  donorHomologyArmLengthBp?: number // e.g. 500 - 1000 bp
  microhomologyLengthBp?: number // 0 - 20 bp (if 2-10 bp, enables MMEJ)
  dsbCountPerCell?: number // 1 - 50 DSBs
}

export interface DsbRepairPathwayProfile {
  cellCyclePhase: CellCyclePhaseDsb
  dominantPathway: 'NHEJ' | 'HDR' | 'MMEJ_ALT_EJ' | 'UNREPAIRED_ARREST'
  pathwayProbabilities: {
    nhejProbability: number
    hdrProbability: number
    mmejProbability: number
    unrepairedProbability: number
  }
  resectionLengthBp: number
  fidelityProfile: {
    scarlessFidelityPercentage: number
    smallIndelProbability: number
    largeDeletionProbability: number
  }
  cellularFateForecast: 'CELL_CYCLE_RESUMPTION' | 'G2_M_ARREST' | 'APOPTOSIS_P53_TRIGGERED'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Rothkamm et al. 2003 Mol Cell Biol; Scully et al. 2019 Nat Rev Mol Cell Biol'
  }
}

/**
 * Calculates competition between 53BP1 (protecting ends / promoting canonical NHEJ)
 * and BRCA1/CtIP (promoting 5' to 3' resection / promoting HDR and MMEJ).
 */
export function simulateDsbRepairPathwayChoice(input: DsbMolecularEnvironmentInput): DsbRepairPathwayProfile {
  const ku = Math.min(1.0, Math.max(0.0, input.ku70_80_abundance ?? 0.8))
  const p53bp1 = Math.min(1.0, Math.max(0.0, input.p53bp1_activity ?? 0.7))
  const brca1 = Math.min(1.0, Math.max(0.0, input.brca1_ctip_activity ?? 0.5))
  const rad51 = Math.min(1.0, Math.max(0.0, input.rad51_recombinase_level ?? 0.6))
  const dsbs = Math.max(1, input.dsbCountPerCell ?? 1)
  const donor = input.homologousDonorAvailable
  const donorArm = input.donorHomologyArmLengthBp ?? (donor ? 600 : 0)
  const mhLen = Math.max(0, input.microhomologyLengthBp ?? 0)

  // Resection barrier: high 53BP1 suppresses resection, high BRCA1 overcomes it in S/G2
  let rawResectionCapacity = 0.0
  let isResectionPermissive = false

  switch (input.cellCyclePhase) {
    case 'G0_G1':
      // CDK activity is low; CtIP cannot be phosphorylated; 53BP1-RIF1 dominantly shields ends
      rawResectionCapacity = Math.max(0.0, (brca1 * 0.1) - (p53bp1 * 0.9))
      isResectionPermissive = false
      break
    case 'EARLY_S':
      // CDK2 activates CtIP; BRCA1 antagonizes 53BP1
      rawResectionCapacity = Math.max(0.0, (brca1 * 0.7) - (p53bp1 * 0.4))
      isResectionPermissive = rawResectionCapacity > 0.15
      break
    case 'LATE_S_G2':
      // High CDK1/2 activity; sister chromatids present; strong end resection
      rawResectionCapacity = Math.max(0.1, (brca1 * 1.0) - (p53bp1 * 0.2))
      isResectionPermissive = true
      break
    case 'MITOSIS':
      // DNA repair largely suppressed during chromosome condensation to prevent telomere fusions
      rawResectionCapacity = 0.0
      isResectionPermissive = false
      break
  }

  // Calculate Resection Length
  const resectionLengthBp = isResectionPermissive ? Math.round(rawResectionCapacity * 1500) : 0

  // Raw pathway propensities
  let nhejWeight = 0.0
  let hdrWeight = 0.0
  let mmejWeight = 0.0
  let unrepairWeight = 0.0

  if (input.cellCyclePhase === 'MITOSIS') {
    // In M-phase, most DSBs remain unrepaired until mitotic exit, or tethered by MDC1
    unrepairWeight = 0.8
    nhejWeight = 0.2
  } else if (!isResectionPermissive) {
    // Canonical NHEJ dominates non-resected ends
    nhejWeight = ku * 0.9 + p53bp1 * 0.5
    if (mhLen >= 4) {
      mmejWeight = 0.05 * mhLen
    }
    unrepairWeight = Math.min(0.5, (dsbs - 1) * 0.04)
  } else {
    // Resected ends: competition between HDR (RAD51 + Donor) vs MMEJ (Microhomology alignment via Pol Theta)
    if (donor && donorArm >= 150 && rad51 > 0.2) {
      const armFactor = Math.min(1.0, donorArm / 800)
      hdrWeight = rad51 * armFactor * 1.2
    }
    if (mhLen >= 2) {
      // Microhomology of 2-10 bp strongly recruits Pol theta (POLQ)
      const polqAffinity = Math.min(1.0, mhLen / 8.0)
      mmejWeight = polqAffinity * 0.75 * (1.0 - (hdrWeight * 0.4))
    }
    // Residual NHEJ from ends before extensive resection
    nhejWeight = Math.max(0.05, 0.4 - rawResectionCapacity * 0.3)
    unrepairWeight = Math.min(0.6, (dsbs - 1) * 0.05 + (1.0 - rad51) * 0.2)
  }

  const totalWeight = nhejWeight + hdrWeight + mmejWeight + unrepairWeight
  const nhejProb = totalWeight > 0 ? Number((nhejWeight / totalWeight).toFixed(3)) : 1.0
  const hdrProb = totalWeight > 0 ? Number((hdrWeight / totalWeight).toFixed(3)) : 0.0
  const mmejProb = totalWeight > 0 ? Number((mmejWeight / totalWeight).toFixed(3)) : 0.0
  const unrepairProb = totalWeight > 0 ? Number(Math.max(0.0, 1.0 - (nhejProb + hdrProb + mmejProb)).toFixed(3)) : 0.0

  // Dominant pathway
  let dominant: 'NHEJ' | 'HDR' | 'MMEJ_ALT_EJ' | 'UNREPAIRED_ARREST' = 'NHEJ'
  const maxProb = Math.max(nhejProb, hdrProb, mmejProb, unrepairProb)
  if (maxProb === hdrProb) dominant = 'HDR'
  else if (maxProb === mmejProb) dominant = 'MMEJ_ALT_EJ'
  else if (maxProb === unrepairProb) dominant = 'UNREPAIRED_ARREST'
  else dominant = 'NHEJ'

  // Fidelity Profile
  const scarlessFidelity = Number((hdrProb * 98.0 + nhejProb * 25.0).toFixed(1))
  const smallIndelProb = Number((nhejProb * 0.70 + mmejProb * 0.25).toFixed(3))
  const largeDelProb = Number((mmejProb * 0.75 + unrepairProb * 0.4).toFixed(3))

  // Cellular Fate
  let fate: 'CELL_CYCLE_RESUMPTION' | 'G2_M_ARREST' | 'APOPTOSIS_P53_TRIGGERED' = 'CELL_CYCLE_RESUMPTION'
  if (unrepairProb > 0.45 || dsbs >= 20) {
    fate = 'APOPTOSIS_P53_TRIGGERED'
  } else if (unrepairProb > 0.15 || (isResectionPermissive && hdrProb < 0.2 && mmejProb < 0.2)) {
    fate = 'G2_M_ARREST'
  }

  return {
    cellCyclePhase: input.cellCyclePhase,
    dominantPathway: dominant,
    pathwayProbabilities: {
      nhejProbability: nhejProb,
      hdrProbability: hdrProb,
      mmejProbability: mmejProb,
      unrepairedProbability: unrepairProb,
    },
    resectionLengthBp,
    fidelityProfile: {
      scarlessFidelityPercentage: Math.min(100.0, scarlessFidelity),
      smallIndelProbability: Math.min(1.0, smallIndelProb),
      largeDeletionProbability: Math.min(1.0, largeDelProb),
    },
    cellularFateForecast: fate,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Rothkamm et al. 2003 Mol Cell Biol; Scully et al. 2019 Nat Rev Mol Cell Biol',
    },
  }
}
