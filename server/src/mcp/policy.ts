import type { McpTransportKind, PanaceaToolDefinition, PolicyDecision } from './types.js'

export function authorizeTool(
  def: PanaceaToolDefinition,
  transport: McpTransportKind,
): PolicyDecision {
  if (!def.transports.includes(transport)) {
    return { allowed: false, code: 'policy_denied' }
  }
  if (transport === 'http' && def.sideEffect !== 'none') {
    return { allowed: false, code: 'policy_denied' }
  }
  return { allowed: true }
}
