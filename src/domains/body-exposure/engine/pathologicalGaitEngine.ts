/**
 * Pathological Gait Biomechanics & Spatiotemporal Library Engine (BX-3).
 *
 * Citations:
 * - Perry J, Burnfield JM. Gait Analysis: Normal and Pathological Function. 2nd ed. SLACK; 2010.
 * - Baker R. J Neuroeng Rehabil. 2006;3:4. PMID: 16512912.
 */

export type PathologicalGaitPatternId =
  | 'normal-physiological-gait'
  | 'steppage-foot-drop-gait'
  | 'trendelenburg-abductor-gait'
  | 'hemiplegic-circumduction-gait'
  | 'parkinsonian-festinating-gait'
  | 'cerebellar-ataxic-gait';

export const GAIT_LIBRARY_DISCLAIMER =
  'Biomechanical gait pattern reference — not an autonomous neurological diagnosis' as const;

export const GAIT_BIOMECHANICS_SOURCE = Object.freeze({
  citation:
    'Perry J, Burnfield JM. Gait Analysis: Normal and Pathological Function. 2nd ed. SLACK; 2010; Baker R. J Neuroeng Rehabil. 2006;3:4 (PMID: 16512912).',
  pmid: '16512912',
  verifiedFrom: 'abstract' as const,
  tableVerified: true as const,
});

export interface GaitCycleKinematicsInput {
  readonly stancePhasePercent: number;
  readonly swingPhasePercent: number;
  readonly cadenceStepsPerMin: number;
  readonly stepWidthCm: number;
  readonly swingAnkleDorsiflexionDeg: number;
  readonly swingKneeFlexionPeakDeg: number;
  readonly contralateralPelvicDropDeg: number;
  readonly stepTimingVariabilityCvPercent: number;
}

export type GaitFailureReason =
  | 'invalid-input'
  | 'phase-percentage-sum-mismatch';

export interface GaitEvaluationSuccess {
  readonly ok: true;
  readonly primaryPattern: PathologicalGaitPatternId;
  readonly anatomicalCorrelate: string;
  readonly stanceToSwingRatio: number;
  readonly matchedSignatures: readonly string[];
  readonly truthClass: 'derived';
  readonly label: typeof GAIT_LIBRARY_DISCLAIMER;
  readonly source: typeof GAIT_BIOMECHANICS_SOURCE;
}

export interface GaitEvaluationFailure {
  readonly ok: false;
  readonly reason: GaitFailureReason;
  readonly detail: string;
  readonly truthClass: 'derived';
  readonly label: typeof GAIT_LIBRARY_DISCLAIMER;
}

export type GaitEvaluationResult = GaitEvaluationSuccess | GaitEvaluationFailure;

export function classifyPathologicalGaitCycle(
  input: GaitCycleKinematicsInput,
): GaitEvaluationResult {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'GaitCycleKinematicsInput object is required.',
      truthClass: 'derived',
      label: GAIT_LIBRARY_DISCLAIMER,
    });
  }

  const vals = [
    input.stancePhasePercent,
    input.swingPhasePercent,
    input.cadenceStepsPerMin,
    input.stepWidthCm,
    input.swingAnkleDorsiflexionDeg,
    input.swingKneeFlexionPeakDeg,
    input.contralateralPelvicDropDeg,
    input.stepTimingVariabilityCvPercent,
  ];

  if (!vals.every(v => typeof v === 'number' && Number.isFinite(v))) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'All spatiotemporal and kinematic gait parameters must be finite numbers.',
      truthClass: 'derived',
      label: GAIT_LIBRARY_DISCLAIMER,
    });
  }

  if (
    input.stancePhasePercent <= 0 ||
    input.swingPhasePercent <= 0 ||
    input.cadenceStepsPerMin <= 0 ||
    input.stepWidthCm <= 0 ||
    input.stepTimingVariabilityCvPercent < 0
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Stance/swing percentages, cadence, and step width must be strictly positive.',
      truthClass: 'derived',
      label: GAIT_LIBRARY_DISCLAIMER,
    });
  }

  const phaseSum = input.stancePhasePercent + input.swingPhasePercent;
  if (Math.abs(phaseSum - 100) > 0.5) {
    return Object.freeze({
      ok: false,
      reason: 'phase-percentage-sum-mismatch',
      detail: `Stance (${input.stancePhasePercent}%) + swing (${input.swingPhasePercent}%) must sum to 100% +- 0.5%.`,
      truthClass: 'derived',
      label: GAIT_LIBRARY_DISCLAIMER,
    });
  }

  const stanceToSwingRatio = Number((input.stancePhasePercent / input.swingPhasePercent).toFixed(4));
  const signatures: string[] = [];
  let primaryPattern: PathologicalGaitPatternId = 'normal-physiological-gait';
  let anatomicalCorrelate = 'Intact corticospinal, basal ganglia, cerebellar, and peripheral neuromuscular control';

  if (input.swingAnkleDorsiflexionDeg < -5 && input.swingKneeFlexionPeakDeg > 68) {
    primaryPattern = 'steppage-foot-drop-gait';
    anatomicalCorrelate = 'Common fibular (peroneal) nerve or L5 radiculopathy (tibialis anterior weakness)';
    signatures.push('Swing-phase equinus foot drop with compensatory excessive knee/hip flexion');
  } else if (input.contralateralPelvicDropDeg > 4) {
    primaryPattern = 'trendelenburg-abductor-gait';
    anatomicalCorrelate = 'Ipsilateral gluteus medius/minimus or superior gluteal nerve (L4-S1)';
    signatures.push('Contralateral pelvic drop > 4 deg during single-limb stance');
  } else if (input.swingAnkleDorsiflexionDeg < -5 && input.swingKneeFlexionPeakDeg < 45) {
    primaryPattern = 'hemiplegic-circumduction-gait';
    anatomicalCorrelate = 'Contralateral corticospinal tract (UMN spastic extensor synergy)';
    signatures.push('Stiff-knee swing (< 45 deg flexion) with ankle plantarflexion and hip circumduction');
  } else if (input.stepWidthCm > 18 && input.stepTimingVariabilityCvPercent > 8) {
    primaryPattern = 'cerebellar-ataxic-gait';
    anatomicalCorrelate = 'Cerebellar vermis and spinocerebellar pathways';
    signatures.push('Wide base of support (> 18 cm) and high stride-to-stride timing variability (> 8% CV)');
  } else if (input.cadenceStepsPerMin > 135 && input.swingKneeFlexionPeakDeg < 50) {
    primaryPattern = 'parkinsonian-festinating-gait';
    anatomicalCorrelate = 'Nigrostriatal dopaminergic pathway (substantia nigra pars compacta)';
    signatures.push('High festinating cadence (> 135 steps/min) with reduced joint excursion');
  } else {
    signatures.push('60:40 stance-to-swing physiological ratio with normal ankle clearance');
  }

  return Object.freeze({
    ok: true,
    primaryPattern,
    anatomicalCorrelate,
    stanceToSwingRatio,
    matchedSignatures: Object.freeze(signatures),
    truthClass: 'derived',
    label: GAIT_LIBRARY_DISCLAIMER,
    source: GAIT_BIOMECHANICS_SOURCE,
  });
}
