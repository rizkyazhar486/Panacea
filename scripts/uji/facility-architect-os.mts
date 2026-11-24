import assert from 'node:assert/strict'
import {
  FACILITY_SCHEMATIC_DISCLAIMER,
  FACILITY_TYPES,
  addFacilityElement,
  addFloor,
  assignPatientToBed,
  assignPjNurse,
  atomicSwapBeds,
  computeFacilityAnalytics,
  createDefaultIgdAdventTemplate,
  createIsolatedSimulationClone,
  deleteFacilityElement,
  duplicateFacilityElement,
  exportFloorPlanJson,
  importFloorPlanJson,
  moveFacilityElement,
  publishFloorPlanVersion,
  redoFloorPlan,
  resizeFacilityElement,
  rotateFacilityElement,
  setBedStatus,
  toggleLockElement,
  undoFloorPlan,
} from '../../src/domains/facility-architect/index.ts'
import {
  applyServerBedTransition,
  canReadFacilityLayouts,
  canWriteFacilityLayout,
  type ServerFacilityLayoutRecord,
} from '../../server/src/domains/facility-architect/facilityStore.ts'

assert.equal(FACILITY_TYPES.length, 30)
assert.match(FACILITY_SCHEMATIC_DISCLAIMER, /skematik/i)

// 1. Default IGD template matching Screenshot 0 rooms & triage zones
let igd = createDefaultIgdAdventTemplate('2026-11-24T00:00:00Z')
const labels = igd.floors[0].elements.map((e) => e.label)
for (const expected of ['R. PONEK', 'R. Neonatus', 'R. Resus', 'Bed 4', 'Bed 5', 'Bed 6', 'Bed 3', 'Bed 2', 'Bed 1', 'Bed C', 'Bed B', 'Bed A', 'Nurse Station', 'Meja Dokter', 'Radiologi', 'R. Tindakan', 'HALL']) {
  assert.ok(labels.some((l) => l.includes(expected)), `Missing default IGD element: ${expected}`)
}

// 2. Editor operations: add, move/snap, resize, rotate, duplicate, lock/delete, undo/redo, multi-floor, publish, JSON import/export
igd = addFacilityElement(igd, { kind: 'bed', label: 'Bed Ekstra 7', zone: 'kuning', x: 523, y: 317, w: 90, h: 60, rotationDeg: 0, locked: false, bedStatus: 'Available' }, '2026-11-24T00:01:00Z')
const added = igd.floors[0].elements[igd.floors[0].elements.length - 1]
assert.equal(added.x, 520) // snapped to gridSize 10
assert.equal(added.y, 320)

igd = moveFacilityElement(igd, added.id, 604, 196, '2026-11-24T00:02:00Z')
assert.equal(igd.floors[0].elements.find((e) => e.id === added.id)?.x, 600)
igd = resizeFacilityElement(igd, added.id, 130, 75, '2026-11-24T00:03:00Z')
assert.equal(igd.floors[0].elements.find((e) => e.id === added.id)?.w, 130)
igd = rotateFacilityElement(igd, added.id, 90, '2026-11-24T00:04:00Z')
assert.equal(igd.floors[0].elements.find((e) => e.id === added.id)?.rotationDeg, 90)

const prevCount = igd.floors[0].elements.length
igd = duplicateFacilityElement(igd, added.id, '2026-11-24T00:05:00Z')
assert.equal(igd.floors[0].elements.length, prevCount + 1)

igd = toggleLockElement(igd, added.id, '2026-11-24T00:06:00Z')
igd = deleteFacilityElement(igd, added.id, '2026-11-24T00:07:00Z')
assert.ok(igd.floors[0].elements.some((e) => e.id === added.id), 'Locked element must not be deleted')

igd = undoFloorPlan(igd, '2026-11-24T00:08:00Z')
assert.equal(igd.floors[0].elements.find((e) => e.id === added.id)?.locked, false)
igd = redoFloorPlan(igd, '2026-11-24T00:09:00Z')
assert.equal(igd.floors[0].elements.find((e) => e.id === added.id)?.locked, true)

igd = addFloor(igd, 'Lantai 2 — OK & ICU', '2026-11-24T00:10:00Z')
assert.equal(igd.floors.length, 2)
igd = publishFloorPlanVersion(igd, 'published', 'Admin RS', '2026-11-24T00:11:00Z')
assert.equal(igd.versions.length, 2)

const exported = exportFloorPlanJson(igd)
const reimported = importFloorPlanJson(igd, exported, '2026-11-24T00:12:00Z')
assert.equal(reimported.ok, true)

