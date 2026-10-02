import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.NAVIGATION_QA_ORIGIN || 'http://127.0.0.1:4173'
const out = process.env.NAVIGATION_QA_OUTPUT || 'artifacts/navigation-back'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: {
      email: 'navigation-qa@localhost.test', name: 'Navigation QA', role: 'dokter', isSubscriber: false,
      loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01',
    }, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
  })
  const header = page.locator('header[data-panacea-command-bar]')
  async function hash(value) {
    await page.evaluate(value => { location.hash = value }, value)
    await header.waitFor()
    // Tunggu commit efek router, bukan sekadar perubahan address bar sinkron.
    await page.waitForTimeout(200)
  }
  await page.goto(`${origin}/#/health-data?t=labs`)
  await header.waitFor()
  await hash('/health-data/tutorial')
  await hash('/health-data/tutorial?step=2')
  await header.getByRole('button', { name: 'Go back', exact: true }).click()
  await page.waitForFunction(() => location.hash === '#/health-data?t=labs')
  assert.equal(await page.evaluate(() => location.hash), '#/health-data?t=labs')
  const title = await header.locator('h1').innerText()
  assert(!title.includes('Panaceamed.id'), 'Known route must retain its page title')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow at 390px')
  await page.screenshot({ path: `${out}/parent-query-restored-390.png` })

  // Riwayat browser luar tidak boleh menjadi tujuan Back aplikasi.
  await page.route('**/qa-previous-document', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Previous document</title>' }))
  await page.goto(`${origin}/qa-previous-document`)
  await page.goto(`${origin}/#/settings`)
  await header.waitFor()
  await header.getByRole('button', { name: 'Go back', exact: true }).click()
  await page.waitForFunction(() => location.hash === '#/')
  await page.goto(`${origin}/#/health-data/tutorial?step=3`)
  await header.waitFor()
  await header.getByRole('button', { name: 'Go back', exact: true }).click()
  await page.waitForFunction(() => location.hash === '#/health-data')
  assert.deepEqual(errors, [])
  console.log('Navigation Back: parent query restored, direct links stay in-app, canonical title and 390px/reduced-motion passed')
} finally { await browser.close() }
