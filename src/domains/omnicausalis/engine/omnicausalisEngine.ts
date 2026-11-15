// @panacea-claim-boundary: simulation-not-clinical
import {
  OMNICAUSALIS_SAFETY_DISCLAIMER,
  type BioEmuConformationalInput, type BioEmuEnsembleResult,
  type DeNovoBinderAssessment, type DeNovoBinderCandidateInput,
  type DirectionalVector3D, type KaloLumenLayerConfig,
  type KaloLumenLightingAngles, type KaloLumenReconstructionInput,
  type KaloLumenReconstructionSummary, type LongevityEnergyBalanceInput,
  type LongevityEnergyBalanceSummary, type LongevityExposomeInput,
  type LongevityExposomeSummary, type MitochondrialAutophagyInput,
  type MitochondrialAutophagySummary, type NusantaraFunctionalDish,
  type OmnicausalisMultiscaleCouplingInput, type OmnicausalisMultiscaleCouplingSummary,
  type OmnicausalisTruthClass, type OneOsEncounterPayerInput,
  type OneOsEncounterPayerSummary, type PantheonConsensusEvaluation,
  type PantheonConsensusInput, type ProteinFighterArenaRoundResult,
  type ProteinFighterBotProfile, type RemopReceptorDoseInput,
  type RemopReceptorOccupancyResult, type SensoriumBiometricsGaitInput,
  type SensoriumBiometricsGaitSummary, type SepsisSafeguardEvaluation,
  type SepsisScreeningInput, type TruthClassEnvelope,
  type UniversalDeviceEnvelopeSummary, type UniversalDeviceTelemetryInput,
  type VisemeFrame, type VrmVisemeKey,
} from '../model/types.ts';

const GAS_CONSTANT_KCAL_MOL_K = 0.00198720425864083;
const VALID_AMINO_ACIDS = /^[ACDEFGHIKLMNPQRSTVWY]+$/;
const VALID_ICD10 = /^[A-TV-Z][0-9][0-9AB](?:\.[0-9A-TV-Z]{1,4})?$/;

function isFiniteInRange(val: unknown, min: number, max: number): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
}

function roundTo(val: number, decimals = 4): number {
  const f = 10 ** decimals;
  return Math.round(val * f) / f;
}

export function createTruthEnvelope<T>(
  truthClass: OmnicausalisTruthClass,
  provenanceSource: string,
  payload: T
): TruthClassEnvelope<T> {
  if (!provenanceSource || typeof provenanceSource !== 'string' || !provenanceSource.trim()) {
    throw new Error('omnicausalis: provenanceSource must be a non-empty string');
  }
  if (
    truthClass !== 'OBSERVED_CLINICAL' && truthClass !== 'DERIVED_CLINICAL' &&
    truthClass !== 'SIMULATED_EDUCATIONAL' && truthClass !== 'REFERENCE_NORMATIVE'
  ) {
    throw new Error(`omnicausalis: unsupported truthClass "${String(truthClass)}"`);
  }
  return Object.freeze({
    truthClass, clinicallyReviewed: false, disclaimer: OMNICAUSALIS_SAFETY_DISCLAIMER,
    provenanceSource: provenanceSource.trim(), payload,
  });
}

export function assertTruthClassTransitionAllowed(
  sourceTruthClass: OmnicausalisTruthClass,
  targetTruthClass: OmnicausalisTruthClass
): void {
  if (sourceTruthClass === 'SIMULATED_EDUCATIONAL' && targetTruthClass !== 'SIMULATED_EDUCATIONAL') {
    throw new Error(`omnicausalis: truth-class violation — SIMULATED_EDUCATIONAL data cannot be promoted to ${targetTruthClass}`);
  }
  if (sourceTruthClass === 'REFERENCE_NORMATIVE' && (targetTruthClass === 'OBSERVED_CLINICAL' || targetTruthClass === 'DERIVED_CLINICAL')) {
    throw new Error(`omnicausalis: truth-class violation — REFERENCE_NORMATIVE cannot masquerade as ${targetTruthClass}`);
  }
  if (sourceTruthClass === 'DERIVED_CLINICAL' && targetTruthClass === 'OBSERVED_CLINICAL') {
    throw new Error('omnicausalis: truth-class violation — DERIVED_CLINICAL calculation cannot overwrite OBSERVED_CLINICAL truth');
  }
}

export const DEFAULT_KALOLUMEN_LAYERS: readonly KaloLumenLayerConfig[] = Object.freeze([
  Object.freeze({ layerId: 'layer1_skin_soft_tissue', label: 'Layer 1 — Skin & Subcutaneous Soft Tissue', hounsfieldMin: -300, hounsfieldMax: 40, enabled: true, opacity: 0.35, slicePlaneEnabled: false, sliceNormalizedPosition: 0.5 }),
  Object.freeze({ layerId: 'layer2_myocardium_viscera', label: 'Layer 2 — Myocardium & Parenchymal Viscera', hounsfieldMin: 40, hounsfieldMax: 220, enabled: true, opacity: 0.78, slicePlaneEnabled: true, sliceNormalizedPosition: 0.5 }),
  Object.freeze({ layerId: 'layer3_cortical_bone_vessels', label: 'Layer 3 — Cortical Bone & Contrast Vessels', hounsfieldMin: 220, hounsfieldMax: 3000, enabled: true, opacity: 1.0, slicePlaneEnabled: false, sliceNormalizedPosition: 0.5 }),
]);

export function computeDirectionalLightVector(angles: KaloLumenLightingAngles): DirectionalVector3D {
  if (!angles || !isFiniteInRange(angles.azimuthDeg, -180, 180) || !isFiniteInRange(angles.elevationDeg, -90, 90)) {
    throw new Error('omnicausalis: invalid KaloLumen lighting angles (azimuth [-180,180], elevation [-90,90])');
  }
  const azRad = (angles.azimuthDeg * Math.PI) / 180;
  const elRad = (angles.elevationDeg * Math.PI) / 180;
  const cosEl = Math.cos(elRad);
  return Object.freeze({ x: roundTo(cosEl * Math.sin(azRad), 6), y: roundTo(Math.sin(elRad), 6), z: roundTo(cosEl * Math.cos(azRad), 6) });
}

