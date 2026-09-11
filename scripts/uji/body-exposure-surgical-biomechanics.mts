import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { COUPLED_KINEMATICS, coupledKinematicsFor } from '../../src/lib/biomechanicsCoupling'
import { SURGICAL_SPATIAL_SCENARIOS } from '../../src/lib/surgicalSpatialTeaching'

assert.ok(SURGICAL_SPATIAL_SCENARIOS.length >= 4, 'Body Exposure must retain the reviewed spatial surgical scenarios.')

for (const scenario of SURGICAL_SPATIAL_SCENARIOS) {
  assert.ok(scenario.label.trim(), `${scenario.id} requires a visible label.`)
  assert.ok(scenario.orientation.trim(), `${scenario.id} requires an orientation frame.`)
  assert.ok(scenario.purpose.trim(), `${scenario.id} requires an educational purpose.`)
  assert.ok(scenario.checkpoints.length > 0, `${scenario.id} requires anatomy checkpoints.`)
  assert.ok(scenario.sourceLabel.trim(), `${scenario.id} requires provenance.`)
  assert.match(scenario.geometryBoundary, /not|cannot|does not|may not/i, `${scenario.id} must state a geometry/clinical boundary.`)

  for (const checkpoint of scenario.checkpoints) {
    assert.ok(checkpoint.anatomy.trim(), `${scenario.id}/${checkpoint.id} requires anatomical description.`)
    assert.ok(checkpoint.relationships.length > 0, `${scenario.id}/${checkpoint.id} requires spatial relationships.`)
    assert.ok(checkpoint.nodeHints.length > 0, `${scenario.id}/${checkpoint.id} must map to source-mesh hints.`)
    assert.ok(checkpoint.layerHints.length > 0, `${scenario.id}/${checkpoint.id} must map to anatomy layers.`)
  }
}

const transseptal = SURGICAL_SPATIAL_SCENARIOS.find((item) => item.id === 'transseptal-anatomy')
assert.ok(transseptal, 'Transseptal spatial anatomy scenario must remain available.')
assert.match(transseptal.orientation, /fossa ovalis/i)
assert.match(transseptal.orientation, /septum primum/i)
assert.match(transseptal.orientation, /septum secundum/i)
assert.match(transseptal.geometryBoundary, /does not infer a patient-specific puncture point/i)
assert.equal(transseptal.sourceUrl, 'https://pubmed.ncbi.nlm.nih.gov/42213503/')

const fo = transseptal.checkpoints.find((item) => item.id === 'fo-floor')
assert.ok(fo, 'Fossa ovalis floor checkpoint must remain explicit.')
assert.match(fo.anatomy, /true interatrial septal tissue/i)
assert.ok(fo.relationships.some((item) => /inferior vena cava/i.test(item)))
assert.ok(fo.relationships.some((item) => /superior vena cava/i.test(item)))

const aortic = transseptal.checkpoints.find((item) => item.id === 'anterior-superior-neighbor')
assert.ok(aortic, 'Anterior-superior transseptal neighbor must remain explicit.')
assert.match(aortic.anatomy, /aortic/i)
assert.ok(aortic.structuresAtRisk.some((item) => /aortic root/i.test(item)))

const carpal = SURGICAL_SPATIAL_SCENARIOS.find((item) => item.id === 'carpal-tunnel-spatial')
assert.ok(carpal, 'Carpal tunnel spatial anatomy scenario must remain available.')
assert.ok(carpal.checkpoints.some((item) => /nine flexor tendons/i.test(item.anatomy)))
assert.ok(carpal.checkpoints.some((item) => /separate compartment/i.test(item.anatomy)))

const knee = SURGICAL_SPATIAL_SCENARIOS.find((item) => item.id === 'knee-medial-parapatellar-spatial')
assert.ok(knee, 'Knee spatial anatomy scenario must remain available.')
const posteriorKnee = knee.checkpoints.find((item) => item.id === 'posterior-boundary')
assert.ok(posteriorKnee)
assert.match(posteriorKnee.anatomy, /posterior to the knee/i)
assert.ok(posteriorKnee.structuresAtRisk.some((item) => /popliteal artery/i.test(item)))

assert.ok(COUPLED_KINEMATICS.length >= 5, 'Coupled biomechanics coverage must not silently disappear.')
const kneeCoupling = coupledKinematicsFor('knee-flexion-extension')
assert.ok(kneeCoupling)
assert.match(kneeCoupling.coupledMotion, /screw-home/i)
assert.match(kneeCoupling.interpretation, /varies with task and subject/i)

const forearmCoupling = coupledKinematicsFor('forearm-pronation-supination')
assert.ok(forearmCoupling)
assert.match(forearmCoupling.coupledMotion, /radius crosses anteriorly over the ulna/i)
assert.match(forearmCoupling.interpretation, /not wrist rotation/i)

const hipCoupling = coupledKinematicsFor('hip-abduction-adduction')
assert.ok(hipCoupling)
assert.match(hipCoupling.interpretation, /does not estimate abductor force or joint-contact force/i)

const inspector = readFileSync('src/pages/bodyhub/WholeBodyMotionInspector.tsx', 'utf8')
const surgicalLab = readFileSync('src/pages/bodyhub/SurgicalLab.tsx', 'utf8')
assert.match(inspector, /Coupled kinematics/)
assert.match(inspector, /does not warp anatomy or fabricate patient-specific force/i)
assert.match(surgicalLab, /Spatial surgical anatomy/)
assert.match(surgicalLab, /missing anatomy stays text-only instead of being fabricated/i)
assert.match(surgicalLab, /not operative instructions/i)

console.log(`Body Exposure surgical-spatial + coupled-biomechanics guards verified (${SURGICAL_SPATIAL_SCENARIOS.length} surgical scenarios; ${COUPLED_KINEMATICS.length} coupled motions).`)
