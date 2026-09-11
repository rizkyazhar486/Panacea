import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  WHOLE_BODY_BIOMECHANICS_DISCLOSURE,
  WHOLE_BODY_JOINT_PROFILES,
  clampJointAngle,
  classifyJointExcursion,
  normalizedJointExcursion,
  signedMotionLabel,
} from '../../src/lib/wholeBodyBiomechanics'

const requiredJoints = [
  'cervical-spine',
  'thoracolumbar-spine',
  'shoulder',
  'elbow',
  'forearm',
  'wrist',
  'hip',
  'knee',
  'ankle',
  'subtalar',
]

for (const id of requiredJoints) {
  assert.ok(WHOLE_BODY_JOINT_PROFILES.some((joint) => joint.id === id), `Missing required whole-body joint profile: ${id}`)
}

assert.ok(WHOLE_BODY_JOINT_PROFILES.length >= requiredJoints.length, 'Whole-body motion atlas must not silently lose joint coverage.')

for (const joint of WHOLE_BODY_JOINT_PROFILES) {
  assert.ok(joint.nodeHints.length > 0, `${joint.id} must map back to source anatomy node hints.`)
  assert.ok(joint.motions.length > 0, `${joint.id} must expose at least one reviewed motion coordinate.`)
  assert.ok(['native-geometry', 'adjacent-geometry'].includes(joint.sourceGeometry), `${joint.id} must disclose geometry provenance.`)

  for (const motion of joint.motions) {
    assert.ok(Number.isFinite(motion.minDeg) && Number.isFinite(motion.maxDeg) && Number.isFinite(motion.neutralDeg), `${motion.id} ROM must be finite.`)
    assert.ok(motion.minDeg < motion.maxDeg, `${motion.id} must have a non-zero reference envelope.`)
    assert.ok(motion.neutralDeg >= motion.minDeg && motion.neutralDeg <= motion.maxDeg, `${motion.id} neutral angle must lie inside the reference envelope.`)
    assert.ok(motion.drivers.length > 0, `${motion.id} must identify qualitative driver context.`)
    assert.ok(motion.opposers.length > 0, `${motion.id} must identify qualitative opposing context.`)
    assert.ok(motion.passiveRestraints.length > 0, `${motion.id} must identify qualitative passive-restraint context.`)
    assert.ok(motion.structureHints.length > 0, `${motion.id} must map to evidence-bearing source structure hints.`)

    assert.equal(clampJointAngle(motion, motion.minDeg - 1000), motion.minDeg)
    assert.equal(clampJointAngle(motion, motion.maxDeg + 1000), motion.maxDeg)
    assert.equal(normalizedJointExcursion(motion, motion.neutralDeg), 0)
    assert.equal(classifyJointExcursion(motion, motion.neutralDeg), 'neutral')
    assert.equal(signedMotionLabel(motion, motion.neutralDeg), 'Neutral')
  }
}

assert.match(WHOLE_BODY_BIOMECHANICS_DISCLOSURE.rangeRule, /generic educational reference envelopes/i)
assert.match(WHOLE_BODY_BIOMECHANICS_DISCLOSURE.forceRule, /must not convert slider position into patient-specific force, strain, injury risk or diagnosis/i)
assert.match(WHOLE_BODY_BIOMECHANICS_DISCLOSURE.geometryRule, /Do not deform evidence-bearing source anatomy/i)

const precisionLab = readFileSync('src/pages/bodyhub/WholeBodyPrecisionLab.tsx', 'utf8')
const inspector = readFileSync('src/pages/bodyhub/WholeBodyMotionInspector.tsx', 'utf8')
const anatomyCredits = readFileSync('public/anatomy/CREDITS.txt', 'utf8')
const specialtyCredits = readFileSync('public/atlas/CREDITS.txt', 'utf8')

assert.match(precisionLab, /WholeBodyMotionInspector/, 'Movement biomechanics tab must mount the whole-body motion inspector.')
assert.match(inspector, /Joint → axis → motion → contributing structures/, 'Inspector must preserve the joint-to-structure interaction model.')
assert.match(inspector, /does not warp anatomy or fabricate patient-specific force/i, 'Inspector must disclose its scientific boundary in the UI.')
assert.match(inspector, /onInput=\{\(event\) => updateAngleFromRange\(event\.currentTarget\.value\)\}/, 'ROM range must synchronize native input events with controlled React state.')
assert.match(inspector, /onChange=\{\(event\) => updateAngleFromRange\(event\.currentTarget\.value\)\}/, 'ROM range must retain the React change-event fallback.')
assert.doesNotMatch(inspector, /(?:ligament|tendon|muscle)\s+(?:strain|force)\s*[=:]\s*\{?\s*angleDeg/i, 'Slider position must never be presented as computed tissue force/strain.')

assert.match(anatomyCredits, /Z-Anatomy/i, 'Primary whole-body GLBs must preserve Z-Anatomy attribution.')
assert.match(anatomyCredits, /BodyParts3D/i, 'Primary whole-body GLBs must preserve BodyParts3D lineage.')
assert.match(anatomyCredits, /CC BY-SA 4\.0/i, 'Primary whole-body derivative license must remain explicit.')
assert.match(specialtyCredits, /BodyParts3D 4\.0/i, 'Specialty atlas must preserve direct BodyParts3D attribution where applicable.')
assert.match(specialtyCredits, /ashemag\/human-atlas/i, 'Specialty atlas must preserve human-atlas packaging attribution.')

console.log(`Whole-body biomechanics invariants verified across ${WHOLE_BODY_JOINT_PROFILES.length} joint profiles.`)
