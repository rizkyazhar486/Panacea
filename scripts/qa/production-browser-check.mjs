// Verifikasi produksi dari runner yang diizinkan: jaringan (DNS, TLS, redirect) lalu peramban nyata (390x844 dan 1440x900).
// Pakai: PROD_URL=https://panaceamed.id OUT=out node scripts/qa/production-browser-check.mjs   (butuh `playwright` terpasang)
// Keluar 2 = kegagalan jaringan (tahap disebutkan, BUKAN status aplikasi); 1 = temuan yang menggagalkan; 0 = lulus.
// Tidak mengklaim apa pun yang tidak diamati: SHA penyebaran frontend tidak tertanam di halaman, hanya dilaporkan bila server melaporkannya.
import dns from 'node:dns/promises'
import { assessPublicPage, productionAssetFailure } from './production-browser-verdict.mjs'
import fs from 'node:fs'
import path from 'node:path'
import tls from 'node:tls'

const BASE = (process.env.PROD_URL || 'https://panaceamed.id').replace(/\/$/, '')
const OUT = process.env.OUT || 'production-check'
const API = (process.env.PROD_API_URL || '').replace(/\/$/, '')
const EXPECT_SHA = process.env.EXPECT_SHA || ''
fs.mkdirSync(OUT, { recursive: true })
const url = new URL(BASE)
const report = { checkedAt: new Date().toISOString(), base: BASE, network: {}, viewports: [], findings: [], server: null }
const finding = (severity, msg) => report.findings.push({ severity, msg })
const save = () => fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1) + '\n')
const netFail = (stage, err) => { report.network.failed = { stage, error: String(err && err.message ? err.message : err), code: err && err.code }; finding('fail', `network ${stage}: ${report.network.failed.error}`); save(); console.error(JSON.stringify(report.network.failed)); process.exit(2) }

// 1) DNS
try { report.network.dns = await dns.lookup(url.hostname, { all: true }) } catch (e) { netFail('dns', e) }
// 2) TLS (somente https)
try {
  if (url.protocol === 'https:') report.network.tls = await new Promise((res, rej) => {
    const s = tls.connect({ host: url.hostname, port: Number(url.port) || 443, servername: url.hostname, timeout: 15000 }, () => {
      const c = s.getPeerCertificate(); res({ protocol: s.getProtocol(), authorized: s.authorized, authError: s.authorizationError || null, subject: c.subject && c.subject.CN, validTo: c.valid_to }); s.end()
    })
    s.on('error', rej); s.on('timeout', () => rej(new Error('tls timeout')))
  })
  if (report.network.tls && !report.network.tls.authorized) finding('fail', `TLS tidak terpercaya: ${report.network.tls.authError}`)
} catch (e) { netFail('tls', e) }
// 3) HTTP + redirect (manual, maks 5)
try {
  let u = BASE + '/', chain = []
  for (let i = 0; i < 5; i++) {
    const r = await fetch(u, { redirect: 'manual', signal: AbortSignal.timeout(20000) })
    chain.push({ url: u, status: r.status, location: r.headers.get('location'), server: r.headers.get('server'), vercelId: r.headers.get('x-vercel-id') })
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) u = new URL(r.headers.get('location'), u).href; else break
  }
  report.network.http = chain
  const last = chain.at(-1)
  if (last.status < 200 || last.status >= 300) finding('fail', `HTTP akhir ${last.status} untuk ${last.url}`)
} catch (e) { netFail('http', e) }

// 4) Server (opsional): SHA yang dilaporkan server
if (API) {
  try {
    const h = await (await fetch(API + '/api/health', { signal: AbortSignal.timeout(20000) })).json()
    report.server = { api: API, commit: h?.build?.commit ?? null, penyimpanan: h?.penyimpanan ?? null, irisan: h?.irisan ?? null }
    if (EXPECT_SHA) report.server.matchesExpected = report.server.commit === EXPECT_SHA
    if (EXPECT_SHA && report.server.commit !== EXPECT_SHA) finding('warn', `server melaporkan commit ${report.server.commit} bukan ${EXPECT_SHA}`)
  } catch (e) { finding('warn', `health server tidak terbaca: ${e.message}`) }
} else finding('info', 'SHA penyebaran frontend tidak tertanam di halaman dan PROD_API_URL tidak diberikan: SHA produksi TIDAK diverifikasi')

