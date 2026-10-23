// F2 / Task 45 — audit performa terukur pada BUILD PRODUKSI (bukan dev server), aplikasi + API nyata, identitas sintetis.
// Metodologi (dicatat agar angkanya dapat ditafsirkan): tiap sampel memakai konteks peramban BARU (cache dingin); N sampel per halaman x viewport (bawaan 5),
// dilaporkan MEDIAN dan nilai terburuk; mobile 390x844 dengan CPU diperlambat 4x (CDP), desktop 1440x900 tanpa; jaringan TIDAK diperlambat (loopback);
// LCP/CLS/tugas panjang dikumpulkan dengan PerformanceObserver sejak dokumen mulai; TBT = jumlah (durasi - 50 ms) tugas panjang setelah FCP (proksi lab untuk INP);
// ukuran = encodedBodySize sumber daya (tanpa kompresi di server preview, jadi sama dengan ukuran berkas). Acuan anggaran = ambang "baik" Web Vitals
// (scripts/qa/perf-stats.mjs). BATAS: runner CI bukan perangkat pengguna dan tidak ada data lapangan (RUM); angka ini bukti lab, bukan klaim pengalaman pengguna.
// Mode: LAPORAN (tanpa baseline) — gagal hanya bila sebuah halaman tidak dapat diukur sama sekali. Ratchet dari nilai terukur CI adalah langkah berikutnya.
//
// Jalankan: server API dan `vite preview` (build produksi) aktif, lalu
//   PLAYWRIGHT_MODULE=<path>/playwright/index.js CHROME=<path chrome> QA_OUT=<json> QA_URL=http://localhost:5191/ node scripts/qa/perf-audit.mjs
import { writeFileSync } from 'node:fs'
import { ANGGARAN, agregat, cumulativeLayoutShift, statusAnggaran, totalBlockingTime } from './perf-stats.mjs'
import { enoughPerfEvidence, minimumPerfSamples, perfSampleProblem } from './perf-sample-coverage.mjs'

const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const chromium = pw.chromium ?? pw.default.chromium
const API = process.env.QA_API || 'http://127.0.0.1:18790'
const APP = process.env.QA_URL || 'http://localhost:5191/'
const N = Number(process.env.QA_PERF_N ?? 5)
const MINIMUM_SAMPLES = minimumPerfSamples(N)
const SETTLE_MS = Number(process.env.QA_PERF_SETTLE_MS || 2500)
const VIEWPORTS = [{ name: 'mobile-390x844', width: 390, height: 844, cpu: 4 }, { name: 'desktop-1440x900', width: 1440, height: 900, cpu: 1 }]
const HALAMAN = [
  { nama: 'landing-anonim', rute: '#/', masuk: false },
  { nama: 'beranda-pasien', rute: '#/', masuk: true }, { nama: 'harian', rute: '#/harian', masuk: true }, { nama: 'chatbot', rute: '#/chatbot', masuk: true },
  { nama: 'clinical-hub', rute: '#/clinical-hub', masuk: true }, { nama: 'health-data', rute: '#/health-data', masuk: true },
]
const SESSION_KEY = 'panaceamed.session.v1'
const TOKEN_KEY = 'pmd-token'

