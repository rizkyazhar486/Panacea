import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.BODY_ALL_SYSTEMS_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const screenshotPath = process.env.BODY_ALL_SYSTEMS_QA_SCREENSHOT || 'artifacts/body3d-mobile-all-systems.png'
const metricsPath = process.env.BODY_ALL_SYSTEMS_QA_METRICS || 'artifacts/body3d-mobile-all-systems-metrics.json'

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
    email: 'body-all-systems-qa@localhost.test',
    name: 'Body all-systems QA',
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
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

async function assertRendererHealthy(explorer, canvas, label) {
  const alert = explorer.getByRole('alert').first()
  if (await alert.isVisible().catch(() => false)) {
    throw new Error(`${label} source renderer failed closed: ${await alert.innerText()}`)
  }
  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)
  await canvas.waitFor({ state: 'visible', timeout: 45_000 })
  await canvas.scrollIntoViewIfNeeded()
  const health = await canvas.evaluate((node) => {
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
  })
  if (!health.webgl || health.contextLost) throw new Error(`${label} WebGL context is unavailable or lost`)
  if (health.clientWidth < 300 || health.clientHeight < 300) {
    throw new Error(`${label} canvas is too small on mobile: ${health.clientWidth}x${health.clientHeight}`)
  }
  return health
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

  const precisionTab = page.getByRole('button', { name: 'Whole-body precision', exact: true })
  await precisionTab.click()
  await page.getByText('Panacea · Whole-body precision atlas', { exact: true }).first().waitFor({ state: 'visible', timeout: 30_000 })

  const explorer = page.getByRole('region', { name: 'All body systems source-backed 3D' })
  await explorer.waitFor({ state: 'visible', timeout: 30_000 })
  await explorer.getByRole('button', { name: 'Open all-system 3D', exact: true }).click()

  const loading = explorer.getByText(/Loading source bundles…/i).first()
  const canvas = explorer.locator('canvas[data-body-all-systems3d="true"]').first()
  await canvas.waitFor({ state: 'visible', timeout: 45_000 })
  await loading.waitFor({ state: 'hidden', timeout: 120_000 })
  const cardiovascularHealth = await assertRendererHealthy(explorer, canvas, 'Cardiovascular')

  const cardiovascularCoverageText = (await explorer.getByText(/source targets represented/i).first().innerText()).trim()
  const cardiovascularMatch = cardiovascularCoverageText.match(/(\d+)\/(\d+) source targets represented/i)
  if (Number(cardiovascularMatch?.[1] ?? 0) <= 0) {
    throw new Error(`Cardiovascular source bundle loaded without rendered coverage: ${cardiovascularCoverageText}`)
  }

  const respiratoryTab = explorer.getByRole('tab', { name: 'Respiratory', exact: true })
  await respiratoryTab.click()
  if ((await respiratoryTab.getAttribute('aria-selected')) !== 'true') throw new Error('Respiratory system tab did not become active')

  await loading.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined)
  await loading.waitFor({ state: 'hidden', timeout: 120_000 })
  const respiratoryHealth = await assertRendererHealthy(explorer, canvas, 'Respiratory')

  const representedText = (await explorer.getByText(/source targets represented/i).first().innerText()).trim()
  const representedMatch = representedText.match(/(\d+)\/(\d+) source targets represented/i)
  const represented = Number(representedMatch?.[1] ?? 0)
  const total = Number(representedMatch?.[2] ?? 0)
  if (!Number.isInteger(represented) || !Number.isInteger(total) || represented <= 0 || total <= 0 || represented > total) {
    throw new Error(`Invalid rendered source coverage after respiratory selection: ${representedText}`)
  }

  const box = await canvas.boundingBox()
  if (!box) throw new Error('All-system 3D canvas has no measurable bounding box')
  const x = box.x + box.width * 0.5
  const y = box.y + box.height * 0.45
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + Math.min(42, box.width * 0.12), y + 16, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(400)

  const postOrbit = await canvas.evaluate((node) => {
    const gl = node.getContext('webgl2') || node.getContext('webgl')
    return { webgl: Boolean(gl), contextLost: gl ? gl.isContextLost() : true }
  })
  if (!postOrbit.webgl || postOrbit.contextLost) throw new Error('Orbit interaction destabilized the all-system 3D canvas')

  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    documentScrollWidth: document.documentElement.scrollWidth,
    devicePixelRatio: window.devicePixelRatio,
  }))
  if (viewport.width !== 390 || viewport.height !== 844) throw new Error(`Unexpected viewport ${viewport.width}x${viewport.height}`)
  if (viewport.documentScrollWidth > viewport.width + 2) {
    throw new Error(`All-system explorer causes horizontal overflow: ${viewport.documentScrollWidth}px > ${viewport.width}px`)
  }

  await explorer.screenshot({ path: screenshotPath })
  const metrics = {
    ok: true,
    route: await page.evaluate(() => window.location.hash),
    viewport,
    cardiovascularCanvas: cardiovascularHealth,
    respiratoryCanvas: respiratoryHealth,
    postOrbit,
    respiratoryCoverage: { represented, total, label: representedText },
    loadingStrategy: 'active-system source bundles only',
    scientificBoundary: 'source-backed educational render; unresolved or failed source geometry stays blocked',
  }
  await writeFile(metricsPath, JSON.stringify(metrics, null, 2))
  console.log(JSON.stringify(metrics))
} catch (error) {
  const failure = {
    ok: false,
    route: await page.evaluate(() => window.location.hash).catch(() => null),
    pageErrors,
    message: error instanceof Error ? error.message : String(error),
  }
  await writeFile(metricsPath, JSON.stringify(failure, null, 2)).catch(() => undefined)
  throw error
} finally {
  await context.close().catch(() => undefined)
  await browser.close().catch(() => undefined)
}