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
  // Tiga kelas, tidak dilebur: (1) kontrol sungguhan -> lantai 44px (standar repo); (2) tautan inline dalam teks -> dikecualikan
  // WCAG 2.5.8 tetapi DIHITUNG terpisah; (3) blok teks tap-to-interpret (.pmd-vf-copy, role=button dari skrip visual-first) -> lantai 24px (WCAG 2.5.8 AA; toleransi 0.5px: animasi masuk halaman menskala ~0.3%).
  const ukuran = (e) => e.getBoundingClientRect()
  const inlineTeks = (e) => e.tagName === 'A' && getComputedStyle(e).display === 'inline'
  const blokTeks = (e) => e.classList.contains('pmd-vf-copy')
  const kecil = interaktif.filter((e) => { if (inlineTeks(e) || blokTeks(e)) return false; const r = ukuran(e); return r.width < 44 || r.height < 44 })
  const inlineDikecualikan = interaktif.filter((e) => inlineTeks(e) && (ukuran(e).height < 44)).length
  const blokTeksBawah24 = interaktif.filter((e) => blokTeks(e) && (ukuran(e).width < 23.5 || ukuran(e).height < 23.5)).length
  const tanpaNama = interaktif.filter((e) => !nama(e) && !(e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) && !e.closest('label'))
  const sel = (e) => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`
  const reminder = document.querySelector('[data-daily-reminder]')
  // Fixed overlays have no offsetParent; the general control probe above
  // cannot establish their visibility.
  const reminderVisible = Boolean(reminder && (() => {
    const box = ukuran(reminder), style = getComputedStyle(reminder)
    return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
  })())
  const reminderBox = reminderVisible ? ukuran(reminder) : null
  const reminderHeadingOverlap = reminderBox ? [...document.querySelectorAll('main h1')].filter(vis).filter((heading) => {
    const box = ukuran(heading)
    return Math.min(box.right, reminderBox.right) > Math.max(box.left, reminderBox.left)
      && Math.min(box.bottom, reminderBox.bottom) > Math.max(box.top, reminderBox.top)
  }).length : 0
  return {
    reminderVisible, reminderHeadingOverlap,
    overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    interaktif: interaktif.length,
    inlineDikecualikan, blokTeksBawah24,
    targetKecil: kecil.length, contohTargetKecil: kecil.slice(0, 5).map(sel),
    daftarTargetKecil: kecil.map((e) => { const r = e.getBoundingClientRect(); return `${sel(e)} ${Math.round(r.width)}x${Math.round(r.height)}` }),
    tanpaNama: tanpaNama.length, contohTanpaNama: tanpaNama.slice(0, 5).map(sel),
    gambarTanpaAlt: [...document.querySelectorAll('img')].filter((i) => vis(i) && !i.hasAttribute('alt')).length,
    // reduced-motion: konteks audit memakai reducedMotion:'reduce'; animasi CSS yang tetap berjalan terus-menerus (iterasi tak hingga) atau
    // masih >2 dtk sisa waktunya adalah pelanggaran preferensi. Transisi singkat yang kebetulan berjalan saat cuplik tidak dihitung.
    animasiBerjalanReduced: document.getAnimations().filter((a) => { if (a.playState !== 'running') return false; const t = a.effect?.getComputedTiming?.(); return t && (t.iterations === Infinity || (t.endTime - (a.currentTime ?? 0)) > 2000) }).length,
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
  total: { pengukuran: hasil.length, overflowHalaman: hasil.filter((r) => r.overflowPx > 1).length, targetKecil: jumlah('targetKecil'), targetKecilMobile: hasil.filter((r) => r.viewport.startsWith('mobile')).reduce((a, r) => a + r.targetKecil, 0), blokTeksBawah24: jumlah('blokTeksBawah24'), inlineDikecualikan: jumlah('inlineDikecualikan'), tanpaNama: jumlah('tanpaNama'), gambarTanpaAlt: jumlah('gambarTanpaAlt'), tanpaFokusTerlihat: hasil.filter((r) => !r.fokusTab.ada || !r.fokusTab.indikator).length, tanpaMain: hasil.filter((r) => !r.mainLandmark).length, animasiBerjalanReduced: jumlah('animasiBerjalanReduced'), galatHalaman: jumlah('galatHalaman'),
    muatMsP50: [...hasil.map((r) => r.muatMs)].sort((a, b) => a - b)[Math.floor(hasil.length / 2)], muatMsMaks: Math.max(...hasil.map((r) => r.muatMs)) }, hasil }
// histogram pelanggar per selektor (mobile-390 saja: target sentuh nyata) agar perbaikan menyasar primitif, bukan instans
const histo = {}
for (const r of hasil.filter((x) => x.viewport.startsWith('mobile') && x.tema === 'light')) for (const d of r.daftarTargetKecil) { const k = d.replace(/ \d+x\d+$/, ''); histo[k] = (histo[k] || 0) + 1 }
ringkas.pelanggarMobileTerang = Object.entries(histo).sort((a, b) => b[1] - a[1]).slice(0, 60)
writeFileSync(process.env.QA_OUT || 'ux-audit-evidence.json', JSON.stringify(ringkas, null, 2))
console.log(JSON.stringify(ringkas.total))
// fail-closed: di CI baseline wajib ada; tanpa itu gerbang diam-diam menjadi Infinity (cacat yang pernah lolos: workflow tak mengirim UX_BASELINE).
if (process.env.CI && !(process.env.UX_BASELINE && existsSync(process.env.UX_BASELINE))) { console.error('UX_BASELINE tidak diset/ada di CI: gerbang tidak boleh berjalan tanpa baseline'); process.exit(1) }
const dasar = process.env.UX_BASELINE && existsSync(process.env.UX_BASELINE) ? JSON.parse(readFileSync(process.env.UX_BASELINE, 'utf8')) : null
const gagal = []
if (jumlah('reminderHeadingOverlap') > 0) gagal.push(`daily quote overlaps the Home heading: ${jumlah('reminderHeadingOverlap')}`)
if (ringkas.total.overflowHalaman > (dasar?.overflowHalaman ?? 0)) gagal.push(`overflow horizontal: ${ringkas.total.overflowHalaman}`)
if (ringkas.total.tanpaNama > (dasar?.tanpaNama ?? Infinity)) gagal.push(`kontrol tanpa nama melampaui baseline: ${ringkas.total.tanpaNama}`)
// Target sentuh relevan di viewport sentuh (mobile); desktop 1440 dilaporkan sebagai informasi, tidak digerbang.
if (ringkas.total.targetKecilMobile > (dasar?.targetKecilMobile ?? Infinity)) gagal.push(`target sentuh <${MIN_TARGET}px (mobile) melampaui baseline: ${ringkas.total.targetKecilMobile}`)
if (ringkas.total.animasiBerjalanReduced > (dasar?.animasiBerjalanReduced ?? Infinity)) gagal.push(`animasi tetap berjalan saat prefers-reduced-motion: ${ringkas.total.animasiBerjalanReduced}`)
if (ringkas.total.blokTeksBawah24 > (dasar?.blokTeksBawah24 ?? Infinity)) gagal.push(`blok teks interaktif <24px melampaui baseline: ${ringkas.total.blokTeksBawah24}`)
if (gagal.length) { console.error('ux-audit GAGAL: ' + gagal.join('; ')); process.exit(1) }
