import assert from 'node:assert/strict'
import { ALL_SURGICAL_PROCEDURES } from '../../src/lib/surgicalAtlasCatalog.ts'
import {
  applyUniversalOperationAction,
  createUniversalOperationSimulation,
  operationSimulationCompletion,
  UNIVERSAL_OPERATION_SIMULATION_BOUNDARY,
} from '../../src/lib/universalOperationSimulator.ts'
import {
  GLOBAL_GENERIC_OPERATION_PROCEDURES,
  GLOBAL_OPERATION_FAMILIES,
  getGlobalOperationUniverseStats,
} from '../../src/lib/globalOperationUniverse.ts'

const procedure = ALL_SURGICAL_PROCEDURES.find((item) => item.id === 'aneurysm-clipping') ?? ALL_SURGICAL_PROCEDURES[0]
assert.ok(procedure)

const initial = createUniversalOperationSimulation(procedure)
assert.equal(initial.phaseIndex, 0)
assert.equal(initial.bleeding, 'none')
assert.equal(initial.syntheticMonitor.severity, 'stable')

const oriented = applyUniversalOperationAction(initial, 'orient-field', procedure)
assert.ok(oriented.fieldClarity > initial.fieldClarity)

const risks = applyUniversalOperationAction(oriented, 'identify-risk', procedure)
assert.ok(risks.riskAwareness > oriented.riskAwareness)

const complication = applyUniversalOperationAction(risks, 'inject-complication', procedure)
assert.ok(complication.complication)
assert.notEqual(complication.bleeding, 'none')
assert.notEqual(complication.syntheticMonitor.severity, 'stable')

const recovered = applyUniversalOperationAction(complication, 'stabilize-scenario', procedure)
assert.ok(recovered.fieldClarity > complication.fieldClarity)

const reviewed = applyUniversalOperationAction(recovered, 'safety-review', procedure)
assert.equal(reviewed.hemostasisReviewed, true)
assert.ok(operationSimulationCompletion(reviewed, procedure) >= 0)

assert.equal(UNIVERSAL_OPERATION_SIMULATION_BOUNDARY.patientSpecificNavigation, false)
assert.equal(UNIVERSAL_OPERATION_SIMULATION_BOUNDARY.incisionCoordinates, false)
assert.equal(UNIVERSAL_OPERATION_SIMULATION_BOUNDARY.drillTrajectory, false)
assert.equal(UNIVERSAL_OPERATION_SIMULATION_BOUNDARY.implantSizing, false)
assert.equal(UNIVERSAL_OPERATION_SIMULATION_BOUNDARY.energySettings, false)
assert.equal(UNIVERSAL_OPERATION_SIMULATION_BOUNDARY.medicationDosing, false)

const stats = getGlobalOperationUniverseStats(ALL_SURGICAL_PROCEDURES)
assert.ok(GLOBAL_OPERATION_FAMILIES.length >= 20)
assert.ok(stats.representativeProcedures >= 100)
assert.equal(stats.detailedProcedures, ALL_SURGICAL_PROCEDURES.length)
assert.ok(stats.unresolvedDomains.includes('ophthalmology'))
assert.ok(stats.unresolvedDomains.includes('transplant'))

console.log('universal operation simulator: OK')


assert.equal(GLOBAL_GENERIC_OPERATION_PROCEDURES.length, stats.representativeProcedures)
const genericProcedure = GLOBAL_GENERIC_OPERATION_PROCEDURES.find((item) => item.domain === 'ophthalmology')
assert.ok(genericProcedure)
const genericState = createUniversalOperationSimulation(genericProcedure)
const genericEvent = applyUniversalOperationAction(genericState, 'inject-complication', genericProcedure)
assert.ok(genericEvent.complication)
assert.equal(genericProcedure.evidenceLevel, 'generic-reference-simulation')
