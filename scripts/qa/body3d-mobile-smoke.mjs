import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.BODY3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const screenshotPath = process.env.BODY3D_QA_SCREENSHOT || 'artifacts/body3d-mobile-390x844.png'
const metricsPath = process.env.BODY3D_QA_METRICS || 'artifacts/body3d-mobile-metrics.json'

await mkdir('artifacts', { recursive: true })

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

// Shell intentionally sends anonymous visitors to the public welcome page.
// Seed the same remembered-session format used by StoreProvider so this smoke
// exercises the authenticated Body Explorer without weakening the auth guard.
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
// Keep one normally-large optional layer in-flight long enough to prove that
// progressive loading does not dim or cover anatomy that is already usable.
await page.route('**/anatomy/cardio' + 'vascular.glb', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 4_000))
  await route.continue()
})
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

let metrics = null
let failure = null
let screenshotCaptured = false
let screenshotError = null

async function capturePng(clip = null) {
  const cdp = await context.newCDPSession(page)
  try {
    const options = {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    }
    if (clip) {
      options.clip = {
        x: clip.x,
        y: clip.y,
        width: clip.width,
        height: clip.height,
        scale: 1,
      }
    }
    const shot = await cdp.send('Page.captureScreenshot', options)
    return Buffer.from(shot.data, 'base64')
  } finally {
    await cdp.detach()
  }
}

async function captureViewport() {
  await writeFile(screenshotPath, await capturePng())
  screenshotCaptured = true
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

  // Dismiss normal, user-facing first-run surfaces only through their own UI.
  // This keeps the test representative: no CSS hiding and no production state
  // mutation beyond the disposable login session above.
  await dismissIfVisible(page.getByRole('button', { name: /Get Started/i }).first())
  await dismissIfVisible(page.getByRole('button', { name: /Maybe later/i }).first())

  // The daily reminder is dismissible and can float over the top of the viewer.
  // Close it only if the reminder is actually present. Prefer a button inside
  // the reminder container rather than clicking arbitrary × buttons elsewhere.
  const reminderText = page.getByText(/TODAY.?S REMINDER/i).first()
  if (await reminderText.isVisible().catch(() => false)) {
    const reminder = reminderText.locator('xpath=ancestor::*[.//button][1]')
    const close = reminder.locator('button').last()
    if (await close.isVisible().catch(() => false)) await close.click()
  }

  // Do not use the first canvas on the page: other visual components may own
  // canvases too. Body3D mounts its renderer directly inside this unique
  // touch-none viewer container.
  const canvas = page.locator('div.h-full.w-full.touch-none > canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 45_000 })
  await canvas.scrollIntoViewIfNeeded()

  // Give Skeleton + Muscles time to enter loading, then require them to settle.
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

  // Turn on a normally-large optional layer while keeping the already-rendered
  // anatomy usable. The delayed request above makes this state deterministic.
  const vessels = page.getByRole('button', { name: 'Vessels', exact: true }).first()
  await vessels.click()
  await progressiveLoading.waitFor({ state: 'visible', timeout: 5_000 })
  // Read the status container from the exact text node that is already visible.
  // A second live locator can legitimately race the completion of a fast GLB.
  const progressiveClass = await progressiveLoading.evaluate((node) =>
    node.closest('[role="status"]')?.getAttribute('class') ?? '',
  )
  metrics.progressiveLoadingCompact = Boolean(
    progressiveClass?.includes('top-2') && !progressiveClass?.includes('inset-0'),
  )
  // Clicking the layer control legitimately scrolls that control into view.
  // Re-center the viewer before testing its center; otherwise elementFromPoint
  // can probe a coordinate outside the viewport and misreport it as an overlay.
  await canvas.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'center' }))
  await page.waitForTimeout(100)
  metrics.progressiveLoadingCenterUnobstructed = await canvas.evaluate((node) => {
    const rect = node.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) return false
    return document.elementFromPoint(x, y) === node
  })
  if (!metrics.progressiveLoadingCompact) {
    throw new Error(`Additional layer loading is not compact: ${progressiveClass ?? 'no class'}`)
  }
  if (!metrics.progressiveLoadingCenterUnobstructed) {
    throw new Error('Additional layer loading obstructed the Body3D canvas center')
  }
  await progressiveLoading.waitFor({ state: 'hidden', timeout: 120_000 })

  // Exercise OrbitControls and prove the compositor surface actually changes.
  // This verifies the demand-render path, rather than merely dispatching a drag
  // that could be swallowed by an overlay or render no new frame.
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Body3D canvas has no measurable bounding box')
  const beforeOrbit = await capturePng(box)
  const x = box.x + box.width * 0.5
  const y = box.y + box.height * 0.45
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + Math.min(48, box.width * 0.15), y + 18, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  const afterOrbit = await capturePng(box)
  metrics.orbitChangedFrame = !beforeOrbit.equals(afterOrbit)
  if (!metrics.orbitChangedFrame) throw new Error('Orbit drag did not produce a new Body3D compositor frame')

  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  // Capture the exact 390x844 viewport after the verified orbit interaction.
  await captureViewport()
  if (!screenshotCaptured) throw new Error('Body3D mobile visual evidence was not captured')

  console.log(JSON.stringify({ ok: true, url, screenshotCaptured, ...metrics }))
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
    screenshotError,
    metrics,
  }, null, 2)}\n`)
  await context.close()
  await browser.close()
}
