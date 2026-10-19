// F1 / Task 44 — ketahanan (API lambat, galat server 5xx, pemulihan, tanpa teks bocor/overflow/crash) pada halaman perjalanan kritis LAIN selain
// 3 halaman di user-journey-e2e.mjs, untuk peran pasien, dokter terverifikasi, pemilik dan perawat, di PERAMBAN terhadap aplikasi + API NYATA.
// Dipisahkan karena pembatas /api/auth (30 per 15 menit; TIDAK dilonggarkan) sudah hampir habis oleh skrip lain; skrip ini berjalan pada server SEGAR.
// Identitas sintetis; verifikasi dokter dan peran/penugasan perawat adalah fixture alur kerja, bukan persetujuan klinis.
//
// Jalankan: server dan frontend baru, lalu
//   PLAYWRIGHT_MODULE=<path>/playwright/index.js CHROME=<path chrome> QA_OUT=<json> node scripts/qa/user-journey-resilience.mjs
// Kontrol berpasangan per halaman: (0) tanpa gangguan halaman terisi; (a) API lambat 1,5 dtk; (b) API 500; (c) pemulihan setelah API normal.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'

const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const chromium = pw.chromium ?? pw.default.chromium
const API = process.env.QA_API || 'http://127.0.0.1:18790'
const APP = process.env.QA_URL || 'http://localhost:5190/'
const OWNER = process.env.QA_OWNER || 'owner-f1@example.com'
const VIEWPORTS = [{ name: 'mobile-390x844', width: 390, height: 844 }, { name: 'desktop-1440x900', width: 1440, height: 900 }]
const TOKEN_KEY = 'pmd-token'
const SESSION_KEY = 'panaceamed.session.v1'
const SLOW_MS = Number(process.env.QA_SLOW_MS || 1500)
// Kontrol negatif bawaan: QA_SABOTASE=bocor|overflow menyuntikkan cacat ke SETIAP halaman di peramban nyata; perjalanan HARUS gagal dengan nama langkah.
// (Membuktikan pendeteksi teks bocor dan overflow benar-benar bekerja tanpa membangun ulang aplikasi.)
const SABOTASE = process.env.QA_SABOTASE || ''
assert.ok(['', 'bocor', 'overflow'].includes(SABOTASE), `QA_SABOTASE tidak dikenal: ${SABOTASE}`)
const SKRIP_SABOTASE = { bocor: "document.addEventListener('DOMContentLoaded', () => { const d = document.createElement('div'); d.textContent = 'Saldo: NaN [object Object]'; document.body.appendChild(d) })",
  overflow: "document.addEventListener('DOMContentLoaded', () => { const d = document.createElement('div'); d.style.cssText = 'width:4000px;height:1px'; document.body.appendChild(d) })" }

