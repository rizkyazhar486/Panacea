import assert from "node:assert/strict";
import test from "node:test";
import * as omnicausalis from "../../src/domains/omnicausalis-index.ts";

test("1. [BX-1..10 & EDU-1..6] Multiscale Hemodynamics, Alveolar Gas, AHA-17 & 15-Step Golden Journey", () => {
  const hemo = omnicausalis.computeHemodynamics(75, 120, 50, 120, 80, 5);
  assert.equal(hemo.cardiacOutputLMin, 5.25);
  const resp = omnicausalis.executeRespiratoryBx4Journey(0.21, 40, 88, 30);
  assert.equal(resp.alveolarGas.alveolarPO2MmHg, 99.73);
  const neuro = omnicausalis.executeNeurologicalBx1Journey("CORTICOSPINAL", "INTERNAL_CAPSULE", "LEFT");
  assert.equal(neuro.localization.deficitSide, "CONTRALATERAL");
  const journey = omnicausalis.runGoldenJourneyVerificationSession("koas-kelvin");
  assert.equal(journey.completedSteps.length, 15);
});

test("2. [KALOLUMEN & MEDMLX] <10s DICOM 3DCG Reconstruction, 3-Layer Cross-Section & Mouse-Drag Light", () => {
  const dicom = omnicausalis.reconstructPhotorealistic3DCGFromDicomFolder({ folderPath: "/DICOM/CT_256", sliceCount: 256 });
  assert.equal(dicom.withinTenSecondSla, true);
  assert.equal(dicom.layers.length, 3);
  const toggled = omnicausalis.updateIndependentLayerCrossSection(dicom.layers, 1, { crossSectionEnabled: false });
  assert.equal(toggled[0].crossSectionEnabled, false);
  assert.equal(toggled[1].crossSectionEnabled, true);
  const light = omnicausalis.computeLightDirectionFromMouseDrag(35, 40, 20, -10);
  assert.equal(light.directionVectorXYZ.length, 3);
});

test("3. [BIOEMU2, FASTPLMS/ESMFOLD2, ALPHAFOLD2-WEBGPU, BINDCRAFT2 & PROTEINFIGHTER]", () => {
  const ens = omnicausalis.sampleBioEmu2EquilibriumEnsemble({ targetProteinId: "RYR2_CALCIUM_CHANNEL", ligandBound: true });
  assert.ok(ens.states[2].equilibriumProbability > 0.5);
  const seq = "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL";
  const fold = omnicausalis.predictStructureWithFastPlmAndWebGpu({ sequence: seq, modelTier: "SYNTHYRA_ESMFOLD2_600M" });
  assert.ok(fold.meanPlddt0to100 > 80);
  const duel = omnicausalis.designDeNovoBinderAndRunProteinFighter({ targetEpitopeName: "RyR2", binderSequence: seq, rivalBotId: "DR_SENKU_KUN" });
  assert.equal(duel.proteinFighterArenaMatch.victory, true);
});

test("4. [FREEMOCAP, SEPSISAGENT, TALKVID, GPS TRACKER & AI FOOD PHOTO CALORIE]", () => {
  const mocap = omnicausalis.analyzeFreeMoCapSkellyPose({ leftHipXYZ: [-0.1, 0.9, 0], leftKneeXYZ: [-0.1, 0.5, 0.1], leftAnkleXYZ: [-0.1, 0.1, 0], rightHipXYZ: [0.1, 0.9, 0], rightKneeXYZ: [0.1, 0.5, 0.1], rightAnkleXYZ: [0.1, 0.1, 0] });
  assert.equal(mocap.stepSymmetryIndexPercent, 100);
  const sepsis = omnicausalis.evaluateSepsisAgentAndRemopSafety({ respiratoryRateBpm: 28, systolicBpMmHg: 84, glasgowComaScale3to15: 13, paO2FiO2Ratio: 180, platelets10e3PerUl: 85, bilirubinMgDl: 2.5, meanArterialPressureMmHg: 58, creatinineMgDl: 2.4, lactateMmolL: 4.5 });
  assert.equal(sepsis.septicShockEducationalFlag, true);
  const gps = omnicausalis.evaluateGpsWorkoutSession({ bodyWeightKg: 70, waypoints: [{ lat: -6.22, lng: 106.65, altitudeMeters: 25, timestampMs: 0 }, { lat: -6.20, lng: 106.67, altitudeMeters: 40, timestampMs: 900000 }] });
  assert.ok(gps.totalDistanceKm > 2.5);
  const food = omnicausalis.analyzeFoodPhotoAndGenerateNutritionPlan({ imageId: "img-1", detectedDishKeys: ["CHICKEN_BREAST_GRILLED_200G", "BROWN_RICE_150G"], workoutCaloriesBurnedKcal: gps.caloriesBurnedKcal });
  assert.equal(food.totals.totalCaloriesKcal, 498);
});

