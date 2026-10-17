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
// Pembatas laju global produk = 300 permintaan/menit (server/src/index.ts). Batas itu TIDAK dilonggarkan untuk uji; journey yang padat memicunya,
// sehingga journey berikutnya menunggu jendela satu menit lewat (terbukti: GET /api/doctors -> 429 tanpa jeda).
// Hanya permintaan KE server API. Pola glob '**/api/**' juga mencegat modul dev di direktori /api/ (mis. src/.../api/...), sehingga chunk halaman
// dijawab JSON 500 dan Suspense macet 'Loading page' — artefak uji, terbukti lewat jejak diagnostik, bukan cacat produk.
const apiUrl = (u) => u.origin === new URL(API).origin && u.pathname.startsWith('/api/')
const tungguJendelaLaju = () => new Promise((r) => setTimeout(r, 61000))
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
    await step(VP, J, 'kontributor: login nyata tidak memberi akses owner, staf, atau pengiriman notifikasi', async () => {
      const x = await devLogin('kontributor-f1@example.com', 'kontributor')
      assert.equal(x.user.role, 'kontributor', 'self-service contributor role is recognized')
      assert.equal((await call('GET', '/api/auth/me', x.token)).status, 200, 'contributor has only an authenticated identity')
      const denied = [
        await call('GET', '/api/staff/assignments', x.token),
        await call('POST', '/api/owner/staff-role', x.token, { userId: x.user.id, role: 'perawat' }),
        await call('POST', '/api/notify/user', x.token, { email: 'absent@example.com', body: 'synthetic' }),
      ]
      assert.deepEqual(denied.map((r) => r.status), [403, 403, 403], 'contributor cannot gain staff/owner/verifier powers')
      assert.equal((await call('POST', '/api/auth/logout', x.token)).status, 200, 'contributor can log out')
      assert.equal((await call('GET', '/api/auth/me', x.token)).status, 401, 'contributor token revoked on logout')
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
      await tungguJendelaLaju()
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
        let status = ''; let http = 0
        for (let i = 0; i < 20 && status !== 'verified'; i++) {
          const r = await call('GET', '/api/doctors', owner.token); http = r.status
          status = (r.json?.doctors ?? r.json ?? []).find?.((d) => d.email === email)?.strStatus ?? ''
          if (status !== 'verified') await new Promise((r) => setTimeout(r, 500))
        }
        assert.equal(status, 'verified', `UI harus benar-benar memanggil API verifikasi (GET /api/doctors terakhir HTTP ${http})`)
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
      await page.route(apiUrl, (r) => r.abort('connectionrefused'))
      await step(vp.name, J, 'landing tetap tampil saat semua panggilan API gagal', async () => {
        await page.goto(APP + '#/', { waitUntil: 'domcontentloaded', timeout: 120000 })
        await masuk(page).waitFor({ timeout: 60000 })
      })
      await step(vp.name, J, 'tanpa galat halaman tak tertangani', async () => { assert.deepEqual(errors, []) })
      await ctx.close()
    }

    // ===== Perjalanan 5: loading lambat, galat server (5xx), pemulihan, dan navigasi tidak buntu — sesi pasien nyata =====
    {
      const { ctx, page, errors } = await newPage(); const J = 'ketahanan'
      await ctx.addInitScript(([s, t, k1, k2]) => { localStorage.setItem(k1, s); localStorage.setItem(k2, t); localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1') }, [
        JSON.stringify({ loginAt: Date.now(), account: { email: 'pasien-f1@example.com', name: 'Pasien F1', role: 'pasien', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } }),
        pasienApi.token, SESSION_KEY, TOKEN_KEY])
      const RUTE = ['#/harian', '#/health-data', '#/clinical-hub']
      const jejak = [] // diagnostik kegagalan: permintaan gagal dan respons >=400 di luar /api (mis. chunk yang tak termuat)
      const menggantung = new Set() // permintaan non-API yang belum selesai: bukti bila chunk halaman macet
      page.on('request', (r) => { if (!apiUrl(new URL(r.url()))) menggantung.add(r.url()) })
      page.on('requestfinished', (r) => menggantung.delete(r.url()))
      page.on('requestfailed', (r) => { menggantung.delete(r.url()); jejak.push(`GAGAL ${r.url().slice(-70)} ${r.failure()?.errorText ?? ''}`) })
      page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/api/')) jejak.push(`HTTP ${r.status()} ${r.url().slice(-70)}`) })
      const teksBadan = (pg) => pg.evaluate(() => document.body.innerText)
      const bocor = (t) => ['[object Object]', 'undefined', 'NaN', 'TypeError', 'Cannot read'].filter((x) => t.includes(x))
      const cangkang = async (pg) => { await pg.getByRole('button', { name: 'Notifications' }).first().waitFor({ timeout: 60000 }) }
      // (0) kontrol positif + pemanasan: tanpa gangguan apa pun, tiap rute harus terisi. Dev server mengompilasi chunk saat pertama diminta; tanpa
      // langkah ini kompilasi dingin bisa disangka kegagalan aplikasi saat API digagalkan. Gagal di sini = masalah dasar, bukan ketahanan.
      await step(vp.name, J, 'kontrol positif tanpa gangguan: tiap rute terisi (pemanasan, batas 120 dtk)', async () => {
        for (const rute of RUTE) {
          await page.goto(APP + rute, { waitUntil: 'domcontentloaded', timeout: 120000 }); await cangkang(page)
          await page.waitForFunction(() => document.body.innerText.trim().length > 200, null, { timeout: 120000 }).catch(() => {})
          const t = await teksBadan(page)
          assert.ok(t.trim().length > 200, `${rute} tidak terisi dalam 120 dtk TANPA gangguan (${t.trim().length} karakter; menggantung=${JSON.stringify([...menggantung].slice(-5).map((u) => u.slice(-80)))})`)
        }
      })
      // (a) loading lambat: semua panggilan API tertunda 1,5 dtk; cangkang harus tetap tampil, tanpa overflow, tanpa teks bocor
      await step(vp.name, J, 'API lambat (1,5 dtk): cangkang dan halaman tetap tampil tanpa overflow atau teks bocor', async () => {
        await page.route(apiUrl, async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue().catch(() => {}) }) // navigasi bisa menutup rute lebih dulu: abaikan, bukan crash
        for (const rute of RUTE) {
          await page.goto(APP + rute, { waitUntil: 'domcontentloaded', timeout: 120000 })
          await cangkang(page)
          const o = await overflowX(page); assert.ok(o <= 1, `${rute} overflow ${o}px saat loading`)
          const b = bocor(await teksBadan(page)); assert.deepEqual(b, [], `${rute} teks bocor saat loading: ${b}`)
        }
        await page.unroute(apiUrl)
      })
      // (b) galat server: semua panggilan API 500; kontrol positif = tanpa galat sama sekali sudah dicek di perjalanan lain
      await step(vp.name, J, 'API 500: halaman tidak crash, tidak kosong, tanpa teks bocor, tanpa overflow', async () => {
        await page.route(apiUrl, (r) => r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) }))
        for (const rute of RUTE) {
          await page.goto(APP + rute, { waitUntil: 'domcontentloaded', timeout: 120000 })
          await cangkang(page)
          // halaman rute dimuat malas (lazy): tunggu sampai terisi, tetapi gagal bila tak pernah terisi dalam 60 dtk (kompilasi chunk dev server bisa >20 dtk) (bukan sekadar belum dimuat)
          await page.waitForFunction(() => document.body.innerText.trim().length > 200, null, { timeout: 60000 }).catch(() => {})
          const t = await teksBadan(page)
          assert.ok(t.trim().length > 200, `${rute} tetap nyaris kosong 60 dtk setelah cangkang saat API 500 (${t.trim().length} karakter; teks=${JSON.stringify(t.trim().slice(0, 80))}; jejak=${JSON.stringify(jejak.slice(-4))}; menggantung=${JSON.stringify([...menggantung].slice(-5).map((u) => u.slice(-80)))})`)
          const b = bocor(t); assert.deepEqual(b, [], `${rute} teks bocor saat API 500: ${b}`)
          const o = await overflowX(page); assert.ok(o <= 1, `${rute} overflow ${o}px saat API 500`)
        }
      })
      // (c) navigasi tidak buntu dari keadaan galat: tombol Kembali riwayat dan logo/Home membawa pulang
      await step(vp.name, J, 'tidak buntu saat galat: riwayat Kembali dan tautan Home berfungsi', async () => {
        await page.goto(APP + '#/', { waitUntil: 'domcontentloaded', timeout: 120000 }); await cangkang(page)
        await page.goto(APP + '#/health-data', { waitUntil: 'domcontentloaded', timeout: 120000 }); await cangkang(page)
        await page.goBack({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500)
        assert.ok(/#\/?$/.test(page.url()), `Kembali tidak pulang ke Home: ${page.url()}`)
        await page.goto(APP + '#/clinical-hub', { waitUntil: 'domcontentloaded', timeout: 120000 }); await cangkang(page)
        // Navigasi hash SPA tidak memuat ulang: tombol 'Notifications' sudah terlihat sebelum router memproses hashchange, sehingga
        // pengecekan seketika berbalapan dengan render (bisaKembali = pathname !== '/'). Tunggu dengan batas; tetap gagal bila tak pernah muncul.
        const kembali = page.getByRole('button', { name: /back|kembali/i }).first()
        const terlihat = await kembali.waitFor({ state: 'visible', timeout: 15000 }).then(() => true, () => false)
        assert.ok(terlihat, 'tidak ada kontrol Kembali yang terlihat di halaman dalam (15 dtk)')
      })
      // (d) pemulihan: API kembali normal → muat ulang → halaman berfungsi (kontrol berpasangan dengan (b): hanya API yang berubah)
      await step(vp.name, J, 'pemulihan: setelah API normal, muat ulang menampilkan halaman tanpa galat', async () => {
        await page.unroute(apiUrl)
        await page.goto(APP + '#/health-data', { waitUntil: 'domcontentloaded', timeout: 120000 }); await cangkang(page)
        await page.waitForFunction(() => document.body.innerText.trim().length > 200, null, { timeout: 60000 }).catch(() => {})
        const t = await teksBadan(page); assert.ok(t.trim().length > 200, `pemulihan: halaman tidak terisi (${t.trim().length} karakter)`); assert.deepEqual(bocor(t), [])
      })
      await step(vp.name, J, 'tanpa galat halaman tak tertangani selama semua keadaan', async () => { assert.deepEqual(errors, []) })
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
