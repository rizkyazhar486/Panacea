export type AgentTaskIntent =
  | 'feature'
  | 'bug'
  | 'medical-evidence'
  | 'body-3d'
  | 'model-selection'
  | 'architecture'
  | 'browser-action'
  | 'analytics'

export type AgentCapabilityRole =
  | 'repository-context'
  | 'repo-validation'
  | 'literature-discovery'
  | 'citation-verification'
  | 'body-3d'
  | 'model-evaluation'
  | 'model-governance'
  | 'architecture-analysis'
  | 'browser-operation'
  | 'product-analytics'

export type AgentPermissionTier =
  | 'read-analyze'
  | 'reversible-draft'
  | 'scoped-reversible-write'
  | 'privileged-external-action'

export interface AgentCapability {
  id: string
  roles: readonly AgentCapabilityRole[]
  permissionTier: AgentPermissionTier
  /** Providers with equivalent behavior share a family and are not selected together by default. */
  overlapFamily?: string
  /** Lower numbers win after role coverage is compared. */
  priority?: number
}

export interface RouteAgentTaskInput {
  intent: AgentTaskIntent
  capabilities: readonly AgentCapability[]
  requestedPermissionTier?: AgentPermissionTier
}

export interface AgentRouteRationale {
  code: 'intent_roles' | 'minimum_cover' | 'anti_overlap' | 'independent_verification' | 'permission'
  detail: string
}

export interface AgentRouteDecision {
  intent: AgentTaskIntent
  requiredRoles: readonly AgentCapabilityRole[]
  selectedCapabilityIds: readonly string[]
  permissionTier: AgentPermissionTier
  requiresExplicitAuthorization: boolean
  rationale: readonly AgentRouteRationale[]
}

export class AgentRoutingError extends Error {
  readonly code = 'routing_unavailable' as const

  constructor(message: string) {
    super(message)
    this.name = 'AgentRoutingError'
  }
}

const PERMISSION_RANK: Record<AgentPermissionTier, number> = {
  'read-analyze': 0,
  'reversible-draft': 1,
  'scoped-reversible-write': 2,
  'privileged-external-action': 3,
}

const INTENT_ROLES: Record<AgentTaskIntent, readonly AgentCapabilityRole[]> = {
  feature: ['repository-context', 'repo-validation'],
  bug: ['repository-context', 'repo-validation'],
  'medical-evidence': ['literature-discovery', 'citation-verification'],
  'body-3d': ['repository-context', 'body-3d', 'repo-validation'],
  'model-selection': ['model-evaluation', 'model-governance'],
  architecture: ['repository-context', 'architecture-analysis'],
  'browser-action': ['browser-operation'],
  analytics: ['product-analytics'],
}

function normalize(capability: AgentCapability): AgentCapability {
  const id = capability.id.trim()
  if (!id) throw new AgentRoutingError('capability id must not be empty')
  if (!capability.roles.length) throw new AgentRoutingError(`${id} must declare at least one role`)
  return {
    ...capability,
    id,
    priority: capability.priority ?? 100,
    overlapFamily: capability.overlapFamily?.trim() || undefined,
  }
}

function maxPermission(a: AgentPermissionTier, b: AgentPermissionTier): AgentPermissionTier {
  return PERMISSION_RANK[a] >= PERMISSION_RANK[b] ? a : b
}

function candidates(
  capabilities: readonly AgentCapability[],
  uncovered: ReadonlySet<AgentCapabilityRole>,
  usedFamilies: ReadonlySet<string>,
): AgentCapability[] {
  return capabilities
    .filter((capability) => capability.roles.some((role) => uncovered.has(role)))
    .filter((capability) => !capability.overlapFamily || !usedFamilies.has(capability.overlapFamily))
    .sort((a, b) => {
      const coverageA = a.roles.filter((role) => uncovered.has(role)).length
      const coverageB = b.roles.filter((role) => uncovered.has(role)).length
      if (coverageA !== coverageB) return coverageB - coverageA
      if ((a.priority ?? 100) !== (b.priority ?? 100)) return (a.priority ?? 100) - (b.priority ?? 100)
      return a.id.localeCompare(b.id)
    })
}

function medicalEvidencePair(capabilities: readonly AgentCapability[]): AgentCapability[] {
  const discovery = capabilities
    .filter((capability) => capability.roles.includes('literature-discovery'))
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.id.localeCompare(b.id))[0]
  if (!discovery) throw new AgentRoutingError('no literature-discovery capability is available')

  const verification = capabilities
    .filter((capability) => capability.id !== discovery.id)
    .filter((capability) => capability.roles.includes('citation-verification'))
    .filter((capability) =>
      !discovery.overlapFamily ||
      !capability.overlapFamily ||
      capability.overlapFamily !== discovery.overlapFamily
    )
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.id.localeCompare(b.id))[0]

  if (!verification) {
    throw new AgentRoutingError(
      'medical-evidence routing requires an independent citation-verification capability',
    )
  }
  return [discovery, verification]
}

/**
 * Deterministically selects the smallest useful capability set for one intent.
 * The router returns a plan only; it executes no tools and grants no permission.
 */
export function routeAgentTask(input: RouteAgentTaskInput): AgentRouteDecision {
  const capabilities = input.capabilities.map(normalize)
  const ids = new Set<string>()
  for (const capability of capabilities) {
    if (ids.has(capability.id)) throw new AgentRoutingError(`duplicate capability id: ${capability.id}`)
    ids.add(capability.id)
  }

  const requiredRoles = [...INTENT_ROLES[input.intent]]
  const selected: AgentCapability[] = []
  const rationale: AgentRouteRationale[] = [{
    code: 'intent_roles',
    detail: `${input.intent} requires: ${requiredRoles.join(', ')}`,
  }]

  if (input.intent === 'medical-evidence') {
    selected.push(...medicalEvidencePair(capabilities))
    rationale.push({
      code: 'independent_verification',
      detail: 'Medical evidence uses separate discovery and citation-verification capabilities.',
    })
  } else {
    const uncovered = new Set<AgentCapabilityRole>(requiredRoles)
    const usedFamilies = new Set<string>()
    while (uncovered.size > 0) {
      const chosen = candidates(capabilities, uncovered, usedFamilies)[0]
      if (!chosen) {
        throw new AgentRoutingError(
          `no non-overlapping capability can cover: ${[...uncovered].join(', ')}`,
        )
      }
      selected.push(chosen)
      if (chosen.overlapFamily) usedFamilies.add(chosen.overlapFamily)
      for (const role of chosen.roles) uncovered.delete(role)
    }
    rationale.push({
      code: 'minimum_cover',
      detail: `Selected ${selected.length} capability set(s) by maximum uncovered-role coverage first.`,
    })
  }

  rationale.push({
    code: 'anti_overlap',
    detail: 'Equivalent capability families are not invoked together by default.',
  })

  let permissionTier = input.requestedPermissionTier ?? 'read-analyze'
  for (const capability of selected) {
    permissionTier = maxPermission(permissionTier, capability.permissionTier)
  }
  const requiresExplicitAuthorization = permissionTier === 'privileged-external-action'
  rationale.push({
    code: 'permission',
    detail: requiresExplicitAuthorization
      ? 'Privileged external action requires explicit authorization before execution.'
      : `Required permission tier: ${permissionTier}.`,
  })

  return {
    intent: input.intent,
    requiredRoles,
    selectedCapabilityIds: selected.map((capability) => capability.id),
    permissionTier,
    requiresExplicitAuthorization,
    rationale,
  }
}
