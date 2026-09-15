import { HelpServicesWorkspace } from './HelpServicesWorkspace'

/**
 * Global search still lazily imports GROUPS from this legacy route alias.
 * Keep a typed empty catalogue until search owns its catalogue independently,
 * so the alias can remain thin without breaking production TypeScript builds.
 */
export const GROUPS: { tools: { to: string; name: string; kw?: string }[] }[] = []

export function ClinicalHub() {
  return <HelpServicesWorkspace />
}

export default ClinicalHub