export function evaluateKaloLumenReconstruction(input: KaloLumenReconstructionInput): TruthClassEnvelope<KaloLumenReconstructionSummary> {
  if (!input || typeof input.studyId !== 'string' || !input.studyId.trim()) throw new Error('omnicausalis: KaloLumen studyId is required');
  if (!Number.isInteger(input.sliceCount) || input.sliceCount < 16 || input.sliceCount > 4096) throw new Error('omnicausalis: KaloLumen sliceCount must be an integer in [16, 4096]');
  if (!Array.isArray(input.voxelSpacingMm) || input.voxelSpacingMm.length !== 3 || !input.voxelSpacingMm.every((v) => isFiniteInRange(v, 0.1, 10))) {
    throw new Error('omnicausalis: KaloLumen voxelSpacingMm must be 3 finite numbers in [0.1, 10] mm');
  }
  if (!Array.isArray(input.layers) || input.layers.length !== 3) {
    throw new Error('omnicausalis: KaloLumen requires exactly 3 independent threshold surface-rendering layers');
  }
  for (const layer of input.layers) {
    if (!isFiniteInRange(layer.hounsfieldMin, -1024, 3071) || !isFiniteInRange(layer.hounsfieldMax, -1024, 3071) || layer.hounsfieldMin >= layer.hounsfieldMax) {
      throw new Error(`omnicausalis: invalid Hounsfield window on ${layer.layerId}`);
    }
    if (!isFiniteInRange(layer.opacity, 0, 1) || !isFiniteInRange(layer.sliceNormalizedPosition, 0, 1)) {
      throw new Error(`omnicausalis: invalid opacity or sliceNormalizedPosition on ${layer.layerId}`);
    }
  }
  if (input.targetTruthClass && input.targetTruthClass !== 'SIMULATED_EDUCATIONAL') {
    assertTruthClassTransitionAllowed('SIMULATED_EDUCATIONAL', input.targetTruthClass);
  }
  const lightDirectionVector = computeDirectionalLightVector(input.lighting);
  const activeLayerCount = input.layers.filter((l) => l.enabled).length;
  const estimatedReconstructionMs = Math.round(420 + input.sliceCount * 1.65 + activeLayerCount * 380);
  return createTruthEnvelope('SIMULATED_EDUCATIONAL', 'KaloLumen 3-Layer DICOM-to-3DCG Protocol', {
    studyId: input.studyId.trim(), activeLayerCount, estimatedReconstructionMs,
    subTenSecondCompliant: estimatedReconstructionMs <= 10000, lightDirectionVector,
    layers: input.layers.map((l) => Object.freeze({ ...l })),
  });
}

export function evaluateBioEmuConformationalEnsemble(input: BioEmuConformationalInput): TruthClassEnvelope<BioEmuEnsembleResult> {
  if (!input || (input.targetId !== 'cav1_2_ltcc' && input.targetId !== 'ryr2_sr_release')) throw new Error('omnicausalis: unsupported BioEmu targetId');
  if (!isFiniteInRange(input.temperatureKelvin, 273.15, 315.15)) throw new Error('omnicausalis: temperatureKelvin must be in [273.15, 315.15] K');
  if (!isFiniteInRange(input.deltaGOpenMinusClosedKcalMol, -20, 20)) throw new Error('omnicausalis: deltaGOpenMinusClosedKcalMol must be in [-20, 20] kcal/mol');

  let voltageShiftKcalMol = 0;
  if (input.membranePotentialMv !== undefined) {
    if (!isFiniteInRange(input.membranePotentialMv, -100, 60)) throw new Error('omnicausalis: membranePotentialMv must be in [-100, 60] mV');
    voltageShiftKcalMol = -0.045 * (input.membranePotentialMv + 40);
  }
  let phosShiftKcalMol = 0;
  if (input.phosphorylationFraction !== undefined) {
    if (!isFiniteInRange(input.phosphorylationFraction, 0, 1)) throw new Error('omnicausalis: phosphorylationFraction must be in [0, 1]');
    phosShiftKcalMol = -1.25 * input.phosphorylationFraction;
  }

  const effectiveDeltaGKcalMol = roundTo(input.deltaGOpenMinusClosedKcalMol + voltageShiftKcalMol + phosShiftKcalMol, 4);
  const boltzmannRatio = Math.exp(-effectiveDeltaGKcalMol / (GAS_CONSTANT_KCAL_MOL_K * input.temperatureKelvin));
  const openProbability = roundTo(boltzmannRatio / (1 + boltzmannRatio), 6);
  return createTruthEnvelope('SIMULATED_EDUCATIONAL', 'BioEmu-2 Boltzmann Equilibrium Conformational Ensemble Proxy', {
    targetId: input.targetId, temperatureKelvin: input.temperatureKelvin, effectiveDeltaGKcalMol,
    openProbability, closedProbability: roundTo(1 - openProbability, 6), boltzmannRatioOpenToClosed: roundTo(boltzmannRatio, 6),
  });
}

