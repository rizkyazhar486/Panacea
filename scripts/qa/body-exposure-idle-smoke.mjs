// Smoke browser: viewer WebGL di panel tertutup TIDAK boleh dipasang sampai pengguna membukanya.
//
// Cacat yang dijaga (diukur di build produksi, 390×844):
//  - Body Exposure memasang Body3D di <details> tertutup -> 1 konteks WebGL + ~8,3 MB GLB untuk panel tak terlihat.
//  - Frontier Health: 2 lab 3D di <details> tertutup -> 2 konteks + ~200 draw call/detik terus-menerus;
//    tanpa WebGL, membuka halaman saja menjatuhkan seluruh aplikasi ke layar galat.
//  - Viewer yang dibuang meninggalkan konteks WebGL zombi (dispose() tidak melepas konteks).
//
// Jalankan: QA_ORIGIN=http://127.0.0.1:4173 node scripts/qa/body-exposure-idle-smoke.mjs
import assert from 'node:assert/strict'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4173'
const settleMs = Number(process.env.QA_SETTLE_MS || 4000)

const WEBGL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
const NO_WEBGL_ARGS = ['--disable-3d-apis', '--disable-gpu']
const launch = (args) => chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args,
})

async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await context.addInitScript(() => {
    const account = { email: 'webgl-idle-qa@localhost.test', name: 'WebGL QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01' }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
    // Instrumentasi hanya di browser QA. Satu entri per kanvas (dedupe) agar pembacaan status tidak menghitung ganda.
    window.__gl = []
    window.__seen = new WeakSet()
    window.__draws = 0
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      const context = original.call(this, type, ...rest)
      if (context && /webgl/.test(type) && !window.__seen.has(this)) { window.__seen.add(this); window.__gl.push({ canvas: this, gl: context }) }
      return context
    }
    for (const proto of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype].filter(Boolean)) {
      for (const method of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
        const draw = proto[method]
        if (draw) proto[method] = function (...args) { window.__draws++; return draw.apply(this, args) }
      }
    }
  })
  const page = await context.newPage()
  page.setDefaultTimeout(30000)
  const errors = []
  const glb = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => { if (/\.glb(\?|$)/.test(request.url())) glb.push(request.url().split('/').pop()) })
  return { context, page, errors, glb }
}

const counts = (page) => page.evaluate(() => ({
  created: window.__gl.length,
  live: window.__gl.filter((entry) => entry.canvas.isConnected).length,
}))
const appCrashed = (page) => page.getByText('Something went wrong').first().isVisible().catch(() => false)
const draws = (page) => page.evaluate(() => window.__draws)

