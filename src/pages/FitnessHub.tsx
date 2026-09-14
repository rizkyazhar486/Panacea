import { UnifiedBodyWorkspace } from './UnifiedBodyWorkspace'

// Backward-compatible catalog surface for global search while FitnessHub is now
// rendered through the unified body workspace. New workspace routes are already
// indexed from navigation, so this intentionally contributes no duplicate tools.
export const GROUPS: { tools: { to: string; name: string; kw?: string }[] }[] = []

export function FitnessHub() {
  return <UnifiedBodyWorkspace />
}

export default FitnessHub
