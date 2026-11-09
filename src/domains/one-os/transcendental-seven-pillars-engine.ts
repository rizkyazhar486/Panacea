import { sanitizeTelemetryValue } from "../governance/universal-crash-shield.ts";

// ============================================================================
// PILAR I: SUBCELLULAR MITOCHONDRIA (ΔΨm) & AUTOPHAGY KINETICS (AMPK/mTOR & LC3-II)
// ============================================================================
export function simulateMitochondriaAndAutophagyKinetics(params: {
  readonly nadPlusToNadhRatio: number;
  readonly fastingHours: number;
  readonly cellularRosIndex0to10: number;
  readonly exerciseMetabolicLoadMet: number;
}) {
  const nadRatio = Math.max(0.5, Math.min(10, params.nadPlusToNadhRatio));
  const fasting = Math.max(0, Math.min(72, params.fastingHours));
  const ros = Math.max(0, Math.min(10, params.cellularRosIndex0to10));
  const met = Math.max(1, Math.min(20, params.exerciseMetabolicLoadMet));

  // Potensial membran mitokondria ΔΨm normal berkisar -140 mV s/d -180 mV
  const deltaPsiM_mV = Number((-135 - nadRatio * 6.5 + ros * 4.2).toFixed(1));
  const ampkToMtorRatio = Number(((1.0 + fasting * 0.085 + (met - 1) * 0.14) / Math.max(0.4, 1.5 - fasting * 0.02)).toFixed(2));
  const lc3IIAutophagyFluxPercent = Number(Math.min(100, Math.max(10, ampkToMtorRatio * 34)).toFixed(1));
  const atpSynthesisFluxMmolMin = Number(Math.max(12, (Math.abs(deltaPsiM_mV) / 160) * 68 - ros * 1.8).toFixed(2));

  return {
    pillar: "PILLAR_I_QUANTUM_MITOCHONDRIA_AUTOPHAGY" as const,
    mitochondrialMembranePotentialMv: deltaPsiM_mV,
    ampkToMtorRatio,
    lc3IIAutophagyFluxPercent,
    lysosomalFusionActive: ampkToMtorRatio >= 1.5,
    atpSynthesisFluxMmolMin,
    truthClass: "SIMULATED_EDUCATIONAL" as const,
    clinicallyReviewed: false as const
  };
}

// ============================================================================
// PILAR II: UNIVERSAL DEVICE TRANSLATION OS (UDT-OS: PAPER ECG -> WEARABLES -> BIO-IMPEDANCE)
// ============================================================================
export function ingestUniversalDeviceTelemetryEnvelope(params: {
  readonly patientId: string;
  readonly paperEcgRrIntervalMm?: number | null;
  readonly paperSpeedMmPerSec?: 25 | 50;
  readonly wearableHrvRmssdMs?: number | null;
  readonly cgmReadingsMgDl?: readonly number[];
  readonly bioImpedancePhaseAngleDeg?: number | null;
}) {
  const speed = params.paperSpeedMmPerSec ?? 25;
  const rrMm = sanitizeTelemetryValue(params.paperEcgRrIntervalMm);
  const digitizedPaperEcgHrBpm = rrMm && rrMm > 0 ? Number(((60 * speed) / rrMm).toFixed(1)) : ("MISSING_OBSERVATION" as const);

  const hrvRmssdMs = sanitizeTelemetryValue(params.wearableHrvRmssdMs) ?? ("MISSING_OBSERVATION" as const);
  const validCgm = (params.cgmReadingsMgDl ?? []).map(sanitizeTelemetryValue).filter((v): v is number => v !== null);
  const inRangeCount = validCgm.filter((g) => g >= 70 && g <= 180).length;
  const cgmTimeInRangePercent = validCgm.length > 0 ? Number(((inRangeCount / validCgm.length) * 100).toFixed(1)) : ("MISSING_OBSERVATION" as const);
  const phaseAngle = sanitizeTelemetryValue(params.bioImpedancePhaseAngleDeg) ?? ("MISSING_OBSERVATION" as const);

  return {
    pillar: "PILLAR_II_UDT_OS_LONGITUDINAL_ENVELOPE" as const,
    patientId: params.patientId,
    legacyPaperEcgDigitizedHrBpm: digitizedPaperEcgHrBpm,
    modernWearableHrvRmssdMs: hrvRmssdMs,
    modernCgmTimeInRangePercent: cgmTimeInRangePercent,
    futureBioImpedancePhaseAngleDeg: phaseAngle,
    blankValuesPreserved: true as const,
    truthClass: "DERIVED_CLINICAL" as const,
    clinicallyReviewed: false as const
  };
}

