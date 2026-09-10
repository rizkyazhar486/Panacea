import type { AtlasManifest, AtlasNode, AtlasSystemId } from './atlasKernel'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../anatomySourceNodeRegistry'
import { buildSystemMaturityAdmissionReport } from './systemMaturityAdmission'
import {
  evaluateMacroDomainClosure,
  type MacroTargetPublicationRecord,
} from './macroSystemClosureGate'

export const BODY_MATURATION_ORDER = [
  'whole-body',
  'system',
  'region',
  'organ',
  'suborgan',
  'tissue',
  'microstructure',
  'cell',
  'organelle',
  'molecular',
  'dna',
] as const

export type BodyMaturationStageId = (typeof BODY_MATURATION_ORDER)[number]

export const REQUIRED_WHOLE_BODY_SYSTEMS = [
  'surface',
  'skeletal',
  'articular',
  'muscular',
  'cardiovascular',
  'lymphatic',
  'nervous',
  'respiratory',
  'digestive',
  'urinary',
  'endocrine',
  'reproductive',
  'sensory',
  'fascial',
] as const satisfies readonly AtlasSystemId[]

export const REQUIRED_MACRO_REGIONS = [
  'head',
  'neck',
  'thorax',
  'abdomen',
  'pelvis',
  'back',
  'upper-limb',
  'hand',
  'lower-limb',
  'foot',
] as const

export type BodyMaturationBlockerCode =
  | 'missing-root'
  | 'duplicate-root'
  | 'wrong-scale'
  | 'geometry-not-shipped'
  | 'source-admission-failed'
  | 'macro-closure-failed'
  | 'schema-not-authoritative'
  | 'upstream-incomplete'

export interface BodyMaturationBlocker {
  stage: BodyMaturationStageId
  code: BodyMaturationBlockerCode
  requirement?: string
  nodeId?: string
  message: string
}

export interface BodyMaturationStage {
  id: BodyMaturationStageId
  status: 'complete' | 'incomplete' | 'locked'
  authoringAllowed: boolean
  blockers: readonly BodyMaturationBlocker[]
}

export interface BodyMaturationReport {
  activeStage: BodyMaturationStageId
  stages: readonly BodyMaturationStage[]
  wholeBodyComplete: boolean
  mayAdvancePastActiveStage: false
}

export interface BodyMaturationEvidence {
  /**
   * Asset-level publication records are optional input and fail closed when absent.
   * Supplying records does not itself establish truth: macroSystemClosureGate still
   * requires complete provenance fields, source candidates and approved review.
   */
  macroPublicationRecords?: readonly MacroTargetPublicationRecord[]
}

function rootNodes(manifest: AtlasManifest, id: string): readonly AtlasNode[] {
  return manifest.nodes.filter((node) => node.id === id)
}

function auditSystemStage(
  manifest: AtlasManifest,
  evidence: BodyMaturationEvidence,
): BodyMaturationBlocker[] {
  const blockers: BodyMaturationBlocker[] = []
  const admissionBySystem = new Map(
    buildSystemMaturityAdmissionReport(manifest, INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT)
      .admissions
      .map((entry) => [entry.system, entry] as const),
  )

  for (const system of REQUIRED_WHOLE_BODY_SYSTEMS) {
    const id = `system:${system}`
    const matches = rootNodes(manifest, id)
    if (matches.length === 0) {
      blockers.push({ stage: 'system', code: 'missing-root', requirement: id, message: `Missing required system root ${id}.` })
      continue
    }
    if (matches.length > 1) {
      blockers.push({ stage: 'system', code: 'duplicate-root', requirement: id, message: `System root ${id} is duplicated.` })
      continue
    }
    const node = matches[0]
    if (node.scale !== 'organism') {
      blockers.push({ stage: 'system', code: 'wrong-scale', requirement: 'organism', nodeId: node.id, message: `${node.label} must remain an organism-scale system root.` })
      continue
    }
    if (node.geometryStatus !== 'shipped') {
      blockers.push({ stage: 'system', code: 'geometry-not-shipped', requirement: node.geometryStatus, nodeId: node.id, message: `${node.label} is ${node.geometryStatus}; whole-body system coverage is not complete.` })
      continue
    }

    const admission = admissionBySystem.get(system)
    if (!admission?.admitted) {
      const status = admission?.status ?? 'missing-admission'
      blockers.push({
        stage: 'system',
        code: 'source-admission-failed',
        requirement: status,
        nodeId: node.id,
        message: `${node.label} cannot complete whole-body system coverage until same-frame source admission succeeds (${status}).`,
      })
      continue
    }

    // Articular and fascial are the two current macro-system closure domains.
    // Generic same-frame source admission is intentionally insufficient for them:
    // every required macro target must also pass the stricter asset-level provenance,
    // licensing, transformation-history and qualified-review publication gate.
    if (system === 'articular' || system === 'fascial') {
      const closure = evaluateMacroDomainClosure(system, evidence.macroPublicationRecords ?? [])
      if (!closure.mayPromoteSystemRootToShipped) {
        blockers.push({
          stage: 'system',
          code: 'macro-closure-failed',
          requirement: closure.status,
          nodeId: node.id,
          message: `${node.label} cannot complete whole-body system coverage until every required ${system} macro target passes asset-level provenance and qualified-review closure (${closure.status}).`,
        })
      }
    }
  }
  return blockers
}