const call = async (m, p, token, body) => {
  const r = await fetch(API + p, { method: m, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  return { status: r.status, json: await r.json().catch(() => null) }
}
const devLogin = async (email, role) => (await call('POST', '/api/auth/dev-login', null, { email, role, name: email })).json
// Hanya permintaan KE server API; pola glob '**/api/**' juga mencegat modul dev di direktori /api/ dan membuat chunk halaman macet (artefak uji).
const apiUrl = (u) => u.origin === new URL(API).origin && u.pathname.startsWith('/api/')
const results = []
const record = (viewport, journey, step, ok, detail) => results.push({ viewport, journey, step, ok, ...(detail ? { detail } : {}) })
async function step(viewport, journey, name, fn) {
  try { const detail = await fn(); record(viewport, journey, name, true, detail) } catch (e) { record(viewport, journey, name, false, String(e.message).split('\n')[0]); throw e }
}
const BOCOR = ['[object Object]', 'undefined', 'NaN', 'TypeError', 'Cannot read']
const bocor = (t) => BOCOR.filter((x) => t.includes(x))

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
let failed = null
try {
  // --- fixture sisi server (jalur resmi; server SEGAR) ---
  const owner = await devLogin(OWNER, 'owner'); assert.ok(owner?.token, 'login pemilik dev gagal')
  const dokter = await devLogin('dokter-res@example.com', 'dokter')
  assert.equal((await call('POST', `/api/doctors/${dokter.user.id}/verify`, owner.token, { status: 'verified' })).status, 200, 'pemilik memverifikasi dokter sintetis')
  const pasien = await devLogin('pasien-res@example.com', 'pasien')
  const perawat = await devLogin('perawat-res@example.com', 'perawat'); assert.equal(perawat.user.role, 'pasien', 'perawat mendaftar sendiri = pasien')
  assert.equal((await call('POST', '/api/owner/staff-role', owner.token, { userId: perawat.user.id, role: 'perawat' })).status, 200, 'pemilik memberi peran perawat')
  const P = 'p-res-tugas'
  assert.equal((await call('POST', '/api/owner/staff-assignments', owner.token, { userId: perawat.user.id, patientId: P })).status, 200, 'pemilik menugaskan perawat')
  const hasil = await call('POST', '/api/lab-results', owner.token, { patientId: P, item: { name: 'Glukosa-ketahanan', value: 5.5, unit: 'mmol/L', collectedAt: '2026-10-09' }, source: 'lab-intake' })
  assert.equal(hasil.status, 201, 'hasil lab sintetis untuk meja perawat')

  // Peran -> sesi, rute yang diuji, dan penanda halaman yang HARUS tetap terlihat (bukan sekadar tidak kosong).
  const PERAN = [
    { J: 'pasien', akun: { email: 'pasien-res@example.com', name: 'Pasien Res', role: 'pasien' }, token: pasien.token, shell: { role: 'button', name: 'Notifications' },
      rute: ['#/', '#/chatbot', '#/settings', '#/profile', '#/fitness-hub', '#/all-features'], minChar: 100 },
    { J: 'dokter', akun: { email: 'dokter-res@example.com', name: 'Dokter Res', role: 'dokter' }, token: dokter.token, shell: { role: 'button', name: 'Notifications' },
      rute: ['#/doctor-review', '#/doctor-review/lab-results'], minChar: 120 },
    { J: 'pemilik', akun: { email: OWNER, name: 'Pemilik Res', role: 'owner', isOwner: true }, token: owner.token, shell: { role: 'button', name: 'Notifications' },
      rute: ['#/owner'], minChar: 120 },
    { J: 'perawat', akun: { email: 'perawat-res@example.com', name: 'Perawat Res', role: 'perawat' }, token: perawat.token, shell: { role: 'heading', name: 'Lab result review' },
      rute: ['#/'], minChar: 80 },
  ]

  for (const vp of VIEWPORTS) {
    const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    const teks = (page) => page.evaluate(() => document.body.innerText)
    for (const peran of PERAN) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
      await ctx.addInitScript(([s, t, k1, k2]) => { localStorage.setItem(k1, s); localStorage.setItem(k2, t); localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1') },
        [JSON.stringify({ loginAt: Date.now(), account: { isOwner: false, isSubscriber: false, ...peran.akun, loggedAt: new Date().toISOString() } }), peran.token, SESSION_KEY, TOKEN_KEY])
      if (SABOTASE) await ctx.addInitScript({ content: SKRIP_SABOTASE[SABOTASE] })
      const page = await ctx.newPage(); const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      const cangkang = (pg) => pg.getByRole(peran.shell.role, { name: peran.shell.name }).first().waitFor({ timeout: 90000 })
      const J = `ketahanan-${peran.J}`
      const buka = async (rute) => { await page.goto(APP + rute, { waitUntil: 'domcontentloaded', timeout: 120000 }); await cangkang(page) }
      // Halaman dinilai 'terisi' bila cukup teks ATAU, untuk halaman yang memang ringkas, penanda khasnya terlihat (bukan sekadar bukan-kosong).
      const PENANDA = { '#/chatbot': /Anamnesis Assistant|educational & supportive/i, '#/settings': /Reset Local Data/ }
      const sehat = (rute, t) => (!PENANDA[rute] || PENANDA[rute].test(t)) && (rute === '#/chatbot' || t.trim().length > peran.minChar)
      const terisi = (rute, ms) => page.waitForFunction(([m, pen]) => { const t = document.body.innerText; return pen ? new RegExp(pen.source, pen.flags).test(t) : t.trim().length > m }, [peran.minChar, PENANDA[rute] ? { source: PENANDA[rute].source, flags: PENANDA[rute].flags } : null], { timeout: ms })
      // Kumpulkan SEMUA halaman sebelum menegaskan: satu run memberi data kalibrasi lengkap (ukuran teks per halaman) dan satu pesan gagal merinci semuanya.
      const periksa = async (nama, rutes, fn) => {
        const gagal = [], ukur = {}
        for (const rute of rutes) { try { ukur[rute] = await fn(rute) } catch (e) { gagal.push(`${rute}: ${String(e.message).split('\n')[0]}`) } }
        assert.deepEqual(gagal, [], `${nama}: ${gagal.join(' | ')}`)
        return ukur
      }

      await step(vp.name, J, 'kontrol positif tanpa gangguan: tiap halaman terisi (pemanasan)', () => periksa('kontrol positif', peran.rute, async (rute) => {
        await buka(rute); await terisi(rute, 120000)
        const t = await teks(page); assert.ok(sehat(rute, t), `tidak terisi TANPA gangguan (${t.trim().length} karakter)`); return { chars: t.trim().length }
      }))
      await step(vp.name, J, `API lambat (${SLOW_MS} ms): cangkang tetap tampil, tanpa overflow atau teks bocor`, async () => {
        await page.route(apiUrl, async (r) => { await new Promise((x) => setTimeout(x, SLOW_MS)); await r.continue().catch(() => {}) })
        try {
          return await periksa('API lambat', peran.rute, async (rute) => {
            await buka(rute)
            const o = await overflowX(page); assert.ok(o <= 1, `overflow ${o}px saat lambat`)
            const b = bocor(await teks(page)); assert.deepEqual(b, [], `teks bocor saat lambat: ${b}`)
          })
        } finally { await page.unroute(apiUrl) }
      })
      await step(vp.name, J, 'API 500: halaman tidak crash, tidak kosong, tanpa teks bocor atau overflow', async () => {
        await page.route(apiUrl, (r) => r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) }))
        return await periksa('API 500', peran.rute, async (rute) => {
          await buka(rute); await terisi(rute, 60000)
          const t = await teks(page)
          assert.ok(sehat(rute, t), `nyaris kosong saat API 500 (${t.trim().length} karakter; teks=${JSON.stringify(t.trim().slice(0, 80))})`)
          const b = bocor(t); assert.deepEqual(b, [], `teks bocor saat API 500: ${b}`)
          const o = await overflowX(page); assert.ok(o <= 1, `overflow ${o}px saat API 500`)
          return { chars: t.trim().length }
        })
      })
      await step(vp.name, J, 'pemulihan: setelah API normal, halaman terisi lagi tanpa teks bocor', async () => {
        await page.unroute(apiUrl)
        return await periksa('pemulihan', peran.rute, async (rute) => {
          await buka(rute); await terisi(rute, 60000)
          const t = await teks(page); assert.ok(sehat(rute, t), `pemulihan: tidak terisi (${t.trim().length} karakter)`); assert.deepEqual(bocor(t), [], 'teks bocor setelah pemulihan')
          return { chars: t.trim().length }
        })
      })
      await step(vp.name, J, 'tanpa galat halaman tak tertangani selama semua keadaan', async () => { assert.deepEqual(errors, []) })
      await ctx.close()
    }
  }
} catch (e) { failed = e } finally {
  await browser.close()
  const ringkas = { dihasilkan: new Date().toISOString(), api: API, app: APP, lulus: results.filter((r) => r.ok).length, gagal: results.filter((r) => !r.ok).length, hasil: results }
  writeFileSync(process.env.QA_OUT || 'user-journey-resilience-evidence.json', JSON.stringify(ringkas, null, 2))
  console.log(`user-journey-resilience: ${ringkas.lulus} lulus, ${ringkas.gagal} gagal`)
  if (failed) { console.error(failed.message); process.exit(1) }
}
