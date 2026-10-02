import type { AtlasManifest, AtlasNode, AtlasRegionId, AtlasSystemId } from './atlasKernel'

export interface RequiredOrganInventoryEntry {
  readonly id: string
  readonly system: AtlasSystemId
  readonly regions: readonly AtlasRegionId[]
}

export interface OrganInventoryProvenance {
  readonly sourceId: string
  readonly sourceRevision: string
  readonly sourceLocator: string
  readonly license: string
  readonly reviewStatus: 'academic-review-required' | 'academic-reviewed'
}

export interface RequiredOrganInventory {
  readonly id: string
  readonly revision: string
  readonly provenance: OrganInventoryProvenance
  readonly organs: readonly RequiredOrganInventoryEntry[]
}

export type OrganCompletionBlockerCode =
  | 'inventory-empty'
  | 'inventory-invalid-provenance'
  | 'inventory-not-academic-reviewed'
  | 'duplicate-required-organ'
  | 'missing-organ'
  | 'duplicate-organ'
  | 'wrong-scale'
  | 'wrong-system'
  | 'wrong-region'
  | 'geometry-not-shipped'
  | 'source-not-admitted'
  | 'node-invalid-provenance'
  | 'node-not-academic-reviewed'

export interface OrganCompletionBlocker {
  readonly code: OrganCompletionBlockerCode
  readonly organId?: string
  readonly requirement?: string
  readonly message: string
}

export interface OrganCompletionReport {
  readonly inventoryId: string
  readonly inventoryRevision: string
  readonly requiredOrganCount: number
  readonly completeOrganCount: number
  readonly complete: boolean
  readonly blockers: readonly OrganCompletionBlocker[]
  /** Policy gate only: physiology authoring opens after the complete reviewed organ inventory passes. */
  readonly mayAdvanceToPhysiology: boolean
  /** Surgery/procedure authoring is intentionally never opened directly by anatomy completion. */
  readonly mayAdvanceToSurgery: false
}

function isPinnedRevision(value: string) {
  const normalized = value.trim().toLowerCase()
  return Boolean(normalized) && !['latest', 'main', 'master', 'head', 'current'].includes(normalized)
}

function hasInventoryProvenance(inventory: RequiredOrganInventory) {
  const provenance = inventory.provenance
  return Boolean(
    inventory.id.trim()
    && isPinnedRevision(inventory.revision)
    && provenance.sourceId.trim()
    && isPinnedRevision(provenance.sourceRevision)
    && provenance.sourceLocator.trim()
    && provenance.license.trim(),
  )
}

function hasNodeProvenance(node: AtlasNode) {
  return Boolean(
    node.provenance.sourceId.trim()
    && isPinnedRevision(node.provenance.sourceRevision)
    && node.provenance.sourceLocator.trim()
    && node.provenance.license.trim(),
  )
}

function duplicateIds(values: readonly string[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

/**
 * Whole-body organ completion gate.
 *
 * This function does not invent the human organ inventory and does not perform
 * source-name guessing. The caller must supply a separately curated,
 * provenance-bearing, academically reviewed required-organ inventory plus the
 * canonical node IDs that already passed the repository's exact source-admission
 * pipeline. Engineering source admission and academic review are independent
 * requirements; neither may promote the other.
 */
export function buildBodyOrganCompletionReport(
  manifest: AtlasManifest,
  inventory: RequiredOrganInventory,
  sourceAdmittedNodeIds: ReadonlySet<string>,
): OrganCompletionReport {
  const blockers: OrganCompletionBlocker[] = []
  const requiredIds = inventory.organs.map((organ) => organ.id)

  if (inventory.organs.length === 0) {
    blockers.push({ code: 'inventory-empty', message: 'Required organ inventory is empty.' })
  }
  if (!hasInventoryProvenance(inventory)) {
    blockers.push({ code: 'inventory-invalid-provenance', message: 'Organ inventory requires pinned source/revision, locator, and license provenance.' })
  }
  if (inventory.provenance.reviewStatus !== 'academic-reviewed') {
    blockers.push({ code: 'inventory-not-academic-reviewed', message: 'Organ inventory must be approved by qualified academic review before it can define whole-body completion.' })
  }
  for (const duplicate of duplicateIds(requiredIds)) {
    blockers.push({ code: 'duplicate-required-organ', organId: duplicate, message: `Required organ ${duplicate} is duplicated in the inventory.` })
  }

  let completeOrganCount = 0
  for (const requirement of inventory.organs) {
    const matches = manifest.nodes.filter((node) => node.id === requirement.id)
    if (matches.length === 0) {
      blockers.push({ code: 'missing-organ', organId: requirement.id, message: `Missing required organ ${requirement.id}.` })
      continue
    }
    if (matches.length > 1) {
      blockers.push({ code: 'duplicate-organ', organId: requirement.id, message: `Canonical organ ${requirement.id} is duplicated.` })
      continue
    }

    const node = matches[0]
    let organReady = true
    if (node.scale !== 'organ') {
      blockers.push({ code: 'wrong-scale', organId: requirement.id, requirement: 'organ', message: `${requirement.id} must remain an organ-scale canonical node.` })
      organReady = false
    }
    if (node.system !== requirement.system) {
      blockers.push({ code: 'wrong-system', organId: requirement.id, requirement: requirement.system, message: `${requirement.id} does not match its reviewed inventory system.` })
      organReady = false
    }
    if (requirement.regions.length === 0 || !requirement.regions.every((region) => node.regions.includes(region))) {
      blockers.push({ code: 'wrong-region', organId: requirement.id, requirement: requirement.regions.join(','), message: `${requirement.id} does not satisfy its reviewed inventory region assignment.` })
      organReady = false
    }
    if (node.geometryStatus !== 'shipped') {
      blockers.push({ code: 'geometry-not-shipped', organId: requirement.id, requirement: node.geometryStatus, message: `${requirement.id} geometry is ${node.geometryStatus}; anatomy completion remains blocked.` })
      organReady = false
    }
    if (!sourceAdmittedNodeIds.has(node.id)) {
      blockers.push({ code: 'source-not-admitted', organId: requirement.id, message: `${requirement.id} has not passed exact source admission.` })
      organReady = false
    }
    if (!hasNodeProvenance(node)) {
      blockers.push({ code: 'node-invalid-provenance', organId: requirement.id, message: `${requirement.id} lacks complete pinned source provenance.` })
      organReady = false
    }
    if (node.provenance.reviewStatus !== 'academic-reviewed') {
      blockers.push({ code: 'node-not-academic-reviewed', organId: requirement.id, requirement: node.provenance.reviewStatus, message: `${requirement.id} is not academically reviewed.` })
      organReady = false
    }

    if (organReady) completeOrganCount += 1
  }

  const complete = blockers.length === 0 && completeOrganCount === inventory.organs.length && inventory.organs.length > 0
  return {
    inventoryId: inventory.id,
    inventoryRevision: inventory.revision,
    requiredOrganCount: inventory.organs.length,
    completeOrganCount,
    complete,
    blockers,
    mayAdvanceToPhysiology: complete,
    mayAdvanceToSurgery: false,
  }
}

export const BODY_ORGAN_COMPLETION_BOUNDARY =
  'Whole-body organ completion requires a separately curated and academically reviewed organ inventory, canonical organ-scale nodes, shipped geometry, exact source admission, pinned provenance, and qualified academic review for every required organ. This gate never invents missing organs, guesses source meshes, treats engineering CI as anatomical approval, or opens surgery directly.'