function auditRegionStage(manifest: AtlasManifest): BodyMaturationBlocker[] {
  const blockers: BodyMaturationBlocker[] = []
  for (const region of REQUIRED_MACRO_REGIONS) {
    const id = `region:${region}`
    const matches = rootNodes(manifest, id)
    if (matches.length === 0) {
      blockers.push({ stage: 'region', code: 'missing-root', requirement: id, message: `Missing required macro-region root ${id}.` })
      continue
    }
    if (matches.length > 1) {
      blockers.push({ stage: 'region', code: 'duplicate-root', requirement: id, message: `Macro-region root ${id} is duplicated.` })
      continue
    }
    const node = matches[0]
    if (node.scale !== 'region') {
      blockers.push({ stage: 'region', code: 'wrong-scale', requirement: 'region', nodeId: node.id, message: `${node.label} must remain a region-scale root.` })
      continue
    }
    if (node.geometryStatus !== 'shipped') {
      blockers.push({ stage: 'region', code: 'geometry-not-shipped', requirement: node.geometryStatus, nodeId: node.id, message: `${node.label} is ${node.geometryStatus}; macro-region coverage is not complete.` })
    }
  }
  return blockers
}

function locked(stage: BodyMaturationStageId, upstream: BodyMaturationStageId): BodyMaturationStage {
  return {
    id: stage,
    status: 'locked',
    authoringAllowed: false,
    blockers: [{
      stage,
      code: 'upstream-incomplete',
      requirement: upstream,
      message: `${stage} authoring is locked until ${upstream} is complete.`,
    }],
  }
}

function unsupportedSchema(stage: BodyMaturationStageId): BodyMaturationStage {
  return {
    id: stage,
    status: 'locked',
    authoringAllowed: false,
    blockers: [{
      stage,
      code: 'schema-not-authoritative',
      message: `${stage} requires its own provenance-bearing schema before it can become an authoring stage; gross-atlas geometry must not be reused as fake smaller-scale evidence.`,
    }],
  }
}

/**
 * Enforces the project's required maturation direction:
 * whole body -> systems -> regions -> organs -> smaller scales -> molecular -> DNA.
 * Existing smaller-scale content may remain viewable, but it cannot be used as evidence
 * that the project is ready to advance while a larger upstream stage is incomplete.
 */
export function buildBodyMaturationReport(
  manifest: AtlasManifest,
  evidence: BodyMaturationEvidence = {},
): BodyMaturationReport {
  const wholeBody: BodyMaturationStage = {
    id: 'whole-body',
    status: 'complete',
    authoringAllowed: true,
    blockers: [],
  }

  const systemBlockers = auditSystemStage(manifest, evidence)
  const system: BodyMaturationStage = {
    id: 'system',
    status: systemBlockers.length ? 'incomplete' : 'complete',
    authoringAllowed: true,
    blockers: systemBlockers,
  }

  if (system.status !== 'complete') {
    const stages: BodyMaturationStage[] = [wholeBody, system]
    let upstream: BodyMaturationStageId = 'system'
    for (const stage of BODY_MATURATION_ORDER.slice(2)) {
      stages.push(locked(stage, upstream))
      upstream = stage
    }
    return { activeStage: 'system', stages, wholeBodyComplete: false, mayAdvancePastActiveStage: false }
  }

  const regionBlockers = auditRegionStage(manifest)
  const region: BodyMaturationStage = {
    id: 'region',
    status: regionBlockers.length ? 'incomplete' : 'complete',
    authoringAllowed: true,
    blockers: regionBlockers,
  }

  if (region.status !== 'complete') {
    const stages: BodyMaturationStage[] = [wholeBody, system, region]
    let upstream: BodyMaturationStageId = 'region'
    for (const stage of BODY_MATURATION_ORDER.slice(3)) {
      stages.push(locked(stage, upstream))
      upstream = stage
    }
    return { activeStage: 'region', stages, wholeBodyComplete: false, mayAdvancePastActiveStage: false }
  }

  const deeper = BODY_MATURATION_ORDER.slice(3).map(unsupportedSchema)
  return {
    activeStage: 'organ',
    stages: [wholeBody, system, region, ...deeper],
    wholeBodyComplete: true,
    mayAdvancePastActiveStage: false,
  }
}
