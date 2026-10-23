// F1 / Task 44 — perjalanan peran STAF (perawat, laboratorium) dan penugasannya oleh pemilik, di PERAMBAN terhadap aplikasi + API NYATA.
// Dipisahkan dari user-journey-e2e.mjs karena pembatas /api/auth (30 per 15 menit; TIDAK dilonggarkan) sudah hampir habis oleh skrip itu;
// skrip ini berjalan pada server SEGAR (berkas data dan pembatas baru). Identitas sintetis; verifikasi/peran adalah fixture alur kerja.
//
// Jalankan: server dan frontend baru, lalu
//   PLAYWRIGHT_MODULE=<path>/playwright/index.js CHROME=<path chrome> QA_OUT=<json> node scripts/qa/user-journey-staff.mjs
// Cakupan: peran hanya diberikan owner; tanpa peran/penugasan staf ditolak; staf hanya melihat pasien yang ditugaskan; kapabilitas per peran
// (lab: intake -> menunggu tinjauan; perawat: juga menyampaikan/menutup; keduanya tidak meninjau); pencabutan; logout mencabut token; 390x844 dan 1440x900.
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
  // --- fixture sisi server (identitas sintetis, jalur resmi). Skrip ini berjalan pada server SEGAR: pembatas /api/auth tidak dilonggarkan. ---
  const owner = await devLogin(OWNER, 'owner'); assert.ok(owner?.token, 'login pemilik dev gagal')
  const dokter = await devLogin('dokter-staf@example.com', 'dokter')
  assert.equal((await call('POST', `/api/doctors/${dokter.user.id}/verify`, owner.token, { status: 'verified' })).status, 200, 'pemilik memverifikasi dokter sintetis')
  const dokterAktif = dokter
  // Fixture perawat/lab (F1). Akun mendaftar sendiri (jatuh ke pasien); owner memberi peran dan penugasan di langkah api-rbac.
  // Pembatas /api/auth (30 per 15 menit) tidak dilonggarkan, jadi akun dipakai ulang lintas viewport (login minimum).
  const P_TUGAS = 'p-f1-tugas'; const P_LAIN = 'p-f1-bukan-tugas'
  const perawatAktif = await devLogin('perawat-f1@example.com', 'perawat'); assert.equal(perawatAktif.user.role, 'pasien', 'perawat mendaftar sendiri = pasien')
  const labAktif = await devLogin('lab-f1@example.com', 'lab'); assert.equal(labAktif.user.role, 'pasien', 'lab mendaftar sendiri = pasien')
  const calonUi = await devLogin('staf-ui-demo@example.com', 'pasien') // diberi peran hanya lewat UI pemilik (perjalanan pemilik-staf)
  const hasilBaru = async (patientId, name) => { const r = await call('POST', '/api/lab-results', owner.token, { patientId, item: { name, value: 5.5, unit: 'mmol/L', collectedAt: '2026-10-09' }, source: 'lab-intake' }); assert.equal(r.status, 201, `seed ${name}`); return r.json }

  {
    const J = 'api-rbac-staf'; const VP = 'api'
    // Peran perawat/lab diberikan OWNER saja dan akses data hanya lewat penugasan per pasien (hak akses minimum): kontrol berpasangan sebelum/sesudah.
    await step(VP, J, 'perawat/lab: ditolak sebelum peran, nol akses setelah peran tanpa penugasan, diterima setelah penugasan; pasien lain tetap tertutup', async () => {
      const intake = (nm, pid = P_TUGAS) => ({ patientId: pid, item: { name: nm, value: 1, collectedAt: '2026-10-09' }, source: 'lab-intake' })
      for (const [r, x] of [['perawat', perawatAktif], ['lab', labAktif]]) {
        assert.equal((await call('POST', '/api/lab-results', x.token, intake(`Eskalasi-${r}`))).status, 403, `${r} tanpa peran dari owner tidak boleh memasukkan hasil`)
        assert.equal((await call('GET', '/api/staff/assignments', x.token)).status, 403, `${r} tanpa peran bukan staf`)
        assert.equal((await call('POST', '/api/owner/staff-role', dokterAktif.token, { userId: x.user.id, role: r })).status, 403, `dokter tidak boleh memberi peran ${r}`)
        assert.equal((await call('POST', '/api/owner/staff-role', x.token, { userId: x.user.id, role: r })).status, 403, `${r} tidak boleh memberi peran pada diri sendiri`)
        assert.equal((await call('POST', '/api/owner/staff-role', owner.token, { userId: x.user.id, role: r })).status, 200, `owner memberi peran ${r}`)
        assert.deepEqual((await call('GET', '/api/staff/assignments', x.token)).json, { patientIds: [] }, `${r} berperan tanpa penugasan`)
        assert.equal((await call('POST', '/api/lab-results', x.token, intake(`Eskalasi-${r}`))).status, 403, `${r} berperan TANPA penugasan tetap ditolak`)
        assert.equal((await call('POST', '/api/owner/staff-assignments', owner.token, { userId: x.user.id, patientId: P_TUGAS })).status, 200, `owner menugaskan ${r}`)
        assert.equal((await call('POST', '/api/lab-results', x.token, intake(`Diterima-${r}`))).status, 201, `${r} ditugaskan boleh memasukkan hasil`)
        assert.equal((await call('POST', '/api/lab-results', x.token, intake(`Lain-${r}`, P_LAIN))).status, 403, `${r} tidak boleh memasukkan hasil untuk pasien yang tidak ditugaskan`)
      }
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
      await page.evaluate(() => window.scrollTo(0, 0))
      const direct = page.getByRole('button', { name: 'Log out', exact: true })
      if (await direct.first().isVisible().catch(() => false)) { await direct.first().click(); return }
      await page.getByRole('button', { name: 'Menu akun dan keluar' }).click()
      await page.getByRole('button', { name: 'Log out' }).click()
    }
    const masuk = (page) => page.getByRole('button', { name: /^Masuk( \/ Daftar Gratis)?$/ }).first()
    const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

    // ===== Perjalanan 4b: pemilik memberi peran/penugasan lewat UI → perawat → staf lab (hak akses minimum, kapabilitas per peran) =====
    {
      const sesi = async (ctx, akun, token) => ctx.addInitScript(([s, t, k1, k2]) => {
        if (sessionStorage.getItem('__f1_staff_init')) return
        sessionStorage.setItem('__f1_staff_init', '1')
        localStorage.setItem(k1, s); localStorage.setItem(k2, t); localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
      },
        [JSON.stringify({ loginAt: Date.now(), account: { isOwner: false, isSubscriber: false, ...akun, loggedAt: new Date().toISOString() } }), token, SESSION_KEY, TOKEN_KEY])
      const desk = async (page) => { await page.goto(APP + '#/', { waitUntil: 'domcontentloaded', timeout: 120000 }); await page.getByRole('heading', { name: 'Lab result review' }).waitFor({ timeout: 90000 }) }

      { // --- pemilik: peran dan penugasan staf lewat UI (positif, lalu pencabutan) ---
        const { ctx, page, errors } = await newPage(); const J = 'pemilik-staf'
        await sesi(ctx, { email: OWNER, name: 'Pemilik F1', role: 'owner', isOwner: true }, owner.token)
        const pid = `p-f1-ui-${vp.name}`; const namaUi = 'staf-ui-demo'
        const calon = calonUi; const pertama = vp === VIEWPORTS[0]; const terakhir = vp === VIEWPORTS[VIEWPORTS.length - 1]
        await step(vp.name, J, 'pemilik membuka meja hasil lab dan melihat panel staf', async () => {
          await page.goto(APP + '#/doctor-review/lab-results', { waitUntil: 'domcontentloaded', timeout: 120000 })
          await page.getByRole('heading', { name: 'Nurse and lab staff' }).waitFor({ timeout: 90000 })
          assert.ok(pertama || (await call('GET', '/api/owner/staff', owner.token)).json.staff.some((x) => x.id === calon.user.id), 'peran dari viewport pertama masih ada')
        })
        if (pertama) await step(vp.name, J, 'pemilik mencari akun, menjadikannya perawat lewat UI → API mencatat peran', async () => {
          await page.getByLabel('Find an account by name to make staff').fill(namaUi)
          await page.getByRole('button', { name: 'Search', exact: true }).click()
          await page.getByRole('button', { name: new RegExp(`Make nurse: ${namaUi}`) }).click({ timeout: 30000 })
          await page.getByText(/is now a nurse/).waitFor({ timeout: 30000 })
          const r = await call('GET', '/api/owner/staff', owner.token)
          assert.ok((r.json?.staff ?? []).some((x) => x.id === calon.user.id && x.role === 'perawat'), 'UI harus benar-benar memanggil API peran')
        })
        await step(vp.name, J, 'pemilik memberi akses pasien lewat UI → API mencatat penugasan; staf melihat pasiennya', async () => {
          await page.getByLabel(new RegExp(`Patient ID for ${namaUi}`)).fill(pid)
          await page.getByRole('button', { name: new RegExp(`Give patient access to ${namaUi}`) }).click()
          await page.getByText('Patient access granted.').waitFor({ timeout: 30000 })
          const r = await call('GET', '/api/staff/assignments', calon.token)
          assert.deepEqual(r.json, { patientIds: [pid] }, 'penugasan harus sampai ke API dan terlihat oleh staf')
        })
        await step(vp.name, J, 'pemilik mencabut akses pasien lewat UI → daftar staf kosong', async () => {
          await page.getByRole('button', { name: new RegExp(`Remove patient access from ${namaUi}`) }).click()
          await page.getByText('Patient access removed.').waitFor({ timeout: 30000 })
          assert.deepEqual((await call('GET', '/api/staff/assignments', calon.token)).json, { patientIds: [] })
        })
        if (terakhir) await step(vp.name, J, 'pemilik mencabut peran lewat UI → akun kembali pasien', async () => {
          await page.getByRole('button', { name: new RegExp(`Remove staff role from ${namaUi}`) }).click()
          await page.getByText(/Staff role removed/).waitFor({ timeout: 30000 })
          assert.equal((await call('GET', '/api/staff/assignments', calon.token)).status, 403, 'bukan staf lagi')
        })
        await step(vp.name, J, 'tanpa overflow horizontal di panel staf', async () => { const o = await overflowX(page); assert.ok(o <= 1, `overflow ${o}px`); return { overflowPx: o } })
        await step(vp.name, J, 'tanpa galat halaman tak tertangani', async () => { assert.deepEqual(errors, []) })
        await ctx.close()
      }

      for (const [J, akun, aktif, peranUi] of [
        ['perawat', { email: 'perawat-f1@example.com', name: 'Perawat F1', role: 'perawat' }, perawatAktif, 'perawat'],
        ['laboratorium', { email: 'lab-f1@example.com', name: 'Lab F1', role: 'lab' }, labAktif, 'lab'],
      ]) {
        const { ctx, page, errors } = await newPage()
        const sesiStaf = vp === VIEWPORTS[0] ? aktif : await devLogin(akun.email, peranUi)
        await sesi(ctx, akun, sesiStaf.token)
        const nmTugas = `Glukosa-${J}-${vp.name}`; const nmLain = `Rahasia-${J}-${vp.name}`; const nmIntake = `Intake-${J}-${vp.name}`
        const hTugas = await hasilBaru(P_TUGAS, nmTugas); const hLain = await hasilBaru(P_LAIN, nmLain)
        await step(vp.name, J, 'login staf → langsung ke meja hasil lab (bukan beranda sosial)', async () => {
          await desk(page); await page.getByText('Staff workspace').waitFor({ timeout: 30000 })
        })
        await step(vp.name, J, 'hanya pasien yang ditugaskan terlihat; pasien lain tidak (hak akses minimum)', async () => {
          await page.getByText(nmTugas).first().waitFor({ timeout: 60000 })
          assert.equal(await page.getByText(nmLain).count(), 0, 'hasil pasien yang tidak ditugaskan tidak boleh tampil')
          assert.equal((await call('GET', `/api/lab-results/${hLain.id}`, sesiStaf.token)).status, 404, 'API menyembunyikan hasil pasien lain')
          assert.equal((await call('GET', `/api/lab-results/${hTugas.id}`, sesiStaf.token)).status, 200, 'kontrol positif: hasil pasien yang ditugaskan terbaca')
        })
        await step(vp.name, J, 'aksi sesuai kapabilitas peran: ada "Mark awaiting review"; tidak ada "Mark reviewed"', async () => {
          await page.getByRole('button', { name: 'Mark awaiting review' }).first().waitFor({ timeout: 30000 })
          assert.equal(await page.getByRole('button', { name: 'Mark reviewed' }).count(), 0, 'staf tidak boleh meninjau')
        })
        await step(vp.name, J, 'staf memajukan hasil ke menunggu tinjauan lewat UI → status berubah di API', async () => {
          const baris = page.locator('li', { hasText: nmTugas }).first()
          await baris.getByRole('button', { name: 'Mark awaiting review' }).click()
          await baris.getByText('Awaiting review', { exact: true }).waitFor({ timeout: 30000 })
          // Pada status menunggu tinjauan langkah berikutnya adalah 'reviewed': hanya dokter yang boleh; staf tidak boleh diberi tombolnya.
          await page.waitForTimeout(2000) // lewati cooldown 1,5 dtk setelah sukses (tombol sementara berlabel 'Wait before next step…')
          assert.equal(await baris.getByRole('button', { name: 'Mark reviewed' }).count(), 0, 'staf tidak boleh melihat tombol Mark reviewed')
          assert.equal((await call('GET', `/api/lab-results/${hTugas.id}`, sesiStaf.token)).json?.status, 'pending_review')
        })
        // Penolakan peran hanya bermakna bila langkahnya sah menurut siklus hidup (pada status lain server menjawab 409 lebih dulu).
        await step(vp.name, J, 'server menolak tinjauan oleh staf (403) padahal langkahnya sah; hanya dokter yang meninjau', async () => {
          assert.equal((await call('POST', `/api/lab-results/${hTugas.id}/advance`, sesiStaf.token, { to: 'reviewed' })).status, 403, 'staf tidak boleh meninjau')
          assert.equal((await call('POST', `/api/lab-results/${hTugas.id}/advance`, dokterAktif.token, { to: 'reviewed' })).status, 200, 'kontrol positif: dokter terverifikasi boleh meninjau')
        })
        await step(vp.name, J, peranUi === 'lab' ? 'lab tidak boleh menyampaikan hasil (403)' : 'perawat boleh menyampaikan hasil dengan bukti (200)', async () => {
          const komunikasi = { to: 'communicated', communication: { channel: 'phone', note: 'Hasil disampaikan via telepon' } }
          const r = await call('POST', `/api/lab-results/${hTugas.id}/advance`, sesiStaf.token, komunikasi)
          assert.equal(r.status, peranUi === 'lab' ? 403 : 200, `status ${r.status}`)
        })
        await step(vp.name, J, 'intake lewat formulir: tervalidasi (negatif) lalu tersimpan (positif)', async () => {
          const kirim = page.getByRole('button', { name: 'Record result' })
          await page.getByLabel('Test name').fill(nmIntake)
          assert.equal(await kirim.isDisabled(), true, 'tanpa nilai dan tanggal tombol harus nonaktif')
          await page.getByLabel('Value', { exact: true }).fill('abc'); await page.getByLabel('Collected on').fill('2026-10-09')
          assert.equal(await kirim.isDisabled(), true, 'nilai bukan angka harus nonaktif')
          await page.getByLabel('Value', { exact: true }).fill('4.2')
          await kirim.click()
          await page.getByText('Result recorded.').waitFor({ timeout: 30000 })
          await page.getByText(nmIntake).first().waitFor({ timeout: 30000 })
        })
        await step(vp.name, J, 'tanpa overflow horizontal di meja staf', async () => { const o = await overflowX(page); assert.ok(o <= 1, `overflow ${o}px`); return { overflowPx: o } })
        await step(vp.name, J, 'staff browser back returns to the lab desk', async () => {
          await page.goto(APP + '#/settings', { waitUntil: 'domcontentloaded', timeout: 120000 })
          await page.waitForFunction(() => location.hash.startsWith('#/settings'), null, { timeout: 30000 })
          await page.goBack({ waitUntil: 'domcontentloaded' })
          await page.waitForFunction(() => location.hash.startsWith('#/doctor-review/lab-results'), null, { timeout: 30000 })
          await page.getByRole('heading', { name: 'Lab result review' }).waitFor({ timeout: 30000 })
          assert.ok(page.url().includes('#/doctor-review/lab-results'), 'staff browser back returns to the lab desk')
        })
        await step(vp.name, J, 'logout staf mengembalikan ke landing dan mencabut token', async () => {
          await logout(page); await masuk(page).waitFor({ timeout: 60000 })
          // Diperiksa lewat rute di luar pembatas /api/auth (batas itu tidak dilonggarkan dan sudah hampir habis oleh perjalanan lain).
          assert.equal((await call('GET', '/api/staff/assignments', sesiStaf.token)).status, 401, 'token staf dicabut di server')
        })
        await step(vp.name, J, 'tanpa galat halaman tak tertangani', async () => { assert.deepEqual(errors, []) })
        await ctx.close()
      }
    }

  }
} catch (e) { failed = e } finally {
  await browser.close()
  const ringkas = { dihasilkan: new Date().toISOString(), api: API, app: APP, lulus: results.filter((r) => r.ok).length, gagal: results.filter((r) => !r.ok).length, temuan, hasil: results }
  writeFileSync(process.env.QA_OUT || 'user-journey-staff-evidence.json', JSON.stringify(ringkas, null, 2))
  console.log(`user-journey-staff: ${ringkas.lulus} lulus, ${ringkas.gagal} gagal`)
  if (failed) { console.error(failed.message); process.exit(1) }
}
