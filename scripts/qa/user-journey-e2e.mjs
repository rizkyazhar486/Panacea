// F1 / Task 44 — perjalanan pengguna kritis di PERAMBAN terhadap aplikasi + API NYATA (identitas sintetis).
// Bukan harness halaman: memakai formulir Login sungguhan, shell sungguhan, dan server sungguhan.
//
// Jalankan (server dan frontend BARU, karena status verifikasi dokter tersimpan di server):
//   (cd server && OWNER_EMAIL=owner-f1@example.com ALLOW_DEV_LOGIN=true CORS_ORIGINS=http://localhost:5190 \
//      PANACEA_DATA_FILE=<tmp>/data.json PORT=18790 npx tsx src/index.ts)
//   VITE_API_URL=http://127.0.0.1:18790 npx vite --port 5190
//   PLAYWRIGHT_MODULE=<path>/playwright/index.js CHROME=<path chrome> node scripts/qa/user-journey-e2e.mjs
// Keluaran: JSON bukti di QA_OUT (default ./user-journey-evidence.json). Kode keluar != 0 bila ada asersi gagal.
//
// BATAS YANG DICATAT, bukan dianggap lulus (kriteria F1): peran perawat, laboratorium, dan admin tidak punya
// perjalanan antarmuka sendiri yang dapat diuji di sini; hasilnya dilaporkan "tidak-tercakup" di berkas bukti.
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

