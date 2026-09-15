import { HelpServicesWorkspace } from './HelpServicesWorkspace'

export const GROUPS: { tools: { to: string; name: string; kw?: string }[] }[] = []

export function ClinicalHub() {
  return <HelpServicesWorkspace />
}

export default ClinicalHub
