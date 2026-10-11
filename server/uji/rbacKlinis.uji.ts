// Alpha E2: peran yang salah ditolak pada setiap rute data klinis. Menjalankan server NYATA (berkas data sementara, port bebas,
// login dev) dan memeriksa tiap rute `/api/clinical*` dengan tiga pemanggil: anonim, pasien, dan "dokter" tanpa STR terverifikasi
// (diperlakukan sebagai pasien oleh requireAuth). Tanpa jaringan luar.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { idPasienDiri } from '../src/aksesKlinis.js'

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
const child = spawn(join(ROOT, 'node_modules', '.bin', 'tsx'), ['src/index.ts'], {
  cwd: ROOT, stdio: 'ignore',
  env: { ...process.env, PORT: String(port), NODE_ENV: 'development', ALLOW_DEV_LOGIN: 'true', PANACEA_DATA_FILE: join(dir, 'data.json'), MONGODB_URI: '' },
})
const B = `http://127.0.0.1:${port}`
try {
  let siap = false
  for (let i = 0; i < 120 && !siap; i++) {
    try { siap = (await fetch(`${B}/api/health`)).ok } catch { /* belum naik */ }
    if (!siap) await new Promise((r) => setTimeout(r, 500))
  }
  assert.ok(siap, 'server uji tidak naik')
  const login = async (email: string, role: string) => {
    const r = await fetch(`${B}/api/auth/dev-login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, role, name: email }) })
    assert.equal(r.status, 200, `dev-login ${role}`)
    return (await r.json()) as { token: string; user: { id: string; role: string } }
  }
  const pasien = await login('pasien-rbac@example.com', 'pasien')
  const dokter = await login('dokter-rbac@example.com', 'dokter')
  assert.equal(dokter.user.role, 'dokter', 'prasyarat: akun uji bertipe dokter tetapi tanpa STR terverifikasi')
  const call = async (m: string, p: string, token: string | null, body?: unknown) => {
    const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: m === 'GET' || m === 'DELETE' ? undefined : JSON.stringify(body ?? {}) })
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
  console.log(`rbacKlinis: ${Object.keys(MATRIX).length} rute klinis; anonim 401, pasien dan dokter tanpa STR ditolak sesuai matriks; id asing 403 vs id sendiri 200`)
} finally {
  child.kill('SIGTERM')
  rmSync(dir, { recursive: true, force: true })
}
