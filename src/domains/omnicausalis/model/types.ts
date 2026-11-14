// @panacea-claim-boundary: simulation-not-clinical
export type OmnicausalisTruthClass =
  | 'OBSERVED_CLINICAL'
  | 'DERIVED_CLINICAL'
  | 'SIMULATED_EDUCATIONAL'
  | 'REFERENCE_NORMATIVE';

export const OMNICAUSALIS_SAFETY_DISCLAIMER =
  'Simulation and research decision-support output only (clinically_reviewed=false). Never use for autonomous clinical diagnosis, prescription, or device actuation without qualified human physician review.' as const;

export interface TruthClassEnvelope<T> {
  readonly truthClass: OmnicausalisTruthClass; readonly clinicallyReviewed: false;
  readonly disclaimer: string; readonly provenanceSource: string; readonly payload: T;
}

export type KaloLumenLayerId = 'layer1_skin_soft_tissue' | 'layer2_myocardium_viscera' | 'layer3_cortical_bone_vessels';
export interface KaloLumenLayerConfig {
  readonly layerId: KaloLumenLayerId; readonly label: string; readonly hounsfieldMin: number; readonly hounsfieldMax: number;
  readonly enabled: boolean; readonly opacity: number; readonly slicePlaneEnabled: boolean; readonly sliceNormalizedPosition: number;
}
export interface KaloLumenLightingAngles { readonly azimuthDeg: number; readonly elevationDeg: number; }
export interface DirectionalVector3D { readonly x: number; readonly y: number; readonly z: number; }
export interface KaloLumenReconstructionInput {
  readonly studyId: string; readonly sliceCount: number; readonly voxelSpacingMm: readonly [number, number, number];
  readonly layers: readonly KaloLumenLayerConfig[]; readonly lighting: KaloLumenLightingAngles; readonly targetTruthClass?: OmnicausalisTruthClass;
}
export interface KaloLumenReconstructionSummary {
  readonly studyId: string; readonly activeLayerCount: number; readonly estimatedReconstructionMs: number;
  readonly subTenSecondCompliant: boolean; readonly lightDirectionVector: DirectionalVector3D; readonly layers: readonly KaloLumenLayerConfig[];
}

export type IonChannelTargetId = 'cav1_2_ltcc' | 'ryr2_sr_release';
export interface BioEmuConformationalInput {
  readonly targetId: IonChannelTargetId; readonly temperatureKelvin: number; readonly deltaGOpenMinusClosedKcalMol: number;
  readonly membranePotentialMv?: number; readonly phosphorylationFraction?: number;
}
export interface BioEmuEnsembleResult {
  readonly targetId: IonChannelTargetId; readonly temperatureKelvin: number; readonly effectiveDeltaGKcalMol: number;
  readonly openProbability: number; readonly closedProbability: number; readonly boltzmannRatioOpenToClosed: number;
}
export interface DeNovoBinderCandidateInput {
  readonly binderId: string; readonly sequence: string; readonly plddtMean: number; readonly ptmScore: number; readonly ipTmScore: number;
  readonly deltaGBindKcalMol: number; readonly buriedSurfaceAreaA2: number; readonly paeInterfaceMeanAngstrom: number; readonly sequenceIdentityToTrainingMax: number;
}
export interface DeNovoBinderAssessment {
  readonly binderId: string; readonly sequenceLength: number; readonly stabilityScore: number; readonly KdNanomolarEstimate: number;
  readonly oodEpistemicUncertainty: number; readonly highConfidenceDesign: boolean; readonly outOfDistributionFlagged: boolean;
}
export type ProteinFighterBotId = 'bot:dr_senku_kun' | 'bot:dr_makima_senpai' | 'bot:dr_satoru_sensei';
export interface ProteinFighterBotProfile {
  readonly botId: ProteinFighterBotId; readonly displayName: string; readonly specialty: string;
  readonly benchmarkStabilityScore: number; readonly signatureDialogue: string;
}
export interface ProteinFighterArenaRoundResult {
  readonly binderId: string; readonly learnerScore: number;
  readonly standings: readonly { readonly competitorId: string; readonly displayName: string; readonly score: number; readonly rank: number }[];
  readonly rivalCommentary: string;
}

