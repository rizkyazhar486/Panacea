// src/domains/quantum-biology/model/quantumProteinTypes.ts
// Quantum Biology, Electron Transfer Kinetics & De Novo Epitope Target Types
// Aligned with Marcus Theory of Electron Transfer and Biophysical Free Energy Models

export type AminoAcidSingleLetter =
  | 'A' | 'R' | 'N' | 'D' | 'C'
  | 'Q' | 'E' | 'G' | 'H' | 'I'
  | 'L' | 'K' | 'M' | 'F' | 'P'
  | 'S' | 'T' | 'W' | 'Y' | 'V'

export interface AminoAcidPhysicochemicalProfile {
  code: AminoAcidSingleLetter
  name: string
  molecularWeightDa: number
  hydropathyIndex: number // Kyte-Doolittle scale (-4.5 to +4.5)
  isoelectricPoint: number
  vanDerWaalsVolumeA3: number
  netChargeAtPh7: number
  hydrogenBondDonorCount: number
  hydrogenBondAcceptorCount: number
}

export interface EpitopeTargetDefinition {
  targetId: string
  targetName: string
  organism: string
  pathogenClass: 'BACTERIA_GRAM_POSITIVE' | 'BACTERIA_GRAM_NEGATIVE' | 'VIRUS_ENVELOPED' | 'FUNGUS'
  clinicalSignificance: string
  pdbAccessionReference?: string
  epitopeSequence: string
  criticalBindingResidues: readonly number[] // 1-based residue indices
  activeSiteGeometry: 'BETA_LACTAM_COORDINATION' | 'ZINC_METALLO_POCKET' | 'HYDROPHOBIC_FUSION_GROOVE' | 'SERINE_ESTERASE_TRIAD'
}

export interface DeNovoBinderCandidate {
  binderId: string
  binderName: string
  sequence: string
  targetId: string
  computedMolecularWeightDa: number
  designedScaffoldKind: 'MINIPROTEIN' | 'AFFIBODY' | 'PEPTIDE_MACROCYCLE' | 'NANOBODY_VHH'
}

export interface BindingAffinityEvaluationResult {
  targetId: string
  binderId: string
  bindingFreeEnergy_dG_kcal_mol: number // Delta G = Delta H - T * Delta S
  dissociationConstant_Kd_nM: number // Kd = exp(dG / (R * T))
  buriedSurfaceArea_A2: number // Total interface contact area in Angstroms^2
  hydrogenBondCount: number
  saltBridgeCount: number
  shapeComplementarityScore: number // 0.0 - 1.0 (Sc statistic)
  neutralizationEfficacyTier: 'HIGH_AFFINITY_NEUTRALIZER' | 'MODERATE_BINDER' | 'WEAK_SUBOPTIMAL' | 'NON_NEUTRALIZING'
  electronTransferKinetics?: {
    reorganizationEnergyLambda_eV: number
    electronicCouplingHda_meV: number
    rateConstant_kET_s1: number // Marcus electron transfer rate
  }
  truthClass: 'mechanistic_quantum_simulation_proxy'
  clinically_reviewed: false
  neverManufacturesBiomarkers: true
  evaluatedAtIso: string
}