// Only same-origin built assets (/assets/*.css, *.js) are blocking. External fonts are
// handled separately; a third-party timeout must not be misdiagnosed as a missing Vite chunk.
// 5) Peramban
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox', '--enable-webgl', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
try {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    const v = { width, height, errors: [], failedRequests: [], assetFailures: [] }
    const ctx = await browser.newContext({ viewport: { width, height } }); const page = await ctx.newPage()
    page.on('pageerror', (e) => v.errors.push(e.message.slice(0, 300)))
    page.on('requestfailed', (r) => {
      v.failedRequests.push(`${r.url().slice(0, 120)} ${r.failure()?.errorText}`)
      const failure = productionAssetFailure({ url: r.url(), requestFailure: r.failure()?.errorText || 'request failed' }, BASE)
      if (failure) v.assetFailures.push(failure)
    })
    // The previous smoke missed missing CSS because React caught the rejection and rendered
    // a visible error page with HTTP 200. Fail also when Vercel sends index.html for CSS.
    page.on('response', (r) => {
      const failure = productionAssetFailure({ url: r.url(), status: r.status(), contentType: r.headers()['content-type'] || '' }, BASE)
      if (failure) v.assetFailures.push(failure)
    })
    const resp = await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 }).catch((e) => { v.errors.push('goto: ' + e.message); return null })
    v.status = resp?.status() ?? null; v.finalUrl = page.url()
    await page.waitForTimeout(3000)
    Object.assign(v, await page.evaluate(() => {
      const c = document.createElement('canvas')
      return {
        title: document.title,
        overflowX: document.documentElement.scrollWidth > innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        webgl2: !!c.getContext('webgl2'), webgl1: !!c.getContext('webgl'),
        textUnder105px: [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && (e.textContent || '').trim() && parseFloat(getComputedStyle(e).fontSize) < 10.5).length,
        bodyTextChars: (document.body.innerText || '').length,
        rootErrorText: Array.from(document.querySelectorAll('[role="alert"]')).map((e) => e.textContent || '').find((s) => /something went wrong/i.test(s)) || '',
      }
    }))
    await page.screenshot({ path: path.join(OUT, `home-${width}.png`), fullPage: true })

    // Halaman Body Exposure kanonik. Tanpa sesi, aplikasi menampilkan landing/login (dicatat). Dengan BODY_SESSION=1 sesi KLIEN saja (peran pasien, tanpa token)
    // disuntik ke peramban ini (opsional; pada build dev lokal rute tetap menampilkan Home, jadi hasilnya TIDAK dijamin). Tidak melewati kontrol server apa pun.
    const b = { path: '/body-exposure/canonical', sessionInjected: process.env.BODY_SESSION === '1' }
    if (b.sessionInjected) await page.addInitScript((sess) => localStorage.setItem('panaceamed.session.v1', sess), JSON.stringify({ loginAt: Date.now(), account: { email: 'qa@example.invalid', name: 'QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString() } }))
    await page.goto(BASE + b.path, { waitUntil: 'load', timeout: 60000 }).catch((e) => { v.errors.push('goto body: ' + e.message) })
    b.finalUrl = page.url()
    const canvas = page.getByTestId('canonical-body-canvas')
    b.canvasPresent = (await canvas.count()) > 0
    if (b.canvasPresent) {
      const stats = page.getByText(/loaded · \d+k triangles/)
      b.loaded = await stats.waitFor({ timeout: 90000 }).then(() => true).catch(() => false)
      if (b.loaded) {
        b.stats = (await stats.textContent()).trim()
        await canvas.scrollIntoViewIfNeeded()
        const shot = async (n) => { await page.waitForTimeout(600); const buf = await canvas.screenshot({ path: path.join(OUT, `body-${width}-${n}.png`) }); return buf.toString('base64') }
        const base = await shot('base')
        b.slicing = {}
        for (const mode of ['sagittal', 'coronal', 'axial']) {
          const radio = page.getByRole('radio', { name: mode })
          if (!(await radio.count())) { b.slicing[mode] = 'control-missing'; continue }
          await radio.click(); await page.getByLabel('Section position').fill('0.3'); const a = await shot(`${mode}-30`)
          await page.getByLabel('Section position').fill('0.7'); const c = await shot(`${mode}-70`)
          b.slicing[mode] = { changesImage: a !== base, positionChangesImage: a !== c }
        }
        const off = page.getByRole('radio', { name: 'Off' })
        if (await off.count()) { await off.click(); b.slicing.offRestoresBaseByteExact = (await shot('off')) === base }
        // peta label peninjauan: struktur terpilih harus berlabel belum ditinjau
        await page.getByLabel('Find a structure').fill('femur').catch(() => {})
        await page.getByRole('button', { name: /^femur/i }).first().click({ timeout: 8000 }).catch(() => {})
        b.reviewLabel = await page.locator('[data-review-label]').first().textContent({ timeout: 8000 }).catch(() => null)
        await page.screenshot({ path: path.join(OUT, `body-page-${width}.png`), fullPage: true })
      } else finding('warn', `body ${width}px: kanvas ada tetapi data tidak termuat dalam 90 s`)
    }
    v.body = b
    report.viewports.push(v)
    for (const message of assessPublicPage({ status: v.status, title: v.title, bodyTextChars: v.bodyTextChars, rootErrorText: v.rootErrorText, assetFailures: v.assetFailures })) finding('fail', `${width}px: ${message}`)
    if (v.errors.length) finding('fail', `${width}px: galat halaman ${v.errors.length}`)
    if (v.overflowX) finding('fail', `${width}px: scroll horizontal (scrollWidth ${v.scrollWidth})`)
    if (!v.webgl2 && !v.webgl1) finding('warn', `${width}px: WebGL tidak tersedia di runner`)
    if (!b.canvasPresent) finding('info', `${width}px: kanvas Body Exposure tidak ada di ${b.finalUrl}: halaman ini butuh sesi masuk, sehingga anatomi/slicing/label di produksi TIDAK diverifikasi tanpa sesi pemilik`)
    await ctx.close()
  }
} finally { await browser.close() }
save()
console.log(JSON.stringify({ findings: report.findings, network: report.network, viewports: report.viewports.map((v) => ({ w: v.width, status: v.status, overflowX: v.overflowX, webgl2: v.webgl2, errors: v.errors.length, body: v.body && { canvas: v.body.canvasPresent, loaded: v.body.loaded, stats: v.body.stats, slicing: v.body.slicing, reviewLabel: v.body.reviewLabel } })) }, null, 1))
process.exit(report.findings.some((f) => f.severity === 'fail') ? 1 : 0)
