import type { BodyProjectionTarget } from '../bodyProjectionContract'
import type { AnatomyResolution, AnatomyStructure } from './types'
import { AnatomyResolver } from './resolver'

export interface BodyProjectionAtlasBridgeResult {
  targetId: string
  structures: readonly AnatomyStructure[]
  unresolvedHints: readonly string[]
  ambiguousHints: readonly string[]
  resolutions: readonly AnatomyResolution[]
}

export function resolveProjectionTargetToAtlas(target: BodyProjectionTarget, resolver: AnatomyResolver): BodyProjectionAtlasBridgeResult {
  const resolutions = target.anatomyHints.map((hint) => resolver.resolve(hint, { mode: 'composite' }))
  const structures = new Map<string, AnatomyStructure>()
  const unresolvedHints: string[] = []
  const ambiguousHints: string[] = []
  resolutions.forEach((resolution, index) => {
    if (resolution.status === 'not-found') unresolvedHints.push(target.anatomyHints[index])
    if (resolution.status === 'ambiguous') ambiguousHints.push(target.anatomyHints[index])
    for (const candidate of resolution.candidates) structures.set(candidate.structure.id, candidate.structure)
  })
  return {
    targetId: target.id,
    structures: [...structures.values()].sort((a, b) => a.id.localeCompare(b.id)),
    unresolvedHints,
    ambiguousHints,
    resolutions,
  }
}
