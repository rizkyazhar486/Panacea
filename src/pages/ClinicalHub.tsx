import { HelpServicesWorkspace } from './HelpServicesWorkspace'

type SearchTool = { to: string; name: string; kw?: string }

// Compatibility surface for PencarianGlobal after ClinicalHub was consolidated
// into HelpServicesWorkspace. Navigation remains the canonical fallback until
// workspace-level searchable tools are exported directly.
export const GROUPS: Array<{ tools: SearchTool[] }> = []

export function ClinicalHub() {
  return <HelpServicesWorkspace />
}

export default ClinicalHub
