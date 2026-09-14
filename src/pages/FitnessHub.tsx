import { UnifiedBodyWorkspace } from './UnifiedBodyWorkspace'

/**
 * Legacy lazy-search catalogue compatibility.
 *
 * FitnessHub is now a thin route alias for UnifiedBodyWorkspace, but the global
 * search loader still imports `GROUPS` lazily from this module. Keep an empty,
 * typed catalogue here so that the alias transition cannot break TypeScript or
 * abort the rest of the global-search catalogue (notably WellnessHub).
 */
export const GROUPS: { tools: { to: string; name: string; kw?: string }[] }[] = []

export function FitnessHub() {
  return <UnifiedBodyWorkspace />
}

export default FitnessHub
