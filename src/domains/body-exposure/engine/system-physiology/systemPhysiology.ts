// One body system's physiology, planned for the stage: what the system does, how it couples to the others, which
// mechanisms carry a source, and what is still only a placeholder. Pure: no I/O, no clock, no randomness.
//
// The system list is the atlas's (data/bodySystems.ts); the role, teaching relation and couplings come from the
// whole-body physiology OS through the existing atlas → physiology bridge; the mechanisms and gaps come from the
// catalog the caller passes in (see physiologyCatalog.ts). Nothing is inferred about a person, and a catalog
// that does not cover every atlas system is refused instead of showing a partial picture as complete.

import type { BodySystemId } from '../../data/bodySystems.ts'
import type { BodyPhysiologyBridgeFidelity, BodySystemPhysiologyBridge } from '../../../../lib/bodySystemPhysiologyBridge.ts'
import type { WholeBodyCouplingLoop, WholeBodySystemId, WholeBodySystemModel } from '../../../../lib/wholeBodyPhysiologyOS.ts'
import type { PhysiologyGap, PhysiologyMechanism, RejectedSource } from './physiologySources.ts'

export interface SystemPhysiologyCatalog {
  systems: readonly { id: BodySystemId; label: string }[]
  bridge: readonly BodySystemPhysiologyBridge[]
  domains: readonly WholeBodySystemModel[]
  loops: readonly WholeBodyCouplingLoop[]
  mechanisms: readonly PhysiologyMechanism[]
  gaps: readonly PhysiologyGap[]
  /** Sources the readers refused; carried so a test can require the list to stay empty. */
  rejected: readonly RejectedSource[]
}

export interface SystemPhysiologyDomain {
  id: WholeBodySystemId
  label: string
  role: string
  anchors: readonly string[]
  /** A conceptual teaching relation, never a calculation about a person. */
  equation: string
  equationNote: string
}

export interface SystemLoop {
  id: string
  label: string
  teachingPoint: string
  /** Short labels of the physiology domains along the loop, in order. */
  path: readonly string[]
}

export interface OrganGapView extends PhysiologyGap {
  /** True when a sourced mechanism already covers part of this organ's physiology. */
  partial: boolean
}

export interface SystemPhysiologyView {
  id: BodySystemId
  label: string
  fidelity: BodyPhysiologyBridgeFidelity
  /** Why the atlas system maps to these physiology domains, as the bridge states it. */
  bridgeNote: string
  domains: readonly SystemPhysiologyDomain[]
  /** Other atlas systems this one exchanges with, in atlas order. */
  couplings: readonly { id: BodySystemId; label: string }[]
  loops: readonly SystemLoop[]
  mechanisms: readonly PhysiologyMechanism[]
  organGaps: readonly OrganGapView[]
  /** True when at least one mechanism with a source exists for this system. */
  sourced: boolean
}

export type SystemPhysiologyPlan =
  | { ok: true; view: SystemPhysiologyView }
  | { ok: false; reason: 'unknown-system' | 'catalog-incomplete'; detail: string }

export interface SystemIndexRow {
  id: BodySystemId
  label: string
  role: string
  fidelity: BodyPhysiologyBridgeFidelity
  mechanismCount: number
  gapCount: number
  sourced: boolean
}

export type SystemIndexPlan =
  | { ok: true; rows: readonly SystemIndexRow[] }
  | { ok: false; reason: 'catalog-incomplete'; detail: string }

/** The first reason the catalog cannot be trusted to describe every system, or null when it can. */
export function checkCatalog(catalog: SystemPhysiologyCatalog): string | null {
  if (catalog.systems.length === 0) return 'the catalog lists no body systems'
  const ids = new Set<BodySystemId>()
  for (const system of catalog.systems) {
    if (ids.has(system.id)) return `body system '${system.id}' is listed twice`
    ids.add(system.id)
  }
  const domainIds = new Set(catalog.domains.map((domain) => domain.id))
  for (const system of catalog.systems) {
    const entries = catalog.bridge.filter((entry) => entry.atlasSystemId === system.id)
    if (entries.length !== 1) return `body system '${system.id}' has ${entries.length} physiology bridge entries; exactly one is required`
    const [entry] = entries
    if (entry.physiologySystemIds.length === 0) return `the bridge for '${system.id}' names no physiology domain`
    const missing = entry.physiologySystemIds.find((domain) => !domainIds.has(domain))
    if (missing) return `the bridge for '${system.id}' names physiology domain '${missing}', which the catalog does not describe`
  }
  for (const entry of catalog.bridge) {
    if (!ids.has(entry.atlasSystemId)) return `the bridge maps '${entry.atlasSystemId}', which is not an atlas body system`
  }
  for (const mechanism of catalog.mechanisms) {
    if (mechanism.citations.length === 0) return `mechanism '${mechanism.id}' has no source`
    const stray = mechanism.systems.find((system) => !ids.has(system))
    if (stray || mechanism.systems.length === 0) return `mechanism '${mechanism.id}' belongs to no listed body system`
  }
  for (const gap of catalog.gaps) {
    if (!ids.has(gap.system)) return `gap '${gap.id}' belongs to no listed body system`
  }
  return null
}

