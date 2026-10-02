import type { AnatomySourceNodeBundle } from './anatomySourceNodeRegistry'

export interface ExactAnatomySourceSelection {
  file: string
  name: string
}

/**
 * Resolve only an exact, case-sensitive source-node name that belongs to one
 * and only one anatomy bundle.
 *
 * This helper intentionally does not perform fuzzy, prefix, substring or
 * semantic matching. It is used only to synchronize UI selection state after
 * a surface has already chosen one exact GLTF source name. Ambiguous names
 * remain unresolved instead of being assigned to an arbitrary source bundle.
 */
export function findUniqueExactAnatomySourceNode(
  name: string,
  bundles: readonly AnatomySourceNodeBundle[],
): ExactAnatomySourceSelection | null {
  const requested = name.trim()
  if (!requested) return null

  const matches = bundles
    .filter((bundle) => bundle.names.includes(requested))
    .map((bundle) => ({ file: bundle.file, name: requested }))

  return matches.length === 1 ? matches[0] : null
}
