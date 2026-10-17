// Alpha E2: peran yang salah ditolak pada setiap rute data klinis. Menjalankan server NYATA (berkas data sementara, port bebas,
// login dev) dan memeriksa tiap rute `/api/clinical*` dengan tiga pemanggil: anonim, pasien, dan "dokter" tanpa STR terverifikasi
// (diperlakukan sebagai pasien oleh requireAuth). Tanpa jaringan luar.
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { idPasienDiri } from '../src/domains/clinical-records/aksesKlinis.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const FOREIGN = 'p-clinic-001'
// Matriks: rute -> status yang diharapkan untuk pasien dan dokter-tanpa-STR (anonim selalu 401). Isinya disepakati dengan kode
// penjaga di index.ts: 403 = ditolak peran/kepemilikan; 404 = objek/kode tidak ada SEBELUM ada efek; 200 hanya untuk rute yang
// menyaring hasil ke data milik sendiri (diperiksa tidak bocor di bawah).
const MATRIX: Record<string, { pasien: number; dokterTanpaStr: number }> = {
  'GET /api/clinical': { pasien: 200, dokterTanpaStr: 200 },
  'POST /api/clinical/record': { pasien: 403, dokterTanpaStr: 403 },
  'POST /api/clinical/encounter/close': { pasien: 403, dokterTanpaStr: 403 },
  'GET /api/clinical/encounters/:patientId': { pasien: 403, dokterTanpaStr: 403 },
  'POST /api/clinical/patient/:patientId/link-code': { pasien: 404, dokterTanpaStr: 404 },
  'GET /api/clinical/patient/:patientId/link-status': { pasien: 403, dokterTanpaStr: 403 },
  'POST /api/clinical/link': { pasien: 404, dokterTanpaStr: 404 },
  'GET /api/clinical/links': { pasien: 200, dokterTanpaStr: 200 },
  'DELETE /api/clinical/link/:patientId': { pasien: 404, dokterTanpaStr: 404 },
  'GET /api/clinical/records/:patientId': { pasien: 403, dokterTanpaStr: 403 },
  'GET /api/clinical/record-history/:patientId': { pasien: 403, dokterTanpaStr: 403 },
  'POST /api/clinical/education': { pasien: 403, dokterTanpaStr: 403 },
  'POST /api/clinical/vital': { pasien: 403, dokterTanpaStr: 403 },
  'POST /api/clinical/supportive': { pasien: 403, dokterTanpaStr: 403 },
  'POST /api/clinical/patient': { pasien: 403, dokterTanpaStr: 403 },
}

// 1) Kelengkapan: setiap rute klinis di index.ts harus ada di matriks (rute baru memaksa keputusan RBAC eksplisit).
const src = readFileSync(join(ROOT, 'src', 'index.ts'), 'utf8')
const dikenali = [...src.matchAll(/app\.(get|post|put|patch|delete)\('(\/api\/clinical(?:\/[^']*)?)'/g)].map((m) => `${m[1].toUpperCase()} ${m[2]}`)
assert.ok(dikenali.length >= 15, `pemindai rute menemukan terlalu sedikit rute (${dikenali.length})`)
for (const r of dikenali) assert.ok(r in MATRIX, `rute klinis tanpa keputusan RBAC di matriks: ${r}`)
for (const r of Object.keys(MATRIX)) assert.ok(dikenali.includes(r), `matriks memuat rute yang tidak ada lagi: ${r}`)

