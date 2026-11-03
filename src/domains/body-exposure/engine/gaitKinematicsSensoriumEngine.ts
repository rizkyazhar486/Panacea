/**
 * Gait Kinematics & Sensorium Pipeline (Pillar V - Biomechanics & Wearables).
 *
 * Implements:
 * - Metatarsophalangeal (MTP) joint angle excursion (0° - 65° dorsiflexion in terminal stance).
 * - Sagittal plane kinematics: hip flexion/extension (Δθ_hip ≈ 40°), knee flexion (0° - 60°), ankle dorsi/plantarflexion (+15° to -20°).
 * - Bimodal Ground Reaction Force (GRF) vertical loading vector and loading rate.
 * - Bilateral symmetry evaluation via Robinson's Symmetry Index (SI).
 * - Real-time kinematic telemetry synthesis and pathological gait pattern integration.
 *
 * Citations:
 * - Perry J, Burnfield JM. Gait Analysis: Normal and Pathological Function. 2nd ed. SLACK; 2010.
 * - Winter DA. Biomechanics and Motor Control of Human Movement. 4th ed. Wiley; 2009.
 * - Hicks JH. The mechanics of the foot. II. The plantar aponeurosis and the arch. J Anat. 1954;88(1):25-30. PMID: 13129168.
 * - Robinson RO, Herzog W, Nigg BM. J Manipulative Physiol Ther. 1987;10(4):172-176. PMID: 3655546.
 */

import {
  classifyPathologicalGaitCycle,
  type GaitCycleKinematicsInput,
  type GaitEvaluationResult,
  GAIT_BIOMECHANICS_SOURCE,
  GAIT_LIBRARY_DISCLAIMER,
} from './pathologicalGaitEngine.ts';

export {
  classifyPathologicalGaitCycle,
  type GaitCycleKinematicsInput,
  type GaitEvaluationResult,
  GAIT_BIOMECHANICS_SOURCE,
  GAIT_LIBRARY_DISCLAIMER,
};

export type GaitCyclePhaseId =
  | 'initial-contact'
  | 'loading-response'
  | 'mid-stance'
  | 'terminal-stance'
  | 'pre-swing'
  | 'initial-swing'
  | 'mid-swing'
  | 'terminal-swing';

export interface SagittalKinematicsProfile {
  readonly cyclePercent: number;
  readonly phaseId: GaitCyclePhaseId;
  readonly phaseLabel: string;
  readonly hipDeg: number;
  readonly kneeDeg: number;
  readonly ankleDeg: number;
  readonly mtpDeg: number;
  readonly windlassActive: boolean;
}

export interface VerticalGrfProfile {
  readonly cyclePercent: number;
  readonly normalizedBw: number;
  readonly forceN: number;
  readonly phase: 'swing-unloaded' | 'impact-peak' | 'mid-stance-trough' | 'propulsion-peak';
  readonly loadingRateBwPerSec: number;
}

export interface GaitSymmetryInput {
  readonly leftStrideLengthM: number;
  readonly rightStrideLengthM: number;
  readonly leftStancePercent: number;
  readonly rightStancePercent: number;
  readonly leftPeakGrfBw: number;
  readonly rightPeakGrfBw: number;
  readonly cadenceStepsPerMin: number;
}

export interface GaitSymmetryMetrics {
  readonly strideLengthSymmetryIndexPercent: number;
  readonly stancePercentSymmetryIndexPercent: number;
  readonly peakGrfSymmetryIndexPercent: number;
  readonly compositeSymmetryScore: number;
  readonly symmetryClass: 'normal-symmetric' | 'mild-asymmetry' | 'pathological-asymmetry';
}

export interface KinematicTelemetryEnvelope {
  readonly cyclePercent: number;
  readonly sagittal: SagittalKinematicsProfile;
  readonly grf: VerticalGrfProfile;
  readonly symmetry: GaitSymmetryMetrics;
  readonly pathology: GaitEvaluationResult;
  readonly timestamp: number;
  readonly truthClass: 'derived';
  readonly disclaimer: typeof GAIT_LIBRARY_DISCLAIMER;
  readonly source: typeof GAIT_BIOMECHANICS_SOURCE;
}

