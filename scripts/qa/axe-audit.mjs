// F2 / Task 45 — audit aksesibilitas otomatis dengan axe-core (WCAG 2.2 A/AA) pada halaman nyata, dua tema, dua viewport.
// Aplikasi + API nyata, identitas sintetis (sama dengan ux-audit.mjs). Mengukur, bukan menilai.
// BATAS: axe hanya menangkap sebagian masalah aksesibilitas (kira-kira sepertiga menurut praktik umum); tidak menggantikan uji
// pembaca layar atau pemeriksaan manual. `color-contrast` dikecualikan di sini karena sudah diukur terpisah oleh kontras-wcag.mjs.
//   node scripts/qa/axe-audit.mjs   (butuh API + Vite seperti ux-audit.mjs; AXE_BASELINE=<json> untuk gerbang ratchet;
//   AXE_MODULE=<path axe.min.js> bila axe-core tidak terpasang sebagai paket)
// Gerbang (gagal bila dilanggar): jumlah node pelanggar `critical` + `serious` melampaui baseline, atau pelanggar kelas itu
// pada aturan yang BELUM ada di baseline (aturan baru tidak boleh muncul diam-diam). Tanpa baseline di CI = gagal (fail-closed).
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { bandingkan, DAMPAK_GERBANG } from './axe-ratchet.mjs'
const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const chromium = pw.chromium ?? pw.default.chromium
const API = process.env.QA_API || 'http://127.0.0.1:18790'
const APP = process.env.QA_URL || 'http://localhost:5190/'
const VIEWPORTS = [{ name: 'mobile-390x844', width: 390, height: 844 }, { name: 'desktop-1440x900', width: 1440, height: 900 }]
const THEMES = ['light', 'dark']
const PAGES = ['#/', '#/harian', '#/chatbot', '#/settings', '#/profile', '#/clinical-hub', '#/fitness-hub', '#/health-data', '#/all-features']
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const axeSource = readFileSync(process.env.AXE_MODULE || createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
const call = async (m, p, body) => { const r = await fetch(API + p, { method: m, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return r.json() }
const login = await call('POST', '/api/auth/dev-login', { email: 'axe-audit@example.com', role: 'pasien', name: 'Axe Audit' })
const session = JSON.stringify({ loginAt: Date.now(), account: { email: 'axe-audit@example.com', name: 'Axe Audit', role: 'pasien', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } })

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
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
        await page.waitForTimeout(1500)
        await page.evaluate(axeSource)
        const r = await page.evaluate(async (tags) => {
          const o = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, rules: { 'color-contrast': { enabled: false } }, resultTypes: ['violations'] })
          return { violations: o.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 140) })), total: v.nodes.length })), incomplete: o.incomplete.length }
        }, TAGS)
        hasil.push({ viewport: vp.name, tema, rute, ...r })
      }
      await ctx.close()
    }
  } finally { await browser.close() }

  // Agregasi lintas halaman/viewport/tema: untuk tiap aturan, nilai TERBESAR per-pengukuran dijumlahkan menjadi total node unik-ish
  // (node yang sama pada tema/viewport berbeda dihitung terpisah, konsisten dengan ux-audit.mjs).
  const aturan = {}
  for (const r of hasil) for (const v of r.violations) { const a = (aturan[v.id] ??= { dampak: v.impact ?? 'minor', node: 0, bantuan: v.help }); a.node += v.total }
  const baseline = process.env.AXE_BASELINE && existsSync(process.env.AXE_BASELINE) ? JSON.parse(readFileSync(process.env.AXE_BASELINE, 'utf8')) : null
  const ringkas = { dihasilkan: new Date().toISOString(), axe: 'axe-core', tag: TAGS, pengukuran: hasil.length, aturan, incompleteTotal: hasil.reduce((a, r) => a + r.incomplete, 0), hasil }
  if (process.env.QA_OUT) writeFileSync(process.env.QA_OUT, JSON.stringify(ringkas, null, 1))
  const seriusKritis = Object.entries(aturan).filter(([, a]) => DAMPAK_GERBANG.has(a.dampak))
  console.log(JSON.stringify({ pengukuran: hasil.length, aturanTotal: Object.keys(aturan).length, aturanSeriusKritis: seriusKritis.map(([id, a]) => `${id}:${a.dampak}:${a.node}`), totalNodeSeriusKritis: seriusKritis.reduce((s, [, a]) => s + a.node, 0), incompleteTotal: ringkas.incompleteTotal }))
  if (baseline || process.env.CI) {
    const gagal = bandingkan(Object.fromEntries(Object.entries(aturan).map(([k, a]) => [k, { dampak: a.dampak, node: a.node }])), baseline)
    if (gagal.length) { console.error('axe-audit GAGAL:\n - ' + gagal.join('\n - ')); process.exitCode = 1 }
  }
}
