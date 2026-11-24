/**
 * Server-side RBAC and state partitioning for Calendar OS, OR Scheduler, and Keep Tasks.
 * Strictly separates per-user personal workspace from clinical/OR schedule (staff RBAC only).
 */

export interface SchedulingActor {
  readonly id: string
  readonly role: string
  readonly isOwner?: boolean
}

export interface ServerSchedulingWorkspaceState {
  readonly personalByUser: Record<string, { readonly events: unknown[]; readonly notes: unknown[]; readonly updatedAtIso: string }>
  readonly clinical: {
    readonly events: unknown[]
    readonly orCases: unknown[]
    readonly notes: unknown[]
    readonly updatedAtIso: string
    readonly updatedBy: string
  }
}

const CLINICAL_SCHEDULING_ROLES = new Set(['dokter', 'perawat', 'admin', 'owner'])

export function canAccessClinicalScheduling(actor: SchedulingActor): boolean {
  return Boolean(actor.isOwner) || CLINICAL_SCHEDULING_ROLES.has(actor.role)
}

export function emptySchedulingState(): ServerSchedulingWorkspaceState {
  return {
    personalByUser: {},
    clinical: { events: [], orCases: [], notes: [], updatedAtIso: '', updatedBy: '' },
  }
}

export function readSchedulingStateForActor(
  state: ServerSchedulingWorkspaceState | undefined,
  actor: SchedulingActor,
) {
  const s = state ?? emptySchedulingState()
  const personal = s.personalByUser[actor.id] ?? { events: [], notes: [], updatedAtIso: '' }
  return {
    personal,
    clinical: canAccessClinicalScheduling(actor) ? s.clinical : null,
  }
}

export function writeSchedulingStateForActor(
  prevState: ServerSchedulingWorkspaceState | undefined,
  actor: SchedulingActor & { readonly name: string },
  payload: {
    readonly personal?: { readonly events: unknown[]; readonly notes: unknown[] }
    readonly clinical?: { readonly events: unknown[]; readonly orCases: unknown[]; readonly notes: unknown[] }
  },
  nowIso: string,
): { readonly ok: true; readonly nextState: ServerSchedulingWorkspaceState } | { readonly ok: false; readonly statusCode: 403; readonly error: string } {
  if (payload.clinical !== undefined && !canAccessClinicalScheduling(actor)) {
    return { ok: false, statusCode: 403, error: 'clinical_scheduling_forbidden' }
  }
  const base = prevState ?? emptySchedulingState()
  const nextPersonal = payload.personal
    ? {
        ...base.personalByUser,
        [actor.id]: {
          events: Array.isArray(payload.personal.events) ? payload.personal.events : [],
          notes: Array.isArray(payload.personal.notes) ? payload.personal.notes : [],
          updatedAtIso: nowIso,
        },
      }
    : base.personalByUser

  const nextClinical = payload.clinical
    ? {
        events: Array.isArray(payload.clinical.events) ? payload.clinical.events : [],
        orCases: Array.isArray(payload.clinical.orCases) ? payload.clinical.orCases : [],
        notes: Array.isArray(payload.clinical.notes) ? payload.clinical.notes : [],
        updatedAtIso: nowIso,
        updatedBy: actor.name,
      }
    : base.clinical

  return {
    ok: true,
    nextState: { personalByUser: nextPersonal, clinical: nextClinical },
  }
}
