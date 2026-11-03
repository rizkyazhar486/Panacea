// src/domains/quantum-biology/model/subcellularMitochondrialTypes.ts
// Subcellular Energetics, Chemiosmotic Coupling & Autophagic Flux Types
// Grounded in Mitchell Chemiosmosis (PMF), Marcus ET, Brand/Murphy ROS, and AMPK/mTORC1 Switch

export type SubcellularViabilityStatus =
  | 'HEALTHY_COUPLED_HOMEOSTASIS'
  | 'FASTING_AUTOPHAGIC_PROTECTION'
  | 'THERMOGENIC_UNCOUPLED'
  | 'CYTOPATHIC_SEPSIS_FAILURE'
  | 'CYTOTOXIC_AUTOPHAGIC_ARREST'

export interface SubcellularMitochondrialInput {
  readonly membranePotentialDeltaPsiMv: number // normal: -180 to -140 mV; depolarized > -100 mV; hyperpolarized < -190 mV
  readonly nadhToNadRatio: number // matrix NADH/NAD+ (normal 0.08 - 0.25; elevated > 0.40)
  readonly succinateConcentrationMm?: number // Complex II substrate (normal 0.2 - 1.0 mM)
  readonly uncouplingProteinActivityFraction?: number // 0.0 - 1.0 (UCP1/2/3 proton leak)
  readonly atpConcentrationMm?: number // matrix/cytosolic ATP (normal 3.0 - 6.0 mM)
  readonly adpConcentrationMm?: number // ADP (normal 0.5 - 1.5 mM)
  readonly ampConcentrationMm?: number // AMP (normal 0.05 - 0.25 mM)
  readonly aminoAcidAvailabilityScore?: number // 0.0 - 1.0 (mTORC1 / Rag GTPase nutrient signal)
  readonly lysosomalAcidityPh?: number // normal 4.5 - 5.0; alkalinized > 5.5
  readonly hypoxiaFractionFiO2?: number // normoxia ~0.21; hypoxia < 0.10
  readonly evaluationIsoTimestamp: string
}

export interface ElectronTransportChainFlux {
  readonly complexIActivityRate: number // 0.0 - 1.0
  readonly complexIIActivityRate: number // 0.0 - 1.0
  readonly complexIIIActivityRate: number // 0.0 - 1.0
  readonly complexIVActivityRate: number // 0.0 - 1.0
  readonly complexVAtpSynthaseRate: number // 0.0 - 1.0
  readonly totalProtonPumpingRate_H_per_sec: number // total H+ translocation flux
}

export interface ChemiosmoticBioenergetics {
  readonly membranePotentialDeltaPsiMv: number // electrical gradient Delta-Psi-m (mV)
  readonly matrixPh: number // matrix pH (~7.8)
  readonly intermembranePh: number // intermembrane space pH (~7.0)
  readonly deltaPh: number // matrixPh - intermembranePh
  readonly protonMotiveForce_pmf_mV: number // Mitchell PMF: Delta-p = Delta-Psi - 61.5 * Delta-pH (negative inward)
  readonly atpSynthesisFlux_nmol_mg_min: number // rate of ATP synthesis
  readonly basalProtonLeakFlux: number // non-ohmic exponential leak
  readonly ucpRegulatedProtonLeakFlux: number // UCP-mediated uncoupled leak
  readonly heatGenerationRate_uW: number // thermogenesis from proton dissipation
}

export interface ReactiveOxygenSpeciesDynamics {
  readonly superoxideGenerationRate_pmol_min: number // Complex I & III ROS leak
  readonly mnsodDismutationCapacity: number // matrix MnSOD scavenging capacity (0.0 - 1.0)
  readonly gpxGlutathionePeroxidaseCapacity: number // GPx/Prx reduction capacity (0.0 - 1.0)
  readonly netOxidativeStressIndex: number // 0.0 (quenched) to 1.0 (severe oxidative stress)
  readonly oxidativeStressWarning: boolean
}

export interface MetabolicNutrientRheostat {
  readonly atkinsonEnergyCharge: number // (ATP + 0.5*ADP) / (ATP + ADP + AMP)
  readonly ampToAtpRatio: number
  readonly ampkAlphaThr172Phosphorylation: number // 0.0 - 1.0 (energy stress sensor)
  readonly mtorc1Ser2448Activity: number // 0.0 - 1.0 (growth/anabolism driver)
  readonly metabolicOrientation: 'ANABOLIC_GROWTH_STORAGE' | 'BALANCED_HOMEOSTASIS' | 'CATABOLIC_AUTOPHAGIC_REPAIR'
}

export interface AutophagicFluxMitophagyState {
  readonly ulk1ComplexInitiationScore: number // 0.0 - 1.0 (activated by AMPK, inhibited by mTORC1)
  readonly lc3IILipidationRatio: number // LC3-II / total LC3 (0.0 - 1.0)
  readonly p62Sqstm1TurnoverEfficiency: number // 0.0 - 1.0 (cargo clearance)
  readonly autophagosomeClearanceRate_pct_hr: number // autophagosome turnover rate (%/hr)
  readonly mitophagyCommitmentIndex: number // 0.0 - 1.0 (PINK1/Parkin selective clearance)
  readonly lysosomalFusionStatus: 'PERFECT_ACIDIC_DEGRADATION' | 'PARTIAL_ACIDIC_IMPAIRMENT' | 'ARRESTED_ALKALINIZATION'
}

export interface SubcellularMitochondrialEvaluationResult {
  readonly evaluationTimestampIso: string
  readonly viabilityStatus: SubcellularViabilityStatus
  readonly etcFlux: ElectronTransportChainFlux
  readonly bioenergetics: ChemiosmoticBioenergetics
  readonly rosDynamics: ReactiveOxygenSpeciesDynamics
  readonly metabolicRheostat: MetabolicNutrientRheostat
  readonly autophagicFlux: AutophagicFluxMitophagyState
  readonly summaryNarrative: string
  readonly cryptographicSha256Digest: string
  readonly truthClass: 'mechanistic_simulation_proxy'
  readonly clinically_reviewed: false
  readonly requiresHumanPhysicianSignoff: false
}