export interface SepsisScreeningInput {
  readonly respiratoryRateBpm: number; readonly systolicBpMmHg: number; readonly glasgowComaScale: number;
  readonly paO2FiO2Ratio?: number; readonly platelets10e3PerUl?: number; readonly bilirubinMgDl?: number;
  readonly meanArterialPressureMmHg?: number; readonly vasopressorActive?: boolean; readonly creatinineMgDl?: number; readonly lactateMmolL?: number;
}
export interface SepsisSafeguardEvaluation {
  readonly qSofaScore: 0 | 1 | 2 | 3; readonly qSofaHighRisk: boolean; readonly sofaTotalScore: number;
  readonly organSubscores: { readonly respiration: number; readonly coagulation: number; readonly liver: number; readonly cardiovascular: number; readonly cns: number; readonly renal: number };
  readonly survivingSepsisOneHourBundle: readonly string[]; readonly requiresHumanPhysicianSignoff: true;
}
export interface RemopReceptorDoseInput {
  readonly agentName: 'norepinephrine' | 'vasopressin' | 'dobutamine';
  readonly plasmaConcentrationNm: number; readonly dissociationConstantKdNm: number; readonly hillCoefficient: number;
}
export interface RemopReceptorOccupancyResult {
  readonly agentName: string; readonly fractionalOccupancy: number; readonly hemodynamicEffectIndex: number;
}
export type VrmVisemeKey = 'aa' | 'ih' | 'ou' | 'ee' | 'oh';
export interface VisemeFrame { readonly index: number; readonly token: string; readonly viseme: VrmVisemeKey; readonly weight: number; }
export interface LongevityEnergyBalanceInput {
  readonly weightKg: number; readonly intakeProteinG: number; readonly intakeCarbsG: number; readonly intakeFatG: number;
  readonly restingMetabolicRateKcal: number; readonly workoutMet: number; readonly workoutDurationMinutes: number;
  readonly hrvRmssdMs: number; readonly sleepEfficiencyPct: number;
}
export interface LongevityEnergyBalanceSummary {
  readonly totalIntakeKcal: number; readonly workoutExpenditureKcal: number; readonly totalExpenditureKcal: number;
  readonly netEnergyBalanceKcal: number; readonly autonomicReadinessIndex: number;
}

// --- 7 Transcendental Pillars Extensions (Panacea-OS Master Mindmap) ---
export interface MitochondrialAutophagyInput {
  readonly deltaPsiMMv: number; // [-220, -40] mV
  readonly nadPlusToNadhRatio: number; // [0.1, 20]
  readonly ampkToMtorRatio: number; // [0.1, 10]
  readonly substrateOxygenSaturationPct: number; // [10, 100]
}
export interface MitochondrialAutophagySummary {
  readonly oxPhosAtpFluxIndex: number; // [0, 100]
  readonly lc3IITurnoverRate: number; // [0, 100]
  readonly pink1ParkinMitophagyActive: boolean;
  readonly lysosomalFusionEfficiencyPct: number; // [0, 100]
  readonly bioenergeticResilienceScore: number; // [0, 100]
}

export type UniversalDeviceEra = 'past_analog_digitized' | 'present_wearable_cgm' | 'future_bioimpedance_array';
export interface UniversalDeviceTelemetryInput {
  readonly deviceId: string; readonly deviceEra: UniversalDeviceEra; readonly consentVerified: boolean;
  readonly provenanceSource: string; readonly timePrecisionMs: number;
  readonly heartRateBpm: number | null; readonly hrvRmssdMs: number | null;
  readonly cgmGlucoseMgDl: number | null; readonly thoracicBioimpedanceOhm: number | null;
}
export interface UniversalDeviceEnvelopeSummary {
  readonly deviceId: string; readonly deviceEra: UniversalDeviceEra; readonly timePrecisionMs: number;
  readonly recordedChannelsCount: number; readonly missingChannels: readonly string[];
  readonly normalizedTelemetry: {
    readonly heartRateBpm: number | null; readonly hrvRmssdMs: number | null;
    readonly cgmGlucoseMgDl: number | null; readonly thoracicBioimpedanceOhm: number | null;
  };
}

