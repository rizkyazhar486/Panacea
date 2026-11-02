import { strict as assert } from 'node:assert';
import {
  MEDICAL_3D_FRONTIER,
  medical3DFrontierSpec,
  relativePoiseuilleResistance,
  relativeFlowIndex,
  calculateCardiacWiggersCycle,
  calculateSaltatoryNerveImpulse,
  calculateKroghOxygenDiffusionRadiusMicrons,
  MEDICAL_3D_TRUTH_RULES,
} from '../../src/lib/medical3DFrontier.ts';

console.log('[TEST] Starting Medical 3D Frontier Physics & Wiggers Dynamics Suite...');

// 1. Spec Registry and Error Handling
{
  assert.equal(MEDICAL_3D_FRONTIER.length, 4);
  const hemo = medical3DFrontierSpec('hemodynamics-4d');
  assert.equal(hemo.shortLabel, 'Hemodynamics');
  assert.ok(hemo.visualLayers.includes('heart chambers'));

  assert.throws(() => {
    medical3DFrontierSpec('non-existent-frontier' as any);
  }, /Unknown 3D frontier id/);

  assert.ok(MEDICAL_3D_TRUTH_RULES.length >= 6);
  console.log('✓ Case 1: 3D Frontier spec registry and fail-closed bounds verified');
}

// 2. Poiseuille Resistance & 4th Power Law
{
  const rNormal = relativePoiseuilleResistance(1.0);
  assert.equal(rNormal, 1.0);

  // Halving the radius increases resistance 16-fold (1 / 0.5^4 = 16)
  const rStenosis = relativePoiseuilleResistance(0.5);
  assert.equal(rStenosis, 16.0);

  // Doubling the radius decreases resistance to 1/16 (1 / 2^4 = 0.0625)
  const rDilation = relativePoiseuilleResistance(2.0);
  assert.equal(rDilation, 0.0625);

  // Flow index proportional to pressure / resistance
  const flowBaseline = relativeFlowIndex(1.0, 1.0);
  assert.equal(flowBaseline, 1.0);

  const flowDilated = relativeFlowIndex(1.0, 2.0);
  assert.equal(flowDilated, 16.0);

  const flowZeroPressure = relativeFlowIndex(0.0, 1.0);
  assert.equal(flowZeroPressure, 0.0);
  console.log('✓ Case 2: Poiseuille 4th-power vascular resistance and flow kinematics validated');
}

// 3. Wiggers Cardiac Cycle & Valvular Leaflet Phase-Locking
{
  // Cycle duration at 75 bpm = 0.8 seconds
  // Phase 1: Isovolumetric Contraction (t = 0.02s, normalized ~ 0.025)
  const isoContraction = calculateCardiacWiggersCycle(0.02, 75);
  assert.equal(isoContraction.phase, 'ISOVOLUMETRIC_CONTRACTION');
  assert.equal(isoContraction.aorticValveOpenFraction, 0);
  assert.equal(isoContraction.mitralValveOpenFraction, 0);
  assert.equal(isoContraction.ventricularVolumeFraction, 1.0);
  assert.ok(isoContraction.lvPressureMmhg >= 10 && isoContraction.lvPressureMmhg <= 80);

  // Phase 2: Systolic Ejection (t = 0.15s, normalized ~ 0.187)
  const systolicEjection = calculateCardiacWiggersCycle(0.15, 75);
  assert.equal(systolicEjection.phase, 'SYSTOLIC_EJECTION');
  assert.ok(systolicEjection.aorticValveOpenFraction > 0.5, 'Aortic valve must be widely open');
  assert.equal(systolicEjection.mitralValveOpenFraction, 0, 'Mitral valve must stay sealed in systole');
  assert.ok(systolicEjection.ventricularVolumeFraction < 1.0, 'Ventricular volume drops during stroke ejection');
  assert.ok(systolicEjection.lvPressureMmhg > 80, 'Peak LV systolic pressure exceeds 80 mmHg');

  // Phase 3: Isovolumetric Relaxation (t = 0.30s, normalized ~ 0.375)
  const isoRelaxation = calculateCardiacWiggersCycle(0.30, 75);
  assert.equal(isoRelaxation.phase, 'ISOVOLUMETRIC_RELAXATION');
  assert.equal(isoRelaxation.aorticValveOpenFraction, 0, 'Aortic valve snaps closed');
  assert.equal(isoRelaxation.mitralValveOpenFraction, 0, 'Mitral valve not yet open');
  assert.equal(isoRelaxation.ventricularVolumeFraction, 0.40);

  // Phase 4: Diastolic Ventricular Filling (t = 0.55s, normalized ~ 0.687)
  const diastolicFilling = calculateCardiacWiggersCycle(0.55, 75);
  assert.equal(diastolicFilling.phase, 'DIASTOLIC_FILLING');
  assert.equal(diastolicFilling.aorticValveOpenFraction, 0, 'Aortic valve sealed in diastole');
  assert.ok(diastolicFilling.mitralValveOpenFraction > 0.5, 'Mitral valve opens for rapid ventricular filling');
  assert.ok(diastolicFilling.ventricularVolumeFraction > 0.40, 'Ventricle filling with preload blood');
  console.log('✓ Case 3: Wiggers cycle phases, pressure transitions, and valve leaflet kinematics locked');
}

// 4. Saltatory Nerve Conduction Dynamics
{
  const impulse = calculateSaltatoryNerveImpulse(0.01, 60, 0.8);
  assert.ok(impulse.wavePositionMeters >= 0 && impulse.wavePositionMeters <= 0.8);
  assert.ok(impulse.actionPotentialMv === 30 || impulse.actionPotentialMv === -70);
  console.log('✓ Case 4: Saltatory nerve impulse propagation verified');
}

// 5. Krogh Oxygen Diffusion Cylinder Model
{
  const normalDiffusion = calculateKroghOxygenDiffusionRadiusMicrons(95, 1.0);
  assert.ok(normalDiffusion.diffusionRadiusMicrons >= 135 && normalDiffusion.diffusionRadiusMicrons <= 145);

  const hypoxicHighDemand = calculateKroghOxygenDiffusionRadiusMicrons(45, 2.0);
  assert.ok(hypoxicHighDemand.diffusionRadiusMicrons < normalDiffusion.diffusionRadiusMicrons);
  assert.equal(hypoxicHighDemand.isHypoxicBeyondLimit, true);
  console.log('✓ Case 5: Krogh oxygen diffusion cylinder and hypoxia boundary verified');
}

console.log('ALL MEDICAL 3D FRONTIER PHYSICS TESTS PASSED GREEN (5/5).');
