import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/pages/bodyhub/MultiscaleScaleRail.tsx', import.meta.url), 'utf8')

for (const required of [
  'Whole body', 'System', 'Organ', 'Tissue', 'Cell', 'Organelle', 'Molecule', 'Protein', 'Pathway', 'Gene',
]) {
  assert.match(source, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Scale rail must retain ${required}.`)
}

assert.match(source, /Reference navigation · no inferred localization/)
assert.match(source, /Cross-scale links are evidence relationships/i)
assert.match(source, /No relationship is inferred from its name/i)
assert.match(source, /Reference biology is not a patient measurement/i)
assert.match(source, /cannot be projected into gross anatomy/i)
assert.match(source, /canRenderInGrossBody3D/)
assert.match(source, /overflow-x-auto/)
assert.match(source, /min-h-11/)
assert.doesNotMatch(source, /new\s+(?:THREE\.)?(?:WebGLRenderer|Scene|PerspectiveCamera)\s*\(/)
assert.doesNotMatch(source, /<iframe/i)
assert.doesNotMatch(source, /setInterval\s*\(/)
assert.doesNotMatch(source, /requestAnimationFrame\s*\(/)
assert.doesNotMatch(source, /patientSpecific\s*[:=]\s*true/)

console.log('Multiscale scale rail preserves evidence-first navigation, mobile containment, and shared-renderer boundaries.')
