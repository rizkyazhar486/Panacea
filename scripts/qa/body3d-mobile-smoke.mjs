import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.BODY3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const screenshotPath = process.env.BODY3D_QA_SCREENSHOT || 'artifacts/body3d-mobile-390x844.png'
const metricsPath = process.env.BODY3D_QA_METRICS || 'artifacts/body3d-mobile-metrics.json'

await mkdir('artifacts', { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: [
    // Current headless Chromium routes software WebGL through ANGLE. The
    // unsafe flag is explicit because CI has no hardware GPU and this is a
    // trusted, local preview—not user-controlled web content.
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
// test exercises the authenticated Body Explorer instead of weakening/bypassing
// the application's auth guard. The account exists only inside this disposable
// browser context and carries no production credentials or patient data.
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
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

let metrics = null
let failure = null
let screenshotCaptured = false
let screenshotError = null

async function captureViewport() {
  // Use Chromium's DevTools protocol directly. Page.screenshot occasionally
  // fails to persist a WebGL-backed mobile frame in headless CI even though
  // the renderer is healthy. CDP captures the actual compositor surface and
  // gives us deterministic visual evidence for the 390x844 acceptance gate.
  const cdp = await context.newCDPSession(page)
  try {
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    })
    await writeFile(screenshotPath, Buffer.from(shot.data, 'base64'))
    screenshotCaptured = true
  } finally {
    await cdp.detach()
  }
}

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`Body Explorer returned HTTP ${response.status()}`)

  // Do not use the first canvas on the page: other visual components may own
  // canvases too. Body3D mounts its renderer directly inside this unique
  // touch-none viewer container.
  const canvas = page.locator('div.h-full.w-full.touch-none > canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 45_000 })

  // Give Skeleton + Muscles time to enter loading, then require them to settle.
  await page.waitForTimeout(1_500)
  await page.getByText('Loading anatomy…').waitFor({ state: 'hidden', timeout: 120_000 })

  const fatal = page.getByText(/This device could not start 3D graphics|The browser dropped the 3D context/i)
  if (await fatal.count()) throw new Error(`Body3D fatal fallback is visible: ${await fatal.first().innerText()}`)

  metrics = await canvas.evaluate((node) => {
    const c = node
    const gl = c.getContext('webgl2') || c.getContext('webgl')
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
    }
  })

  if (!metrics.webgl) throw new Error('Body3D renderer canvas did not expose its WebGL context')
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

  // Exercise OrbitControls so the demand-render path is tested, not merely the
  // initial static frame.
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Body3D canvas has no measurable bounding box')
  const x = box.x + box.width * 0.5
  const y = box.y + box.height * 0.45
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + Math.min(48, box.width * 0.15), y + 18, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(250)

  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  // A green mobile gate must include inspectable visual evidence, not metrics
  // alone. This screenshot is the exact 390x844 compositor surface after a
  // real orbit interaction.
  await captureViewport()
  if (!screenshotCaptured) throw new Error('Body3D mobile visual evidence was not captured')

  console.log(JSON.stringify({ ok: true, url, screenshotCaptured, ...metrics }))
} catch (error) {
  failure = error instanceof Error ? error.message : String(error)
  throw error
} finally {
  // On a failure, still try once to preserve the rendered state that led to it.
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
