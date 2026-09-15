import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const studio = readFileSync('src/pages/bodyhub/RespiratoryMechanicsStudio.tsx', 'utf8')
const host = readFileSync('src/pages/bodyhub/MultisystemScaleNavigator.tsx', 'utf8')

for (const token of ['data-body-respiratory-mechanics="v1"', 'Airway', 'Alveoli', 'Pleura', 'Diaphragm', 'resistance ∝ 1/r⁴', 'not patient spirometry', 'not a patient airway calculation']) assert.ok(studio.includes(token), `missing ${token}`)
assert.ok(studio.includes("Math.pow(radius, 4)"), 'airway resistance teaching relation must remain explicit')
assert.ok(studio.includes('motion-reduce:transition-none'), 'reduced-motion behavior must remain')
assert.ok(host.includes("import RespiratoryMechanicsStudio from './RespiratoryMechanicsStudio'"), 'studio must remain reachable')
assert.ok(host.includes('<RespiratoryMechanicsStudio />'), 'studio must render in Body Exposure')
console.log('body respiratory mechanics studio acceptance: ok')
