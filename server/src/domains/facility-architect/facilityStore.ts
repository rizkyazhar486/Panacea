/**
 * Server-side RBAC, tenant boundary, and atomic bed transition validation for Facility Architect OS.
 * Pure helpers (no direct DB I/O) so unit tests verify RBAC & 409 double-occupancy conflicts cleanly.
 */

export interface FacilityActor {
  readonly id: string
  readonly role: string
  readonly isOwner?: boolean
  readonly facilityId?: string
}

export interface ServerBedElement {
  id: string
  kind?: string
  label: string
  bedStatus?: string
  pjNurse?: string
  patientId?: string
  patientLabel?: string
  encounterId?: string
  [key: string]: unknown
}

export interface ServerFloorLayer {
  floorId: string
  floorName: string
  elements: ServerBedElement[]
  [key: string]: unknown
}

export interface ServerFacilityLayoutRecord {
  facilityId: string
  facilityName: string
  facilityType: string
  floors: ServerFloorLayer[]
  updatedAtIso: string
  updatedBy: string
  [key: string]: unknown
}

const FACILITY_STAFF_ROLES = new Set(['dokter', 'perawat', 'admin', 'owner'])

export function canReadFacilityLayouts(actor: FacilityActor): boolean {
  return Boolean(actor.isOwner) || FACILITY_STAFF_ROLES.has(actor.role)
}

export function canWriteFacilityLayout(actor: FacilityActor, targetFacilityId: string): boolean {
  if (!canReadFacilityLayouts(actor)) return false
  if (actor.isOwner || actor.role === 'owner') return true
  if (actor.facilityId && actor.facilityId !== targetFacilityId) return false
  return true
}

export type ServerBedTransitionAction =
  | { type: 'admit'; bedId: string; patientId: string; patientLabel: string; encounterId?: string; pjNurse?: string }
  | { type: 'status'; bedId: string; bedStatus: string; pjNurse?: string }
  | { type: 'swap'; bedAId: string; bedBId: string }

function findAllBeds(record: ServerFacilityLayoutRecord): ServerBedElement[] {
  return record.floors.flatMap((f) => f.elements)
}

export function applyServerBedTransition(
  record: ServerFacilityLayoutRecord,
  action: ServerBedTransitionAction,
  actorName: string,
  nowIso: string,
):
  | { readonly ok: true; readonly record: ServerFacilityLayoutRecord }
  | { readonly ok: false; readonly statusCode: 400 | 404 | 409; readonly error: string } {
  const all = findAllBeds(record)

  if (action.type === 'admit') {
    const bed = all.find((b) => b.id === action.bedId)
    if (!bed) return { ok: false, statusCode: 404, error: 'bed_not_found' }
    if (bed.bedStatus !== 'Available' && bed.bedStatus !== 'Reserved') {
      return { ok: false, statusCode: 409, error: 'bed_not_available' }
    }
    const alreadyInBed = all.find(
      (b) => b.patientId === action.patientId && (b.bedStatus === 'Occupied' || b.bedStatus === 'Isolation'),
    )
    if (alreadyInBed) {
      return { ok: false, statusCode: 409, error: 'double_occupancy_prevented' }
    }
    const next: ServerFacilityLayoutRecord = {
      ...record,
      updatedAtIso: nowIso,
      updatedBy: actorName,
      floors: record.floors.map((f) => ({
        ...f,
        elements: f.elements.map((e) =>
          e.id === action.bedId
            ? {
                ...e,
                bedStatus: 'Occupied',
                patientId: action.patientId,
                patientLabel: action.patientLabel,
                encounterId: action.encounterId,
                pjNurse: action.pjNurse || e.pjNurse,
              }
            : e,
        ),
      })),
    }
    return { ok: true, record: next }
  }

  if (action.type === 'status') {
    const bed = all.find((b) => b.id === action.bedId)
    if (!bed) return { ok: false, statusCode: 404, error: 'bed_not_found' }
    const clearPatient =
      action.bedStatus === 'Available' ||
      action.bedStatus === 'Awaiting cleaning' ||
      action.bedStatus === 'Cleaning' ||
      action.bedStatus === 'Maintenance' ||
      action.bedStatus === 'Out of service'
    const next: ServerFacilityLayoutRecord = {
      ...record,
      updatedAtIso: nowIso,
      updatedBy: actorName,
      floors: record.floors.map((f) => ({
        ...f,
        elements: f.elements.map((e) =>
          e.id === action.bedId
            ? {
                ...e,
                bedStatus: action.bedStatus,
                pjNurse: action.pjNurse ?? e.pjNurse,
                ...(clearPatient ? { patientId: undefined, patientLabel: undefined, encounterId: undefined } : {}),
              }
            : e,
        ),
      })),
    }
    return { ok: true, record: next }
  }

  // atomic swap
  if (action.bedAId === action.bedBId) return { ok: false, statusCode: 400, error: 'same_bed_swap' }
  const bedA = all.find((b) => b.id === action.bedAId)
  const bedB = all.find((b) => b.id === action.bedBId)
  if (!bedA || !bedB) return { ok: false, statusCode: 404, error: 'bed_not_found' }
  const blockedStatuses = new Set(['Maintenance', 'Out of service'])
  if (blockedStatuses.has(bedA.bedStatus ?? '') || blockedStatuses.has(bedB.bedStatus ?? '')) {
    return { ok: false, statusCode: 409, error: 'bed_out_of_service' }
  }
  const next: ServerFacilityLayoutRecord = {
    ...record,
    updatedAtIso: nowIso,
    updatedBy: actorName,
    floors: record.floors.map((f) => ({
      ...f,
      elements: f.elements.map((e) => {
        if (e.id === action.bedAId) {
          return { ...e, bedStatus: bedB.bedStatus, patientId: bedB.patientId, patientLabel: bedB.patientLabel, encounterId: bedB.encounterId }
        }
        if (e.id === action.bedBId) {
          return { ...e, bedStatus: bedA.bedStatus, patientId: bedA.patientId, patientLabel: bedA.patientLabel, encounterId: bedA.encounterId }
        }
        return e
      }),
    })),
  }
  return { ok: true, record: next }
}
