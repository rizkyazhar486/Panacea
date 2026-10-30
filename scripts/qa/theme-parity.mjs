// F2 / Task 45 — paritas tema terang/gelap: tema mengubah WARNA, bukan tata letak/isi. Bukan regresi piksel (piksel berbeda antar
// mesin render — terbukti: kontras lokal 83 vs CI 91), jadi gerbangnya invarian struktural yang stabil lintas lingkungan:
//   (1) isi teks terlihat identik antar tema; (2) kotak elemen interaktif bergeser <= TOL px; (3) tidak ada overflow di salah satu tema;
//   (4) tangkapan layar tidak kosong (ragam warna). Tangkapan layar disimpan sebagai artefak untuk tinjauan manusia, BUKAN baseline.
//   node scripts/qa/theme-parity.mjs   (env sama dengan ux-audit.mjs; PARITY_BASELINE=<json>; SHOT_DIR=<dir>)
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const chromium = pw.chromium ?? pw.default.chromium
const API = process.env.QA_API || 'http://127.0.0.1:18790'
const APP = process.env.QA_URL || 'http://localhost:5190/'
const SHOT_DIR = process.env.SHOT_DIR || ''
const VIEWPORTS = [{ name: 'mobile-390x844', width: 390, height: 844 }, { name: 'desktop-1440x900', width: 1440, height: 900 }]
const PAGES = (process.env.PARITY_PAGES || '#/,#/harian,#/chatbot,#/settings,#/profile,#/clinical-hub,#/fitness-hub,#/health-data,#/all-features').split(',')
const TOL = 4 // jitter 2-3px antar-run pada #/health-data (konten async), bukan efek tema: dua run berurutan memberi 0 lalu 10 pada TOL=2
if (SHOT_DIR) mkdirSync(SHOT_DIR, { recursive: true })