export function evaluateDeNovoBinderCandidate(input: DeNovoBinderCandidateInput): TruthClassEnvelope<DeNovoBinderAssessment> {
  if (!input || typeof input.binderId !== 'string' || !input.binderId.trim()) throw new Error('omnicausalis: binderId is required');
  const seq = (input.sequence ?? '').trim().toUpperCase();
  if (seq.length < 15 || seq.length > 1000 || !VALID_AMINO_ACIDS.test(seq)) throw new Error('omnicausalis: sequence must be 15..1000 canonical amino acid residues');
  if (!isFiniteInRange(input.plddtMean, 0, 100) || !isFiniteInRange(input.ptmScore, 0, 1) || !isFiniteInRange(input.ipTmScore, 0, 1)) {
    throw new Error('omnicausalis: plddtMean [0,100], ptmScore [0,1], ipTmScore [0,1] required');
  }
  if (!isFiniteInRange(input.deltaGBindKcalMol, -30, 10) || !isFiniteInRange(input.buriedSurfaceAreaA2, 0, 6000)) {
    throw new Error('omnicausalis: deltaGBindKcalMol [-30,10] or buriedSurfaceAreaA2 [0,6000] out of bounds');
  }
  if (!isFiniteInRange(input.paeInterfaceMeanAngstrom, 0, 35) || !isFiniteInRange(input.sequenceIdentityToTrainingMax, 0, 1)) {
    throw new Error('omnicausalis: paeInterfaceMeanAngstrom [0,35] or sequenceIdentityToTrainingMax [0,1] out of bounds');
  }

  const kdMolar = Math.exp(input.deltaGBindKcalMol / (GAS_CONSTANT_KCAL_MOL_K * 310.15));
  const KdNanomolarEstimate = roundTo(Math.min(1e9, Math.max(1e-4, kdMolar * 1e9)), 4);
  const oodEpistemicUncertainty = roundTo(
    Math.min(1, Math.max(0, 0.55 * (1 - input.sequenceIdentityToTrainingMax) + 0.25 * (input.paeInterfaceMeanAngstrom / 35) + 0.2 * (1 - input.ptmScore))), 4
  );
  const outOfDistributionFlagged = oodEpistemicUncertainty >= 0.45 || input.sequenceIdentityToTrainingMax < 0.25;
  const affinityComponent = Math.min(30, Math.max(0, (-input.deltaGBindKcalMol / 15) * 30));
  const bsaComponent = Math.min(15, (input.buriedSurfaceAreaA2 / 1800) * 15);
  const stabilityScore = roundTo(Math.min(100, Math.max(0, 0.25 * input.plddtMean + 30 * input.ipTmScore + affinityComponent + bsaComponent - 15 * oodEpistemicUncertainty)), 2);
  const highConfidenceDesign = !outOfDistributionFlagged && input.plddtMean >= 80 && input.ipTmScore >= 0.75 && input.paeInterfaceMeanAngstrom <= 10 && input.deltaGBindKcalMol <= -8.0;

  return createTruthEnvelope('SIMULATED_EDUCATIONAL', 'BindCraft2 / FastPLM / ProteinDesign-OOD Composite Evaluator', {
    binderId: input.binderId.trim(), sequenceLength: seq.length, stabilityScore, KdNanomolarEstimate,
    oodEpistemicUncertainty, highConfidenceDesign, outOfDistributionFlagged,
  });
}

export const PROTEIN_FIGHTER_BOTS: readonly ProteinFighterBotProfile[] = Object.freeze([
  Object.freeze({ botId: 'bot:dr_senku_kun', displayName: 'Dr. Senku-Kun', specialty: 'Ten-Billion-Percent Rational Hydrophobic Core Packing', benchmarkStabilityScore: 76.5, signatureDialogue: 'Exhilarating! Ten billion percent of de novo binder stability comes down to buried non-polar surface area and salt-bridge geometry!' }),
  Object.freeze({ botId: 'bot:dr_makima_senpai', displayName: 'Dr. Makima-Senpai', specialty: 'High-Affinity Allosteric Interface Control', benchmarkStabilityScore: 84.0, signatureDialogue: 'A binder that cannot command an ipTM above 0.80 will never control the target receptor conformation.' }),
  Object.freeze({ botId: 'bot:dr_satoru_sensei', displayName: 'Dr. Satoru-Sensei', specialty: 'Limitless Free-Energy Landscape & Zero-PAE Convergence', benchmarkStabilityScore: 91.5, signatureDialogue: 'Throughout folding space and Boltz equilibrium, when PAE approaches zero and delta-G drops below -12 kcal/mol, your binder is untouchable.' }),
]);

export function runProteinFighterArenaRound(assessmentEnvelope: TruthClassEnvelope<DeNovoBinderAssessment>): TruthClassEnvelope<ProteinFighterArenaRoundResult> {
  const a = assessmentEnvelope.payload;
  const rows = [
    { competitorId: 'learner', displayName: `Learner (${a.binderId})`, score: a.stabilityScore, rank: 0 },
    ...PROTEIN_FIGHTER_BOTS.map((b) => ({ competitorId: b.botId, displayName: b.displayName, score: b.benchmarkStabilityScore, rank: 0 })),
  ].sort((x, y) => y.score - x.score || x.competitorId.localeCompare(y.competitorId));
  const standings = rows.map((r, idx) => Object.freeze({ ...r, rank: idx + 1 }));
  const learnerRank = standings.find((s) => s.competitorId === 'learner')!.rank;
  const rivalBot = learnerRank === 1 ? PROTEIN_FIGHTER_BOTS[2]! : learnerRank === 2 ? PROTEIN_FIGHTER_BOTS[1]! : PROTEIN_FIGHTER_BOTS[0]!;
  return createTruthEnvelope('SIMULATED_EDUCATIONAL', 'ProteinFighter Structural Stability Arena', {
    binderId: a.binderId, learnerScore: a.stabilityScore, standings, rivalCommentary: `${rivalBot.displayName}: "${rivalBot.signatureDialogue}"`,
  });
}

