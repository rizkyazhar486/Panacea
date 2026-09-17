import assert from 'node:assert/strict'
import {
  SURGICAL_SIMULATION_TARGETS,
  auditSurgicalSimulatorCoverage,
} from '../../src/lib/surgicalSimulatorCoverage.ts'

assert.equal(SURGICAL_SIMULATION_TARGETS.length, 18)
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'general-surgery'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'digestive-surgery'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'cardiovascular-surgery'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'thoracic-surgery'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'pediatric-surgery'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'urology'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'plastic-reconstructive'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'orthopedic'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'neurosurgery'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'ent-head-neck'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'ophthalmology'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'spine-surgery'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'hand-surgery'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'trauma-surgery'))
assert.ok(SURGICAL_SIMULATION_TARGETS.some((target) => target.domain === 'laparoscopic-surgery'))

const audit = auditSurgicalSimulatorCoverage()
assert.equal(audit.targetDomainCount, 18)
assert.ok(audit.coveredDomainCount >= 1)
assert.ok(audit.breadthCoverageFraction > 0 && audit.breadthCoverageFraction <= 1)
assert.ok(audit.backlog.every((item) => item.preserveExistingModules))
assert.ok(audit.backlog.every((item) => item.requiresQualifiedReviewBeforeClinicalTrainingClaim))
assert.equal(audit.boundary.educationalSimulationOnly, true)
assert.equal(audit.boundary.patientSpecificPlanningAllowed, false)
assert.equal(audit.boundary.autonomousProcedureGuidanceAllowed, false)
assert.equal(audit.boundary.competenceCertificationClaimAllowed, false)

console.log('Surgical simulator coverage verified: 18 target domains, breadth audit against existing atlas modules, non-destructive backlog, and explicit educational/non-autonomous boundaries.')