export const KINEMATICS_SENSORIUM_METADATA = Object.freeze({
  engine: 'Panacea Gait Kinematics & Sensorium Pipeline',
  version: '1.0.0',
  standardGravityMs2: 9.80665,
  sagittalRanges: Object.freeze({
    hipExcursionDeg: 40, // +25° flexion to -15° extension
    kneeFlexionRangeDeg: [0, 60] as const,
    ankleRangeDeg: [-20, 15] as const, // -20° plantarflexion to +15° dorsiflexion
    mtpTerminalStancePeakDeg: 65, // Hicks windlass mechanism
  }),
});

/**
 * Calculates sagittal plane joint angles at any gait cycle percentage (0 - 100%).
 * Uses established physiological joint trajectories from Perry & Winter.
 */
export function calculateSagittalKinematics(cyclePercentInput: number): SagittalKinematicsProfile {
  const t = Math.max(0, Math.min(100, Number.isFinite(cyclePercentInput) ? cyclePercentInput : 0));

  let phaseId: GaitCyclePhaseId = 'initial-contact';
  let phaseLabel = 'Initial Contact (0-2%)';

  if (t <= 2) {
    phaseId = 'initial-contact';
    phaseLabel = 'Initial Contact (Heel Strike)';
  } else if (t <= 12) {
    phaseId = 'loading-response';
    phaseLabel = 'Loading Response (Shock Absorption)';
  } else if (t <= 31) {
    phaseId = 'mid-stance';
    phaseLabel = 'Mid-Stance (Single Limb Support)';
  } else if (t <= 50) {
    phaseId = 'terminal-stance';
    phaseLabel = 'Terminal Stance (Forefoot Rocker & Heel-Off)';
  } else if (t <= 62) {
    phaseId = 'pre-swing';
    phaseLabel = 'Pre-Swing (Push-Off & Toe Break)';
  } else if (t <= 75) {
    phaseId = 'initial-swing';
    phaseLabel = 'Initial Swing (Foot Acceleration)';
  } else if (t <= 87) {
    phaseId = 'mid-swing';
    phaseLabel = 'Mid-Swing (Limb Clearance)';
  } else {
    phaseId = 'terminal-swing';
    phaseLabel = 'Terminal Swing (Deceleration)';
  }

  // 1. Sagittal Hip Flexion / Extension (Δθ_hip ≈ 40°):
  // Peaks at +25° at 0% (flexion), extends to -15° at 50% (extension), returns to +25° at 100%
  const rad = (t / 100) * 2 * Math.PI;
  const rawHip = 5 + 20 * Math.cos(rad) + 7 * Math.sin(rad);
  const hipDeg = Number(rawHip.toFixed(1));

  // 2. Sagittal Knee Flexion (0° - 60°):
  // Initial contact ~3°, loading response flexes to ~18°, extends in mid-stance to ~5°,
  // then swings up to peak 60° at ~72% for toe clearance, then extends back to ~3°
  let rawKnee = 3;
  if (t <= 15) {
    rawKnee = 3 + 15 * Math.sin((t / 15) * Math.PI); // shock absorption wave to 18°
  } else if (t <= 40) {
    rawKnee = 18 - 13 * ((t - 15) / 25); // mid-stance extension to 5°
  } else if (t <= 72) {
    // rapid flexion to 60° in swing
    const frac = (t - 40) / 32;
    rawKnee = 5 + 55 * Math.sin(frac * (Math.PI / 2));
  } else {
    // terminal swing extension from 60° back to 3°
    const frac = (t - 72) / 28;
    rawKnee = 60 - 57 * Math.sin(frac * (Math.PI / 2));
  }
  const kneeDeg = Number(Math.max(0, Math.min(60, rawKnee)).toFixed(1));

  // 3. Sagittal Ankle Dorsiflexion / Plantarflexion (+15° to -20°):
  // 0% = 0°, loading response drops to -5° (heel rocker),
  // mid-to-terminal stance dorsiflexes to peak +14° at 45% (ankle rocker),
  // push-off drops to -20° at 60%, swing returns to 0° (toe clearance)
  let rawAnkle = 0;
  if (t <= 8) {
    rawAnkle = -5 * Math.sin((t / 8) * Math.PI); // heel rocker
  } else if (t <= 45) {
    rawAnkle = -5 + 19 * ((t - 8) / 37); // progressive dorsiflexion to +14°
  } else if (t <= 60) {
    // rapid plantarflexion push-off to -20°
    const frac = (t - 45) / 15;
    rawAnkle = 14 - 34 * frac;
  } else if (t <= 75) {
    // swing dorsiflexion recovery to neutral
    const frac = (t - 60) / 15;
    rawAnkle = -20 + 20 * frac;
  } else {
    rawAnkle = 0;
  }
  const ankleDeg = Number(Math.max(-20, Math.min(15, rawAnkle)).toFixed(1));

  // 4. Metatarsophalangeal (MTP) Joint Dorsiflexion (0° - 65°):
  // Flat during initial contact through mid-stance (0-35% = 0°),
  // begins rising at heel-off (35-50% = 0° to 30°),
  // reaches maximum dorsiflexion (55°-65°) at pre-swing toe break (50-62%) activating windlass mechanism,
  // then drops back to neutral in swing (62-100%)
  let rawMtp = 0;
  if (t < 35) {
    rawMtp = 0;
  } else if (t <= 50) {
    rawMtp = 30 * ((t - 35) / 15);
  } else if (t <= 62) {
    // peak toe break
    const frac = (t - 50) / 12;
    rawMtp = 30 + 35 * Math.sin(frac * (Math.PI / 2)); // reaches 65°
  } else if (t <= 72) {
    const frac = (t - 62) / 10;
    rawMtp = 65 * (1 - frac);
  } else {
    rawMtp = 0;
  }
  const mtpDeg = Number(Math.max(0, Math.min(65, rawMtp)).toFixed(1));
  const windlassActive = mtpDeg >= 25;

  return Object.freeze({
    cyclePercent: t,
    phaseId,
    phaseLabel,
    hipDeg,
    kneeDeg,
    ankleDeg,
    mtpDeg,
    windlassActive,
  });
}

