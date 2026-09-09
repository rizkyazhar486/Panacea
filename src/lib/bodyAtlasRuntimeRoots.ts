import type { Object3D } from 'three'
import { BODY_ATLAS_ASSET_MANIFEST } from './bodyAtlasStreaming'

export interface BodyAtlasRuntimeRootOwner {
  readonly id: symbol
  readonly label: string
}

export interface BodyAtlasRuntimeSourceRoot {
  readonly file: string
  readonly root: Object3D
}

interface BodyAtlasRuntimeRootEntry extends BodyAtlasRuntimeSourceRoot {
  readonly owner: BodyAtlasRuntimeRootOwner
}

const allowedFiles = new Set(BODY_ATLAS_ASSET_MANIFEST.map((asset) => asset.file))
const entries = new Map<string, BodyAtlasRuntimeRootEntry>()

/**
 * Create an opaque runtime owner for one mounted Body3D renderer lifecycle.
 * Owner identity is object/symbol based; labels are diagnostics only.
 */
export function createBodyAtlasRuntimeRootOwner(label = 'Body3D'): BodyAtlasRuntimeRootOwner {
  return Object.freeze({ id: Symbol(label), label: label.trim() || 'Body3D' })
}

/**
 * Publish the exact Object3D root already owned by the mounted Body3D viewer.
 * This registry never clones, loads, transforms, disposes, or mutates geometry.
 * A newer owner may replace the same file; stale owners cannot later clear it.
 */
export function publishBodyAtlasRuntimeRoot(
  owner: BodyAtlasRuntimeRootOwner,
  file: string,
  root: Object3D,
): boolean {
  const key = file.trim()
  if (!key || !allowedFiles.has(key)) return false
  if (!root) return false

  const current = entries.get(key)
  if (current?.owner === owner && current.root === root) return true
  entries.set(key, { owner, file: key, root })
  return true
}

/** Clear one file only when the caller still owns the current publication. */
export function clearBodyAtlasRuntimeRoot(owner: BodyAtlasRuntimeRootOwner, file: string): boolean {
  const key = file.trim()
  const current = entries.get(key)
  if (!current || current.owner !== owner) return false
  entries.delete(key)
  return true
}

/**
 * Clear every root still owned by this viewer. Entries replaced by a newer
 * viewer survive stale unmount cleanup.
 */
export function clearBodyAtlasRuntimeRoots(owner: BodyAtlasRuntimeRootOwner): number {
  let cleared = 0
  for (const [file, entry] of entries) {
    if (entry.owner !== owner) continue
    entries.delete(file)
    cleared += 1
  }
  return cleared
}

/** Runtime-only exact root. No generated-index or inferred fallback exists. */
export function getBodyAtlasRuntimeRoot(file: string): Object3D | null {
  return entries.get(file.trim())?.root ?? null
}

/**
 * Read-only runtime snapshot suitable for exact source-mesh intersection.
 * It returns the same Object3D identities owned by Body3D; callers must not
 * dispose or mutate them through this registry.
 */
export function getBodyAtlasRuntimeSourceRoots(): readonly BodyAtlasRuntimeSourceRoot[] {
  return [...entries.values()]
    .map(({ file, root }) => ({ file, root }))
    .sort((a, b) => a.file.localeCompare(b.file))
}

export function isBodyAtlasRuntimeRootLoaded(file: string): boolean {
  return entries.has(file.trim())
}

export function bodyAtlasRuntimeRootCount(): number {
  return entries.size
}
