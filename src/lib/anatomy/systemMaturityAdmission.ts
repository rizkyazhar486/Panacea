import type { AtlasGeometryStatus, AtlasManifest, AtlasNode, AtlasSystemId } from './atlasKernel'
import type { AnatomySourceNodeBundle, AnatomySourceNodeMatch } from '../anatomySourceNodeRegistry'
import { resolveAllAnatomySourceNodes, resolveAnatomySourceNodes } from '../anatomySourceNodeRegistry'

/**
 * The seven GLB bundles exported from one whole-body Z-Anatomy/BodyParts3D
 * coordinate frame. Specialty atlases are deliberately excluded: having a
 * useful organ/specialty GLB is not evidence that it can be overlaid onto this
 * body without a reviewed transform.
 */
export const SAME_FRAME_WHOLE_BODY_FILES = [
  'surface.glb',
  'skeletal.glb',
  'muscular.glb',
  'cardiovascular.glb',
  'nervous.glb',
  'visceral.glb',
  'lymphoid.glb',
] as const

export const SYSTEM_MATURITY_REQUIRED_SYSTEMS = [
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

export type SystemMaturityAdmissionStatus =
  | 'same-frame-shipped'
  | 'same-frame-partial'
  | 'outside-whole-body-frame'
  | 'source-name-unresolved'
  | 'source-bundle-unresolved'
  | 'missing-root'
  | 'ambiguous-root'

export interface SystemMaturityAdmission {
  system: AtlasSystemId
  nodeId: string
  status: SystemMaturityAdmissionStatus
  geometryStatus?: AtlasGeometryStatus
  files: readonly string[]
  unresolvedFiles: readonly string[]
  unresolvedHints: readonly string[]
  matches: readonly AnatomySourceNodeMatch[]
  /** True only when geometry, bundle frame and every reviewed source hint pass. */
  admitted: boolean
}

export interface SystemMaturityAdmissionReport {
  admissions: readonly SystemMaturityAdmission[]
  admittedSystems: readonly AtlasSystemId[]
  blockedSystems: readonly AtlasSystemId[]
  allSystemsAdmitted: boolean
}

const SAME_FRAME_FILE_SET = new Set<string>(SAME_FRAME_WHOLE_BODY_FILES)

function sourceBundlesFor(node: AtlasNode, bundles: readonly AnatomySourceNodeBundle[]) {
  const files = node.source.files ?? []
  if (!files.length) return bundles.filter((bundle) => SAME_FRAME_FILE_SET.has(bundle.file))
  const allowed = new Set(files)
  return bundles.filter((bundle) => allowed.has(bundle.file))
}

function resolveReviewedSource(node: AtlasNode, bundles: readonly AnatomySourceNodeBundle[]) {
  const scoped = sourceBundlesFor(node, bundles)
  const matches = node.source.mode === 'composite'
    ? resolveAllAnatomySourceNodes(node.source.nodeHints, scoped, 32)
    : resolveAnatomySourceNodes(node.source.nodeHints, scoped, 32)

  if (node.source.mode !== 'composite') {
    return {
      matches,
      unresolvedHints: matches.length ? [] : [...new Set(node.source.nodeHints.map((hint) => hint.trim()).filter(Boolean))],
    }
  }

  const resolvedHints = new Set(matches.map((match) => match.hint))
  return {
    matches,
    unresolvedHints: [...new Set(node.source.nodeHints.map((hint) => hint.trim()).filter(Boolean))]
      .filter((hint) => !resolvedHints.has(hint)),
  }
}

function auditRoot(
  system: AtlasSystemId,
  manifest: AtlasManifest,
  bundles: readonly AnatomySourceNodeBundle[],
): SystemMaturityAdmission {
  const nodeId = `system:${system}`
  const roots = manifest.nodes.filter((node) => node.id === nodeId)
  if (!roots.length) {
    return { system, nodeId, status: 'missing-root', files: [], unresolvedFiles: [], unresolvedHints: [], matches: [], admitted: false }
  }
  if (roots.length !== 1) {
    return { system, nodeId, status: 'ambiguous-root', files: [], unresolvedFiles: [], unresolvedHints: [], matches: [], admitted: false }
  }

  const root = roots[0]
  const files = [...new Set(root.source.files ?? [])]
  const outsideFrame = files.filter((file) => !SAME_FRAME_FILE_SET.has(file))
  if (outsideFrame.length) {
    return {
      system,
      nodeId,
      status: 'outside-whole-body-frame',
      geometryStatus: root.geometryStatus,
      files,
      unresolvedFiles: outsideFrame,
      unresolvedHints: [...root.source.nodeHints],
      matches: [],
      admitted: false,
    }
  }

  const indexedFiles = new Set(bundles.map((bundle) => bundle.file))
  const unresolvedFiles = files.filter((file) => !indexedFiles.has(file))
  const { matches, unresolvedHints } = resolveReviewedSource(root, bundles)

  // Partial/reference-only/planned geometry stays fail-closed even if some
  // source names happen to exist. Missing names remain visible evidence debt.
  if (root.geometryStatus !== 'shipped') {
    return {
      system,
      nodeId,
      status: 'same-frame-partial',
      geometryStatus: root.geometryStatus,
      files,
      unresolvedFiles,
      unresolvedHints,
      matches,
      admitted: false,
    }
  }

  if (unresolvedFiles.length) {
    return {
      system,
      nodeId,
      status: 'source-bundle-unresolved',
      geometryStatus: root.geometryStatus,
      files,
      unresolvedFiles,
      unresolvedHints,
      matches,
      admitted: false,
    }
  }

  if (!matches.length || unresolvedHints.length) {
    return {
      system,
      nodeId,
      status: 'source-name-unresolved',
      geometryStatus: root.geometryStatus,
      files,
      unresolvedFiles,
      unresolvedHints,
      matches,
      admitted: false,
    }
  }

  return {
    system,
    nodeId,
    status: 'same-frame-shipped',
    geometryStatus: root.geometryStatus,
    files,
    unresolvedFiles: [],
    unresolvedHints: [],
    matches,
    admitted: true,
  }
}

/**
 * Engineering admission for organism-scale system coverage. This proves only
 * that the manifest points at shipped, indexed geometry in the same reference
 * frame and that its reviewed lookup hints resolve. It is not anatomical or
 * clinical validation and does not replace qualified academic review.
 */
export function buildSystemMaturityAdmissionReport(
  manifest: AtlasManifest,
  bundles: readonly AnatomySourceNodeBundle[],
): SystemMaturityAdmissionReport {
  const admissions = SYSTEM_MATURITY_REQUIRED_SYSTEMS.map((system) => auditRoot(system, manifest, bundles))
  const admittedSystems = admissions.filter((entry) => entry.admitted).map((entry) => entry.system)
  const blockedSystems = admissions.filter((entry) => !entry.admitted).map((entry) => entry.system)
  return {
    admissions,
    admittedSystems,
    blockedSystems,
    allSystemsAdmitted: blockedSystems.length === 0,
  }
}
