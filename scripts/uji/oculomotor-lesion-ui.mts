import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const ui = readFileSync(new URL('../../src/domains/body-exposure/ui/OculomotorLesionLab.tsx', import.meta.url), 'utf8')
const engine = readFileSync(new URL('../../src/domains/body-exposure/engine/oculomotorLesionEngine.ts', import.meta.url), 'utf8')
const host = readFileSync(new URL('../../src/components/digital-twin/OcularMotility4D.tsx', import.meta.url), 'utf8')

assert.match(ui, /CN III · IV · VI · MLF localization simulator/)
assert.match(ui, /type="range" min="0" max="100"/)
assert.match(ui, /aria-pressed=/)
assert.match(ui, /Deterministic educational model adapted from the MIT-licensed/)
assert.match(ui, /without claiming patient-specific measurements/)
assert.match(ui, /MIT-derived logic/)
assert.match(host, /<OculomotorLesionLab \/>/)

assert.match(engine, /Educational kinematic\/localization model only; not a diagnostic device/)
assert.match(engine, /Residual effector function uses f = 1 - severity\/100/)
assert.match(engine, /INO reduces conjugate adduction through the MLF/)
assert.doesNotMatch(ui, /diagnosis probability/i)
assert.doesNotMatch(ui, /treatment recommendation/i)
assert.doesNotMatch(engine, /automatic diagnosis/i)

console.log('oculomotor-lesion-ui: ok')
