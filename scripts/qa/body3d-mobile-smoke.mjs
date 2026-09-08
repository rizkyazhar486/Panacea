import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.BODY3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const screenshotPath = process.env.BODY3D_QA_SCREENSHOT || 'artifacts/body3d-mobile-390x844.png'
const motionScreenshotPath = process.env.BODY3D_QA_MOTION_SCREENSHOT || 'artifacts/body3d-mobile-motion-390x844.png'
const metricsPath = process.env.BODY3D_QA_METRICS || 'artifacts/body3d-mobile-metrics.json'
const operationTimeoutMs = Number(process.env.BODY3D_QA_OPERATION_TIMEOUT_MS || 20_000)
const screenshotTimeoutMs = Number(process.env.BODY3D_QA_SCREENSHOT_TIMEOUT_MS || 45_000)

await mkdir('artifacts', { recursive: true })

function withTimeout(promise, label, timeoutMs = operationTimeoutMs) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    }),
  ]).finally(() => clearTimeout(timer))
}

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
})

await context.addInitScript(() => {
  const account = {
    email: 'body3d-qa@localhost.test',
    name: 'Body3D QA',
    role: 'pasien',
    isSubscriber: false,
    loggedAt: new Date().toISOString(),
    sex: 'L',
    dob: '1990-01-01',
  }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
})

const page = await context.newPage()
page.setDefaultTimeout(20_000)
await page.route('**/anatomy/cardio' + 'vascular.glb', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 4_000))
  await route.continue()
})
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

let metrics = null
let failure = null
let screenshotCaptured = false
let motionScreenshotCaptured = false
let screenshotError = null

async function capturePng() {
  const cdp = await context.newCDPSession(page)
  try {
    const shot = await withTimeout(
      cdp.send('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: false,
      }),
      'Body3D compositor screenshot',
      screenshotTimeoutMs,
    )
    return Buffer.from(shot.data, 'base64')
  } finally {
    await withTimeout(cdp.detach(), 'Body3D CDP detach', 5_000).catch(() => undefined)
  }
}

async function captureViewport() {
  await writeFile(screenshotPath, await capturePng())
  screenshotCaptured = true
}

async function captureMotionViewport() {
  await writeFile(motionScreenshotPath, await capturePng())
  motionScreenshotCaptured = true
}

async function dismissIfVisible(locator, timeout = 5_000) {
  if (!(await locator.isVisible().catch(() => false))) return false
  await locator.click()
  await locator.waitFor({ state: 'hidden', timeout }).catch(() => undefined)
  return true
}

