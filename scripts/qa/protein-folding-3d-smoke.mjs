import { mkdir, stat } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.PROTEIN_FOLDING3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const browserPath = process.env.PROTEIN_FOLDING3D_QA_CHROME || undefined
const screenshotPath = process.env.PROTEIN_FOLDING3D_QA_SCREENSHOT || 'artifacts/protein-folding-3d-390x844.png'

const browser = await chromium.launch({
  headless: true,
  executablePath: browserPath,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
})
await context.addInitScript(() => {
  const account = {
    email: 'qa@localhost.test', name: 'QA', role: 'pasien', isSubscriber: false,
    loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01',
  }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(60_000)
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

let failure = null
try {
  await page.goto(url, { waitUntil: 'networkidle' })

  const moleculesTab = page.getByRole('button', { name: 'Molecules', exact: true }).first()
  await moleculesTab.scrollIntoViewIfNeeded()
  await moleculesTab.click()

  const launch = page.locator('button[data-protein-folding-launch="true"]')
  await launch.waitFor({ state: 'visible' })
  if ((await launch.getAttribute('aria-expanded')) !== 'false') throw new Error('Protein folding atlas must remain opt-in before launch')
  await launch.click()
  if ((await launch.getAttribute('aria-expanded')) !== 'true') throw new Error('Protein folding atlas did not expose expanded state after launch')

  const canvas = page.locator('canvas[data-protein-folding3d="true"]')
  await canvas.waitFor({ state: 'visible' })
  await page.waitForTimeout(900)

  const render = await canvas.evaluate((node) => {
    const gl = node.getContext('webgl2') || node.getContext('webgl')
    if (!gl) return { webgl: false, lost: true, width: 0, height: 0, contrastColors: 0 }
    const width = gl.drawingBufferWidth
    const height = gl.drawingBufferHeight
    const pixels = new Uint8Array(width * height * 4)
    gl.finish()
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    const colors = new Set()
    const pixelCount = width * height
    const stridePixels = Math.max(1, Math.floor(pixelCount / 12000))
    for (let pixel = 0; pixel < pixelCount; pixel += stridePixels) {
      const i = pixel * 4
      if (pixels[i + 3] === 0) continue
      colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`)
      if (colors.size >= 16) break
    }
    return {
      webgl: true,
      lost: gl.isContextLost(),
      width,
      height,
      contrastColors: colors.size,
    }
  })
  if (!render.webgl || render.lost) throw new Error(`Protein folding WebGL unhealthy: ${JSON.stringify(render)}`)
  if (render.width < 300 || render.height < 300) throw new Error(`Protein folding drawing buffer too small: ${render.width}x${render.height}`)
  if (render.contrastColors < 3) throw new Error(`Protein folding canvas lacks visible contrast-bearing render signal: ${JSON.stringify(render)}`)

  const canvasBox = await canvas.boundingBox()
  if (!canvasBox || canvasBox.width < 280 || canvasBox.height < 300) throw new Error(`Protein folding canvas is not meaningfully visible: ${JSON.stringify(canvasBox)}`)

  await page.getByRole('button', { name: 'Alzheimer', exact: true }).click()
  await page.waitForTimeout(250)
  const targetSelect = page.getByRole('combobox').last()
  const targetText = await targetSelect.locator('option:checked').textContent()
  if (!targetText || !/(APP|MAPT)/.test(targetText)) throw new Error(`Alzheimer domain did not switch to an Alzheimer research target: ${targetText}`)

  await page.getByRole('button', { name: 'Binding pocket', exact: true }).click()
  await page.waitForTimeout(250)
  const pocketButton = page.getByRole('button', { name: 'Binding pocket', exact: true })
  if ((await pocketButton.getAttribute('aria-pressed')) !== 'true') throw new Error('Binding-pocket stage did not become active')
  const bodyText = await page.locator('#protein-folding-atlas-region').innerText()
  if (!bodyText.includes('Pocket predictions are hypotheses')) throw new Error('Binding-pocket evidence boundary is not visible')
  if (!bodyText.includes('atomistic rendering remains blocked')) throw new Error('Atomistic fail-closed disclosure is not visible')
  if (!bodyText.includes('Research hypothesis engine only')) throw new Error('Research-only boundary is not visible')

  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (pageWidth !== 390) throw new Error(`Protein folding page overflows horizontally: ${pageWidth}px`)
  if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(' | ')}`)

  await mkdir(screenshotPath.split('/').slice(0, -1).join('/') || '.', { recursive: true })
  await canvas.screenshot({ path: screenshotPath })
  const screenshot = await stat(screenshotPath)
  if (screenshot.size < 8_000) throw new Error(`Protein folding render artifact is suspiciously small: ${screenshot.size} bytes`)

  console.log(
    `Protein folding 3D PASS: WebGL ${render.width}x${render.height}, ${render.contrastColors}+ sampled render colors, ` +
    `Alzheimer target ${targetText.trim()}, binding-pocket interaction active, 390px mobile width, ${screenshot.size} byte canvas artifact, zero page errors.`,
  )
} catch (error) {
  failure = error
} finally {
  await browser.close()
}

if (failure) {
  console.error(`Protein folding 3D FAIL: ${failure.message}`)
  process.exit(1)
}
