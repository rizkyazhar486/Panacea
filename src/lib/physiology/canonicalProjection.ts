import { isConsentActive, validateLongitudinalEvent, type LongitudinalEvent, type LongitudinalPatientState } from '../panaceaLongitudinalState.ts'
import { boundaryConditionFromLongitudinalEvent } from './longitudinalBoundary.ts'
import { createDomainEngineRegistry, runPhysiologicalSimulation, type DomainEngineContract } from './runtime.ts'
import { recordRealityPrediction, type RealityErrorLedger, type RealityPredictionRecord } from './realityErrorLedger.ts'

export interface CanonicalBoundaryField {
  name: string
  unit: string
  /** Exact canonical metric names accepted for this boundary. */
  metrics: readonly string[]
}

export interface CanonicalProjectionRequest {
  state: LongitudinalPatientState
  ledger: RealityErrorLedger
  asOf: string
  /** Caller-selected freshness/coherence policy, not an invented clinical default. */
  maxAgeMs: number
  maxSkewMs: number
  predictionId: string
}

export interface CanonicalProjectionSpec {
  fields: readonly CanonicalBoundaryField[]
  engines: readonly DomainEngineContract<any>[]
  /** The runtime output recorded as a Reality Error prediction. */
  outputField: string
}

/**
 * Read-only personal-visualization projection through the shared runtime.
 * Algebraic identities estimate the contemporaneous state; they do not forecast
 * a future patient's trajectory. The ledger target is therefore exactly asOf.
 */
export function runCanonicalProjection(input: CanonicalProjectionRequest, spec: CanonicalProjectionSpec) {
  const at = Date.parse(input.asOf)
  if (!Number.isFinite(at)) throw new Error('asOf must be a valid timestamp')
  for (const key of ['maxAgeMs', 'maxSkewMs'] as const) {
    if (!Number.isFinite(input[key]) || input[key] < 0) throw new Error(`${key} must be finite and non-negative`)
  }
  if (!input.state.subjectId.trim() || input.ledger.subjectId !== input.state.subjectId) throw new Error('canonical and ledger subject must match')
  if (!Number.isSafeInteger(input.state.revision) || input.state.revision < 0) throw new Error('invalid canonical revision')
  const events = Object.values(input.state.eventsById)
  const selected = spec.fields.map(field => {
    const candidates: LongitudinalEvent<number>[] = []
    for (const event of events) {
      try {
        if (event.subjectId !== input.state.subjectId || !field.metrics.includes(event.metric)) continue
        validateLongitudinalEvent(event)
        if (event.unit !== field.unit || event.provenance.sourceKind === 'derived' || event.review.state === 'rejected') continue
        if (!isConsentActive(event.consent, 'personal-visualization', at)) continue
        const times = [event.recordedAt, event.provenance.capturedAt, event.provenance.receivedAt].map(Date.parse)
        if (times.some(time => !Number.isFinite(time) || time > at || at - time > input.maxAgeMs)) continue
        // This boundary rejects patient reports, AI drafts and simulated values;
        // confidence is deliberately not converted into an invented sigma.
        boundaryConditionFromLongitudinalEvent(event, { name: field.name })
        candidates.push(event as LongitudinalEvent<number>)
      } catch {
        // A malformed candidate cannot supply a boundary. Missing fields below
        // fail closed before either the runtime or ledger is invoked.
      }
    }
    candidates.sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt) || a.id.localeCompare(b.id))
    const event = candidates[0]
    if (!event) throw new Error(`missing admissible observed input: ${field.name}`)
    if (candidates.some(other => Date.parse(other.recordedAt) === Date.parse(event.recordedAt) && other.value !== event.value)) {
      throw new Error(`ambiguous simultaneous observations: ${field.name}`)
    }
    return { field, event }
  })
  const observationTimes = selected.flatMap(({ event }) => [Date.parse(event.recordedAt), Date.parse(event.provenance.capturedAt)])
  if (Math.max(...observationTimes) - Math.min(...observationTimes) > input.maxSkewMs) throw new Error('observed inputs exceed maxSkewMs')

  const boundaryConditions = selected.map(({ field, event }) => boundaryConditionFromLongitudinalEvent(event, { name: field.name }))
  const registry = createDomainEngineRegistry(spec.engines, spec.fields.map(({ name, unit }) => ({ name, unit })))
  const simulation = runPhysiologicalSimulation({ registry, boundaryConditions, untilSeconds: 0 })
  const output = simulation.latest[spec.outputField]
  const p = output.provenance
  if (output.truthClass !== 'model-derived' || !p.engineId || !p.modelId || !p.modelVersion || !p.parameterSetId || !p.validationClass || !p.fidelity) {
    throw new Error(`${spec.outputField} requires traceable model-derived output`)
  }
  const prediction: RealityPredictionRecord = {
    id: input.predictionId, subjectId: input.state.subjectId, field: output.name, unit: output.unit,
    predictedValue: output.value, predictedSigma: output.sigma,
    createdAt: input.asOf, targetAt: input.asOf, predictionClass: 'prospective',
    provenance: {
      provenanceId: p.id, engineId: p.engineId, modelId: p.modelId, modelVersion: p.modelVersion,
      parameterSetId: p.parameterSetId, validationClass: p.validationClass, fidelity: p.fidelity,
      parentProvenanceIds: [...p.parents],
    },
  }
  const recorded = recordRealityPrediction(input.ledger, prediction)
  return {
    subjectId: input.state.subjectId, canonicalRevision: input.state.revision, asOf: input.asOf,
    simulation, prediction, ledger: recorded.ledger, predictionStatus: recorded.status,
    // The runtime DAG keeps boundary hashes; this receipt preserves the exact
    // canonical event, units, consent and all timestamps behind each root.
    lineage: selected.map(({ field, event }) => ({ boundaryProvenanceId: simulation.boundaries[field.name].provenance.id, event: structuredClone(event) })),
  }
}
