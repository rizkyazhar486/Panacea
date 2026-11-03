import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ORGAN_BIOMECHANICS_CATALOG,
  calculateNeoHookeanStress,
  generateStressStrainCurve,
  evaluatePalpationIndentation,
  evaluateDiaphragmaticExcursion,
  evaluatePeristalsis,
  GI_PERISTALSIS_CATALOG,
  SOFT_TISSUE_BIOMECHANICS_DISCLAIMER,
} from '../../src/domains/body-exposure/engine/softTissueBiomechanicsEngine.ts';

describe('Soft-Tissue Biomechanics & Viscoelastic Continuum Engine (BX-Pillar-VI)', () => {
  test('T-BIOM-01: Neo-Hookean hyperelastic continuum stress and positive strain energy density', () => {
    const shearModulusMu = 2.0; // kPa
    const zeroStrain = calculateNeoHookeanStress(0.0, shearModulusMu);
    assert.equal(zeroStrain.stretchRatioLambda, 1.0);
    assert.equal(zeroStrain.cauchyTrueStressKPa, 0.0);
    assert.equal(zeroStrain.nominalEngineeringStressKPa, 0.0);
    assert.equal(zeroStrain.strainEnergyDensityKJPerM3, 0.0);

    // 20% uniaxial elongation (strain = 0.20, lambda = 1.20)
    const stretch = calculateNeoHookeanStress(0.20, shearModulusMu);
    assert.equal(stretch.stretchRatioLambda, 1.20);
    // Cauchy stress = mu * (lambda^2 - 1/lambda) = 2.0 * (1.44 - 0.8333) = 1.213 kPa
    assert.ok(stretch.cauchyTrueStressKPa > 1.20 && stretch.cauchyTrueStressKPa < 1.23);
    assert.ok(stretch.strainEnergyDensityKJPerM3 > 0, 'Strain energy density must be strictly positive during deformation');

    const curve = generateStressStrainCurve(shearModulusMu, 0.40, 4);
    assert.equal(curve.length, 5);
    assert.equal(curve[0].engineeringStrain, 0.0);
    assert.equal(curve[4].engineeringStrain, 0.40);
  });

  test('T-BIOM-02: Organ biomechanical catalog distinguishes stiff cirrhotic liver and friable spleen', () => {
    const normalLiver = ORGAN_BIOMECHANICS_CATALOG.liver_normal;
    const cirrhoticLiver = ORGAN_BIOMECHANICS_CATALOG.liver_cirrhosis_f4;
    const spleen = ORGAN_BIOMECHANICS_CATALOG.spleen_normal;

    assert.equal(normalLiver.youngsModulusKPa, 5.5);
    assert.equal(cirrhoticLiver.youngsModulusKPa, 22.0);
    assert.ok(cirrhoticLiver.shearModulusMuKPa > normalLiver.shearModulusMuKPa * 3);
    assert.ok(cirrhoticLiver.friabilityIndex > normalLiver.friabilityIndex);
    assert.ok(cirrhoticLiver.capsularYieldStressKPa < normalLiver.capsularYieldStressKPa);

    assert.equal(spleen.fmaId, 'FMA:7196');
    assert.equal(spleen.uberonId, 'UBERON:0002106');
    assert.ok(spleen.friabilityIndex >= 0.85, 'Spleen must be marked as highly friable');
  });

  test('T-BIOM-03: Laparoscopic palpation probe indentation mechanics and capsular rupture warning', () => {
    // Normal gentle indentation (2 mm) on normal liver
    const gentleEval = evaluatePalpationIndentation({
      organId: 'liver_normal',
      indentationDepthMm: 2.0,
      indentationVelocityMmS: 5.0,
      toolTipRadiusMm: 2.5,
    });

    assert.equal(gentleEval.ok, true);
    assert.equal(gentleEval.safetyStatus, 'safe');
    assert.ok(gentleEval.elasticContactForceN > 0);
    assert.ok(gentleEval.safetyMarginPct > 50);
    assert.equal(gentleEval.truthClass, 'mechanistic_simulation_proxy');
    assert.equal(gentleEval.disclaimer, SOFT_TISSUE_BIOMECHANICS_DISCLAIMER);

    // Deep rapid indentation (15 mm, 40 mm/s) on friable cirrhotic liver -> triggers rupture danger
    const excessiveEval = evaluatePalpationIndentation({
      organId: 'liver_cirrhosis_f4',
      indentationDepthMm: 15.0,
      indentationVelocityMmS: 40.0,
      toolTipRadiusMm: 2.5,
    });

    assert.equal(excessiveEval.ok, true);
    assert.ok(
      excessiveEval.safetyStatus === 'high_tension' || excessiveEval.safetyStatus === 'capsular_rupture_risk',
      'Excessive indentation on cirrhotic liver must trigger high tension or capsular rupture alert',
    );
    assert.ok(excessiveEval.totalContactForceN > gentleEval.totalContactForceN * 5);
    assert.ok(excessiveEval.hapticResistanceScore > gentleEval.hapticResistanceScore);
  });

  test('T-BIOM-04: 4D Diaphragmatic excursion transmits directional visceral displacement', () => {
    // End-expiration (phase = 0.0)
    const expEval = evaluateDiaphragmaticExcursion({
      mode: 'tidal',
      respiratoryPhase: 0.0,
    });
    assert.equal(expEval.instantaneousDiaphragmDescentMm, 0.0);
    const liverExp = expEval.organDisplacements.find((v) => v.organId === 'liver_normal');
    assert.equal(liverExp?.dzMm, 0.0);

    // Peak inspiration (phase = 0.5)
    const inspEval = evaluateDiaphragmaticExcursion({
      mode: 'tidal',
      respiratoryPhase: 0.5,
    });
    assert.equal(inspEval.peakDiaphragmDescentMm, 20.0);
    assert.equal(inspEval.instantaneousDiaphragmDescentMm, 20.0);

    const liverInsp = inspEval.organDisplacements.find((v) => v.organId === 'liver_normal');
    assert.ok(liverInsp, 'Liver displacement must be present');
    assert.equal(liverInsp.dzMm, -17.0); // 85% of 20 mm caudal
    assert.ok(liverInsp.dyMm > 0, 'Liver must tilt slightly anteriorly during descent');

    const spleenInsp = inspEval.organDisplacements.find((v) => v.organId === 'spleen_normal');
    assert.equal(spleenInsp?.dzMm, -16.0); // 80% of 20 mm

    const rKidneyInsp = inspEval.organDisplacements.find((v) => v.organId === 'kidney_cortex');
    assert.equal(rKidneyInsp?.dzMm, -11.0); // 55% of 20 mm

    // Deep inspiration has ~75 mm peak descent
    const deepEval = evaluateDiaphragmaticExcursion({
      mode: 'deep_inspiration',
      respiratoryPhase: 0.5,
    });
    assert.equal(deepEval.peakDiaphragmDescentMm, 75.0);
    assert.ok(deepEval.instantaneousDiaphragmDescentMm > 70.0);
  });

  test('T-BIOM-05: Gastrointestinal peristalsis slow-wave pacing across gut segments', () => {
    assert.equal(GI_PERISTALSIS_CATALOG.gastric_antrum.pacingFrequencyCpm, 3.0);
    assert.equal(GI_PERISTALSIS_CATALOG.duodenum.pacingFrequencyCpm, 12.0);
    assert.equal(GI_PERISTALSIS_CATALOG.jejunum.pacingFrequencyCpm, 10.0);
    assert.equal(GI_PERISTALSIS_CATALOG.ileum.pacingFrequencyCpm, 8.0);
    assert.equal(GI_PERISTALSIS_CATALOG.colon.pacingFrequencyCpm, 4.0);

    const stomachWave = evaluatePeristalsis('gastric_antrum', 10.0, 5.0, 20.0, 10);
    assert.equal(stomachWave.segment.segment, 'gastric_antrum');
    assert.equal(stomachWave.wavePoints.length, 11);
    assert.ok(stomachWave.currentLumenRadiusAtProbeMm > 0);
    assert.ok(stomachWave.currentPressureAtProbeMmHg >= 5.0);
    assert.equal(stomachWave.truthClass, 'mechanistic_simulation_proxy');

    const duodWave = evaluatePeristalsis('duodenum', 2.5, 3.0, 15.0, 10);
    assert.equal(duodWave.segment.segment, 'duodenum');
    assert.ok(duodWave.wavePoints.every((pt) => pt.instantaneousRadiusMm <= duodWave.segment.baselineLumenRadiusMm));
  });

  test('T-BIOM-06: Fail-closed boundary guards against invalid parameters', () => {
    assert.throws(() => calculateNeoHookeanStress(-1.5, 2.0), /RangeError/);
    assert.throws(() => calculateNeoHookeanStress(0.2, 0.0), /RangeError/);
    assert.throws(() => evaluatePalpationIndentation({ organId: 'unknown_organ', indentationDepthMm: 5, indentationVelocityMmS: 5 }), /Unknown organId/);
    assert.throws(() => evaluatePeristalsis('unknown_tract', 5.0), /Unknown GI segment/);
  });
});