// 3. Bed occupancy, double-occupancy prevention, atomic swap & PJ Nurse
igd = assignPjNurse(igd, 'bed-1', 'Ns. Sinta, S.Kep', '2026-11-24T00:13:00Z')
assert.equal(igd.floors[0].elements.find((e) => e.id === 'bed-1')?.pjNurse, 'Ns. Sinta, S.Kep')

const admit1 = assignPatientToBed(igd, { bedId: 'bed-1', patientId: 'pat-1', patientLabel: 'SYN-P1 (Nyeri Dada)', pjNurse: 'Ns. Sinta', nowIso: '2026-11-24T00:14:00Z' })
assert.equal(admit1.ok, true)
if (!admit1.ok) throw new Error('expected ok')
igd = admit1.state

const doubleAdmit = assignPatientToBed(igd, { bedId: 'bed-2', patientId: 'pat-1', patientLabel: 'SYN-P1', nowIso: '2026-11-24T00:15:00Z' })
assert.equal(doubleAdmit.ok, false, 'Double occupancy must fail closed')

const swapRes = atomicSwapBeds(igd, 'bed-1', 'bed-2', '2026-11-24T00:16:00Z')
assert.equal(swapRes.ok, true)
if (!swapRes.ok) throw new Error('expected ok')
igd = swapRes.state
assert.equal(igd.floors[0].elements.find((e) => e.id === 'bed-1')?.bedStatus, 'Available')
assert.equal(igd.floors[0].elements.find((e) => e.id === 'bed-2')?.patientId, 'pat-1')

// 4. Simulation clone isolation + honest analytics denominator
const sim = createIsolatedSimulationClone(igd)
assert.equal(sim.isSimulation, true)
const simMutated = setBedStatus(sim, 'bed-3', 'Isolation', '2026-11-24T00:17:00Z')
assert.equal(simMutated.floors[0].elements.find((e) => e.id === 'bed-3')?.bedStatus, 'Isolation')
assert.equal(igd.floors[0].elements.find((e) => e.id === 'bed-3')?.bedStatus, 'Available', 'Canonical beds must stay untouched by simulation')

igd = setBedStatus(igd, 'bed-4', 'Maintenance', '2026-11-24T00:18:00Z')
const analytics = computeFacilityAnalytics(igd, 24, [4.5, 6.5])
assert.equal(analytics.excludedBeds, 1)
assert.equal(analytics.operationalBeds, analytics.totalBeds - 1)
assert.equal(analytics.occupiedBeds, 1)
assert.equal(analytics.alosHours, 5.5)

// 5. Server RBAC & 409 double-occupancy guard
assert.equal(canReadFacilityLayouts({ id: 'u1', role: 'pasien' }), false)
assert.equal(canReadFacilityLayouts({ id: 'u2', role: 'kontributor' }), false)
assert.equal(canReadFacilityLayouts({ id: 'u3', role: 'dokter' }), true)
assert.equal(canReadFacilityLayouts({ id: 'u4', role: 'perawat' }), true)
assert.equal(canWriteFacilityLayout({ id: 'u5', role: 'admin', facilityId: 'fac-a' }, 'fac-b'), false)
assert.equal(canWriteFacilityLayout({ id: 'u5', role: 'admin', facilityId: 'fac-a' }, 'fac-a'), true)

const srvRec: ServerFacilityLayoutRecord = {
  facilityId: 'fac-igd-default',
  facilityName: 'IGD Test',
  facilityType: 'IGD',
  floors: [{ floorId: 'f1', floorName: 'L1', elements: [{ id: 'b1', label: 'Bed 1', bedStatus: 'Occupied', patientId: 'pat-1' }, { id: 'b2', label: 'Bed 2', bedStatus: 'Available' }] }],
  updatedAtIso: '2026-11-24T00:00:00Z',
  updatedBy: 'Admin',
}
const srvConflict = applyServerBedTransition(srvRec, { type: 'admit', bedId: 'b2', patientId: 'pat-1', patientLabel: 'P1' }, 'dr. X', '2026-11-24T00:20:00Z')
assert.equal(srvConflict.ok, false)
if (!srvConflict.ok) assert.equal(srvConflict.statusCode, 409)

const srvSwap = applyServerBedTransition(srvRec, { type: 'swap', bedAId: 'b1', bedBId: 'b2' }, 'dr. X', '2026-11-24T00:21:00Z')
assert.equal(srvSwap.ok, true)

console.log('facility-architect-os: all deterministic assertions PASSED.')