const call = async (m, p, token, body) => {
  const r = await fetch(API + p, { method: m, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  return { status: r.status, json: await r.json().catch(() => null) }
}
const devLogin = async (email, role) => (await call('POST', '/api/auth/dev-login', null, { email, role, name: email })).json
const results = []
const temuan = []
const record = (viewport, journey, step, ok, detail) => results.push({ viewport, journey, step, ok, ...(detail ? { detail } : {}) })

// Setiap tabrakan asersi dicatat lalu dilempar ulang: satu langkah gagal = skrip gagal (tidak ada pelonggaran).
async function step(viewport, journey, name, fn) {
  try { const detail = await fn(); record(viewport, journey, name, true, detail) } catch (e) { record(viewport, journey, name, false, String(e.message).split('\n')[0]); throw e }
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
let failed = null
try {
  // --- fixture sisi server (identitas sintetis, jalur resmi) ---
  const owner = await devLogin(OWNER, 'owner')
  assert.ok(owner?.token, 'login pemilik dev gagal')
  const dokter = await devLogin('dokter-f1@example.com', 'dokter')
  assert.equal((await call('POST', `/api/doctors/${dokter.user.id}/verify`, owner.token, { status: 'verified' })).status, 200, 'pemilik memverifikasi dokter sintetis')
  const dokterAktif = await devLogin('dokter-f1@example.com', 'dokter')
  const pasienApi = await devLogin('pasien-f1@example.com', 'pasien')
  const seed = await call('POST', '/api/lab-results', owner.token, { patientId: 'p-f1-lain', item: { name: 'Hemoglobin', value: 13.1, unit: 'g/dL', collectedAt: '2026-10-09' }, source: 'lab-intake' })
  assert.equal(seed.status, 201, 'seed hasil lab sintetis')
  const labId = seed.json.id

  // ===== Sekali jalan (API saja, tanpa viewport): RBAC peran lain, eskalasi peran, pencabutan token =====
  {
    const J = 'api-rbac'; const VP = 'api'
    await step(VP, J, 'logout mencabut bearer token di server; sesi lain akun yang sama tetap sah (#2558)', async () => {
      const tokA = (await devLogin('dokter-f1@example.com', 'dokter')).token
      await new Promise((r) => setTimeout(r, 1100)) // jti acak membedakan token; jeda menghindari kolisi iat
      const tokB = (await devLogin('dokter-f1@example.com', 'dokter')).token
      assert.equal((await call('GET', '/api/auth/me', tokA)).status, 200, 'kontrol positif: token sah sebelum logout')
      await call('POST', '/api/auth/logout', tokA)
      assert.equal((await call('GET', '/api/auth/me', tokA)).status, 401, 'token yang di-logout harus ditolak')
      assert.equal((await call('GET', '/api/auth/me', tokB)).status, 200, 'sesi lain akun yang sama tidak boleh ikut dicabut')
    })
    await step(VP, J, 'RBAC tiga-arah: verifikator belum diverifikasi ditolak, setelah diverifikasi pemilik diterima, pasien tetap ditolak', async () => {
      const email = 'verifikator-api@example.com'; const body = { email: 'tidak-ada@example.com', body: 'uji' }
      const baru = await devLogin(email, 'verifikator'); assert.equal(baru.user.role, 'verifikator', 'peran swa-layanan tercatat')
      const sebelum = await call('POST', '/api/notify/user', baru.token, body); assert.equal(sebelum.status, 403, `belum diverifikasi harus 403, dapat ${sebelum.status}`)
      assert.equal((await call('POST', `/api/doctors/${baru.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
      const sesudah = await call('POST', '/api/notify/user', baru.token, body); assert.equal(sesudah.status, 200, `setelah verifikasi harus 200, dapat ${sesudah.status}`)
      const pasien = await call('POST', '/api/notify/user', pasienApi.token, body); assert.equal(pasien.status, 403, `pasien harus 403, dapat ${pasien.status}`)
    })
    await step(VP, J, 'eskalasi peran ditolak: login mandiri sebagai admin/perawat tidak memberi peran itu', async () => {
      for (const r of ['admin', 'perawat']) { const x = await devLogin(`eskalasi-${r}-${VP}@example.com`, r); assert.equal(x.user.role, 'pasien', `peran ${r} tidak boleh didapat lewat login mandiri, dapat ${x.user.role}`) }
      const x = await devLogin(`eskalasi-owner-${VP}@example.com`, 'owner'); assert.notEqual(x.user.role, 'owner', 'bukan pemilik terdaftar tidak boleh menjadi owner')
    })
  }

  for (const vp of VIEWPORTS) {
    const newPage = async () => {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
      const page = await ctx.newPage(); const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      return { ctx, page, errors }
    }
    const openLogin = async (page) => {
      await page.goto(APP + '#/', { waitUntil: 'domcontentloaded', timeout: 120000 })
      await masuk(page).click({ timeout: 60000 })
      await page.getByPlaceholder('nama@email.com').waitFor({ timeout: 30000 })
    }
    const logout = async (page) => {
      const direct = page.getByRole('button', { name: 'Log out', exact: true })
      if (await direct.first().isVisible().catch(() => false)) { await direct.first().click(); return }
      await page.getByRole('button', { name: 'Menu akun dan keluar' }).click()
      await page.getByRole('button', { name: 'Log out' }).click()
    }
    const masuk = (page) => page.getByRole('button', { name: /^Masuk( \/ Daftar Gratis)?$/ }).first()
    const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

    // ===== Perjalanan 1: pasien — login nyata → dashboard → navigasi → back/refresh/deep link → logout =====
    {
      const { ctx, page, errors } = await newPage(); const J = 'pasien'
      await step(vp.name, J, 'persetujuan wajib: tombol masuk nonaktif tanpa centang (negatif)', async () => {
        await openLogin(page)
        await page.getByPlaceholder('nama@email.com').fill('pasien-f1@example.com')
        const tombol = page.getByRole('button', { name: /Centang Persetujuan untuk Lanjut/ })
        assert.equal(await tombol.isDisabled(), true, 'tanpa persetujuan tombol harus nonaktif')
      })
      await step(vp.name, J, 'login dengan persetujuan → dashboard (positif)', async () => {
        await page.getByRole('checkbox').check()
        await page.getByRole('button', { name: /Masuk|Lanjut/ }).last().click()
        await page.getByRole('button', { name: 'Notifications' }).waitFor({ timeout: 60000 })
        const tokenAda = await page.evaluate((k) => !!localStorage.getItem(k), TOKEN_KEY)
        assert.equal(tokenAda, true, 'token sesi tersimpan setelah login')
      })
      await step(vp.name, J, 'onboarding pengguna baru muncul dan dapat ditutup (tidak menjebak)', async () => {
        const panduan = page.getByRole('dialog', { name: 'New user guide' })
        await panduan.waitFor({ timeout: 30000 })
        await panduan.getByRole('button', { name: /Get Started/ }).click()
        await panduan.waitFor({ state: 'hidden', timeout: 15000 })
        // Ajakan asesmen awal opsional muncul sesudahnya: harus dapat dilewati, bukan gerbang.
        const ajakan = page.getByRole('region', { name: 'Initial assessment prompt' })
        if (await ajakan.isVisible().catch(() => false)) { await ajakan.getByRole('button', { name: 'Nanti saja' }).click(); await ajakan.waitFor({ state: 'hidden', timeout: 15000 }) }
      })
      await step(vp.name, J, 'tidak ada overflow horizontal di dashboard', async () => {
        const o = await overflowX(page); assert.ok(o <= 1, `overflow horizontal ${o}px`); return { overflowPx: o }
      })
      await step(vp.name, J, 'navigasi ke tujuan fitur lewat tautan shell', async () => {
        await page.locator('a[href="#/chatbot"]').first().click()
        await page.waitForFunction(() => location.hash.startsWith('#/chatbot'), null, { timeout: 30000 })
      })
      await step(vp.name, J, 'tombol kembali peramban tidak buntu', async () => {
        await page.goBack()
        await page.waitForFunction(() => !location.hash.startsWith('#/chatbot'), null, { timeout: 30000 })
        await page.getByRole('button', { name: 'Notifications' }).waitFor({ timeout: 30000 })
      })
      await step(vp.name, J, 'deep link + refresh mempertahankan sesi', async () => {
        await page.goto(APP + '#/harian', { waitUntil: 'domcontentloaded' })
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.getByRole('button', { name: 'Notifications' }).waitFor({ timeout: 60000 })
        assert.ok(page.url().includes('#/harian'), 'deep link tetap')
      })
      await step(vp.name, J, 'RBAC negatif: pasien ditolak API klinisi (server)', async () => {
        const r = await call('POST', '/api/doctors/x/verify', pasienApi.token, { status: 'verified' }); assert.ok([401, 403].includes(r.status), `status ${r.status}`)
        // Pasangan positif/negatif: pemilik MELIHAT hasil lab pasien lain; pasien biasa TIDAK.
        const pemilik = await call('GET', '/api/lab-results?patientId=p-f1-lain', owner.token)
        assert.ok((pemilik.json?.results ?? []).some((x) => x.id === labId), 'pemilik harus melihat hasil seed (kontrol positif)')
        const k = await call('GET', '/api/lab-results?patientId=p-f1-lain', pasienApi.token)
        assert.ok(k.status === 403 || (k.status === 200 && !(k.json?.results ?? []).some((x) => x.id === labId)), `pasien melihat data lab pasien lain: ${k.status}`)
        assert.equal((await call('GET', `/api/lab-results/${labId}`, pasienApi.token)).status === 200, false, 'pasien tidak boleh membaca rincian hasil pasien lain')
      })
      await step(vp.name, J, 'logout terlihat dan benar-benar mengakhiri sesi', async () => {
        await logout(page)
        await masuk(page).waitFor({ timeout: 30000 })
        const sisa = await page.evaluate((k) => localStorage.getItem(k), SESSION_KEY)
        assert.equal(sisa, null, 'sesi lokal dibersihkan')
      })
      await step(vp.name, J, 'rute terlindungi setelah logout kembali ke login (tidak menampilkan data)', async () => {
        await page.goto(APP + '#/harian', { waitUntil: 'domcontentloaded' })
        await masuk(page).waitFor({ timeout: 30000 })
      })
      await step(vp.name, J, 'tanpa galat halaman tak tertangani', async () => { assert.deepEqual(errors, []) })
      await ctx.close()
    }

    // ===== Perjalanan 2: dokter terverifikasi — sesi nyata → area klinis → RBAC → sesi kedaluwarsa =====
    {
      const { ctx, page, errors } = await newPage(); const J = 'dokter'
      await ctx.addInitScript(([s, t, k1, k2]) => { localStorage.setItem(k1, s); localStorage.setItem(k2, t) }, [
        JSON.stringify({ loginAt: Date.now(), account: { email: 'dokter-f1@example.com', name: 'Dokter F1', role: 'dokter', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } }),
        dokterAktif.token, SESSION_KEY, TOKEN_KEY])
      await step(vp.name, J, 'sesi dokter → shell dimuat', async () => {
        await page.goto(APP + '#/clinical-hub', { waitUntil: 'domcontentloaded', timeout: 120000 })
        await page.getByRole('button', { name: 'Notifications' }).waitFor({ timeout: 60000 })
      })
      await step(vp.name, J, 'RBAC positif: dokter terverifikasi boleh memanggil rute klinisi', async () => {
        const r = await call('GET', '/api/clinician/lab-shares', dokterAktif.token); assert.equal(r.status, 200, `status ${r.status}`)
      })
      await step(vp.name, J, 'RBAC negatif: dokter tidak boleh memverifikasi dirinya sendiri', async () => {
        const r = await call('POST', `/api/doctors/${dokter.user.id}/verify`, dokterAktif.token, { status: 'verified' }); assert.equal(r.status, 403)
      })
      await step(vp.name, J, 'tidak ada overflow horizontal di area klinis', async () => { const o = await overflowX(page); assert.ok(o <= 1, `overflow ${o}px`); return { overflowPx: o } })
      await step(vp.name, J, 'sesi tidak sah: token rusak ditolak API (401) dan UI tidak crash', async () => {
        const rusak = dokterAktif.token.slice(0, -4) + 'xxxx'
        assert.equal((await call('GET', '/api/auth/me', rusak)).status, 401, 'token dengan tanda tangan rusak harus ditolak')
        assert.equal((await call('GET', '/api/auth/me', dokterAktif.token)).status, 200, 'kontrol positif: token asli diterima')
        await page.evaluate(([k, t]) => localStorage.setItem(k, t), [TOKEN_KEY, rusak])
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(3000)
      })
      await step(vp.name, J, 'tanpa galat halaman tak tertangani', async () => { assert.deepEqual(errors, []) })
      await ctx.close()
    }

    // ===== Perjalanan 4: pemilik/admin — verifikasi dokter lewat UI nyata, RBAC peran lain, eskalasi peran ditolak =====
    {
      const { ctx, page, errors } = await newPage(); const J = 'pemilik'
      const email = `dokter-ui-${vp.name}@example.com`
      const calon = await devLogin(email, 'dokter')
      await ctx.addInitScript(([s, t, k1, k2]) => { localStorage.setItem(k1, s); localStorage.setItem(k2, t); localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1') }, [
        JSON.stringify({ loginAt: Date.now(), account: { email: OWNER, name: 'Pemilik F1', role: 'owner', isOwner: true, isSubscriber: false, loggedAt: new Date().toISOString() } }),
        owner.token, SESSION_KEY, TOKEN_KEY])
      await step(vp.name, J, 'kontrol negatif: dokter belum diverifikasi ditolak rute klinisi', async () => {
        const r = await call('GET', '/api/clinician/lab-shares', calon.token); assert.equal(r.status, 403, `status ${r.status}`)
      })
      await step(vp.name, J, 'pemilik membuka panel verifikasi STR dan melihat calon dokter', async () => {
        await page.goto(APP + '#/owner', { waitUntil: 'domcontentloaded', timeout: 120000 })
        await page.getByText('Doctor STR Verification').first().waitFor({ timeout: 60000 })
        await page.getByText(email).first().waitFor({ timeout: 30000 })
      })
      await step(vp.name, J, 'pemilik menekan Verify di UI → API mencatat verified → dokter kini boleh rute klinisi', async () => {
        const baris = page.locator('div.border-amber-200', { hasText: email }).first()
        await baris.getByRole('button', { name: /Verify/ }).click()
        await page.getByText(email).first().waitFor({ timeout: 30000 })
        let status = ''
        for (let i = 0; i < 20 && status !== 'verified'; i++) {
          const r = await call('GET', '/api/doctors', owner.token)
          status = (r.json?.doctors ?? r.json ?? []).find?.((d) => d.email === email)?.strStatus ?? ''
          if (status !== 'verified') await new Promise((r) => setTimeout(r, 500))
        }
        assert.equal(status, 'verified', 'UI harus benar-benar memanggil API verifikasi')
        if (vp === VIEWPORTS[0]) { // satu kali: batas laju /api/auth (30/15 mnt) tidak dilonggarkan untuk uji
          const aktif = await devLogin(email, 'dokter')
          assert.equal((await call('GET', '/api/clinician/lab-shares', aktif.token)).status, 200, 'setelah verifikasi dokter efektif sebagai klinisi')
        }
      })
      await step(vp.name, J, 'tanpa overflow horizontal di panel pemilik', async () => { const o = await overflowX(page); assert.ok(o <= 1, `overflow ${o}px`); return { overflowPx: o } })
      await step(vp.name, J, 'tanpa galat halaman tak tertangani', async () => { assert.deepEqual(errors, []) })
      await ctx.close()
    }

    // ===== Perjalanan 3: API tak tersedia — state galat tidak crash =====
    {
      const { ctx, page, errors } = await newPage(); const J = 'api-tak-tersedia'
      await page.route('**/api/**', (r) => r.abort('connectionrefused'))
      await step(vp.name, J, 'landing tetap tampil saat semua panggilan API gagal', async () => {
        await page.goto(APP + '#/', { waitUntil: 'domcontentloaded', timeout: 120000 })
        await masuk(page).waitFor({ timeout: 60000 })
      })
      await step(vp.name, J, 'tanpa galat halaman tak tertangani', async () => { assert.deepEqual(errors, []) })
      await ctx.close()
    }
  }
} catch (e) { failed = e } finally {
  await browser.close()
  const ringkas = { dihasilkan: new Date().toISOString(), api: API, app: APP, lulus: results.filter((r) => r.ok).length, gagal: results.filter((r) => !r.ok).length,
    temuan, tidakTercakup: [{ peran: 'perawat', alasan: 'peran tidak ada di backend (Role = pasien|dokter|kontributor|verifikator|admin|owner); login mandiri sebagai perawat jatuh ke pasien; tidak dihitung lulus' }, { peran: 'laboratorium', alasan: 'peran tidak ada di backend; hasil lab masuk lewat jalur lab-intake/klinisi; tidak dihitung lulus' }, { peran: 'admin', alasan: 'peran ada tetapi tidak dapat diperoleh lewat login mandiri dan tidak ada UI admin terpisah dari pemilik; hanya RBAC API verifikator/pasien yang diuji' }, { peran: 'kontributor', alasan: 'peran ada; belum ada perjalanan UI diuji' }], hasil: results }
  writeFileSync(process.env.QA_OUT || 'user-journey-evidence.json', JSON.stringify(ringkas, null, 2))
  console.log(`user-journey-e2e: ${ringkas.lulus} lulus, ${ringkas.gagal} gagal`)
  if (failed) { console.error(failed.message); process.exit(1) }
}
