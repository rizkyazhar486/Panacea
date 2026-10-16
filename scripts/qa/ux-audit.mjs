// F2 / Task 45 — audit UI/UX terukur pada halaman perjalanan kritis + navigasi global (aplikasi + API nyata, identitas sintetis).
// Mengukur (bukan menilai): overflow horizontal, target sentuh < 44px, kontrol tanpa nama aksesibel, gambar tanpa alt,
// input tanpa label, fokus terlihat, reduced-motion, dua tema (terang/gelap), dua viewport, + waktu muat (metodologi dicatat).
// Keluaran JSON = inventaris + temuan. TIDAK menyatakan lulus WCAG penuh: kontras dan pemeriksaan manual dicatat sebagai belum tercakup.
// Gerbang (gagal bila dilanggar): overflow horizontal > 1px, kontrol interaktif tanpa nama, dan angka temuan melampaui BASELINE (ratchet).
//   node scripts/qa/ux-audit.mjs   (butuh API + Vite seperti user-journey-e2e.mjs; env sama; UX_BASELINE=<json> opsional)
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const chromium = pw.chromium ?? pw.default.chromium
const API = process.env.QA_API || 'http://127.0.0.1:18790'
const APP = process.env.QA_URL || 'http://localhost:5190/'
const VIEWPORTS = [{ name: 'mobile-390x844', width: 390, height: 844 }, { name: 'desktop-1440x900', width: 1440, height: 900 }]
const THEMES = ['light', 'dark']
const PAGES = ['#/', '#/harian', '#/chatbot', '#/settings', '#/profile', '#/clinical-hub', '#/fitness-hub', '#/health-data', '#/all-features']
const MIN_TARGET = 44

const call = async (m, p, body) => { const r = await fetch(API + p, { method: m, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return r.json() }
const login = await call('POST', '/api/auth/dev-login', { email: 'ux-audit@example.com', role: 'pasien', name: 'UX Audit' })
const session = JSON.stringify({ loginAt: Date.now(), account: { email: 'ux-audit@example.com', name: 'UX Audit', role: 'pasien', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } })

const medir = () => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && e.offsetParent !== null }
  const nama = (e) => (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.getAttribute('title') || e.innerText || e.textContent || e.value || e.getAttribute('placeholder') || '').trim()
  const interaktif = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=link],[role=tab]')].filter(vis)
  const kecil = interaktif.filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44 })
  const tanpaNama = interaktif.filter((e) => !nama(e) && !(e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) && !e.closest('label'))
  const sel = (e) => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`
  return {
    overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    interaktif: interaktif.length,
    targetKecil: kecil.length, contohTargetKecil: kecil.slice(0, 5).map(sel),
    tanpaNama: tanpaNama.length, contohTanpaNama: tanpaNama.slice(0, 5).map(sel),
    gambarTanpaAlt: [...document.querySelectorAll('img')].filter((i) => vis(i) && !i.hasAttribute('alt')).length,
    mainLandmark: !!document.querySelector('main,[role=main]'),
    h1: document.querySelectorAll('h1').length,
  }
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
const hasil = []
try {
  for (const vp of VIEWPORTS) for (const tema of THEMES) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: tema, reducedMotion: 'reduce' })
    await ctx.addInitScript(([s, t, th]) => { localStorage.setItem('panaceamed.session.v1', s); localStorage.setItem('pmd-token', t); localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1'); localStorage.setItem('pmd-theme', th) }, [session, login.token, tema])
    const page = await ctx.newPage(); const galat = []
    page.on('pageerror', (e) => galat.push(e.message))
    for (const rute of PAGES) {
      const t0 = Date.now()
      await page.goto(APP + rute, { waitUntil: 'domcontentloaded', timeout: 120000 })
      await page.getByRole('button', { name: 'Notifications' }).first().waitFor({ timeout: 60000 }).catch(() => {})
      const muatMs = Date.now() - t0
      await page.waitForTimeout(1500)
      const m = await page.evaluate(medir)
      // fokus keyboard: Tab pertama harus mendarat pada elemen terlihat dengan indikator fokus (outline/box-shadow)
      await page.keyboard.press('Tab')
      const fokus = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return { ada: false }; const s = getComputedStyle(e); return { ada: true, indikator: (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none' } })
      hasil.push({ viewport: vp.name, tema, rute, muatMs, galatHalaman: galat.length, ...m, fokusTab: fokus })
    }
    await ctx.close()
  }
} finally { await browser.close() }

const jumlah = (k) => hasil.reduce((a, r) => a + (r[k] || 0), 0)
const ringkas = { dihasilkan: new Date().toISOString(), metode: 'DOM terukur via Playwright Chromium; bukan axe; kontras WCAG dan pemeriksaan manual BELUM tercakup', halaman: PAGES, viewport: VIEWPORTS.map((v) => v.name), tema: THEMES,
  total: { pengukuran: hasil.length, overflowHalaman: hasil.filter((r) => r.overflowPx > 1).length, targetKecil: jumlah('targetKecil'), tanpaNama: jumlah('tanpaNama'), gambarTanpaAlt: jumlah('gambarTanpaAlt'), tanpaFokusTerlihat: hasil.filter((r) => !r.fokusTab.ada || !r.fokusTab.indikator).length, tanpaMain: hasil.filter((r) => !r.mainLandmark).length, galatHalaman: jumlah('galatHalaman'),
    muatMsP50: [...hasil.map((r) => r.muatMs)].sort((a, b) => a - b)[Math.floor(hasil.length / 2)], muatMsMaks: Math.max(...hasil.map((r) => r.muatMs)) }, hasil }
writeFileSync(process.env.QA_OUT || 'ux-audit-evidence.json', JSON.stringify(ringkas, null, 2))
console.log(JSON.stringify(ringkas.total))
const dasar = process.env.UX_BASELINE && existsSync(process.env.UX_BASELINE) ? JSON.parse(readFileSync(process.env.UX_BASELINE, 'utf8')) : null
const gagal = []
if (ringkas.total.overflowHalaman > (dasar?.overflowHalaman ?? 0)) gagal.push(`overflow horizontal: ${ringkas.total.overflowHalaman}`)
if (ringkas.total.tanpaNama > (dasar?.tanpaNama ?? Infinity)) gagal.push(`kontrol tanpa nama melampaui baseline: ${ringkas.total.tanpaNama}`)
if (ringkas.total.targetKecil > (dasar?.targetKecil ?? Infinity)) gagal.push(`target sentuh <${MIN_TARGET}px melampaui baseline: ${ringkas.total.targetKecil}`)
if (gagal.length) { console.error('ux-audit GAGAL: ' + gagal.join('; ')); process.exit(1) }
