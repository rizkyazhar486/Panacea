// Alpha F1 — KARAKTERISASI perilaku akses saat ini, bukan keputusan kebijakan. Menyematkan dua fakta yang dicatat ledger/proposal F1:
//  (1) dokter terverifikasi membaca hasil lab dan rujukan SELURUH tenant, bukan hanya pasien yang ditautkan/ditugaskan (risiko privasi, proposal F1 §2);
//  (2) peran kontributor dan verifikator (bahkan terverifikasi) tidak punya kapabilitas hasil lab/rujukan sama sekali (ditolak 403).
// Tes ini SENGAJA gagal bila salah satunya berubah: membatasi atau membuka akses klinisi adalah keputusan pemilik dan butuh migrasi/uji yang aman,
// dan tidak boleh berubah diam-diam. Saat pemilik memutuskan, perbarui tes ini, docs/alpha/F1_NURSE_LAB_RBAC_PROPOSAL.md dan ledger bersama-sama.
// HTTP nyata, mode berkas terisolasi, identitas sintetis; verifikasi dokter hanyalah fixture alur kerja.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'f1-char-owner@localhost.test'
const running = await startIsolatedServer('f1-char', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; role: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('f1-char-doctor@localhost.test', 'dokter')
  const unverified = await login('f1-char-unverified@localhost.test', 'dokter')
  const alice = await login('f1-char-alice@localhost.test', 'pasien')
  const bob = await login('f1-char-bob@localhost.test', 'pasien')
  const kontributor = await login('f1-char-kontributor@localhost.test', 'kontributor')
  const verifikator = await login('f1-char-verifikator@localhost.test', 'verifikator')
  for (const d of [doctor, verifikator]) assert.equal((await call('POST', `/api/doctors/${d.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)

  const item = { name: 'Synthetic observation', valueText: 'fixture only', collectedAt: '2026-01-01' }
  const pid = (u: { user: { id: string } }) => `self-u-${u.user.id}`
  const ids: Record<string, { lab: string; ref: string }> = {}
  for (const [k, acct] of [['alice', alice], ['bob', bob]] as const) {
    assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: { id: pid(acct), name: 'Synthetic subject' } })).status, 200)
    const l = await call('POST', '/api/lab-results', doctor.token, { patientId: pid(acct), item, source: 'lab-intake' })
    const r = await call('POST', '/api/referrals', doctor.token, { patientId: pid(acct), kind: 'specialist', reason: 'Synthetic fixture', toFacility: 'Synthetic facility' })
    assert.equal(l.status, 201); assert.equal(r.status, 201)
    ids[k] = { lab: l.body.id, ref: r.body.id }
  }
  const labIds = (r: { body: any }) => (r.body.results as { id: string }[]).map((x) => x.id).sort()
  const refIds = (r: { body: any }) => (r.body.referrals as { id: string }[]).map((x) => x.id).sort()
  const both = (key: 'lab' | 'ref') => [ids.alice![key], ids.bob![key]].sort()

  // (1) Dokter terverifikasi: tenant-wide. Tidak ada tautan, penugasan, atau berbagi ke Alice maupun Bob, tetapi keduanya terbaca.
  assert.deepEqual(labIds(await call('GET', '/api/lab-results', doctor.token)), both('lab'), 'CHARACTERIZATION: a verified clinician lists every patient\'s results in the tenant')
  assert.deepEqual(refIds(await call('GET', '/api/referrals', doctor.token)), both('ref'), 'CHARACTERIZATION: … and every patient\'s referrals')
  assert.equal((await call('GET', `/api/lab-results/${ids.bob!.lab}`, doctor.token)).status, 200, 'CHARACTERIZATION: a clinician reads any result by id')
  // Kontrol berpasangan: peran lain TIDAK tenant-wide.
  assert.deepEqual(labIds(await call('GET', '/api/lab-results', alice.token)), [ids.alice!.lab], 'a patient sees only own results')
  assert.deepEqual(labIds(await call('GET', '/api/lab-results', bob.token)), [ids.bob!.lab], 'another patient sees only own results')
  assert.equal((await call('GET', `/api/lab-results/${ids.bob!.lab}`, alice.token)).status, 404, 'a patient cannot read another patient\'s result')
  const tak = await call('GET', '/api/lab-results', unverified.token)
  assert.deepEqual(tak.status === 200 ? labIds(tak) : [], [], 'an unverified doctor is treated as a plain patient: sees no other patient\'s data')
  assert.equal((await call('GET', `/api/lab-results/${ids.alice!.lab}`, unverified.token)).status, 404, 'an unverified doctor cannot read a patient result')
  // Owner (admin view): juga seluruh tenant, tetapi bukan peninjau klinis.
  assert.deepEqual(labIds(await call('GET', '/api/lab-results', owner.token)), both('lab'), 'the owner (admin view) lists the tenant')

  // (2) Kontributor dan verifikator: tidak punya kapabilitas hasil lab/rujukan, dengan atau tanpa verifikasi.
  for (const [who, t] of [['contributor', kontributor.token], ['verifier (verified)', verifikator.token]] as const) {
    assert.equal((await call('GET', '/api/lab-results', t)).status, 403, `${who}: list refused`)
    assert.equal((await call('GET', '/api/referrals', t)).status, 403, `${who}: referrals list refused`)
    assert.equal((await call('GET', `/api/lab-results/${ids.alice!.lab}`, t)).status, 403, `${who}: read refused`)
    assert.equal((await call('POST', '/api/lab-results', t, { patientId: pid(alice), item, source: 'lab-intake' })).status, 403, `${who}: intake refused`)
    assert.equal((await call('GET', '/api/lab-results/metrics', t)).status, 403, `${who}: metrics refused`)
    assert.equal((await call('POST', '/api/referrals', t, { patientId: pid(alice), kind: 'specialist', reason: 'x', toFacility: 'y' })).status, 403, `${who}: referral creation refused`)
  }
  assert.equal((await call('GET', '/api/lab-results', undefined)).status, 401, 'anonymous: 401')
  console.log('clinicianTenantReadHttp: current behaviour pinned — verified clinicians read the whole tenant (owner decision pending), patients/unverified doctors only their own, contributor/verifier have no lab or referral capability')
} finally {
  await running.stop()
}
