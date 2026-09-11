import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const physiology = readFileSync('src/components/digital-twin/PhysiologyHraWorkbench.tsx', 'utf8')

assert.match(physiology, /Whole-body normal physiology/)
assert.match(physiology, /system\.key !== 'shock'/, 'shock must be excluded from the normal physiology selector')
assert.match(physiology, /Pathological anatomy is not rendered inside the normal-physiology route/)
assert.doesNotMatch(physiology, /MicroPathologyComparator/, 'normal physiology must not mount pathology comparison')
assert.doesNotMatch(physiology, /ClinicalPhysiologyMechanisms/, 'the mixed normal/pathophysiology atlas must not mount inside normal physiology')
assert.doesNotMatch(physiology, /Fever mechanism/, 'fever pathophysiology must not be presented as a normal physiology metric')
assert.match(physiology, /measured · derived · educational · unavailable/i, 'provenance separation must remain explicit')
assert.match(physiology, /prefers-reduced-motion/, 'automatic phase animation must respect reduced-motion preferences')

const sourceModel = readFileSync('src/lib/bodyPhysiology.ts', 'utf8')
assert.match(sourceModel, /key: 'shock'/, 'pathophysiology source data should remain available for a later dedicated pathology layer')
assert.match(sourceModel, /key: 'thermoregulation'/)

console.log('Body Exposure physiology boundary: normal physiology is separated from pathology and keeps provenance safeguards')
