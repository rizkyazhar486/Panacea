import { HelpServicesWorkspace } from './HelpServicesWorkspace'

/**
 * Legacy lazy-search catalogue compatibility.
 *
 * ClinicalHub is now a thin route alias for HelpServicesWorkspace, while the
 * global search loader still imports `GROUPS` lazily from this module. Keep a
 * typed empty catalogue during the route transition so the global catalogue can
 * continue loading instead of failing the whole Promise.all result.
 */
export const GROUPS: { tools: { to: string; name: string; kw?: string }[] }[] = []

export function ClinicalHub() {
  return <HelpServicesWorkspace />
}

export default ClinicalHub
