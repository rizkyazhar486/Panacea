import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.BODY3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const screenshotPath = process.env.BODY3D_QA_SCREENSHOT || 'artifacts/body3d-mobile-390x844.png'
const motionScreenshotPath = process.env.BODY3D_QA_MOTION_SCREENSHOT || 'artifacts/body3d-mobile-motion-390x844.png'
const metricsPath = process.env.BODY3D_QA_METRICS || 'artifacts/body3d-mobile-metrics.json'
const operationTimeoutMs = Number(process.env.BODY3D_QA_OPERATION_TIMEOUT_MS || 20_000)

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
let canvas = null

async function frameSignature(locator) {
  return withTimeout(locator.evaluate((node) => {
    const gl = node.getContext('webgl2') || node.getContext('webgl')
    if (!gl) throw new Error('WebGL context unavailable for frame signature')
    const width = gl.drawingBufferWidth
    const height = gl.drawingBufferHeight
    if (!width || !height) throw new Error('WebGL drawing buffer is empty')

    const sampleWidth = Math.min(96, width)
    const sampleHeight = Math.min(96, height)
    const x = Math.max(0, Math.floor((width - sampleWidth) / 2))
    const y = Math.max(0, Math.floor((height - sampleHeight) / 2))
    const pixels = new Uint8Array(sampleWidth * sampleHeight * 4)
    gl.finish()
    gl.readPixels(x, y, sampleWidth, sampleHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

    let hash = 2166136261
    let nonZero = 0
    let min = 255
    let max = 0
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const a = pixels[i + 3]
      if (r || g || b || a) nonZero += 1
      min = Math.min(min, r, g, b)
      max = Math.max(max, r, g, b)
      hash ^= r; hash = Math.imul(hash, 16777619)
      hash ^= g; hash = Math.imul(hash, 16777619)
      hash ^= b; hash = Math.imul(hash, 16777619)
      hash ^= a; hash = Math.imul(hash, 16777619)
    }
    return {
      hash: (hash >>> 0).toString(16).padStart(8, '0'),
      nonZero,
      min,
      max,
      sampleWidth,
      sampleHeight,
      drawingBufferWidth: width,
      drawingBufferHeight: height,
    }
  }), 'Body3D WebGL frame signature', 10_000)
}

async function canvasPng(locator) {
  const dataUrl = await withTimeout(locator.evaluate((node) => node.toDataURL('image/png')), 'Body3D canvas PNG', 10_000)
  const prefix = 'data:image/png;base64,'
  if (!dataUrl.startsWith(prefix)) throw new Error('Body3D canvas did not produce a PNG data URL')
  const png = Buffer.from(dataUrl.slice(prefix.length), 'base64')
  if (png.length < 5_000) throw new Error(`Body3D canvas PNG is unexpectedly small: ${png.length} bytes`)
  return png
}

async function captureCanvas(path) {
  if (!canvas) throw new Error('Body3D canvas is unavailable for visual evidence')
  await writeFile(path, await canvasPng(canvas))
}

