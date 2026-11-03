import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_KALOLUMEN_LAYERS, PROTEIN_FIGHTER_BOTS, assertTruthClassTransitionAllowed,
  computeDirectionalLightVector, createTruthEnvelope, evaluateBioEmuConformationalEnsemble,
  evaluateDeNovoBinderCandidate, evaluateKaloLumenReconstruction, evaluateLongevityEnergyBalance,
  evaluateRemopReceptorOccupancy, evaluateSepsisSafeguard, mapTextToVrmVisemeFrames, runProteinFighterArenaRound,
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

// 6. Purity & Determinism Guard
{
  const src = readFileSync(new URL('../../src/domains/omnicausalis/engine/omnicausalisEngine.ts', import.meta.url), 'utf8');
  for (const forbidden of ['window.', 'localStorage', 'sessionStorage', 'Date.now(', 'Math.random(']) {
    assert.equal(src.includes(forbidden), false, `omnicausalisEngine.ts must remain pure and free of ${forbidden}`);
  }
}

console.log('omnicausalis: truth-class guard, KaloLumen 3-layer DICOM, BioEmu-2/BindCraft2/ProteinFighter, SepsisAgent/REMOP, VRM visemes, and longevity energy balance verified');
