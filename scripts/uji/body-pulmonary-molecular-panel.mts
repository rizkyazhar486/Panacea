import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  PULMONARY_SFTPC_MOLECULAR_VERTICAL,
  PULMONARY_SFTPC_WITHHELD_GAPS,
  validatePulmonarySftpcVertical,
} from '../../src/lib/bodyPulmonaryMolecularVertical.ts'

const source = readFileSync(new URL('../../src/pages/bodyhub/PulmonaryMolecularScalePanel.tsx', import.meta.url), 'utf8')
const validation = validatePulmonarySftpcVertical()

assert.equal(validation.valid, true, validation.reasons.join(' | '))
assert.equal(validation.publicationReady, false, 'UI must not imply publication readiness while academic review is pending.')
assert.equal(PULMONARY_SFTPC_MOLECULAR_VERTICAL.nodes.some((node) => node.patientSpecific !== false), false)
assert.equal(PULMONARY_SFTPC_WITHHELD_GAPS.length, 2)
assert.deepEqual(PULMONARY_SFTPC_WITHHELD_GAPS.map((gap) => gap.scale), ['organelle', 'molecule'])

assert.match(source, /MultiscaleScaleRail/)
assert.match(source, /Academic review pending/)
assert.match(source, /Publication:/)
assert.match(source, /Withheld scales · fail closed/)
assert.match(source, /does not generate a subcellular structure or molecule/i)
assert.match(source, /not patient expression/i)
assert.match(source, /cell-lab/)
assert.match(source, /molecular-lab/)
assert.match(source, /genomics-lab/)

for (const forbidden of [
  '<iframe',
  'requestAnimationFrame(',
  'setInterval(',
  'new THREE.WebGLRenderer',
  'new WebGLRenderer',
  'patient-specific coordinate',
  'human reviewed',
]) {
  assert.equal(source.includes(forbidden), false, `Pulmonary molecular panel must not contain forbidden runtime/claim pattern: ${forbidden}`)
}

console.log('Pulmonary molecular panel reuses Scale Rail, exposes withheld scales, and keeps heavy lab handoffs callback-only.')
