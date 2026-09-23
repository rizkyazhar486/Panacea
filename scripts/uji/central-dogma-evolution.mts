import assert from 'node:assert/strict'
import {
  alignedTemplate3to5,
  codingDnaToMrna,
  hardyWeinberg,
  mutationStep,
  normaliseCodingDna,
  replicationFrame,
  selectionStep,
  simulateEvolution,
  transcriptionFrame,
  translationFrame,
} from '../../src/lib/centralDogmaEvolution.ts'

// Central dogma: sequence bookkeeping must be deterministic and direction-aware.
assert.equal(normaliseCodingDna('atg gAA\nTAA'), 'ATGGAATAA')
assert.equal(alignedTemplate3to5('ATGC'), 'TACG')
assert.equal(codingDnaToMrna('ATGTAA'), 'AUGUAA')

const replication = replicationFrame('ATGC', 2)
assert.equal(replication.coding5to3, 'ATGC')
assert.equal(replication.template3to5, 'TACG')
assert.equal(replication.daughterAgainstCoding3to5, 'TA··')
assert.equal(replication.daughterAgainstTemplate5to3, 'AT··')
assert.equal(replication.copiedBases, 2)

const transcription = transcriptionFrame('ATGGAA', 3)
assert.equal(transcription.templateDna3to5, 'TACCTT')
assert.equal(transcription.mrna5to3, 'AUGGAA')
assert.equal(transcription.visibleMrna5to3, 'AUG···')

// Translation starts at AUG, advances codon-by-codon, and terminates at STOP.
const translation0 = translationFrame('CCCAUGGAAUAA', 0)
assert.equal(translation0.startIndex, 3)
assert.deepEqual(translation0.codons.map((c) => c.codon), ['AUG', 'GAA', 'UAA'])
assert.equal(translation0.codons[0].anticodon3to5, 'UAC')
assert.equal(translation0.codons[2].anticodon3to5, null)

const translation2 = translationFrame('CCCAUGGAAUAA', 2)
assert.equal(translation2.peptide, 'ME')
assert.equal(translation2.stopped, false)

const translation3 = translationFrame('CCCAUGGAAUAA', 3)
assert.equal(translation3.peptide, 'ME')
assert.equal(translation3.stopped, true)

// Hardy-Weinberg must conserve total genotype frequency.
const hw = hardyWeinberg(0.4)
assert.ok(Math.abs(hw.p + hw.q - 1) < 1e-12)
assert.ok(Math.abs(hw.AA + hw.Aa + hw.aa - 1) < 1e-12)
assert.ok(Math.abs(hw.Aa - 0.48) < 1e-12)

// Positive selection for A raises p in the deterministic model.
const selected = selectionStep(0.5, 0.1, 0.5)
assert.ok(selected.pAfter > selected.pBefore)
assert.ok(selected.meanFitness > 1)

// Forward mutation A→a lowers p when no reverse mutation is present.
assert.ok(mutationStep(0.8, 0.01, 0) < 0.8)

// With no evolutionary forces, allele frequency remains fixed.
const neutral = simulateEvolution({
  initialP: 0.37,
  populationSize: 100,
  generations: 30,
  selectionCoefficient: 0,
  dominance: 0.5,
  mutationBigAToLittleA: 0,
  mutationLittleAToBigA: 0,
  drift: false,
  seed: 7,
})
for (const generation of neutral.generations) {
  assert.ok(Math.abs(generation.p - 0.37) < 1e-12)
}

// Deterministic selection should move the same initial population upward.
const directional = simulateEvolution({
  initialP: 0.2,
  populationSize: 1000,
  generations: 40,
  selectionCoefficient: 0.12,
  dominance: 0.5,
  mutationBigAToLittleA: 0,
  mutationLittleAToBigA: 0,
  drift: false,
  seed: 7,
})
assert.ok(directional.generations.at(-1)!.p > directional.generations[0].p)

// Seeded drift must be reproducible, which keeps educational/regression output testable.
const driftParams = {
  initialP: 0.5,
  populationSize: 40,
  generations: 25,
  selectionCoefficient: 0,
  dominance: 0.5,
  mutationBigAToLittleA: 0,
  mutationLittleAToBigA: 0,
  drift: true,
  seed: 12345,
}
const driftA = simulateEvolution(driftParams)
const driftB = simulateEvolution(driftParams)
assert.deepEqual(
  driftA.generations.map((g) => g.p),
  driftB.generations.map((g) => g.p),
)

console.log('Central dogma + evolution: directionality, codon decoding, H-W conservation, selection, mutation and seeded drift are deterministic and bounded.')
