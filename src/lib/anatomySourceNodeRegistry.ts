import { INDEKS_TUBUH, type StrukturTubuh } from './bodyIndex.gen'
import { WHOLE_BODY_REGIONS, type AtlasLayerKey, type AtlasRegionKey } from './wholeBodyAtlasBlueprint'

export interface AnatomySourceNodeBundle {
  file: string
  names: readonly string[]
}

export interface AnatomySourceNodeMatch {
  file: string
  hint: string
  names: readonly string[]
}

export interface AnatomySourceSelection {
  name: string
  file: string | null
  revision: number
}

export interface ReviewedAtlasSourceTarget {
  key: string
  region: AtlasRegionKey
  structureId: string
  label: string
  layer: AtlasLayerKey
}

export type AnatomySourceNodeOrigin = 'runtime' | 'generated-index'

type Listener = () => void

const listeners = new Set<Listener>()
const selectionListeners = new Set<Listener>()
const bundles = new Map<string, readonly string[]>()

const FILE_BY_LAYER: Record<StrukturTubuh['l'], string> = {
  surface: 'surface.glb',
  skeletal: 'skeletal.glb',
  muscular: 'muscular.glb',
  cardiovascular: 'cardiovascular.glb',
  nervous: 'nervous.glb',
  visceral: 'visceral.glb',
  lymphoid: 'lymphoid.glb',
}

const BODY_INDEX_REGIONS_BY_ATLAS: Readonly<Record<AtlasRegionKey, readonly string[]>> = {
  'head-neck': ['kepala', 'leher'],
  thorax: ['toraks'],
  abdomen: ['abdomen'],
  'pelvis-perineum': ['pelvis'],
  'upper-limb': ['bahu-lengan', 'tangan'],
  // The hip is a lower-limb joint, but the acetabular/pelvic side of that joint
  // is indexed in the pelvic bucket. Retain pelvis here so exact hip resolution
  // can include both sides of the articulation while name hints still decide
  // which represented structures are actually selected.
  'lower-limb': ['pelvis', 'paha', 'tungkai'],
  // The axial spine spans several longitudinal body-index regions. Deliberately
  // exclude limb buckets so a generic vertebral/nerve hint cannot jump into an
  // appendicular mesh merely because the source name happens to overlap.
  'spine-back': ['leher', 'toraks', 'abdomen', 'pelvis'],
}

const BODY_INDEX_REGIONS_BY_SOURCE_NAME = (() => {
  const out = new Map<string, Set<string>>()
  for (const structure of INDEKS_TUBUH) {
    const regions = out.get(structure.n) ?? new Set<string>()
    regions.add(structure.w)
    out.set(structure.n, regions)
  }
  return out
})()