export function evaluateSepsisSafeguard(input: SepsisScreeningInput): TruthClassEnvelope<SepsisSafeguardEvaluation> {
  if (!input || !isFiniteInRange(input.respiratoryRateBpm, 0, 80)) throw new Error('omnicausalis: respiratoryRateBpm must be a finite number in [0, 80]');
  if (!isFiniteInRange(input.systolicBpMmHg, 30, 300)) throw new Error('omnicausalis: systolicBpMmHg must be a finite number in [30, 300]');
  if (!Number.isInteger(input.glasgowComaScale) || !isFiniteInRange(input.glasgowComaScale, 3, 15)) throw new Error('omnicausalis: glasgowComaScale must be an integer in [3, 15]');

  const qSofaScore = ((input.respiratoryRateBpm >= 22 ? 1 : 0) + (input.systolicBpMmHg <= 100 ? 1 : 0) + (input.glasgowComaScale < 15 ? 1 : 0)) as 0 | 1 | 2 | 3;
  const respiration = input.paO2FiO2Ratio === undefined ? 0 : input.paO2FiO2Ratio < 100 ? 4 : input.paO2FiO2Ratio < 200 ? 3 : input.paO2FiO2Ratio < 300 ? 2 : input.paO2FiO2Ratio < 400 ? 1 : 0;
  const coagulation = input.platelets10e3PerUl === undefined ? 0 : input.platelets10e3PerUl < 20 ? 4 : input.platelets10e3PerUl < 50 ? 3 : input.platelets10e3PerUl < 100 ? 2 : input.platelets10e3PerUl < 150 ? 1 : 0;
  const liver = input.bilirubinMgDl === undefined ? 0 : input.bilirubinMgDl >= 12 ? 4 : input.bilirubinMgDl >= 6 ? 3 : input.bilirubinMgDl >= 2 ? 2 : input.bilirubinMgDl >= 1.2 ? 1 : 0;
  const cardiovascular = input.vasopressorActive ? 3 : input.meanArterialPressureMmHg !== undefined && input.meanArterialPressureMmHg < 70 ? 1 : 0;
  const cns = input.glasgowComaScale < 6 ? 4 : input.glasgowComaScale <= 9 ? 3 : input.glasgowComaScale <= 12 ? 2 : input.glasgowComaScale <= 14 ? 1 : 0;
  const renal = input.creatinineMgDl === undefined ? 0 : input.creatinineMgDl >= 5 ? 4 : input.creatinineMgDl >= 3.5 ? 3 : input.creatinineMgDl >= 2 ? 2 : input.creatinineMgDl >= 1.2 ? 1 : 0;

  const sofaTotalScore = respiration + coagulation + liver + cardiovascular + cns + renal;
  const qSofaHighRisk = qSofaScore >= 2 || sofaTotalScore >= 2;
  const bundle: string[] = [];
  if (qSofaHighRisk) {
    bundle.push('1. Measure serum lactate level (remeasure within 2-4h if initial lactate > 2 mmol/L).');
    bundle.push('2. Obtain blood cultures prior to administration of antimicrobials.');
    bundle.push('3. Administer broad-spectrum antimicrobials (requires attending physician order & sign-off).');
    if (input.systolicBpMmHg < 90 || (input.meanArterialPressureMmHg !== undefined && input.meanArterialPressureMmHg < 65) || (input.lactateMmolL !== undefined && input.lactateMmolL >= 4)) {
      bundle.push('4. Begin rapid administration of 30 mL/kg crystalloid for hypotension or lactate >= 4 mmol/L (physician-governed).');
      bundle.push('5. Apply vasopressors if hypotensive during or after fluid resuscitation to maintain MAP >= 65 mmHg (physician-governed).');
    }
  }
  return createTruthEnvelope('DERIVED_CLINICAL', 'Surviving Sepsis Campaign 2021 / Sepsis-3 Consensus', {
    qSofaScore, qSofaHighRisk, sofaTotalScore,
    organSubscores: Object.freeze({ respiration, coagulation, liver, cardiovascular, cns, renal }),
    survivingSepsisOneHourBundle: Object.freeze(bundle), requiresHumanPhysicianSignoff: true,
  });
}

export function evaluateRemopReceptorOccupancy(input: RemopReceptorDoseInput): TruthClassEnvelope<RemopReceptorOccupancyResult> {
  if (!input || (input.agentName !== 'norepinephrine' && input.agentName !== 'vasopressin' && input.agentName !== 'dobutamine')) throw new Error('omnicausalis: unsupported REMOP agentName');
  if (!isFiniteInRange(input.plasmaConcentrationNm, 0, 10000) || !isFiniteInRange(input.dissociationConstantKdNm, 0.001, 10000) || !isFiniteInRange(input.hillCoefficient, 0.5, 4)) {
    throw new Error('omnicausalis: REMOP concentration, Kd, or Hill coefficient out of bounds');
  }
  if (input.plasmaConcentrationNm === 0) {
    return createTruthEnvelope('SIMULATED_EDUCATIONAL', 'REMOP Hill-Langmuir Receptor Pharmacodynamics', { agentName: input.agentName, fractionalOccupancy: 0, hemodynamicEffectIndex: 0 });
  }
  const cn = input.plasmaConcentrationNm ** input.hillCoefficient;
  const kdn = input.dissociationConstantKdNm ** input.hillCoefficient;
  const occ = roundTo(cn / (cn + kdn), 6);
  return createTruthEnvelope('SIMULATED_EDUCATIONAL', 'REMOP Hill-Langmuir Receptor Pharmacodynamics', {
    agentName: input.agentName, fractionalOccupancy: occ, hemodynamicEffectIndex: roundTo(occ * 100, 2),
  });
}

export function mapTextToVrmVisemeFrames(utterance: string): readonly VisemeFrame[] {
  if (typeof utterance !== 'string') throw new Error('omnicausalis: utterance must be a string');
  const tokens = utterance.trim().split(/\s+/).filter((t) => t.length > 0);
  return Object.freeze(tokens.map((token, index): VisemeFrame => {
    const lower = token.toLowerCase();
    let viseme: VrmVisemeKey = 'aa';
    if (/[o]/.test(lower) && /u|w/.test(lower)) viseme = 'ou';
    else if (/ee|ea|ie|y/.test(lower)) viseme = 'ee';
    else if (/i/.test(lower)) viseme = 'ih';
    else if (/o/.test(lower)) viseme = 'oh';
    else if (/u/.test(lower)) viseme = 'ou';
    const weight = roundTo(Math.min(1, 0.55 + Math.min(token.length, 9) * 0.05), 2);
    return Object.freeze({ index, token, viseme, weight });
  }));
}