async function assertCanvasHealthy(canvas, label) {
  await canvas.waitFor({ state: 'visible', timeout: 10_000 })
  const healthy = await canvas.evaluate((node) => {
    const gl = node.getContext('webgl2') || node.getContext('webgl')
    const rect = node.getBoundingClientRect()
    return Boolean(gl && rect.width > 0 && rect.height > 0)
  })
  if (!healthy) throw new Error(`${label}: Body3D canvas lost its visible WebGL surface`)
  if (pageErrors.length) throw new Error(`${label}: browser page errors: ${pageErrors.join(' | ')}`)
}

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`Body Explorer returned HTTP ${response.status()}`)

  await dismissIfVisible(page.getByRole('button', { name: /Get Started/i }).first())
  await dismissIfVisible(page.getByRole('button', { name: /Maybe later/i }).first())

  const reminderText = page.getByText(/TODAY.?S REMINDER/i).first()
  if (await reminderText.isVisible().catch(() => false)) {
    const reminder = reminderText.locator('xpath=ancestor::*[.//button][1]')
    const close = reminder.locator('button').last()
    if (await close.isVisible().catch(() => false)) await close.click()
  }

  const viewer = page.locator('div.h-full.w-full.touch-none').first()
  const canvas = viewer.locator('> canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 45_000 })
  await canvas.scrollIntoViewIfNeeded()

  await page.waitForTimeout(1_500)
  const initialLoading = page.getByText('Loading anatomy…').first()
  const progressiveLoading = page.getByText('Adding anatomy layer…').first()
  await initialLoading.waitFor({ state: 'hidden', timeout: 120_000 })
  await progressiveLoading.waitFor({ state: 'hidden', timeout: 120_000 })

  const fatal = page.getByText(/This device could not start 3D graphics|The browser dropped the 3D context/i)
  if (await fatal.count()) throw new Error(`Body3D fatal fallback is visible: ${await fatal.first().innerText()}`)
  const layerFailure = page.getByText(/Couldn.t load:/i).first()
  if (await layerFailure.isVisible().catch(() => false)) {
    throw new Error(`Body3D anatomy layer failed to load: ${await layerFailure.innerText()}`)
  }

  metrics = await canvas.evaluate((node) => {
    const c = node
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    const rect = c.getBoundingClientRect()
    const center = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
      canvas: {
        clientWidth: c.clientWidth,
        clientHeight: c.clientHeight,
        backingWidth: c.width,
        backingHeight: c.height,
      },
      webgl: Boolean(gl),
      documentScrollWidth: document.documentElement.scrollWidth,
      canvasCount: document.querySelectorAll('canvas').length,
      route: window.location.hash,
      canvasCenterUnobstructed: center === c,
    }
  })

  if (!metrics.webgl) throw new Error('Body3D renderer canvas did not expose its WebGL context')
  if (!metrics.canvasCenterUnobstructed) throw new Error('Body3D canvas center is obstructed by another UI layer')
  if (metrics.viewport.width !== 390 || metrics.viewport.height !== 844) {
    throw new Error(`Unexpected viewport ${metrics.viewport.width}x${metrics.viewport.height}`)
  }
  if (metrics.canvas.clientWidth < 300 || metrics.canvas.clientHeight < 480) {
    throw new Error(`Body3D canvas is too small on mobile: ${metrics.canvas.clientWidth}x${metrics.canvas.clientHeight}`)
  }
  const renderDpr = metrics.canvas.backingWidth / Math.max(1, metrics.canvas.clientWidth)
  metrics.renderDpr = renderDpr
  if (renderDpr < 1 || renderDpr > 1.51) {
    throw new Error(`Mobile Body3D backing-store ratio ${renderDpr.toFixed(3)} is outside the safe 1.0–1.5 range`)
  }
  if (metrics.documentScrollWidth > metrics.viewport.width + 2) {
    throw new Error(`Page overflows horizontally: ${metrics.documentScrollWidth}px > ${metrics.viewport.width}px`)
  }

  const vessels = page.getByRole('button', { name: 'Vessels', exact: true }).first()
  await vessels.click()
  await progressiveLoading.waitFor({ state: 'visible', timeout: 5_000 })
  const progressiveClass = await progressiveLoading.evaluate((node) =>
    node.closest('[role="status"]')?.getAttribute('class') ?? '',
  )
  metrics.progressiveLoadingCompact = Boolean(
    progressiveClass.includes('top-2') && !progressiveClass.includes('inset-0'),
  )
  await canvas.scrollIntoViewIfNeeded()
  await page.waitForTimeout(100)
  metrics.progressiveLoadingCenterUnobstructed = await canvas.evaluate((node) => {
    const rect = node.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) return false
    const hit = document.elementFromPoint(x, y)
    const viewerNode = node.parentElement
    return Boolean(hit && viewerNode && (hit === node || hit === viewerNode || viewerNode.contains(hit)))
  })
  if (!metrics.progressiveLoadingCompact) {
    throw new Error(`Additional layer loading is not compact: ${progressiveClass || 'no class'}`)
  }
  if (!metrics.progressiveLoadingCenterUnobstructed) {
    throw new Error('Additional layer loading obstructed the Body3D viewer center')
  }
  await progressiveLoading.waitFor({ state: 'hidden', timeout: 120_000 })

  // Exercise the real orbit input path without forcing repeated GPU compositor
  // readbacks. Software WebGL can block Page.captureScreenshot even while the
  // renderer remains healthy; the visual evidence is captured once below.
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Body3D canvas has no measurable bounding box')
  const x = box.x + box.width * 0.5
  const y = box.y + box.height * 0.45
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + Math.min(48, box.width * 0.15), y + 18, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  await assertCanvasHealthy(canvas, 'Orbit drag')
  metrics.orbitInteractionCompleted = true

  await captureViewport()
  if (!screenshotCaptured) throw new Error('Body3D mobile visual evidence was not captured')

  const precisionTab = page.getByRole('button', { name: 'Whole-body precision', exact: true })
  await precisionTab.click()
  await page.getByText('Panacea · Whole-body precision atlas', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })

  const movementTab = page.getByRole('button', { name: 'Movement biomechanics', exact: true })
  await movementTab.click()
  const inspectorTitle = page.getByText('Whole-body motion inspector', { exact: true })
  await inspectorTitle.waitFor({ state: 'visible', timeout: 20_000 })
  const inspector = inspectorTitle.locator('xpath=ancestor::div[contains(@class,"rounded-3xl")][1]')

  const kneeButton = inspector.getByRole('button', { name: 'Knee', exact: true })
  await kneeButton.click()
  await page.waitForTimeout(350)
  const kneePressed = await kneeButton.getAttribute('aria-pressed')
  if (kneePressed !== 'true') throw new Error('Selecting the Knee profile did not update inspector selection state')
  await canvas.scrollIntoViewIfNeeded()
  await assertCanvasHealthy(canvas, 'Knee profile selection')
  metrics.wholeBodyMotion = {
    precisionOpened: true,
    kneeSelected: true,
    jointSelectionAppliedToHealthyViewer: true,
  }

  await inspector.scrollIntoViewIfNeeded()
  const slider = inspector.locator('input[type="range"]').first()
  const sliderState = await slider.evaluate((node) => ({
    min: Number(node.min),
    max: Number(node.max),
    step: Number(node.step) || 1,
    neutral: Number(node.value),
  }))
  const rawTarget = sliderState.neutral + (sliderState.max - sliderState.neutral) * 0.65
  const targetAngle = sliderState.min + Math.round((rawTarget - sliderState.min) / sliderState.step) * sliderState.step

  // Use real browser keyboard interaction so React's controlled input receives
  // the same change path as a user instead of a DOM-only value mutation.
  await slider.focus()
  await slider.press('Home')
  const stepCount = Math.round((targetAngle - sliderState.min) / sliderState.step)
  for (let i = 0; i < stepCount; i++) await slider.press('ArrowRight')

  const renderedAngleLabel = inspector.getByText(`Flexion / extension · ${targetAngle.toFixed(0)}°`, { exact: true })
  await renderedAngleLabel.waitFor({ state: 'visible', timeout: 5_000 })
  const observedAngle = Number(await slider.inputValue())
  metrics.wholeBodyMotion.sliderTargetDeg = targetAngle
  metrics.wholeBodyMotion.sliderObservedDeg = observedAngle
  if (observedAngle <= sliderState.neutral + 20) {
    throw new Error(`Whole-body ROM slider did not move meaningfully from neutral: saw ${observedAngle}°`)
  }
  if (observedAngle !== targetAngle) {
    throw new Error(`Whole-body ROM slider keyboard interaction expected ${targetAngle}°: saw ${observedAngle}°`)
  }

  const dialMotionLabel = inspector.getByText(`Flexion ${targetAngle.toFixed(0)}°`, { exact: true })
  await dialMotionLabel.waitFor({ state: 'visible', timeout: 5_000 })
  metrics.wholeBodyMotion.reactStateRendered = true

  const boundary = inspector.getByText(/does not warp anatomy or fabricate patient-specific force/i)
  if (!(await boundary.isVisible().catch(() => false))) {
    throw new Error('Whole-body motion inspector scientific boundary is not visible')
  }

  await inspector.getByRole('button', { name: /Inspect this motion in shared 3D/i }).click()
  await page.waitForTimeout(250)
  await assertCanvasHealthy(canvas, 'Apply motion to shared 3D')
  metrics.wholeBodyMotion.applyToShared3dClicked = true
  metrics.wholeBodyMotion.documentScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (metrics.wholeBodyMotion.documentScrollWidth > metrics.viewport.width + 2) {
    throw new Error(`Whole-body motion inspector overflows horizontally: ${metrics.wholeBodyMotion.documentScrollWidth}px > ${metrics.viewport.width}px`)
  }

  // The initial evidence already proves the live 3D compositor. For the second
  // evidence image, temporarily hide only the WebGL canvas so Chromium does not
  // block on a second software-GPU readback while we capture the motion UI.
  await inspector.scrollIntoViewIfNeeded()
  const previousCanvasVisibility = await canvas.evaluate((node) => node.style.visibility)
  try {
    await canvas.evaluate((node) => { node.style.visibility = 'hidden' })
    await page.waitForTimeout(50)
    await captureMotionViewport()
  } finally {
    await canvas.evaluate((node, visibility) => { node.style.visibility = visibility }, previousCanvasVisibility)
  }
  if (!motionScreenshotCaptured) throw new Error('Body3D motion inspector mobile visual evidence was not captured')
  await assertCanvasHealthy(canvas, 'Post motion visual evidence')
  metrics.wholeBodyMotion.motionEvidenceCapturedWithoutWebglReadback = true

  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  console.log(JSON.stringify({ ok: true, url, screenshotCaptured, motionScreenshotCaptured, ...metrics }))
} catch (error) {
  failure = error instanceof Error ? error.message : String(error)
  throw error
} finally {
  if (!screenshotCaptured) {
    try {
      await captureViewport()
    } catch (error) {
      screenshotError = error instanceof Error ? error.message : String(error)
    }
  }
  await writeFile(metricsPath, `${JSON.stringify({
    ok: !failure,
    url,
    failure,
    pageErrors,
    screenshotCaptured,
    motionScreenshotCaptured,
    screenshotError,
    metrics,
  }, null, 2)}\n`)
  await withTimeout(context.close(), 'Body3D browser context close', 10_000).catch(() => undefined)
  await withTimeout(browser.close(), 'Body3D browser close', 10_000).catch(() => undefined)
}