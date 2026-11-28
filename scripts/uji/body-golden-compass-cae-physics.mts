import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BIOMEDICAL_PHYSICS_CAE_CONTRACT,
  SURGICAL_100_LEVEL_CURRICULUM,
  evaluateEducationalSkillTelemetry,
  solveFickDiffusion,
  solveLinearElasticTissue,
  solvePoiseuilleStenosis,
  verifyRk4ConvergenceBenchmark,
} from '../../src/domains/body-exposure/engine/biomedicalPhysicsCaeCurriculumEngine.ts'

// 1. Hagen–Poiseuille exact r^4 stenosis physics: halving radius increases resistance 16x and cuts flow to 6.25%
const baseFlow = solvePoiseuilleStenosis({ radiusMm: 2.0, lengthMm: 25, deltaPMmHg: 40 })
const halfRadius = solvePoiseuilleStenosis({ radiusMm: 1.0, lengthMm: 25, deltaPMmHg: 40 })
assert.ok(Math.abs(halfRadius.resistancePaSPerM3 / baseFlow.resistancePaSPerM3 - 16) < 1e-6)
assert.ok(Math.abs(baseFlow.flowMlPerMin / halfRadius.flowMlPerMin - 16) < 0.05)

// 2. Fick diffusion exact 1/dx law: 5x thicker barrier (0.5 -> 2.5 um) drops flux by 5x
const thin = solveFickDiffusion({ surfaceAreaM2: 70, deltaCMolPerM3: 0.12, thicknessUm: 0.5 })
const thick = solveFickDiffusion({ surfaceAreaM2: 70, deltaCMolPerM3: 0.12, thicknessUm: 2.5 })
assert.ok(Math.abs(thin.fluxMmolPerMin / thick.fluxMmolPerMin - 5) < 0.05)
assert.equal(thin.barrierStatus, 'HEALTHY_THIN')
assert.equal(thick.barrierStatus, 'THICKENED_IMPAIRED')

// 3. Linear elastic bone stress/strain & safety factor
const bone = solveLinearElasticTissue({ forceN: 2250, crossSectionMm2: 450, youngsModulusGPa: 17 })
assert.equal(bone.stressMPa, 5)
assert.equal(bone.regime, 'ELASTIC_SAFE')
const yieldBone = solveLinearElasticTissue({ forceN: 70000, crossSectionMm2: 450, youngsModulusGPa: 17 })
assert.equal(yieldBone.regime, 'YIELD_EXCEEDED')

// 4. RK4 O(dt^4) convergence ratio ~16x when halving step size
const rk4 = verifyRk4ConvergenceBenchmark(0.25, 4.0, 0.2)
assert.ok(rk4.errFine < rk4.errCoarse)
assert.ok(rk4.convergenceRatio >= 14 && rk4.convergenceRatio <= 18, `expected ~16x RK4 convergence, got ${rk4.convergenceRatio}`)

// 5. 10-Band / 100-Level Curriculum uniqueness & non-certification guard
assert.equal(BIOMEDICAL_PHYSICS_CAE_CONTRACT.clinicalCertification, false)
assert.equal(SURGICAL_100_LEVEL_CURRICULUM.length, 10)
assert.equal(SURGICAL_100_LEVEL_CURRICULUM[0].levelRange[0], 1)
assert.equal(SURGICAL_100_LEVEL_CURRICULUM[9].levelRange[1], 100)
const evalPass = evaluateEducationalSkillTelemetry({ bandIndex: 6, targetAccuracyPct: 92, motionEconomy01: 0.9, collisionCount: 1, workspaceViolations: 0, forceLimitViolations: 0 })
assert.equal(evalPass.passedBand, true)
assert.equal(evalPass.clinicalCertification, false)
const evalFail = evaluateEducationalSkillTelemetry({ bandIndex: 6, targetAccuracyPct: 92, motionEconomy01: 0.9, collisionCount: 1, workspaceViolations: 0, forceLimitViolations: 1 })
assert.equal(evalFail.passedBand, false)

// 6. Explicit dark markers & lazy RealityViewCockpit mount
const panel = readFileSync('src/components/reality-view/BodyScienceCaeCompassPanel.tsx', 'utf8')
assert.match(panel, /dark space-y-3/)
const cockpit = readFileSync('src/components/reality-view/RealityViewCockpit.tsx', 'utf8')
assert.match(cockpit, /data-rv-compass-cae-toggle/)

console.log('body-golden-compass-cae-physics: Poiseuille r^4 (16x), Fick 1/dx (5x), Bone elastic SF, RK4 O(dt^4) convergence & 100-level curriculum PASS')
