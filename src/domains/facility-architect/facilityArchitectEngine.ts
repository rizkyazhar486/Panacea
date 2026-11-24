/**
 * Facility Architect OS — Universal Editable Hospital Floor Plan & Live Bed Intelligence Engine.
 * Supports 30 clinical/hospital facility types, default 16-bed IGD layout, multi-floor
 * editing with undo/redo + draft/publish versioning, 10 bed states with atomic swaps,
 * isolated Simulation cloning (never mutates canonical patient records), and transparent Analytics.
 */

export const FACILITY_SCHEMATIC_DISCLAIMER =
  'Denah ini adalah representasi skematik operasional klinis (bukan gambar teknik arsitektur CAD bersertifikat / life-safety).'

export const FACILITY_TYPES = [
  'IGD', 'Trauma Bay', 'Resuscitasi', 'Rawat Inap', 'ICU', 'ICCU', 'NICU', 'PICU', 'HCU',
  'Poliklinik', 'Kamar Operasi (OK)', 'PACU / Recovery', 'PONEK', 'Ruang Bersalin (VK)',
  'Radiologi', 'Laboratorium', 'Farmasi', 'Hemodialisis', 'Rehabilitasi Medik', 'Poli Gigi',
  'Puskesmas', 'Cath Lab', 'Endoskopi', 'Ambulance Bay', 'Isolasi Tekanan Negatif',
  'Kemoterapi / Onkologi', 'Command Center', 'Rumah Sakit Lapangan', 'Diagnostik Terpadu', 'Custom',
] as const

export type FacilityType = (typeof FACILITY_TYPES)[number]

export type VisualizationMode = 'design' | 'operations' | 'clinical' | 'simulation' | 'analytics'

export type BedStatus =
  | 'Available'
  | 'Reserved'
  | 'Occupied'
  | 'Awaiting cleaning'
  | 'Cleaning'
  | 'Isolation'
  | 'Maintenance'
  | 'Out of service'
  | 'Awaiting transfer'
  | 'Pending discharge'

export type ElementKind = 'bed' | 'room' | 'station' | 'corridor' | 'equipment' | 'placeholder'
export type TriageZone = 'merah' | 'kuning' | 'hijau' | 'poned' | 'resus' | 'support' | 'unseen_placeholder'

export interface FacilityElement {
  readonly id: string
  readonly kind: ElementKind
  readonly label: string
  readonly zone: TriageZone
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly rotationDeg: number
  readonly locked: boolean
  readonly customColor?: string
  readonly bedStatus?: BedStatus
  readonly pjNurse?: string
  readonly patientId?: string
  readonly patientLabel?: string
  readonly encounterId?: string
  readonly chiefComplaintSummary?: string
}

export interface FloorPlanLayer {
  readonly floorId: string
  readonly floorName: string
  readonly gridSize: number
  readonly elements: readonly FacilityElement[]
}

export interface FloorPlanVersionSnapshot {
  readonly version: number
  readonly status: 'draft' | 'published'
  readonly savedAtIso: string
  readonly savedBy: string
  readonly floors: readonly FloorPlanLayer[]
}

export interface FacilityLayoutState {
  readonly facilityId: string
  readonly facilityName: string
  readonly facilityType: FacilityType
  readonly isSimulation: boolean
  readonly activeFloorId: string
  readonly snapToGrid: boolean
  readonly floors: readonly FloorPlanLayer[]
  readonly past: readonly (readonly FloorPlanLayer[])[]
  readonly future: readonly (readonly FloorPlanLayer[])[]
  readonly versions: readonly FloorPlanVersionSnapshot[]
  readonly updatedAtIso: string
}

function makeEl(
  id: string,
  kind: ElementKind,
  label: string,
  zone: TriageZone,
  x: number,
  y: number,
  w: number,
  h: number,
  bedStatus?: BedStatus,
): FacilityElement {
  return {
    id,
    kind,
    label,
    zone,
    x,
    y,
    w,
    h,
    rotationDeg: 0,
    locked: false,
    ...(bedStatus ? { bedStatus, pjNurse: kind === 'bed' ? 'PJ Belum Ditunjuk' : undefined } : {}),
  }
}

