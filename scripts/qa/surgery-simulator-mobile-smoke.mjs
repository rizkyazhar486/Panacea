import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.SURGERY_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const screenshotPath = process.env.SURGERY_QA_SCREENSHOT || 'artifacts/surgery-simulator-390x844.png'
const metricsPath = process.env.SURGERY_QA_METRICS || 'artifacts/surgery-simulator-metrics.json'

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
await context.addInitScript(() => {
  const account = { email: 'surgery-qa@localhost.test', name: 'Surgery QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'P', dob: '1990-01-01' }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  window.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style')
    style.textContent = 'html, body { overflow-anchor: none !important; scroll-behavior: auto !important; }'
    document.documentElement?.appendChild(style)
  }, { once: true })
})

const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

async function dismissIfVisible(locator) {
  if (!(await locator.isVisible().catch(() => false))) return false
  // Optional onboarding/reminder overlays can be visually ready while
  // Playwright's locator.click() still waits indefinitely on actionability.
  // Reuse the same bounded real browser hit-target path as the simulator
  // controls: no force:true and no DOM .click().
  await tapScrolled(locator)
  await page.waitForTimeout(180)
  return true
}
async function captureViewport() {
  const cdp = await context.newCDPSession(page)
  try {
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false })
    await writeFile(screenshotPath, Buffer.from(shot.data, 'base64'))
  } finally {
    await cdp.detach()
  }
}
async function waitForClass(locator, token, timeout = 10_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const className = await locator.getAttribute('class').catch(() => '')
    if ((className || '').includes(token)) return className
    await page.waitForTimeout(80)
  }
  throw new Error(`Timed out waiting for class token "${token}" on ${await locator.innerText().catch(() => 'locator')}`)
}
async function waitForAttribute(locator, name, expected, timeout = 10_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const value = await locator.getAttribute(name).catch(() => null)
    if (value === expected) return value
    await page.waitForTimeout(80)
  }
  throw new Error(`Timed out waiting for ${name}="${expected}" on ${await locator.innerText().catch(() => 'locator')}`)
}
async function waitForInputValue(locator, expected, tolerance = 0.005, timeout = 10_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const raw = await locator.inputValue().catch(() => '')
    const value = Number(raw)
    if (Number.isFinite(value) && Math.abs(value - expected) <= tolerance) return value
    await page.waitForTimeout(80)
  }
  throw new Error(`Timed out waiting for input value ${expected}`)
}
async function tapScrolled(locator) {
  // Responsive/transitioning UI can leave more than one matching target mounted.
  // Prefer a candidate that is genuinely inside the visual viewport and owns its
  // browser hit target. If none is hittable yet, native scrollIntoView on the
  // nearest candidate scrolls ancestor scrollers before the next bounded attempt.
  // No force:true or DOM .click() is used.
  let lastCandidates = []
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidates = await locator.evaluateAll((nodes) => {
      const visualTop = window.visualViewport?.offsetTop ?? 0
      const visualLeft = window.visualViewport?.offsetLeft ?? 0
      const visualWidth = window.visualViewport?.width ?? window.innerWidth
      const visualHeight = window.visualViewport?.height ?? window.innerHeight
      const viewportCenterX = visualLeft + visualWidth / 2
      const viewportCenterY = visualTop + visualHeight / 2
      return nodes.map((node, index) => {
        const rect = node.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        const target = document.elementFromPoint(x, y)
        const visible = rect.width > 0 && rect.height > 0
          && x >= visualLeft && x <= visualLeft + visualWidth
          && y >= visualTop && y <= visualTop + visualHeight
        const enabled = !(node instanceof HTMLButtonElement) || !node.disabled
        const hitTarget = target === node || node.contains(target)
        return {
          index,
          x,
          y,
          width: rect.width,
          height: rect.height,
          visible,
          enabled,
          hitTarget,
          distance: Math.hypot(x - viewportCenterX, y - viewportCenterY),
          hitTag: target?.tagName ?? null,
          hitText: target?.textContent?.trim().slice(0, 80) ?? null,
          pageScrollY: window.scrollY,
        }
      })
    })
    lastCandidates = candidates

    const hittable = candidates.find((candidate) => candidate.visible && candidate.enabled && candidate.hitTarget)
    if (hittable) {
      await page.mouse.click(hittable.x, hittable.y, { delay: 20 })
      return
    }

    const nearest = candidates
      .filter((candidate) => candidate.enabled && candidate.width > 0 && candidate.height > 0)
      .sort((a, b) => a.distance - b.distance)[0]
    if (!nearest) break

    await locator.nth(nearest.index).evaluate((node) => {
      node.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' })
    })
    await page.waitForTimeout(220)
  }
  throw new Error(`Target is not a valid browser hit target after nested native scrolling: ${JSON.stringify(lastCandidates)}`)
}
async function scrollNative(locator) {
  // Playwright scrollIntoViewIfNeeded waits for layout stability. The surgical
  // atlas and shared Body3D are continuously rendered, so that actionability
  // condition can remain false even when the target is already visible.
  await locator.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' }))
  await page.waitForTimeout(140)
}
async function tapProcedureStep(scope, label) {
  // Target the actual StepList button, not its text span. A text-span pointer
  // can be a valid hit target yet still be replaced during responsive reflow
  // before React processes the click. aria-current is the stable state contract.
  const button = scope.locator('button').filter({ hasText: label }).first()
  await tapScrolled(button)
  await waitForAttribute(button, 'aria-current', 'step')
  return button
}
async function dismissBodyExplorerOverlays() {
  await dismissIfVisible(page.getByRole('button', { name: /Get Started/i }).first())
  await dismissIfVisible(page.getByRole('button', { name: /Maybe later/i }).first())

  const reminderText = page.getByText(/TODAY.?S REMINDER/i).first()
  if (await reminderText.isVisible().catch(() => false)) {
    const reminder = reminderText.locator('xpath=ancestor::*[.//button][1]')
    const close = reminder.locator('button').last()
    await dismissIfVisible(close)
  }
}
async function enterSurgerySimulator({ allowRouteReset = false } = {}) {
  const openFromCurrentRoute = async () => {
    const surgeryTab = page.getByRole('button', { name: 'Surgical layers', exact: true })
    await tapScrolled(surgeryTab)
    // A coordinate click is not enough evidence that React accepted the tab
    // transition. The active-class is the existing product state contract.
    await waitForClass(surgeryTab, 'bg-white', 10_000)
    const simulatorRoot = page.locator('[data-surgery-simulator="anatomy-grounded"]')
    await simulatorRoot.waitFor({ state: 'visible', timeout: 30_000 })
    await scrollNative(simulatorRoot)
    return simulatorRoot
  }

  try {
    return await openFromCurrentRoute()
  } catch (firstError) {
    if (!allowRouteReset) throw firstError

    // One bounded fresh-route retry isolates lazy-panel/re-entry state without
    // weakening any anatomy, WebGL, provenance, or publication assertion.
    // It still uses the same real tab hit target and verifies the active state.
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    if (response && !response.ok()) throw new Error(`Body Explorer retry returned HTTP ${response.status()}`, { cause: firstError })
    await dismissBodyExplorerOverlays()
    await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 120_000 })
    return openFromCurrentRoute()
  }
}