test("5. [UNIVERSAL CRASH SHIELD & DUAL-PROJECTION UX] Prevents Page Crashes and Preserves Blank/Null as Non-Zero", () => {
  assert.equal(omnicausalis.sanitizeTelemetryValue(null), null);
  assert.equal(omnicausalis.sanitizeTelemetryValue(""), null);
  assert.equal(omnicausalis.sanitizeTelemetryValue(NaN), null);
  const shielded = omnicausalis.safeExecutePageComputation("TEST_CRASH_PAGE", () => { throw new Error("Simulated Component Throw"); }, { safeFallback: true });
  assert.equal(shielded.ok, false);
  assert.equal(shielded.recoveredFromError, true);
  assert.equal(shielded.data.safeFallback, true);
  const mobileUx = omnicausalis.evaluateDualProjectionLayout(390, 844);
  assert.equal(mobileUx.projectionMode, "MOBILE_STACKED_CARDS_INFINITE_SCROLL");
  assert.equal(mobileUx.horizontalOverflowPermitted, false);
  const desktopUx = omnicausalis.evaluateDualProjectionLayout(1440, 900);
  assert.equal(desktopUx.projectionMode, "DESKTOP_MULTI_COLUMN_AND_3D_TWIN");
});

test("6. [7 TRANSCENDENTAL PILLARS] Mitochondria/Autophagy, UDT-OS, Pantheon Consensus, Zero-Loss EMR/Payer, MTP Gait & PhenoAge Longevity", () => {
  const mito = omnicausalis.simulateMitochondriaAndAutophagyKinetics({ nadPlusToNadhRatio: 4.5, fastingHours: 18, cellularRosIndex0to10: 1.5, exerciseMetabolicLoadMet: 8.5 });
  assert.equal(mito.lysosomalFusionActive, true);
  assert.ok(mito.mitochondrialMembranePotentialMv < -150);
  const udt = omnicausalis.ingestUniversalDeviceTelemetryEnvelope({ patientId: "pt-01", paperEcgRrIntervalMm: 20, paperSpeedMmPerSec: 25, wearableHrvRmssdMs: null, cgmReadingsMgDl: [85, 94, 110, 125] });
  assert.equal(udt.legacyPaperEcgDigitizedHrBpm, 75);
  assert.equal(udt.modernWearableHrvRmssdMs, "MISSING_OBSERVATION");
  assert.equal(udt.modernCgmTimeInRangePercent, 100);
  const pantheon = omnicausalis.synthesizePantheonMultiSpecialtyConsensus({ meanArterialPressureMmHg: 58, serumLactateMmolL: 3.8, lvefPercent: 32, egfrMlMin173m2: 28, paO2FiO2Ratio: 170 });
  assert.equal(pantheon.septicShockDetected, true);
  assert.equal(pantheon.fluidOverloadRisk, true);
  const emr = omnicausalis.buildZeroLossEmrAndInsuranceClaimEnvelope({ encounterId: "enc-1", patientId: "pt-01", primaryIcd10Code: "A41.9", snomedConceptId: "91302008", referralTargetSpecialty: "CRITICAL_CARE_NEPHROLOGY", observedVitalMapMmHg: null, simulatedDigitalTwinRiskScore: 0.82 });
  assert.equal(emr.authoritativeEmrRecord.observedMeanArterialPressureMmHg, "MISSING_OBSERVATION");
  assert.equal(emr.payerClaimReady, true);
  const mtp = omnicausalis.analyzeFootStrikeAndMtpArticulation({ footPitchAtContactDeg: -6, mtpDorsiflexionPeakDeg: 42, groundContactTimeMs: 195, cadenceSpm: 182 });
  assert.equal(mtp.strikePattern, "FOREFOOT_STRIKE");
  const pheno = omnicausalis.computePhenoAgeAndExposomeTrajectory({ chronologicalAgeYears: 30, albuminGdl: 4.9, creatinineMgDl: 0.85, fastingGlucoseMgDl: 82, hsCrpMgL: 0.4, sleepRegularityIndex0to100: 92, ambientPm25UgM3: 10, weeklySaunaOrColdPlungeSessions: 4 });
  assert.ok(pheno.estimatedPhenoAgeYears < pheno.chronologicalAgeYears);
});

