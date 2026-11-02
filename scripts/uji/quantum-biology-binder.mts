// scripts/uji/quantum-biology-binder.mts
// Tests for Quantum Biology & De Novo Epitope Binder Evaluation Engine
import assert from 'node:assert/strict'
import {
  AMINO_ACID_TABLE,
  AMR_EPITOPE_CATALOG,
  computeMarcusElectronTransferRate,
  evaluateEpitopeBindingAffinity,
  type DeNovoBinderCandidate,
} from '../../src/domains/quantum-biology/index.ts'

// 1. Verify Amino Acid Table completeness
const aminoAcidCodes = Object.keys(AMINO_ACID_TABLE)
assert.equal(aminoAcidCodes.length, 20, 'All 20 standard amino acids must be defined')
assert.equal(AMINO_ACID_TABLE.A.code, 'A')
assert.equal(AMINO_ACID_TABLE.R.netChargeAtPh7, 1)
assert.equal(AMINO_ACID_TABLE.D.netChargeAtPh7, -1)

// 2. Marcus Electron Transfer Kinetics
// lambda = 0.85 eV, H_da = 15 meV, dG0 = -0.4 eV at 310.15 K
const kET = computeMarcusElectronTransferRate(0.85, 15.0, -0.4)
assert.ok(kET > 1e6, `Electron transfer rate must be physiologically realistic (>1e6 s^-1); got ${kET}`)
assert.ok(Number.isFinite(kET), 'Marcus rate must be finite')

// Negative control on Marcus input
assert.throws(() => computeMarcusElectronTransferRate(-1.0, 15.0, -0.4), /Reorganization energy lambda must be in range/)

// 3. De Novo Binder against MRSA PBP2a target
const pbp2aTarget = AMR_EPITOPE_CATALOG.find((t) => t.targetId === 'TARGET-MRSA-PBP2A')!
assert.ok(pbp2aTarget, 'PBP2a target must exist')

// High affinity design candidate with complementary charge and hydrophobic packing
const highAffinityBinder: DeNovoBinderCandidate = {
  binderId: 'DESIGN-PBP2A-VHH-01',
  binderName: 'Anti-MRSA PBP2a Engineered Nanobody Core',
  sequence: 'DYKIKTGFYDKLKDEYGYK',
  targetId: 'TARGET-MRSA-PBP2A',
  computedMolecularWeightDa: 2315.5,
  designedScaffoldKind: 'NANOBODY_VHH',
}

const evalResult = evaluateEpitopeBindingAffinity(
  pbp2aTarget,
  highAffinityBinder,
  '2026-11-02T12:00:00Z'
)

assert.equal(evalResult.targetId, 'TARGET-MRSA-PBP2A')
assert.equal(evalResult.binderId, 'DESIGN-PBP2A-VHH-01')
assert.ok(evalResult.bindingFreeEnergy_dG_kcal_mol < 0, 'Binding free energy must be favorable (< 0 kcal/mol)')
assert.ok(evalResult.buriedSurfaceArea_A2 > 500, `Buried surface area must be substantial (>500 A^2); got ${evalResult.buriedSurfaceArea_A2}`)
assert.ok(evalResult.shapeComplementarityScore >= 0.55, 'Shape complementarity score must be >= 0.55')
assert.ok(evalResult.electronTransferKinetics, 'Beta-lactam coordination pocket must report electron transfer kinetics')
assert.equal(evalResult.truthClass, 'mechanistic_quantum_simulation_proxy')
assert.equal(evalResult.clinically_reviewed, false)
assert.equal(evalResult.neverManufacturesBiomarkers, true)

// 4. Suboptimal / Non-binding Peptide (Poly-Glycine lack of side-chain complementarity)
const polyGlyBinder: DeNovoBinderCandidate = {
  binderId: 'DESIGN-POLYGLY-01',
  binderName: 'Poly-Glycine Flexible Peptide',
  sequence: 'GGGGGGGGGGGG',
  targetId: 'TARGET-MRSA-PBP2A',
  computedMolecularWeightDa: 900.0,
  designedScaffoldKind: 'PEPTIDE_MACROCYCLE',
}
const nonBindResult = evaluateEpitopeBindingAffinity(
  pbp2aTarget,
  polyGlyBinder,
  '2026-11-02T12:00:00Z'
)
assert.ok(
  nonBindResult.neutralizationEfficacyTier === 'WEAK_SUBOPTIMAL' || nonBindResult.neutralizationEfficacyTier === 'NON_NEUTRALIZING',
  'Poly-glycine sequence must produce a weak suboptimal or non-neutralizing binder'
)
assert.ok(nonBindResult.dissociationConstant_Kd_nM > 1e6, 'Kd must be in millimolar range for non-binder')

// 5. Negative controls on sequence and timestamp
assert.throws(() => evaluateEpitopeBindingAffinity(
  pbp2aTarget,
  { ...highAffinityBinder, sequence: 'INVALID123' },
  '2026-11-02T12:00:00Z'
), /Invalid amino acid character/)

assert.throws(() => evaluateEpitopeBindingAffinity(
  pbp2aTarget,
  highAffinityBinder,
  'not-a-timestamp'
), /Invalid evaluation ISO timestamp/)

console.log('Quantum biology and de novo epitope binder engine verified.')
