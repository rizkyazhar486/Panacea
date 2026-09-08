import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

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

// This browser exists only to persist a visual QA artifact. The separate
// behavioral smoke uses the production/default WebGL context. Preserve the
// drawing buffer here so Chromium/SwiftShader does not discard a healthy
// rendered frame before the artifact copier can read it.
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
})

const page = await context.newPage()
page.setDefaultTimeout(20_000)
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`Body Explorer returned HTTP ${response.status()}`)

  for (const label of [/Get Started/i, /Maybe later/i]) {
    const button = page.getByRole('button', { name: label }).first()
    if (await button.isVisible().catch(() => false)) {
      await button.click({ timeout: 3_000 }).catch(async () => {
        await button.evaluate((node) => node instanceof HTMLElement && node.click())
      })
    }
  }

  const canvas = page.locator('div.h-full.w-full.touch-none > canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 45_000 })
  await page.getByText('Loading anatomy…').first().waitFor({ state: 'hidden', timeout: timeoutMs })
  await page.getByText('Adding anatomy layer…').first().waitFor({ state: 'hidden', timeout: timeoutMs })

  const fatal = page.getByText(/This device could not start 3D graphics|The browser dropped the 3D context/i).first()
  if (await fatal.isVisible().catch(() => false)) throw new Error(await fatal.innerText())
  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  // Avoid browser-level compositor capture APIs. This QA-only context preserves
  // its drawing buffer, allowing a direct copy of the actual rendered WebGL
  // canvas while the production/default context remains tested separately.
  const capture = await canvas.evaluate((node) => {
    const width = node.width
    const height = node.height
    if (width < 300 || height < 480) throw new Error(`Unexpected backing canvas ${width}x${height}`)

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
    let visibleSamples = 0
    let minLuma = 255
    let maxLuma = 0
    for (let i = 0; i < pixels.length; i += stride) {
      const alpha = pixels[i + 3]
      if (alpha < 8) continue
      const luma = Math.round((pixels[i] * 299 + pixels[i + 1] * 587 + pixels[i + 2] * 114) / 1000)
      visibleSamples += 1
      minLuma = Math.min(minLuma, luma)
      maxLuma = Math.max(maxLuma, luma)
    }

    return {
      width,
      height,
      preserveDrawingBuffer: true,
      visibleSamples,
      lumaSpread: maxLuma - minLuma,
      dataUrl: copy.toDataURL('image/png'),
    }
  })

  if (capture.visibleSamples < 100 || capture.lumaSpread < 8) {
    throw new Error(`Body3D visual artifact looks blank/flat: ${JSON.stringify({ visibleSamples: capture.visibleSamples, lumaSpread: capture.lumaSpread })}`)
  }
  if (!capture.dataUrl.startsWith('data:image/png;base64,')) throw new Error('Body3D visual artifact is not a PNG data URL')

  const png = Buffer.from(capture.dataUrl.slice('data:image/png;base64,'.length), 'base64')
  if (png.length < 10_000) throw new Error(`Body3D visual artifact is unexpectedly small: ${png.length} bytes`)
  await writeFile(outputPath, png)

  console.log(JSON.stringify({
    ok: true,
    artifact: outputPath,
    captureScope: 'rendered-webgl-canvas-preserved-in-qa-only-context',
    viewport: { width: 390, height: 844 },
    canvas: { width: capture.width, height: capture.height },
    preserveDrawingBuffer: capture.preserveDrawingBuffer,
    visibleSamples: capture.visibleSamples,
    lumaSpread: capture.lumaSpread,
    bytes: png.length,
  }))
} finally {
  await context.close().catch(() => undefined)
  await browser.close().catch(() => undefined)
}