test("7. [YOUR BODY HEALTHSPAN ID, ATHLYTIC/WHOOP SPORT SCIENCE, RECLUB/CLASSPASS & ASTRA AUTO-HEALER]", () => {
  const astra = omnicausalis.runAstraSelfHealingAndHippocraticAudit();
  assert.equal(astra.astraPipelineHealthy, true);
  assert.equal(astra.primumNonNocereVerified, true);
  const body = omnicausalis.computeYourBodyHealthspanPortfolio({
    citizenId: "kelvin-001",
    chronologicalAgeYears: 25,
    vo2MaxMlKgMin: 56,
    hrvRmssdMs: 88,
    hrvBaseline60dMs: 76,
    restingHeartRateBpm: 50,
    restorativeSleepRatio0to1: 0.48,
    acuteLoad7dTrimp: 480,
    chronicLoad28dTrimp: 440,
    fastingGlucoseMgDl: 81,
    zone2MinutesWeekly: 210
  });
  assert.equal(body.longitudinalHealthId, "PANACEA-LHID-KELVIN-001");
  assert.ok(body.projectedBiologicalAgeYears < body.chronologicalAgeYears);
  assert.equal(body.athlyticWhoopMetrics.recoveryTier, "OPTIMAL_GREEN");
  const matches = omnicausalis.matchReclubAndClassPassSessionsToBiology(body);
  assert.equal(matches.length, 3);
  assert.equal(matches[0].venueName, "The Forum Sports Hub Bintaro, Jakarta Selatan");
  assert.equal(matches[0].matchStatus, "BIOLOGICALLY_OPTIMAL_MATCH");
});

test("8. [P0 SHA-256 & FHIR R4 & SEPSIS 2026]", () => {
  const env = omnicausalis.generatePanaceaLhidEnvelope({ patientId: "PATIENT-999", payload: { test: true } });
  assert.ok(env.pseudonymizedPatientDid.startsWith("did:panacea:piv:"));
  assert.equal(env.cryptographicSha256.length, 64);
  const fhirBundle = omnicausalis.buildFhirBundleForSepsisCare({ patientCanonicalId: "PATIENT-999", encounterId: "enc-1", lactateMmolL: 3.5, bloodCultureTakenBeforeAntibiotics: true, broadSpectrumAntibioticsAdministered: true, crystalloidBolusMlPerKg: 30, meanArterialPressureMmHg: 62 });
  assert.equal(fhirBundle.resourceType, "Bundle");
  assert.ok(fhirBundle.entry.length >= 3);
  const sepsis2026 = omnicausalis.evaluateSepsis2026GuidelineCompliance({ suspectedInfection: true, qSofaScore0to3: 2, serumLactateMmolL: 3.5, meanArterialPressureMmHg: 60, bloodCultureObtainedBeforeAntimicrobials: true, antimicrobialsAdministeredWithin60Min: true, crystalloidResuscitation30MlPerKgComplete: true, vasopressorInitiatedIfPersistentHypotension: true });
  assert.equal(sepsis2026.bundleFullyCompliant, true);
});

