// Provenance and truth-class matrix for Body Exposure anatomy & physiology.
// Pure module: no I/O, no clock, no randomness. Every unmodeled layer or
// patient-specific slot stays explicitly marked "VERTICAL GAP - NOT YET MODELED".

import type { BodySystemId } from '../../data/bodySystems.ts'
import type { SystemPhysiologyCatalog } from './systemPhysiology.ts'

export type TruthClass = 'measured' | 'reference' | 'simulated' | 'derived'

export const ALLOWED_TRUTH_CLASSES: ReadonlySet<TruthClass> = new Set([
  'measured',
  'reference',
  'simulated',
  'derived',
])

export const VERTICAL_GAP_MARKER = 'VERTICAL GAP - NOT YET MODELED' as const

export interface ProvenanceSlot {
  readonly modeled: boolean
  readonly truthClass: TruthClass | null
  readonly status: 'provenance-backed' | typeof VERTICAL_GAP_MARKER
  readonly detail: string
}

export interface UnmodeledOrganGap {
  readonly id: string
  readonly subject: string
  readonly marker: typeof VERTICAL_GAP_MARKER
  readonly detail: string
}

export interface SystemProvenanceRecord {
  readonly systemId: BodySystemId
  readonly label: string
  readonly anatomy: ProvenanceSlot
  readonly physiology: ProvenanceSlot
  readonly simulation: ProvenanceSlot
  readonly personalTelemetry: ProvenanceSlot
  readonly patientSpecificMorphology: typeof VERTICAL_GAP_MARKER
  readonly citationIds: readonly string[]
  readonly unmodeledOrgans: readonly UnmodeledOrganGap[]
  readonly clinicallyReviewed: false
}

export interface BuildProvenanceOptions {
  /** Atlas systems that currently have a runnable mechanistic simulation wired on the stage. */
  readonly simulatedSystems?: ReadonlySet<BodySystemId>
  /** Explicit caller-supplied personal telemetry classes (never invented when absent). */
  readonly personalTruthBySystem?: ReadonlyMap<BodySystemId, 'measured' | 'derived'>
}

export function buildSystemProvenanceMatrix(
  catalog: SystemPhysiologyCatalog,
  options: BuildProvenanceOptions = {},
): readonly SystemProvenanceRecord[] {
  const simulatedSystems = options.simulatedSystems ?? new Set<BodySystemId>()
  const personalTruthBySystem = options.personalTruthBySystem ?? new Map<BodySystemId, 'measured' | 'derived'>()

  return catalog.systems.map((system) => {
    const mechanisms = catalog.mechanisms.filter((m) => m.systems.includes(system.id))
    const citationIds = [...new Set(mechanisms.flatMap((m) => m.citations.map((c) => c.id)))]
    const gaps = catalog.gaps.filter((g) => g.system === system.id)
    const hasSimulation = simulatedSystems.has(system.id)
    const personalTruth = personalTruthBySystem.get(system.id) ?? null

    return {
      systemId: system.id,
      label: system.label,
      anatomy: {
        modeled: true,
        truthClass: 'reference',
        status: 'provenance-backed',
        detail: 'Generic reference atlas target hints; not patient-specific geometry.',
      },
      physiology: mechanisms.length > 0
        ? {
            modeled: true,
            truthClass: 'reference',
            status: 'provenance-backed',
            detail: `${mechanisms.length} ledger-verified teaching mechanism(s) across ${citationIds.length} citation(s).`,
          }
        : {
            modeled: false,
            truthClass: null,
            status: VERTICAL_GAP_MARKER,
            detail: `${VERTICAL_GAP_MARKER}: no sourced physiology mechanism in atlas catalog.`,
          },
      simulation: hasSimulation
        ? {
            modeled: true,
            truthClass: 'simulated',
            status: 'provenance-backed',
            detail: 'Deterministic reference physiological simulation model; not patient measurement.',
          }
        : {
            modeled: false,
            truthClass: null,
            status: VERTICAL_GAP_MARKER,
            detail: `${VERTICAL_GAP_MARKER}: no validated mechanistic stage simulation for this system yet.`,
          },
      personalTelemetry: personalTruth
        ? {
            modeled: true,
            truthClass: personalTruth,
            status: 'provenance-backed',
            detail: `Caller-supplied ${personalTruth} patient signal from canonical health state.`,
          }
        : {
            modeled: false,
            truthClass: null,
            status: VERTICAL_GAP_MARKER,
            detail: `${VERTICAL_GAP_MARKER}: no measured or derived personal telemetry attached.`,
          },
      patientSpecificMorphology: VERTICAL_GAP_MARKER,
      citationIds,
      unmodeledOrgans: gaps.map((gap) => ({
        id: gap.id,
        subject: gap.subject,
        marker: VERTICAL_GAP_MARKER,
        detail: `${VERTICAL_GAP_MARKER}: ${gap.boundary}`,
      })),
      clinicallyReviewed: false,
    }
  })
}