// ============================================================================
// PILAR III: PANTHEON MULTI-AGENT CLINICAL CONSENSUS (CARDIO x NEPHRO x PULMO x ID)
// ============================================================================
export function synthesizePantheonMultiSpecialtyConsensus(params: {
  readonly meanArterialPressureMmHg: number;
  readonly serumLactateMmolL: number;
  readonly lvefPercent: number;
  readonly egfrMlMin173m2: number;
  readonly paO2FiO2Ratio: number;
}) {
  const fluidOverloadRisk = params.lvefPercent < 40 || params.egfrMlMin173m2 < 30 || params.paO2FiO2Ratio < 200;
  const septicShockDetected = params.meanArterialPressureMmHg < 65 && params.serumLactateMmolL > 2.0;

  return {
    pillar: "PILLAR_III_PANTHEON_MULTI_AGENT_CONSENSUS" as const,
    septicShockDetected,
    fluidOverloadRisk,
    specialistAgents: {
      cardiologyAgent: fluidOverloadRisk
        ? "LVEF depressed (<40%); use dynamic stroke-volume-variation (SVV) guided mini-boluses (250 mL) rather than blind bulk crystalloid."
        : "Left ventricular systolic reserve adequate for standard Surviving Sepsis 30 mL/kg crystalloid resuscitation.",
      nephrologyAgent: params.egfrMlMin173m2 < 45
        ? "Renal hypoperfusion risk (eGFR < 45); prefer balanced crystalloids (Lactated Ringer/Plasma-Lyte) over 0.9% NaCl to prevent hyperchloremic acidosis; avoid nephrotoxic aminoglycosides/vancomycin trough spikes."
        : "Renal clearance adequate; monitor hourly urine output (>= 0.5 mL/kg/h).",
      pulmonologyAgent: params.paO2FiO2Ratio < 200
        ? "Moderate-to-severe ARDS physiology (P/F < 200); enforce lung-protective tidal volume (6 mL/kg PBW) and plateau pressure <= 30 cmH2O."
        : "Oxygenation index stable; titrate FiO2 to SpO2 94-98%.",
      infectiousDiseaseAgent: "Obtain 2 sets of blood cultures prior to empiric broad-spectrum beta-lactam administration within 60 minutes."
    },
    harmonizedOrderSetSummary: septicShockDetected && fluidOverloadRisk
      ? "HARMONIZED PROTOCOL: Early norepinephrine titration (target MAP >= 65 mmHg) + SVV-guided balanced crystalloid aliquots + renally-dosed empiric antimicrobials + lung-protective PEEP."
      : "STANDARD SEPSIS-3 BUNDLE: 30 mL/kg balanced crystalloid + blood cultures + empiric antimicrobials + serial lactate check.",
    truthClass: "SIMULATED_EDUCATIONAL" as const,
    clinicallyReviewed: false as const
  };
}

// ============================================================================
// PILAR IV: ZERO-LOSS EMR, CLOSED-LOOP REFERRAL & UNIVERSAL PAYER/INSURANCE CLAIM
// ============================================================================
export function buildZeroLossEmrAndInsuranceClaimEnvelope(params: {
  readonly encounterId: string;
  readonly patientId: string;
  readonly primaryIcd10Code: string;
  readonly snomedConceptId: string;
  readonly referralTargetSpecialty: string;
  readonly observedVitalMapMmHg: number | null;
  readonly simulatedDigitalTwinRiskScore: number;
}) {
  const cleanMap = sanitizeTelemetryValue(params.observedVitalMapMmHg);
  return {
    pillar: "PILLAR_IV_ZERO_LOSS_EMR_AND_PAYER_HARMONIZATION" as const,
    encounterId: params.encounterId,
    patientId: params.patientId,
    workflowStagesCompleted: ["PRE_VISIT_TRIAGE", "BEDSIDE_ENCOUNTER", "CLOSED_LOOP_DIAGNOSTIC_REFERRAL", "UNIVERSAL_PAYER_FHIR_CLAIM"] as const,
    authoritativeEmrRecord: {
      icd10Code: params.primaryIcd10Code,
      snomedConceptId: params.snomedConceptId,
      observedMeanArterialPressureMmHg: cleanMap === null ? ("MISSING_OBSERVATION" as const) : cleanMap,
      truthClass: "OBSERVED_CLINICAL" as const
    },
    isolatedEducationalSandbox: {
      simulatedDigitalTwinRiskScore: params.simulatedDigitalTwinRiskScore,
      truthClass: "SIMULATED_EDUCATIONAL" as const
    },
    closedLoopReferral: {
      targetSpecialty: params.referralTargetSpecialty,
      referralStatus: "ACKNOWLEDGED_CLOSED_LOOP" as const
    },
    payerClaimReady: Boolean(params.primaryIcd10Code && params.snomedConceptId),
    clinicallyReviewed: false as const
  };
}

