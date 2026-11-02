// @panacea-claim-boundary: simulation-not-clinical
import {
  OMNICAUSALIS_SAFETY_DISCLAIMER,
  type BioEmuConformationalInput, type BioEmuEnsembleResult,
  type DeNovoBinderAssessment, type DeNovoBinderCandidateInput,
  type DirectionalVector3D, type KaloLumenLayerConfig,
  type KaloLumenLightingAngles, type KaloLumenReconstructionInput,
  type KaloLumenReconstructionSummary, type LongevityEnergyBalanceInput,
  type LongevityEnergyBalanceSummary, type OmnicausalisTruthClass,
  type ProteinFighterArenaRoundResult, type ProteinFighterBotProfile,
  type RemopReceptorDoseInput, type RemopReceptorOccupancyResult,
  type SepsisSafeguardEvaluation, type SepsisScreeningInput,
  type TruthClassEnvelope, type VisemeFrame, type VrmVisemeKey,
} from '../model/types.ts';

const GAS_CONSTANT_KCAL_MOL_K = 0.00198720425864083;
const VALID_AMINO_ACIDS = /^[ACDEFGHIKLMNPQRSTVWY]+$/;

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
  if (truthClass !== 'OBSERVED_CLINICAL' && truthClass !== 'DERIVED_CLINICAL' && truthClass !== 'SIMULATED_EDUCATIONAL') {
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
  return createTruthEnvelope('DERIVED_CLINICAL', 'Surviving Sepsis Campaign 2021 / Sepsis-3 (Singer et al., JAMA 2016)', {
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
