import {
  canEnterAiContext,
  canEnterClinicalRecord,
  consentPurposeForSurface,
  isConsentActive,
  projectStateToSurface,
  type ConsentPurpose,
  type LongitudinalEvent,
  type LongitudinalPatientState,
  type PanaceaSurface,
  type SurfaceProjection,
} from './panaceaLongitudinalState.ts'
import {
  filterStateByPurposeConsent,
  isEventPurposeAuthorized,
  type PurposeConsentLedger,
} from './purposeConsentLedger.ts'
import type {
  PhysiologicalProvenance,
  PhysiologicalSimulationResult,
  PhysiologicalValue,
} from './physiology/runtime.ts'

export type HumanStateTruthLane = 'observed' | 'estimated' | 'simulated'
export type HumanStateBlockReason = 'missing-lineage' | 'unauthorized-lineage' | 'not-yet-effective' | 'surface-policy'

export interface HumanStatePhysiologyField {
  name: string
  unit: string
  value: number
  sigma: number | null
  truthClass: PhysiologicalValue['truthClass']
  lane: HumanStateTruthLane
  provenanceId: string
  sourceEventIds: readonly string[]
  engineId?: string
  modelId?: string
  modelVersion?: string
  parameterSetId?: string
  validationClass?: PhysiologicalProvenance['validationClass']
  fidelity?: PhysiologicalProvenance['fidelity']
}

export interface HumanStateBlockedField {
  name: string
  provenanceId: string
  reason: HumanStateBlockReason
  sourceEventIds: readonly string[]
}

export interface HumanStateProjection {
  subjectId: string
  surface: PanaceaSurface
  generatedAt: string
  canonical: SurfaceProjection
  physiology: {
    observed: readonly HumanStatePhysiologyField[]
    estimated: readonly HumanStatePhysiologyField[]
    simulated: readonly HumanStatePhysiologyField[]
    blocked: readonly HumanStateBlockedField[]
  }
  invariants: {
    oneCanonicalRecordedState: true
    observedEstimatedSimulatedSeparated: true
    consentScopedProjection: true
    counterfactualMayMutateCurrentState: false
    autonomousClinicalCommitAllowed: false
  }
}

interface BoundaryLineage {
  sourceEventIds: Set<string>
  missing: boolean
}

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function laneFor(value: PhysiologicalValue): HumanStateTruthLane {
  if (value.truthClass === 'model-derived') return 'estimated'
  if (value.truthClass === 'simulated') return 'simulated'
  return 'observed'
}

function lineageFor(
  provenanceId: string,
  byId: ReadonlyMap<string, PhysiologicalProvenance>,
  seen = new Set<string>(),
): BoundaryLineage {
  if (seen.has(provenanceId)) return { sourceEventIds: new Set(), missing: true }
  const provenance = byId.get(provenanceId)
  if (!provenance) return { sourceEventIds: new Set(), missing: true }

  if (provenance.kind === 'boundary') {
    return provenance.sourceEventId
      ? { sourceEventIds: new Set([provenance.sourceEventId]), missing: false }
      : { sourceEventIds: new Set(), missing: true }
  }

  if (!provenance.parents.length) return { sourceEventIds: new Set(), missing: true }

  const nextSeen = new Set(seen)
  nextSeen.add(provenanceId)
  const sourceEventIds = new Set<string>()
  let missing = false
  for (const parentId of provenance.parents) {
    const parent = lineageFor(parentId, byId, nextSeen)
    missing ||= parent.missing
    for (const sourceEventId of parent.sourceEventIds) sourceEventIds.add(sourceEventId)
  }
  return { sourceEventIds, missing }
}

function eventSurfacePolicyAllows(
  event: LongitudinalEvent,
  surface: PanaceaSurface,
  purpose: ConsentPurpose,
  atMs: number,
  consentLedger?: PurposeConsentLedger,
): 'allowed' | 'unauthorized-lineage' | 'not-yet-effective' | 'surface-policy' {
  if (Date.parse(event.recordedAt) > atMs) return 'not-yet-effective'
  if (!isConsentActive(event.consent, purpose, atMs)) return 'unauthorized-lineage'
  if (consentLedger && !isEventPurposeAuthorized(event, consentLedger, purpose, atMs)) return 'unauthorized-lineage'
  if ((surface === 'clinical' || surface === 'ai-emr') && !canEnterClinicalRecord(event, atMs)) return 'surface-policy'
  if (surface === 'ai-chatbot' && !canEnterAiContext(event, atMs)) return 'surface-policy'
  return 'allowed'
}

