// F2 / Task 45 — audit keyboard terukur: tekan Tab pada halaman nyata (aplikasi + API nyata, identitas sintetis), dua viewport, tema terang.
// Mengukur per halaman: stop fokus tanpa indikator (outline/ring SETELAH transisi selesai), stop yang tak terlihat, jebakan keyboard
// (elemen sama > 6 Tab berturut-turut), dan halaman tanpa stop fokus. BUKAN pengganti uji pembaca layar atau pemeriksaan manual:
// tidak mencakup Escape pada dialog, urutan fokus yang bermakna, atau pemulihan fokus setelah aksi.
//   node scripts/qa/keyboard-audit.mjs   (env sama dengan ux-audit.mjs; KEYBOARD_BASELINE=<json> untuk gerbang; wajib di CI)
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { analisisFokus, bandingkanKeyboard } from './keyboard-analisis.mjs'
const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const chromium = pw.chromium ?? pw.default.chromium
const API = process.env.QA_API || 'http://127.0.0.1:18790'
const APP = process.env.QA_URL || 'http://localhost:5190/'
const VIEWPORTS = [{ name: 'mobile-390x844', width: 390, height: 844 }, { name: 'desktop-1440x900', width: 1440, height: 900 }]
const PAGES = ['#/', '#/harian', '#/chatbot', '#/settings', '#/profile', '#/clinical-hub', '#/fitness-hub', '#/health-data', '#/all-features']
const TAB = 60
const login = await (await fetch(API + '/api/auth/dev-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'keyboard-audit@example.com', role: 'pasien', name: 'Keyboard Audit' }) })).json()
const session = JSON.stringify({ loginAt: Date.now(), account: { email: 'keyboard-audit@example.com', name: 'Keyboard Audit', role: 'pasien', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } })

const bacaFokus = () => {
  const e = document.activeElement
  if (!e || e === document.body || e === document.documentElement) return { hilang: true }
  const cs = getComputedStyle(e); const r = e.getBoundingClientRect()
  const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
  const ring = cs.boxShadow !== 'none' && !/^(rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, )?)+$/.test(cs.boxShadow)
  // Input tanggal/waktu: Tab ke-4 mendarat di tombol picker internal (shadow DOM). activeElement tetap host-nya tetapi host tidak
  // :focus-visible; indikator dikelola peramban untuk sub-kontrol itu, jadi bukan cacat aplikasi. Bila host sendiri :focus-visible,
  // cincin tetap diwajibkan.
  const subKontrolBawaan = e.tagName === 'INPUT' && /^(time|date|datetime-local|month|week)$/.test(e.type) && !e.matches(':focus-visible')
  return { hilang: false, key: e.tagName + '|' + Math.round(r.x) + ',' + Math.round(r.y) + '|' + (e.getAttribute('aria-label') || (e.innerText || '').slice(0, 20)), terlihat: r.width > 0 && r.height > 0, indikator: outline || ring || subKontrolBawaan }
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
const hasil = []
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: 'light', reducedMotion: 'reduce' })
    await ctx.addInitScript(([s, t]) => { localStorage.setItem('panaceamed.session.v1', s); localStorage.setItem('pmd-token', t); localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1'); localStorage.setItem('pmd-theme', 'light') }, [session, login.token])
    const page = await ctx.newPage()
    for (const rute of PAGES) {
      await page.goto(APP + rute, { waitUntil: 'domcontentloaded', timeout: 120000 })
      await page.getByRole('button', { name: 'Notifications' }).first().waitFor({ timeout: 60000 }).catch(() => {})
      await page.waitForTimeout(1500)
      await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0) })
      const langkah = []
      for (let i = 0; i < TAB; i++) {
        await page.keyboard.press('Tab')
        // Indikator fokus memakai transisi CSS: ukur setelah selesai; bila tak ada, tunggu lagi sebelum menghitungnya sebagai cacat.
        await page.waitForTimeout(180)
        let s = await page.evaluate(bacaFokus)
        if (!s.hilang && !s.indikator) { await page.waitForTimeout(700); s = await page.evaluate(bacaFokus) }
        langkah.push(s)
      }
      hasil.push({ viewport: vp.name, rute, ...analisisFokus(langkah) })
    }
    await ctx.close()
  }
} finally { await browser.close() }

const jumlah = (k) => hasil.reduce((a, r) => a + r[k], 0)
const total = { tanpaIndikator: jumlah('tanpaIndikator'), takTerlihat: jumlah('takTerlihat'), terjebak: jumlah('terjebak'), tanpaStopFokus: jumlah('tanpaStopFokus') }
if (process.env.QA_OUT) writeFileSync(process.env.QA_OUT, JSON.stringify({ dihasilkan: new Date().toISOString(), metode: 'Tab x60 per halaman, tema terang, dua viewport; indikator diukur setelah transisi', total, hasil }, null, 1))
console.log(JSON.stringify({ pengukuran: hasil.length, ...total }))
const baseline = process.env.KEYBOARD_BASELINE && existsSync(process.env.KEYBOARD_BASELINE) ? JSON.parse(readFileSync(process.env.KEYBOARD_BASELINE, 'utf8')) : null
if (baseline || process.env.CI) {
  const gagal = bandingkanKeyboard(total, baseline)
  if (gagal.length) { console.error('keyboard-audit GAGAL:\n - ' + gagal.join('\n - ')); process.exitCode = 1 }
}