export type SpecialistDomainId = 'cardiology' | 'nephrology' | 'pulmonology' | 'infectious_disease';
export interface PantheonConsensusInput {
  readonly lvefPct: number; readonly egfrMlMin173m2: number; readonly paO2FiO2Ratio: number;
  readonly lactateMmolL: number; readonly meanArterialPressureMmHg: number;
}
export interface PantheonConsensusEvaluation {
  readonly conflictDetected: boolean; readonly conflictSummary: readonly string[];
  readonly harmonizedProtocol: readonly { readonly specialist: SpecialistDomainId; readonly directive: string }[];
  readonly requiresHumanPhysicianSignoff: true;
}

export type OneOsEncounterStage = 'pre_visit' | 'bedside_encounter' | 'closed_loop_referral' | 'universal_payer_claim';
export interface OneOsEncounterPayerInput {
  readonly encounterId: string; readonly patientIdentityVerified: boolean; readonly currentStage: OneOsEncounterStage;
  readonly icd10PrimaryCode: string; readonly diagnosticReferralClosed: boolean; readonly clinicianSignedOff: boolean;
}
export interface OneOsEncounterPayerSummary {
  readonly encounterId: string; readonly currentStage: OneOsEncounterStage;
  readonly zeroLossContinuityVerified: boolean; readonly payerClaimReady: boolean; readonly blockingReasons: readonly string[];
}

export interface SensoriumBiometricsGaitInput {
  readonly cgmReadingsMgDl: readonly number[]; readonly hrvRmssdMs: number | null; readonly hrvSdnnMs: number | null;
  readonly spo2Pct: number | null; readonly mtpDorsiflexionDeg: number; readonly calcaneusFloorClearanceMm: number;
}
export interface SensoriumBiometricsGaitSummary {
  readonly cgmTimeInRangePct: number; readonly cgmTimeBelowRangePct: number; readonly cgmTimeAboveRangePct: number;
  readonly gmiEstimatedA1cPct: number; readonly hrvRmssdMs: number | null; readonly hrvSdnnMs: number | null;
  readonly spo2Pct: number | null; readonly footStrikeClassification: 'forefoot_strike' | 'midfoot_strike' | 'rearfoot_strike';
}

export interface NusantaraFunctionalDish {
  readonly dishId: string; readonly displayName: string; readonly proteinG: number;
  readonly carbsG: number; readonly fatG: number; readonly solubleFiberG: number; readonly bioactiveHighlight: string;
}
export interface LongevityExposomeInput {
  readonly chronologicalAgeYears: number; readonly phenoAgeEstimateYears: number;
  readonly fsrsCurrentStabilityDays: number; readonly daysSinceLastThermalHabit: number;
  readonly saunaMinutesWeekly: number; readonly pm25UgM3: number; readonly uvIndex: number; readonly circadianDaylightLux: number;
}
export interface LongevityExposomeSummary {
  readonly bioAgeDeltaYears: number; readonly fsrsNextStabilityDays: number;
  readonly exposomeOxidativeBurdenIndex: number; readonly longevityRecoveryScore: number;
}
export type InteractionGrammarStage = 'see' | 'ask' | 'zoom' | 'why' | 'what_if' | 'act';

export interface OmnicausalisMultiscaleCouplingInput {
  readonly bioEmuOpenProbability: number;
  readonly mitoOxPhosAtpFluxIndex: number;
  readonly mitophagyActive: boolean;
  readonly remopReceptorOccupancy: number;
  readonly sepsisSofaTotalScore: number;
  readonly cgmTimeInRangePct: number;
  readonly footStrikeClassification: 'forefoot_strike' | 'midfoot_strike' | 'rearfoot_strike';
  readonly bioAgeDeltaYears: number;
  readonly exposomeOxidativeBurdenIndex: number;
  readonly recordedDeviceChannelsCount: number;
  readonly predictionVsObservedResidualPct: number;
}

export interface OmnicausalisMultiscaleCouplingSummary {
  readonly myocardialBioenergeticReservePct: number;
  readonly coupledHemodynamicStabilityIndex: number;
  readonly vascularHyporeactivityRisk: boolean;
  readonly systemicAllostaticLoadIndex: number;
  readonly parameterIdentifiabilityVerified: boolean;
  readonly realityGapScore: number;
  readonly isolatedFromCanonicalHistory: true;
  readonly requiresHumanPhysicianSignoff: true;
  readonly counterfactualBranchSummary: string;
}

