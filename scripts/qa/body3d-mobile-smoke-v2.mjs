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
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(20_000)

// Force one anatomy layer to stay in the progressive-loading state long enough
// for the compact, non-blocking loader contract to be exercised deterministically.
await page.route('**/anatomy/cardio' + 'vascular.glb', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 4_000))
  await route.continue()
})

const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

let metrics = null
let failure = null

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
  }), 'canvas health', 10_000)
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

async function revealInViewport(locator, label) {
  const geometry = await locator.evaluate(async (node) => {
    const rail = node.parentElement
    if (rail && rail.scrollWidth > rail.clientWidth) {
      const before = node.getBoundingClientRect()
      const railRect = rail.getBoundingClientRect()
      const centeredLeft = rail.scrollLeft
        + (before.left - railRect.left)
        - (rail.clientWidth - before.width) / 2
      const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth)
      rail.scrollTo({
        left: Math.max(0, Math.min(maxScrollLeft, centeredLeft)),
        behavior: 'auto',
      })
      await new Promise((resolve) => requestAnimationFrame(resolve))
      await new Promise((resolve) => requestAnimationFrame(resolve))
    } else {
      node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
    const rect = node.getBoundingClientRect()
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }
  })

  if (
    geometry.left < 0 || geometry.right > geometry.viewportWidth
    || geometry.top < 0 || geometry.bottom > geometry.viewportHeight
  ) {
    throw new Error(`${label} could not be brought into the mobile viewport: ${JSON.stringify(geometry)}`)
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
  const canvas = viewer.locator('> canvas').first()
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
  const centerHit = await canvas.evaluate((node) => {
    const rect = node.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const hit = document.elementFromPoint(x, y)
    return { unobstructed: hit === node, tag: hit?.tagName ?? null, x, y }
  })

  metrics = {
    viewport,
    canvas: health,
    canvasCenterUnobstructed: centerHit.unobstructed,
    canvasCenterHit: centerHit,
    route: await page.evaluate(() => window.location.hash),
  }

  if (!health.webgl || health.contextLost) throw new Error('Body3D WebGL context is unavailable or lost')
  if (!centerHit.unobstructed) throw new Error(`Body3D canvas center is obstructed by ${centerHit.tag ?? 'an unknown layer'}`)
  if (viewport.width !== 390 || viewport.height !== 844) throw new Error(`Unexpected viewport ${viewport.width}x${viewport.height}`)
  if (health.clientWidth < 300 || health.clientHeight < 480) throw new Error(`Body3D canvas is too small on mobile: ${health.clientWidth}x${health.clientHeight}`)

  const renderDpr = health.backingWidth / Math.max(1, health.clientWidth)
  metrics.renderDpr = renderDpr
  if (renderDpr < 1 || renderDpr > 1.51) throw new Error(`Mobile Body3D backing-store ratio ${renderDpr.toFixed(3)} is outside the safe 1.0–1.5 range`)
  if (viewport.documentScrollWidth > viewport.width + 2) throw new Error(`Page overflows horizontally: ${viewport.documentScrollWidth}px > ${viewport.width}px`)

  const vessels = page.getByRole('button', { name: 'Vessels', exact: true }).first()
  await vessels.click()
  await progressiveLoading.waitFor({ state: 'visible', timeout: 5_000 })
  const progressiveState = await progressiveLoading.evaluate((node) => {
    const status = node.closest('[role="status"]')
    const canvas = document.querySelector('div.h-full.w-full.touch-none > canvas')
    if (!status || !canvas) return { compact: false, coversCenter: true, pointerEvents: null }
    const sr = status.getBoundingClientRect()
    const cr = canvas.getBoundingClientRect()
    const centerX = cr.left + cr.width / 2
    const centerY = cr.top + cr.height / 2
    const className = status.getAttribute('class') ?? ''
    return {
      compact: className.includes('top-2') && !className.includes('inset-0'),
      coversCenter: centerX >= sr.left && centerX <= sr.right && centerY >= sr.top && centerY <= sr.bottom,
      pointerEvents: getComputedStyle(status).pointerEvents,
    }
  })
  metrics.progressiveLoading = progressiveState
  if (!progressiveState.compact) throw new Error('Additional anatomy loading is not compact')
  if (progressiveState.coversCenter || progressiveState.pointerEvents !== 'none') throw new Error(`Additional anatomy loading blocks the viewer: ${JSON.stringify(progressiveState)}`)
  await progressiveLoading.waitFor({ state: 'hidden', timeout: 120_000 })

  const box = await canvas.boundingBox()
  if (!box) throw new Error('Body3D canvas has no measurable bounding box')
  const x = box.x + box.width * 0.5
  const y = box.y + box.height * 0.45
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + Math.min(48, box.width * 0.15), y + 18, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(400)
  const postOrbitHealth = await canvasHealth(canvas)
  metrics.orbitInteraction = {
    attempted: true,
    contextStable: postOrbitHealth.webgl && !postOrbitHealth.contextLost,
    canvasVisible: await canvas.isVisible(),
  }
  if (!metrics.orbitInteraction.contextStable || !metrics.orbitInteraction.canvasVisible) throw new Error('Orbit interaction destabilized the Body3D canvas')
  await assertNoFatal('Orbit interaction triggered a Body3D fatal state')

  const referenceGroup = page.getByRole('button', { name: 'Jump to Reference', exact: true })
  await revealInViewport(referenceGroup, 'Reference group control')
  await referenceGroup.click()
  const precisionTab = page.getByRole('button', { name: 'Whole-body precision', exact: true })
  await revealInViewport(precisionTab, 'Whole-body precision control')
  await precisionTab.click()
  await page.getByText('Panacea · Whole-body precision atlas', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })

  const systemsGroup = page.getByRole('button', { name: 'Jump to Systems', exact: true })
  await revealInViewport(systemsGroup, 'Systems group control')
  await systemsGroup.click()
  const motionTab = page.getByRole('button', { name: 'Motion biomechanics', exact: true })
  await revealInViewport(motionTab, 'Motion biomechanics control')
  await motionTab.click()

  const lab = page.getByRole('region', { name: 'Biomechanics motion lab', exact: true })
  await lab.waitFor({ state: 'visible', timeout: 20_000 })
  await lab.getByText('Original motion ↔ source-backed anatomical atlas', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })

  const atlasCanvas = lab.locator('canvas').first()
  await atlasCanvas.waitFor({ state: 'visible', timeout: 45_000 })
  const atlasHealth = await canvasHealth(atlasCanvas)
  if (!atlasHealth.webgl || atlasHealth.contextLost) throw new Error('Biomechanics source atlas WebGL context is unavailable or lost')

  const chestButton = lab.getByRole('button', { name: 'Chest', exact: true })
  await revealInViewport(chestButton, 'Chest muscle target')
  await chestButton.click()
  await page.waitForTimeout(250)
  const chestPressed = await chestButton.getAttribute('aria-pressed')
  if (chestPressed !== 'true') throw new Error(`Biomechanics muscle target did not activate (aria-pressed=${chestPressed})`)
  await lab.getByRole('region', { name: /Current target: Chest\./ }).waitFor({ state: 'visible', timeout: 10_000 })

  const timeline = lab.getByRole('slider', { name: 'Motion timeline', exact: true })
  if (!(await timeline.isDisabled())) throw new Error('Motion timeline should remain disabled until a real local video is loaded')
  for (const boundary of ['Pose', 'Force vectors', 'Atlas provenance']) {
    if (!(await lab.getByText(boundary, { exact: true }).isVisible().catch(() => false))) {
      throw new Error(`Biomechanics scientific boundary is missing: ${boundary}`)
    }
  }

  const postLabHealth = await canvasHealth(canvas)
  const finalScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  metrics.biomechanicsMotionLab = {
    currentContractVisible: true,
    sourceAtlasWebgl: atlasHealth.webgl && !atlasHealth.contextLost,
    chestTargetSelected: chestPressed === 'true',
    timelineRequiresRealVideo: await timeline.isDisabled(),
    scientificBoundariesVisible: true,
    sharedBody3dContextStable: postLabHealth.webgl && !postLabHealth.contextLost,
    documentScrollWidth: finalScrollWidth,
  }
  if (!metrics.biomechanicsMotionLab.sharedBody3dContextStable) throw new Error('Biomechanics interaction lost the shared Body3D WebGL context')
  if (finalScrollWidth > viewport.width + 2) throw new Error(`Biomechanics motion lab overflows horizontally: ${finalScrollWidth}px > ${viewport.width}px`)
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
