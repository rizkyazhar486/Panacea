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