// 2) Server nyata.
const port: number = await new Promise((res) => { const s = createServer().listen(0, () => { const p = (s.address() as { port: number }).port; s.close(() => res(p)) }) })
const dir = mkdtempSync(join(tmpdir(), 'rbac-klinis-'))
const ownerEmail = 'rbac-owner@localhost.test'
const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
  cwd: ROOT, stdio: 'ignore',
  env: { ...process.env, PORT: String(port), NODE_ENV: 'development', ALLOW_DEV_LOGIN: 'true', PANACEA_DATA_FILE: join(dir, 'data.json'), MONGODB_URI: '', JWT_SECRET: randomBytes(32).toString('hex'), OWNER_EMAIL: ownerEmail, PANACEA_ARCHIVE_DIR: join(dir, 'archive'), COOKIE_SECURE: 'false', GOOGLE_CLIENT_ID: '', RESEND_API_KEY: '', SMTP_HOST: '', SMTP_USER: '', VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: '', MIDTRANS_SERVER_KEY: '', MIDTRANS_CLIENT_KEY: '', IRIS_API_KEY: '', IRIS_CREATOR_KEY: '', ANTHROPIC_API_KEY: '', OPENROUTER_API_KEY: '', GENOMICS_WORKER_URL: '', WHO_ICD_CLIENT_ID: '', WHO_ICD_CLIENT_SECRET: '' },
})
const exited = new Promise<void>(resolve => { child.once('exit', () => resolve()); child.once('error', () => resolve()) })
const B = `http://127.0.0.1:${port}`
try {
  let siap = false
  for (let i = 0; i < 120 && !siap; i++) {
    assert.equal(child.exitCode, null, 'isolated server remains running')
    try { siap = (await fetch(`${B}/api/health`, { signal: AbortSignal.timeout(1000) })).ok } catch { /* belum naik */ }
    if (!siap) await new Promise((r) => setTimeout(r, 500))
  }
  assert.ok(siap, 'server uji tidak naik')
  const login = async (email: string, role: string) => {
    const r = await fetch(`${B}/api/auth/dev-login`, { method: 'POST', signal: AbortSignal.timeout(5000), headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, role, name: email }) })
    assert.equal(r.status, 200, `dev-login ${role}`)
    return (await r.json()) as { token: string; user: { id: string; role: string } }
  }
  const pasien = await login('pasien-rbac@example.com', 'pasien')
  const dokter = await login('dokter-rbac@example.com', 'dokter')
  assert.equal(dokter.user.role, 'dokter', 'prasyarat: akun uji bertipe dokter tetapi tanpa STR terverifikasi')
  const call = async (m: string, p: string, token: string | null, body?: unknown) => {
    const r = await fetch(B + p, { method: m, signal: AbortSignal.timeout(5000), headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: m === 'GET' || m === 'DELETE' ? undefined : JSON.stringify(body ?? {}) })
    return { status: r.status, json: (await r.json().catch(() => null)) as any }
  }

  for (const [kunci, harap] of Object.entries(MATRIX)) {
    const [m, pola] = kunci.split(' ')
    const p = pola.replace(':patientId', FOREIGN)
    const body = { patientId: FOREIGN, patient: { id: FOREIGN, name: 'x' }, code: 'KODE-SALAH', record: { id: 'r1', patientId: FOREIGN }, sheet: {}, vital: {}, result: {} }
    assert.equal((await call(m, p, null, body)).status, 401, `anonim harus 401: ${kunci}`)
    assert.equal((await call(m, p, pasien.token, body)).status, harap.pasien, `pasien: ${kunci}`)
    assert.equal((await call(m, p, dokter.token, body)).status, harap.dokterTanpaStr, `dokter tanpa STR: ${kunci}`)
  }

  // 3) Tanpa efek samping: percobaan yang ditolak tidak menulis data pasien asing; rute berstatus 200 hanya memuat data sendiri.
  for (const t of [pasien.token, dokter.token]) {
    const c = (await call('GET', '/api/clinical', t)).json
    assert.ok(!(c.patients ?? []).some((x: { id: string }) => x.id === FOREIGN), 'pasien asing muncul setelah percobaan ditolak')
    for (const k of ['vitals', 'records', 'supportive', 'education']) assert.ok(!(FOREIGN in (c[k] ?? {})), `${k} pasien asing muncul`)
  }
  assert.deepEqual((await call('GET', '/api/clinical/links', pasien.token)).json, { links: [] })

  // 4) Pasangan: satu-satunya beda adalah id pasien. Id milik sendiri diterima, id asing ditolak.
  const diri = idPasienDiri(pasien.user.id)
  assert.equal((await call('POST', '/api/clinical/patient', pasien.token, { patient: { id: FOREIGN, name: 'x' } })).status, 403, 'id asing harus ditolak')
  assert.equal((await call('POST', '/api/clinical/patient', pasien.token, { patient: { id: diri, name: 'Diri' } })).status, 200, 'id milik sendiri harus diterima')
  const sesudah = (await call('GET', '/api/clinical', pasien.token)).json
  assert.deepEqual((sesudah.patients ?? []).map((x: { id: string }) => x.id), [diri], 'hanya rekam milik sendiri yang terlihat')
  // 5) Real populated practice patient, independent self identities and explicit consent link.
  const owner = await login(ownerEmail, 'pasien')
  assert.equal((await call('POST', `/api/doctors/${dokter.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const bob = await login('bob-rbac@localhost.test', 'pasien')
  const makeRecord = (patientId: string, id: string) => ({ id, patientId, anamnesis: { keluhanUtama: `Synthetic private marker ${id}` }, problems: [], plan: [], references: [], clinically_reviewed: false })
  assert.equal((await call('POST', '/api/clinical/patient', dokter.token, { patient: { id: 'p1', name: 'Synthetic private patient' } })).status, 200)
  const privateRecord = makeRecord('p1', 'private-p1-record')
  assert.equal((await call('POST', '/api/clinical/record', dokter.token, { patientId: 'p1', record: privateRecord })).status, 200)
  const privateRecords = (await call('GET', '/api/clinical/records/p1', dokter.token)).json
  assert.ok(JSON.stringify(privateRecords).includes(privateRecord.anamnesis.keluhanUtama), 'practice record genuinely populated')
  const assertExcluded = async (token: string, patientId: string) => {
    const state = await call('GET', '/api/clinical', token)
    assert.equal(state.status, 200)
    assert.ok(!(state.json.patients ?? []).some((p: { id: string }) => p.id === patientId), 'unowned populated patient excluded from list')
    assert.ok(!(patientId in (state.json.records ?? {})), 'unowned populated record excluded from list')
  }
  for (const account of [pasien, bob]) {
    assert.equal((await call('GET', '/api/clinical/records/p1', account.token)).status, 403, 'unlinked patient cannot read existing private p1')
    await assertExcluded(account.token, 'p1')
  }
  const bobId = idPasienDiri(bob.user.id)
  assert.notEqual(diri, bobId)
  for (const [account, ownId, otherId] of [[pasien, diri, bobId], [bob, bobId, diri]] as const) {
    assert.equal((await call('POST', '/api/clinical/patient', account.token, { patient: { id: ownId, name: 'Synthetic self patient' } })).status, 200)
    const ownRecord = makeRecord(ownId, `self-${account.user.id}`)
    assert.equal((await call('POST', '/api/clinical/record', account.token, { patientId: ownId, record: ownRecord })).status, 200)
    const ownRead = await call('GET', `/api/clinical/records/${ownId}`, account.token)
    assert.equal(ownRead.status, 200)
    assert.ok(JSON.stringify(ownRead.json).includes(ownRecord.anamnesis.keluhanUtama), 'own private marker is readable')
    const beforeDeniedWrite = await call('GET', `/api/clinical/records/${otherId}`, dokter.token)
    assert.equal(beforeDeniedWrite.status, 200)
    assert.equal((await call('POST', '/api/clinical/record', account.token, { patientId: otherId, record: makeRecord(otherId, 'foreign-write') })).status, 403, 'reciprocal foreign record write denied')
    const afterDeniedWrite = await call('GET', `/api/clinical/records/${otherId}`, dokter.token)
    assert.equal(afterDeniedWrite.status, 200)
    assert.deepEqual(afterDeniedWrite.json, beforeDeniedWrite.json, 'denied reciprocal write preserves exact clinician-visible records')
  }
  for (const [account, otherId] of [[pasien, bobId], [bob, diri]] as const) {
    assert.equal((await call('GET', `/api/clinical/records/${otherId}`, account.token)).status, 403, 'reciprocal populated self record read denied')
    await assertExcluded(account.token, otherId)
  }
  const issued = await call('POST', '/api/clinical/patient/p1/link-code', dokter.token)
  assert.equal(issued.status, 200)
  assert.equal(typeof issued.json.code, 'string')
  const redeemed = await call('POST', '/api/clinical/link', pasien.token, { code: issued.json.code })
  assert.equal(redeemed.status, 200)
  assert.equal(redeemed.json.patientId, 'p1')
  const linkedRead = await call('GET', '/api/clinical/records/p1', pasien.token)
  assert.equal(linkedRead.status, 200, 'explicit link grants only redeeming patient access')
  assert.deepEqual(linkedRead.json, privateRecords, 'link admits exact original private record')
  const linkedState = (await call('GET', '/api/clinical', pasien.token)).json
  assert.ok(linkedState.patients.some((p: { id: string }) => p.id === 'p1'))
  assert.ok('p1' in linkedState.records)
  assert.equal((await call('GET', '/api/clinical/records/p1', bob.token)).status, 403, 'other account remains denied after link redemption')
  await assertExcluded(bob.token, 'p1')
  assert.deepEqual((await call('GET', '/api/clinical/links', bob.token)).json, { links: [] })
  console.log(`rbacKlinis: ${Object.keys(MATRIX).length} rute klinis; anonim 401, pasien dan dokter tanpa STR ditolak sesuai matriks; id asing 403 vs id sendiri 200`)
} finally {
  // Tunggu proses anak benar-benar keluar sebelum menghapus direktori: server yang masih menulis berkas data membuat rmSync gagal ENOTEMPTY (CI #2369).
  child.kill('SIGTERM')
  let timer: ReturnType<typeof setTimeout> | undefined
  try { await Promise.race([exited, new Promise<void>(resolve => { timer = setTimeout(resolve, 5000) })]) }
  finally { if (timer) clearTimeout(timer) }
  if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await exited }
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}

// Reserved object-property names are never valid patient ids (every clinical, lab and referral entry point, no 5xx, nothing stored).
await import('./reservedPatientIdsHttp.uji.js')

// Alpha E2: one access decision for every registered route (table vs source vs a real server).
await import('./routeAccessDecisions.uji.js')

// Alpha F1: perawat/lab owner-granted roles scoped by explicit patient assignment (store, then real HTTP).
await import('./staffStore.uji.js')
await import('./staffRbacHttp.uji.js')
await import('./staffAssignmentsSelfHttp.uji.js')
