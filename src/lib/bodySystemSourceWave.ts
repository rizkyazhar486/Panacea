import {
  getEffectiveAnatomySourceNodeSnapshot,
  resolveAllAnatomySourceNodes,
} from './anatomySourceNodeRegistry'

import { BODY_SYSTEM_SOURCE_WAVE } from '../domains/body-exposure/data/bodySystems.ts'

// The data moved to the body-exposure domain (see that file for why); these re-exports keep every existing
// importer working unchanged.
export { BODY_SYSTEM_SOURCE_WAVE } from '../domains/body-exposure/data/bodySystems.ts'
export type { BodySystemId, BodySystemSourceDefinition, BodySystemSourceTarget } from '../domains/body-exposure/data/bodySystems.ts'

export function resolveBodySystemSourceWave() {
  const snapshot = getEffectiveAnatomySourceNodeSnapshot()
  return BODY_SYSTEM_SOURCE_WAVE.map((system) => ({
    ...system,
    targets: system.targets.map((target) => {
      const bundles = snapshot.filter((bundle) => bundle.file === target.file)
      const names = target.allSourceNodes
        ? [...new Set(bundles.flatMap((bundle) => bundle.names))]
        : [...new Set(resolveAllAnatomySourceNodes(target.hints, bundles, 24).flatMap((match) => match.names))]
      return { ...target, names, available: names.length > 0 }
    }),
  }))
}

export function bodySystemSourceCoverage() {
  return resolveBodySystemSourceWave().map((system) => ({
    id: system.id,
    represented: system.targets.filter((target) => target.available).length,
    total: system.targets.length,
  }))
}
