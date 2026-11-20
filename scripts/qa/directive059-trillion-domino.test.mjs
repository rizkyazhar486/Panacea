import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateTrillionQuantumDominoMatrix } from '../../src/kernel/trillion-domino/trillionQuantumDominoEngine.ts';

test('Trillion-Scale Domino Positive Control: Evaluates multi-layer homeostatic equilibrium', () => {
  const result = evaluateTrillionQuantumDominoMatrix({
    seedEntityId: 'SEED-ATOM-01',
    initiatingLayer: 'SUB_ATOMIC_QUANTUM',
    quantumTunnelingIndex: 0.1,
    chemicalGibbsFreeEnergy: -30.0,
    cellularAtpFlux: 5.0,
    organSystemStressFactor: 2
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.equal(result.systemicEquilibriumVerdict, 'HOMEOSTASIS_MAINTAINED');
  assert.equal(result.propagatedCascadePath.length, 5);
  console.log('✅ Trillion Domino Positive Control Passed:', result);
});

test('Trillion-Scale Domino Negative Control: Detects critical systemic domino failure under extreme stress', () => {
  const result = evaluateTrillionQuantumDominoMatrix({
    seedEntityId: 'SEED-STRESS-02',
    initiatingLayer: 'SUB_ATOMIC_QUANTUM',
    quantumTunnelingIndex: 0.95,
    chemicalGibbsFreeEnergy: -120.0,
    cellularAtpFlux: 0.2,
    organSystemStressFactor: 9
  });

  assert.equal(result.systemicEquilibriumVerdict, 'SYSTEMIC_CRITICAL_FAILURE');
  assert.equal(result.isClinicallyAuthoritative, false);
  console.log('✅ Trillion Domino Negative Control Passed:', result);
});
