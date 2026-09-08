import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.BODY3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const metricsPath = process.env.BODY3D_QA_METRICS || 'artifacts/body3d-mobile-metrics.json'
await mkdir('artifacts', { recursive: true })

const browser = await chromium.launch({ headless: true, args: [
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl',
  '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
] })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })

await context.addInitScript(() => {
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: {
    email: 'body3d-qa@localhost.test', name: 'Body3D QA', role: 'pasien', isSubscriber: false,
    loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01',
  }, loginAt: Date.now() }))

  const t = { draws: 0, matrices: 0, hash: 2166136261 >>> 0 }
  Object.defineProperty(window, '__body3dQaTelemetry', { value: t })
  const mix = (v) => {
    const n = Number.isFinite(v) ? Math.round(v * 1e6) : 0
    t.hash ^= n >>> 0
    t.hash = Math.imul(t.hash, 16777619) >>> 0
  }
  for (const Proto of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!Proto?.prototype) continue
    for (const name of ['drawArrays', 'drawElements']) {
      const original = Proto.prototype[name]
      if (typeof original === 'function') Proto.prototype[name] = function (...args) { t.draws += 1; return original.apply(this, args) }
    }
    const matrix = Proto.prototype.uniformMatrix4fv
    if (typeof matrix === 'function') Proto.prototype.uniformMatrix4fv = function (loc, transpose, value) {
      t.matrices += 1
      for (let i = 0; i < Math.min(16, value?.length || 0); i += 1) mix(Number(value[i]))
      return matrix.call(this, loc, transpose, value)
    }
  }
})

const page = await context.newPage()
page.setDefaultTimeout(20_000)
await page.route('**/anatomy/cardio' + 'vascular.glb', async (route) => { await new Promise((r) => setTimeout(r, 4_000)); await route.continue() })
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

