import { evaluateCardiopulmonaryCouplingDeck } from "./cardiopulmonaryCouplingEngine.ts";

// PR #2991 & #2996: CellLab PINK1-Parkin Mitophagy & Proton Motive Force (Delta p)
export function simulatePink1ParkinMitophagyAndProtonMotiveForce(params: {
  readonly membranePotentialDeltaPsiMv: number;
  readonly mitochondrialMatrixPh: number;
  readonly cytosolicPh: number;
  readonly nadPlusToNadhRatio: number;
}) {
  // Proton motive force: Delta_p (mV) = Delta_Psi_m - 61.5 * Delta_pH (at 37C)
  const deltaPh = params.cytosolicPh - params.mitochondrialMatrixPh;
  const protonMotiveForceMv = Number((Math.abs(params.membranePotentialDeltaPsiMv) - 61.5 * deltaPh).toFixed(1));
  const depolarizationTriggered = params.membranePotentialDeltaPsiMv > -115;
  const pink1OuterMembraneAccumulationFold = depolarizationTriggered ? Number(((135 + params.membranePotentialDeltaPsiMv) * 0.28 + 2.4).toFixed(2)) : 1.0;
  const parkinE3UbiquitinLigaseRecruitmentPct = depolarizationTriggered ? Math.min(98, Math.round(pink1OuterMembraneAccumulationFold * 26)) : 8;

  return {
    pillarPr: "PR_2991_2996_CELLLAB_MITOPHAGY" as const,
    protonMotiveForceMv,
    depolarizationTriggered,
    pink1OuterMembraneAccumulationFold,
    parkinE3UbiquitinLigaseRecruitmentPct,
    mitophagyFluxState: depolarizationTriggered ? ("ACTIVE_PARKIN_MITOPHAGY_CLEARANCE" as const) : ("HOMEOSTATIC_OXPHOS_COUPLED" as const),
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}

// PR #2998: Referred-Pain Viscerosomatic Convergence & Dermatome Overlay
export function mapVisceralOrganToReferredPainDermatome(organId: "HEART_MYOCARDIUM" | "GALLBLADDER_BILIARY" | "APPENDIX_MIDGUT" | "URETER_RENAL_PELVIS") {
  const mappings = {
    HEART_MYOCARDIUM: {
      visceralAfferentSegments: ["T1", "T2", "T3", "T4", "T5"] as const,
      referredDermatomeRegions: ["Left Precordium", "Medial Left Arm & Ulnar Forearm (T1-T2)", "Submandibular/Jaw"] as const,
      mechanism: "Viscerosomatic convergence onto lamina I/V spinothalamic tract neurons at T1-T5."
    },
    GALLBLADDER_BILIARY: {
      visceralAfferentSegments: ["T6", "T7", "T8", "T9", "C3", "C4", "C5"] as const,
      referredDermatomeRegions: ["Right Upper Quadrant / Epigastrium (T7-T9)", "Right Suprascapular / Shoulder Tip (Kehr Sign via Phrenic C3-C5)"] as const,
      mechanism: "Splanchnic T7-T9 afferents plus diaphragmatic parietal peritoneum irritation via right phrenic nerve (C3-C5)."
    },
    APPENDIX_MIDGUT: {
      visceralAfferentSegments: ["T10", "L1"] as const,
      referredDermatomeRegions: ["Early Periumbilical Dermatomal Referral (T10)", "Late Localized McBurney Point RLQ Somatoparietal Pain (T12-L1)"] as const,
      mechanism: "Transition from visceral superior mesenteric plexus (T10) to parietal peritoneum somatic innervation."
    },
    URETER_RENAL_PELVIS: {
      visceralAfferentSegments: ["T11", "T12", "L1", "L2"] as const,
      referredDermatomeRegions: ["Costovertebral Angle Flank (T11-T12)", "Ipsilateral Inguinal Canal & Scrotum/Labia Majora (Ilioinguinal/Genitofemoral L1-L2)"] as const,
      mechanism: "Ureteric peristaltic distension radiating down T11-L2 thoracolumbar segments."
    }
  };
  return {
    pillarPr: "PR_2998_REFERRED_PAIN_DERMATOMES" as const,
    organId,
    ...mappings[organId],
    diagnosticBoundaryWarning: "Reference dermatomal map represents population convergence probabilities, not definitive individual diagnostic localization." as const,
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}

// PR #2999: Patient Biometric Organ Overlay with Strict Consent, Freshness & Identity Guard
export function bindAuthorizedPatientBiometricToOrganOverlay(params: {
  readonly activeSessionPatientId: string;
  readonly observationPatientId: string;
  readonly patientConsentGranted: boolean;
  readonly targetOrganFmaId: string;
  readonly observedHeartRateBpm: number | null;
  readonly observedAtEpochMs: number;
  readonly nowEpochMs: number;
}) {
  if (!params.patientConsentGranted) {
    return { overlayPermitted: false as const, blockReason: "CONSENT_NOT_GRANTED" as const, renderedValue: "MISSING_OBSERVATION" as const };
  }
  if (params.activeSessionPatientId !== params.observationPatientId) {
    return { overlayPermitted: false as const, blockReason: "CROSS_PATIENT_MISMATCH_BLOCKED" as const, renderedValue: "MISSING_OBSERVATION" as const };
  }
  if (params.observedHeartRateBpm === null || !Number.isFinite(params.observedHeartRateBpm)) {
    return { overlayPermitted: true as const, blockReason: null, renderedValue: "MISSING_OBSERVATION" as const, truthClass: "OBSERVED_CLINICAL" as const };
  }
  const ageSeconds = Math.max(0, Math.round((params.nowEpochMs - params.observedAtEpochMs) / 1000));
  const freshnessStatus = ageSeconds <= 300 ? ("FRESH_REALTIME" as const) : ("STALE_HISTORICAL_MEASUREMENT" as const);

  return {
    pillarPr: "PR_2999_PATIENT_BIOMETRIC_OVERLAY" as const,
    overlayPermitted: true as const,
    targetOrganFmaId: params.targetOrganFmaId,
    renderedValue: params.observedHeartRateBpm,
    unit: "bpm" as const,
    ageSeconds,
    freshnessStatus,
    truthClass: "OBSERVED_CLINICAL" as const
  };
}

// PHASE 3 & 6: Cross-Engine Consistency Verifier (Cardiopulmonary Deck vs Hemodynamics & Oxygen Registry)
export function verifyCrossEngineCardiopulmonaryConsistency() {
  const deckBaseline = evaluateCardiopulmonaryCouplingDeck({
    heartRateBpm: 75,
    endDiastolicVolumeMl: 120,
    endSystolicVolumeMl: 50,
    endSystolicElastanceMmHgPerMl: 2.0,
    unstressedVolumeV0Ml: 10,
    respiratoryRateBpm: 14,
    tidalVolumeMl: 500,
    deadSpaceMl: 150,
    inspiredFiO2Fraction: 0.21,
    hemoglobinGPerDl: 15.0,
    estimatedSao2Pct: 98
  });

  const deckHigherEes = evaluateCardiopulmonaryCouplingDeck({
    heartRateBpm: 75,
    endDiastolicVolumeMl: 120,
    endSystolicVolumeMl: 50,
    endSystolicElastanceMmHgPerMl: 2.8,
    unstressedVolumeV0Ml: 10,
    respiratoryRateBpm: 14,
    tidalVolumeMl: 500,
    deadSpaceMl: 150,
    inspiredFiO2Fraction: 0.21,
    hemoglobinGPerDl: 15.0,
    estimatedSao2Pct: 98
  });

  // Reference CO for HR 75, EDV 120, ESV 50 is exactly 5.25 L/min
  const referenceCo = 5.25;
  const maeCardiacOutput = Math.abs(deckBaseline.cardiacOutputLPerMin - referenceCo);

  return {
    deckBaseline,
    deckHigherEes,
    maeCardiacOutput,
    rConsistencyRatio: maeCardiacOutput === 0 ? 1.0 : 0.0,
    pvLoopRecalculatedOnEesChange: deckHigherEes.endSystolicPressureMmHg > deckBaseline.endSystolicPressureMmHg && deckHigherEes.ventricularArterialCouplingRatio < deckBaseline.ventricularArterialCouplingRatio
  };
}