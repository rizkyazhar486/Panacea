// Alpha F1: penyimpanan penugasan staf (tanpa HTTP): id warisan objek ditolak dan tidak mencemari prototipe; pencabutan jujur.
import assert from 'node:assert/strict'
const { upsertUser, setStaffRole, tugaskanStaf, cabutStaf, pasienDitugaskan, daftarStaf, STAFF_ROLES } = await import('../src/store.ts')
const u1 = upsertUser('staff-store-1@localhost.test', 'Staff One', 'pasien'), u2 = upsertUser('staff-store-2@localhost.test', 'Staff Two', 'pasien'), dr = upsertUser('staff-store-dr@localhost.test', 'Doctor', 'dokter')
assert.deepEqual([...STAFF_ROLES], ['perawat', 'lab'])
assert.deepEqual(setStaffRole(u1.id, 'perawat'), { ok: true, user: u1 }); assert.equal(u1.role, 'perawat'); setStaffRole(u2.id, 'lab')
assert.deepEqual(daftarStaf().map((x) => x.id).sort(), [u1.id, u2.id].sort())
assert.deepEqual(setStaffRole(dr.id, 'perawat'), { ok: false, reason: 'not-eligible' }); assert.deepEqual(setStaffRole('missing', 'perawat'), { ok: false, reason: 'not-found' })
for (const bad of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) { assert.equal(tugaskanStaf(bad, u1.id), false, `${bad} is not a patient id`); assert.deepEqual(pasienDitugaskan(u1.id), []) }
assert.equal(({} as any).polluted, undefined, 'the prototype is untouched'); assert.equal(Object.prototype.hasOwnProperty.call(Object.prototype, 'u1'), false)
assert.equal(tugaskanStaf('p1', u1.id), true); assert.equal(tugaskanStaf('p1', u1.id), false, 'assigning twice is a no-op'); assert.equal(tugaskanStaf('p1', u2.id), true); assert.equal(tugaskanStaf('p2', u1.id), true)
assert.deepEqual(pasienDitugaskan(u1.id), ['p1', 'p2']); assert.deepEqual(pasienDitugaskan(u2.id), ['p1'], 'each account sees only its own assignments')
assert.equal(cabutStaf('p1', 'someone-else'), false, 'revoking an account that is not assigned reports no change'); assert.deepEqual(pasienDitugaskan(u2.id), ['p1'], 'and removes nobody else')
assert.equal(cabutStaf('nope', u1.id), false); assert.equal(cabutStaf('p1', u1.id), true); assert.deepEqual(pasienDitugaskan(u1.id), ['p2']); assert.deepEqual(pasienDitugaskan(u2.id), ['p1'], 'revoking one account leaves the other assigned')
assert.equal(cabutStaf('p1', u2.id), true); assert.deepEqual(pasienDitugaskan(u2.id), [])
tugaskanStaf('p3', u1.id); assert.equal(setStaffRole(u1.id, 'pasien').ok, true); assert.deepEqual(pasienDitugaskan(u1.id), [], 'demotion purges every assignment'); assert.equal(u1.role, 'pasien')
console.log('staffStore: staff roles and assignments are scoped per account, refuse inherited object ids, revoke honestly and purge on demotion')
