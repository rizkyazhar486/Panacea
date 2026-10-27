/**
 * PANACEAMED FRONTIER BIOMEDICAL DISCOVERY & MULTISCALE SIMULATION TYPES
 *
 * Grounded in:
 * - PANACEA_CONSTITUTION.md
 * - PANACEA_FRONTIER_BIOMEDICAL_DISCOVERY_DIRECTIVE.md
 * - PANACEA_GENESIS_DIRECTIVE.md
 * - PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md
 *
 * Strict boundary:
 * Research models, computational simulations, synthetic fixtures, and cellular atlases
 * are strictly isolated from canonical patient clinical records. They never overwrite,
 * fabricate, or back-fill signed clinical evidence.
 */

export type FrontierResearchTrackId =
  | 'track_a_neurotechnology_bci'
  | 'track_b_cardiac_ipsc_regeneration'
  | 'track_c_cellular_senescence_foxo3'
  | 'track_d_ferro_aging_acsl4'
  | 'track_e_biological_aging_clocks'
  | 'track_f_chinese_immune_atlas_cima'
  | 'track_g_human_ensemble_cell_atlas_heca'
  | 'track_h_quantum_biology_biophysics'
  | 'track_i_eurasian_cell_atlas_federation'
  | 'track_j_immersive_life_science_sandbox'
  | 'track_k_dual_use_biosecurity_neuroethics'

export type TranslationalEvidenceStage =
  | 'G0_feasibility'
  | 'G1_reproducible_prototype'
  | 'G2_external_validation'
  | 'G3_translational_partnership'
  | 'G4_preclinical_human_research'
  | 'G5_clinical_deployment'

export type ClaimLedgerStage =
  | 'HYPOTHESIS'
  | 'IN_SILICO'
  | 'REPLICATED_INDEPENDENTLY'
  | 'PRECLINICAL'
  | 'HUMAN_FEASIBILITY'
  | 'CLINICALLY_VALIDATED'
  | 'REGULATORILY_AUTHORIZED'

export type DatasetAccessPolicy =
  | 'public_open_access'
  | 'controlled_access_dac_required'
  | 'restricted_proprietary'
  | 'synthetic_benchmark_fixture'

export interface ErratumRecord {
  doi: string
  publicationDate: string
  journal: string
  description: string
  parameterImpact: string
  verified: boolean
}