test("9. [P1 ACWR & P2 WIGGERS & KROGH PHYSIOLOGY]", () => {
  const acwr = omnicausalis.calculateSafeAcuteChronicWorkloadRatio({ acuteTrainingLoadTrimp: 500, chronicTrainingLoadTrimp: 400, athleteId: "ath-1" });
  assert.equal(acwr.acwr, 1.25);
  const wiggers = omnicausalis.computeWiggersCardiacCyclePressure(120, 75);
  assert.ok(wiggers.leftVentricularPressureMmHg > 0);
  const krogh = omnicausalis.computeKroghCylinderOxygenDiffusion({ capillaryPo2MmHg: 45, tissueRadiusMicrons: 20, KroghDiffusionCoefficientK: 1.5, oxygenConsumptionRateMmolSec: 0.05 });
  assert.ok(krogh.tissuePo2MmHg >= 0);
});

test("10. [PR #2985 RENAL NEPHRON AUTOREGULATION, TGF & LOOP OF HENLE COUNTERCURRENT]", () => {
  const norm = omnicausalis.simulateRenalAutoregulationAndCountercurrent({ meanArterialPressureMmHg: 105, adhVasopressinActivity0to1: 0.85, urineSodiumMmolL: 12, plasmaSodiumMmolL: 140, urineCreatinineMgDl: 120, plasmaCreatinineMgDl: 1.0 });
  assert.equal(norm.tubuloglomerularFeedbackState, "AUTOREGULATED_PLATEAU");
  assert.ok(norm.estimatedGfrMlMin > 100 && norm.estimatedGfrMlMin < 145);
  assert.ok(norm.finalUrineOsmolalityMosmKg > 800);
  assert.ok(typeof norm.fractionalExcretionSodiumPercent === "number" && norm.fractionalExcretionSodiumPercent < 1.0);
  const loopDiuretic = omnicausalis.simulateRenalAutoregulationAndCountercurrent({ meanArterialPressureMmHg: 105, adhVasopressinActivity0to1: 0.85, loopDiureticFurosemideActive: true });
  assert.ok(loopDiuretic.peakMedullaryInterstitialOsmolalityMosmKg < norm.peakMedullaryInterstitialOsmolalityMosmKg);
});

test("11. [WORKSTREAM A & B: ONE PANACEA CLINICAL OS IDEMPOTENT WORKFLOW & DICOMWEB SSRF/UID GUARD]", () => {
  const wf1 = omnicausalis.executeOnePanaceaClinicalOsWorkflow({ encounterId: "ENC-2026-901", patientCanonicalId: "PT-777", preVisitChiefComplaint: "Fever and tachypnea", anamnesisAndExamSummary: "Rales right lower lobe", observedLactateMmolL: null, observedMapMmHg: 68, clinicianAuthorizedReview: true, followUpDays: 7 });
  assert.equal(wf1.idempotentReplay, false);
  assert.equal(wf1.observedVitals.lactateMmolL, "MISSING_OBSERVATION");
  assert.equal(wf1.stagesCompleted.length, 11);
  const wf2 = omnicausalis.executeOnePanaceaClinicalOsWorkflow({ encounterId: "ENC-2026-901", patientCanonicalId: "PT-777", preVisitChiefComplaint: "Fever and tachypnea", anamnesisAndExamSummary: "Rales right lower lobe", observedLactateMmolL: null, observedMapMmHg: 68, clinicianAuthorizedReview: true, followUpDays: 7 });
  assert.equal(wf2.idempotentReplay, true);
  const dicomReq = omnicausalis.buildSecureDicomWebQidoWadoRequest({ pacsBaseHttpsUrl: "https://pacs.panaceamed.id/dicomweb", studyInstanceUid: "1.2.840.113619.2.55.3.604688119.868.1256290000.1", patientCanonicalId: "PT-777", modality: "CT" });
  assert.equal(dicomReq.ssrfVerifiedSafe, true);
  assert.throws(() => omnicausalis.buildSecureDicomWebQidoWadoRequest({ pacsBaseHttpsUrl: "https://169.254.169.254/latest/meta-data", studyInstanceUid: "1.2.840.113619.2.55.3", patientCanonicalId: "PT-777", modality: "CT" }));
});