function physiologyField(value: PhysiologicalValue, sourceEventIds: readonly string[]): HumanStatePhysiologyField {
  return {
    name: value.name,
    unit: value.unit,
    value: value.value,
    sigma: value.sigma,
    truthClass: value.truthClass,
    lane: laneFor(value),
    provenanceId: value.provenance.id,
    sourceEventIds,
    engineId: value.provenance.engineId,
    modelId: value.provenance.modelId,
    modelVersion: value.provenance.modelVersion,
    parameterSetId: value.provenance.parameterSetId,
    validationClass: value.provenance.validationClass,
    fidelity: value.provenance.fidelity,
  }
}

/**
 * Builds one permission-scoped view of the same human state.
 *
 * Recorded observations remain in Canonical Patient State. Physiological values
 * remain explicitly observed/model-estimated/simulated and are admitted only
 * when every patient-derived boundary can be traced to an authorized source
 * event for the requested surface. Missing lineage and future-effective
 * source events fail closed.
 *
 * Invariant:
 *   Observed != Estimated != Simulated
 */
export function projectHumanState(input: {
  state: LongitudinalPatientState
  surface: PanaceaSurface
  physiology: PhysiologicalSimulationResult
  at?: string
  consentLedger?: PurposeConsentLedger
}): HumanStateProjection {
  const at = input.at ?? new Date().toISOString()
  const atMs = parseIso(at, 'at')
  const purpose = consentPurposeForSurface(input.surface)

  const consentScopedState = input.consentLedger
    ? filterStateByPurposeConsent(input.state, input.consentLedger, purpose, at)
    : input.state
  const canonical = projectStateToSurface(consentScopedState, input.surface, at)

  const provenanceById = new Map(input.physiology.provenance.map((entry) => [entry.id, entry]))
  const observed: HumanStatePhysiologyField[] = []
  const estimated: HumanStatePhysiologyField[] = []
  const simulated: HumanStatePhysiologyField[] = []
  const blocked: HumanStateBlockedField[] = []

  for (const name of Object.keys(input.physiology.latest).sort()) {
    const value = input.physiology.latest[name]
    const lineage = lineageFor(value.provenance.id, provenanceById)
    const sourceEventIds = [...lineage.sourceEventIds].sort()

    let reason: HumanStateBlockReason | null = lineage.missing || sourceEventIds.length === 0
      ? 'missing-lineage'
      : null

    if (!reason) {
      for (const sourceEventId of sourceEventIds) {
        const sourceEvent = input.state.eventsById[sourceEventId]
        if (!sourceEvent || sourceEvent.subjectId !== input.state.subjectId) {
          reason = 'missing-lineage'
          break
        }
        const decision = eventSurfacePolicyAllows(
          sourceEvent,
          input.surface,
          purpose,
          atMs,
          input.consentLedger,
        )
        if (decision !== 'allowed') {
          reason = decision
          break
        }
      }
    }

    if (reason) {
      blocked.push({ name: value.name, provenanceId: value.provenance.id, reason, sourceEventIds })
      continue
    }

    const field = physiologyField(value, sourceEventIds)
    if (field.lane === 'observed') observed.push(field)
    else if (field.lane === 'estimated') estimated.push(field)
    else simulated.push(field)
  }

  return {
    subjectId: input.state.subjectId,
    surface: input.surface,
    generatedAt: at,
    canonical,
    physiology: { observed, estimated, simulated, blocked },
    invariants: {
      oneCanonicalRecordedState: true,
      observedEstimatedSimulatedSeparated: true,
      consentScopedProjection: true,
      counterfactualMayMutateCurrentState: false,
      autonomousClinicalCommitAllowed: false,
    },
  }
}
