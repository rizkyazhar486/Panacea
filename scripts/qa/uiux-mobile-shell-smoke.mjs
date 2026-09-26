import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const origin = process.env.UIUX_MOBILE_QA_ORIGIN || 'http://127.0.0.1:4173'
const outDir = process.env.UIUX_MOBILE_QA_DIR || 'artifacts/uiux-mobile-390x844'
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
})

await context.addInitScript(() => {
  const account = {
    email: 'uiux-mobile-qa@localhost.test',
    name: 'UIUX Mobile QA',
    role: 'dokter',
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
page.setDefaultTimeout(30_000)
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

const surfaces = [
  { id: 'home', hash: '#/', marker: '.panacea-liquid-home' },
  { id: 'clinical', hash: '#/clinical-hub', marker: 'main[aria-label="Clinical command surface"]' },
  { id: 'body-exposure', hash: '#/fitness-hub?view=body-exposure', marker: '[data-pmd-body-exposure="true"]' },
]

const report = []

for (const surface of surfaces) {
  pageErrors.length = 0
  const response = await page.goto(`${origin}/${surface.hash}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`${surface.id}: HTTP ${response.status()}`)

  await page.waitForSelector('header[data-panacea-command-bar]', { state: 'visible' })
  await page.waitForSelector('nav[aria-label="Panacea super pages"]', { state: 'visible' })
  await page.waitForSelector(surface.marker, { state: 'visible', timeout: 45_000 })

  const metrics = await page.evaluate(({ id, marker }) => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const root = document.documentElement
    const header = document.querySelector('header[data-panacea-command-bar]')
    const zoneNav = document.querySelector('nav[aria-label="Panacea super pages"]')
    const surfaceRoot = document.querySelector(marker)

    const box = (node) => {
      const r = node?.getBoundingClientRect()
      return r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height } : null
    }

    const actionable = [...document.querySelectorAll(
      'header[data-panacea-command-bar] button, nav[aria-label="Panacea super pages"] a, nav[aria-label="Panacea super pages"] button'
    )].filter((node) => {
      const r = node.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }).map((node) => {
      const r = node.getBoundingClientRect()
      return {
        label: node.getAttribute('aria-label') || node.textContent?.trim().slice(0, 60) || node.tagName,
        width: r.width,
        height: r.height,
      }
    })

    const undersized = actionable.filter((item) => item.width < 40 || item.height < 40)
    const assistiveVisible = Boolean(document.querySelector('[data-pmd-assistive="true"]'))

    return {
      id,
      viewport: { width: viewportWidth, height: viewportHeight },
      documentScrollWidth: root.scrollWidth,
      overflowPx: root.scrollWidth - viewportWidth,
      header: box(header),
      zoneNav: box(zoneNav),
      surface: box(surfaceRoot),
      undersized,
      assistiveVisible,
    }
  }, surface)

  if (metrics.viewport.width !== 390 || metrics.viewport.height !== 844) {
    throw new Error(`${surface.id}: unexpected viewport ${metrics.viewport.width}x${metrics.viewport.height}`)
  }
  if (metrics.overflowPx > 2) {
    throw new Error(`${surface.id}: horizontal overflow ${metrics.overflowPx}px`)
  }
  for (const [name, rect] of [['header', metrics.header], ['zoneNav', metrics.zoneNav], ['surface', metrics.surface]]) {
    if (!rect) throw new Error(`${surface.id}: missing ${name}`)
    if (rect.left < -1 || rect.right > 391) {
      throw new Error(`${surface.id}: ${name} escapes viewport: ${JSON.stringify(rect)}`)
    }
  }
  if (metrics.undersized.length) {
    throw new Error(`${surface.id}: touch targets below 40px: ${JSON.stringify(metrics.undersized.slice(0, 5))}`)
  }
  if (surface.id === 'body-exposure' && metrics.assistiveVisible) {
    throw new Error('body-exposure: floating assistive control obstructs the spatial surface')
  }
  if (pageErrors.length) {
    throw new Error(`${surface.id}: page errors: ${pageErrors.join(' | ')}`)
  }

  await page.screenshot({ path: `${outDir}/${surface.id}.png`, fullPage: false })
  report.push(metrics)
}

console.log(JSON.stringify({ ok: true, surfaces: report }, null, 2))
await browser.close()
