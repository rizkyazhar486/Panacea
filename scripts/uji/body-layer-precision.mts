import assert from 'node:assert/strict'
import { INDEKS_TUBUH } from '../../src/lib/bodySearch.ts'
import { KEDALAMAN } from '../../src/lib/dissection.ts'
import {
  LAYER_PRECISION_LAYERS,
  layerPrecisionByExactName,
  layerPrecisionForStructure,
} from '../../src/lib/anatomy/layerPrecision.ts'

const expectedFiles = {
  surface: 'surface.glb',
  muscular: 'muscular.glb',
  cardiovascular: 'cardiovascular.glb',
  nervous: 'nervous.glb',
  lymphoid: 'lymphoid.glb',
  visceral: 'visceral.glb',
  skeletal: 'skeletal.glb',
} as const

assert.deepEqual(
  LAYER_PRECISION_LAYERS.map((entry) => entry.depthStage),
  [0, 1, 2, 3, 4, 5, 6],
  'layer precision must preserve the existing outer-to-inner dissection stages',
)

for (const definition of LAYER_PRECISION_LAYERS) {
  assert.equal(definition.sourceFile, expectedFiles[definition.layer])
  assert.equal(definition.depthStage, KEDALAMAN[definition.layer])
}

assert.ok(INDEKS_TUBUH.length >= 2_500, 'whole-body source index should retain thousands of real named meshes')

for (const structure of INDEKS_TUBUH) {
  const precision = layerPrecisionForStructure(structure)
  assert.equal(precision.source, 'whole-body-geometry-index')
  assert.equal(precision.layer.layer, structure.l)
  assert.equal(precision.layer.sourceFile, expectedFiles[structure.l])
  assert.equal(precision.layer.depthStage, KEDALAMAN[structure.l])
  assert.equal(precision.coordinateSpace, 'normalized-whole-body-model')
  assert.equal(precision.physicallyCalibrated, false)
  assert.equal(precision.physicalUnit, null)
  assert.ok(precision.exactMeshNames.includes(structure.n), `${structure.n} must remain part of its exact source set`)
  assert.ok(precision.members.length >= 1, `${structure.n} must resolve to indexed mesh metadata`)
  assert.ok(precision.members.every((member) => INDEKS_TUBUH.some((candidate) => candidate.n === member.exactMeshName && candidate.l === structure.l)))
  assert.ok(precision.members.every((member) => Number.isFinite(member.normalizedHeight) && member.normalizedHeight >= 0 && member.normalizedHeight <= 1))
  assert.ok(precision.members.every((member) => Number.isFinite(member.normalizedRadialDistance) && member.normalizedRadialDistance >= 0))
  assert.equal(precision.totalTriangles, precision.members.reduce((sum, member) => sum + member.triangles, 0))
  assert.deepEqual(layerPrecisionByExactName(structure.n), precision)
}

assert.equal(layerPrecisionByExactName('__not_a_real_mesh__'), null, 'unknown names must fail closed rather than substitute another structure')

console.log(`Layer precision contract verified across ${INDEKS_TUBUH.length} exact whole-body meshes and all ${LAYER_PRECISION_LAYERS.length} source layers.`)
