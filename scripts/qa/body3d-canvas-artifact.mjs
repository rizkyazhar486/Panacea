import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { verifyEyeOptics } from './eye-optics-smoke.mjs'

const url = process.env.BODY3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const outputPath = process.env.BODY3D_QA_CANVAS_ARTIFACT || 'artifacts/body3d-mobile-canvas.png'
const timeoutMs = Number(process.env.BODY3D_QA_VISUAL_TIMEOUT_MS || 120_000)

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

// Artifact-only browser: preserve the WebGL drawing buffer so SwiftShader does
// not discard a healthy rendered frame before direct canvas copy. The separate
// behavioral smoke still exercises the production/default WebGL context.
await context.addInitScript(() => {
  const nativeGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function getContext(type, attributes) {
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      return nativeGetContext.call(this, type, { ...(attributes || {}), preserveDrawingBuffer: true })
    }
    return nativeGetContext.call(this, type, attributes)
  }
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
  // Presentation-only first-run flags. Do not fabricate a health assessment.
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(20_000)
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

async function placeCanvasOnscreen(canvas) {
  await canvas.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  const geometry = await canvas.evaluate((node) => {
    const rect = node.getBoundingClientRect()
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
    }
  })
  const centerInside =
    geometry.centerX >= 0 && geometry.centerX <= geometry.viewportWidth &&
    geometry.centerY >= 0 && geometry.centerY <= geometry.viewportHeight
  if (!centerInside) {
    throw new Error(`Body3D canvas center outside viewport during visual capture: ${JSON.stringify(geometry)}`)
  }
  return geometry
}

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`Body Explorer returned HTTP ${response.status()}`)

  const canvas = page.locator('div.h-full.w-full.touch-none > canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 45_000 })
  await placeCanvasOnscreen(canvas)

  await page.getByText('Loading anatomy…').first().waitFor({ state: 'hidden', timeout: timeoutMs })
  await page.getByText('Adding anatomy layer…').first().waitFor({ state: 'hidden', timeout: timeoutMs })

  const fatal = page.getByText(/This device could not start 3D graphics|The browser dropped the 3D context/i).first()
  if (await fatal.isVisible().catch(() => false)) throw new Error(await fatal.innerText())
  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  // Body3D deliberately pauses demand-rendering while offscreen. Bring the
  // actual production canvas back into the viewport before asking the visual
  // gate for evidence, then orbit it once so the captured buffer must contain
  // a fresh compositor frame rather than a preserved background-only frame.
  const captureGeometry = await placeCanvasOnscreen(canvas)
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Body3D canvas has no onscreen bounding box during visual capture')
  const x = box.x + box.width * 0.5
  const y = box.y + box.height * 0.45
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + Math.min(36, box.width * 0.1), y + 14, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(500)

  const capture = await canvas.evaluate((node) => {
    const width = node.width
    const height = node.height
    if (width < 300 || height < 480) throw new Error(`Unexpected backing canvas ${width}x${height}`)

    const rect = node.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    if (centerX < 0 || centerX > window.innerWidth || centerY < 0 || centerY > window.innerHeight) {
      throw new Error(`Body3D canvas center outside viewport at copy time: ${JSON.stringify({ centerX, centerY, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight })}`)
    }

    const gl = node.getContext('webgl2') || node.getContext('webgl')
    if (!gl || gl.isContextLost()) throw new Error('Body3D WebGL context unavailable during visual capture')
    const contextAttributes = gl.getContextAttributes()
    if (!contextAttributes?.preserveDrawingBuffer) {
      throw new Error('Visual QA WebGL context did not preserve its rendered buffer')
    }

    const copy = document.createElement('canvas')
    copy.width = width
    copy.height = height
    const ctx = copy.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('2D artifact context unavailable')
    ctx.drawImage(node, 0, 0)

    const pixels = ctx.getImageData(0, 0, width, height).data
    const stride = Math.max(4, Math.floor((width * height) / 4096) * 4)
    const lumas = []
    let visibleSamples = 0
    let brightSamples = 0
    let minLuma = 255
    let maxLuma = 0
    let sumLuma = 0
    let sumLumaSquared = 0
    for (let i = 0; i < pixels.length; i += stride) {
      const alpha = pixels[i + 3]
      if (alpha < 8) continue
      const luma = Math.round((pixels[i] * 299 + pixels[i + 1] * 587 + pixels[i + 2] * 114) / 1000)
      visibleSamples += 1
      if (luma >= 40) brightSamples += 1
      minLuma = Math.min(minLuma, luma)
      maxLuma = Math.max(maxLuma, luma)
      sumLuma += luma
      sumLumaSquared += luma * luma
      lumas.push(luma)
    }
    lumas.sort((a, b) => a - b)
    const percentile = (fraction) => lumas.length
      ? lumas[Math.min(lumas.length - 1, Math.floor((lumas.length - 1) * fraction))]
      : 0
    const meanLuma = visibleSamples ? sumLuma / visibleSamples : 0
    const variance = visibleSamples ? Math.max(0, sumLumaSquared / visibleSamples - meanLuma * meanLuma) : 0

    return {
      width,
      height,
      preserveDrawingBuffer: true,
      visibleSamples,
      brightSamples,
      brightFraction: visibleSamples ? brightSamples / visibleSamples : 0,
      minLuma,
      maxLuma,
      meanLuma,
      lumaStdDev: Math.sqrt(variance),
      p95Luma: percentile(0.95),
      p99Luma: percentile(0.99),
      lumaSpread: maxLuma - minLuma,
      dataUrl: copy.toDataURL('image/png'),
    }
  })

  // The viewer background is intentionally dark. A background-only gradient can
  // have thousands of opaque pixels and a small luma spread, so those conditions
  // alone are not proof that anatomy rendered. Require a meaningful bright-tail
  // population plus contrast. These thresholds are deliberately far below the
  // cream/red default skeleton+muscle materials while rejecting the observed
  // false-positive background frame (p99≈25, max≈25, zero samples >=40).
  if (
    capture.visibleSamples < 100 ||
    capture.lumaSpread < 32 ||
    capture.maxLuma < 48 ||
    capture.p99Luma < 40 ||
    capture.brightFraction < 0.01
  ) {
    throw new Error(`Body3D visual artifact lacks a rendered anatomy signal: ${JSON.stringify({
      visibleSamples: capture.visibleSamples,
      brightSamples: capture.brightSamples,
      brightFraction: capture.brightFraction,
      minLuma: capture.minLuma,
      maxLuma: capture.maxLuma,
      p95Luma: capture.p95Luma,
      p99Luma: capture.p99Luma,
      lumaSpread: capture.lumaSpread,
      lumaStdDev: capture.lumaStdDev,
    })}`)
  }
  if (!capture.dataUrl.startsWith('data:image/png;base64,')) throw new Error('Body3D visual artifact is not a PNG data URL')

  const png = Buffer.from(capture.dataUrl.slice('data:image/png;base64,'.length), 'base64')
  if (png.length < 10_000) throw new Error(`Body3D visual artifact is unexpectedly small: ${png.length} bytes`)
  await writeFile(outputPath, png)

  const eyeOptics = await verifyEyeOptics(page)
  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  console.log(JSON.stringify({
    ok: true,
    artifact: outputPath,
    eyeOptics,
    captureScope: 'onscreen-rendered-webgl-canvas-preserved-in-qa-only-context',
    viewport: { width: 390, height: 844 },
    captureGeometry,
    canvas: { width: capture.width, height: capture.height },
    preserveDrawingBuffer: capture.preserveDrawingBuffer,
    visibleSamples: capture.visibleSamples,
    brightSamples: capture.brightSamples,
    brightFraction: capture.brightFraction,
    minLuma: capture.minLuma,
    maxLuma: capture.maxLuma,
    meanLuma: capture.meanLuma,
    lumaStdDev: capture.lumaStdDev,
    p95Luma: capture.p95Luma,
    p99Luma: capture.p99Luma,
    lumaSpread: capture.lumaSpread,
    bytes: png.length,
  }))
} finally {
  await context.close().catch(() => undefined)
  await browser.close().catch(() => undefined)
}