export function evaluateLongevityEnergyBalance(input: LongevityEnergyBalanceInput): TruthClassEnvelope<LongevityEnergyBalanceSummary> {
  if (!input || !isFiniteInRange(input.weightKg, 20, 250)) throw new Error('omnicausalis: weightKg must be in [20, 250] kg');
  if (!isFiniteInRange(input.intakeProteinG, 0, 500) || !isFiniteInRange(input.intakeCarbsG, 0, 1200) || !isFiniteInRange(input.intakeFatG, 0, 400)) {
    throw new Error('omnicausalis: macronutrient grams out of valid physiological bounds');
  }
  if (!isFiniteInRange(input.restingMetabolicRateKcal, 600, 4000) || !isFiniteInRange(input.workoutMet, 1, 22) || !isFiniteInRange(input.workoutDurationMinutes, 0, 600)) {
    throw new Error('omnicausalis: RMR, workoutMet, or workoutDurationMinutes out of bounds');
  }
  if (!isFiniteInRange(input.hrvRmssdMs, 5, 250) || !isFiniteInRange(input.sleepEfficiencyPct, 0, 100)) {
    throw new Error('omnicausalis: hrvRmssdMs or sleepEfficiencyPct out of bounds');
  }
  const totalIntakeKcal = roundTo(input.intakeProteinG * 4 + input.intakeCarbsG * 4 + input.intakeFatG * 9, 1);
  const workoutExpenditureKcal = roundTo(((input.workoutMet * 3.5 * input.weightKg) / 200) * input.workoutDurationMinutes, 1);
  const totalExpenditureKcal = roundTo(input.restingMetabolicRateKcal + workoutExpenditureKcal, 1);
  const netEnergyBalanceKcal = roundTo(totalIntakeKcal - totalExpenditureKcal, 1);
  const autonomicReadinessIndex = roundTo(Math.min(100, Math.max(0, Math.min(50, (Math.log(input.hrvRmssdMs) / Math.log(120)) * 50) + (input.sleepEfficiencyPct / 100) * 50)), 1);
  return createTruthEnvelope('DERIVED_CLINICAL', 'Atwater Macronutrient Equivalents & Ainsworth Compendium of Physical Activities', {
    totalIntakeKcal, workoutExpenditureKcal, totalExpenditureKcal, netEnergyBalanceKcal, autonomicReadinessIndex,
  });
}

// --- 7 Transcendental Pillars Extensions ---

export function evaluateMitochondrialAutophagyDynamics(input: MitochondrialAutophagyInput): TruthClassEnvelope<MitochondrialAutophagySummary> {
  if (!input || !isFiniteInRange(input.deltaPsiMMv, -220, -40)) throw new Error('omnicausalis: deltaPsiMMv must be in [-220, -40] mV');
  if (!isFiniteInRange(input.nadPlusToNadhRatio, 0.1, 20) || !isFiniteInRange(input.ampkToMtorRatio, 0.1, 10)) {
    throw new Error('omnicausalis: nadPlusToNadhRatio [0.1,20] or ampkToMtorRatio [0.1,10] out of bounds');
  }
  if (!isFiniteInRange(input.substrateOxygenSaturationPct, 10, 100)) throw new Error('omnicausalis: substrateOxygenSaturationPct must be in [10, 100]');

  const psiNormalized = Math.min(1, Math.max(0, (-input.deltaPsiMMv - 60) / 120));
  const redoxFactor = Math.min(1, input.nadPlusToNadhRatio / 5);
  const oxPhosAtpFluxIndex = roundTo(Math.min(100, Math.max(0, 100 * psiNormalized * (0.65 + 0.35 * redoxFactor) * (input.substrateOxygenSaturationPct / 100))), 2);
  const lc3IITurnoverRate = roundTo(Math.min(100, Math.max(0, (Math.atan(input.ampkToMtorRatio / 1.5) / (Math.PI / 2)) * 100)), 2);
  const pink1ParkinMitophagyActive = input.deltaPsiMMv > -110;
  const lysosomalFusionEfficiencyPct = roundTo(Math.min(100, Math.max(0, 0.6 * lc3IITurnoverRate + 40 * redoxFactor)), 2);
  const bioenergeticResilienceScore = roundTo(0.55 * oxPhosAtpFluxIndex + 0.45 * lysosomalFusionEfficiencyPct, 2);

  return createTruthEnvelope('SIMULATED_EDUCATIONAL', 'Mitochondrial OxPhos Proton-Motive Force & AMPK/mTOR Autophagy Kinetics Model', {
    oxPhosAtpFluxIndex, lc3IITurnoverRate, pink1ParkinMitophagyActive, lysosomalFusionEfficiencyPct, bioenergeticResilienceScore,
  });
}