export function createDefaultIgdAdventTemplate(nowIso: string): FacilityLayoutState {
  const floor1: FloorPlanLayer = {
    floorId: 'floor-1',
    floorName: 'Lantai 1 — IGD Utama (~16 Bed)',
    gridSize: 10,
    elements: [
      makeEl('corridor-kitchen', 'corridor', 'Jalan ke Kamar Jaga & Dapur', 'support', 10, 10, 220, 40),
      makeEl('room-tindakan', 'room', 'R. Tindakan', 'support', 240, 10, 110, 50),
      makeEl('room-radiologi', 'room', 'Radiologi', 'support', 360, 10, 180, 50),
      makeEl('corridor-exit', 'corridor', 'Jalan Keluar', 'support', 550, 10, 90, 50),
      makeEl('room-ponek', 'room', 'R. PONEK', 'poned', 10, 70, 120, 70),
      makeEl('room-neonatus', 'room', 'R. Neonatus', 'poned', 10, 150, 120, 70),
      makeEl('room-resus', 'room', 'R. Resus (Bed Resus)', 'resus', 10, 230, 120, 80, 'Available'),
      makeEl('bed-4', 'bed', 'Bed 4 (Merah)', 'merah', 140, 70, 100, 65, 'Available'),
      makeEl('bed-5', 'bed', 'Bed 5 (Merah)', 'merah', 140, 145, 100, 65, 'Available'),
      makeEl('bed-6', 'bed', 'Bed 6 (Merah)', 'merah', 140, 220, 100, 65, 'Available'),
      makeEl('hall-kursi-roda', 'corridor', 'HALL (Kursi Roda)', 'support', 250, 70, 90, 220),
      makeEl('bed-3', 'bed', 'Bed 3 (Kuning)', 'kuning', 350, 70, 100, 65, 'Available'),
      makeEl('bed-2', 'bed', 'Bed 2 (Kuning)', 'kuning', 350, 145, 100, 65, 'Available'),
      makeEl('bed-1', 'bed', 'Bed 1 (Merah)', 'merah', 350, 220, 100, 65, 'Available'),
      makeEl('bed-c', 'bed', 'Bed C (Hijau)', 'hijau', 460, 70, 100, 65, 'Available'),
      makeEl('bed-b', 'bed', 'Bed B (Hijau)', 'hijau', 460, 145, 100, 65, 'Available'),
      makeEl('bed-a', 'bed', 'Bed A (Hijau)', 'hijau', 460, 220, 100, 65, 'Available'),
      makeEl('placeholder-far-right', 'placeholder', 'Bed Ekstensi / Isolasi (Editable Placeholder)', 'unseen_placeholder', 570, 70, 90, 215, 'Available'),
      makeEl('toilet-staff', 'room', 'Toilet Staff (belakang meja)', 'support', 10, 320, 110, 60),
      makeEl('meja-dokter', 'station', 'Meja Dokter', 'support', 130, 320, 110, 60),
      makeEl('nurse-station', 'station', 'Nurse Station', 'support', 250, 320, 200, 60),
      makeEl('jalan-masuk-igd', 'corridor', 'Jalan Masuk IGD', 'support', 460, 320, 180, 60),
    ],
  }
  return {
    facilityId: 'fac-igd-default',
    facilityName: 'IGD RSU Advent (Template Default)',
    facilityType: 'IGD',
    isSimulation: false,
    activeFloorId: floor1.floorId,
    snapToGrid: true,
    floors: [floor1],
    past: [],
    future: [],
    versions: [{ version: 1, status: 'published', savedAtIso: nowIso, savedBy: 'System Template', floors: [floor1] }],
    updatedAtIso: nowIso,
  }
}

function updateActiveFloor(
  state: FacilityLayoutState,
  nowIso: string,
  updater: (floor: FloorPlanLayer) => FloorPlanLayer,
): FacilityLayoutState {
  const nextFloors = state.floors.map((f) => (f.floorId === state.activeFloorId ? updater(f) : f))
  return {
    ...state,
    past: [...state.past.slice(-19), state.floors],
    future: [],
    floors: nextFloors,
    updatedAtIso: nowIso,
  }
}

export function snapCoord(val: number, gridSize: number, enabled: boolean): number {
  if (!enabled || gridSize <= 1) return Math.round(val)
  return Math.round(val / gridSize) * gridSize
}

export function addFacilityElement(
  state: FacilityLayoutState,
  el: Omit<FacilityElement, 'id'>,
  nowIso: string,
): FacilityLayoutState {
  return updateActiveFloor(state, nowIso, (f) => ({
    ...f,
    elements: [
      ...f.elements,
      {
        ...el,
        id: `el-${f.elements.length + 1}-${nowIso.replace(/\D/g, '').slice(-5)}`,
        x: snapCoord(el.x, f.gridSize, state.snapToGrid),
        y: snapCoord(el.y, f.gridSize, state.snapToGrid),
      },
    ],
  }))
}

