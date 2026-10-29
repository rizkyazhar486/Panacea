/**
 * PanaceaMed Humanitas: Daily Preventive & Lifestyle Clinical Engine
 * Translating advanced physiological telemetry into actionable daily health protection.
 */

export interface DailyBiometricInput {
  userId: string;
  timestamp: number;
  restingHeartRate: number; // bpm
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  sleepDurationHours: number;
  dailyStepCount: number;
  subjectiveFatigueScore: number; // 1 to 10
}

export interface PreventiveInterventionGuidance {
  riskLevel: 'OPTIMAL' | 'MODERATE_MONITOR' | 'CLINICAL_CONSULT_RECOMMENDED';
  actionableAdvice: string[];
  hydrationTargetMl: number;
  recoveryPriority: 'LOW' | 'MEDIUM' | 'HIGH';
  provenanceReferences: string[];
}

export function evaluateDailyHealth(input: DailyBiometricInput): PreventiveInterventionGuidance {
  let riskLevel: 'OPTIMAL' | 'MODERATE_MONITOR' | 'CLINICAL_CONSULT_RECOMMENDED' = 'OPTIMAL';
  const advice: string[] = [];

  if (input.systolicBP >= 140 || input.diastolicBP >= 90) {
    riskLevel = 'CLINICAL_CONSULT_RECOMMENDED';
    advice.push('Tekanan darah Anda terpantau tinggi. Kurangi asupan natrium harian dan jadwalkan konsultasi dengan dokter.');
  } else if (input.systolicBP >= 130 || input.diastolicBP >= 85) {
    riskLevel = 'MODERATE_MONITOR';
    advice.push('Tekanan darah batas tinggi. Perbanyak relaksasi dan pantau secara berkala setiap pagi.');
  } else {
    advice.push('Tekanan darah berada dalam rentang optimal. Pertahankan pola hidup aktif.');
  }

  let recoveryPriority: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (input.sleepDurationHours < 6) {
    recoveryPriority = 'HIGH';
    advice.push('Durasi tidur kurang dari 6 jam. Prioritaskan tidur 7-8 jam malam ini untuk pemulihan imun dan kognitif.');
  } else if (input.sleepDurationHours < 7) {
    recoveryPriority = 'MEDIUM';
    advice.push('Pemulihan tidur cukup, namun tingkatkan kualitas tidur malam berikutnya.');
  } else {
    advice.push('Durasi tidur sangat baik untuk mendukung regenerasi seluler.');
  }

  const baseWaterMl = 2000;
  const activityBonus = Math.floor(input.dailyStepCount / 2000) * 250;
  const hydrationTargetMl = baseWaterMl + activityBonus;

  return {
    riskLevel,
    actionableAdvice: advice,
    hydrationTargetMl,
    recoveryPriority,
    provenanceReferences: ['AHA Guideline: Lifestyle & Cardiovascular Health', 'WHO Physical Activity Guidelines']
  };
}
