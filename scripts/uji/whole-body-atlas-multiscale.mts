import assert from 'node:assert/strict'
import { WholeBodyAtlasEngine } from '../../src/lib/anatomy/engine.ts'
import { MULTISCALE_ATLAS_NODES, PHYSIOLOGY_EQUATIONS } from '../../src/lib/anatomy/multiscale.ts'

const atlas = new WholeBodyAtlasEngine()
assert.deepEqual(atlas.validateMultiscale(), [])

const fullRespiratoryZoom = atlas.traceScale('scale:body', 'scale:gas-molecule')
assert.ok(fullRespiratoryZoom, 'Expected a deterministic whole-body -> molecular respiratory path.')
assert.deepEqual(fullRespiratoryZoom.nodeIds, [
  'scale:body',
  'scale:thorax',
  'scale:respiratory-system',
  'scale:lung',
  'scale:bronchopulmonary-segment',
  'scale:alveolus',
  'scale:alveolar-barrier',
  'scale:type-i-pneumocyte',
  'scale:gas-molecule',
])
assert.ok(fullRespiratoryZoom.totalWeight > 0)
assert.equal(fullRespiratoryZoom.transitions[0]?.requirement, 'source-geometry')
assert.ok(fullRespiratoryZoom.transitions.some((transition) => transition.requirement === 'academic-review'))

const lungEquations = atlas.physiologyFor('right-lung')
assert.ok(lungEquations.some((equation) => equation.id === 'resp:alveolar-ventilation'))
assert.ok(lungEquations.some((equation) => equation.id === 'resp:diffusion-capacity'))
assert.ok(lungEquations.some((equation) => equation.id === 'resp:compliance'))

const aortaEquations = atlas.physiologyFor('abdominal-aorta')
assert.deepEqual(aortaEquations.map((equation) => equation.id), ['cv:flow-resistance'])

for (const equation of PHYSIOLOGY_EQUATIONS) {
  assert.equal(equation.patientSpecific, false)
  assert.ok(equation.equation.trim())
  assert.ok(equation.variables.length >= 2)
  assert.ok(equation.anchorStructureIds.length >= 1)
  assert.ok(equation.reference.id)
  assert.ok(equation.reference.revision)
  for (const variable of equation.variables) {
    assert.ok(variable.symbol.trim())
    assert.ok(variable.label.trim())
    assert.ok(variable.unit.trim())
  }
}

const sourceMeshLevels = MULTISCALE_ATLAS_NODES.filter((node) => node.geometryMode === 'source-mesh')
const referenceOnlyLevels = MULTISCALE_ATLAS_NODES.filter((node) => node.geometryMode === 'reference-only')
assert.ok(sourceMeshLevels.length >= 5)
assert.ok(referenceOnlyLevels.some((node) => node.level === 'cellular'))
assert.ok(referenceOnlyLevels.some((node) => node.level === 'molecular'))

const engineValidation = atlas.validate()
assert.equal(engineValidation.valid, true, engineValidation.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'))

console.log(
  `Multiscale atlas verified: ${MULTISCALE_ATLAS_NODES.length} scale nodes, ${PHYSIOLOGY_EQUATIONS.length} symbolic physiology contracts, deterministic whole-body-to-molecular navigation, and explicit review/geometry boundaries.`,
)