const sameOrgan = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/**
 * The atlas system that stands for a physiology domain: the one whose bridge leads with it, else the first that
 * includes it. 'Contextual' bridges (sensory/ENT shown against neural control) never stand for a domain.
 */
function atlasSystemFor(domain: WholeBodySystemId, catalog: SystemPhysiologyCatalog): BodySystemId | null {
  const direct = catalog.bridge.filter((entry) => entry.fidelity !== 'contextual')
  return (direct.find((entry) => entry.physiologySystemIds[0] === domain) ?? direct.find((entry) => entry.physiologySystemIds.includes(domain)))?.atlasSystemId ?? null
}

export function planSystemPhysiology(id: unknown, catalog: SystemPhysiologyCatalog): SystemPhysiologyPlan {
  const problem = checkCatalog(catalog)
  if (problem) return { ok: false, reason: 'catalog-incomplete', detail: problem }
  const system = catalog.systems.find((item) => item.id === id)
  if (!system) return { ok: false, reason: 'unknown-system', detail: `'${String(id)}' is not an atlas body system` }

  const entry = catalog.bridge.find((item) => item.atlasSystemId === system.id)!
  const models = entry.physiologySystemIds.map((domainId) => catalog.domains.find((domain) => domain.id === domainId)!)
  const domains: SystemPhysiologyDomain[] = models.map((model) => ({
    id: model.id,
    label: model.label,
    role: model.primaryRole,
    anchors: model.physiologyAnchors,
    equation: model.equation,
    equationNote: model.equationNote,
  }))

  // A contextual bridge borrows the nearest domain only as context (sensory/ENT against neural control): that
  // domain's couplings and loops describe the domain, not this system, so none are claimed for it.
  const contextual = entry.fidelity === 'contextual'
  const coupled = new Set<BodySystemId>()
  for (const model of contextual ? [] : models) {
    for (const target of model.couplingTargets) {
      const atlas = atlasSystemFor(target, catalog)
      if (atlas && atlas !== system.id) coupled.add(atlas)
    }
  }
  const couplings = catalog.systems.filter((item) => coupled.has(item.id)).map((item) => ({ id: item.id, label: item.label }))

  const shortLabel = (domainId: WholeBodySystemId) => catalog.domains.find((domain) => domain.id === domainId)?.shortLabel ?? domainId
  const loops: SystemLoop[] = contextual ? [] : catalog.loops
    .filter((loop) => loop.path.some((domainId) => entry.physiologySystemIds.includes(domainId)))
    .map((loop) => ({ id: loop.id, label: loop.label, teachingPoint: loop.teachingPoint, path: loop.path.map(shortLabel) }))

  const mechanisms = catalog.mechanisms.filter((mechanism) => mechanism.systems.includes(system.id))
  const organGaps: OrganGapView[] = catalog.gaps
    .filter((gap) => gap.system === system.id)
    .map((gap) => ({ ...gap, partial: mechanisms.some((mechanism) => mechanism.organ !== undefined && sameOrgan(mechanism.organ, gap.subject)) }))

  return {
    ok: true,
    view: {
      id: system.id,
      label: system.label,
      fidelity: entry.fidelity,
      bridgeNote: entry.rationale,
      domains,
      couplings,
      loops,
      mechanisms,
      organGaps,
      sourced: mechanisms.length > 0,
    },
  }
}

export function planSystemIndex(catalog: SystemPhysiologyCatalog): SystemIndexPlan {
  const problem = checkCatalog(catalog)
  if (problem) return { ok: false, reason: 'catalog-incomplete', detail: problem }
  const rows = catalog.systems.map((system) => {
    const entry = catalog.bridge.find((item) => item.atlasSystemId === system.id)!
    const primary = catalog.domains.find((domain) => domain.id === entry.physiologySystemIds[0])!
    const mechanismCount = catalog.mechanisms.filter((mechanism) => mechanism.systems.includes(system.id)).length
    return {
      id: system.id,
      label: system.label,
      role: primary.primaryRole,
      fidelity: entry.fidelity,
      mechanismCount,
      gapCount: catalog.gaps.filter((gap) => gap.system === system.id).length,
      sourced: mechanismCount > 0,
    }
  })
  return { ok: true, rows }
}
