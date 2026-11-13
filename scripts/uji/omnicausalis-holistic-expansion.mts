import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_KALOLUMEN_LAYERS, NUSANTARA_FUNCTIONAL_DISHES, PROTEIN_FIGHTER_BOTS, assertTruthClassTransitionAllowed,
  computeDirectionalLightVector, createTruthEnvelope, evaluateBioEmuConformationalEnsemble,
  evaluateDeNovoBinderCandidate, evaluateKaloLumenReconstruction, evaluateLongevityEnergyBalance,
  evaluateLongevityNutritionAndExposome, evaluateMitochondrialAutophagyDynamics,
  evaluateOneOsEncounterPayerHarmonization, evaluatePantheonMultiSpecialistConsensus,
  evaluateRemopReceptorOccupancy, evaluateSensoriumBiometricsAndGait, evaluateSepsisSafeguard,
  mapTextToVrmVisemeFrames, runProteinFighterArenaRound, translateUniversalDeviceEnvelope,
} from '../../src/domains/omnicausalis-index.ts';

// 1. Truth-Class Segregation Guard
{
  const env = createTruthEnvelope('SIMULATED_EDUCATIONAL', 'BioEmu-2 Sandbox', { demo: 1 });
  assert.equal(env.truthClass, 'SIMULATED_EDUCATIONAL');
  assert.equal(env.clinicallyReviewed, false);
  assert.ok(env.disclaimer.includes('clinically_reviewed=false'));
  assert.doesNotThrow(() => assertTruthClassTransitionAllowed('OBSERVED_CLINICAL', 'DERIVED_CLINICAL'));
  assert.doesNotThrow(() => assertTruthClassTransitionAllowed('SIMULATED_EDUCATIONAL', 'SIMULATED_EDUCATIONAL'));
  assert.throws(() => assertTruthClassTransitionAllowed('SIMULATED_EDUCATIONAL', 'OBSERVED_CLINICAL'), /truth-class violation/);
  assert.throws(() => assertTruthClassTransitionAllowed('SIMULATED_EDUCATIONAL', 'DERIVED_CLINICAL'), /truth-class violation/);
  assert.throws(() => assertTruthClassTransitionAllowed('DERIVED_CLINICAL', 'OBSERVED_CLINICAL'), /truth-class violation/);
  assert.throws(() => createTruthEnvelope('SIMULATED_EDUCATIONAL', '   ', {}), /provenanceSource must be a non-empty string/);
}

// 2. KaloLumen 3-Layer DICOM-to-3DCG Reconstruction & Directional Light Vector
{
  assert.deepEqual(computeDirectionalLightVector({ azimuthDeg: 0, elevationDeg: 0 }), { x: 0, y: 0, z: 1 });
  assert.deepEqual(computeDirectionalLightVector({ azimuthDeg: 45, elevationDeg: 90 }), { x: 0, y: 1, z: 0 });
  const recon = evaluateKaloLumenReconstruction({
    studyId: 'dicom-study-001', sliceCount: 512, voxelSpacingMm: [0.7, 0.7, 1.0],
    layers: DEFAULT_KALOLUMEN_LAYERS, lighting: { azimuthDeg: 30, elevationDeg: 45 },
  });
  assert.equal(recon.truthClass, 'SIMULATED_EDUCATIONAL');
  assert.equal(recon.clinicallyReviewed, false);
  assert.equal(recon.payload.activeLayerCount, 3);
  assert.equal(recon.payload.subTenSecondCompliant, true);
  assert.ok(recon.payload.estimatedReconstructionMs < 10000);
  assert.throws(() => evaluateKaloLumenReconstruction({
    studyId: 'dicom-study-002', sliceCount: 256, voxelSpacingMm: [1, 1, 1],
    layers: DEFAULT_KALOLUMEN_LAYERS.slice(0, 2), lighting: { azimuthDeg: 0, elevationDeg: 0 },
  }), /exactly 3 independent threshold surface-rendering layers/);
  assert.throws(() => evaluateKaloLumenReconstruction({
    studyId: 'dicom-study-003', sliceCount: 256, voxelSpacingMm: [1, 1, 1],
    layers: DEFAULT_KALOLUMEN_LAYERS, lighting: { azimuthDeg: 0, elevationDeg: 0 }, targetTruthClass: 'OBSERVED_CLINICAL',
  }), /truth-class violation/);
}

