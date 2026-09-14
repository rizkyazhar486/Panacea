import { UnifiedBodyWorkspace } from './UnifiedBodyWorkspace'

// Compatibility surface for global feature search after Fitness moved into the
// unified workspace. Navigation remains provided by the shared app catalog.
export const GROUPS: { tools: { to: string; name: string; kw?: string }[] }[] = []

export function FitnessHub() {
  return <UnifiedBodyWorkspace />
}

export default FitnessHub
