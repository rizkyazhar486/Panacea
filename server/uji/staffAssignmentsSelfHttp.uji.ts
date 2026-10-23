// Alpha F1: staf melihat penugasannya sendiri (GET /api/staff/assignments) lewat HTTP nyata. Hanya perawat/lab; pasien lain, dokter dan anonim ditolak;
// daftar mengikuti penugasan owner seketika (pemberian dan pencabutan); tidak membocorkan penugasan staf lain.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'staff-self-owner@localhost.test'
const running = await startIsolatedServer('staff-self', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => { const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email }); assert.equal(r.status, 200); return r.body as { token: string; user: { id: string } } }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('staff-self-doctor@localhost.test', 'dokter')
  const patient = await login('staff-self-patient@localhost.test', 'pasien')
  const nurse1 = await login('staff-self-nurse1@localhost.test', 'pasien')
  const nurse2 = await login('staff-self-nurse2@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const mine = (t?: string) => call('GET', '/api/staff/assignments', t)
  // negatif: anonim 401; pasien, dokter terverifikasi dan calon staf yang belum diberi peran 403
  assert.equal((await mine()).status, 401)
  for (const [who, t] of [['patient', patient.token], ['verified doctor', doctor.token], ['not-yet-staff', nurse1.token], ['owner', owner.token]] as const) assert.equal((await mine(t)).status, 403, who)
  // positif: setelah peran diberikan owner, daftar kosong lalu mengikuti penugasan
  for (const n of [nurse1, nurse2]) assert.equal((await call('POST', '/api/owner/staff-role', owner.token, { userId: n.user.id, role: 'perawat' })).status, 200)
  assert.deepEqual((await mine(nurse1.token)).body, { patientIds: [] })
  assert.equal((await call('POST', '/api/owner/staff-assignments', owner.token, { userId: nurse1.user.id, patientId: 'p-b' })).status, 200)
  assert.equal((await call('POST', '/api/owner/staff-assignments', owner.token, { userId: nurse1.user.id, patientId: 'p-a' })).status, 200)
  assert.equal((await call('POST', '/api/owner/staff-assignments', owner.token, { userId: nurse2.user.id, patientId: 'p-z' })).status, 200)
  assert.deepEqual((await mine(nurse1.token)).body, { patientIds: ['p-a', 'p-b'] }, 'terurut dan hanya milik sendiri')
  assert.deepEqual((await mine(nurse2.token)).body, { patientIds: ['p-z'] }, 'tidak membocorkan penugasan staf lain')
  // pencabutan berlaku seketika; pencabutan peran menutup endpoint
  assert.equal((await call('POST', '/api/owner/staff-assignments', owner.token, { userId: nurse1.user.id, patientId: 'p-a', revoke: true })).status, 200)
  assert.deepEqual((await mine(nurse1.token)).body, { patientIds: ['p-b'] })
  assert.equal((await call('POST', '/api/owner/staff-role', owner.token, { userId: nurse1.user.id, role: 'pasien' })).status, 200)
  assert.equal((await mine(nurse1.token)).status, 403, 'peran dicabut = bukan staf lagi')
  console.log('staffAssignmentsSelfHttp: staff list only their own assignments, refuse everyone else, and follow grant/revoke immediately; passed')
} finally { await running.stop() }
