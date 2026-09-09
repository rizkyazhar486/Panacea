import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.BODY3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
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
  // This smoke validates Body3D, not global first-run overlays. Seed only the
  // presentation flags; do not fabricate a completed health assessment.
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
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
let canvas = null

async function canvasHealth(locator) {
  return withTimeout(locator.evaluate((node) => {
    const gl = node.getContext('webgl2') || node.getContext('webgl')
    const rect = node.getBoundingClientRect()
    return {
      webgl: Boolean(gl),
      contextLost: gl ? gl.isContextLost() : true,
      clientWidth: node.clientWidth,
      clientHeight: node.clientHeight,
      backingWidth: node.width,
      backingHeight: node.height,
      rectWidth: rect.width,
      rectHeight: rect.height,
    }
  }), 'Body3D canvas health', 10_000)
}

function fatalLocator() {
  return page.getByText(/This device could not start 3D graphics|The browser dropped the 3D context/i).first()
}

async function assertNoFatal(label) {
  const fatal = fatalLocator()
  if (await fatal.isVisible().catch(() => false)) {
    throw new Error(`${label}: ${await fatal.innerText()}`)
  }
}

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`Body Explorer returned HTTP ${response.status()}`)

  const reminderText = page.getByText(/TODAY.?S REMINDER/i).first()
  if (await reminderText.isVisible().catch(() => false)) {
    const reminder = reminderText.locator('xpath=ancestor::*[.//button][1]')
    const close = reminder.locator('button').last()
    if (await close.isVisible().catch(() => false)) await close.click()
  }

  const viewer = page.locator('div.h-full.w-full.touch-none').first()
  canvas = viewer.locator('> canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 45_000 })
  await canvas.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' }))

  const initialLoading = page.getByText('Loading anatomy…').first()
  const progressiveLoading = page.getByText('Adding anatomy layer…').first()
  await initialLoading.waitFor({ state: 'hidden', timeout: 120_000 })
  await progressiveLoading.waitFor({ state: 'hidden', timeout: 120_000 })
  await assertNoFatal('Initial Body3D render failed')

  const layerFailure = page.getByText(/Couldn.t load:/i).first()
  if (await layerFailure.isVisible().catch(() => false)) {
    throw new Error(`Body3D anatomy layer failed to load: ${await layerFailure.innerText()}`)
  }

  const health = await canvasHealth(canvas)
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    documentScrollWidth: document.documentElement.scrollWidth,
  }))
  const centerUnobstructed = await canvas.evaluate((node) => {
    const rect = node.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return hit === node
  })

  metrics = {
    viewport,
    canvas: health,
    canvasCenterUnobstructed: centerUnobstructed,
    route: await page.evaluate(() => window.location.hash),
  }

  if (!health.webgl || health.contextLost) throw new Error('Body3D WebGL context is unavailable or lost')
  if (!centerUnobstructed) throw new Error('Body3D canvas center is obstructed by another UI layer')
  if (viewport.width !== 390 || viewport.height !== 844) {
    throw new Error(`Unexpected viewport ${viewport.width}x${viewport.height}`)
  }
  if (health.clientWidth < 300 || health.clientHeight < 480) {
    throw new Error(`Body3D canvas is too small on mobile: ${health.clientWidth}x${health.clientHeight}`)
  }
  const renderDpr = health.backingWidth / Math.max(1, health.clientWidth)
  metrics.renderDpr = renderDpr
  if (renderDpr < 1 || renderDpr > 1.51) {
    throw new Error(`Mobile Body3D backing-store ratio ${renderDpr.toFixed(3)} is outside the safe 1.0–1.5 range`)
  }
  if (viewport.documentScrollWidth > viewport.width + 2) {
    throw new Error(`Page overflows horizontally: ${viewport.documentScrollWidth}px > ${viewport.width}px`)
  }

  const vessels = page.getByRole('button', { name: 'Vessels', exact: true }).first()
  await vessels.click()
  await progressiveLoading.waitFor({ state: 'visible', timeout: 5_000 })
  const progressiveClass = await progressiveLoading.evaluate((node) =>
    node.closest('[role="status"]')?.getAttribute('class') ?? '',
  )
  metrics.progressiveLoadingCompact = progressiveClass.includes('top-2') && !progressiveClass.includes('inset-0')
  metrics.progressiveLoadingGeometry = await progressiveLoading.evaluate((node) => {
    const status = node.closest('[role="status"]')
    const canvas = document.querySelector('div.h-full.w-full.touch-none > canvas')
    if (!status || !canvas) {
      return { statusFound: Boolean(status), canvasFound: Boolean(canvas), coversCenter: true, pointerEvents: null }
    }
    const sr = status.getBoundingClientRect()
    const cr = canvas.getBoundingClientRect()
    const centerX = cr.left + cr.width / 2
    const centerY = cr.top + cr.height / 2
    return {
      statusFound: true,
      canvasFound: true,
      coversCenter: centerX >= sr.left && centerX <= sr.right && centerY >= sr.top && centerY <= sr.bottom,
      pointerEvents: getComputedStyle(status).pointerEvents,
      canvasCenter: [centerX, centerY],
      statusRect: [sr.left, sr.top, sr.right, sr.bottom],
    }
  })
  metrics.progressiveLoadingCenterUnobstructed = !metrics.progressiveLoadingGeometry.coversCenter && metrics.progressiveLoadingGeometry.pointerEvents === 'none'
  if (!metrics.progressiveLoadingCompact) throw new Error(`Additional layer loading is not compact: ${progressiveClass || 'no class'}`)
  if (!metrics.progressiveLoadingCenterUnobstructed) {
    throw new Error(`Additional layer loading blocks or covers the Body3D viewer center: ${JSON.stringify(metrics.progressiveLoadingGeometry)}`)
  }

  const progressiveBox = await canvas.boundingBox()
  if (!progressiveBox) throw new Error('Body3D canvas has no bounding box during progressive loading')
  const progressiveX = progressiveBox.x + progressiveBox.width * 0.5
  const progressiveY = progressiveBox.y + progressiveBox.height * 0.45
  await page.mouse.move(progressiveX, progressiveY)
  await page.mouse.down()
  await page.mouse.move(progressiveX + Math.min(32, progressiveBox.width * 0.1), progressiveY + 12, { steps: 4 })
  await page.mouse.up()
  await page.waitForTimeout(250)
  const progressiveHealth = await canvasHealth(canvas)
  metrics.progressiveInteraction = {
    attempted: true,
    contextStable: progressiveHealth.webgl && !progressiveHealth.contextLost,
    canvasVisible: await canvas.isVisible(),
  }
  if (!metrics.progressiveInteraction.contextStable || !metrics.progressiveInteraction.canvasVisible) {
    throw new Error('Progressive layer loading prevented stable Body3D interaction')
  }
  await assertNoFatal('Progressive layer interaction triggered a Body3D fatal state')
  await progressiveLoading.waitFor({ state: 'hidden', timeout: 120_000 })

  const box = await canvas.boundingBox()
  if (!box) throw new Error('Body3D canvas has no measurable bounding box')
  const x = box.x + box.width * 0.5
  const y = box.y + box.height * 0.45
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + Math.min(48, box.width * 0.15), y + 18, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(500)
  const postOrbitHealth = await canvasHealth(canvas)
  metrics.orbitInteraction = {
    attempted: true,
    contextStable: postOrbitHealth.webgl && !postOrbitHealth.contextLost,
    canvasVisible: await canvas.isVisible(),
    measurable: Boolean(await canvas.boundingBox()),
  }
  if (!metrics.orbitInteraction.contextStable || !metrics.orbitInteraction.canvasVisible || !metrics.orbitInteraction.measurable) {
    throw new Error('Orbit interaction destabilized the Body3D canvas or WebGL context')
  }
  await assertNoFatal('Orbit interaction triggered a Body3D fatal state')

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
  await page.waitForTimeout(250)
  const kneePressed = await kneeButton.getAttribute('aria-pressed')
  if (kneePressed !== 'true') throw new Error(`Knee joint selection did not become active (aria-pressed=${kneePressed})`)

  const slider = inspector.locator('input[type="range"]').first()
  const sliderState = await slider.evaluate((node) => ({
    min: Number(node.min),
    max: Number(node.max),
    step: Number(node.step) || 1,
    neutral: Number(node.value),
  }))
  const rawTarget = sliderState.neutral + (sliderState.max - sliderState.neutral) * 0.65
  const targetAngle = sliderState.min + Math.round((rawTarget - sliderState.min) / sliderState.step) * sliderState.step

  await slider.focus()
  await slider.press('Home')
  const stepCount = Math.round((targetAngle - sliderState.min) / sliderState.step)
  for (let i = 0; i < stepCount; i++) await slider.press('ArrowRight')

  const observedAngle = Number(await slider.inputValue())
  const motionLabel = slider.locator('xpath=ancestor::label[1]')
  await motionLabel.waitFor({ state: 'visible', timeout: 5_000 })
  const visibleMotionLabel = (await motionLabel.innerText()).trim()
  const renderedMotionHeading = (visibleMotionLabel.split('\n')[0] ?? '').trim()
  const expectedMotionHeading = `Flexion / extension · ${targetAngle.toFixed(0)}°`
  metrics.wholeBodyRomDiagnostic = {
    targetAngle,
    observedAngle,
    visibleMotionLabel,
    renderedMotionHeading,
  }
  console.log(JSON.stringify({
    stage: 'whole-body-rom-after-keyboard',
    targetAngle,
    observedAngle,
    visibleMotionLabel,
    renderedMotionHeading,
  }))
  if (observedAngle <= sliderState.neutral + 20) {
    throw new Error(`Whole-body ROM slider did not move meaningfully from neutral: saw ${observedAngle}°; label=${visibleMotionLabel}`)
  }
  if (observedAngle !== targetAngle) {
    throw new Error(`Whole-body ROM slider keyboard interaction expected ${targetAngle}°: saw ${observedAngle}°; label=${visibleMotionLabel}`)
  }
  if (renderedMotionHeading !== expectedMotionHeading) {
    throw new Error(`Whole-body ROM React label expected ${expectedMotionHeading}: saw ${renderedMotionHeading}`)
  }

  const dialMotionLabel = inspector.getByText(`Flexion ${targetAngle.toFixed(0)}°`, { exact: true })
  await dialMotionLabel.waitFor({ state: 'visible', timeout: 5_000 })

  const boundary = inspector.getByText(/does not warp anatomy or fabricate patient-specific force/i)
  if (!(await boundary.isVisible().catch(() => false))) {
    throw new Error('Whole-body motion inspector scientific boundary is not visible')
  }

  const exactSourceButton = inspector.getByRole('button', { name: /Inspect \d+ exact source nodes in shared 3D/i }).first()
  const textOnlyButton = inspector.getByRole('button', { name: 'No exact represented geometry to inspect', exact: true }).first()
  if (!(await exactSourceButton.isVisible().catch(() => false))) {
    const textOnly = await textOnlyButton.isVisible().catch(() => false)
    throw new Error(textOnly
      ? 'Knee biomechanics did not resolve an exact regional skeletal/muscular source-node match for shared 3D inspection'
      : 'Exact-source shared 3D motion control is missing')
  }
  if (!(await exactSourceButton.isEnabled())) {
    throw new Error('Exact-source shared 3D motion control is unexpectedly disabled')
  }
  const exactSourceButtonText = (await exactSourceButton.innerText()).trim()
  const exactSourceMatch = exactSourceButtonText.match(/Inspect (\d+) exact source nodes in shared 3D/i)
  const exactSourceCount = Number(exactSourceMatch?.[1] ?? 0)
  if (!Number.isInteger(exactSourceCount) || exactSourceCount <= 0) {
    throw new Error(`Exact-source shared 3D motion control reported invalid source-node count: ${exactSourceButtonText}`)
  }

  await exactSourceButton.click()
  await page.waitForTimeout(300)
  const postShared3dHealth = await canvasHealth(canvas)
  await assertNoFatal('Shared 3D motion inspection triggered a Body3D fatal state')

  metrics.wholeBodyMotion = {
    precisionOpened: true,
    kneeSelected: kneePressed === 'true',
    sliderTargetDeg: targetAngle,
    sliderObservedDeg: observedAngle,
    reactStateRendered: renderedMotionHeading === expectedMotionHeading,
    scientificBoundaryVisible: true,
    exactSourceCount,
    applyToShared3dClicked: true,
    contextStable: postShared3dHealth.webgl && !postShared3dHealth.contextLost,
    documentScrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
  }

  if (!metrics.wholeBodyMotion.contextStable) throw new Error('Shared 3D motion inspection lost the WebGL context')
  if (metrics.wholeBodyMotion.documentScrollWidth > viewport.width + 2) {
    throw new Error(`Whole-body motion inspector overflows horizontally: ${metrics.wholeBodyMotion.documentScrollWidth}px > ${viewport.width}px`)
  }
  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  console.log(JSON.stringify({ ok: true, url, ...metrics }))
} catch (error) {
  failure = error instanceof Error ? error.message : String(error)
  throw error
} finally {
  await writeFile(metricsPath, `${JSON.stringify({
    ok: !failure,
    url,
    failure,
    pageErrors,
    metrics,
  }, null, 2)}\n`)
  await withTimeout(context.close(), 'Body3D browser context close', 10_000).catch(() => undefined)
  await withTimeout(browser.close(), 'Body3D browser close', 10_000).catch(() => undefined)
}
