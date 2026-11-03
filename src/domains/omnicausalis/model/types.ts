// @panacea-claim-boundary: simulation-not-clinical
export type OmnicausalisTruthClass = 'OBSERVED_CLINICAL' | 'DERIVED_CLINICAL' | 'SIMULATED_EDUCATIONAL';
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
