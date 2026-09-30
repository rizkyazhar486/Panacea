import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const ui = readFileSync(new URL('../../src/domains/body-exposure/ui/OculomotorLesionLab.tsx', import.meta.url), 'utf8')
const host = readFileSync(new URL('../../src/components/digital-twin/OcularMotility4D.tsx', import.meta.url), 'utf8')

assert.match(ui, /CN III · IV · VI · MLF localization simulator/)
assert.match(ui, /type="range" min="0" max="100"/)
assert.match(ui, /aria-pressed=/)
assert.match(ui, /Educational kinematic\/localization model only/)
assert.match(ui, /not a diagnostic device/)
assert.match(ui, /MIT-derived logic/)
assert.match(host, /<OculomotorLesionLab \/>/)

assert.doesNotMatch(ui, /diagnosis probability/i)
assert.doesNotMatch(ui, /patient-specific measurement/i)
assert.doesNotMatch(ui, /automatic diagnosis/i)

console.log('oculomotor-lesion-ui: ok')