// 3. BioEmu-2 Boltzmann Ensemble, BindCraft2/FastPLM De Novo Binder & ProteinFighter Arena
{
  const eqZero = evaluateBioEmuConformationalEnsemble({ targetId: 'cav1_2_ltcc', temperatureKelvin: 310.15, deltaGOpenMinusClosedKcalMol: 0 });
  assert.equal(eqZero.payload.openProbability, 0.5);
  assert.equal(eqZero.payload.closedProbability, 0.5);
  assert.equal(eqZero.payload.boltzmannRatioOpenToClosed, 1);

  const eqDepol = evaluateBioEmuConformationalEnsemble({
    targetId: 'cav1_2_ltcc', temperatureKelvin: 310.15, deltaGOpenMinusClosedKcalMol: 0.5,
    membranePotentialMv: 20, phosphorylationFraction: 0.8,
  });
  assert.ok(eqDepol.payload.openProbability > 0.9);
  assert.equal(Math.round((eqDepol.payload.openProbability + eqDepol.payload.closedProbability) * 1e6), 1e6);

  const strongBinder = evaluateDeNovoBinderCandidate({
    binderId: 'BC2-Cav12-Alpha', sequence: 'MKTIIALSYIFCLVFADYKDDDDKGGGGSGGGGSHHHHHH',
    plddtMean: 92.4, ptmScore: 0.89, ipTmScore: 0.86, deltaGBindKcalMol: -12.4,
    buriedSurfaceAreaA2: 1950, paeInterfaceMeanAngstrom: 4.2, sequenceIdentityToTrainingMax: 0.65,
  });
  assert.equal(strongBinder.payload.highConfidenceDesign, true);
  assert.equal(strongBinder.payload.outOfDistributionFlagged, false);
  assert.ok(strongBinder.payload.stabilityScore > 80);

  const oodBinder = evaluateDeNovoBinderCandidate({
    binderId: 'BC2-OOD-Nov', sequence: 'ACDEFGHIKLMNPQRSTVWYACDEFGHIKLMNPQRSTVWY',
    plddtMean: 85.0, ptmScore: 0.5, ipTmScore: 0.78, deltaGBindKcalMol: -9.5,
    buriedSurfaceAreaA2: 1500, paeInterfaceMeanAngstrom: 22.0, sequenceIdentityToTrainingMax: 0.12,
  });
  assert.equal(oodBinder.payload.outOfDistributionFlagged, true);
  assert.equal(oodBinder.payload.highConfidenceDesign, false);

  assert.throws(() => evaluateDeNovoBinderCandidate({
    binderId: 'bad-seq', sequence: 'MKTIIALSYIFCLVFA12345', plddtMean: 80, ptmScore: 0.8, ipTmScore: 0.8,
    deltaGBindKcalMol: -10, buriedSurfaceAreaA2: 1600, paeInterfaceMeanAngstrom: 5, sequenceIdentityToTrainingMax: 0.5,
  }), /canonical amino acid residues/);

  assert.equal(PROTEIN_FIGHTER_BOTS.length, 3);
  const arenaRes = runProteinFighterArenaRound(strongBinder);
  assert.equal(arenaRes.truthClass, 'SIMULATED_EDUCATIONAL');
  assert.equal(arenaRes.payload.standings.length, 4);
  assert.ok(arenaRes.payload.rivalCommentary.length > 10);
}

// 4. SepsisAgent qSOFA/SOFA + Surviving Sepsis 1-Hour Bundle & REMOP Hill Occupancy
{
  const lowRisk = evaluateSepsisSafeguard({ respiratoryRateBpm: 16, systolicBpMmHg: 122, glasgowComaScale: 15 });
  assert.equal(lowRisk.truthClass, 'DERIVED_CLINICAL');
  assert.equal(lowRisk.clinicallyReviewed, false);
  assert.equal(lowRisk.payload.qSofaScore, 0);
  assert.equal(lowRisk.payload.qSofaHighRisk, false);
  assert.equal(lowRisk.payload.survivingSepsisOneHourBundle.length, 0);
  assert.equal(lowRisk.payload.requiresHumanPhysicianSignoff, true);

  const septicShock = evaluateSepsisSafeguard({
    respiratoryRateBpm: 28, systolicBpMmHg: 84, glasgowComaScale: 13, paO2FiO2Ratio: 180,
    platelets10e3PerUl: 90, bilirubinMgDl: 2.4, meanArterialPressureMmHg: 58,
    vasopressorActive: true, creatinineMgDl: 2.1, lactateMmolL: 4.6,
  });
  assert.equal(septicShock.payload.qSofaScore, 3);
  assert.equal(septicShock.payload.qSofaHighRisk, true);
  assert.equal(septicShock.payload.sofaTotalScore, 13);
  assert.equal(septicShock.payload.survivingSepsisOneHourBundle.length, 5);
  assert.equal(septicShock.payload.requiresHumanPhysicianSignoff, true);

  const remopHalf = evaluateRemopReceptorOccupancy({
    agentName: 'norepinephrine', plasmaConcentrationNm: 50, dissociationConstantKdNm: 50, hillCoefficient: 1.5,
  });
  assert.equal(remopHalf.payload.fractionalOccupancy, 0.5);
  assert.equal(remopHalf.payload.hemodynamicEffectIndex, 50);
}