function hasUnlockedElement(state: FacilityLayoutState, id: string): boolean {
  const floor = state.floors.find((f) => f.floorId === state.activeFloorId)
  const target = floor?.elements.find((e) => e.id === id)
  return Boolean(target && !target.locked)
}

export function moveFacilityElement(state: FacilityLayoutState, id: string, x: number, y: number, nowIso: string): FacilityLayoutState {
  if (!hasUnlockedElement(state, id)) return state
  return updateActiveFloor(state, nowIso, (f) => ({
    ...f,
    elements: f.elements.map((e) =>
      e.id === id && !e.locked
        ? { ...e, x: snapCoord(Math.max(0, x), f.gridSize, state.snapToGrid), y: snapCoord(Math.max(0, y), f.gridSize, state.snapToGrid) }
        : e,
    ),
  }))
}

export function resizeFacilityElement(state: FacilityLayoutState, id: string, w: number, h: number, nowIso: string): FacilityLayoutState {
  if (!hasUnlockedElement(state, id)) return state
  return updateActiveFloor(state, nowIso, (f) => ({
    ...f,
    elements: f.elements.map((e) =>
      e.id === id && !e.locked ? { ...e, w: Math.max(40, Math.round(w)), h: Math.max(30, Math.round(h)) } : e,
    ),
  }))
}

export function rotateFacilityElement(state: FacilityLayoutState, id: string, deltaDeg: number, nowIso: string): FacilityLayoutState {
  if (!hasUnlockedElement(state, id)) return state
  return updateActiveFloor(state, nowIso, (f) => ({
    ...f,
    elements: f.elements.map((e) => (e.id === id && !e.locked ? { ...e, rotationDeg: (e.rotationDeg + deltaDeg + 360) % 360 } : e)),
  }))
}

export function toggleLockElement(state: FacilityLayoutState, id: string, nowIso: string): FacilityLayoutState {
  return updateActiveFloor(state, nowIso, (f) => ({
    ...f,
    elements: f.elements.map((e) => (e.id === id ? { ...e, locked: !e.locked } : e)),
  }))
}

export function duplicateFacilityElement(state: FacilityLayoutState, id: string, nowIso: string): FacilityLayoutState {
  const floor = state.floors.find((f) => f.floorId === state.activeFloorId)
  const src = floor?.elements.find((e) => e.id === id)
  if (!src) return state
  return addFacilityElement(
    state,
    {
      ...src,
      label: `${src.label} (Copy)`,
      x: src.x + 20,
      y: src.y + 20,
      locked: false,
      patientId: undefined,
      patientLabel: undefined,
      encounterId: undefined,
      bedStatus: src.kind === 'bed' ? 'Available' : src.bedStatus,
    },
    nowIso,
  )
}

export function deleteFacilityElement(state: FacilityLayoutState, id: string, nowIso: string): FacilityLayoutState {
  if (!hasUnlockedElement(state, id)) return state
  return updateActiveFloor(state, nowIso, (f) => ({
    ...f,
    elements: f.elements.filter((e) => !(e.id === id && !e.locked)),
  }))
}

export function undoFloorPlan(state: FacilityLayoutState, nowIso: string): FacilityLayoutState {
  if (state.past.length === 0) return state
  const previous = state.past[state.past.length - 1]
  return {
    ...state,
    floors: previous,
    past: state.past.slice(0, -1),
    future: [state.floors, ...state.future],
    updatedAtIso: nowIso,
  }
}

export function redoFloorPlan(state: FacilityLayoutState, nowIso: string): FacilityLayoutState {
  if (state.future.length === 0) return state
  const [next, ...rest] = state.future
  return {
    ...state,
    floors: next,
    past: [...state.past, state.floors],
    future: rest,
    updatedAtIso: nowIso,
  }
}

export function addFloor(state: FacilityLayoutState, floorName: string, nowIso: string): FacilityLayoutState {
  const floorId = `floor-${state.floors.length + 1}`
  return {
    ...state,
    past: [...state.past, state.floors],
    future: [],
    activeFloorId: floorId,
    floors: [...state.floors, { floorId, floorName: floorName.trim() || `Lantai ${state.floors.length + 1}`, gridSize: 10, elements: [] }],
    updatedAtIso: nowIso,
  }
}