const login = await (await fetch(API + '/api/auth/dev-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'perf@example.com', role: 'pasien', name: 'Perf Audit' }) })).json()
if (!login?.token) { console.error('perf-audit: login dev gagal'); process.exit(2) }
const sesi = JSON.stringify({ loginAt: Date.now(), account: { email: 'perf@example.com', name: 'Perf Audit', role: 'pasien', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } })

// Dipasang sebelum skrip halaman: mengumpulkan LCP, pergeseran tata letak, dan tugas panjang.
const KOLEKTOR = `(() => { const p = window.__perf = { lcp: null, shifts: [], longTasks: [], observers: {} };
  const supported = typeof PerformanceObserver === 'function' && Array.isArray(PerformanceObserver.supportedEntryTypes) ? PerformanceObserver.supportedEntryTypes : [];
  const obs = (type, fn) => { p.observers[type] = false; if (!supported.includes(type)) return;
    try { const observer = new PerformanceObserver((l) => l.getEntries().forEach(fn)); observer.observe({ type, buffered: true }); p.observers[type] = true } catch {} }
  obs('largest-contentful-paint', (e) => { p.lcp = e.startTime })
  obs('layout-shift', (e) => { p.shifts.push({ value: e.value, hadRecentInput: e.hadRecentInput }) })
  obs('longtask', (e) => { p.longTasks.push({ startTime: e.startTime, duration: e.duration }) }) })()`

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
const hasil = []
let gagalUkur = 0
try {
  for (const vp of VIEWPORTS) for (const h of HALAMAN) {
    const sampel = []
    for (let i = 0; i < N; i++) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'no-preference' })
      try {
        await ctx.addInitScript({ content: KOLEKTOR })
        if (h.masuk) await ctx.addInitScript(([s, t, k1, k2]) => { localStorage.setItem(k1, s); localStorage.setItem(k2, t); localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1') }, [sesi, login.token, SESSION_KEY, TOKEN_KEY])
        const page = await ctx.newPage()
        if (vp.cpu > 1) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: vp.cpu }) }
        const response = await page.goto(APP + h.rute, { waitUntil: 'load', timeout: 120000 })
        if (!response || response.status() !== 200) throw new Error(`public app navigation HTTP ${response?.status() ?? 'no response'}`)
        await page.waitForTimeout(SETTLE_MS)
        const m = await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0]
          const fcp = performance.getEntriesByName('first-contentful-paint')[0]
          const rs = performance.getEntriesByType('resource')
          const bytes = (xs) => xs.reduce((a, r) => a + (r.encodedBodySize || 0), 0)
          return { nav: nav ? { ttfb: nav.responseStart, dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, doc: nav.encodedBodySize || 0 } : null, fcp: fcp ? fcp.startTime : null,
            perf: window.__perf, requests: rs.length + 1, bytesTotal: bytes(rs) + (nav?.encodedBodySize || 0), bytesJs: bytes(rs.filter((r) => /\.m?js(\?|$)/.test(r.name))) }
        })
        sampel.push({
          ttfbMs: m.nav?.ttfb ?? null, dclMs: m.nav?.dcl ?? null, loadMs: m.nav?.load ?? null, fcpMs: m.fcp, lcpMs: m.perf?.lcp ?? null,
          cls: cumulativeLayoutShift(m.perf?.shifts ?? null), tbtMs: m.fcp === null ? null : totalBlockingTime(m.perf?.longTasks ?? null, m.fcp),
          observers: m.perf?.observers ?? null,
          requests: m.requests, bytesTotal: m.bytesTotal, bytesJs: m.bytesJs,
        })
      } catch (e) { sampel.push({ galat: String(e.message).split('\n')[0] }) } finally { await ctx.close() }
    }
    const sah = sampel.filter((s) => perfSampleProblem(s) === null)
    const required = MINIMUM_SAMPLES
    if (!enoughPerfEvidence(sampel, required)) gagalUkur++
    const metrik = ['ttfbMs', 'dclMs', 'loadMs', 'fcpMs', 'lcpMs', 'cls', 'tbtMs', 'requests', 'bytesTotal', 'bytesJs']
    const agg = Object.fromEntries(metrik.map((k) => [k, agregat(sah, k)]))
    hasil.push({ viewport: vp.name, cpuThrottle: vp.cpu, halaman: h.nama, rute: h.rute, sampelSah: sah.length, sampelGalat: sampel.length - sah.length, galat: sampel.map(perfSampleProblem).filter(Boolean).slice(0, 2), minimumSampelSah: required, agg,
      anggaran: { lcpMs: statusAnggaran('lcpMs', agg.lcpMs.median), cls: statusAnggaran('cls', agg.cls.median), tbtMs: statusAnggaran('tbtMs', agg.tbtMs.median) } })
  }
} finally { await browser.close() }

const ringkas = { dihasilkan: new Date().toISOString(), app: APP, sampelPerHalaman: N, settleMs: SETTLE_MS, acuanAnggaran: ANGGARAN,
  metodologi: 'build produksi; cache dingin per sampel; median dan terburuk; mobile CPU 4x; jaringan tidak diperlambat; LCP/CLS/longtask via PerformanceObserver; TBT setelah FCP; bukan data lapangan',
  ringkasanAnggaran: { lulus: 0, melebihi: 0, takTerukur: 0 }, hasil }
for (const r of hasil) for (const s of Object.values(r.anggaran)) { if (s === 'lulus') ringkas.ringkasanAnggaran.lulus++; else if (s === 'melebihi') ringkas.ringkasanAnggaran.melebihi++; else ringkas.ringkasanAnggaran.takTerukur++ }
writeFileSync(process.env.QA_OUT || 'perf-evidence.json', JSON.stringify(ringkas, null, 2))
for (const r of hasil) console.log(`${r.viewport} ${r.halaman.padEnd(15)} n=${r.sampelSah} lcp=${r.agg.lcpMs.median?.toFixed(0) ?? '-'}ms cls=${r.agg.cls.median?.toFixed(3) ?? '-'} tbt=${r.agg.tbtMs.median?.toFixed(0) ?? '-'}ms js=${r.agg.bytesJs.median ?? '-'}B req=${r.agg.requests.median ?? '-'} [${r.anggaran.lcpMs}/${r.anggaran.cls}/${r.anggaran.tbtMs}]`)
console.log(`perf-audit: ${hasil.length} pengukuran; anggaran lulus ${ringkas.ringkasanAnggaran.lulus}, melebihi ${ringkas.ringkasanAnggaran.melebihi}, tak terukur ${ringkas.ringkasanAnggaran.takTerukur}; halaman dengan sampel metrik lengkap kurang dari mayoritas: ${gagalUkur}`)
if (gagalUkur > 0) { console.error(`perf-audit: ${gagalUkur} halaman tidak cukup sampel metrik lengkap`); process.exit(1) }
