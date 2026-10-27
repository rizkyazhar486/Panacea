// src/lib/discovery/lysosomalVAtpaseNutrientSensingEngine.ts
// T-CLIN-117: Lysosomal Acidification, Vacuolar H+-ATPase (v-ATPase) & Nutrient Sensing Engine

export interface LysosomalVAtpaseInput {
  vAtpasePumpActivityRatio: number // normal 1.0; inhibited by Bafilomycin A1 < 0.15
  cytosolicPh?: number // normal 7.2
  luminalAminoAcidAbundance: 'STARVED_LOW' | 'NORMAL_PHYSIOLOGICAL' | 'SURPLUS_NUTRIENT_SATURATED'
  lysosomalMembraneIntegrityIndex?: number // 0.0 - 1.0 (LMP: lysosomal membrane permeabilization)
  bafilomycinInhibitorConcentrationNm?: number // nanomolar potent v-ATPase inhibitor (0 to 100 nM)
}

export interface LysosomalAcidificationEvaluation {
  steadyStateLysosomalLuminalPh: number // normal 4.5 - 5.0; neutralized > 6.0
  acidHydrolaseEnzymaticEfficiencyPercentage: number // optimal at pH 4.8 (~100%); drops to <10% at pH 6.5
  mTorc1LysosomalTranslocationScore: number // 0.0 - 1.0 (Ragulator-Rag recruitment)
  tfebNuclearTranslocationStatus: 'TFEB_PHOSPHORYLATED_CYTOSOLIC_INACTIVE' | 'TFEB_DEPHOSPHORYLATED_NUCLEAR_AUTOPHAGY_DRIVE'
  autophagicCargoDegradationCapacityPct: number // % flux through autolysosome
  lysosomalStoragePathologyVulnerability: 'HEALTHY_PROTEOLYTIC_CLEARANCE' | 'COMPROMISED_MACROAUTOPHAGIC_STALL' | 'CRITICAL_LYSOSOMAL_STORAGE_HAZARD'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Zoncu et al. 2011 Science; Settembre et al. 2012 EMBO J'
  }
}

/**
 * Simulates vacuolar H+-ATPase proton pumping, luminal pH homeostasis, mTORC1 Ragulator recruitment, and TFEB nuclear translocation.
 */
export function evaluateLysosomalVAtpaseDynamics(input: LysosomalVAtpaseInput): LysosomalAcidificationEvaluation {
  const baf = Math.max(0.0, input.bafilomycinInhibitorConcentrationNm ?? 0.0)
  const basePump = Math.min(1.5, Math.max(0.02, input.vAtpasePumpActivityRatio))
  const lmpIntegrity = Math.min(1.0, Math.max(0.1, input.lysosomalMembraneIntegrityIndex ?? 0.95))

  // Bafilomycin A1 inhibition kinetics (IC50 ~ 2.5 nM)
  const bafFactor = baf > 0.0 ? 1.0 / (1.0 + baf / 2.5) : 1.0
  const effectivePump = basePump * bafFactor * lmpIntegrity

  // Luminal pH: normal 4.7. Collapse of pump raises pH to cytosolic levels (~7.0)
  const baseLuminalPh = 4.65
  const deltaPh = Math.max(0.0, (1.0 - effectivePump) * 2.35)
  const luminalPh = Number((Math.min(7.2, baseLuminalPh + deltaPh)).toFixed(2))

  // Cathepsin / acid hydrolase efficiency (bell curve centered at pH 4.8)
  // Gaussian bell curve: exp(-((pH - 4.8)^2) / 0.8)
  const hydrolaseEff = Number((Math.min(100.0, Math.exp(-Math.pow(luminalPh - 4.8, 2) / 0.85) * 100.0)).toFixed(1))

  // Nutrient sensing and mTORC1 translocation
  // Requires both effective v-ATPase conformational coupling and amino acids
  let aaWeight = 0.5
  if (input.luminalAminoAcidAbundance === 'STARVED_LOW') aaWeight = 0.10
  if (input.luminalAminoAcidAbundance === 'SURPLUS_NUTRIENT_SATURATED') aaWeight = 1.0

  // mTORC1 recruitment requires active pump and amino acids (Zoncu et al. 2011)
  const mtorc1Score = Number((Math.min(1.0, Math.max(0.02, effectivePump * aaWeight * 0.98))).toFixed(3))

  // TFEB status: when mTORC1 is active at the lysosome, it phosphorylates TFEB at Ser211 (14-3-3 binding keeps it cytosolic).
  // When starved or when pump is disabled, TFEB is dephosphorylated by calcineurin and moves to the nucleus to induce CLEAR network.
  let tfebStatus: 'TFEB_PHOSPHORYLATED_CYTOSOLIC_INACTIVE' | 'TFEB_DEPHOSPHORYLATED_NUCLEAR_AUTOPHAGY_DRIVE' = 'TFEB_PHOSPHORYLATED_CYTOSOLIC_INACTIVE'
  if (mtorc1Score < 0.35 || input.luminalAminoAcidAbundance === 'STARVED_LOW') {
    tfebStatus = 'TFEB_DEPHOSPHORYLATED_NUCLEAR_AUTOPHAGY_DRIVE'
  } else {
    tfebStatus = 'TFEB_PHOSPHORYLATED_CYTOSOLIC_INACTIVE'
  }

  // Autophagic cargo degradation flux %
  // Requires both acidic hydrolases and intact membrane
  const fluxPct = Number((Math.min(100.0, (hydrolaseEff / 100.0) * lmpIntegrity * 100.0)).toFixed(1))

  // Lysosomal storage classification
  let pathology: 'HEALTHY_PROTEOLYTIC_CLEARANCE' | 'COMPROMISED_MACROAUTOPHAGIC_STALL' | 'CRITICAL_LYSOSOMAL_STORAGE_HAZARD' = 'HEALTHY_PROTEOLYTIC_CLEARANCE'
  if (luminalPh > 6.0 || fluxPct < 25.0) {
    pathology = 'CRITICAL_LYSOSOMAL_STORAGE_HAZARD'
  } else if (luminalPh > 5.3 || fluxPct < 65.0) {
    pathology = 'COMPROMISED_MACROAUTOPHAGIC_STALL'
  } else {
    pathology = 'HEALTHY_PROTEOLYTIC_CLEARANCE'
  }

  return {
    steadyStateLysosomalLuminalPh: luminalPh,
    acidHydrolaseEnzymaticEfficiencyPercentage: hydrolaseEff,
    mTorc1LysosomalTranslocationScore: mtorc1Score,
    tfebNuclearTranslocationStatus: tfebStatus,
    autophagicCargoDegradationCapacityPct: fluxPct,
    lysosomalStoragePathologyVulnerability: pathology,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Zoncu et al. 2011 Science; Settembre et al. 2012 EMBO J',
    },
  }
}
