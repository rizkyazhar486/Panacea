// F2 / Task 45 — ukur kontras teks WCAG 2.x (AA: 4.5:1 teks normal, 3:1 teks besar) pada halaman nyata, dua tema, dua viewport.
// Metode: warna latar efektif = komposit lapisan latar ancestor (alpha dipertimbangkan). Latar gradien/gambar TIDAK diselesaikan:
// elemen itu dihitung terpisah sebagai `tidakDapatDiukur` (bukan dianggap lulus). Bukan pengganti axe/pemeriksaan manual.
//   node scripts/qa/kontras-wcag.mjs   (env sama dengan ux-audit.mjs; KONTRAS_BASELINE=<json> opsional)
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const chromium = pw.chromium ?? pw.default.chromium
const API = process.env.QA_API || 'http://127.0.0.1:18790'
const APP = process.env.QA_URL || 'http://localhost:5190/'
const VIEWPORTS = [{ name: 'mobile-390x844', width: 390, height: 844 }, { name: 'desktop-1440x900', width: 1440, height: 900 }]
const THEMES = ['light', 'dark']
const PAGES = (process.env.KONTRAS_PAGES || '#/,#/harian,#/chatbot,#/settings,#/profile,#/clinical-hub,#/fitness-hub,#/health-data,#/all-features').split(',')

const login = await (await fetch(API + '/api/auth/dev-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'kontras@example.com', role: 'pasien', name: 'Kontras' }) })).json()
const session = JSON.stringify({ loginAt: Date.now(), account: { email: 'kontras@example.com', name: 'Kontras', role: 'pasien', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } })

const ukur = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 } }
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 })
  const lum = (c) => { const t = [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2] }
  const rasio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
  const latar = (el) => { // dari elemen ke atas sampai lapisan opak; gradien/gambar di antaranya => tak dapat diukur
    const lapis = []; let ok = true; let dasar = null
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e)
      if (s.backgroundImage !== 'none') { ok = false; break }
      const c = parse(s.backgroundColor)
      if (c && c.a > 0) { lapis.push(c); if (c.a >= 1) { dasar = c; break } }
    }
    let hasil = dasar ?? { r: 255, g: 255, b: 255, a: 1 }
    for (const c of (dasar ? lapis.slice(0, -1) : lapis).reverse()) hasil = over(c, hasil)
    return { warna: hasil, ok }
  }
  const out = { teksDiukur: 0, gagal: [], tidakDapatDiukur: 0 }
  const seen = new Set()
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n; (n = w.nextNode());) {
    if (!n.nodeValue.trim()) continue
    const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el)
    const s = getComputedStyle(el); const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1 || s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) === 0 || el.closest('[aria-hidden="true"],script,style,noscript,canvas')) continue
    if (s.clip !== 'auto' && s.clip !== '' || (s.position === 'absolute' && r.width <= 1 && r.height <= 1) || el.closest('.sr-only')) continue // teks khusus pembaca layar (sr-only)
    if (el.disabled || el.closest('[disabled]')) continue // WCAG 1.4.3 mengecualikan komponen nonaktif
    const fg0 = parse(s.color); if (!fg0) continue
    const { warna: bg, ok } = latar(el)
    if (!ok) { out.tidakDapatDiukur++; continue }
    const op = parseFloat(s.opacity) // opasitas elemen sendiri saja (opasitas ancestor tidak dihitung: dicatat di metode)
    const fg = over({ ...fg0, a: fg0.a * op }, bg)
    const px = parseFloat(s.fontSize); const tebal = parseInt(s.fontWeight, 10) >= 700
    const besar = px >= 24 || (px >= 18.66 && tebal)
    const perlu = besar ? 3 : 4.5
    const k = rasio(fg, bg)
    // teks ~identik dengan latar yang terbaca = hampir pasti lapisan latar di luar rantai ancestor (pseudo-elemen, saudara absolut): TIDAK dinilai lulus, dihitung terpisah.
    if (k < 1.5) { out.latarTakTerselesaikan = (out.latarTakTerselesaikan || 0) + 1; continue }
    out.teksDiukur++
    if (k < perlu) out.gagal.push({ sel: `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}`, teks: n.nodeValue.trim().slice(0, 30), rasio: Math.round(k * 100) / 100, perlu, px, fg: `rgb(${Math.round(fg.r)},${Math.round(fg.g)},${Math.round(fg.b)})`, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})` })
  }
  return out
}

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
  total: { teksDiukur: jml((r) => r.teksDiukur), gagal: jml((r) => r.gagal.length), tidakDapatDiukur: jml((r) => r.tidakDapatDiukur), latarTakTerselesaikan: jml((r) => r.latarTakTerselesaikan || 0), gagalMobileTerang: mobileTerang.reduce((a, r) => a + r.gagal.length, 0) },
  pelanggar: Object.entries(histo).sort((a, b) => b[1] - a[1]).slice(0, 40), hasil }
writeFileSync(process.env.QA_OUT || 'kontras-evidence.json', JSON.stringify(ringkas, null, 2))
console.log(JSON.stringify(ringkas.total))
// fail-closed: di CI baseline wajib ada; tanpa itu gerbang diam-diam menjadi Infinity (cacat yang pernah lolos: workflow tak mengirim KONTRAS_BASELINE).
if (process.env.CI && !(process.env.KONTRAS_BASELINE && existsSync(process.env.KONTRAS_BASELINE))) { console.error('KONTRAS_BASELINE tidak diset/ada di CI: gerbang tidak boleh berjalan tanpa baseline'); process.exit(1) }
const dasar = process.env.KONTRAS_BASELINE && existsSync(process.env.KONTRAS_BASELINE) ? JSON.parse(readFileSync(process.env.KONTRAS_BASELINE, 'utf8')) : null
if (dasar && ringkas.total.gagal > dasar.gagal) { console.error(`kontras-wcag GAGAL: teks di bawah AA melampaui baseline: ${ringkas.total.gagal} > ${dasar.gagal}`); process.exit(1) }