export interface FrontierResearchStudyRecord {
  tClinId: string
  trackId: FrontierResearchTrackId
  conceptId: string
  title: string
  shortLabel: string
  primaryPrecedent: string
  primaryDoi?: string
  pmid?: string
  clinicalTrialId?: string
  publicationYear: number
  researchDomain: string
  targetTissueOrOrgan: string
  speciesOrPopulation: string
  evidenceStage: TranslationalEvidenceStage
  claimLedgerStage: ClaimLedgerStage
  datasetAccessPolicy: DatasetAccessPolicy
  datasetAccession?: string
  licenseAndProvenance: string
  scientificQuestion: string
  falsifiableHypothesis: string
  endpointDefinitions: string[]
  comparator: string
  sampleSizeSummary: string
  knownLimitations: string[]
  safetyBoundaries: string[]
  hasErratum: boolean
  errata?: ErratumRecord[]
  simulationEligibility: boolean
  clinicalUseEligibility: false
  nextReproducibleExperiment: string
  truthClass: 'frontier_biomedical_research_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

export interface MultiscaleCellularNode {
  organSystem: string
  organName: string
  tissueName: string
  cellOntologyId: string
  cellTypeName: string
  lineage: string
  rnaExpressionMarkers: string[]
  chromatinAccessibilityRegions: string[]
  associatedPathways: string[]
  sourceAtlas: 'hECA_v2' | 'CIMA_2026' | 'HCA_HuBMAP'
  datasetAccession: string
  accessPolicy: DatasetAccessPolicy
  singleCellProfileCount: number
  epistemicNote: string
}

export interface BciSignalSimulationInput {
  samplingRateHz: number
  durationSec: number
  rawElectrodeChannels: number
  snrDb: number
  intendedMotorDirection: 'rest' | 'hand_grasp' | 'hand_open' | 'wrist_flexion' | 'wrist_extension'
}

export interface BciDecodingResult {
  signalQualityPass: boolean
  signalNoiseRatioDb: number
  highGammaPowerBandMean: number
  decodedIntention: string
  confidenceScore: number
  uncertaintyEstimate: number
  simulatedAssistiveActuatorVector: [number, number, number]
  hardNonActuationInvariant: true
  neuralPrivacyProtected: true
  truthClass: 'bci_constrained_decoding_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
}

export interface ReviveHeartOutcomesInput {
  baseline6MwdMeters: number
  month126MwdMeters: number
  group: 'control_cabg_alone' | 'intervention_cabg_plus_hicm188'
  lvefPercentBaseline: number
  lvefPercent12Month: number
  reportedAdverseEventsCount: number
  hasVentricularArrhythmia: boolean
}

export interface ReviveHeartOutcomesResult {
  delta6MwdMeters: number
  deltaLvefPercent: number
  treatmentContrastEstimatedMeters?: number
  confidenceInterval95Percent: [number, number]
  arrhythmiaSafetyStatus: 'clean_non_arrhythmogenic' | 'safety_signal_detected'
  tumorigenicitySafetyPass: boolean
  attritionSensitivityFlag: boolean
  trialPhase: 'Phase_III_investigational'
  regulatoryApprovalClaim: false
  truthClass: 'cardiac_regeneration_trial_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
}

export interface FerroAgingKineticsInput {
  labileIronPoolMicromolar: number
  acsl4ExpressionRelative: number
  polyunsaturatedFattyAcidSubstratePePercent: number
  redoxAntioxidantReservePercent: number
  vitaminCPlasmaConcentrationMicromolar: number
}

export interface FerroAgingKineticsResult {
  lipidPeroxidationRateNominal: number
  lipidHydroperoxideAccumulationIndex: number
  ferroAgingChronicStressScore: number
  erratumCorrectionApplied: boolean
  erratumDoi: string
  correctedPUFASubstrateSpecificity: string
  fentonRadicalFluxRelative: number
  mitochondrialCristaePreservationScore: number
  antiFerroAgingLongevityMargin: number
  speciesTranslationalBoundary: 'non_human_primate_preclinical_only'
  humanDosingExtrapolationPermitted: false
  truthClass: 'ferro_aging_kinetics_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
}

export interface BiologicalAgingClockInput {
  chronologicalAgeYears: number
  clockModel: 'Horvath_2013' | 'Hannum_2013' | 'PhenoAge_2018' | 'GrimAge_2019' | 'DunedinPACE_2022'
  cpgMethylationBetaValuesCount: number
  cellTypeCompositionNormalized: boolean
  estimatedBiologicalAgeYears: number
  dunedinPaceYearsPerYear?: number
}

export interface BiologicalAgingClockResult {
  chronologicalAgeYears: number
  estimatedBiologicalAgeYears: number
  biologicalAgeGapYears: number
  clockModel: string
  clockVersion: string
  validationCohortAncestry: string
  measurementUncertaintyYears: number
  dunedinPaceRate?: number
  registryNctId: string
  registryStatusVerified: 'Recruiting_or_Active' | 'Completed' | 'Not_Available'
  modelOutputNotLifespanProof: true
  truthClass: 'biological_aging_clock_validation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
}

// ============================================================================
// TRACK H: QUANTUM BIOLOGY & BIOPHYSICAL TUNNELING (T-CLIN-72)
// ============================================================================

export interface QuantumProtonTunnelingParams {
  barrierWidthAngstroms: number // typically 0.3 - 0.9 Å in hydrogen bonds
  barrierHeightElectronVolts: number // typically 0.2 - 0.8 eV
  temperatureKelvin: number // physiological 310.15 K
  isotope: 'H' | 'D' // Hydrogen vs Deuterium for Kinetic Isotope Effect
  activeSite: 'dna_polymerase_fidelity' | 'mitochondrial_complex_I' | 'alcohol_dehydrogenase' | 'serine_protease'
}

export interface QuantumProtonTunnelingResult {
  barrierWidthAngstroms: number
  barrierHeightElectronVolts: number
  temperatureKelvin: number
  isotope: 'H' | 'D'
  activeSite: string
  transmissionProbability: number
  kineticIsotopeEffect: number // k_H / k_D ratio (> 1.0 indicates quantum tunneling)
  enzymaticRateAccelerationFactor: number
  decoherenceTimeFemtoseconds: number
  classicalArrheniusComparison: string
  truthClass: 'quantum_biophysics_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
}

export interface RadicalPairSpinParams {
  geomagneticFieldMicroTesla: number // Earth surface ~50 µT
  hyperfineCouplingMegahertz: number // Flavin-tryptophan radical pair
  radicalLifespanNanoseconds: number // ~100 - 1000 ns
}

export interface RadicalPairSpinResult {
  singletYield: number
  tripletYield: number
  magneticFieldSensitivityRatio: number
  cryptochromeCircadianPhaseShiftMinutes: number
  nonEquilibriumThermalStateConfirmed: boolean
  truthClass: 'quantum_biophysics_proxy'
  clinically_reviewed: false
}

// ============================================================================
// TRACK I: EURASIAN & INTERNATIONAL CELL ATLAS FEDERATION (T-CLIN-73)
// ============================================================================

export interface EurasianCellAtlasRecord {
  repositoryId: 'CIMA_China' | 'hECA_China' | 'CellLine_RU' | 'BioImage_Europe' | 'UniProt_Global'
  organ: string
  cellTypeName: string
  clOntologyId: string // e.g. 'CL:0000746'
  curatedMarkerGenes: readonly string[]
  lineagePredecessors: readonly string[]
  lineageSuccessors: readonly string[]
  datasetAccessPolicy: DatasetAccessPolicy
  singleCellProfileCount: number
  chromatinAccessibilityProfileCount: number
}

export interface LineageGraphNode {
  id: string
  clId: string
  name: string
  organ: string
  potency: 'totipotent' | 'pluripotent' | 'multipotent' | 'unipotent' | 'terminally_differentiated'
  empiricalLineageTracingEvidence: boolean
  isHypotheticalClusterSimilarityOnly: boolean
}

export interface LineageQueryResult {
  nodes: readonly LineageGraphNode[]
  edges: readonly { from: string; to: string; evidenceType: 'experimental_barcode' | 'transcriptomic_similarity_hypothesis' }[]
  clusterSimilarityIsNotLineageDescentEnforced: true
}

// ============================================================================
// TRACK J: IMMERSIVE LIFE-SCIENCE SIMULATION & GAMIFIED LAB (T-CLIN-74)
// ============================================================================

export type GameMissionId =
  | 'mission_cardiac_syncytium'
  | 'mission_bci_closed_loop'
  | 'mission_senescence_reversal'
  | 'mission_quantum_tunneling'

export type GameLoopState = 'idle' | 'running' | 'paused' | 'converged' | 'destabilized'

export interface GameMissionDefinition {
  id: GameMissionId
  title: string
  description: string
  organOrSystem: string
  keyParameters: readonly { id: string; label: string; min: number; max: number; defaultValue: number; unit: string }[]
  successCriteria: string
  realityCheckReminder: string
  educationalTakeaway: string
}

export interface GameChallengeState {
  missionId: GameMissionId
  loopState: GameLoopState
  stepCount: number
  score: number // 0 - 100
  stabilityIndex: number // 0.0 - 1.0
  activeParameterValues: Record<string, number>
  message: string
  targetAchieved: boolean
  educationalTakeaway: string
  realityCheckReminder: string
  truthClass: 'gamified_life_science_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
}

// ============================================================================
// TRACK K: DUAL-USE BIOSECURITY & NEUROETHICAL GOVERNANCE (T-CLIN-75)
// ============================================================================

export interface DualUseScreeningInput {
  proposedResearchTitle: string
  domain: 'neurotechnology' | 'cardiovascular_stemcell' | 'longevity_reprogramming' | 'cellular_atlas' | 'synthetic_biology'
  involvesDirectNeuralRead: boolean
  involvesDirectNeuralStimulationOrControl: boolean
  involvesAutonomousDeviceActuation: boolean
  involvesPathogenEnhancementOrToxinEngineering: boolean
  involvesNonConsensualIntervention: boolean
}

export interface DualUseScreeningReport {
  isPermitted: boolean
  governanceDecision: 'APPROVED_FOR_THERAPEUTIC_RESEARCH' | 'REJECTED_DUAL_USE_VIOLATION'
  reasons: readonly string[]
  neuroethicalCompliance: {
    mentalPrivacyPreserved: boolean
    nonCoerciveNonActuatingConfirmed: boolean
    informedConsentRequired: boolean
    chinaBciEthics2024Aligned: boolean
    unescoBioethicsAligned: boolean
  }
  biosecurityCompliance: {
    zeroPathogenEnhancement: boolean
    zeroExecutableToxinSequence: boolean
    clinicalTrialsMayNotBeSkipped: true
  }
  realityCheckSummary: string
  truthClass: 'neuroethical_governance_audit'
  clinically_reviewed: false
}
