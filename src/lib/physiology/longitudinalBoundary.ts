import type { LongitudinalEvent, SemanticState } from '../panaceaLongitudinalState.ts'
import type { BoundaryCondition, BoundaryTruthClass } from './runtime.ts'

const ADMISSIBLE_STATES = new Set<SemanticState>(['measured', 'imported', 'clinician-entered'])

export function boundaryConditionFromLongitudinalEvent(
  event: LongitudinalEvent,
  options: { name?: string; sigma?: number | null } = {},
): BoundaryCondition {
  if (!event.semanticState || !ADMISSIBLE_STATES.has(event.semanticState)) {
    throw new Error(`longitudinal event ${event.id}: semantic state ${String(event.semanticState)} is not admissible as a physiological boundary condition`)
  }
  if (typeof event.value !== 'number' || !Number.isFinite(event.value)) {
    throw new Error(`longitudinal event ${event.id}: physiological boundary value must be numeric and finite`)
  }
  if (!event.unit?.trim()) throw new Error(`longitudinal event ${event.id}: physiological boundary unit is required`)
  const sigma = options.sigma ?? null
  if (sigma !== null && (!Number.isFinite(sigma) || sigma < 0)) {
    throw new Error(`longitudinal event ${event.id}: sigma must be null or a non-negative finite number`)
  }
  const name = (options.name ?? event.metric).trim()
  if (!name) throw new Error(`longitudinal event ${event.id}: physiological boundary name is required`)
  if (typeof event.subjectId !== 'string' || !event.subjectId.trim()) {
    throw new Error(`longitudinal event ${event.id}: subjectId is required for a patient-derived physiological boundary`)
  }
  const subjectId = event.subjectId.trim()

  return {
    name,
    unit: event.unit.trim(),
    value: event.value,
    sigma,
    truthClass: event.semanticState as BoundaryTruthClass,
    source: {
      id: event.id,
      subjectId,
      sourceId: event.provenance.sourceId,
      capturedAt: event.provenance.capturedAt,
      semanticState: event.semanticState as BoundaryTruthClass,
    },
  }
}
