import type {
  AtlasManifest,
  AtlasNode,
  AtlasRegionId,
  AtlasScale,
  AtlasSystemId,
} from './atlasKernel'
import type { AnatomySourceNodeBundle } from '../anatomySourceNodeRegistry'
import {
  resolveAllAnatomySourceNodes,
  resolveAnatomySourceNodes,
} from '../anatomySourceNodeRegistry'

/**
 * Development must move from large anatomy to smaller anatomy. Existing deep
 * nodes may remain renderable, but they must never be interpreted as evidence
 * that a smaller scale is complete while an upstream scale is still incomplete.
 */
export const ATLAS_SCALE_ORDER = [
  'organism',
  'region',
  'organ',
  'suborgan',
  'tissue',
  'microstructure',
] as const satisfies readonly AtlasScale[]

/** Every whole-body system root that must exist before region work can advance. */
export const REQUIRED_SYSTEM_ROOTS = [
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

/**
 * Explicit macro-region roots. Hand and foot are separate atlas regions and are
 * intentionally not allowed to disappear into upper/lower-limb aggregation.
 */
export const REQUIRED_REGION_ROOTS = [
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
] as const satisfies readonly Exclude<AtlasRegionId, 'whole-body'>[]

export type AtlasCompletionBlockerCode =
  | 'missing-required-root'
  | 'duplicate-required-root'
  | 'wrong-scale'
  | 'geometry-not-shipped'
  | 'source-unresolved'
  | 'composite-hint-unresolved'
  | 'stage-not-explicitly-audited'
  | 'upstream-scale-incomplete'

export interface AtlasCompletionBlocker {
  scale: AtlasScale
  code: AtlasCompletionBlockerCode
  nodeId?: string
  requirement?: string
  message: string
}

export interface AtlasCompletionStage {
  scale: AtlasScale
  status: 'complete' | 'incomplete' | 'locked'
  explicitlyAudited: boolean
  authoringAllowed: boolean
  blockers: readonly AtlasCompletionBlocker[]
}

export interface AtlasCompletionReport {
  stages: readonly AtlasCompletionStage[]
  activeScale: AtlasScale
  organismComplete: boolean
  regionComplete: boolean
  mayAuthorSmallerThanActiveScale: false
}

function sourceBundlesFor(node: AtlasNode, bundles: readonly AnatomySourceNodeBundle[]) {
  return node.source.files?.length
    ? bundles.filter((bundle) => node.source.files!.includes(bundle.file))
    : bundles
}

function sourceBlockers(
  node: AtlasNode,
  bundles: readonly AnatomySourceNodeBundle[],
): AtlasCompletionBlocker[] {
  const scoped = sourceBundlesFor(node, bundles)
  const matches = node.source.mode === 'composite'
    ? resolveAllAnatomySourceNodes(node.source.nodeHints, scoped, 32)
    : resolveAnatomySourceNodes(node.source.nodeHints, scoped, 32)

  if (!matches.length) {
    return [{
      scale: node.scale,
      code: 'source-unresolved',
      nodeId: node.id,
      message: `${node.label} has no exact reviewed source-node match in its allowed GLB bundles.`,
    }]
  }

  if (node.source.mode !== 'composite') return []

  const resolvedHints = new Set(matches.map((match) => match.hint))
  return [...new Set(node.source.nodeHints.map((hint) => hint.trim()).filter(Boolean))]
    .filter((hint) => !resolvedHints.has(hint))
    .map((hint) => ({
      scale: node.scale,
      code: 'composite-hint-unresolved' as const,
      nodeId: node.id,
      requirement: hint,
      message: `${node.label} composite source hint "${hint}" is not resolved to an exact source node.`,
    }))
}

function geometryBlockers(node: AtlasNode): AtlasCompletionBlocker[] {
  return node.geometryStatus === 'shipped'
    ? []
    : [{
        scale: node.scale,
        code: 'geometry-not-shipped',
        nodeId: node.id,
        requirement: node.geometryStatus,
        message: `${node.label} is ${node.geometryStatus}; the layer is not complete enough to advance.`,
      }]
}

function auditSystemRoots(
  manifest: AtlasManifest,
  bundles: readonly AnatomySourceNodeBundle[],
): AtlasCompletionBlocker[] {
  const blockers: AtlasCompletionBlocker[] = []

  for (const system of REQUIRED_SYSTEM_ROOTS) {
    const expectedId = `system:${system}`
    const matches = manifest.nodes.filter((node) => node.id === expectedId)
    if (!matches.length) {
      blockers.push({
        scale: 'organism',
        code: 'missing-required-root',
        requirement: expectedId,
        message: `Missing required whole-body system root ${expectedId}.`,
      })
      continue
    }
    if (matches.length > 1) {
      blockers.push({
        scale: 'organism',
        code: 'duplicate-required-root',
        requirement: expectedId,
        message: `Required whole-body system root ${expectedId} is duplicated.`,
      })
      continue
    }

    const root = matches[0]
    if (root.scale !== 'organism') {
      blockers.push({
        scale: 'organism',
        code: 'wrong-scale',
        nodeId: root.id,
        requirement: 'organism',
        message: `${root.label} must remain an organism-scale root.`,
      })
      continue
    }
    blockers.push(...geometryBlockers(root), ...sourceBlockers(root, bundles))
  }

  return blockers
}

function auditRegionRoots(
  manifest: AtlasManifest,
  bundles: readonly AnatomySourceNodeBundle[],
): AtlasCompletionBlocker[] {
  const blockers: AtlasCompletionBlocker[] = []

  for (const region of REQUIRED_REGION_ROOTS) {
    const expectedId = `region:${region}`
    const matches = manifest.nodes.filter((node) => node.id === expectedId)
    if (!matches.length) {
      blockers.push({
        scale: 'region',
        code: 'missing-required-root',
        requirement: expectedId,
        message: `Missing required macro-region root ${expectedId}.`,
      })
      continue
    }
    if (matches.length > 1) {
      blockers.push({
        scale: 'region',
        code: 'duplicate-required-root',
        requirement: expectedId,
        message: `Required macro-region root ${expectedId} is duplicated.`,
      })
      continue
    }

    const root = matches[0]
    if (root.scale !== 'region') {
      blockers.push({
        scale: 'region',
        code: 'wrong-scale',
        nodeId: root.id,
        requirement: 'region',
        message: `${root.label} must remain a region-scale root.`,
      })
      continue
    }
    blockers.push(...geometryBlockers(root), ...sourceBlockers(root, bundles))
  }

  return blockers
}

function deferredBlocker(scale: AtlasScale): AtlasCompletionBlocker {
  return {
    scale,
    code: 'stage-not-explicitly-audited',
    message: `${scale} requirements are intentionally locked until every larger scale passes its explicit completeness audit.`,
  }
}

/**
 * Build the authoring gate. Organism and region have explicit requirement sets.
 * Deeper scales remain fail-closed until their own requirement manifests are
 * deliberately authored after the larger levels are complete.
 */
export function buildAtlasCompletionReport(
  manifest: AtlasManifest,
  bundles: readonly AnatomySourceNodeBundle[],
): AtlasCompletionReport {
  const raw = new Map<AtlasScale, { explicitlyAudited: boolean; blockers: AtlasCompletionBlocker[] }>([
    ['organism', { explicitlyAudited: true, blockers: auditSystemRoots(manifest, bundles) }],
    ['region', { explicitlyAudited: true, blockers: auditRegionRoots(manifest, bundles) }],
    ['organ', { explicitlyAudited: false, blockers: [deferredBlocker('organ')] }],
    ['suborgan', { explicitlyAudited: false, blockers: [deferredBlocker('suborgan')] }],
    ['tissue', { explicitlyAudited: false, blockers: [deferredBlocker('tissue')] }],
    ['microstructure', { explicitlyAudited: false, blockers: [deferredBlocker('microstructure')] }],
  ])

  const stages: AtlasCompletionStage[] = []
  let upstreamComplete = true

  for (const scale of ATLAS_SCALE_ORDER) {
    const audit = raw.get(scale)!
    if (!upstreamComplete) {
      stages.push({
        scale,
        status: 'locked',
        explicitlyAudited: audit.explicitlyAudited,
        authoringAllowed: false,
        blockers: [
          {
            scale,
            code: 'upstream-scale-incomplete',
            message: `${scale} is locked because a larger atlas scale is incomplete.`,
          },
          ...audit.blockers,
        ],
      })
      continue
    }

    const complete = audit.explicitlyAudited && audit.blockers.length === 0
    stages.push({
      scale,
      status: complete ? 'complete' : 'incomplete',
      explicitlyAudited: audit.explicitlyAudited,
      authoringAllowed: !complete,
      blockers: audit.blockers,
    })
    upstreamComplete = complete
  }

  const activeScale = stages.find((stage) => stage.authoringAllowed)?.scale ?? 'microstructure'
  const organismComplete = stages.find((stage) => stage.scale === 'organism')?.status === 'complete'
  const regionComplete = stages.find((stage) => stage.scale === 'region')?.status === 'complete'

  return {
    stages,
    activeScale,
    organismComplete,
    regionComplete,
    mayAuthorSmallerThanActiveScale: false,
  }
}