// ============================================================================
// PILAR V: 3D BIOMECHANICS FOOT STRIKE & MTP JOINT ARTICULATION
// ============================================================================
export function analyzeFootStrikeAndMtpArticulation(params: {
  readonly footPitchAtContactDeg: number;
  readonly mtpDorsiflexionPeakDeg: number;
  readonly groundContactTimeMs: number;
  readonly cadenceSpm: number;
}) {
  const strikePattern =
    params.footPitchAtContactDeg < -3 ? ("FOREFOOT_STRIKE" as const) :
    params.footPitchAtContactDeg <= 5 ? ("MIDFOOT_STRIKE" as const) : ("REARFOOT_HEEL_STRIKE" as const);
  const windlassMechanismEfficiencyPercent = Number(Math.min(100, Math.max(40, (params.mtpDorsiflexionPeakDeg / 45) * 92)).toFixed(1));
  return {
    pillar: "PILLAR_V_SENSORIUM_3D_MTP_BIOMECHANICS" as const,
    strikePattern,
    footPitchAtContactDeg: params.footPitchAtContactDeg,
    mtpDorsiflexionPeakDeg: params.mtpDorsiflexionPeakDeg,
    windlassMechanismEfficiencyPercent,
    groundContactTimeMs: params.groundContactTimeMs,
    cadenceSpm: params.cadenceSpm,
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}

// ============================================================================
// PILAR VI: EPIGENETIC PHENOAGE / GRIMAGE LONGEVITY & PLANETARY EXPOSOME
// ============================================================================
export function computePhenoAgeAndExposomeTrajectory(params: {
  readonly chronologicalAgeYears: number;
  readonly albuminGdl: number;
  readonly creatinineMgDl: number;
  readonly fastingGlucoseMgDl: number;
  readonly hsCrpMgL: number;
  readonly sleepRegularityIndex0to100: number;
  readonly ambientPm25UgM3: number;
  readonly weeklySaunaOrColdPlungeSessions: number;
}) {
  const protectiveOffset =
    (params.albuminGdl - 4.5) * 2.2 +
    (params.sleepRegularityIndex0to100 - 80) * 0.08 +
    params.weeklySaunaOrColdPlungeSessions * 0.45;
  const agingStress =
    Math.max(0, params.fastingGlucoseMgDl - 88) * 0.06 +
    Math.max(0, params.hsCrpMgL - 0.8) * 1.1 +
    Math.max(0, params.ambientPm25UgM3 - 12) * 0.04;

  const estimatedPhenoAgeYears = Number((params.chronologicalAgeYears + agingStress - protectiveOffset).toFixed(2));
  const epigeneticAgeAccelerationYears = Number((estimatedPhenoAgeYears - params.chronologicalAgeYears).toFixed(2));
  const paceOfAgingDunedinPoAm = Number(Math.max(0.65, Math.min(1.45, 1.0 + epigeneticAgeAccelerationYears * 0.035)).toFixed(3));

  return {
    pillar: "PILLAR_VI_LONGEVITY_PHENOAGE_AND_EXPOSOME" as const,
    chronologicalAgeYears: params.chronologicalAgeYears,
    estimatedPhenoAgeYears,
    epigeneticAgeAccelerationYears,
    paceOfAgingDunedinPoAm,
    planetaryExposomeLoad: params.ambientPm25UgM3 <= 15 ? ("OPTIMAL_CLEAN_AIR" as const) : ("ELEVATED_PARTICULATE_OXIDATIVE_LOAD" as const),
    truthClass: "SIMULATED_EDUCATIONAL" as const,
    clinicallyReviewed: false as const
  };
}