// 5. VRM 5-Viseme Lip-Sync & Wearable Longevity Energy Balance
{
  const visemes = mapTextToVrmVisemeFrames('See you soon doctor');
  assert.equal(visemes.length, 4);
  assert.equal(visemes[0]!.viseme, 'ee');
  assert.equal(visemes[1]!.viseme, 'ou');
  assert.ok(visemes.every((v) => ['aa', 'ih', 'ou', 'ee', 'oh'].includes(v.viseme)));

  const energy = evaluateLongevityEnergyBalance({
    weightKg: 70, intakeProteinG: 140, intakeCarbsG: 250, intakeFatG: 70,
    restingMetabolicRateKcal: 1650, workoutMet: 8, workoutDurationMinutes: 45, hrvRmssdMs: 68, sleepEfficiencyPct: 90,
  });
  assert.equal(energy.payload.totalIntakeKcal, 2190);
  assert.equal(energy.payload.workoutExpenditureKcal, 441);
  assert.equal(energy.payload.totalExpenditureKcal, 2091);
  assert.equal(energy.payload.netEnergyBalanceKcal, 99);
  assert.ok(energy.payload.autonomicReadinessIndex > 70);
}

// 6. Pilar I — Subcellular Mitochondrial OxPhos & Autophagy/Mitophagy Dynamics
{
  const healthyMito = evaluateMitochondrialAutophagyDynamics({
    deltaPsiMMv: -165, nadPlusToNadhRatio: 5.0, ampkToMtorRatio: 3.0, substrateOxygenSaturationPct: 98,
  });
  assert.equal(healthyMito.truthClass, 'SIMULATED_EDUCATIONAL');
  assert.equal(healthyMito.payload.pink1ParkinMitophagyActive, false);
  assert.ok(healthyMito.payload.oxPhosAtpFluxIndex > 80);
  assert.ok(healthyMito.payload.bioenergeticResilienceScore > 75);

  const depolarizedMito = evaluateMitochondrialAutophagyDynamics({
    deltaPsiMMv: -85, nadPlusToNadhRatio: 1.5, ampkToMtorRatio: 1.2, substrateOxygenSaturationPct: 90,
  });
  assert.equal(depolarizedMito.payload.pink1ParkinMitophagyActive, true);
  assert.ok(depolarizedMito.payload.oxPhosAtpFluxIndex < healthyMito.payload.oxPhosAtpFluxIndex);
}

// 7. Pilar II — Universal Device Translation OS (Empty Is Not Zero + Consent Gate)
{
  const udt = translateUniversalDeviceEnvelope({
    deviceId: 'UDT-HIST-ECG-1998', deviceEra: 'past_analog_digitized', provenanceSource: 'DIGITIZED_PAPER_TRACE',
    consentVerified: true, timePrecisionMs: 40,
    heartRateBpm: 74, hrvRmssdMs: 52, cgmGlucoseMgDl: null, thoracicBioimpedanceOhm: null,
  });
  assert.equal(udt.truthClass, 'REFERENCE_NORMATIVE');
  assert.equal(udt.payload.normalizedTelemetry.heartRateBpm, 74);
  assert.equal(udt.payload.normalizedTelemetry.cgmGlucoseMgDl, null);
  assert.deepEqual(udt.payload.missingChannels, ['cgmGlucoseMgDl', 'thoracicBioimpedanceOhm']);
  assert.equal(udt.payload.recordedChannelsCount, 2);

  assert.throws(() => translateUniversalDeviceEnvelope({
    deviceId: 'UDT-NO-CONSENT', deviceEra: 'present_wearable_cgm', provenanceSource: 'BLE_RING',
    consentVerified: false, timePrecisionMs: 1000,
    heartRateBpm: 70, hrvRmssdMs: null, cgmGlucoseMgDl: 95, thoracicBioimpedanceOhm: null,
  }), /consentVerified === true/);
}