test("12. [BODY EXPOSURE x PROMETHEUS PERSISTENT SAVED LEARNING JOURNEY]", () => {
  const saved = omnicausalis.executeAndPersistBodyExposurePrometheusJourney({ learnerId: "kelvin-koas", domain: "RENAL_NEPHRON_TGF", cameraCoordinatesXYZ: [0.42, 1.12, -0.18], manipulatedMapMmHg: 110, assessmentGrade1to4: 4 });
  assert.equal(saved.returnedToAnatomicalContext, true);
  const restored = omnicausalis.restorePersistedLearnerJourney("kelvin-koas", "RENAL_NEPHRON_TGF");
  assert.ok(restored !== null);
  assert.deepEqual(restored.cameraCoordinatesXYZ, [0.42, 1.12, -0.18]);
});

test("13. [WAVE 1-4 CROSS-ORGAN PHYSIOLOGICAL COUPLING: HEMORRHAGE, EXERCISE & SALTATORY CONDUCTION]", () => {
  const base = omnicausalis.executeCrossOrganCoupledSimulation({ scenarioId: "BASELINE_HOMEOSTASIS" });
  const bleed = omnicausalis.executeCrossOrganCoupledSimulation({ scenarioId: "ACUTE_HEMORRHAGE_CLASS_II", circulatingBloodVolumeMl: 3750 });
  assert.ok(bleed.cardiovascular.heartRateBpm > base.cardiovascular.heartRateBpm);
  assert.ok(bleed.cardiovascular.strokeVolumeMl < base.cardiovascular.strokeVolumeMl);
  assert.ok(bleed.renalAndElectrolyte.estimatedGfrMlMin < base.renalAndElectrolyte.estimatedGfrMlMin);
  const demyelinated = omnicausalis.executeCrossOrganCoupledSimulation({ scenarioId: "BASELINE_HOMEOSTASIS", myelinInternodeIntegrity0to1: 0.35 });
  assert.ok(demyelinated.neuroMuscularAndMicrovascular.oneMeterTractLatencyMs > base.neuroMuscularAndMicrovascular.oneMeterTractLatencyMs);
});

test("14. [WAVE 6 UNIVERSAL SURGICAL SIMULATOR EXTENSION: CABG LIMA-TO-LAD POISEUILLE FLOW & PHRENIC GUARD]", () => {
  const cabgPatent = omnicausalis.evaluateCabgEducationalSurgicalSimulation({
    sessionId: "CABG-SIM-01",
    currentPhase: "CLAMP_RELEASE_AND_DOPPLER_FLOW_VERIFICATION",
    selectedInstrument: "TRANSIT_TIME_DOPPLER_PROBE",
    nativeLadStenosisPercent: 90,
    limaGraftRadiusMm: 1.35,
    limaGraftLengthMm: 110,
    meanAorticRootPressureMmHg: 88,
    distalCoronaryBedPressureMmHg: 24,
    anastomosisPatencyQuality0to1: 0.96,
    distanceToLeftPhrenicNerveMm: 14
  });
  assert.equal(cabgPatent.poiseuilleGraftHemodynamics.graftFlowClinicallyAdequateInModel, true);
  assert.equal(cabgPatent.structuresAtRiskAlert, "SAFE_DISSECTION_CORRIDOR");
  const cabgStenotic = omnicausalis.evaluateCabgEducationalSurgicalSimulation({
    sessionId: "CABG-SIM-02",
    currentPhase: "LAD_ARTERIOTOMY_AND_DISTAL_ANASTOMOSIS",
    selectedInstrument: "CASTROVIEJO_NEEDLE_HOLDER_8_0",
    nativeLadStenosisPercent: 90,
    limaGraftRadiusMm: 1.35,
    limaGraftLengthMm: 110,
    meanAorticRootPressureMmHg: 88,
    distalCoronaryBedPressureMmHg: 24,
    anastomosisPatencyQuality0to1: 0.25,
    distanceToLeftPhrenicNerveMm: 3.2
  });
  assert.ok(cabgStenotic.poiseuilleGraftHemodynamics.limaGraftFlowMlMin < cabgPatent.poiseuilleGraftHemodynamics.limaGraftFlowMlMin);
  assert.ok(cabgStenotic.structuresAtRiskAlert.includes("PHRENIC_NERVE_PROXIMITY_WARNING"));
});

