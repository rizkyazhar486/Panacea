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
})

const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

async function dismissIfVisible(locator) {
  if (await locator.isVisible().catch(() => false)) await locator.click()
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

const metrics = {
  viewport: null,
  caesareanLoaded: false,
  bladderUterusStep: false,
  transseptalLoaded: false,
  iceLongAxisVisible: false,
  webgl: false,
  renderDpr: null,
  overflow: null,
  pageErrors,
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

  const surgeryTab = page.getByRole('button', { name: 'Surgical layers', exact: true })
  await surgeryTab.click()
  const simulator = page.locator('[data-surgery-simulator="anatomy-grounded"]')
  await simulator.waitFor({ state: 'visible', timeout: 30_000 })
  await simulator.scrollIntoViewIfNeeded()

  await page.getByText('Caesarean section — layered pelvic anatomy', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })
  const atlasCanvas = simulator.locator('canvas[data-atlas-viewer3d="true"]').first()
  await atlasCanvas.waitFor({ state: 'visible', timeout: 60_000 })
  await simulator.getByText(/Loading anatomy/i).waitFor({ state: 'hidden', timeout: 120_000 }).catch(() => undefined)
  const loadFailure = simulator.getByText(/Could not load this anatomical model|could not start 3D graphics|dropped the 3D context/i).first()
  if (await loadFailure.isVisible().catch(() => false)) throw new Error(`Caesarean atlas failure: ${await loadFailure.innerText()}`)
  metrics.caesareanLoaded = true

  // Step buttons include a secondary mode label in their accessible name, so
  // exercise the exact visible step title rather than assuming a shorter ARIA name.
  const bladderStep = simulator.getByText('Bladder–uterus relationship', { exact: true }).first()
  await bladderStep.scrollIntoViewIfNeeded()
  await bladderStep.click()
  await simulator.getByText('Bladder–uterus relationship', { exact: true }).last().waitFor({ state: 'visible', timeout: 10_000 })
  await simulator.getByText(/urinary bladder/i).first().waitFor({ state: 'visible', timeout: 10_000 })
  metrics.bladderUterusStep = true

  await simulator.getByRole('button', { name: 'Transseptal + ICE', exact: true }).click()
  await simulator.getByText('Transseptal puncture — 3D anatomy + ICE orientation', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })
  await atlasCanvas.waitFor({ state: 'visible', timeout: 60_000 })
  await page.waitForTimeout(700)
  if (await loadFailure.isVisible().catch(() => false)) throw new Error(`Transseptal atlas failure: ${await loadFailure.innerText()}`)
  metrics.transseptalLoaded = true

  const iceLongAxisStep = simulator.getByText('ICE long-axis orientation', { exact: true }).first()
  await iceLongAxisStep.scrollIntoViewIfNeeded()
  await iceLongAxisStep.click()
  await simulator.getByText('ICE guidance', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
  await simulator.getByText('orientation, not diagnosis', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
  metrics.iceLongAxisVisible = true

  await atlasCanvas.scrollIntoViewIfNeeded()
  const canvasMetrics = await atlasCanvas.evaluate((node) => {
    const gl = node.getContext('webgl2') || node.getContext('webgl')
    return { webgl: Boolean(gl), clientWidth: node.clientWidth, backingWidth: node.width }
  })
  metrics.webgl = canvasMetrics.webgl
  metrics.renderDpr = canvasMetrics.backingWidth / Math.max(1, canvasMetrics.clientWidth)
  metrics.viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio }))
  metrics.overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)

  if (!metrics.webgl) throw new Error('Surgical atlas canvas has no WebGL context')
  if (metrics.viewport.width !== 390 || metrics.viewport.height !== 844) throw new Error(`Unexpected viewport ${metrics.viewport.width}x${metrics.viewport.height}`)
  if (metrics.renderDpr < 1 || metrics.renderDpr > 1.51) throw new Error(`Unsafe surgical atlas mobile DPR ${metrics.renderDpr.toFixed(3)}`)
  if (metrics.overflow > 2) throw new Error(`Surgical simulator overflows mobile viewport by ${metrics.overflow}px`)
  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  await simulator.scrollIntoViewIfNeeded()
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