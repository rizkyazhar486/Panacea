import { INDEKS_TUBUH, type StrukturTubuh } from './bodyIndex.gen'

export interface AnatomySourceNodeBundle {
  file: string
  names: readonly string[]
}

export interface AnatomySourceNodeMatch {
  file: string
  hint: string
  names: readonly string[]
}

export type AnatomySourceNodeOrigin = 'runtime' | 'generated-index'

type Listener = () => void

const listeners = new Set<Listener>()
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
 * are suppressed. This is deliberately separate from specificity-fallback
 * resolution so generic search behavior remains fail-closed.
 */
export function resolveAllAnatomySourceNodes(
  nodeHints: readonly string[],
  sourceBundles: readonly AnatomySourceNodeBundle[],
  maxNamesPerBundle = 8,
): AnatomySourceNodeMatch[] {
  const resolved: AnatomySourceNodeMatch[] = []
  const seenByFile = new Map<string, Set<string>>()
  for (const hint of nodeHints) {
    resolved.push(...matchesForHint(hint, sourceBundles, maxNamesPerBundle, seenByFile))
  }
  return resolved
}
