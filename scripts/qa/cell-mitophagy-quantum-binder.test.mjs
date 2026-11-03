import assert from 'node:assert/strict'
import test from 'node:test'

import {
  evaluateMitochondrialQualityControl,
} from '../../src/lib/discovery/mitochondrialUprMitophagyEngine.ts'
import {
  AMINO_ACID_TABLE,
  AMR_EPITOPE_CATALOG,
  computeMarcusElectronTransferRate,
  evaluateEpitopeBindingAffinity,
} from '../../src/domains/quantum-biology/index.ts'

test('T-CELL-MITO-01: Mitochondrial Quality Control & PINK1-Parkin Mitophagy Flux Dynamics', () => {
  // 1. Healthy Polarized Mitochondria
  const healthy = evaluateMitochondrialQualityControl({
    membranePotentialDeltaPsiMv: -140,
    matrixMisfoldedProteinRatio: 0.1,
    lysosomalAcidityPh: 4.8,
    atf5RetrogradeSignalingActive: false,
  })
  assert.strictEqual(healthy.mitochondrialViabilityStatus, 'HEALTHY_POLARIZED')
  assert.ok(healthy.pink1ParkinPrimingScore <= 0.2)
  assert.strictEqual(healthy.mfn1Mfn2DegradationPercentage, 5.0)
  assert.strictEqual(healthy.metadata.truthClass, 'mechanistic_simulation_proxy')
  assert.strictEqual(healthy.metadata.neverManufacturesBiomarkers, true)

  // 2. Proteotoxic Stress with UPRmt Retrograde Compensation
  const stressed = evaluateMitochondrialQualityControl({
    membranePotentialDeltaPsiMv: -130,
    matrixMisfoldedProteinRatio: 0.5,
    lysosomalAcidityPh: 4.8,
    atf5RetrogradeSignalingActive: true,
  })
  assert.strictEqual(stressed.mitochondrialViabilityStatus, 'STRESSED_UPRMT_COMPENSATION')
  assert.ok(stressed.uprmtRetrogradeResponse.chaperoneUpregulationFold > 2.0)
  assert.strictEqual(stressed.uprmtRetrogradeResponse.retrogradeCompensationSufficient, true)

  // 3. Depolarized Organelle Committed to Mitophagy
  const depolarized = evaluateMitochondrialQualityControl({
    membranePotentialDeltaPsiMv: -60,
    matrixMisfoldedProteinRatio: 0.4,
    lysosomalAcidityPh: 4.8,
  })
  assert.strictEqual(depolarized.mitochondrialViabilityStatus, 'DEPOLARIZED_MITOPHAGY_COMMITTED')
  assert.ok(depolarized.pink1ParkinPrimingScore >= 0.8)
  assert.ok(depolarized.mfn1Mfn2DegradationPercentage >= 80.0)
  assert.ok(depolarized.autophagosomalEngulfmentRatio >= 0.8)

  // 4. Defective Lysosomal Acidification Blocks Degradation
  const impairedLyso = evaluateMitochondrialQualityControl({
    membranePotentialDeltaPsiMv: -60,
    matrixMisfoldedProteinRatio: 0.4,
    lysosomalAcidityPh: 6.8, // de-acidified lysosome
  })
  assert.ok(impairedLyso.lysosomalClearanceCompletionPercentage < depolarized.lysosomalClearanceCompletionPercentage)
})

test('T-QUANTUM-01: Marcus Non-Adiabatic Electron Transfer Kinetics & Parabolic Rate Inversion', () => {
  // Normal physiological tunneling regime: lambda = 0.85 eV, H_da = 15.0 meV, dG0 = -0.4 eV at 310.15 K
  const rateNormal = computeMarcusElectronTransferRate(0.85, 15.0, -0.4)
  assert.ok(rateNormal > 1e6, `Rate must exceed 10^6 s^-1; got ${rateNormal}`)
  assert.ok(Number.isFinite(rateNormal))

  // Optimal activationless regime: -dG0 == lambda (0.85 eV)
  const rateOptimal = computeMarcusElectronTransferRate(0.85, 15.0, -0.85)
  assert.ok(rateOptimal > rateNormal, 'Activationless rate must be higher than barrier rate')

  // Marcus inverted regime: -dG0 > lambda (e.g. dG0 = -1.6 eV)
  const rateInverted = computeMarcusElectronTransferRate(0.85, 15.0, -1.6)
  assert.ok(rateInverted < rateOptimal, 'Rate in inverted regime must decrease')

  // Boundary failure on non-positive reorganization energy
  assert.throws(() => computeMarcusElectronTransferRate(0.0, 15.0, -0.4), /Reorganization energy lambda must be in range/)
})

test('T-QUANTUM-02: De Novo AMR Epitope Binder Affinity & Shape Complementarity Evaluation', () => {
  const pbp2aTarget = AMR_EPITOPE_CATALOG.find((t) => t.targetId === 'TARGET-MRSA-PBP2A')
  assert.ok(pbp2aTarget)

  const candidate = {
    binderId: 'DESIGN-PBP2A-VHH-01',
    binderName: 'Anti-MRSA PBP2a Engineered Nanobody Core',
    sequence: 'DYKIKTGFYDKLKDEYGYK',
    targetId: 'TARGET-MRSA-PBP2A',
    computedMolecularWeightDa: 2315.5,
    designedScaffoldKind: 'NANOBODY_VHH',
  }

  const evalResult = evaluateEpitopeBindingAffinity(
    pbp2aTarget,
    candidate,
    '2026-11-03T12:00:00.000Z'
  )

  assert.strictEqual(evalResult.targetId, 'TARGET-MRSA-PBP2A')
  assert.strictEqual(evalResult.binderId, 'DESIGN-PBP2A-VHH-01')
  assert.ok(evalResult.bindingFreeEnergy_dG_kcal_mol < 0, 'Binding free energy must be favorable (< 0)')
  assert.ok(evalResult.buriedSurfaceArea_A2 > 500, 'Buried surface area must be > 500 A^2')
  assert.ok(evalResult.shapeComplementarityScore >= 0.55, 'Shape complementarity must be >= 0.55')
  assert.ok(evalResult.electronTransferKinetics, 'Must include Marcus electron transfer for PBP2a coordination site')
  assert.strictEqual(evalResult.truthClass, 'mechanistic_quantum_simulation_proxy')
  assert.strictEqual(evalResult.neverManufacturesBiomarkers, true)

  // Adversarial: invalid amino acid character fails closed
  const invalidCandidate = {
    binderId: 'DESIGN-BAD-01',
    binderName: 'Bad Sequence',
    sequence: 'DYKIKTGZX123',
    targetId: 'TARGET-MRSA-PBP2A',
    computedMolecularWeightDa: 1000,
    designedScaffoldKind: 'PEPTIDE_CYCLIC',
  }

  assert.throws(() => {
    evaluateEpitopeBindingAffinity(pbp2aTarget, invalidCandidate, '2026-11-03T12:00:00.000Z')
  }, /Invalid amino acid character/)
})