const webgl = await launch(WEBGL_ARGS)
try {
  // ── 1. Body Exposure: panel "Deep reference labs" tertutup tidak memasang viewer apa pun ──
  {
    const { context, page, errors, glb } = await newPage(webgl)
    await page.goto(`${origin}/#/fitness-hub?view=body-exposure`, { waitUntil: 'load' })
    await page.waitForTimeout(settleMs)
    assert.deepEqual(await counts(page), { created: 0, live: 0 }, 'Body Exposure: tanpa konteks WebGL sebelum panel labs dibuka')
    assert.deepEqual(glb, [], 'Body Exposure: tanpa unduhan GLB sebelum panel labs dibuka')
    const labs = page.locator('details.body-exposure-os__labs')
    assert.equal(await labs.getAttribute('data-on-demand'), 'idle', 'panel labs mulai idle')

    // Pasangan positif: hanya membuka panel yang menyalakan viewer.
    await labs.locator('> summary').scrollIntoViewIfNeeded()
    await labs.locator('> summary').click()
    await page.waitForFunction(() => document.querySelector('details.body-exposure-os__labs canvas'), null, { timeout: 30000 })
    assert.equal(await labs.getAttribute('data-on-demand'), 'opened')
    const opened = await counts(page)
    assert.equal(opened.live, 1, 'membuka panel labs memasang tepat satu viewer WebGL')
    await page.waitForFunction(() => window.__gl.length === 1, null, { timeout: 10000 })
    assert.ok(glb.some((name) => name === 'skeletal.glb') && glb.some((name) => name === 'muscular.glb'), 'lapisan bawaan dimuat setelah panel dibuka')

    // Tutup lalu buka lagi: state dipertahankan, tidak ada konteks baru.
    await labs.locator('> summary').click()
    await page.waitForTimeout(400)
    await labs.locator('> summary').click()
    await page.waitForTimeout(800)
    assert.deepEqual(await counts(page), { created: 1, live: 1 }, 'menutup/membuka ulang tidak membuat konteks baru')
    assert.deepEqual(errors, [], `Body Exposure: galat halaman: ${errors.join(' | ')}`)
    await context.close()
  }

  // ── 2. Frontier Health: lab 3D tertutup idle total; membuka dua lab, pindah model tidak membuat konteks baru ──
  {
    const { context, page, errors } = await newPage(webgl)
    await page.goto(`${origin}/#/frontier-health`, { waitUntil: 'load' })
    await page.waitForTimeout(settleMs)
    assert.deepEqual(await counts(page), { created: 0, live: 0 }, 'Frontier Health: tanpa konteks WebGL sebelum lab dibuka')
    const before = await draws(page)
    await page.waitForTimeout(2000)
    assert.equal(await draws(page), before, 'Frontier Health: tanpa draw call saat semua lab tertutup')

    const circuit = page.locator('summary', { hasText: /Open circuit bridge/ })
    await circuit.scrollIntoViewIfNeeded()
    await circuit.click()
    await page.waitForFunction(() => window.__gl.length === 1, null, { timeout: 30000 })
    const tabs = page.locator('[role=tab]')
    const tabCount = Math.min(await tabs.count(), 6)
    assert.ok(tabCount >= 2, 'lab sirkuit punya beberapa model untuk dipindah')
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < tabCount; i++) { await tabs.nth(i).click(); await page.waitForTimeout(150) }
    }
    assert.deepEqual(await counts(page), { created: 1, live: 1 }, `pindah model ${tabCount * 3}× tidak boleh membuat konteks WebGL baru`)

    // Terlihat -> menggambar; di luar viewport -> berhenti total.
    const canvas = page.locator('details[data-on-demand=opened] canvas').first()
    await canvas.scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    const visibleStart = await draws(page)
    await page.waitForFunction((start) => window.__draws > start, visibleStart, { timeout: 15000 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(1500)
    const awayStart = await draws(page)
    await page.waitForTimeout(2000)
    assert.equal(await draws(page), awayStart, 'lab di luar viewport tidak boleh menggambar')

    const synapse = page.locator('summary', { hasText: /Open visualization bridge/ })
    await synapse.scrollIntoViewIfNeeded()
    await synapse.click()
    await page.waitForFunction(() => window.__gl.length === 2, null, { timeout: 30000 })
    assert.equal(await appCrashed(page), false)
    assert.deepEqual(errors, [], `Frontier Health: galat halaman: ${errors.join(' | ')}`)
    await context.close()
  }

  // ── 3. Konteks zombi: viewer yang dibuang melepas konteks WebGL-nya ──
  {
    const { context, page } = await newPage(webgl)
    await page.goto(`${origin}/#/frontier-health`, { waitUntil: 'load' })
    await page.waitForTimeout(settleMs)
    const hops = 3
    for (let hop = 0; hop < hops; hop++) {
      for (const label of [/Open circuit bridge/, /Open visualization bridge/]) {
        const summary = page.locator('summary', { hasText: label })
        await summary.scrollIntoViewIfNeeded()
        if (!(await summary.evaluate((node) => node.parentElement.open))) await summary.click()
      }
      await page.waitForFunction((n) => window.__gl.filter((e) => e.canvas.isConnected).length === 2 && window.__gl.length === n, hop * 2 + 2, { timeout: 30000 })
      await page.evaluate(() => { location.hash = '#/aa-gradient' })
      await page.waitForFunction(() => window.__gl.every((e) => !e.canvas.isConnected), null, { timeout: 15000 })
      await page.evaluate(() => { location.hash = '#/frontier-health' })
      await page.waitForTimeout(800)
    }
    await page.evaluate(() => { location.hash = '#/aa-gradient' })
    await page.waitForFunction(() => window.__gl.every((e) => !e.canvas.isConnected), null, { timeout: 15000 })
    const state = await page.evaluate(() => {
      const gone = window.__gl.filter((e) => !e.canvas.isConnected)
      return { disconnected: gone.length, zombies: gone.filter((e) => !e.gl.isContextLost()).length }
    })
    assert.equal(state.disconnected, hops * 2, 'semua viewer yang dibuang terhitung')
    assert.equal(state.zombies, 0, `${state.zombies} konteks WebGL zombi tersisa setelah viewer dibuang (dispose() tidak melepas konteks)`)
    await context.close()
  }
} finally {
  await webgl.close()
}

// ── 4. Tanpa WebGL: membuka halaman tidak menjatuhkan aplikasi; viewer menampilkan catatan lokal ──
const bare = await launch(NO_WEBGL_ARGS)
try {
  const { context, page, errors } = await newPage(bare)
  assert.equal(await page.evaluate(() => !document.createElement('canvas').getContext('webgl')), true, 'harness QA harus benar-benar tanpa WebGL')
  await page.goto(`${origin}/#/frontier-health`, { waitUntil: 'load' })
  await page.waitForTimeout(settleMs)
  assert.equal(await appCrashed(page), false, 'Frontier Health tanpa WebGL: aplikasi tidak boleh jatuh ke layar galat')
  for (const label of [/Open circuit bridge/, /Open visualization bridge/]) {
    const summary = page.locator('summary', { hasText: label })
    await summary.scrollIntoViewIfNeeded()
    await summary.click()
  }
  await page.waitForFunction(() => document.querySelectorAll('[data-tanpa-webgl]').length === 2, null, { timeout: 15000 })
  assert.equal(await appCrashed(page), false)

  await page.goto(`${origin}/#/fitness-hub?view=body-exposure`, { waitUntil: 'load' })
  await page.waitForTimeout(settleMs)
  assert.equal(await appCrashed(page), false, 'Body Exposure tanpa WebGL: aplikasi tidak boleh jatuh ke layar galat')
  assert.deepEqual(errors, [], `tanpa WebGL: galat halaman: ${errors.join(' | ')}`)
  await context.close()
} finally {
  await bare.close()
}

console.log('body-exposure-idle-smoke: viewer WebGL di panel tertutup tidak dipasang, loop berhenti di luar viewport, konteks dilepas, dan tanpa WebGL aplikasi tetap hidup')
