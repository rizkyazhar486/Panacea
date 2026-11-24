import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BIOCHEMICAL_COMPOUNDS_DATASET,
  CHEMICAL_ELEMENTS_DATASET,
  CURATED_GENE_LOCI,
  MULTISCALE_TIER_ORDER,
  ORGANELLES_DATASET,
  QUANTUM_BIO_PROCESSES,
  SPECIALIZED_CELLS_DATASET,
  TISSUES_DATASET,
  UNIVERSAL_VISUAL_DEMOGRAPHIC_PRESETS,
  analyzeDnaStrandAndTranslation,
  computeElectronTunnelingFactor,
  resolveVisualDemographicPreset,
  simulateFsd15DigitalTwinFrame,
  simulatePointMutationEffect,
} from '../../src/engines/reality-view/universalMultiscaleBioAtlasDataset.ts'

// 1. All 10 requested visual demographic personas resolve cleanly (Indonesian & English)
assert.equal(UNIVERSAL_VISUAL_DEMOGRAPHIC_PRESETS.length, 10)
const queries = [
  ['wanita', 'wanita'],
  ['eldest', 'eldest'],
  ['nenek', 'nenek'],
  ['kakek', 'kakek'],
  ['bayi', 'bayi'],
  ['bayi kembar', 'bayi_kembar'],
  ['autism', 'autism'],
  ['anak laki laki', 'anak_laki'],
  ['anak perempuan', 'anak_perempuan'],
  ['ibu hamil', 'ibu_hamil'],
] as const
for (const [q, expected] of queries) {
  assert.equal(resolveVisualDemographicPreset(q).id, expected, `failed resolving ${q}`)
}

// 2. Full multiscale datasets populated (Quantum -> Element -> Compound -> DNA/RNA -> Organelle -> Cell -> Tissue)
assert.equal(MULTISCALE_TIER_ORDER.length, 11)
assert.ok(QUANTUM_BIO_PROCESSES.every((q) => q.epistemicTag === 'THEORETICAL_BIOPHYSICS_EDUCATIONAL'))
assert.equal(CHEMICAL_ELEMENTS_DATASET.length, 13)
assert.equal(BIOCHEMICAL_COMPOUNDS_DATASET.length, 11)
assert.equal(CURATED_GENE_LOCI.length, 6)
assert.ok(ORGANELLES_DATASET.length >= 6)
assert.ok(SPECIALIZED_CELLS_DATASET.length >= 8)
assert.ok(TISSUES_DATASET.length >= 6)

// 3. Quantum electron tunneling decays monotonically with barrier distance (Marcus/Hopfield physics)
assert.ok(computeElectronTunnelingFactor(6) > computeElectronTunnelingFactor(12))
assert.ok(computeElectronTunnelingFactor(12) > computeElectronTunnelingFactor(18))

// 4. DNA complementary strand, H-bonds, GC%, mRNA transcription & 64-codon translation + point mutation
const hbb = analyzeDnaStrandAndTranslation('ATGGTGCATCTGACTCCTGAGGAGAAG')
assert.equal(hbb.templateStrand3to5.slice(0, 6), 'TACCAC')
assert.equal(hbb.mrna5to3.slice(0, 6), 'AUGGUG')
assert.equal(hbb.aminoAcids[0], 'Met')
assert.equal(hbb.aminoAcids[1], 'Val')
assert.equal(hbb.aminoAcids[6], 'Glu')

// Classic HbS GAG -> GTG (Glu -> Val) missense mutation at base index 19!
const hbs = simulatePointMutationEffect('ATGGTGCATCTGACTCCTGAGGAGAAG', 19, 'T')
assert.equal(hbs.classification, 'MISSENSE')
assert.equal(hbs.mutated.aminoAcids[6], 'Val')

// Premature stop codon AAG -> TAG (Lys -> STOP) nonsense mutation at index 24
const nonsense = simulatePointMutationEffect('ATGGTGCATCTGACTCCTGAGGAGAAG', 24, 'T')
assert.equal(nonsense.classification, 'NONSENSE')

// 5. FSD-15 Live Digital Twin synchronization across Twins, Autism, Eldest & Exertion
const twinFrame = simulateFsd15DigitalTwinFrame({ demographicId: 'bayi_kembar' })
assert.equal(twinFrame.epistemicClass, 'MECHANISTIC_EDUCATIONAL_SIMULATION')
assert.equal(twinFrame.notClinicalAdvice, true)
assert.ok(twinFrame.twinDualTelemetry && twinFrame.twinDualTelemetry.twinAHrBpm > 120)

const autismFrame = simulateFsd15DigitalTwinFrame({ demographicId: 'autism' })
assert.equal(autismFrame.sensoryFriendlyUiMode, true)
assert.equal(autismFrame.genomicStream.gene.symbol, 'SHANK3')

const restWoman = simulateFsd15DigitalTwinFrame({ demographicId: 'wanita', exertionMet: 1.0 })
const runWoman = simulateFsd15DigitalTwinFrame({ demographicId: 'wanita', exertionMet: 7.0 })
assert.ok(runWoman.organLevel.cardiacOutputLMin > restWoman.organLevel.cardiacOutputLMin)
assert.ok(runWoman.organelleQuantumLevel.atpSynthaseRotorRpmEdu > restWoman.organelleQuantumLevel.atpSynthaseRotorRpmEdu)

// 6. UI dark surface marker & studio contract
const studioSrc = readFileSync(new URL('../../src/components/reality-view/Fsd15BioTelemetryStudio.tsx', import.meta.url), 'utf8')
assert.ok(studioSrc.includes('dark space-y-3'), 'Fsd15BioTelemetryStudio must declare explicit dark surface marker')
assert.ok(studioSrc.includes('data-fsd15-bio-telemetry'))

console.log(
  `fsd15-demographic-multiscale-twin: 10 demographic personas, 11 multiscale tiers, 13 elements, 11 compounds, HbS Glu->Val missense verified, Twin A/B & Autism calm telemetry PASS`,
)