test("15. [WAVE 5 MEDSCIHUB / MEDSTUDYHUB 6-DEPTH PROJECTIONS, OSCE CHECKLIST & SHA-256 SVG MEDIA]", () => {
  const publicProj = omnicausalis.projectDiseaseConceptByDepthMode("ACS_LAD_ISCHEMIA", "PUBLIC_EVERYDAY");
  const profProj = omnicausalis.projectDiseaseConceptByDepthMode("ACS_LAD_ISCHEMIA", "PROFESSOR_RESEARCH");
  assert.notEqual(publicProj.mechanisticExplanation, profProj.mechanisticExplanation);
  assert.equal(profProj.generatedSvgMediaAsset.sha256Hash.length, 64);
  assert.equal(profProj.osceStationChecklist.length, 4);
});

test("16. [WAVE 7 HEPATOBILIARY-PANCREATIC POSTPRANDIAL DYNAMICS & LAPAROSCOPIC CRITICAL VIEW OF SAFETY]", () => {
  const meal = omnicausalis.simulateHepatobiliaryPancreaticPostprandialDynamics({
    fastingPlasmaGlucoseMgDl: 84,
    fastingInsulinUiuMl: 6.5,
    ingestedCarbohydrateGrams: 55,
    ingestedProteinGrams: 38,
    ingestedFatGrams: 22,
    minutesPostprandial: 45
  });
  assert.ok(meal.plasmaGlucoseMgDl > 84);
  assert.equal(meal.hepaticGlycogenSynthaseActive, true);
  const cvsSafe = omnicausalis.evaluateLaparoscopicCholecystectomyCriticalViewOfSafety({
    sessionId: "LAP-CHOLE-01",
    hepatocysticTriangleCleared: true,
    lowerThirdGallbladderMobilizedFromCysticPlate: true,
    exactlyTwoStructuresEnteringGallbladderConfirmed: true,
    distanceFromCommonBileDuctMm: 7.5
  });
  assert.equal(cvsSafe.clipAndDividePermittedInSimulation, true);
  const cvsUnsafe = omnicausalis.evaluateLaparoscopicCholecystectomyCriticalViewOfSafety({
    sessionId: "LAP-CHOLE-02",
    hepatocysticTriangleCleared: true,
    lowerThirdGallbladderMobilizedFromCysticPlate: false,
    exactlyTwoStructuresEnteringGallbladderConfirmed: true,
    distanceFromCommonBileDuctMm: 3.0
  });
  assert.equal(cvsUnsafe.clipAndDividePermittedInSimulation, false);
});

test("17. [WAVE 8 MOBILE MINIMALIST LOGO, MONOLINE SVG ICON & TABULAR TYPOGRAPHY CONTRACT]", () => {
  const tokens = omnicausalis.getCanonicalMobileMinimalistDesignTokens();
  assert.equal(tokens.brandMark.squircleSizePx, 40);
  assert.equal(tokens.iconSystem.containerTouchTargetPx, 44);
  assert.equal(tokens.iconSystem.rawEmojiBannedInPrimaryChrome, true);
  assert.equal(tokens.mobileViewport390x844Contract.horizontalOverflowPermitted, false);
  const svg = omnicausalis.renderMonolineSvgIcon("BRAND_CADUCEUS_INFINITY", "#38bdf8", 20);
  assert.ok(svg.includes("viewBox=\"0 0 24 24\""));
  assert.ok(svg.includes("stroke-width=\"1.75\""));
});