export function translateUniversalDeviceEnvelope(input: UniversalDeviceTelemetryInput): TruthClassEnvelope<UniversalDeviceEnvelopeSummary> {
  if (!input || !input.consentVerified) throw new Error('omnicausalis: UDT-OS requires explicit consentVerified === true');
  if (typeof input.deviceId !== 'string' || !input.deviceId.trim()) throw new Error('omnicausalis: deviceId is required');
  if (!isFiniteInRange(input.timePrecisionMs, 1, 86400000)) throw new Error('omnicausalis: timePrecisionMs must be in [1, 86400000] ms');

  const checkNullable = (v: number | null, min: number, max: number, name: string): number | null => {
    if (v === null) return null;
    if (!isFiniteInRange(v, min, max)) throw new Error(`omnicausalis: ${name} out of valid physiological bounds [${min}, ${max}]`);
    return v;
  };
  const heartRateBpm = checkNullable(input.heartRateBpm, 20, 260, 'heartRateBpm');
  const hrvRmssdMs = checkNullable(input.hrvRmssdMs, 2, 300, 'hrvRmssdMs');
  const cgmGlucoseMgDl = checkNullable(input.cgmGlucoseMgDl, 20, 600, 'cgmGlucoseMgDl');
  const thoracicBioimpedanceOhm = checkNullable(input.thoracicBioimpedanceOhm, 10, 150, 'thoracicBioimpedanceOhm');

  const missingChannels: string[] = [];
  if (heartRateBpm === null) missingChannels.push('heartRateBpm');
  if (hrvRmssdMs === null) missingChannels.push('hrvRmssdMs');
  if (cgmGlucoseMgDl === null) missingChannels.push('cgmGlucoseMgDl');
  if (thoracicBioimpedanceOhm === null) missingChannels.push('thoracicBioimpedanceOhm');

  const truthClass: OmnicausalisTruthClass = input.deviceEra === 'past_analog_digitized' ? 'REFERENCE_NORMATIVE' : 'OBSERVED_CLINICAL';
  return createTruthEnvelope(truthClass, input.provenanceSource, {
    deviceId: input.deviceId.trim(), deviceEra: input.deviceEra, timePrecisionMs: input.timePrecisionMs,
    recordedChannelsCount: 4 - missingChannels.length, missingChannels: Object.freeze(missingChannels),
    normalizedTelemetry: Object.freeze({ heartRateBpm, hrvRmssdMs, cgmGlucoseMgDl, thoracicBioimpedanceOhm }),
  });
}

export function evaluatePantheonMultiSpecialistConsensus(input: PantheonConsensusInput): TruthClassEnvelope<PantheonConsensusEvaluation> {
  if (!input || !isFiniteInRange(input.lvefPct, 10, 85) || !isFiniteInRange(input.egfrMlMin173m2, 2, 160)) {
    throw new Error('omnicausalis: lvefPct [10,85] and egfrMlMin173m2 [2,160] required');
  }
  if (!isFiniteInRange(input.paO2FiO2Ratio, 30, 600) || !isFiniteInRange(input.lactateMmolL, 0.2, 30) || !isFiniteInRange(input.meanArterialPressureMmHg, 25, 180)) {
    throw new Error('omnicausalis: paO2FiO2Ratio, lactateMmolL, or meanArterialPressureMmHg out of bounds');
  }
  const conflictSummary: string[] = [];
  if ((input.lactateMmolL >= 2.5 || input.meanArterialPressureMmHg < 65) && (input.lvefPct < 40 || input.paO2FiO2Ratio < 200)) {
    conflictSummary.push('Volume Resuscitation vs Cardiopulmonary Congestion: Sepsis hypoperfusion favors crystalloid bolus, whereas HFrEF (LVEF < 40%) or ARDS (P/F < 200) risks pulmonary edema.');
  }
  if (input.lactateMmolL >= 2.0 && input.egfrMlMin173m2 < 45) {
    conflictSummary.push('Empiric Antimicrobial Clearance vs Renal Function: Sepsis requires immediate broad-spectrum coverage, whereas eGFR < 45 mL/min/1.73m2 requires renal dose adjustment and nephrotoxin avoidance.');
  }
  const harmonizedProtocol = Object.freeze([
    Object.freeze({ specialist: 'cardiology' as const, directive: input.lvefPct < 40 ? 'Use dynamic stroke-volume / passive-leg-raise responsiveness with 250 mL aliquots and early norepinephrine to maintain MAP >= 65 mmHg.' : 'Standard hemodynamic preload optimization with MAP >= 65 mmHg.' }),
    Object.freeze({ specialist: 'nephrology' as const, directive: input.egfrMlMin173m2 < 45 ? 'Use balanced crystalloids (avoid hyperchloremic 0.9% NaCl) and adjust maintenance antimicrobial intervals to eGFR.' : 'Monitor hourly urine output >= 0.5 mL/kg/h and serial creatinine.' }),
    Object.freeze({ specialist: 'pulmonology' as const, directive: input.paO2FiO2Ratio < 200 ? 'Lung-protective ventilation (6 mL/kg PBW, plateau pressure <= 30 cmH2O) and conservative post-stabilization fluid balance.' : 'Maintain SpO2 92-96% and monitor work of breathing.' }),
    Object.freeze({ specialist: 'infectious_disease' as const, directive: 'Obtain paired blood cultures prior to full-loading-dose empiric antimicrobials; re-evaluate de-escalation at 48h.' }),
  ]);
  return createTruthEnvelope('DERIVED_CLINICAL', 'Pantheon Multi-Specialist Comorbidity Consensus Engine', {
    conflictDetected: conflictSummary.length > 0, conflictSummary: Object.freeze(conflictSummary),
    harmonizedProtocol, requiresHumanPhysicianSignoff: true,
  });
}

export function evaluateOneOsEncounterPayerHarmonization(input: OneOsEncounterPayerInput): TruthClassEnvelope<OneOsEncounterPayerSummary> {
  if (!input || typeof input.encounterId !== 'string' || !input.encounterId.trim()) throw new Error('omnicausalis: encounterId is required');
  const blockingReasons: string[] = [];
  if (!input.patientIdentityVerified) blockingReasons.push('patient_identity_unverified');
  if (!VALID_ICD10.test((input.icd10PrimaryCode ?? '').trim().toUpperCase())) blockingReasons.push('invalid_or_missing_icd10_code');
  if (!input.diagnosticReferralClosed) blockingReasons.push('closed_loop_referral_pending');
  if (!input.clinicianSignedOff) blockingReasons.push('clinician_signature_required');

  return createTruthEnvelope('DERIVED_CLINICAL', 'One-OS Longitudinal Encounter & Universal Payer Readiness Gate', {
    encounterId: input.encounterId.trim(), currentStage: input.currentStage,
    zeroLossContinuityVerified: input.patientIdentityVerified && input.diagnosticReferralClosed,
    payerClaimReady: blockingReasons.length === 0, blockingReasons: Object.freeze(blockingReasons),
  });
}

