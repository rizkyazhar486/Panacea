// F2 / Task 45 — ukur kontras teks WCAG 2.x (AA: 4.5:1 teks normal, 3:1 teks besar) pada halaman nyata, dua tema, dua viewport.
// Metode: warna latar efektif = komposit lapisan latar ancestor (alpha dipertimbangkan). Latar gradien/gambar TIDAK diselesaikan:
// elemen itu dihitung terpisah sebagai `tidakDapatDiukur` (bukan dianggap lulus). Bukan pengganti axe/pemeriksaan manual.
//   node scripts/qa/kontras-wcag.mjs   (env sama dengan ux-audit.mjs; KONTRAS_BASELINE=<json> opsional)
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { ukur } from './kontras-ukur.mjs'
const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const chromium = pw.chromium ?? pw.default.chromium
const API = process.env.QA_API || 'http://127.0.0.1:18790'
const APP = process.env.QA_URL || 'http://localhost:5190/'
const VIEWPORTS = [{ name: 'mobile-390x844', width: 390, height: 844 }, { name: 'desktop-1440x900', width: 1440, height: 900 }]
const THEMES = ['light', 'dark']
const PAGES = (process.env.KONTRAS_PAGES || '#/,#/harian,#/chatbot,#/settings,#/profile,#/clinical-hub,#/fitness-hub,#/health-data,#/all-features').split(',')

const login = await (await fetch(API + '/api/auth/dev-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'kontras@example.com', role: 'pasien', name: 'Kontras' }) })).json()
const session = JSON.stringify({ loginAt: Date.now(), account: { email: 'kontras@example.com', name: 'Kontras', role: 'pasien', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } })

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
const hasil = []
try {
  for (const vp of VIEWPORTS) for (const tema of THEMES) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: tema, reducedMotion: 'reduce' })
    await ctx.addInitScript(([s, t, th]) => { localStorage.setItem('panaceamed.session.v1', s); localStorage.setItem('pmd-token', t); localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1'); localStorage.setItem('pmd-theme', th) }, [session, login.token, tema])
    const page = await ctx.newPage()
    for (const rute of PAGES) {
      await page.goto(APP + rute, { waitUntil: 'domcontentloaded', timeout: 120000 })
      await page.getByRole('button', { name: 'Notifications' }).first().waitFor({ timeout: 60000 }).catch(() => {})
      await page.waitForTimeout(2500)
      hasil.push({ viewport: vp.name, tema, rute, ...(await page.evaluate(ukur)) })
    }
    await ctx.close()
  }
} finally { await browser.close() }

const jml = (f) => hasil.reduce((a, r) => a + f(r), 0)
const mobileTerang = hasil.filter((r) => r.viewport.startsWith('mobile') && r.tema === 'light')
const histo = {}
for (const r of hasil) for (const g of r.gagal) { const k = g.sel; histo[k] = (histo[k] || 0) + 1 }
const ringkas = { dihasilkan: new Date().toISOString(), metode: 'komposit latar ancestor; gradien/gambar = tidak dapat diukur (dihitung terpisah, bukan lulus); opasitas ancestor tidak dihitung; bukan axe',
  total: { teksDiukur: jml((r) => r.teksDiukur), gagal: jml((r) => r.gagal.filter((g) => !g.ruang).length), gagalRuangWarna: jml((r) => r.gagal.filter((g) => g.ruang).length), tidakDapatDiukur: jml((r) => r.tidakDapatDiukur), latarTakTerselesaikan: jml((r) => r.latarTakTerselesaikan || 0), gagalMobileTerang: mobileTerang.reduce((a, r) => a + r.gagal.length, 0) },
  pelanggar: Object.entries(histo).sort((a, b) => b[1] - a[1]).slice(0, 40), hasil }
writeFileSync(process.env.QA_OUT || 'kontras-evidence.json', JSON.stringify(ringkas, null, 2))
console.log(JSON.stringify(ringkas.total))
// fail-closed: di CI baseline wajib ada; tanpa itu gerbang diam-diam menjadi Infinity (cacat yang pernah lolos: workflow tak mengirim KONTRAS_BASELINE).
if (process.env.CI && !(process.env.KONTRAS_BASELINE && existsSync(process.env.KONTRAS_BASELINE))) { console.error('KONTRAS_BASELINE tidak diset/ada di CI: gerbang tidak boleh berjalan tanpa baseline'); process.exit(1) }
const dasar = process.env.KONTRAS_BASELINE && existsSync(process.env.KONTRAS_BASELINE) ? JSON.parse(readFileSync(process.env.KONTRAS_BASELINE, 'utf8')) : null
if (dasar && ringkas.total.gagal > dasar.gagal) { console.error(`kontras-wcag GAGAL: teks di bawah AA melampaui baseline: ${ringkas.total.gagal} > ${dasar.gagal}`); process.exit(1) }
// Teks yang warnanya oklch()/oklab()/color() dahulu DILEWATI diam-diam (regex rgb() membacanya null); kini terukur lewat kanvas dan dihitung terpisah
// agar batas lama tidak dilonggarkan: gagal (jalur rgb) tetap dibandingkan dengan batas lama, gagalRuangWarna punya batas sendiri yang hanya boleh turun.
if (dasar && !Number.isFinite(dasar.gagalRuangWarna)) { console.error('kontras-wcag GAGAL: baseline tanpa gagalRuangWarna (teks ruang-warna harus punya batas sendiri, fail-closed)'); process.exit(1) }
if (dasar && ringkas.total.gagalRuangWarna > dasar.gagalRuangWarna) { console.error(`kontras-wcag GAGAL: teks ruang-warna di bawah AA melampaui baseline: ${ringkas.total.gagalRuangWarna} > ${dasar.gagalRuangWarna}`); process.exit(1) }