function buildIndexedSnapshot(): readonly AnatomySourceNodeBundle[] {
  const grouped = new Map<string, string[]>()
  for (const structure of INDEKS_TUBUH) {
    const file = FILE_BY_LAYER[structure.l]
    const names = grouped.get(file) ?? []
    names.push(structure.n)
    grouped.set(file, names)
  }

  return [...grouped.entries()]
    .map(([file, rawNames]) => ({
      file,
      names: [...new Set(rawNames.map((name) => name.trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.file.localeCompare(b.file))
}

/**
 * Canonical source-name fallback generated from the metadata of the GLB files
 * themselves. It proves that a named mesh is present in the shipped source
 * bundle; it does NOT mean that the corresponding layer is currently loaded
 * in the WebGL scene.
 */
export const INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT = buildIndexedSnapshot()

let snapshot: readonly AnatomySourceNodeBundle[] = []
let effectiveSnapshot: readonly AnatomySourceNodeBundle[] = INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT
let sourceSelection: AnatomySourceSelection = { name: '', file: null, revision: 0 }

function rebuildSnapshot() {
  snapshot = [...bundles.entries()]
    .map(([file, names]) => ({ file, names }))
    .sort((a, b) => a.file.localeCompare(b.file))

  const runtimeByFile = new Map(snapshot.map((bundle) => [bundle.file, bundle.names] as const))
  const indexedFiles = new Set(INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT.map((bundle) => bundle.file))
  effectiveSnapshot = [
    ...INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT.map((bundle) => ({
      file: bundle.file,
      names: runtimeByFile.get(bundle.file) ?? bundle.names,
    })),
    ...snapshot.filter((bundle) => !indexedFiles.has(bundle.file)),
  ].sort((a, b) => a.file.localeCompare(b.file))
}

function notify() {
  rebuildSnapshot()
  for (const listener of listeners) listener()
}

function notifySelection() {
  for (const listener of selectionListeners) listener()
}

function sameNames(a: readonly string[] | undefined, b: readonly string[]) {
  return Boolean(a) && a!.length === b.length && a!.every((name, index) => name === b[index])
}

export function publishAnatomySourceNodes(file: string, rawNames: readonly string[]) {
  const key = file.trim()
  if (!key) return

  const names = [...new Set(rawNames.map((name) => name.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))

  if (!names.length) {
    if (!bundles.delete(key)) return
    notify()
    return
  }

  if (sameNames(bundles.get(key), names)) return
  bundles.set(key, names)
  notify()
}

export function clearAnatomySourceNodes(file: string) {
  publishAnatomySourceNodes(file, [])
}

export function clearAllAnatomySourceNodes() {
  if (!bundles.size) return
  bundles.clear()
  notify()
}

export function subscribeAnatomySourceNodes(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Runtime-only bundles explicitly published by a mounted renderer. */
export function getAnatomySourceNodeSnapshot() {
  return snapshot
}

/**
 * Effective source-name catalogue. Runtime names replace the generated GLB
 * index only for the same file; unloaded files retain their generated index.
 */
export function getEffectiveAnatomySourceNodeSnapshot() {
  return effectiveSnapshot
}

export function anatomySourceNodeOrigin(file: string): AnatomySourceNodeOrigin {
  return bundles.has(file) ? 'runtime' : 'generated-index'
}

export const EMPTY_ANATOMY_SOURCE_NODE_SNAPSHOT: readonly AnatomySourceNodeBundle[] = []

/**
 * Publish one exact source node picked by the shared 3D viewer. This tiny
 * external store lets lazily-mounted atlas panels recover the latest viewer
 * selection without coupling the renderer to one specific UI tab.
 */
export function publishAnatomySourceSelection(name: string, file?: string | null) {
  const normalizedName = name.trim()
  if (!normalizedName) return
  sourceSelection = {
    name: normalizedName,
    file: file?.trim() || null,
    revision: sourceSelection.revision + 1,
  }
  notifySelection()
}

export function clearAnatomySourceSelection() {
  if (!sourceSelection.name && !sourceSelection.file) return
  sourceSelection = { name: '', file: null, revision: sourceSelection.revision + 1 }
  notifySelection()
}

export function subscribeAnatomySourceSelection(listener: Listener) {
  selectionListeners.add(listener)
  return () => selectionListeners.delete(listener)
}

export function getAnatomySourceSelectionSnapshot() {
  return sourceSelection
}

export function normalizeAnatomySourceName(value: string) {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function tokenMatches(sourceToken: string, hintToken: string) {
  // Very short terms must be exact tokens: "hip" must never resolve
  // "hippocampus". Longer reviewed stems such as "bronch" and "glute" may
  // safely resolve source tokens such as "bronchus" and "gluteus".
  return sourceToken === hintToken || (hintToken.length >= 5 && sourceToken.startsWith(hintToken))
}

/**
 * Match a reviewed lookup hint against a contiguous source-name token sequence.
 * Short tokens stay exact, while stems of five or more characters may match the
 * beginning of a source token. This keeps "hip" away from "hippocampus" while
 * allowing catalogue stems such as "bronch" -> "bronchus".
 */
export function anatomySourceNameMatchesHint(sourceName: string, hint: string) {
  const sourceTokens = normalizeAnatomySourceName(sourceName).split(' ').filter(Boolean)
  const hintTokens = normalizeAnatomySourceName(hint).split(' ').filter(Boolean)
  if (!sourceTokens.length || !hintTokens.length || hintTokens.length > sourceTokens.length) return false

  for (let start = 0; start <= sourceTokens.length - hintTokens.length; start += 1) {
    let matches = true
    for (let offset = 0; offset < hintTokens.length; offset += 1) {
      if (!tokenMatches(sourceTokens[start + offset], hintTokens[offset])) {
        matches = false
        break
      }
    }
    if (matches) return true
  }
  return false
}

/**
 * Find reviewed catalogue targets that genuinely correspond to one exact source
 * mesh name. The source file, when known, constrains the layer first. No fuzzy
 * ranking is used: ambiguity remains ambiguity instead of forcing a mesh into a
 * clinically different teaching target (for example femur -> hip vs knee).
 */
export function findReviewedAtlasTargetsForSourceSelection(
  selection: Pick<AnatomySourceSelection, 'name' | 'file'>,
): ReviewedAtlasSourceTarget[] {
  const sourceName = selection.name.trim()
  if (!sourceName) return []

  const matches: ReviewedAtlasSourceTarget[] = []
  for (const region of WHOLE_BODY_REGIONS) {
    for (const structure of region.structures) {
      if (structure.provenance === 'not-represented') continue
      if (selection.file && FILE_BY_LAYER[structure.layer] !== selection.file) continue
      if (!structure.nodeHints.some((hint) => anatomySourceNameMatchesHint(sourceName, hint))) continue
      matches.push({
        key: `${region.key}:${structure.id}`,
        region: region.key,
        structureId: structure.id,
        label: structure.label,
        layer: structure.layer,
      })
    }
  }
  return matches
}

export function resolveReviewedAtlasTargetForSourceSelection(
  selection: Pick<AnatomySourceSelection, 'name' | 'file'>,
): ReviewedAtlasSourceTarget | null {
  const matches = findReviewedAtlasTargetsForSourceSelection(selection)
  return matches.length === 1 ? matches[0] : null
}

/**
 * Restrict exact GLB source names to the body-index regions represented by one
 * reviewed atlas region. Runtime names that cannot be tied back to the shipped
 * generated metadata are excluded here rather than guessed into a region.
 */
export function filterAnatomySourceBundlesForAtlasRegion(
  sourceBundles: readonly AnatomySourceNodeBundle[],
  region: AtlasRegionKey,
): AnatomySourceNodeBundle[] {
  const allowedRegions = new Set(BODY_INDEX_REGIONS_BY_ATLAS[region])
  return sourceBundles
    .map((bundle) => ({
      file: bundle.file,
      names: bundle.names.filter((name) => {
        const sourceRegions = BODY_INDEX_REGIONS_BY_SOURCE_NAME.get(name)
        return Boolean(sourceRegions && [...sourceRegions].some((sourceRegion) => allowedRegions.has(sourceRegion)))
      }),
    }))
    .filter((bundle) => bundle.names.length > 0)
}

function sameReviewedHints(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((hint, index) => hint === b[index])
}

function reviewedAtlasRegionsForHints(nodeHints: readonly string[]) {
  return WHOLE_BODY_REGIONS
    .filter((region) => region.structures.some((structure) => sameReviewedHints(structure.nodeHints, nodeHints)))
    .map((region) => region.key)
}

function regionScopeReviewedBundles(
  nodeHints: readonly string[],
  sourceBundles: readonly AnatomySourceNodeBundle[],
) {
  const regions = reviewedAtlasRegionsForHints(nodeHints)
  if (!regions.length) return sourceBundles

  const namesByFile = new Map<string, Set<string>>()
  for (const region of regions) {
    for (const bundle of filterAnatomySourceBundlesForAtlasRegion(sourceBundles, region)) {
      const names = namesByFile.get(bundle.file) ?? new Set<string>()
      for (const name of bundle.names) names.add(name)
      namesByFile.set(bundle.file, names)
    }
  }

  return sourceBundles
    .map((bundle) => ({
      file: bundle.file,
      names: [...(namesByFile.get(bundle.file) ?? [])],
    }))
    .filter((bundle) => bundle.names.length > 0)
}

function matchesForHint(
  hint: string,
  sourceBundles: readonly AnatomySourceNodeBundle[],
  maxNamesPerBundle: number,
  seenByFile?: Map<string, Set<string>>,
) {
  return sourceBundles
    .map((bundle) => {
      const seen = seenByFile?.get(bundle.file) ?? new Set<string>()
      if (seenByFile && !seenByFile.has(bundle.file)) seenByFile.set(bundle.file, seen)
      const names = bundle.names
        .filter((name) => !seen.has(name) && anatomySourceNameMatchesHint(name, hint))
        .slice(0, maxNamesPerBundle)
      if (seenByFile) for (const name of names) seen.add(name)
      return { file: bundle.file, hint, names }
    })
    .filter((entry) => entry.names.length > 0)
}

/**
 * Resolve ordered hints as specificity fallbacks. The first hint that yields a
 * source-node match wins. Use this for queries such as ["carotid", "artery"]
 * where a broad fallback must not drown out a reviewed specific target.
 */
export function resolveAnatomySourceNodes(
  nodeHints: readonly string[],
  sourceBundles: readonly AnatomySourceNodeBundle[],
  maxNamesPerBundle = 8,
): AnatomySourceNodeMatch[] {
  for (const hint of nodeHints) {
    const matches = matchesForHint(hint, sourceBundles, maxNamesPerBundle)
    if (matches.length) return matches
  }
  return []
}

/**
 * Resolve every reviewed component hint for composite atlas targets such as
 * "Heart & great vessels" or "Knee complex". Each component may contribute a
 * bounded set of exact source nodes, while duplicates across overlapping hints
 * are suppressed. When the complete hint list exactly belongs to a reviewed
 * WHOLE_BODY_REGIONS target, candidates are additionally constrained to that
 * target's body region before name matching. Generic callers with arbitrary
 * hints keep the existing source-bundle behavior.
 */
export function resolveAllAnatomySourceNodes(
  nodeHints: readonly string[],
  sourceBundles: readonly AnatomySourceNodeBundle[],
  maxNamesPerBundle = 8,
): AnatomySourceNodeMatch[] {
  const resolved: AnatomySourceNodeMatch[] = []
  const seenByFile = new Map<string, Set<string>>()
  const scopedBundles = regionScopeReviewedBundles(nodeHints, sourceBundles)
  for (const hint of nodeHints) {
    resolved.push(...matchesForHint(hint, scopedBundles, maxNamesPerBundle, seenByFile))
  }
  return resolved
}
