import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ANATOMICAL_SYSTEM_IDS } from '../../src/types/realityView.ts'
import {
  BIOCHEMICAL_COMPOUNDS_DATASET,
  CHEMICAL_ELEMENTS_DATASET,
  CURATED_GENE_LOCI,
  FSD15_EDUCATIONAL_SCENARIOS,
  MULTISCALE_TIER_ORDER,
  ORGANELLES_DATASET,
  ORGAN_SYSTEMS_ATLAS_DATASET,
  ORGANS_ATLAS_DATASET,
  QUANTUM_BIO_PROCESSES,
  SPECIALIZED_CELLS_DATASET,
  TISSUES_DATASET,
  UNIVERSAL_VISUAL_DEMOGRAPHIC_PRESETS,
  analyzeDnaStrandAndTranslation,
  computeElectronTunnelingFactor,
  computeLiveOrganSystemTelemetry,
  computeLiveOrganTelemetry,
  resolveVisualDemographicPreset,
  simulateFsd15DigitalTwinFrame,
  simulatePointMutationEffect,
  traceCrossScaleCausalChain,
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

// 2. Full multiscale datasets populated (Quantum -> Element -> Compound -> DNA/RNA -> Organelle -> Cell -> Tissue -> Organ -> System)
assert.equal(MULTISCALE_TIER_ORDER.length, 11)
assert.ok(QUANTUM_BIO_PROCESSES.every((q) => q.epistemicTag === 'THEORETICAL_BIOPHYSICS_EDUCATIONAL'))
assert.equal(CHEMICAL_ELEMENTS_DATASET.length, 13)
assert.equal(BIOCHEMICAL_COMPOUNDS_DATASET.length, 11)
assert.equal(CURATED_GENE_LOCI.length, 6)
assert.ok(ORGANELLES_DATASET.length >= 6)
assert.ok(SPECIALIZED_CELLS_DATASET.length >= 8)
assert.ok(TISSUES_DATASET.length >= 6)
assert.equal(ORGANS_ATLAS_DATASET.length, 12)
assert.equal(ORGAN_SYSTEMS_ATLAS_DATASET.length, 10)
assert.equal(FSD15_EDUCATIONAL_SCENARIOS.length, 4)

// 2b. 100% referential integrity across all 10 canonical AnatomicalSystemIds & lower tiers
for (const sysId of ANATOMICAL_SYSTEM_IDS) {
  assert.ok(ORGAN_SYSTEMS_ATLAS_DATASET.some((s) => s.id === sysId), `missing organ system ${sysId}`)
}
const elementSyms = new Set(CHEMICAL_ELEMENTS_DATASET.map((e) => e.symbol))
const compoundIds = new Set(BIOCHEMICAL_COMPOUNDS_DATASET.map((c) => c.id))
const geneSyms = new Set(CURATED_GENE_LOCI.map((g) => g.symbol))
const organelleIds = new Set(ORGANELLES_DATASET.map((o) => o.id))
const cellIds = new Set(SPECIALIZED_CELLS_DATASET.map((c) => c.id))
const tissueIds = new Set(TISSUES_DATASET.map((t) => t.id))
const quantumIds = new Set(QUANTUM_BIO_PROCESSES.map((q) => q.id))
for (const organ of ORGANS_ATLAS_DATASET) {
  assert.ok(elementSyms.has(organ.elementSymbol), `invalid element ${organ.elementSymbol} on ${organ.id}`)
  assert.ok(compoundIds.has(organ.compoundId), `invalid compound ${organ.compoundId} on ${organ.id}`)
  assert.ok(geneSyms.has(organ.geneSymbol), `invalid gene ${organ.geneSymbol} on ${organ.id}`)
  assert.ok(organelleIds.has(organ.organelleId), `invalid organelle ${organ.organelleId} on ${organ.id}`)
  assert.ok(cellIds.has(organ.cellId), `invalid cell ${organ.cellId} on ${organ.id}`)
  assert.ok(tissueIds.has(organ.tissueId), `invalid tissue ${organ.tissueId} on ${organ.id}`)
  assert.ok(quantumIds.has(organ.quantumId), `invalid quantum ${organ.quantumId} on ${organ.id}`)
}

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

// 5. FSD-15 Live Digital Twin synchronization across Twins, Autism, Pregnancy, Eldest & Exertion
const twinFrame = simulateFsd15DigitalTwinFrame({ demographicId: 'bayi_kembar' })
assert.equal(twinFrame.epistemicClass, 'MECHANISTIC_EDUCATIONAL_SIMULATION')
assert.equal(twinFrame.notClinicalAdvice, true)
assert.ok(twinFrame.twinDualTelemetry && twinFrame.twinDualTelemetry.twinAHrBpm > 120)

const autismFrame = simulateFsd15DigitalTwinFrame({ demographicId: 'autism' })
assert.equal(autismFrame.sensoryFriendlyUiMode, true)
assert.equal(autismFrame.genomicStream.gene.symbol, 'SHANK3')
const autismBrain = computeLiveOrganTelemetry(autismFrame).find((o) => o.organ.id === 'brain')
assert.equal(autismBrain?.statusTag, 'CALM SENSORY GATING')

const restWoman = simulateFsd15DigitalTwinFrame({ demographicId: 'wanita', exertionMet: 1.0 })
const runWoman = simulateFsd15DigitalTwinFrame({ demographicId: 'wanita', exertionMet: 7.0 })
assert.ok(runWoman.organLevel.cardiacOutputLMin > restWoman.organLevel.cardiacOutputLMin)
assert.ok(runWoman.organelleQuantumLevel.atpSynthaseRotorRpmEdu > restWoman.organelleQuantumLevel.atpSynthaseRotorRpmEdu)

// Exertion redistributes blood flow to skeletal muscle while keeping cerebral autoregulation stable
const restOrgans = computeLiveOrganTelemetry(restWoman)
const runOrgans = computeLiveOrganTelemetry(runWoman)
const restMuscle = restOrgans.find((o) => o.organ.id === 'skeletal_muscle')!
const runMuscle = runOrgans.find((o) => o.organ.id === 'skeletal_muscle')!
const restBrain = restOrgans.find((o) => o.organ.id === 'brain')!
const runBrain = runOrgans.find((o) => o.organ.id === 'brain')!
assert.ok(runMuscle.perfusionMlMin > restMuscle.perfusionMlMin * 2)
assert.equal(runBrain.perfusionMlMin, restBrain.perfusionMlMin)

// Pregnancy increases uteroplacental perfusion vs non-pregnant woman
const pregFrame = simulateFsd15DigitalTwinFrame({ demographicId: 'ibu_hamil' })
const pregUterus = computeLiveOrganTelemetry(pregFrame).find((o) => o.organ.id === 'uterus_placenta')!
const nonPregUterus = restOrgans.find((o) => o.organ.id === 'uterus_placenta')!
assert.ok(pregUterus.perfusionMlMin > nonPregUterus.perfusionMlMin * 3)

// All 10 organ systems compute telemetry & 7-hop causal trace links Quantum -> Organ
const systemsOut = computeLiveOrganSystemTelemetry(runWoman)
assert.equal(systemsOut.length, 10)
const chain = traceCrossScaleCausalChain('heart', runWoman)
assert.equal(chain.length, 7)
assert.equal(chain[0].tier, 'quantum')
assert.equal(chain[6].tier, 'organ')

// 6. UI dark surface marker, live twin sync, and Beranda BLE quick-connect bridge
const studioSrc = readFileSync(new URL('../../src/components/reality-view/Fsd15BioTelemetryStudio.tsx', import.meta.url), 'utf8')
assert.ok(studioSrc.includes('dark space-y-3'), 'Fsd15BioTelemetryStudio must declare explicit dark surface marker')
assert.ok(studioSrc.includes('data-fsd15-bio-telemetry'))
assert.ok(studioSrc.includes('data-fsd15-live-twin-toggle'))
assert.ok(studioSrc.includes('liveVitals.heartRate') && studioSrc.includes('liveVitals.spo2Pct'))
assert.ok(studioSrc.includes('data-fsd15-organ-atlas'))
assert.ok(studioSrc.includes('data-fsd15-system-atlas'))
assert.ok(studioSrc.includes('data-fsd15-causal-chain'))

const berandaSrc = readFileSync(new URL('../../src/pages/dashboard/Beranda.tsx', import.meta.url), 'utf8')
assert.ok(berandaSrc.includes("'panacea:quick-ble-connect'"), 'Beranda must wire panacea:quick-ble-connect listener')

console.log(
  `fsd15-demographic-multiscale-twin: 10 personas, 11 tiers, 12 organs, 10 systems, 7-hop causal chain, perfusion redistribution, live twin & BLE bridge PASS`,
)