export function evaluateSensoriumBiometricsAndGait(input: SensoriumBiometricsGaitInput): TruthClassEnvelope<SensoriumBiometricsGaitSummary> {
  if (!input || !Array.isArray(input.cgmReadingsMgDl) || input.cgmReadingsMgDl.length === 0) {
    throw new Error('omnicausalis: cgmReadingsMgDl must be a non-empty array of glucose values');
  }
  for (const g of input.cgmReadingsMgDl) {
    if (!isFiniteInRange(g, 20, 600)) throw new Error('omnicausalis: CGM reading out of [20, 600] mg/dL');
  }
  if (!isFiniteInRange(input.mtpDorsiflexionDeg, -45, 75) || !isFiniteInRange(input.calcaneusFloorClearanceMm, 0, 250)) {
    throw new Error('omnicausalis: MTP dorsiflexion or calcaneus clearance out of bounds');
  }
  const n = input.cgmReadingsMgDl.length;
  const inRange = input.cgmReadingsMgDl.filter((g) => g >= 70 && g <= 180).length;
  const below = input.cgmReadingsMgDl.filter((g) => g < 70).length;
  const above = input.cgmReadingsMgDl.filter((g) => g > 180).length;
  const meanGlucose = input.cgmReadingsMgDl.reduce((acc, g) => acc + g, 0) / n;
  const gmiEstimatedA1cPct = roundTo(3.31 + 0.02392 * meanGlucose, 2);
  const footStrikeClassification =
    input.calcaneusFloorClearanceMm >= 15 && input.mtpDorsiflexionDeg >= 12
      ? 'forefoot_strike'
      : input.calcaneusFloorClearanceMm < 5
        ? 'rearfoot_strike'
        : 'midfoot_strike';

  return createTruthEnvelope('DERIVED_CLINICAL', 'Sensorium CGM International Consensus & Markerless 3D MTP Gait Kinematics', {
    cgmTimeInRangePct: roundTo((inRange / n) * 100, 1), cgmTimeBelowRangePct: roundTo((below / n) * 100, 1),
    cgmTimeAboveRangePct: roundTo((above / n) * 100, 1), gmiEstimatedA1cPct,
    hrvRmssdMs: input.hrvRmssdMs, hrvSdnnMs: input.hrvSdnnMs, spo2Pct: input.spo2Pct, footStrikeClassification,
  });
}

export const NUSANTARA_FUNCTIONAL_DISHES: readonly NusantaraFunctionalDish[] = Object.freeze([
  Object.freeze({ dishId: 'tempe_fermentasi_isoflavon', displayName: 'Tempe Kedelai Fermentasi Panggang', proteinG: 31, carbsG: 16, fatG: 14, solubleFiberG: 7.5, bioactiveHighlight: 'Aglycone Soy Isoflavones (Genistein/Daidzein) & Postbiotic Paraprobiotics' }),
  Object.freeze({ dishId: 'ikan_gabus_pepes_albumin', displayName: 'Pepes Ikan Gabus (Channa striata) Kunyit', proteinG: 38, carbsG: 5, fatG: 7, solubleFiberG: 2.2, bioactiveHighlight: 'Bioavailable Serum Albumin Precursors, Zinc & Curcuminoids' }),
  Object.freeze({ dishId: 'sayur_kelor_moringa_bening', displayName: 'Sayur Bening Daun Kelor (Moringa oleifera)', proteinG: 9, carbsG: 14, fatG: 2, solubleFiberG: 6.8, bioactiveHighlight: 'Sulforaphane-like Isothiocyanates, Quercetin & Nrf2 Activators' }),
  Object.freeze({ dishId: 'nasi_merah_antosianin', displayName: 'Nasi Beras Merah Organik & Kacang Hijau', proteinG: 11, carbsG: 48, fatG: 3, solubleFiberG: 6.4, bioactiveHighlight: 'Cyanidin-3-Glucoside Anthocyanins & Resistant Starch Butyrate Substrate' }),
]);

export function evaluateLongevityNutritionAndExposome(input: LongevityExposomeInput): TruthClassEnvelope<LongevityExposomeSummary> {
  if (!input || !isFiniteInRange(input.chronologicalAgeYears, 18, 120) || !isFiniteInRange(input.phenoAgeEstimateYears, 15, 130)) {
    throw new Error('omnicausalis: chronologicalAgeYears [18,120] and phenoAgeEstimateYears [15,130] required');
  }
  if (!isFiniteInRange(input.fsrsCurrentStabilityDays, 0.5, 3650) || !isFiniteInRange(input.daysSinceLastThermalHabit, 0, 365)) {
    throw new Error('omnicausalis: FSRS stability or daysSinceLastThermalHabit out of bounds');
  }
  if (!isFiniteInRange(input.saunaMinutesWeekly, 0, 300) || !isFiniteInRange(input.pm25UgM3, 0, 500) || !isFiniteInRange(input.uvIndex, 0, 20) || !isFiniteInRange(input.circadianDaylightLux, 0, 120000)) {
    throw new Error('omnicausalis: saunaMinutesWeekly, pm25UgM3, uvIndex, or circadianDaylightLux out of bounds');
  }
  const bioAgeDeltaYears = roundTo(input.phenoAgeEstimateYears - input.chronologicalAgeYears, 2);
  const retrievability = Math.exp(-input.daysSinceLastThermalHabit / Math.max(1, input.fsrsCurrentStabilityDays));
  const fsrsNextStabilityDays = roundTo(input.fsrsCurrentStabilityDays * (1 + 0.22 * (1 - 0.5 * retrievability)), 2);
  const pm25Penalty = Math.min(60, (input.pm25UgM3 / 35) * 35);
  const uvPenalty = input.uvIndex > 8 ? (input.uvIndex - 8) * 3 : 0;
  const luxProtection = Math.min(18, (Math.log10(Math.max(10, input.circadianDaylightLux)) / 4) * 18);
  const exposomeOxidativeBurdenIndex = roundTo(Math.min(100, Math.max(0, 20 + pm25Penalty + uvPenalty - luxProtection)), 1);
  const thermalBonus = Math.min(20, (input.saunaMinutesWeekly / 60) * 15);
  const longevityRecoveryScore = roundTo(Math.min(100, Math.max(0, 75 - bioAgeDeltaYears * 2.5 + thermalBonus - exposomeOxidativeBurdenIndex * 0.35)), 1);

  return createTruthEnvelope('SIMULATED_EDUCATIONAL', 'FSRS Circadian/Thermal Habit Engine, PhenoAge Delta & Planetary Exposome Matrix', {
    bioAgeDeltaYears, fsrsNextStabilityDays, exposomeOxidativeBurdenIndex, longevityRecoveryScore,
  });
}