async function dismissIfVisible(locator, timeout = 5_000) {
  if (!(await locator.isVisible().catch(() => false))) return false
  await locator.click()
  await locator.waitFor({ state: 'hidden', timeout }).catch(() => undefined)
  return true
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
  canvas = viewer.locator('> canvas').first()
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
    const gl = node.getContext('webgl2') || node.getContext('webgl')
    const rect = node.getBoundingClientRect()
    const center = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
      canvas: {
        clientWidth: node.clientWidth,
        clientHeight: node.clientHeight,
        backingWidth: node.width,
        backingHeight: node.height,
      },
      webgl: Boolean(gl),
      documentScrollWidth: document.documentElement.scrollWidth,
      canvasCount: document.querySelectorAll('canvas').length,
      route: window.location.hash,
      canvasCenterUnobstructed: center === node,
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
  metrics.renderDpr = metrics.canvas.backingWidth / Math.max(1, metrics.canvas.clientWidth)
  if (metrics.renderDpr < 1 || metrics.renderDpr > 1.51) {
    throw new Error(`Mobile Body3D backing-store ratio ${metrics.renderDpr.toFixed(3)} is outside the safe 1.0–1.5 range`)
  }
  if (metrics.documentScrollWidth > metrics.viewport.width + 2) {
    throw new Error(`Page overflows horizontally: ${metrics.documentScrollWidth}px > ${metrics.viewport.width}px`)
  }

  const initialFrame = await frameSignature(canvas)
  metrics.initialFrame = initialFrame
  if (initialFrame.nonZero < 100 || initialFrame.max <= initialFrame.min) {
    throw new Error('Body3D sampled framebuffer is blank or uniform')
  }

  const vessels = page.getByRole('button', { name: 'Vessels', exact: true }).first()
  await vessels.click()
  await progressiveLoading.waitFor({ state: 'visible', timeout: 5_000 })
  const progressiveClass = await progressiveLoading.evaluate((node) =>
    node.closest('[role="status"]')?.getAttribute('class') ?? '',
  )
  metrics.progressiveLoadingCompact = progressiveClass.includes('top-2') && !progressiveClass.includes('inset-0')
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
  if (!metrics.progressiveLoadingCompact) throw new Error(`Additional layer loading is not compact: ${progressiveClass || 'no class'}`)
  if (!metrics.progressiveLoadingCenterUnobstructed) throw new Error('Additional layer loading obstructed the Body3D viewer center')
  await progressiveLoading.waitFor({ state: 'hidden', timeout: 120_000 })

  const box = await canvas.boundingBox()
  if (!box) throw new Error('Body3D canvas has no measurable bounding box')
  const beforeOrbit = await frameSignature(canvas)
  const x = box.x + box.width * 0.5
  const y = box.y + box.height * 0.45
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + Math.min(48, box.width * 0.15), y + 18, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(500)
  const afterOrbit = await frameSignature(canvas)
  metrics.orbitFrame = { before: beforeOrbit, after: afterOrbit }
  metrics.orbitChangedFrame = beforeOrbit.hash !== afterOrbit.hash
  if (!metrics.orbitChangedFrame) throw new Error('Orbit drag did not change the sampled Body3D framebuffer')

  await captureCanvas(screenshotPath)
  screenshotCaptured = true

  const precisionTab = page.getByRole('button', { name: 'Whole-body precision', exact: true })
  await precisionTab.click()
  await page.getByText('Panacea · Whole-body precision atlas', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })

  const movementTab = page.getByRole('button', { name: 'Movement biomechanics', exact: true })
  await movementTab.click()
  const inspectorTitle = page.getByText('Whole-body motion inspector', { exact: true })
  await inspectorTitle.waitFor({ state: 'visible', timeout: 20_000 })
  const inspector = inspectorTitle.locator('xpath=ancestor::div[contains(@class,"rounded-3xl")][1]')

  await canvas.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  const beforeJointSelection = await frameSignature(canvas)

  const kneeButton = inspector.getByRole('button', { name: 'Knee', exact: true })
  await kneeButton.click()
  await page.waitForTimeout(700)
  await canvas.scrollIntoViewIfNeeded()
  const afterJointSelection = await frameSignature(canvas)
  metrics.wholeBodyMotion = {
    precisionOpened: true,
    kneeSelected: true,
    jointSelectionChangedFrame: beforeJointSelection.hash !== afterJointSelection.hash,
    jointFrame: { before: beforeJointSelection, after: afterJointSelection },
  }
  if (!metrics.wholeBodyMotion.jointSelectionChangedFrame) {
    throw new Error('Selecting the Knee profile did not update the sampled shared Body3D framebuffer')
  }

  await inspector.scrollIntoViewIfNeeded()
  const slider = inspector.locator('input[type="range"]').first()
  const sliderBounds = await slider.evaluate((node) => ({ min: Number(node.min), max: Number(node.max) }))
  const targetAngle = Math.round(sliderBounds.min + (sliderBounds.max - sliderBounds.min) * 0.65)
  await slider.evaluate((node, value) => {
    node.value = String(value)
    node.dispatchEvent(new Event('input', { bubbles: true }))
    node.dispatchEvent(new Event('change', { bubbles: true }))
  }, targetAngle)
  await page.waitForTimeout(100)
  const observedAngle = Number(await slider.inputValue())
  metrics.wholeBodyMotion.sliderTargetDeg = targetAngle
  metrics.wholeBodyMotion.sliderObservedDeg = observedAngle
  if (observedAngle !== targetAngle) {
    throw new Error(`Whole-body ROM slider did not update: expected ${targetAngle}°, saw ${observedAngle}°`)
  }

  const boundary = inspector.getByText(/does not warp anatomy or fabricate patient-specific force/i)
  if (!(await boundary.isVisible().catch(() => false))) {
    throw new Error('Whole-body motion inspector scientific boundary is not visible')
  }

  await inspector.getByRole('button', { name: /Inspect this motion in shared 3D/i }).click()
  await page.waitForTimeout(250)
  metrics.wholeBodyMotion.applyToShared3dClicked = true
  metrics.wholeBodyMotion.documentScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (metrics.wholeBodyMotion.documentScrollWidth > metrics.viewport.width + 2) {
    throw new Error(`Whole-body motion inspector overflows horizontally: ${metrics.wholeBodyMotion.documentScrollWidth}px > ${metrics.viewport.width}px`)
  }

  await canvas.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  await captureCanvas(motionScreenshotPath)
  motionScreenshotCaptured = true

  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  console.log(JSON.stringify({ ok: true, url, screenshotCaptured, motionScreenshotCaptured, ...metrics }))
} catch (error) {
  failure = error instanceof Error ? error.message : String(error)
  throw error
} finally {
  if (!screenshotCaptured && canvas) {
    try {
      await captureCanvas(screenshotPath)
      screenshotCaptured = true
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