const login = await (await fetch(API + '/api/auth/dev-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'parity@example.com', role: 'pasien', name: 'Parity' }) })).json()
const session = JSON.stringify({ loginAt: Date.now(), account: { email: 'parity@example.com', name: 'Parity', role: 'pasien', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } })

const ambil = () => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && e.offsetParent !== null }
  const teks = [...document.querySelectorAll('h1,h2,h3,button,a[href],label,summary,[role=tab]')].filter(vis).map((e) => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')).filter(Boolean)
  const kotak = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea')].filter(vis).map((e) => { const r = e.getBoundingClientRect(); return { k: `${e.tagName}|${(e.innerText || e.getAttribute('aria-label') || e.name || '').trim().slice(0, 24)}`, x: r.x, y: r.y + scrollY, w: r.width, h: r.height } })
  const hitung = {}; for (const k of kotak) { hitung[k.k] = (hitung[k.k] ?? 0) + 1; k.k += `#${hitung[k.k]}` } // kunci + nomor kemunculan: tombol ikon tanpa label tidak saling menimpa
  return { teks, kotak, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }
}
const ragamWarna = async (page, buf) => page.evaluate(async (b64) => { // jumlah warna unik terkuantisasi pada tangkapan layar; layar kosong ~1-2
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 64, 64)
  const d = g.getImageData(0, 0, 64, 64).data; const set = new Set(); for (let i = 0; i < d.length; i += 4) set.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`); return set.size
}, buf.toString('base64'))

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
const hasil = []
try {
  for (const vp of VIEWPORTS) {
    const per = {}
    for (const tema of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: tema, reducedMotion: 'reduce' })
      await ctx.addInitScript(([s, t, th]) => { localStorage.setItem('panaceamed.session.v1', s); localStorage.setItem('pmd-token', t); localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1'); localStorage.setItem('pmd-theme', th) }, [session, login.token, tema])
      const page = await ctx.newPage()
      for (const rute of PAGES) {
        await page.goto(APP + rute, { waitUntil: 'domcontentloaded', timeout: 120000 })
        await page.getByRole('button', { name: 'Notifications' }).first().waitFor({ timeout: 60000 }).catch(() => {})
        await page.waitForTimeout(2500)
        // tunggu stabil: dua cuplikan berurutan (jarak 800 ms) harus sama; konten async/penataan ulang awal membuat ukuran awal tidak sahih
        let m = await page.evaluate(ambil)
        for (let t = 0; t < 6; t++) {
          await page.waitForTimeout(800)
          const n = await page.evaluate(ambil)
          const sama = JSON.stringify(n.teks) === JSON.stringify(m.teks) && n.kotak.length === m.kotak.length && n.kotak.every((k, i) => Math.abs(k.y - m.kotak[i].y) <= 1 && Math.abs(k.x - m.kotak[i].x) <= 1)
          m = n; if (sama) break
        }
        const buf = await page.screenshot()
        if (SHOT_DIR) writeFileSync(join(SHOT_DIR, `${vp.name}_${tema}_${rute.replace(/[^a-z0-9]+/gi, '_')}.png`), buf)
        ;(per[rute] ??= {})[tema] = { ...m, warna: await ragamWarna(page, buf) }
      }
      await ctx.close()
    }
    for (const rute of PAGES) {
      const { light: a, dark: b } = per[rute]
      const sa = JSON.stringify(a.teks), sb = JSON.stringify(b.teks)
      const teksBeda = sa === sb ? 0 : Math.abs(a.teks.length - b.teks.length) + a.teks.filter((t, i) => t !== b.teks[i]).length
      const peta = new Map(b.kotak.map((k) => [k.k, k])); let bergeser = 0, tanpaPasangan = 0; const contoh = []
      for (const k of a.kotak) { const o = peta.get(k.k); if (!o) { tanpaPasangan++; continue } if ([k.x - o.x, k.y - o.y, k.w - o.w, k.h - o.h].some((v) => Math.abs(v) > TOL)) { bergeser++; if (contoh.length < 4) contoh.push(`${k.k} dx${Math.round(o.x - k.x)} dy${Math.round(o.y - k.y)} dw${Math.round(o.w - k.w)} dh${Math.round(o.h - k.h)}`) } }
      hasil.push({ viewport: vp.name, rute, contoh, teksBeda, bergeser, tanpaPasangan, overflowTerang: a.overflow, overflowGelap: b.overflow, warnaTerang: a.warna, warnaGelap: b.warna, interaktif: a.kotak.length })
    }
  }
} finally { await browser.close() }

const jml = (k) => hasil.reduce((s, r) => s + r[k], 0)
const kosong = hasil.filter((r) => r.warnaTerang < 8 || r.warnaGelap < 8).length
const ringkas = { dihasilkan: new Date().toISOString(), metode: 'paritas struktural lintas tema; BUKAN regresi piksel; tangkapan layar = artefak tinjauan manusia', toleransiPx: TOL,
  total: { halamanXviewport: hasil.length, teksBeda: jml('teksBeda'), bergeser: jml('bergeser'), tanpaPasangan: jml('tanpaPasangan'), overflow: hasil.filter((r) => r.overflowTerang > 1 || r.overflowGelap > 1).length, layarKosong: kosong }, hasil }
writeFileSync(process.env.QA_OUT || 'theme-parity-evidence.json', JSON.stringify(ringkas, null, 2))
console.log(JSON.stringify(ringkas.total))
if (process.env.CI && !(process.env.PARITY_BASELINE && existsSync(process.env.PARITY_BASELINE))) { console.error('PARITY_BASELINE tidak diset/ada di CI: gerbang tidak boleh berjalan tanpa baseline'); process.exit(1) }
const dasar = process.env.PARITY_BASELINE && existsSync(process.env.PARITY_BASELINE) ? JSON.parse(readFileSync(process.env.PARITY_BASELINE, 'utf8')) : null
if (dasar) {
  const gagal = []
  for (const k of ['teksBeda', 'bergeser', 'tanpaPasangan', 'overflow', 'layarKosong']) if (ringkas.total[k] > (dasar[k] ?? 0)) gagal.push(`${k} melampaui baseline: ${ringkas.total[k]} > ${dasar[k] ?? 0}`)
  if (gagal.length) { console.error('theme-parity GAGAL: ' + gagal.join('; ')); process.exit(1) }
}
