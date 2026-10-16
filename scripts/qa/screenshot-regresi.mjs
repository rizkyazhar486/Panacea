// F2 / Task 45 — regresi tangkapan layar lintas viewport dan tema, berbasis grid luminans kasar (lihat screenshot-grid.mjs untuk alasan).
// Aplikasi + API nyata, identitas sintetis (sama dengan ux-audit.mjs). Mengukur; membandingkan bila SHOT_BASELINE diberikan.
//   node scripts/qa/screenshot-regresi.mjs   (QA_OUT=<json> menyimpan grid terukur; SHOT_BASELINE=<json> menyalakan gerbang;
//   tanpa baseline di CI = gagal, fail-closed; SHOT_DIR=<dir> menyimpan PNG sebagai artefak tinjauan manusia, BUKAN baseline)
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { bandingkanSemua, KOLOM, BARIS } from './screenshot-grid.mjs'
const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const chromium = pw.chromium ?? pw.default.chromium
const API = process.env.QA_API || 'http://127.0.0.1:18790'
const APP = process.env.QA_URL || 'http://localhost:5190/'
const SHOT_DIR = process.env.SHOT_DIR || ''
const VIEWPORTS = [{ name: 'mobile-390x844', width: 390, height: 844 }, { name: 'desktop-1440x900', width: 1440, height: 900 }]
const PAGES = ['#/', '#/harian', '#/chatbot', '#/settings', '#/profile', '#/clinical-hub', '#/fitness-hub', '#/health-data', '#/all-features']
if (SHOT_DIR) mkdirSync(SHOT_DIR, { recursive: true })

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const login = await (await fetch(API + '/api/auth/dev-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'shot@example.com', role: 'pasien', name: 'Shot Audit' }) })).json()
  const session = JSON.stringify({ loginAt: Date.now(), account: { email: 'shot@example.com', name: 'Shot Audit', role: 'pasien', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } })
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
  const grid = {}
  try {
    for (const vp of VIEWPORTS) for (const tema of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: tema, reducedMotion: 'reduce' })
      await ctx.addInitScript(([s, t, th]) => { localStorage.setItem('panaceamed.session.v1', s); localStorage.setItem('pmd-token', t); localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1'); localStorage.setItem('pmd-theme', th) }, [session, login.token, tema])
      const page = await ctx.newPage()
      for (const rute of PAGES) {
        await page.goto(APP + rute, { waitUntil: 'domcontentloaded', timeout: 120000 })
        await page.getByRole('button', { name: 'Notifications' }).first().waitFor({ timeout: 60000 }).catch(() => {})
        await page.waitForTimeout(3500)
        const buf = await page.screenshot()
        if (SHOT_DIR) writeFileSync(join(SHOT_DIR, `${vp.name}_${tema}_${rute.replace(/[^a-z0-9]+/gi, '_')}.png`), buf)
        // Grid dihitung di halaman (canvas) agar skrip tidak butuh pustaka PNG; logika yang sama diuji di screenshot-grid.mjs lewat gridDari.
        grid[`${vp.name}|${tema}|${rute}`] = await page.evaluate(async ([b64, kolom, baris]) => {
          const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
          const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight
          const g = c.getContext('2d'); g.drawImage(img, 0, 0)
          const d = g.getImageData(0, 0, c.width, c.height).data
          const jum = new Array(kolom * baris).fill(0), cac = new Array(kolom * baris).fill(0)
          for (let y = 0; y < c.height; y++) { const by = Math.min(baris - 1, Math.floor((y * baris) / c.height)); for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4; const s = by * kolom + Math.min(kolom - 1, Math.floor((x * kolom) / c.width)); jum[s] += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; cac[s]++ } }
          return jum.map((j, s) => Math.round(j / cac[s]))
        }, [buf.toString('base64'), KOLOM, BARIS])
      }
      await ctx.close()
    }
  } finally { await browser.close() }
  const ringkas = { dihasilkan: new Date().toISOString(), kolom: KOLOM, baris: BARIS, pengukuran: Object.keys(grid).length, grid }
  if (process.env.QA_OUT) writeFileSync(process.env.QA_OUT, JSON.stringify(ringkas, null, 1))
  console.log(JSON.stringify({ pengukuran: ringkas.pengukuran }))
  const baseline = process.env.SHOT_BASELINE && existsSync(process.env.SHOT_BASELINE) ? JSON.parse(readFileSync(process.env.SHOT_BASELINE, 'utf8')) : null
  if (!process.env.SHOT_REPORT_ONLY && (baseline || process.env.CI)) { // SHOT_REPORT_ONLY=1: hanya ukur (dipakai sekali untuk memperoleh baseline dari lingkungan CI sendiri)
    const gagal = bandingkanSemua(grid, baseline)
    if (gagal.length) { console.error('screenshot-regresi GAGAL:\n - ' + gagal.join('\n - ')); process.exitCode = 1 }
  }
}