/**
 * Calculates bimodal vertical Ground Reaction Force (GRF) profile.
 * - 1st peak: weight acceptance / braking (~1.18 BW at ~18% stance)
 * - Trough: mid-stance unloading (~0.76 BW at ~48% stance)
 * - 2nd peak: propulsion / push-off (~1.18 BW at ~78% stance)
 * - Swing: 0 BW
 */
export function calculateVerticalGrf(
  cyclePercentInput: number,
  bodyMassKg: number = 70,
  stancePercent: number = 60,
): VerticalGrfProfile {
  const t = Math.max(0, Math.min(100, Number.isFinite(cyclePercentInput) ? cyclePercentInput : 0));
  const safeStance = Math.max(40, Math.min(80, Number.isFinite(stancePercent) ? stancePercent : 60));
  const safeMass = Math.max(30, Math.min(250, Number.isFinite(bodyMassKg) ? bodyMassKg : 70));

  if (t > safeStance) {
    return Object.freeze({
      cyclePercent: t,
      normalizedBw: 0,
      forceN: 0,
      phase: 'swing-unloaded',
      loadingRateBwPerSec: 0,
    });
  }

  // Normalized stance phase [0, 1]
  const tau = t / safeStance;

  // Classical 2-term Fourier series for bimodal vertical GRF (Winter 2009, Perry 2010):
  // F_z(tau) = 1.22 * sin(pi * tau) + 0.45 * sin(3 * pi * tau)
  // Yields impact peak ≈ 1.15 BW at tau ≈ 0.20, mid-stance trough ≈ 0.77 BW at tau ≈ 0.50,
  // and propulsive peak ≈ 1.15 BW at tau ≈ 0.80.
  const shape = 1.22 * Math.sin(Math.PI * tau) + 0.45 * Math.sin(3 * Math.PI * tau);
  const normalizedBw = Number(Math.max(0, shape).toFixed(2));
  const forceN = Number((normalizedBw * safeMass * KINEMATICS_SENSORIUM_METADATA.standardGravityMs2).toFixed(1));

  let phase: VerticalGrfProfile['phase'] = 'impact-peak';
  if (tau < 0.35) {
    phase = 'impact-peak';
  } else if (tau < 0.65) {
    phase = 'mid-stance-trough';
  } else {
    phase = 'propulsion-peak';
  }

  // Vertical loading rate (BW/s) during initial loading acceptance (tau 0 to 0.25)
  const loadingRateBwPerSec = tau <= 0.25 && tau > 0 ? Number((normalizedBw / (tau * 0.6)).toFixed(1)) : 0;

  return Object.freeze({
    cyclePercent: t,
    normalizedBw,
    forceN,
    phase,
    loadingRateBwPerSec,
  });
}

