import { UnifiedBodyWorkspace } from './UnifiedBodyWorkspace'

type SearchTool = { to: string; name: string; kw?: string }

// Compatibility surface for PencarianGlobal after FitnessHub was consolidated
// into UnifiedBodyWorkspace. Navigation remains the canonical fallback until
// workspace-level searchable tools are exported directly.
export const GROUPS: Array<{ tools: SearchTool[] }> = []

export function FitnessHub() {
  return <UnifiedBodyWorkspace />
}

export default FitnessHub
