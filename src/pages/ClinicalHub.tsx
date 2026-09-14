import { HelpServicesWorkspace } from './HelpServicesWorkspace'

// Backward-compatible catalog surface for global search while ClinicalHub is now
// rendered through the unified help/services workspace. Navigation already owns
// the reachable routes, so this stays empty instead of duplicating stale entries.
export const GROUPS: { tools: { to: string; name: string; kw?: string }[] }[] = []

export function ClinicalHub() {
  return <HelpServicesWorkspace />
}

export default ClinicalHub
