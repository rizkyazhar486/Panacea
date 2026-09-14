import { HelpServicesWorkspace } from './HelpServicesWorkspace'

// Compatibility surface for global feature search after Clinical moved into the
// unified services workspace. Navigation remains provided by the shared catalog.
export const GROUPS: { tools: { to: string; name: string; kw?: string }[] }[] = []

export function ClinicalHub() {
  return <HelpServicesWorkspace />
}

export default ClinicalHub
