// F1: peran perawat dan laboratorium — RBAC positif dan negatif pada server nyata (mode berkas terisolasi, data sintetis).
// Aturan: akun staf yang belum diverifikasi = pasien; staf terverifikasi hanya melihat/mengisi pasien yang DITUGASKAN; tidak ada akses tenant-lebar.
// Verifikasi akun dan siklus hidup adalah fixture alur kerja, bukan persetujuan klinis.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serverRoot, startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'staff-owner@localhost.test'
const running = await startIsolatedServer('staff-akses', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200, `login ${email}`)
    return r.body as { token: string; user: { id: string; role: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('staff-doctor@localhost.test', 'dokter')
  const alice = await login('staff-alice@localhost.test', 'pasien')
  const bob = await login('staff-bob@localhost.test', 'pasien')
  const nurse = await login('staff-nurse@localhost.test', 'perawat')
  const lab = await login('staff-lab@localhost.test', 'lab')
  const verify = (id: string) => call('POST', `/api/doctors/${id}/verify`, owner.token, { status: 'verified' })
  assert.equal((await verify(doctor.user.id)).status, 200)
  const pidA = `self-u-${alice.user.id}`, pidB = `self-u-${bob.user.id}`
  const item = { name: 'Synthetic observation', valueText: 'fixture only', collectedAt: '2026-01-01' }
  const labInput = (patientId: string) => ({ patientId, item, source: 'lab-intake' })
  for (const pid of [pidA, pidB]) assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: { id: pid, name: 'Synthetic subject' } })).status, 200)
  const labA = (await call('POST', '/api/lab-results', doctor.token, labInput(pidA))).body
  const labB = (await call('POST', '/api/lab-results', doctor.token, labInput(pidB))).body
  assert.ok(labA.id && labB.id)

  // 0. Peran baru dapat didaftarkan sendiri tetapi TIDAK memberi akses staf sebelum diverifikasi owner.
  for (const staff of [nurse, lab]) {
    assert.equal((await call('GET', '/api/lab-results', staff.token)).body.results.length, 0, 'staf belum diverifikasi = pasien tanpa hasil lab sendiri')
    assert.equal((await call('POST', '/api/lab-results', staff.token, labInput(pidA))).status, 403, 'staf belum diverifikasi tidak boleh memasukkan hasil')
    assert.equal((await call('GET', `/api/lab-results/${labA.id}`, staff.token)).status, 404)
    assert.equal((await call('GET', '/api/staff-assignments', staff.token)).status, 403, 'bukan staf efektif, bukan klinisi')
  }
  // verifikasi hanya oleh owner (pasangan: owner 200, dokter/pasien 403)
  assert.equal((await call('POST', `/api/doctors/${nurse.user.id}/verify`, doctor.token, { status: 'verified' })).status, 403)
  assert.equal((await call('POST', `/api/doctors/${nurse.user.id}/verify`, alice.token, { status: 'verified' })).status, 403)
  assert.equal((await verify(nurse.user.id)).status, 200)
  assert.equal((await verify(lab.user.id)).status, 200)

  // 1. Terverifikasi TANPA penugasan: nol akses (deny-by-default), meski hasil ada di tenant yang sama.
  for (const staff of [nurse, lab]) {
    assert.equal((await call('GET', '/api/lab-results', staff.token)).body.results.length, 0)
    assert.equal((await call('GET', `/api/lab-results/${labA.id}`, staff.token)).status, 404)
    assert.equal((await call('POST', '/api/lab-results', staff.token, labInput(pidA))).status, 403)
    assert.equal((await call('GET', '/api/lab-results/metrics', staff.token)).body.total, 0)
    assert.deepEqual((await call('GET', '/api/staff-assignments', staff.token)).body.assignments, [])
  }

  // 2. Penugasan: hanya dokter terverifikasi atau owner; target harus staf terverifikasi.
  const assign = (token: string | undefined, staffId: unknown, patientId: unknown) => call('POST', '/api/staff-assignments', token, { staffId, patientId })
  const salinan = async () => JSON.stringify([(await call('GET', `/api/staff-assignments?patientId=${pidA}`, doctor.token)).body, (await call('GET', `/api/staff-assignments?patientId=${pidB}`, doctor.token)).body])
  const sebelum = await salinan()
  const tolak = async (r: Promise<{ status: number; body: any }>, status: number, error: string, label: string) => { const x = await r; assert.equal(x.status, status, label); if (error) assert.equal(x.body?.error, error, label); assert.equal(await salinan(), sebelum, `${label}: penolakan tanpa efek samping`) }
  await tolak(assign(undefined, nurse.user.id, pidA), 401, '', 'anonim')
  await tolak(assign(alice.token, nurse.user.id, pidA), 403, 'forbidden', 'pasien')
  await tolak(assign(nurse.token, nurse.user.id, pidA), 403, 'forbidden', 'staf menugaskan diri sendiri')
  await tolak(assign(lab.token, lab.user.id, pidA), 403, 'forbidden', 'lab menugaskan diri sendiri')
  await tolak(assign(doctor.token, bob.user.id, pidA), 409, 'staff-role-invalid', 'target pasien')
  await tolak(assign(doctor.token, doctor.user.id, pidA), 409, 'staff-role-invalid', 'target dokter')
  await tolak(assign(doctor.token, 'tidak-ada', pidA), 404, 'staff-not-found', 'staf tidak ada')
  await tolak(assign(doctor.token, nurse.user.id, ''), 400, 'invalid-input', 'pasien kosong')
  await tolak(assign(doctor.token, nurse.user.id, 'a|b'), 400, 'invalid-input', 'pemisah kunci')
  await tolak(assign(doctor.token, nurse.user.id, 'constructor'), 400, 'invalid-input', 'id dicadangkan')
  await tolak(assign(doctor.token, 12, pidA), 400, 'invalid-input', 'tipe salah')
  const baru = await login('staff-nurse2@localhost.test', 'perawat')
  await tolak(assign(doctor.token, baru.user.id, pidA), 409, 'staff-not-verified', 'staf belum diverifikasi')
  const a1 = await assign(doctor.token, nurse.user.id, pidA)
  assert.equal(a1.status, 201); assert.equal(a1.body.staffId, nurse.user.id); assert.equal(a1.body.patientId, pidA); assert.equal(a1.body.oleh, doctor.user.id)
  assert.equal((await assign(owner.token, lab.user.id, pidA)).status, 201, 'owner boleh menugaskan')

  // 3. Dengan penugasan: hanya pasien yang ditugaskan (pasangan: pidA lolos, pidB tetap tertutup).
  for (const staff of [nurse, lab]) {
    assert.deepEqual((await call('GET', '/api/lab-results', staff.token)).body.results.map((r: any) => r.id), [labA.id])
    assert.equal((await call('GET', `/api/lab-results/${labA.id}`, staff.token)).status, 200)
    assert.equal((await call('GET', `/api/lab-results/${labB.id}`, staff.token)).status, 404, 'pasien lain tidak terbaca')
    assert.equal((await call('POST', '/api/lab-results', staff.token, labInput(pidB))).status, 403, 'intake pasien lain ditolak')
    assert.equal((await call('GET', '/api/lab-results/metrics', staff.token)).body.total, 1, 'metrik hanya atas pasien yang ditugaskan')
    assert.equal((await call('GET', `/api/lab-results?patientId=${pidB}`, staff.token)).body.results.length, 0)
  }
  const intake = await call('POST', '/api/lab-results', lab.token, labInput(pidA))
  assert.equal(intake.status, 201); assert.equal(intake.body.provenance.recordedBy, lab.user.id)

  // 4. Kapabilitas sesuai matriks domain: staf lab → pending_review saja; perawat tidak meninjau; tidak ada tanda tangan klinis.
  const adv = (token: string, id: string, to: string, extra: object = {}) => call('POST', `/api/lab-results/${id}/advance`, token, { to, ...extra })
  assert.equal((await adv(nurse.token, labB.id, 'pending_review')).status, 404, 'perawat tidak memajukan hasil pasien lain')
  assert.equal((await adv(nurse.token, labA.id, 'pending_review')).status, 200)
  assert.equal((await adv(nurse.token, labA.id, 'reviewed')).status, 403, 'perawat tidak boleh meninjau')
  assert.equal((await adv(lab.token, labA.id, 'reviewed')).status, 403, 'lab tidak boleh meninjau')
  assert.equal((await adv(doctor.token, labA.id, 'reviewed')).status, 200)
  assert.equal((await adv(lab.token, labA.id, 'communicated', { communication: { channel: 'phone', note: 'x' } })).status, 403, 'lab tidak boleh menyampaikan')
  assert.equal((await adv(nurse.token, labA.id, 'communicated', { communication: { channel: 'phone', note: 'Hasil disampaikan via telepon' } })).status, 200, 'perawat boleh menyampaikan (matriks domain)')
  assert.equal((await call('POST', '/api/referrals', nurse.token, { patientId: pidA, kind: 'specialist', reason: 'x', toFacility: 'y' })).status, 403, 'perawat tidak membuat rujukan')

  // 5. Pencabutan: hanya dokter terverifikasi/owner; akses staf berhenti seketika; pencabutan ulang 404.
  const sebelumCabut = await salinan()
  for (const [token, label] of [[undefined, 'anonim'], [alice.token, 'pasien'], [nurse.token, 'staf']] as const) {
    const r = await call('DELETE', `/api/staff-assignments/${nurse.user.id}/${pidA}`, token)
    assert.equal(r.status, label === 'anonim' ? 401 : 403, label)
    assert.equal(await salinan(), sebelumCabut, `${label}: tanpa efek samping`)
  }
  assert.equal((await call('DELETE', `/api/staff-assignments/${nurse.user.id}/${pidA}`, doctor.token)).status, 200)
  assert.equal((await call('DELETE', `/api/staff-assignments/${nurse.user.id}/${pidA}`, doctor.token)).status, 404)
  assert.equal((await call('DELETE', `/api/staff-assignments/a|b/${pidA}`, doctor.token)).status, 400)
  assert.equal((await call('GET', '/api/lab-results', nurse.token)).body.results.length, 0, 'akses berhenti setelah pencabutan')
  assert.equal((await call('GET', `/api/lab-results/${labA.id}`, nurse.token)).status, 404)
  assert.equal((await call('GET', `/api/lab-results/${labA.id}`, lab.token)).status, 200, 'penugasan staf lain tidak ikut tercabut')

  // 6. Daftar: staf melihat milik sendiri; pasien ditolak; klinisi wajib menyebut pasien.
  assert.deepEqual((await call('GET', '/api/staff-assignments', lab.token)).body.assignments.map((p: any) => p.patientId), [pidA])
  assert.equal((await call('GET', '/api/staff-assignments', alice.token)).status, 403)
  assert.equal((await call('GET', '/api/staff-assignments', undefined)).status, 401)
  assert.equal((await call('GET', '/api/staff-assignments', doctor.token)).status, 400)
  assert.equal((await call('GET', '/api/staff-assignments?patientId=constructor', doctor.token)).status, 400)

  // 7. Audit tercatat untuk penugasan, pencabutan dan penolakan.
  const audit = readFileSync(running.dataFile, 'utf8')
  for (const aksi of ['staffassign.assigned', 'staffassign.revoked', 'staffassign.rejected:forbidden', 'staffassign.rejected:staff-not-verified']) assert.ok(audit.includes(aksi), `audit ${aksi}`)

  // 8. Setiap rute modul penugasan masuk matriks keputusan (rute baru gagal di sini sampai diputuskan).
  const src = readFileSync(join(serverRoot, 'src/modules/labResults/http/penugasanRoutes.ts'), 'utf8')
  const rute = [...src.matchAll(/app\.(get|post|put|patch|delete)\('(\/api\/staff-assignments[^']*)'/g)].map((m) => `${m[1]!.toUpperCase()} ${m[2]}`).sort()
  assert.deepEqual(rute, ['DELETE /api/staff-assignments/:staffId/:patientId', 'GET /api/staff-assignments', 'POST /api/staff-assignments'])
  console.log('staffAksesLab: perawat/lab belum diverifikasi = pasien; terverifikasi tanpa penugasan = nol akses; penugasan hanya oleh dokter terverifikasi/owner; akses hanya pasien ditugaskan; kapabilitas sesuai matriks domain; pencabutan menutup akses; penolakan tanpa efek samping; passed')
} finally {
  await running.stop()
}