export function publishFloorPlanVersion(
  state: FacilityLayoutState,
  status: 'draft' | 'published',
  actorName: string,
  nowIso: string,
): FacilityLayoutState {
  const nextVer = (state.versions[state.versions.length - 1]?.version ?? 0) + 1
  return {
    ...state,
    versions: [...state.versions, { version: nextVer, status, savedAtIso: nowIso, savedBy: actorName, floors: state.floors }],
    updatedAtIso: nowIso,
  }
}

export function exportFloorPlanJson(state: FacilityLayoutState): string {
  return JSON.stringify({ facilityId: state.facilityId, facilityName: state.facilityName, facilityType: state.facilityType, floors: state.floors }, null, 2)
}

export function importFloorPlanJson(
  state: FacilityLayoutState,
  rawJson: string,
  nowIso: string,
): { readonly ok: true; readonly state: FacilityLayoutState } | { readonly ok: false; readonly reason: string } {
  try {
    const parsed = JSON.parse(rawJson) as { facilityName?: unknown; facilityType?: unknown; floors?: unknown }
    if (!Array.isArray(parsed.floors) || parsed.floors.length === 0) {
      return { ok: false, reason: 'JSON denah tidak memiliki array floors yang valid.' }
    }
    const floors = parsed.floors as FloorPlanLayer[]
    return {
      ok: true,
      state: {
        ...state,
        facilityName: typeof parsed.facilityName === 'string' && parsed.facilityName ? parsed.facilityName : state.facilityName,
        facilityType: FACILITY_TYPES.includes(parsed.facilityType as FacilityType) ? (parsed.facilityType as FacilityType) : state.facilityType,
        past: [...state.past, state.floors],
        future: [],
        floors,
        activeFloorId: floors[0].floorId,
        updatedAtIso: nowIso,
      },
    }
  } catch {
    return { ok: false, reason: 'Format JSON denah rusak atau tidak terbaca.' }
  }
}

// ── Live Bed Intelligence (Atomic Occupancy Guard) ──────────────────────────
function findElementAcrossFloors(state: FacilityLayoutState, bedId: string): FacilityElement | undefined {
  for (const f of state.floors) {
    const found = f.elements.find((e) => e.id === bedId)
    if (found) return found
  }
  return undefined
}

function findPatientOccupiedBed(state: FacilityLayoutState, patientId: string): FacilityElement | undefined {
  for (const f of state.floors) {
    const found = f.elements.find((e) => e.patientId === patientId && (e.bedStatus === 'Occupied' || e.bedStatus === 'Isolation'))
    if (found) return found
  }
  return undefined
}

function mapAllElements(state: FacilityLayoutState, fn: (e: FacilityElement) => FacilityElement, nowIso: string): FacilityLayoutState {
  return {
    ...state,
    floors: state.floors.map((f) => ({ ...f, elements: f.elements.map(fn) })),
    updatedAtIso: nowIso,
  }
}

export function assignPatientToBed(
  state: FacilityLayoutState,
  params: { readonly bedId: string; readonly patientId: string; readonly patientLabel: string; readonly encounterId?: string; readonly pjNurse?: string; readonly nowIso: string },
): { readonly ok: true; readonly state: FacilityLayoutState } | { readonly ok: false; readonly reason: string } {
  const bed = findElementAcrossFloors(state, params.bedId)
  if (!bed) return { ok: false, reason: 'Bed tidak ditemukan.' }
  if (bed.bedStatus !== 'Available' && bed.bedStatus !== 'Reserved') {
    return { ok: false, reason: `Bed ${bed.label} tidak tersedia (status: ${bed.bedStatus}).` }
  }
  const existing = findPatientOccupiedBed(state, params.patientId)
  if (existing) {
    return { ok: false, reason: `Double occupancy dicegah: pasien sudah menempati ${existing.label}. Gunakan Transfer/Swap.` }
  }
  return {
    ok: true,
    state: mapAllElements(
      state,
      (e) =>
        e.id === params.bedId
          ? {
              ...e,
              bedStatus: 'Occupied',
              patientId: params.patientId,
              patientLabel: params.patientLabel,
              encounterId: params.encounterId,
              pjNurse: params.pjNurse || e.pjNurse,
            }
          : e,
      params.nowIso,
    ),
  }
}