const metrics = {
  viewport: null,
  caesareanLoaded: false,
  bladderUterusStep: false,
  axialSharedBody3d: false,
  coronalSharedBody3d: false,
  sagittalSharedBody3d: false,
  explodedSharedBody3d: false,
  caesareanSlicePos: null,
  explodedUnfold: null,
  transseptalLoaded: false,
  transseptalAxialSharedBody3d: false,
  transseptalSlicePos: null,
  iceLongAxisVisible: false,
  lapAppyLoaded: false,
  lapAppyVariationVisible: false,
  academicGateVisible: false,
  webgl: false,
  renderDpr: null,
  sharedBodyWebgl: false,
  sharedBodyRenderDpr: null,
  overflow: null,
  pageErrors,
}

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`Body Explorer returned HTTP ${response.status()}`)
  await dismissBodyExplorerOverlays()

  const sharedBodyCanvas = page.locator('canvas').first()
  await sharedBodyCanvas.waitFor({ state: 'visible', timeout: 120_000 })

  let simulator = await enterSurgerySimulator()

  const caesareanScenario = simulator.getByRole('button', { name: 'Caesarean', exact: true })
  await tapScrolled(caesareanScenario)
  await simulator.getByText('Caesarean section — layered pelvic anatomy', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })
  let atlasCanvas = simulator.locator('canvas[data-atlas-viewer3d="true"]').first()
  await atlasCanvas.waitFor({ state: 'visible', timeout: 60_000 })
  await simulator.getByText(/Loading anatomy/i).waitFor({ state: 'hidden', timeout: 120_000 }).catch(() => undefined)
  let loadFailure = simulator.getByText(/Could not load this anatomical model|could not start 3D graphics|dropped the 3D context/i).first()
  if (await loadFailure.isVisible().catch(() => false)) throw new Error(`Caesarean atlas failure: ${await loadFailure.innerText()}`)
  metrics.caesareanLoaded = true

  await tapProcedureStep(simulator, 'Bladder–uterus relationship')
  await simulator.getByText(/urinary bladder/i).first().waitFor({ state: 'visible', timeout: 10_000 })
  metrics.bladderUterusStep = true

  const correlation = simulator.locator('[data-surgery-correlation="shared-body3d"]')
  await correlation.waitFor({ state: 'visible', timeout: 10_000 })
  const axialPreset = correlation.getByRole('button', { name: 'Axial CT', exact: true })
  const coronalPreset = correlation.getByRole('button', { name: 'Coronal CT', exact: true })
  const sagittalPreset = correlation.getByRole('button', { name: 'Sagittal CT', exact: true })
  const explodedPreset = correlation.getByRole('button', { name: 'Exploded 3D', exact: true })

  await tapScrolled(axialPreset)
  await waitForClass(page.getByRole('button', { name: 'CT', exact: true }).first(), 'bg-white')
  await waitForClass(page.getByRole('button', { name: 'Axial', exact: true }).first(), 'bg-brand')
  const sliceLevel = page.getByRole('slider', { name: 'Slice level', exact: true })
  metrics.caesareanSlicePos = await waitForInputValue(sliceLevel, 0.52)
  metrics.axialSharedBody3d = true

  await tapScrolled(coronalPreset)
  await waitForClass(page.getByRole('button', { name: 'Coronal', exact: true }).first(), 'bg-brand')
  await waitForInputValue(sliceLevel, 0.5)
  metrics.coronalSharedBody3d = true

  await tapScrolled(sagittalPreset)
  await waitForClass(page.getByRole('button', { name: 'Sagittal', exact: true }).first(), 'bg-brand')
  await waitForInputValue(sliceLevel, 0.5)
  metrics.sagittalSharedBody3d = true

  await tapScrolled(explodedPreset)
  await waitForClass(page.getByRole('button', { name: 'Anatomy', exact: true }).first(), 'bg-white')
  metrics.explodedSharedBody3d = true

  const layersButton = page.getByRole('button', { name: 'Layers', exact: true })
  await tapScrolled(layersButton)
  const unfoldSlider = page.getByRole('slider', { name: 'Unfold', exact: true })
  metrics.explodedUnfold = await waitForInputValue(unfoldSlider, 0.28)

  simulator = await enterSurgerySimulator({ allowRouteReset: true })
  atlasCanvas = simulator.locator('canvas[data-atlas-viewer3d="true"]').first()
  await atlasCanvas.waitFor({ state: 'visible', timeout: 60_000 })
  loadFailure = simulator.getByText(/Could not load this anatomical model|could not start 3D graphics|dropped the 3D context/i).first()

  const transseptalScenario = simulator.getByRole('button', { name: 'Transseptal + ICE', exact: true })
  await tapScrolled(transseptalScenario)
  await simulator.getByText('Transseptal puncture — 3D anatomy + ICE orientation', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })
  await atlasCanvas.waitFor({ state: 'visible', timeout: 60_000 })
  await page.waitForTimeout(700)
  if (await loadFailure.isVisible().catch(() => false)) throw new Error(`Transseptal atlas failure: ${await loadFailure.innerText()}`)
  metrics.transseptalLoaded = true

  const transseptalCorrelation = simulator.locator('[data-surgery-correlation="shared-body3d"]')
  const transseptalAxial = transseptalCorrelation.getByRole('button', { name: 'Axial CT', exact: true })
  await tapScrolled(transseptalAxial)
  await waitForClass(page.getByRole('button', { name: 'CT', exact: true }).first(), 'bg-white')
  await waitForClass(page.getByRole('button', { name: 'Axial', exact: true }).first(), 'bg-brand')
  metrics.transseptalSlicePos = await waitForInputValue(page.getByRole('slider', { name: 'Slice level', exact: true }), 0.72)
  metrics.transseptalAxialSharedBody3d = true

  await tapProcedureStep(simulator, 'ICE long-axis orientation')
  await simulator.getByText('ICE guidance', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
  await simulator.getByText('orientation, not diagnosis', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
  metrics.iceLongAxisVisible = true

  const lapAppyScenario = simulator.getByRole('button', { name: 'DIYAI Lap Appy', exact: true })
  await tapScrolled(lapAppyScenario)
  await simulator.getByText('DIYAI · Laparoscopic appendectomy anatomy simulation', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })
  await atlasCanvas.waitFor({ state: 'visible', timeout: 60_000 })
  await page.waitForTimeout(700)
  if (await loadFailure.isVisible().catch(() => false)) throw new Error(`DIYAI Lap Appy atlas failure: ${await loadFailure.innerText()}`)
  metrics.lapAppyLoaded = true

  await tapProcedureStep(simulator, 'Position variation check')
  await simulator.getByText(/retrocecal, pelvic, retro-ileal, pre-ileal/i).waitFor({ state: 'visible', timeout: 10_000 })
  metrics.lapAppyVariationVisible = true

  await simulator.getByText('Human review pending', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
  await simulator.getByText(/not academically reviewed/i).waitFor({ state: 'visible', timeout: 10_000 })
  metrics.academicGateVisible = true

  await scrollNative(atlasCanvas)
  const canvasMetrics = await atlasCanvas.evaluate((node) => {
    const gl = node.getContext('webgl2') || node.getContext('webgl')
    return { webgl: Boolean(gl), clientWidth: node.clientWidth, backingWidth: node.width }
  })
  metrics.webgl = canvasMetrics.webgl
  metrics.renderDpr = canvasMetrics.backingWidth / Math.max(1, canvasMetrics.clientWidth)

  const sharedCanvasMetrics = await sharedBodyCanvas.evaluate((node) => {
    const gl = node.getContext('webgl2') || node.getContext('webgl')
    return { webgl: Boolean(gl), clientWidth: node.clientWidth, backingWidth: node.width }
  })
  metrics.sharedBodyWebgl = sharedCanvasMetrics.webgl
  metrics.sharedBodyRenderDpr = sharedCanvasMetrics.backingWidth / Math.max(1, sharedCanvasMetrics.clientWidth)

  metrics.viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio }))
  metrics.overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)

  if (!metrics.webgl) throw new Error('Surgical atlas canvas has no WebGL context')
  if (!metrics.sharedBodyWebgl) throw new Error('Shared Body3D canvas has no WebGL context')
  if (metrics.viewport.width !== 390 || metrics.viewport.height !== 844) throw new Error(`Unexpected viewport ${metrics.viewport.width}x${metrics.viewport.height}`)
  if (metrics.renderDpr < 1 || metrics.renderDpr > 1.51) throw new Error(`Unsafe surgical atlas mobile DPR ${metrics.renderDpr.toFixed(3)}`)
  if (metrics.sharedBodyRenderDpr < 1 || metrics.sharedBodyRenderDpr > 1.51) throw new Error(`Unsafe shared Body3D mobile DPR ${metrics.sharedBodyRenderDpr.toFixed(3)}`)
  if (metrics.overflow > 2) throw new Error(`Surgical simulator overflows mobile viewport by ${metrics.overflow}px`)
  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  await scrollNative(simulator)
  await captureViewport()
  await writeFile(metricsPath, JSON.stringify(metrics, null, 2))
  console.log(JSON.stringify(metrics, null, 2))
} catch (error) {
  await writeFile(metricsPath, JSON.stringify({ ...metrics, failure: String(error?.stack || error) }, null, 2))
  await captureViewport().catch(() => undefined)
  throw error
} finally {
  await browser.close()
}