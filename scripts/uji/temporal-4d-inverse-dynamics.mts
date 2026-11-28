import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  LIFESPAN_STAGES,
  TEMPORAL_4D_BOUNDARY,
  evaluateCircadian24h,
  evaluateLifespanAge,
  sampleCircadianDayCurve,
  solveInverseDynamics,
} from '../../src/domains/body-exposure/engine/temporalPhysiology4DEngine.ts'

// 1. Circadian 24-hour coupled oscillator invariants
assert.equal(TEMPORAL_4D_BOUNDARY.truthClass, 'EDUCATIONAL_REFERENCE_MODEL')
assert.equal(TEMPORAL_4D_BOUNDARY.patientSpecificDiagnosis, false)
const day = sampleCircadianDayCurve()
assert.equal(day.length, 25)
const night = evaluateCircadian24h(2.5)
const morning = evaluateCircadian24h(7.5)
const evening = evaluateCircadian24h(17.5)
assert.ok(night.melatoninPgMl > 60 && morning.melatoninPgMl < 15, 'Melatonin peaks nocturnally and drops after waking')
assert.ok(morning.cortisolUgDl > night.cortisolUgDl, 'Cortisol awakening response exceeds nocturnal nadir')
assert.ok(evening.coreTempC > night.coreTempC, 'Core temperature peaks in late afternoon/evening')

// 2. Lifespan 0-100y developmental & aging reference curves
assert.equal(LIFESPAN_STAGES.length, 6)
const infant = evaluateLifespanAge(0.5)
const adult = evaluateLifespanAge(30)
const elder = evaluateLifespanAge(80)
assert.equal(infant.stage.id, 'infant')
assert.equal(elder.stage.id, 'elder')
assert.ok(infant.restingHrBpm > adult.restingHrBpm, 'Pediatric resting HR exceeds adult resting HR')
assert.equal(adult.maxHrBpm, 187, 'Tanaka HRmax 208 - 0.7 * 30 = 187')
assert.ok(adult.gfrMlMin > elder.gfrMlMin && elder.gfrMlMin >= 45)
assert.ok(adult.boneDensityPctPeak > elder.boneDensityPctPeak)

// 3. Newtonian inverse-dynamics equilibrium invariants
const upright = solveInverseDynamics({ bodyMassKg: 70, externalLoadKg: 10, elbowFlexionDeg: 90, kneeFlexionDeg: 15, trunkFlexionDeg: 0 })
const stooped = solveInverseDynamics({ bodyMassKg: 70, externalLoadKg: 10, elbowFlexionDeg: 90, kneeFlexionDeg: 90, trunkFlexionDeg: 60 })
assert.ok(stooped.l4l5CompressionN > upright.l4l5CompressionN * 5, '60 deg stooped lift amplifies L4-L5 compression > 5x')
assert.ok(stooped.patellofemoralBw > upright.patellofemoralBw * 2, '90 deg squat amplifies patellofemoral load > 2x')
const heavyStoop = solveInverseDynamics({ bodyMassKg: 90, externalLoadKg: 25, elbowFlexionDeg: 90, kneeFlexionDeg: 90, trunkFlexionDeg: 65 })
assert.equal(heavyStoop.l4l5LoadBand, 'ELEVATED_NIOSH_LIMIT')

// 4. UI guards (dark marker, lazy mount behind Fold+WhenOpened, desktop unobstructed StageFrame dock)
const panel = readFileSync('src/pages/bodyhub/Temporal4DAndInverseDynamicsPanel.tsx', 'utf8')
assert.match(panel, /className="dark space-y-3/)
const wb = readFileSync('src/pages/bodyhub/WholeBodyPhysiologyWorkbench.tsx', 'utf8')
assert.match(wb, /lazy\(\(\) => import\('\.\/Temporal4DAndInverseDynamicsPanel'\)\)/)
const bm = readFileSync('src/pages/bodyhub/BiomechanicsMotionLab.tsx', 'utf8')
assert.match(bm, /lazy\(\(\) => import\('\.\/Temporal4DAndInverseDynamicsPanel'\)\)/)
const sf = readFileSync('src/domains/body-exposure/ui/atlas-stage/StageFrame.tsx', 'utf8')
assert.match(sf, /width:\s*232/)

console.log('temporal-4d-inverse-dynamics: PASS (24h circadian, 0-100y lifespan, Newtonian L4-L5/elbow/knee, unobstructed desktop 3D stage)')
