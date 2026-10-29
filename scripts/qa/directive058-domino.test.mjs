import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateDynamicDominoCascade } from '../../src/kernel/domino-matrix/dynamicDominoEngine.ts';

test('Domino Matrix Positive Control: Evaluates recursive multi-layer cascade stability', () => {
  const result = evaluateDynamicDominoCascade({
    nodeId: 'NODE-QUANTUM-ROOT',
    layerLevel: 'SUB_ATOMIC',
    initialPerturbationValue: 5.0,
    cascadeDepth: 6
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.ok(result.totalCascadingStatesSimulated > 0);
  assert.ok(result.cascadeTrajectory.length === 6);
  console.log('✅ Domino Matrix Positive Control Passed:', result);
});

test('Domino Matrix Negative Control: Triggers containment protocol on high-energy cascade surge', () => {
  const result = evaluateDynamicDominoCascade({
    nodeId: 'NODE-TOXIC-ROOT',
    layerLevel: 'CELLULAR',
    initialPerturbationValue: 150.0,
    cascadeDepth: 10
  });

  assert.equal(result.systemicOutcome, 'CASCADING_COLLAPSE_PREVENTED');
  assert.equal(result.isClinicallyAuthoritative, false);
  console.log('✅ Domino Matrix Negative Control Passed:', result);
});
