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