export function setBedStatus(state: FacilityLayoutState, bedId: string, status: BedStatus, nowIso: string): FacilityLayoutState {
  return mapAllElements(
    state,
    (e) =>
      e.id === bedId
        ? {
            ...e,
            bedStatus: status,
            ...(status === 'Available' || status === 'Awaiting cleaning' || status === 'Cleaning' || status === 'Maintenance' || status === 'Out of service'
              ? { patientId: undefined, patientLabel: undefined, encounterId: undefined }
              : {}),
          }
        : e,
    nowIso,
  )
}

export function assignPjNurse(state: FacilityLayoutState, bedId: string, pjNurse: string, nowIso: string): FacilityLayoutState {
  return mapAllElements(state, (e) => (e.id === bedId ? { ...e, pjNurse: pjNurse.trim() || 'PJ Belum Ditunjuk' } : e), nowIso)
}

export function atomicSwapBeds(
  state: FacilityLayoutState,
  bedAId: string,
  bedBId: string,
  nowIso: string,
): { readonly ok: true; readonly state: FacilityLayoutState } | { readonly ok: false; readonly reason: string } {
  if (bedAId === bedBId) return { ok: false, reason: 'Pilih dua bed berbeda untuk swap.' }
  const a = findElementAcrossFloors(state, bedAId)
  const b = findElementAcrossFloors(state, bedBId)
  if (!a || !b) return { ok: false, reason: 'Salah satu bed tidak ditemukan.' }
  if (a.bedStatus === 'Maintenance' || a.bedStatus === 'Out of service' || b.bedStatus === 'Maintenance' || b.bedStatus === 'Out of service') {
    return { ok: false, reason: 'Bed dalam status Maintenance/Out of service tidak dapat diswap.' }
  }
  const next = mapAllElements(
    state,
    (e) => {
      if (e.id === bedAId) {
        return { ...e, bedStatus: b.bedStatus, patientId: b.patientId, patientLabel: b.patientLabel, encounterId: b.encounterId }
      }
      if (e.id === bedBId) {
        return { ...e, bedStatus: a.bedStatus, patientId: a.patientId, patientLabel: a.patientLabel, encounterId: a.encounterId }
      }
      return e
    },
    nowIso,
  )
  return { ok: true, state: next }
}

// ── Simulation Isolation & Honest Analytics ─────────────────────────────────
export function createIsolatedSimulationClone(canonical: FacilityLayoutState): FacilityLayoutState {
  return JSON.parse(JSON.stringify({ ...canonical, isSimulation: true })) as FacilityLayoutState
}

export interface FacilityAnalyticsSummary {
  readonly windowHours: number
  readonly totalBeds: number
  readonly operationalBeds: number
  readonly excludedBeds: number
  readonly occupiedBeds: number
  readonly borPct: number | null
  readonly orRoomsTotal: number
  readonly orRoomsOccupied: number
  readonly orUtilizationPct: number | null
  readonly completedStaysCount: number
  readonly alosHours: number | null
}

export function computeFacilityAnalytics(
  state: FacilityLayoutState,
  windowHours: number,
  completedStaysHours: readonly number[] = [],
): FacilityAnalyticsSummary {
  const all = state.floors.flatMap((f) => f.elements)
  const beds = all.filter((e) => e.kind === 'bed' || e.zone === 'resus')
  const excluded = beds.filter((b) => b.bedStatus === 'Maintenance' || b.bedStatus === 'Out of service')
  const operational = beds.filter((b) => b.bedStatus !== 'Maintenance' && b.bedStatus !== 'Out of service')
  const occupied = operational.filter((b) => b.bedStatus === 'Occupied' || b.bedStatus === 'Isolation')
  const orRooms = all.filter((e) => /operasi|\bok\b|tindakan/i.test(e.label))
  const orOccupied = orRooms.filter((r) => r.bedStatus === 'Occupied')
  const validStays = completedStaysHours.filter((h) => Number.isFinite(h) && h > 0)

  return {
    windowHours,
    totalBeds: beds.length,
    operationalBeds: operational.length,
    excludedBeds: excluded.length,
    occupiedBeds: occupied.length,
    borPct: operational.length > 0 ? Math.round((occupied.length / operational.length) * 1000) / 10 : null,
    orRoomsTotal: orRooms.length,
    orRoomsOccupied: orOccupied.length,
    orUtilizationPct: orRooms.length > 0 ? Math.round((orOccupied.length / orRooms.length) * 1000) / 10 : null,
    completedStaysCount: validStays.length,
    alosHours: validStays.length > 0 ? Math.round((validStays.reduce((a, b) => a + b, 0) / validStays.length) * 10) / 10 : null,
  }
}
