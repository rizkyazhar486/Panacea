import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  bicarbonatePH,
  cardiacCycleSeconds,
  ejectionFraction,
  fickOxygenConsumption,
  nernstPotentialMv,
  oxygenContent,
  physiologySnapshot,
} from '../../src/lib/microphysiology.ts'

const near = (actual: number, expected: number, tolerance: number, label: string) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} not within ${tolerance} of ${expected}`)
}

const ca = oxygenContent(15, 98, 95)
const cv = oxygenContent(15, 75, 40)
near(ca, 19.98, 0.1, 'CaO2')
near(cv, 15.20, 0.1, 'CvO2')
near(fickOxygenConsumption(5, ca, cv), 239, 8, 'Fick VO2')
near(nernstPotentialMv(4, 140, 1, 37), -95.0, 1.0, 'K Nernst potential')
near(bicarbonatePH(24, 40), 7.40, 0.02, 'Henderson-Hasselbalch pH')
near(cardiacCycleSeconds(75), 0.8, 1e-9, 'cardiac cycle')
near(ejectionFraction(120, 50), 58.33, 0.05, 'ejection fraction')

const snapshot = physiologySnapshot({
  hb: 15,
  saO2: 98,
  paO2: 95,
  svO2: 75,
  pvO2: 40,
  cardiacOutput: 5,
  potassiumOutside: 4,
  potassiumInside: 140,
  temperatureC: 37,
  bicarbonate: 24,
  paCO2: 40,
})
assert.ok(snapshot.caO2 > snapshot.cvO2)
assert.ok(snapshot.vo2 > 0)
assert.ok(Number.isFinite(snapshot.kNernst))
assert.ok(Number.isFinite(snapshot.pH))

// Input hardening: invalid/negative values should not produce NaN/Infinity.
assert.ok(Number.isFinite(oxygenContent(-1, 200, -20)))
assert.ok(Number.isFinite(nernstPotentialMv(0, 0, 0, -500)))
assert.ok(Number.isFinite(bicarbonatePH(0, 0)))

// Saturation is bounded at 0–100%; impossible input must not inflate content.
near(oxygenContent(15, 150, 0), oxygenContent(15, 100, 0), 1e-9, 'oxygen saturation clamp')
assert.equal(ejectionFraction(120, 140), 0, 'ESV above EDV is clamped to EDV')

// Integration regressions: microphysiology stays attached to Body Exposure and
// remains explicitly educational rather than masquerading as patient-derived data.
const dockSource = readFileSync('src/components/digital-twin/BodyEvidenceDock.tsx', 'utf8')
const explorerSource = readFileSync('src/components/digital-twin/PhysiologyScaleExplorer.tsx', 'utf8')
assert.match(dockSource, /PhysiologyScaleExplorer/)
assert.match(dockSource, /mode === 'digital-twin' \|\| mode === 'cell-genome'/)
assert.match(explorerSource, /REFERENCE MODEL · NOT PATIENT-DERIVED/)
assert.match(explorerSource, /Type I pneumocyte/)
assert.match(explorerSource, /Na⁺\/K⁺/)
assert.match(explorerSource, /RNA Pol II/)
assert.doesNotMatch(explorerSource, /setScalar\(/, 'microphysiology must not use toy-like whole-object scale pulsing')

console.log('microphysiology formulas + Body Exposure integration: all assertions passed')