const snap = () => page.evaluate(() => {
  const t = window.__body3dQaTelemetry
  return { draws: t?.draws || 0, matrices: t?.matrices || 0, hash: ((t?.hash || 0) >>> 0).toString(16).padStart(8, '0') }
})
const changed = (a, b) => b.draws > a.draws && b.matrices > a.matrices && b.hash !== a.hash
let metrics = null
let failure = null

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`HTTP ${response.status()}`)
  for (const re of [/Get Started/i, /Maybe later/i]) {
    const b = page.getByRole('button', { name: re }).first()
    if (await b.isVisible().catch(() => false)) await b.click()
  }

  const viewer = page.locator('div.h-full.w-full.touch-none').first()
  const canvas = viewer.locator('> canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 45_000 })
  await canvas.scrollIntoViewIfNeeded()
  const initialLoading = page.getByText('Loading anatomy…').first()
  const progressive = page.getByText('Adding anatomy layer…').first()
  await initialLoading.waitFor({ state: 'hidden', timeout: 120_000 })
  await progressive.waitFor({ state: 'hidden', timeout: 120_000 })

  const fatal = page.getByText(/This device could not start 3D graphics|The browser dropped the 3D context/i)
  if (await fatal.count()) throw new Error(`3D fatal fallback visible: ${await fatal.first().innerText()}`)
  const failedLayer = page.getByText(/Couldn.t load:/i).first()
  if (await failedLayer.isVisible().catch(() => false)) throw new Error(`anatomy layer failed: ${await failedLayer.innerText()}`)

  metrics = await canvas.evaluate((node) => {
    const r = node.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return { viewport: [innerWidth, innerHeight], client: [node.clientWidth, node.clientHeight], backing: [node.width, node.height],
      webgl: Boolean(node.getContext('webgl2') || node.getContext('webgl')), scrollWidth: document.documentElement.scrollWidth,
      centerClear: hit === node }
  })
  if (!metrics.webgl) throw new Error('WebGL context unavailable')
  if (!metrics.centerClear) throw new Error('viewer center obstructed')
  if (metrics.viewport[0] !== 390 || metrics.viewport[1] !== 844) throw new Error(`unexpected viewport ${metrics.viewport.join('x')}`)
  if (metrics.client[0] < 300 || metrics.client[1] < 480) throw new Error(`canvas too small ${metrics.client.join('x')}`)
  metrics.renderDpr = metrics.backing[0] / Math.max(1, metrics.client[0])
  if (metrics.renderDpr < 1 || metrics.renderDpr > 1.51) throw new Error(`unsafe DPR ${metrics.renderDpr}`)
  if (metrics.scrollWidth > 392) throw new Error(`horizontal overflow ${metrics.scrollWidth}`)

  metrics.initialRender = await snap()
  if (metrics.initialRender.draws < 1 || metrics.initialRender.matrices < 1) throw new Error('no WebGL draw/matrix activity')

  await page.getByRole('button', { name: 'Vessels', exact: true }).first().click()
  await progressive.waitFor({ state: 'visible', timeout: 5_000 })
  // Clicking a layer control may scroll that control into view. Re-center the
  // actual viewer before testing banner geometry or orbit interaction so the
  // smoke test never sends pointer input to off-screen coordinates.
  await canvas.scrollIntoViewIfNeeded()
  await page.waitForTimeout(100)
  const cls = await progressive.evaluate((n) => n.closest('[role="status"]')?.getAttribute('class') || '')
  metrics.progressiveCompact = cls.includes('top-2') && !cls.includes('inset-0')
  metrics.progressiveGeometry = await progressive.evaluate((node) => {
    const status = node.closest('[role="status"]')
    const canvas = document.querySelector('div.h-full.w-full.touch-none > canvas')
    if (!status || !canvas) return { statusFound: Boolean(status), canvasFound: Boolean(canvas), coversCenter: true, pointerEvents: null, centerHitCanvas: false }
    const sr = status.getBoundingClientRect()
    const cr = canvas.getBoundingClientRect()
    const centerX = cr.left + cr.width / 2
    const centerY = cr.top + cr.height / 2
    const coversCenter = centerX >= sr.left && centerX <= sr.right && centerY >= sr.top && centerY <= sr.bottom
    const hit = document.elementFromPoint(centerX, centerY)
    return {
      statusFound: true,
      canvasFound: true,
      coversCenter,
      pointerEvents: getComputedStyle(status).pointerEvents,
      centerHitCanvas: hit === canvas,
      canvasCenter: [centerX, centerY],
      statusRect: [sr.left, sr.top, sr.right, sr.bottom],
    }
  })
  metrics.progressiveCenterClear = !metrics.progressiveGeometry.coversCenter && metrics.progressiveGeometry.centerHitCanvas
  if (!metrics.progressiveCompact || !metrics.progressiveCenterClear) throw new Error(`progressive loading blocks or covers viewer: ${JSON.stringify(metrics.progressiveGeometry)}`)
  await progressive.waitFor({ state: 'hidden', timeout: 120_000 })

  await canvas.scrollIntoViewIfNeeded()
  await page.waitForTimeout(100)
  const box = await canvas.boundingBox()
  if (!box) throw new Error('canvas has no bounding box')
  const beforeOrbit = await snap(), x = box.x + box.width * .5, y = box.y + box.height * .45
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + Math.min(48, box.width * .15), y + 18, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(500)
  const afterOrbit = await snap()
  metrics.orbit = { before: beforeOrbit, after: afterOrbit, changed: changed(beforeOrbit, afterOrbit) }
  if (!metrics.orbit.changed) throw new Error('orbit did not trigger changed WebGL transforms')

  await page.getByRole('button', { name: 'Whole-body precision', exact: true }).click()
  await page.getByText('Panacea · Whole-body precision atlas', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })
  await page.getByRole('button', { name: 'Movement biomechanics', exact: true }).click()
  const title = page.getByText('Whole-body motion inspector', { exact: true })
  await title.waitFor({ state: 'visible', timeout: 20_000 })
  const inspector = title.locator('xpath=ancestor::div[contains(@class,"rounded-3xl")][1]')
  await canvas.scrollIntoViewIfNeeded(); await page.waitForTimeout(300)
  const beforeKnee = await snap(); await inspector.getByRole('button', { name: 'Knee', exact: true }).click(); await page.waitForTimeout(700); const afterKnee = await snap()
  metrics.knee = { before: beforeKnee, after: afterKnee, changed: changed(beforeKnee, afterKnee) }
  if (!metrics.knee.changed) throw new Error('Knee selection did not update shared Body3D render')

  const slider = inspector.locator('input[type="range"]').first()
  const bounds = await slider.evaluate((n) => [Number(n.min), Number(n.max)])
  const target = Math.round(bounds[0] + (bounds[1] - bounds[0]) * .65)
  await slider.evaluate((n, v) => { n.value = String(v); n.dispatchEvent(new Event('input', { bubbles: true })); n.dispatchEvent(new Event('change', { bubbles: true })) }, target)
  if (Number(await slider.inputValue()) !== target) throw new Error('ROM slider did not update')
  if (!(await inspector.getByText(/does not warp anatomy or fabricate patient-specific force/i).isVisible().catch(() => false))) throw new Error('scientific boundary missing')
  await inspector.getByRole('button', { name: /Inspect this motion in shared 3D/i }).click()
  if (await page.evaluate(() => document.documentElement.scrollWidth) > 392) throw new Error('motion inspector horizontal overflow')
  if (pageErrors.length) throw new Error(`page errors: ${pageErrors.join(' | ')}`)
  console.log(JSON.stringify({ ok: true, ...metrics }))
} catch (e) {
  failure = e instanceof Error ? e.message : String(e)
  throw e
} finally {
  await writeFile(metricsPath, `${JSON.stringify({ ok: !failure, failure, pageErrors, metrics }, null, 2)}\n`)
  await context.close().catch(() => undefined)
  await browser.close().catch(() => undefined)
}