/**
 * Calculates Robinson's Symmetry Index (SI):
 * SI = (2 * |X_L - X_R| / (X_L + X_R)) * 100%
 * Reference: Robinson et al. (1987) PMID: 3655546
 */
export function calculateRobinsonSymmetryIndex(leftVal: number, rightVal: number): number {
  if (!Number.isFinite(leftVal) || !Number.isFinite(rightVal)) return 0;
  const l = Math.abs(leftVal);
  const r = Math.abs(rightVal);
  const sum = l + r;
  if (sum === 0) return 0;
  const si = (2 * Math.abs(l - r)) / sum;
  return Number((si * 100).toFixed(2));
}

/**
 * Evaluates comprehensive bilateral gait symmetry metrics.
 */
export function evaluateGaitSymmetry(input: GaitSymmetryInput): GaitSymmetryMetrics {
  const strideSI = calculateRobinsonSymmetryIndex(input.leftStrideLengthM, input.rightStrideLengthM);
  const stanceSI = calculateRobinsonSymmetryIndex(input.leftStancePercent, input.rightStancePercent);
  const grfSI = calculateRobinsonSymmetryIndex(input.leftPeakGrfBw, input.rightPeakGrfBw);

  // Composite mean asymmetry index
  const meanAsymmetry = (strideSI + stanceSI + grfSI) / 3;
  const compositeSymmetryScore = Number(Math.max(0, Math.min(100, 100 - meanAsymmetry)).toFixed(1));

  let symmetryClass: GaitSymmetryMetrics['symmetryClass'] = 'normal-symmetric';
  if (meanAsymmetry > 15) {
    symmetryClass = 'pathological-asymmetry';
  } else if (meanAsymmetry > 8) {
    symmetryClass = 'mild-asymmetry';
  } else {
    symmetryClass = 'normal-symmetric';
  }

  return Object.freeze({
    strideLengthSymmetryIndexPercent: strideSI,
    stancePercentSymmetryIndexPercent: stanceSI,
    peakGrfSymmetryIndexPercent: grfSI,
    compositeSymmetryScore,
    symmetryClass,
  });
}

/**
 * Synthesizes a real-time kinematic telemetry frame from wearable/video signals.
 * Combines sagittal kinematics, vertical GRF, bilateral symmetry, and pathology classification.
 */
export function synthesizeKinematicTelemetry(
  cyclePercent: number,
  symmetryInput: GaitSymmetryInput,
  pathologyInput: GaitCycleKinematicsInput,
  bodyMassKg: number = 70,
  explicitTimestamp: number = 0,
): KinematicTelemetryEnvelope {
  const sagittal = calculateSagittalKinematics(cyclePercent);
  const grf = calculateVerticalGrf(cyclePercent, bodyMassKg, pathologyInput.stancePhasePercent);
  const symmetry = evaluateGaitSymmetry(symmetryInput);
  const pathology = classifyPathologicalGaitCycle(pathologyInput);

  return Object.freeze({
    cyclePercent,
    sagittal,
    grf,
    symmetry,
    pathology,
    timestamp: explicitTimestamp,
    truthClass: 'derived',
    disclaimer: GAIT_LIBRARY_DISCLAIMER,
    source: GAIT_BIOMECHANICS_SOURCE,
  });
}
