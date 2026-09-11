import assert from 'node:assert/strict'
import type { StrukturTubuh } from '../../src/lib/bodyIndex.gen.ts'
import { compileBodyAtlasGraph } from '../../src/lib/bodyAtlasGraph.ts'
import {
  BODY_RESPIRATORY_ATLAS,
  buildRespiratoryAtlas,
  classifyRespiratoryAtlasNode,
  computeBreathAtlasVisualState,
  validateRespiratoryAtlas,
} from '../../src/lib/bodyRespiratoryAtlas.ts'

const productionValidation = validateRespiratoryAtlas()
assert.equal(productionValidation.valid, true, productionValidation.reasons.join('\n'))
assert.ok(BODY_RESPIRATORY_ATLAS.nodes.length > 0)
assert.ok(BODY_RESPIRATORY_ATLAS.coverageFraction >= 0 && BODY_RESPIRATORY_ATLAS.coverageFraction <= 1)

const synthetic: StrukturTubuh[] = [
  { n: 'Trachea', b: 'Trachea', l: 'visceral', s: 'tengah', y: 0.81, r: 0.02, w: 'leher', t: 20_000 },
  { n: 'Main bronchus.l', b: 'Main bronchus', l: 'visceral', s: 'kiri', y: 0.75, r: 0.1, w: 'toraks', t: 12_000 },
  { n: 'Main bronchus.r', b: 'Main bronchus', l: 'visceral', s: 'kanan', y: 0.75, r: 0.1, w: 'toraks', t: 12_000 },
  { n: 'Superior lobar bronchus.r', b: 'Superior lobar bronchus', l: 'visceral', s: 'kanan', y: 0.74, r: 0.16, w: 'toraks', t: 8_000 },
  { n: 'Anterior segmental bronchus of right lung', b: 'Anterior segmental bronchus of right lung', l: 'visceral', s: 'kanan', y: 0.72, r: 0.21, w: 'toraks', t: 4_000 },
  { n: 'Terminal bronchiole.l', b: 'Terminal bronchiole', l: 'visceral', s: 'kiri', y: 0.7, r: 0.25, w: 'toraks', t: 1_000 },
  { n: 'Alveolar sac.l', b: 'Alveolar sac', l: 'visceral', s: 'kiri', y: 0.69, r: 0.28, w: 'toraks', t: 500 },
  { n: 'Right lung', b: 'Right lung', l: 'visceral', s: 'kanan', y: 0.72, r: 0.3, w: 'toraks', t: 90_000 },
  { n: 'Pleura.r', b: 'Pleura', l: 'visceral', s: 'kanan', y: 0.72, r: 0.32, w: 'toraks', t: 30_000 },
  { n: 'Diaphragm', b: 'Diaphragm', l: 'muscular', s: 'tengah', y: 0.64, r: 0.22, w: 'toraks', t: 50_000 },
  { n: 'External intercostal muscle.r', b: 'External intercostal muscle', l: 'muscular', s: 'kanan', y: 0.73, r: 0.34, w: 'toraks', t: 9_000 },
  { n: 'Posterior intercostal artery.r', b: 'Posterior intercostal artery', l: 'cardiovascular', s: 'kanan', y: 0.73, r: 0.33, w: 'toraks', t: 9_000 },
  { n: 'Pulmonary trunk', b: 'Pulmonary trunk', l: 'cardiovascular', s: 'tengah', y: 0.72, r: 0.08, w: 'toraks', t: 70_000 },
  { n: 'Superior pulmonary vein.r', b: 'Superior pulmonary vein', l: 'cardiovascular', s: 'kanan', y: 0.72, r: 0.13, w: 'toraks', t: 18_000 },
]

const graph = compileBodyAtlasGraph(synthetic)
const atlas = buildRespiratoryAtlas(graph)
const validation = validateRespiratoryAtlas(atlas)
assert.equal(validation.valid, true, validation.reasons.join('\n'))

const byName = new Map(atlas.nodes.map((node) => [node.atlasNode.sourceName, node] as const))
assert.equal(byName.get('Trachea')?.airwayGeneration, 0)
assert.equal(byName.get('Main bronchus.r')?.airwayGeneration, 1)
assert.equal(byName.get('Superior lobar bronchus.r')?.airwayGeneration, 2)
assert.equal(byName.get('Anterior segmental bronchus of right lung')?.airwayGeneration, 3)
assert.equal(byName.get('Terminal bronchiole.l')?.airwayGeneration, 6)
assert.equal(byName.get('Alveolar sac.l')?.airwayGeneration, 9)
assert.equal(byName.get('Right lung')?.compartment, 'lung-parenchyma')
assert.equal(byName.get('Pleura.r')?.compartment, 'pleura')
assert.equal(byName.get('Diaphragm')?.compartment, 'respiratory-pump')
assert.equal(byName.get('External intercostal muscle.r')?.compartment, 'respiratory-pump')
assert.equal(byName.get('Pulmonary trunk')?.compartment, 'pulmonary-vasculature')
assert.equal(byName.get('Superior pulmonary vein.r')?.compartment, 'pulmonary-vasculature')
assert.equal(byName.has('Posterior intercostal artery.r'), false)

const intercostalArtery = graph.nodes.find((node) => node.sourceName === 'Posterior intercostal artery.r')
assert.ok(intercostalArtery)
assert.equal(classifyRespiratoryAtlasNode(intercostalArtery), null)

assert.equal(atlas.airwayGenerationCounts[0], 1)
assert.equal(atlas.airwayGenerationCounts[1], 2)
assert.equal(atlas.airwayGenerationCounts[2], 1)
assert.equal(atlas.airwayGenerationCounts[3], 1)
assert.equal(atlas.airwayGenerationCounts[6], 1)
assert.equal(atlas.airwayGenerationCounts[9], 1)

const phase0 = computeBreathAtlasVisualState(0)
assert.equal(phase0.inspirationEnvelope, 0)
assert.equal(phase0.flowDirection, 'transition')
assert.equal(phase0.patientSpecific, false)
assert.equal(phase0.units, 'normalized-visualization-only')

const inspiration = computeBreathAtlasVisualState(0.25)
assert.ok(Math.abs(inspiration.inspirationEnvelope - 0.5) < 1e-12)
assert.equal(inspiration.flowDirection, 'inspiration')
assert.ok(inspiration.lungScale > 1)

const peak = computeBreathAtlasVisualState(0.5)
assert.ok(Math.abs(peak.inspirationEnvelope - 1) < 1e-12)
assert.equal(peak.flowDirection, 'transition')

const expiration = computeBreathAtlasVisualState(0.75)
assert.equal(expiration.flowDirection, 'expiration')

const clamped = computeBreathAtlasVisualState(-0.25, 99)
assert.ok(Math.abs(clamped.phase - 0.75) < 1e-12)
assert.equal(clamped.effort, 1.5)

console.log(`Respiratory atlas: ${BODY_RESPIRATORY_ATLAS.nodes.length} shipped source meshes classified across ${BODY_RESPIRATORY_ATLAS.compartments.length} compartments; explicit coverage gaps + 0..10 airway generations + normalized breath animation semantics verified.`)
