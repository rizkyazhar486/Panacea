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
  /**
   * Keluarga overlap mencegah beberapa provider setara dipanggil bersamaan
   * tanpa alasan verifikasi silang yang eksplisit.
   */
  overlapFamily?: string
  /** Angka lebih kecil dipilih lebih dahulu setelah coverage dibandingkan. */
  priority?: number
}

export interface RouteAgentTaskInput {
  intent: AgentTaskIntent
  capabilities: readonly AgentCapability[]
  requestedPermissionTier?: AgentPermissionTier
  escalationReason?: 'conflict' | 'coverage-gap'
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

function normalizedCapability(capability: AgentCapability): AgentCapability {
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

function deterministicCandidates(
  capabilities: readonly AgentCapability[],
  uncovered: ReadonlySet<AgentCapabilityRole>,
  usedFamilies: ReadonlySet<string>,
): AgentCapability[] {
  return capabilities
    .filter((capability) => capability.roles.some((role) => uncovered.has(role)))
    .filter((capability) => !capability.overlapFamily || !usedFamilies.has(capability.overlapFamily))
    .sort((a, b) => {
      const aCoverage = a.roles.filter((role) => uncovered.has(role)).length
      const bCoverage = b.roles.filter((role) => uncovered.has(role)).length
      if (aCoverage !== bCoverage) return bCoverage - aCoverage
      const aPriority = a.priority ?? 100
      const bPriority = b.priority ?? 100
      if (aPriority !== bPriority) return aPriority - bPriority
      return a.id.localeCompare(b.id)
    })
}

function selectMedicalEvidenceCapabilities(
  capabilities: readonly AgentCapability[],
): AgentCapability[] {
  const discovery = capabilities
    .filter((capability) => capability.roles.includes('literature-discovery'))
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.id.localeCompare(b.id))[0]
  if (!discovery) throw new AgentRoutingError('no literature-discovery capability is available')

  const verification = capabilities
    .filter((capability) => capability.id !== discovery.id)
    .filter((capability) => capability.roles.includes('citation-verification'))
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.id.localeCompare(b.id))[0]
  if (!verification) {
    throw new AgentRoutingError('medical-evidence routing requires an independent citation-verification capability')
  }

  return [discovery, verification]
}

export function routeAgentTask(input: RouteAgentTaskInput): AgentRouteDecision {
  const capabilities = input.capabilities.map(normalizedCapability)
  const ids = new Set<string>()
  for (const capability of capabilities) {
    if (ids.has(capability.id)) throw new AgentRoutingError(`duplicate capability id: ${capability.id}`)
    ids.add(capability.id)
  }

  const requiredRoles = [...INTENT_ROLES[input.intent]]
  const selected: AgentCapability[] = []
  const rationale: AgentRouteRationale[] = [
    {
      code: 'intent_roles',
      detail: `${input.intent} requires: ${requiredRoles.join(', ')}`,
    },
  ]

  if (input.intent === 'medical-evidence') {
    selected.push(...selectMedicalEvidenceCapabilities(capabilities))
    rationale.push({
      code: 'independent_verification',
      detail: 'Medical evidence uses one discovery capability and a separate citation-verification capability.',
    })
  } else {
    const uncovered = new Set<AgentCapabilityRole>(requiredRoles)
    const usedFamilies = new Set<string>()

    while (uncovered.size > 0) {
      const candidates = deterministicCandidates(capabilities, uncovered, usedFamilies)
      const chosen = candidates[0]
      if (!chosen) {
        throw new AgentRoutingError(`no non-overlapping capability can cover: ${[...uncovered].join(', ')}`)
      }

      selected.push(chosen)
      if (chosen.overlapFamily) usedFamilies.add(chosen.overlapFamily)
      for (const role of chosen.roles) uncovered.delete(role)
    }

    rationale.push({
      code: 'minimum_cover',
      detail: `Selected ${selected.length} capability set(s) using maximum uncovered-role coverage first.`,
    })
  }

  const selectedFamilies = selected
    .map((capability) => capability.overlapFamily)
    .filter((family): family is string => Boolean(family))
  if (new Set(selectedFamilies).size !== selectedFamilies.length && !input.escalationReason) {
    throw new AgentRoutingError('overlapping capability families require an explicit conflict or coverage-gap escalation')
  }
  rationale.push({
    code: 'anti_overlap',
    detail: input.escalationReason
      ? `Overlap escalation allowed only for explicit reason: ${input.escalationReason}.`
      : 'Equivalent capability families are not invoked together by default.',
  })

  let permissionTier = input.requestedPermissionTier ?? 'read-analyze'
  for (const capability of selected) {
    permissionTier = maxPermission(permissionTier, capability.permissionTier)
  }

  const requiresExplicitAuthorization = permissionTier === 'privileged-external-action'
  rationale.push({
    code: 'permission',
    detail: requiresExplicitAuthorization
      ? 'Privileged/external action requires explicit authorization before execution.'
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
