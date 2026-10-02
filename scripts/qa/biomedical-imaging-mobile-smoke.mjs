import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.BIOMEDICAL_IMAGING_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const screenshotPath = process.env.BIOMEDICAL_IMAGING_QA_SCREENSHOT || 'artifacts/biomedical-imaging-mobile.png'
const metricsPath = process.env.BIOMEDICAL_IMAGING_QA_METRICS || 'artifacts/biomedical-imaging-mobile-metrics.json'

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
await context.addInitScript(() => {
  const account = { email: 'body-imaging-qa@localhost.test', name: 'Body imaging QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01' }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(25_000)
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`Body Explorer returned HTTP ${response.status()}`)

  const biomedical = page.getByRole('button', { name: 'Biomedical engine', exact: true })
  await biomedical.click()
  await page.getByText('Panacea Biomedical Technology Engine', { exact: true }).waitFor({ state: 'visible' })
  await page.getByRole('button', { name: 'Imaging 3D', exact: true }).click()

  const lab = page.locator('[data-biomedical-imaging-lab="v1"]')
  await lab.waitFor({ state: 'visible' })
  await lab.getByText(/REFERENCE ATLAS · NOT PATIENT DICOM/i).waitFor({ state: 'visible' })

  // Exercise representative radiology and section controls on a phone viewport.
  await lab.getByRole('button', { name: 'Bone', exact: true }).click()
  await lab.getByRole('button', { name: 'ct', exact: true }).click()
  await lab.getByRole('button', { name: 'sagittal', exact: true }).click()
  await lab.getByRole('button', { name: 'Empty can test', exact: true }).click()

  const canvas = lab.locator('canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 60_000 })
  await canvas.scrollIntoViewIfNeeded()
  const health = await canvas.evaluate((node) => {
    const gl = node.getContext('webgl2') || node.getContext('webgl')
    const rect = node.getBoundingClientRect()
    return { webgl: Boolean(gl), contextLost: gl ? gl.isContextLost() : true, width: rect.width, height: rect.height }
  })
  if (!health.webgl || health.contextLost) throw new Error('Imaging 3D WebGL context unavailable or lost')
  if (health.width < 300 || health.height < 280) throw new Error(`Imaging canvas too small: ${health.width}x${health.height}`)
  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth }))
  if (viewport.width !== 390 || viewport.height !== 844) throw new Error(`Unexpected viewport ${viewport.width}x${viewport.height}`)
  if (viewport.scrollWidth > viewport.width + 2) throw new Error(`Imaging lab horizontal overflow: ${viewport.scrollWidth}px > ${viewport.width}px`)

  const boundary = await lab.getByText(/Patient DICOM\/NIfTI volume ingestion/i).innerText()
  await lab.screenshot({ path: screenshotPath })
  const metrics = { ok: true, viewport, canvas: health, boundary, route: await page.evaluate(() => location.hash) }
  await writeFile(metricsPath, JSON.stringify(metrics, null, 2))
  console.log(JSON.stringify(metrics))
} catch (error) {
  await writeFile(metricsPath, JSON.stringify({ ok: false, pageErrors, message: error instanceof Error ? error.message : String(error) }, null, 2)).catch(() => undefined)
  throw error
} finally {
  await context.close().catch(() => undefined)
  await browser.close().catch(() => undefined)
}
