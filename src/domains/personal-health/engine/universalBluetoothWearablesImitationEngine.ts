/**
 * @file universalBluetoothWearablesImitationEngine.ts
 * @description Universal Bluetooth Low Energy (BLE) Wearables Ingestion,
 * Hardware Imitation Program, and Cross-Device Translation Engine (PanaceaMed OS).
 *
 * Directives conform to:
 * - Genesis Directive (PANACEA_GENESIS_DIRECTIVE.md & UNIVERSAL_DEVICE_TRANSLATION_OS.md)
 * - Medical Device Fabric (DOCS/MEDICAL-DEVICE-FABRIC.md)
 * - Universal Human Acceptance Standard (PANACEA_UNIVERSAL_HUMAN_ACCEPTANCE_STANDARD.md)
 * - Epistemic Truth Separation: OBSERVED_DEVICE vs SIMULATED_IMITATION.
 */

// ── Pure Isomorphic SHA-256 for Zero-Crash Browser & Node Compatibility ──────

function sha256Hex(ascii: string): string {
  // Pure FIPS 180-4 isomorphic SHA-256 implementation
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const words: number[] = [];
  const len = ascii.length;
  for (let i = 0; i < len; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
  words[(((len + 8) >> 6) << 4) + 15] = len * 8;

  let a = 0x6a09e667;
  let b = 0xbb67ae85;
  let c = 0x3c6ef372;
  let d = 0xa54ff53a;
  let e = 0x510e527f;
  let f = 0x9b05688c;
  let g = 0x1f83d9ab;
  let h = 0x5be0cd19;

  const w = new Array<number>(64);
  const rrot = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let i = 0; i < words.length; i += 16) {
    for (let j = 0; j < 16; j++) w[j] = words[i + j] || 0;
    for (let j = 16; j < 64; j++) {
      const s0 = rrot(w[j - 15], 7) ^ rrot(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rrot(w[j - 2], 17) ^ rrot(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (((w[j - 16] + s0) | 0) + ((w[j - 7] + s1) | 0)) | 0;
    }

    let [A, B, C, D, E, F, G, H] = [a, b, c, d, e, f, g, h];
    for (let j = 0; j < 64; j++) {
      const S1 = rrot(E, 6) ^ rrot(E, 11) ^ rrot(E, 25);
      const ch = (E & F) ^ (~E & G);
      const temp1 = (((H + S1) | 0) + ((ch + K[j]) | 0) + w[j]) | 0;
      const S0 = rrot(A, 2) ^ rrot(A, 13) ^ rrot(A, 22);
      const maj = (A & B) ^ (A & C) ^ (B & C);
      const temp2 = (S0 + maj) | 0;

      H = G;
      G = F;
      F = E;
      E = (D + temp1) | 0;
      D = C;
      C = B;
      B = A;
      A = (temp1 + temp2) | 0;
    }

    a = (a + A) | 0;
    b = (b + B) | 0;
    c = (c + C) | 0;
    d = (d + D) | 0;
    e = (e + E) | 0;
    f = (f + F) | 0;
    g = (g + G) | 0;
    h = (h + H) | 0;
  }

  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return [a, b, c, d, e, f, g, h].map(hex).join('');
}

// ── Types & Interfaces ───────────────────────────────────────────────────────

export type WearableDeviceModel =
  | 'WHOOP_SHENZHEN_BAND'      // Shenzhen clone / Whoop 4.0 imitation protocol
  | 'QWATCH_PRO_SMARTWATCH'     // qWatch Pro / Apple Watch style wrist wearable
  | 'OURA_RING_HORIZON'         // Smart Ring finger PPG & nocturnal recovery
  | 'POLAR_H10_STRAP'           // Chest strap ECG & millisecond R-R precision
  | 'GARMIN_RUNNER_PRO'         // Multisport VO2max GNSS athletic watch
  | 'GENERIC_BLE_GATT';         // Standard GATT 0x180D / 0x1809 / 0x1822

export type RecoveryZone = 'OPTIMAL_GREEN' | 'ADEQUATE_YELLOW' | 'REST_RED';

export type SleepStage = 'WAKE' | 'LIGHT_SLEEP' | 'DEEP_SLOW_WAVE' | 'REM_DREAM';

export interface RawBleWearablePacket {
  readonly deviceModel: WearableDeviceModel;
  readonly deviceMacAddressOrDid: string;
  readonly rawHexPayload: string;
  readonly receivedAtIso: string;
  readonly isImitationSimulation: boolean;
}

export interface PanaceaWearableTelemetryPacket {
  readonly timestampIso: string;
  readonly deviceModel: WearableDeviceModel;
  readonly deviceSerialNumberHash: string;
  readonly batteryPercent: number;
  readonly heartRateBpm: number;
  readonly rrIntervalsMs: readonly number[];
  readonly hrvRmssdMs: number;
  readonly spo2Percent: number;
  readonly skinTemperatureCelsius: number;
  readonly baselineSkinTempCelsius: number;
  readonly skinTempDeltaCelsius: number;
  readonly accelerometerGXYZ: readonly [number, number, number];
  readonly stepCadenceSpm: number;
  readonly totalStepsToday: number;
  readonly activeCaloriesKcal: number;
  readonly strainScore0to21: number;
  readonly recoveryPercent0to100: number;
  readonly recoveryZone: RecoveryZone;
  readonly sleepStage: SleepStage;
  readonly truthClass: 'OBSERVED_DEVICE' | 'SIMULATED_IMITATION';
  readonly provenanceDigestSha256: string;
}

export interface CrossDeviceTranslationResult {
  readonly sourceDevice: WearableDeviceModel;
  readonly targetDevice: WearableDeviceModel;
  readonly translatedPayload: Record<string, unknown>;
  readonly qWatchProCompatibleStream: {
    readonly heartRateBpm: number;
    readonly hrvRmssdMs: number;
    readonly strainScore: number;
    readonly recoveryPct: number;
    readonly syncStatus: 'STREAM_ACTIVE_SYNCHRONIZED';
  };
  readonly bridgeSha256Seal: string;
}

export interface AiWearableClinicalInterpretation {
  readonly summaryLayperson: string;
  readonly clinicalFindings: {
    readonly autonomicNervousTone: 'PARASYMPATHETIC_DOMINANT' | 'BALANCED' | 'SYMPATHETIC_OVERLOAD';
    readonly restingHrDeltaBpm: number;
    readonly possibleEarlyImmuneReaction: boolean;
    readonly nocturnalHypoxemiaDetected: boolean;
  };
  readonly athleticCoachAdvice: {
    readonly strainRecommendedMax: number;
    readonly workoutZoneRecommendation: 'ZONE_1_RECOVERY' | 'ZONE_2_AEROBIC_BASE' | 'ZONE_4_5_HIGH_INTENSITY';
    readonly classPassOrSportDropinEligible: boolean;
  };
  readonly clinicallyReviewed: false;
  readonly requiresHumanPhysicianSignoff: true;
  readonly truthClass: 'OBSERVED_DEVICE' | 'SIMULATED_IMITATION';
}

// ── Mathematical Core & Biophysical Formulas ────────────────────────────────

/**
 * Calculates Root Mean Square of Successive Differences (RMSSD) from R-R intervals.
 * Standard gold standard measure of vagally-mediated parasympathetic heart rate variability.
 */
export function calculateHrvRmssd(rrIntervalsMs: readonly number[]): number {
  if (!rrIntervalsMs || rrIntervalsMs.length < 2) return 42.0; // fallback median
  let sumSqDiff = 0;
  let count = 0;
  for (let i = 0; i < rrIntervalsMs.length - 1; i++) {
    const diff = rrIntervalsMs[i + 1] - rrIntervalsMs[i];
    sumSqDiff += diff * diff;
    count++;
  }
  return Number(Math.sqrt(sumSqDiff / count).toFixed(2));
}

/**
 * Calculates Day Strain Score (0.0 to 21.0) using non-linear cardiovascular impulse response.
 */
export function calculateStrainScore(params: {
  averageHrBpm: number;
  restingHrBpm: number;
  maxHrBpm: number;
  durationMinutes: number;
}): number {
  const { averageHrBpm, restingHrBpm, maxHrBpm, durationMinutes } = params;
  if (durationMinutes <= 0) return 0.0;
  const hrReserveFraction = Math.max(0, Math.min(1.0, (averageHrBpm - restingHrBpm) / Math.max(1, maxHrBpm - restingHrBpm)));
  // Banister TRIMP weighted integral
  const trimp = durationMinutes * hrReserveFraction * 0.64 * Math.exp(1.92 * hrReserveFraction);
  // Whoop logarithmic scaling: max 21.0
  const strain = 21.0 * (1.0 - Math.exp(-0.012 * trimp));
  return Number(Math.max(0.0, Math.min(21.0, strain)).toFixed(1));
}

/**
 * Calculates Autonomic Recovery Score (0% to 100%) and categorizes into Optimal/Adequate/Rest.
 */
export function calculateAutonomicRecovery(params: {
  currentHrvRmssdMs: number;
  baselineHrvRmssdMs: number;
  currentRestingHrBpm: number;
  baselineRestingHrBpm: number;
  sleepHours: number;
}): { recoveryPercent: number; zone: RecoveryZone } {
  const {
    currentHrvRmssdMs,
    baselineHrvRmssdMs,
    currentRestingHrBpm,
    baselineRestingHrBpm,
    sleepHours
  } = params;

  // HRV ratio (higher is better)
  const hrvRatio = baselineHrvRmssdMs > 0 ? currentHrvRmssdMs / baselineHrvRmssdMs : 1.0;
  // RHR delta (lower resting HR is better)
  const rhrDelta = currentRestingHrBpm - baselineRestingHrBpm;
  // Sleep factor (7-9 hours baseline)
  const sleepFactor = Math.min(1.0, Math.max(0.3, sleepHours / 8.0));

  let score = 50 + (hrvRatio - 1.0) * 45 - rhrDelta * 2.5;
  score = score * (0.8 + 0.2 * sleepFactor);
  const recoveryPercent = Math.max(1, Math.min(99, Math.round(score)));

  let zone: RecoveryZone = 'ADEQUATE_YELLOW';
  if (recoveryPercent >= 67) zone = 'OPTIMAL_GREEN';
  else if (recoveryPercent < 34) zone = 'REST_RED';

  return { recoveryPercent, zone };
}

// ── Universal Imitation Program Generator ───────────────────────────────────

/**
 * Generates an authentic simulated BLE stream for any requested wearable model.
 * Enables developers, students, clinicians, and users in Shenzhen / Jakarta / worldwide
 * to test, simulate, and calibrate digital twin physiology without needing physical hardware.
 */
export function generateImitationWearableStream(params: {
  deviceModel: WearableDeviceModel;
  scenario?: 'RESTING_MORNING' | 'INTENSE_CARDIO' | 'EARLY_FEVER_ILLNESS' | 'DEEP_SLEEP';
  seedOffsetMs?: number;
}): PanaceaWearableTelemetryPacket {
  const scenario = params.scenario || 'RESTING_MORNING';
  const nowIso = new Date(Date.now() + (params.seedOffsetMs || 0)).toISOString();
  const serialHash = sha256Hex(`PMD-WEARABLE-SERIAL:${params.deviceModel}:SEED-4096`).slice(0, 16);

  let heartRateBpm = 60;
  let rrIntervalsMs = [920, 1010, 930, 1020, 940, 1030, 950];
  let spo2Percent = 98.5;
  let skinTemperatureCelsius = 33.4;
  const baselineSkinTempCelsius = 33.4;
  let sleepStage: SleepStage = 'WAKE';
  let cadence = 0;
  let steps = 4250;
  let kcal = 320;
  let strain = 4.2;

  switch (scenario) {
    case 'INTENSE_CARDIO':
      heartRateBpm = 168;
      rrIntervalsMs = [360, 355, 358, 362, 354, 357];
      spo2Percent = 97.0;
      skinTemperatureCelsius = 34.6;
      sleepStage = 'WAKE';
      cadence = 165;
      steps = 10840;
      kcal = 780;
      strain = 16.4;
      break;
    case 'EARLY_FEVER_ILLNESS':
      heartRateBpm = 76;
      rrIntervalsMs = [790, 785, 792, 788, 780];
      spo2Percent = 95.8;
      skinTemperatureCelsius = 34.2; // +0.8C deviation
      sleepStage = 'WAKE';
      cadence = 0;
      steps = 1420;
      kcal = 150;
      strain = 3.1;
      break;
    case 'DEEP_SLEEP':
      heartRateBpm = 51;
      rrIntervalsMs = [1180, 1195, 1175, 1205, 1190];
      spo2Percent = 99.0;
      skinTemperatureCelsius = 33.1;
      sleepStage = 'DEEP_SLOW_WAVE';
      cadence = 0;
      steps = 3800;
      kcal = 210;
      strain = 2.0;
      break;
    case 'RESTING_MORNING':
    default:
      heartRateBpm = 60;
      rrIntervalsMs = [920, 1010, 930, 1020, 940, 1030, 950];
      spo2Percent = 98.5;
      skinTemperatureCelsius = 33.4;
      sleepStage = 'WAKE';
      cadence = 0;
      steps = 3200;
      kcal = 280;
      strain = 4.2;
      break;
  }

  const hrvRmssdMs = calculateHrvRmssd(rrIntervalsMs);
  const skinTempDeltaCelsius = Number((skinTemperatureCelsius - baselineSkinTempCelsius).toFixed(2));
  const { recoveryPercent, zone } = calculateAutonomicRecovery({
    currentHrvRmssdMs: hrvRmssdMs,
    baselineHrvRmssdMs: 48.0,
    currentRestingHrBpm: heartRateBpm,
    baselineRestingHrBpm: 60,
    sleepHours: scenario === 'EARLY_FEVER_ILLNESS' ? 4.5 : 7.8
  });

  const provenanceDigestSha256 = sha256Hex(
    JSON.stringify({
      deviceModel: params.deviceModel,
      serialHash,
      nowIso,
      heartRateBpm,
      hrvRmssdMs,
      recoveryPercent
    })
  );

  return Object.freeze({
    timestampIso: nowIso,
    deviceModel: params.deviceModel,
    deviceSerialNumberHash: serialHash,
    batteryPercent: 88,
    heartRateBpm,
    rrIntervalsMs: Object.freeze(rrIntervalsMs),
    hrvRmssdMs,
    spo2Percent,
    skinTemperatureCelsius,
    baselineSkinTempCelsius,
    skinTempDeltaCelsius,
    accelerometerGXYZ: Object.freeze([0.02, 0.98, 0.12] as const),
    stepCadenceSpm: cadence,
    totalStepsToday: steps,
    activeCaloriesKcal: kcal,
    strainScore0to21: strain,
    recoveryPercent0to100: recoveryPercent,
    recoveryZone: zone,
    sleepStage,
    truthClass: 'SIMULATED_IMITATION',
    provenanceDigestSha256
  });
}

// ── Ingestion & Cross-Device Hardware Translation Bridge ────────────────────

/**
 * Cross-Device Translation: Ingests telemetry from any source wearable (e.g. Shenzhen Whoop Band)
 * and translates/formats it so another device (e.g. qWatch Pro) or PanaceaMed can process it.
 */
export function bridgeAndTranslateWearableData(
  input: PanaceaWearableTelemetryPacket,
  targetDevice: WearableDeviceModel = 'QWATCH_PRO_SMARTWATCH'
): CrossDeviceTranslationResult {
  const bridgeSha256Seal = sha256Hex(
    `CROSS_DEVICE:${input.deviceModel}->${targetDevice}:${input.timestampIso}:${input.heartRateBpm}:${input.recoveryPercent0to100}`
  );

  const qWatchProCompatibleStream = Object.freeze({
    heartRateBpm: input.heartRateBpm,
    hrvRmssdMs: input.hrvRmssdMs,
    strainScore: input.strainScore0to21,
    recoveryPct: input.recoveryPercent0to100,
    syncStatus: 'STREAM_ACTIVE_SYNCHRONIZED' as const
  });

  const translatedPayload: Record<string, unknown> = {
    sourceDeviceModel: input.deviceModel,
    targetDeviceModel: targetDevice,
    timestamp: input.timestampIso,
    vitals: {
      pulseBpm: input.heartRateBpm,
      hrvRmssd: input.hrvRmssdMs,
      spo2Pct: input.spo2Percent,
      skinTempCelsius: input.skinTemperatureCelsius
    },
    activity: {
      cadenceSpm: input.stepCadenceSpm,
      steps: input.totalStepsToday,
      activeCaloriesKcal: input.activeCaloriesKcal,
      strain: input.strainScore0to21
    },
    autonomicRecovery: {
      score0to100: input.recoveryPercent0to100,
      zone: input.recoveryZone
    },
    truthClass: input.truthClass,
    sha256Seal: bridgeSha256Seal
  };

  return Object.freeze({
    sourceDevice: input.deviceModel,
    targetDevice,
    translatedPayload: Object.freeze(translatedPayload),
    qWatchProCompatibleStream,
    bridgeSha256Seal
  });
}

// ── AI Health Interpretation Engine ─────────────────────────────────────────

/**
 * Interprets wearable telemetry into multi-tier actionable clinical & sport insights.
 */
export function interpretWearableHealthWithAi(
  telemetry: PanaceaWearableTelemetryPacket
): AiWearableClinicalInterpretation {
  const hrDelta = telemetry.heartRateBpm - 60;
  const isEarlyImmune = hrDelta >= 8 && telemetry.skinTempDeltaCelsius >= 0.5;
  const isHypoxemic = telemetry.spo2Percent < 94.0;

  let autonomicTone: 'PARASYMPATHETIC_DOMINANT' | 'BALANCED' | 'SYMPATHETIC_OVERLOAD' = 'BALANCED';
  if (telemetry.hrvRmssdMs > 65) autonomicTone = 'PARASYMPATHETIC_DOMINANT';
  else if (telemetry.hrvRmssdMs < 28) autonomicTone = 'SYMPATHETIC_OVERLOAD';

  let workoutZone: 'ZONE_1_RECOVERY' | 'ZONE_2_AEROBIC_BASE' | 'ZONE_4_5_HIGH_INTENSITY' = 'ZONE_2_AEROBIC_BASE';
  let strainMax = 14.0;
  if (telemetry.recoveryZone === 'OPTIMAL_GREEN') {
    workoutZone = 'ZONE_4_5_HIGH_INTENSITY';
    strainMax = 18.5;
  } else if (telemetry.recoveryZone === 'REST_RED') {
    workoutZone = 'ZONE_1_RECOVERY';
    strainMax = 8.0;
  }

  // Multi-tier layperson summary
  let summary = `Pemulihan harian Anda ${telemetry.recoveryPercent0to100}% (${telemetry.recoveryZone === 'OPTIMAL_GREEN' ? 'Zona Hijau - Sangat Baik' : telemetry.recoveryZone === 'ADEQUATE_YELLOW' ? 'Zona Kuning - Cukup' : 'Zona Merah - Butuh Istirahat'}). `;
  if (isEarlyImmune) {
    summary += 'Terdeteksi kenaikan suhu kulit dan denyut nadi istirahat; prioritaskan hidrasi dan istirahat ekstra.';
  } else if (telemetry.recoveryZone === 'OPTIMAL_GREEN') {
    summary += 'Sistem saraf otonom Anda dalam kondisi prima untuk aktivitas produktif atau latihan intensif.';
  } else {
    summary += 'Jaga waktu tidur malam ini dan hindari beban kerja berlebih.';
  }

  return Object.freeze({
    summaryLayperson: summary,
    clinicalFindings: Object.freeze({
      autonomicNervousTone: autonomicTone,
      restingHrDeltaBpm: hrDelta,
      possibleEarlyImmuneReaction: isEarlyImmune,
      nocturnalHypoxemiaDetected: isHypoxemic
    }),
    athleticCoachAdvice: Object.freeze({
      strainRecommendedMax: strainMax,
      workoutZoneRecommendation: workoutZone,
      classPassOrSportDropinEligible: telemetry.recoveryZone !== 'REST_RED'
    }),
    clinicallyReviewed: false,
    requiresHumanPhysicianSignoff: true,
    truthClass: telemetry.truthClass
  });
}
