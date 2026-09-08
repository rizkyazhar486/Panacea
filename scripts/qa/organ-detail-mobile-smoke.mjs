import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.ORGAN_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const screenshotPath = process.env.ORGAN_QA_SCREENSHOT || 'artifacts/organ-detail-eye-390x844.png'
const metricsPath = process.env.ORGAN_QA_METRICS || 'artifacts/organ-detail-mobile-metrics.json'

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

await context.addInitScript(() => {
  const account = {
    email: 'organ-qa@localhost.test',
    name: 'Organ QA',
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

let failure = null
let screenshotCaptured = false
let metrics = null

async function capturePng() {
  // Playwright's page.screenshot can stall while a continuously rendered WebGL
  // surface is composited. Capture the already-visible viewport directly from
  // Chromium's compositor instead, matching the stable Body3D mobile smoke.
  const cdp = await context.newCDPSession(page)
  try {
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    })
    return Buffer.from(shot.data, 'base64')
  } finally {
    await cdp.detach()
  }
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

  await page.getByRole('button', { name: 'Organs', exact: true }).first().click()
  const eye = page.getByRole('button', { name: 'Eye', exact: true }).first()
  await eye.click()

  await page.getByText('Full dossier', { exact: true }).waitFor({ state: 'visible', timeout: 15_000 })
  const organCanvas = page.locator('canvas[data-organ-model3d="eye"]').first()
  await organCanvas.waitFor({ state: 'visible', timeout: 45_000 })
  await page.getByText('Named reference anatomy', { exact: true }).waitFor({ state: 'visible', timeout: 45_000 })
  await page.getByText(/22 named structures from 26 source meshes/i).waitFor({ state: 'visible', timeout: 10_000 })

  await organCanvas.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'center' }))
  await page.waitForTimeout(150)

  metrics = await organCanvas.evaluate((canvas) => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    const rect = canvas.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
      canvas: {
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        backingWidth: canvas.width,
        backingHeight: canvas.height,
      },
      webgl: Boolean(gl),
      documentScrollWidth: document.documentElement.scrollWidth,
      centerInsideViewport: centerX >= 0 && centerX <= window.innerWidth && centerY >= 0 && centerY <= window.innerHeight,
      canvasCount: document.querySelectorAll('canvas').length,
    }
  })

  const renderDpr = metrics.canvas.backingWidth / Math.max(1, metrics.canvas.clientWidth)
  metrics.renderDpr = renderDpr
  if (!metrics.webgl) throw new Error('Organ close-up did not expose a WebGL context')
  if (!metrics.centerInsideViewport) throw new Error('Organ close-up could not be centered in the mobile viewport')
  if (renderDpr < 1 || renderDpr > 1.51) throw new Error(`Organ mobile DPR ${renderDpr.toFixed(3)} is outside 1.0–1.5`)
  if (metrics.documentScrollWidth > metrics.viewport.width + 2) {
    throw new Error(`Organ dossier overflows horizontally: ${metrics.documentScrollWidth}px > ${metrics.viewport.width}px`)
  }

  const namedTitle = page.getByText('Named reference anatomy', { exact: true })
  const namedCard = namedTitle.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
  const showAll = namedCard.getByRole('button', { name: 'Show all 22', exact: true })
  await showAll.click()
  await namedCard.getByRole('button', { name: 'Show less', exact: true }).waitFor({ state: 'visible', timeout: 5_000 })

  const allNamedButtons = namedCard.locator('div.mt-2 button')
  const namedButtonCount = await allNamedButtons.count()
  metrics.eyeNamedButtonCount = namedButtonCount
  if (namedButtonCount !== 22) throw new Error(`Expected 22 unique eye anatomy controls after Show all, found ${namedButtonCount}`)

  // Select a part beyond the initial 12 to prove the complete source inventory
  // is interactive, not merely displayed as metadata.
  const targetButton = allNamedButtons.nth(12)
  const targetName = (await targetButton.innerText()).trim()
  if (!targetName) throw new Error('The 13th named eye mesh has no readable label')
  await targetButton.click()
  await page.waitForTimeout(150)
  const selectedClass = await targetButton.getAttribute('class')
  metrics.selectedExactPart = targetName
  metrics.selectedExactPartActive = Boolean(selectedClass?.includes('bg-brand'))
  if (!metrics.selectedExactPartActive) throw new Error(`Selecting exact eye mesh did not activate its control: ${targetName}`)
  const pickedLabel = page.getByText(targetName, { exact: true })
  if ((await pickedLabel.count()) < 2) throw new Error(`Exact selected mesh name was not reflected by the viewer: ${targetName}`)

  await organCanvas.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'center' }))
  await page.waitForTimeout(100)
  await writeFile(screenshotPath, await capturePng())
  screenshotCaptured = true

  // Brain has now been promoted from a Tripo approximation to BodyParts3D
  // reference anatomy. Assert that the promotion is real and exposes its
  // semantic inventory rather than silently falling back to the old AI model.
  await page.getByRole('button', { name: 'Organs', exact: true }).first().click()
  await page.getByRole('button', { name: 'Brain', exact: true }).first().click()
  await page.locator('canvas[data-organ-model3d="brain"]').first().waitFor({ state: 'visible', timeout: 45_000 })
  await page.getByText('Named reference anatomy', { exact: true }).waitFor({ state: 'visible', timeout: 45_000 })
  await page.getByText(/45 named structures from 51 source meshes/i).waitFor({ state: 'visible', timeout: 10_000 })
  metrics.brainReferenceInventoryVisible = true
  metrics.brainStillShowsTripo = await page.getByText(/AI-generated model \(Tripo\)/i).isVisible().catch(() => false)
  if (metrics.brainStillShowsTripo) throw new Error('Brain still reports the obsolete Tripo source after reference promotion')

  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)
  console.log(JSON.stringify({ ok: true, screenshotCaptured, ...metrics }))
} catch (error) {
  failure = error instanceof Error ? error.message : String(error)
  throw error
} finally {
  await writeFile(metricsPath, `${JSON.stringify({ ok: !failure, failure, pageErrors, screenshotCaptured, metrics }, null, 2)}\n`)
  await context.close()
  await browser.close()
}
