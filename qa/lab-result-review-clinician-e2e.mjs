// E2E antrean tinjauan hasil lab oleh KLINISI TERVERIFIKASI terhadap server nyata + peramban (Alpha B7).
// Jalankan: backend (OWNER_EMAIL=owner-qa@example.com ALLOW_DEV_LOGIN=true CORS_ORIGINS=http://localhost:5188 PANACEA_DATA_FILE=<tmp> PORT=18788 npx tsx src/index.ts)
//   + VITE_API_URL=http://127.0.0.1:18788 npx vite --port 5188, lalu
//   PLAYWRIGHT_MODULE=<path> CHROME=<path chrome> node qa/lab-result-review-clinician-e2e.mjs
// Butuh server BARU (status verifikasi dokter tersimpan di server; jalan kedua pada server yang sama gagal pada asersi 'dokter belum terverifikasi').
// Pemilik memverifikasi STR dokter lewat rute server resmi (/api/doctors/:id/verify); ini fixture uji, bukan bukti kualifikasi nyata.
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const API = process.env.QA_API || 'http://127.0.0.1:18788'
const URL_ = process.env.QA_URL || 'http://localhost:5188/qa/lab-result-review.html'
const call = async (m, p, token, body) => { const r = await fetch(API + p, { method: m, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, json: await r.json().catch(() => null) } }
const login = async (email, role) => (await call('POST', '/api/auth/dev-login', null, { email, role, name: email })).json
const owner = await login('owner-qa@example.com', 'owner')
const dokter = await login('dokter-qa@example.com', 'dokter')
assert.ok(owner?.token && dokter?.token, 'login dev gagal')
const seed = await call('POST', '/api/lab-results', owner.token, { patientId: 'p-e2e-1', item: { name: 'Hemoglobin', value: 13.2, unit: 'g/dL', referenceRange: '12-16', collectedAt: '2026-10-09' }, source: 'lab-intake' })
assert.equal(seed.status, 201); const id = seed.json.id
// Sebelum verifikasi STR: dokter diperlakukan sebagai pasien oleh server -> tidak boleh melihat/menandai hasil lab praktik
assert.equal((await call('POST', `/api/lab-results/${id}/advance`, dokter.token, { to: 'pending_review', expectedStatus: 'received' })).status >= 400, true, 'dokter belum terverifikasi tidak boleh memajukan hasil')
assert.equal((await call('POST', `/api/doctors/${dokter.user.id}/verify`, dokter.token, { status: 'verified' })).status, 403, 'dokter tidak boleh memverifikasi dirinya sendiri')
assert.equal((await call('POST', `/api/doctors/${dokter.user.id}/verify`, owner.token, { status: 'verified' })).status, 200, 'pemilik memverifikasi STR')
const dokter2 = await login('dokter-qa@example.com', 'dokter')  // sesi baru setelah verifikasi

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(([s, t]) => { localStorage.setItem('panaceamed.session.v1', s); localStorage.setItem('pmd-token', t) }, [JSON.stringify({ loginAt: Date.now(), account: { email: 'dokter-qa@example.com', name: 'Dokter QA', role: 'dokter', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } }), dokter2.token])
  await page.goto(URL_, { timeout: 120000 })
  const row = page.locator('li', { hasText: 'p-e2e-1' })
  await row.getByText('Hemoglobin').waitFor({ timeout: 60000 })
  const step = async (label, expectNext) => {
    await row.getByRole('button', { name: label }).click()
    await row.getByText(expectNext, { exact: true }).waitFor({ timeout: 20000 })
  }
  await step('Mark awaiting review', 'Awaiting review')
  await row.getByRole('button', { name: 'Mark reviewed' }).waitFor({ timeout: 20000 })
  await step('Mark reviewed', 'Reviewed')
  // komunikasi wajib catatan: tombol nonaktif tanpa catatan
  const comm = row.getByRole('button', { name: 'Record communication' })
  await comm.waitFor({ timeout: 20000 })
  assert.equal(await comm.isDisabled(), true, 'komunikasi tanpa catatan harus dinonaktifkan')
  await row.getByLabel('What was communicated').fill('Patient informed by phone')
  assert.equal(await comm.isDisabled(), false)
  await step('Record communication', 'Communicated')
  await step('Close result', 'Closed')
  // server adalah otoritas: status akhir dan jejak audit utuh
  const final = (await call('GET', `/api/lab-results/${id}`, dokter2.token)).json
  assert.equal(final.status, 'closed')
  assert.deepEqual(final.trail.map((a) => a.to), ['pending_review', 'reviewed', 'communicated', 'closed'], 'jejak audit lengkap dan berurutan')
  assert.ok(final.trail.every((a) => a.actorId && a.role === 'clinician' || a.to === 'pending_review'), 'setiap langkah punya pelaku')
  assert.deepEqual(errors, [])
  console.log('lab-result-review-clinician-e2e OK', JSON.stringify({ id, status: final.status, steps: final.trail.length }))
} finally { await browser.close() }
