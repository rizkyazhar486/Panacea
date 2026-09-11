import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.PANACEA_OS_QA_URL || 'http://127.0.0.1:4173/#/harian'
const screenshotPath = process.env.PANACEA_OS_QA_SCREENSHOT || 'artifacts/panacea-os-mobile-390x844.png'
const metricsPath = process.env.PANACEA_OS_QA_METRICS || 'artifacts/panacea-os-mobile-metrics.json'
await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
await context.addInitScript(() => {
  const account = { email: 'panacea-os-qa@localhost.test', name: 'Panacea OS QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'P', dob: '1990-01-01' }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
})
const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))
async function dismissIfVisible(locator) { if (await locator.isVisible().catch(() => false)) await locator.click() }
const metrics = { viewport: null, overflow: null, railVisible: false, orderedFocus: false, completionReflow: false, persistedCount: 0, pageErrors }
try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`Daily returned HTTP ${response.status()}`)
  await dismissIfVisible(page.getByRole('button', { name: /Get Started/i }).first())
  await dismissIfVisible(page.getByRole('button', { name: /Maybe later/i }).first())
  const heading = page.getByRole('heading', { name: 'Now → Next → Later', exact: true })
  await heading.waitFor({ state: 'visible', timeout: 30_000 })
  const rail = heading.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " kaca ")][1]')
  await rail.waitFor({ state: 'visible', timeout: 5_000 })
  metrics.railVisible = true
  const time = rail.getByLabel('Time'), category = rail.getByLabel('Category'), title = rail.getByLabel('Agenda item'), add = rail.getByRole('button', { name: 'Add', exact: true })
  async function addItem(clock, domain, text) { await time.fill(clock); await category.selectOption(domain); await title.fill(text); await add.click(); await rail.getByText(text, { exact: true }).first().waitFor({ state: 'visible', timeout: 5_000 }) }
  await addItem('13:00', 'nutrition', 'Lunch and hydration')
  await addItem('09:00', 'work', 'Ship Panacea OS batch')
  await addItem('10:30', 'appointment', 'Project review meeting')
  const focusCards = rail.locator('[aria-label="Daily focus sequence"] > div')
  const first = await focusCards.nth(0).innerText(), second = await focusCards.nth(1).innerText(), third = await focusCards.nth(2).innerText()
  metrics.orderedFocus = first.includes('Ship Panacea OS batch') && second.includes('Project review meeting') && third.includes('Lunch and hydration')
  if (!metrics.orderedFocus) throw new Error(`Unexpected focus order: ${first} | ${second} | ${third}`)
  await rail.getByRole('button', { name: 'Complete Ship Panacea OS batch', exact: true }).click()
  const firstAfter = await focusCards.nth(0).innerText()
  metrics.completionReflow = firstAfter.includes('Project review meeting')
  if (!metrics.completionReflow) throw new Error(`Focus did not reflow after completion: ${firstAfter}`)
  const storage = await page.evaluate(() => { const key = Object.keys(localStorage).find((candidate) => candidate.startsWith('panacea.os.day.v1:')); if (!key) return { key: null, count: 0 }; try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return { key, count: Array.isArray(value) ? value.length : 0 } } catch { return { key, count: -1 } } })
  metrics.persistedCount = storage.count
  if (!storage.key || storage.count !== 3) throw new Error(`Unexpected Panacea OS persistence: ${JSON.stringify(storage)}`)
  metrics.viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio }))
  metrics.overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  if (metrics.viewport.width !== 390 || metrics.viewport.height !== 844) throw new Error(`Unexpected viewport ${metrics.viewport.width}x${metrics.viewport.height}`)
  if (metrics.overflow > 2) throw new Error(`Panacea OS overflows mobile viewport by ${metrics.overflow}px`)
  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)
  await rail.scrollIntoViewIfNeeded(); await page.screenshot({ path: screenshotPath, fullPage: false }); await writeFile(metricsPath, JSON.stringify(metrics, null, 2))
} catch (error) {
  await writeFile(metricsPath, JSON.stringify({ ...metrics, failure: String(error?.stack || error) }, null, 2)); await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => undefined); throw error
} finally { await browser.close() }