/** Fail-closed audit over a candidate provenance matrix against verified ledger citation ids. */
export function auditSystemProvenanceMatrix(
  matrix: readonly SystemProvenanceRecord[],
  verifiedCitationIds: ReadonlySet<string>,
  expectedSystemIds: readonly BodySystemId[],
): string[] {
  const problems: string[] = []
  if (verifiedCitationIds.size === 0) problems.push('verified citation ledger is empty')
  if (matrix.length === 0) problems.push('provenance matrix is empty')

  const seen = new Set<string>()
  for (const row of matrix) {
    if (seen.has(row.systemId)) problems.push(`${row.systemId}: duplicate system record`)
    seen.add(row.systemId)

    if (row.clinicallyReviewed !== false) {
      problems.push(`${row.systemId}: fabricated clinical review flag`)
    }
    if (row.patientSpecificMorphology !== VERTICAL_GAP_MARKER) {
      problems.push(`${row.systemId}: patient-specific morphology must stay ${VERTICAL_GAP_MARKER}`)
    }

    const slots: [string, ProvenanceSlot][] = [
      ['anatomy', row.anatomy],
      ['physiology', row.physiology],
      ['simulation', row.simulation],
      ['personalTelemetry', row.personalTelemetry],
    ]
    for (const [slotName, slot] of slots) {
      if (slot.modeled) {
        if (slot.truthClass === null || !ALLOWED_TRUTH_CLASSES.has(slot.truthClass)) {
          problems.push(`${row.systemId}.${slotName}: invalid truthClass "${String(slot.truthClass)}"`)
        }
        if (slot.status !== 'provenance-backed') {
          problems.push(`${row.systemId}.${slotName}: modeled slot must be provenance-backed`)
        }
      } else {
        if (slot.truthClass !== null) {
          problems.push(`${row.systemId}.${slotName}: unmodeled slot must not claim truthClass "${slot.truthClass}"`)
        }
        if (slot.status !== VERTICAL_GAP_MARKER || !slot.detail.includes(VERTICAL_GAP_MARKER)) {
          problems.push(`${row.systemId}.${slotName}: unmodeled slot missing ${VERTICAL_GAP_MARKER}`)
        }
      }
    }

    for (const id of row.citationIds) {
      if (!verifiedCitationIds.has(id)) {
        problems.push(`${row.systemId}: unverified citation "${id}" not in ledger`)
      }
    }
    for (const gap of row.unmodeledOrgans) {
      if (gap.marker !== VERTICAL_GAP_MARKER || !gap.detail.includes(VERTICAL_GAP_MARKER)) {
        problems.push(`${row.systemId}/${gap.id}: organ gap missing ${VERTICAL_GAP_MARKER}`)
      }
    }
  }

  for (const expected of expectedSystemIds) {
    if (!seen.has(expected)) problems.push(`${expected}: canonical body system missing from provenance matrix`)
  }
  return problems
}
