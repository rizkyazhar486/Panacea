import type { CompiledAtlas } from './atlasCompiler'
import type { AtlasSystemId } from './atlasKernel'

export const BODY_AUTHORING_STAGE_ORDER = [
  'system',
  'organ',
  'tissue',
  'cell',
  'molecular',
  'dna',
] as const

export type BodyAuthoringStage = (typeof BODY_AUTHORING_STAGE_ORDER)[number]

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

export interface BodyAuthoringStageEvidence {
  stage: BodyAuthoringStage
  complete: boolean
  sourceBacked: boolean
}

export interface BodyAuthoringStageGate {
  activeStage: BodyAuthoringStage
  allowedStages: readonly BodyAuthoringStage[]
  systemReady: boolean
  blockers: readonly string[]
}

const WHOLE_BODY_MANIFEST_ID = 'panacea-whole-body-atlas'

function systemRootBlockers(compiled: CompiledAtlas) {
  const blockers: string[] = []

  if (compiled.manifestId !== WHOLE_BODY_MANIFEST_ID) {
    blockers.push(`manifest:${compiled.manifestId || 'unknown'}:not-whole-body`)
    return blockers
  }

  for (const system of REQUIRED_WHOLE_BODY_SYSTEMS) {
    const expectedId = `system:${system}`
    const entries = compiled.nodes.filter((entry) =>
      entry.node.id === expectedId
      && entry.node.system === system
      && entry.node.scale === 'organism',
    )

    if (entries.length !== 1) {
      blockers.push(`${system}:system-root-count-${entries.length}`)
      continue
    }

    const entry = entries[0]
    if (entry.node.geometryStatus !== 'shipped') {
      blockers.push(`${system}:geometry-${entry.node.geometryStatus}`)
      continue
    }
    if (entry.resolution !== 'resolved-shipped') {
      blockers.push(`${system}:${entry.resolution}`)
      continue
    }
    if (entry.footprint.sourceNodeCount < 1 || entry.footprint.sourceFiles.length < 1) {
      blockers.push(`${system}:no-source-node-proof`)
      continue
    }

    const declaredFiles = entry.node.source.files ?? []
    if (declaredFiles.length && entry.footprint.sourceFiles.some((file) => !declaredFiles.includes(file))) {
      blockers.push(`${system}:source-file-outside-reviewed-scope`)
    }
  }

  return blockers
}

export function isBodyAuthoringStage(value: string): value is BodyAuthoringStage {
  return (BODY_AUTHORING_STAGE_ORDER as readonly string[]).includes(value)
}

/**
 * Fail-closed authoring order for Body Exposure.
 *
 * System completion is grounded only in the canonical whole-body manifest and
 * source-mesh compiler output. Specialty atlases, semantic labels, partial
 * geometry, and unresolved hints cannot unlock organ authoring.
 *
 * After system completion, each deeper stage must provide its own explicit
 * complete + source-backed evidence before the next stage is unlocked.
 */
export function evaluateBodyAuthoringStageGate(
  compiled: CompiledAtlas,
  evidence: readonly BodyAuthoringStageEvidence[] = [],
): BodyAuthoringStageGate {
  const blockers = systemRootBlockers(compiled)
  const systemReady = blockers.length === 0
  let activeStage: BodyAuthoringStage = 'system'

  if (systemReady) {
    activeStage = 'organ'
    for (let index = 1; index < BODY_AUTHORING_STAGE_ORDER.length - 1; index += 1) {
      const stage = BODY_AUTHORING_STAGE_ORDER[index]
      if (activeStage !== stage) break
      const stageEvidence = evidence.find((entry) => entry.stage === stage)
      if (!stageEvidence?.complete || !stageEvidence.sourceBacked) break
      activeStage = BODY_AUTHORING_STAGE_ORDER[index + 1]
    }
  }

  const activeIndex = BODY_AUTHORING_STAGE_ORDER.indexOf(activeStage)
  return {
    activeStage,
    allowedStages: BODY_AUTHORING_STAGE_ORDER.slice(0, activeIndex + 1),
    systemReady,
    blockers,
  }
}

export function canAuthorBodyStage(gate: BodyAuthoringStageGate, requestedStage: string) {
  return isBodyAuthoringStage(requestedStage) && gate.allowedStages.includes(requestedStage)
}
