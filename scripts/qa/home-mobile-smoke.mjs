import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.HOME_QA_URL || 'http://127.0.0.1:4173/#/'
const screenshotPath = process.env.HOME_QA_SCREENSHOT || 'artifacts/home-mobile-390x844.png'

await mkdir('artifacts', { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })

await context.addInitScript(() => {
  const account = { email: 'home-qa@localhost.test', name: 'Home QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01' }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
  if (sessionStorage.getItem('panacea-home-qa-seeded') !== '1') {
    localStorage.removeItem('pmd_vitals_v1')
    localStorage.removeItem('pmd_workouts_v1')
    sessionStorage.setItem('panacea-home-qa-seeded', '1')
  }
})

const page = await context.newPage()
page.setDefaultTimeout(20_000)
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function viewportHealth() {
  return page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))
}

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`Home returned HTTP ${response.status()}`)
  await page.getByRole('heading', { name: /daily command center/i }).waitFor({ state: 'visible' })
  await page.locator('main.panacea-home').waitFor({ state: 'visible' })

  const viewport = await viewportHealth()
  assert(viewport.width === 390 && viewport.height === 844, `Unexpected Home viewport ${viewport.width}x${viewport.height}`)
  assert(viewport.scrollWidth <= 392, `Home overflows horizontally: ${viewport.scrollWidth}px > 390px`)
  assert(viewport.bodyScrollWidth <= 392, `Home body overflows horizontally: ${viewport.bodyScrollWidth}px > 390px`)
  await page.getByText(/Add your first health or daily entry/i).first().waitFor({ state: 'visible' })
  assert(await page.getByText(/^Steps$/).count() === 0, 'Empty Home must not fabricate a Steps signal')
  assert(await page.getByText(/^Resting HR$/).count() === 0, 'Empty Home must not fabricate a resting-HR signal')

  const peer = await context.newPage()
  try {
    await peer.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await peer.evaluate(() => localStorage.setItem('panaceamed.state.v3', JSON.stringify({ foods: [], sleepLogs: [{ date: '2026-09-09', hours: 6.5 }], wellness: {} })))
    const rail = page.locator('[aria-label="Recorded health signals"]')
    await rail.getByText(/^Sleep$/).waitFor({ state: 'visible' })
    await rail.getByText('6.5', { exact: true }).waitFor({ state: 'visible' })
    await rail.getByText(/Recorded 2026-09-09/).waitFor({ state: 'visible' })
    await peer.evaluate(() => localStorage.setItem('home-qa-unrelated-key', 'ignored'))
    await rail.getByText('6.5', { exact: true }).waitFor({ state: 'visible' })
    await peer.evaluate(() => localStorage.removeItem('panaceamed.state.v3'))
    await page.getByText(/Add your first health or daily entry/i).first().waitFor({ state: 'visible' })
    assert(await page.locator('[aria-label="Recorded health signals"]').count() === 0, 'Cross-tab removal must remove the external recorded-signal rail')
    assert(await page.getByText('6.5', { exact: true }).count() === 0, 'Cross-tab removal must remove the external sleep value without confusing the persistent Sleep quick action')
  } finally {
    await peer.close()
  }

  const touchStyles = await page.locator('.home-odyssey-hero').evaluate((node) => ({
    backdropFilter: getComputedStyle(node).backdropFilter,
    webkitBackdropFilter: getComputedStyle(node).webkitBackdropFilter,
  }))
  assert(touchStyles.backdropFilter === 'none' || touchStyles.webkitBackdropFilter === 'none', `Touch Home must disable heavy backdrop filters; got ${JSON.stringify(touchStyles)}`)
  const mainBounds = await page.locator('main.panacea-home').boundingBox()
  assert(Boolean(mainBounds), 'Home main bounds unavailable')
  assert(mainBounds.x >= -1 && mainBounds.x + mainBounds.width <= 391, `Home main exceeds viewport: ${JSON.stringify(mainBounds)}`)

  await page.getByRole('button', { name: /Quick log/i }).click()
  await page.getByText(/Log today or a workout/i).waitFor({ state: 'visible' })
  assert((await viewportHealth()).scrollWidth <= 392, 'Opening Quick log must not create horizontal overflow')
  const load3d = page.getByRole('button', { name: /Load 3D preview/i }).first()
  await load3d.waitFor({ state: 'visible' })
  assert(await page.locator('canvas').count() === 0, 'Home must not instantiate a 3D canvas before explicit opt-in')

  await page.evaluate(() => localStorage.setItem('pmd_vitals_v1', JSON.stringify({ steps: 4321, source: 'Home QA recorded source', measuredAt: new Date().toISOString() })))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: /daily command center/i }).waitFor({ state: 'visible' })
  await page.getByText('4,321', { exact: true }).waitFor({ state: 'visible' })
  await page.getByText(/Home QA recorded source/i).waitFor({ state: 'visible' })
  assert(await page.getByText(/^Resting HR$/).count() === 0, 'A partial vitals record must not fabricate absent signals')
  assert((await viewportHealth()).scrollWidth <= 392, 'Recorded signal rail must not overflow the page horizontally')
  await page.screenshot({ path: screenshotPath, fullPage: true })
  if (pageErrors.length) throw new Error(`Home page errors: ${pageErrors.join(' | ')}`)
  console.log('Home mobile 390x844 smoke: empty state is honest, real cross-tab daily state adoption/removal works without reload, touch compositor guard is active, 3D remains opt-in, provenance survives reload, and no horizontal overflow was detected.')
} finally {
  await browser.close()
}
