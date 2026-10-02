import type { Object3D } from 'three'
import {
  clearBodyAtlasRuntimeRoot,
  clearBodyAtlasRuntimeRoots,
  createBodyAtlasRuntimeRootOwner,
  publishBodyAtlasRuntimeRoot,
  type BodyAtlasRuntimeRootOwner,
} from './bodyAtlasRuntimeRoots'

export interface BodyAtlasRuntimeRootLifecycle {
  readonly owner: BodyAtlasRuntimeRootOwner
  readonly active: boolean
  publish(file: string, root: Object3D): boolean
  clear(file: string): boolean
  dispose(): number
}

/**
 * Owner-scoped lifecycle adapter for one mounted Body3D renderer instance.
 *
 * This adapter is intentionally runtime-only. It never loads, clones,
 * transforms, disposes, or interprets anatomy. It only coordinates exact
 * Object3D root publication/cleanup through bodyAtlasRuntimeRoots.
 *
 * Once disposed, the lifecycle is permanently closed and cannot republish
 * stale roots. Roots replaced by a newer owner are preserved by the underlying
 * owner-safe registry.
 */
export function createBodyAtlasRuntimeRootLifecycle(
  label = 'Body3D',
): BodyAtlasRuntimeRootLifecycle {
  const owner = createBodyAtlasRuntimeRootOwner(label)
  let active = true

  return Object.freeze({
    owner,
    get active() {
      return active
    },
    publish(file: string, root: Object3D) {
      if (!active) return false
      return publishBodyAtlasRuntimeRoot(owner, file, root)
    },
    clear(file: string) {
      if (!active) return false
      return clearBodyAtlasRuntimeRoot(owner, file)
    },
    dispose() {
      if (!active) return 0
      active = false
      return clearBodyAtlasRuntimeRoots(owner)
    },
  })
}