// 8. Pilar III & IV — Pantheon Multi-Specialist Consensus & One-OS Payer Harmonization
{
  const pantheon = evaluatePantheonMultiSpecialistConsensus({
    lvefPct: 32, meanArterialPressureMmHg: 58,
    lactateMmolL: 3.8, egfrMlMin173m2: 34, paO2FiO2Ratio: 170,
  });
  assert.equal(pantheon.truthClass, 'DERIVED_CLINICAL');
  assert.equal(pantheon.payload.harmonizedProtocol.length, 4);
  assert.equal(pantheon.payload.conflictDetected, true);
  assert.equal(pantheon.payload.requiresHumanPhysicianSignoff, true);

  const oneOsUnsigned = evaluateOneOsEncounterPayerHarmonization({
    encounterId: 'ENC-001', currentStage: 'universal_payer_claim', patientIdentityVerified: true,
    icd10PrimaryCode: 'A41.9', diagnosticReferralClosed: true, clinicianSignedOff: false,
  });
  assert.equal(oneOsUnsigned.payload.zeroLossContinuityVerified, true);
  assert.equal(oneOsUnsigned.payload.payerClaimReady, false);
  assert.ok(oneOsUnsigned.payload.blockingReasons.includes('clinician_signature_required'));

  const oneOsSigned = evaluateOneOsEncounterPayerHarmonization({
    encounterId: 'ENC-002', currentStage: 'universal_payer_claim', patientIdentityVerified: true,
    icd10PrimaryCode: 'A41.9', diagnosticReferralClosed: true, clinicianSignedOff: true,
  });
  assert.equal(oneOsSigned.payload.payerClaimReady, true);
  assert.equal(oneOsSigned.payload.blockingReasons.length, 0);
}

// 9. Pilar V & VI — Sensorium CGM/Gait, Nusantara Functional Nutrition & Planetary Exposome
{
  const sensorium = evaluateSensoriumBiometricsAndGait({
    cgmReadingsMgDl: [85, 95, 110, 140, 195, 65, 120, 130, 105, 100],
    hrvRmssdMs: 64, hrvSdnnMs: null, spo2Pct: 98,
    mtpDorsiflexionDeg: 26, calcaneusFloorClearanceMm: 18,
  });
  assert.equal(sensorium.payload.cgmTimeInRangePct, 80);
  assert.equal(sensorium.payload.cgmTimeBelowRangePct, 10);
  assert.equal(sensorium.payload.cgmTimeAboveRangePct, 10);
  assert.equal(sensorium.payload.footStrikeClassification, 'forefoot_strike');
  assert.equal(sensorium.payload.hrvSdnnMs, null);

  assert.equal(NUSANTARA_FUNCTIONAL_DISHES.length, 4);
  const longevity = evaluateLongevityNutritionAndExposome({
    chronologicalAgeYears: 45, phenoAgeEstimateYears: 40.5,
    fsrsCurrentStabilityDays: 14, daysSinceLastThermalHabit: 2,
    saunaMinutesWeekly: 75, pm25UgM3: 12, uvIndex: 4, circadianDaylightLux: 12000,
  });
  assert.equal(longevity.payload.bioAgeDeltaYears, -4.5);
  assert.ok(longevity.payload.fsrsNextStabilityDays > 14);
  assert.ok(longevity.payload.longevityRecoveryScore > 80);
}

// 10. Purity & Determinism Guard
{
  const src = readFileSync(new URL('../../src/domains/omnicausalis/engine/omnicausalisEngine.ts', import.meta.url), 'utf8');
  for (const forbidden of ['window.', 'localStorage', 'sessionStorage', 'Date.now(', 'Math.random(']) {
    assert.equal(src.includes(forbidden), false, `omnicausalisEngine.ts must remain pure and free of ${forbidden}`);
  }
}

console.log('omnicausalis: all 7 Transcendental Pillars (Quantum/Mitochondria, KaloLumen/UDT-OS, Sepsis/Pantheon, Zero-Loss EMR/One-OS Payer, Sensorium Gait/CGM, Nusantara Longevity/Exposome, Interaction Grammar) verified');
