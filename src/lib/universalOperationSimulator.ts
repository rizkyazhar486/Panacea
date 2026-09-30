export type OperationSimulationSeverity = 'stable' | 'watch' | 'urgent'
export type OperationBleedingState = 'none' | 'limited' | 'significant' | 'critical'
export type OperationScenarioKind = 'baseline' | 'bleeding' | 'anatomy-risk' | 'visibility-loss'

export interface OperationSimulationProcedure {
  id: string
  complications: string[]
  phases: Array<{
    title: string
    objective: string
    structuresAtRisk: string[]
  }>
}

export type OperationSimulationAction =
  | 'orient-field'
  | 'identify-risk'
  | 'safety-review'
  | 'inject-complication'
  | 'stabilize-scenario'
  | 'advance-phase'
  | 'reset'

export interface SyntheticMonitorState {
  heartRate: number
  spo2: number
  map: number
  severity: OperationSimulationSeverity
}

export interface UniversalOperationSimulationState {
  procedureId: string
  phaseIndex: number
  scenario: OperationScenarioKind
  fieldClarity: number
  riskAwareness: number
  hemostasisReviewed: boolean
  bleeding: OperationBleedingState
  complication?: string
  syntheticMonitor: SyntheticMonitorState
  completedActions: OperationSimulationAction[]
  eventLog: string[]
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)))

function monitorFor(
  scenario: OperationScenarioKind,
  bleeding: OperationBleedingState,
  clarity: number,
): SyntheticMonitorState {
  if (bleeding === 'critical') return { heartRate: 112, spo2: 94, map: 58, severity: 'urgent' }
  if (bleeding === 'significant') return { heartRate: 96, spo2: 97, map: 68, severity: 'watch' }
  if (bleeding === 'limited' || scenario === 'bleeding') return { heartRate: 84, spo2: 98, map: 78, severity: 'watch' }
  if (scenario === 'visibility-loss' || clarity < 40) return { heartRate: 88, spo2: 98, map: 76, severity: 'watch' }
  return { heartRate: 72, spo2: 99, map: 84, severity: 'stable' }
}

function nextBleeding(value: OperationBleedingState): OperationBleedingState {
  if (value === 'none') return 'limited'
  if (value === 'limited') return 'significant'
  if (value === 'significant') return 'critical'
  return 'critical'
}

function previousBleeding(value: OperationBleedingState): OperationBleedingState {
  if (value === 'critical') return 'significant'
  if (value === 'significant') return 'limited'
  if (value === 'limited') return 'none'
  return 'none'
}

export function createUniversalOperationSimulation(
  procedure: OperationSimulationProcedure,
): UniversalOperationSimulationState {
  return {
    procedureId: procedure.id,
    phaseIndex: 0,
    scenario: 'baseline',
    fieldClarity: 62,
    riskAwareness: 20,
    hemostasisReviewed: false,
    bleeding: 'none',
    syntheticMonitor: monitorFor('baseline', 'none', 62),
    completedActions: [],
    eventLog: ['Simulation initialized in reference-education mode.'],
  }
}

function deterministicComplication(procedure: OperationSimulationProcedure, phaseIndex: number): string {
  const list = procedure.complications.length ? procedure.complications : ['Unspecified procedural complication']
  const seed = [...procedure.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) + phaseIndex
  return list[seed % list.length]
}

export function applyUniversalOperationAction(
  state: UniversalOperationSimulationState,
  action: OperationSimulationAction,
  procedure: OperationSimulationProcedure,
): UniversalOperationSimulationState {
  if (action === 'reset') return createUniversalOperationSimulation(procedure)

  let next: UniversalOperationSimulationState = {
    ...state,
    completedActions: [...state.completedActions, action].slice(-50),
    eventLog: [...state.eventLog].slice(-24),
  }

  if (action === 'orient-field') {
    next.fieldClarity = clamp(state.fieldClarity + 18)
    next.eventLog.push('Reference field orientation reviewed.')
  }

  if (action === 'identify-risk') {
    const listed = procedure.phases[state.phaseIndex]?.structuresAtRisk.length ?? 0
    next.riskAwareness = clamp(state.riskAwareness + Math.max(12, listed * 6))
    next.eventLog.push('Structures-at-risk map reviewed in the current phase.')
  }

  if (action === 'safety-review') {
    next.hemostasisReviewed = true
    next.fieldClarity = clamp(state.fieldClarity + 8)
    next.bleeding = previousBleeding(state.bleeding)
    next.scenario = next.bleeding === 'none' ? 'baseline' : state.scenario
    next.eventLog.push('Abstract hemostasis and final-safety review completed; no technique or device setting is prescribed.')
  }

  if (action === 'inject-complication') {
    next.complication = deterministicComplication(procedure, state.phaseIndex)
    next.scenario = state.phaseIndex % 2 ? 'anatomy-risk' : 'bleeding'
    next.bleeding = nextBleeding(state.bleeding)
    next.fieldClarity = clamp(state.fieldClarity - 24)
    next.riskAwareness = clamp(state.riskAwareness + 10)
    next.hemostasisReviewed = false
    next.eventLog.push('Training complication injected: ' + next.complication + '.')
  }

  if (action === 'stabilize-scenario') {
    next.bleeding = previousBleeding(state.bleeding)
    next.fieldClarity = clamp(state.fieldClarity + 14)
    next.riskAwareness = clamp(state.riskAwareness + 6)
    if (next.bleeding === 'none') {
      next.scenario = 'baseline'
      next.complication = undefined
    }
    next.eventLog.push('Scenario state improved through an abstract safety response; no clinical treatment instruction is generated.')
  }

  if (action === 'advance-phase') {
    const max = Math.max(0, procedure.phases.length - 1)
    next.phaseIndex = Math.min(max, state.phaseIndex + 1)
    next.scenario = 'baseline'
    next.bleeding = 'none'
    next.complication = undefined
    next.hemostasisReviewed = false
    next.fieldClarity = Math.max(52, state.fieldClarity)
    next.eventLog.push('Advanced to educational phase ' + (next.phaseIndex + 1) + '.')
  }

  next.syntheticMonitor = monitorFor(next.scenario, next.bleeding, next.fieldClarity)
  return next
}

export function operationSimulationCompletion(
  state: UniversalOperationSimulationState,
  procedure: OperationSimulationProcedure,
) {
  const phaseBase = procedure.phases.length
    ? ((state.phaseIndex + 1) / procedure.phases.length) * 70
    : 0
  const safety = (state.riskAwareness >= 60 ? 15 : 0) + (state.hemostasisReviewed ? 15 : 0)
  return clamp(phaseBase + safety)
}

export const UNIVERSAL_OPERATION_SIMULATION_BOUNDARY = {
  educationalOnly: true,
  patientSpecificNavigation: false,
  incisionCoordinates: false,
  drillTrajectory: false,
  implantSizing: false,
  energySettings: false,
  medicationDosing: false,
  autonomousClinicalDecision: false,
} as const