export function evaluateOmnicausalisMultiscaleCoupling(
  input: OmnicausalisMultiscaleCouplingInput,
): TruthClassEnvelope<OmnicausalisMultiscaleCouplingSummary> {
  if (!input || !isFiniteInRange(input.bioEmuOpenProbability, 0, 1) || !isFiniteInRange(input.mitoOxPhosAtpFluxIndex, 0, 100)) {
    throw new Error('omnicausalis: bioEmuOpenProbability [0,1] and mitoOxPhosAtpFluxIndex [0,100] required');
  }
  if (!isFiniteInRange(input.remopReceptorOccupancy, 0, 1) || !isFiniteInRange(input.sepsisSofaTotalScore, 0, 24)) {
    throw new Error('omnicausalis: remopReceptorOccupancy [0,1] and sepsisSofaTotalScore [0,24] required');
  }
  if (!isFiniteInRange(input.cgmTimeInRangePct, 0, 100) || !isFiniteInRange(input.bioAgeDeltaYears, -40, 40) || !isFiniteInRange(input.exposomeOxidativeBurdenIndex, 0, 100)) {
    throw new Error('omnicausalis: cgmTimeInRangePct, bioAgeDeltaYears, or exposomeOxidativeBurdenIndex out of bounds');
  }
  if (!Number.isInteger(input.recordedDeviceChannelsCount) || !isFiniteInRange(input.recordedDeviceChannelsCount, 0, 32) || !isFiniteInRange(input.predictionVsObservedResidualPct, 0, 100)) {
    throw new Error('omnicausalis: recordedDeviceChannelsCount [0,32] integer and predictionVsObservedResidualPct [0,100] required');
  }

  const calciumCouplingEfficiency = 1 - Math.abs(input.bioEmuOpenProbability - 0.55) * 0.8;
  const mitophagyPenalty = input.mitophagyActive ? 14 : 0;
  const myocardialBioenergeticReservePct = roundTo(
    Math.min(100, Math.max(0, input.mitoOxPhosAtpFluxIndex * calciumCouplingEfficiency - mitophagyPenalty)),
    1,
  );

  const sofaBurdenPenalty = (input.sepsisSofaTotalScore / 24) * 55;
  const receptorSupportBonus = input.remopReceptorOccupancy * 28 * (myocardialBioenergeticReservePct / 100);
  const coupledHemodynamicStabilityIndex = roundTo(
    Math.min(100, Math.max(0, 0.65 * myocardialBioenergeticReservePct + receptorSupportBonus - sofaBurdenPenalty)),
    1,
  );

  const vascularHyporeactivityRisk =
    input.remopReceptorOccupancy >= 0.65 && (myocardialBioenergeticReservePct < 45 || input.sepsisSofaTotalScore >= 8);

  const gaitLoadPenalty = input.footStrikeClassification === 'rearfoot_strike' ? 8 : input.footStrikeClassification === 'midfoot_strike' ? 3 : 0;
  const glycemicDysregulation = (100 - input.cgmTimeInRangePct) * 0.45;
  const agingPenalty = Math.max(0, input.bioAgeDeltaYears) * 2.2;
  const systemicAllostaticLoadIndex = roundTo(
    Math.min(100, Math.max(0, glycemicDysregulation + input.exposomeOxidativeBurdenIndex * 0.4 + agingPenalty + gaitLoadPenalty)),
    1,
  );

  const parameterIdentifiabilityVerified =
    input.recordedDeviceChannelsCount >= 3 && input.predictionVsObservedResidualPct <= 15;
  const unrecordedChannelPenalty = Math.max(0, 4 - input.recordedDeviceChannelsCount) * 8;
  const realityGapScore = roundTo(
    Math.min(100, Math.max(0, input.predictionVsObservedResidualPct + unrecordedChannelPenalty)),
    1,
  );

  const counterfactualBranchSummary = parameterIdentifiabilityVerified
    ? `Identifiable multiscale branch (Reserve ${myocardialBioenergeticReservePct}%, Stability ${coupledHemodynamicStabilityIndex}/100, Allostatic Load ${systemicAllostaticLoadIndex}/100, Reality Gap ${realityGapScore}%). Isolated from canonical history.`
    : `Calibration locked: parameter identifiability requires >=3 recorded device channels and residual <=15% (current Reality Gap ${realityGapScore}%). Isolated counterfactual only.`;

  return createTruthEnvelope('SIMULATED_EDUCATIONAL', 'Omnicausalis Multiscale Coupling & Reality Engine Identifiability Gate', {
    myocardialBioenergeticReservePct,
    coupledHemodynamicStabilityIndex,
    vascularHyporeactivityRisk,
    systemicAllostaticLoadIndex,
    parameterIdentifiabilityVerified,
    realityGapScore,
    isolatedFromCanonicalHistory: true,
    requiresHumanPhysicianSignoff: true,
    counterfactualBranchSummary,
  });
}

