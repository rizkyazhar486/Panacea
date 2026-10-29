/**
 * PanaceaMed Applicative Utility Kernel (Directive 021)
 * Grounding high-level scientific simulation into daily clinical, preventive, and operational workflows.
 */

export interface ClinicalWorkflowInput {
  patientId: string;
  telomereHealthScore: number; // 0 to 100
  antimicrobialSensitivityIndex: number; // %
  autonomicRecoveryHRV: number; // ms
}

export interface ClinicalActionableGuidance {
  riskTier: 'OPTIMAL' | 'REQUIRES_MONITORING' | 'CLINICAL_INTERVENTION';
  actionableSteps: string[];
  evidenceReference: string;
}

export function evaluateClinicalUtility(input: ClinicalWorkflowInput): ClinicalActionableGuidance {
  const compositeScore = (input.telomereHealthScore * 0.4) + (input.antimicrobialSensitivityIndex * 0.3) + (Math.min(input.autonomicRecoveryHRV / 100, 1) * 30);
  
  let risk: 'OPTIMAL' | 'REQUIRES_MONITORING' | 'CLINICAL_INTERVENTION' = 'OPTIMAL';
  let steps = [
    'Pertahankan pola pemulihan harian dan hidrasi presisi.',
    'Lanjutkan pemantauan longitudinal rutin sesuai jadwal.'
  ];

  if (compositeScore < 50) {
    risk = 'CLINICAL_INTERVENTION';
    steps = [
      'Segera jadwalkan evaluasi klinis mendalam.',
      'Tinjau ulang profil resistensi antimikroba dan indikator inflamasi.',
      'Terapkan protokol pemulihan otonom ketat.'
    ];
  } else if (compositeScore < 75) {
    risk = 'REQUIRES_MONITORING';
    steps = [
      'Tingkatkan frekuensi pemantauan HRV dan durasi istirahat malam.',
      'Evaluasi ulang target nutrisi preventif harian.'
    ];
  }

  return {
    riskTier: risk,
    actionableSteps: steps,
    evidenceReference: 'AHA/WHO Longitudinal Clinical Guidelines & Evidence-Based Preventive Protocols'
  };
}
