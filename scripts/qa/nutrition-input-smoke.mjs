import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.NUTRITION_QA_ORIGIN || 'http://127.0.0.1:4173'
const output = process.env.NUTRITION_QA_OUTPUT || 'artifacts/nutrition-inputs'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: {
      email: 'nutrition-qa@localhost.test', name: 'Nutrition synthetic UI QA', role: 'pasien', isSubscriber: false,
      loggedAt: new Date().toISOString(),
    }, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
  })
  await page.goto(`${origin}/#/nutrition-toolkit`)
  const noEstimate = page.getByText('No estimate yet', { exact: true })
  await page.getByRole('button', { name: 'Coffee Hydration', exact: true }).click()
  const cups = page.getByLabel(/^Cups of coffee today/)
  assert.equal(await cups.inputValue(), '', 'coffee starts unknown')
  await noEstimate.waitFor()
  await cups.fill('2')
  await page.getByText('300 mL', { exact: true }).waitFor()
  await cups.fill('')
  await noEstimate.waitFor()
  assert.equal(await page.getByText('300 mL', { exact: true }).count(), 0)
  await cups.fill('0')
  await page.getByText('0 mL', { exact: true }).waitFor()
  for (const value of ['2.5', '-1', '16']) {
    await cups.fill(value)
    await noEstimate.waitFor()
    await page.getByRole('alert').filter({ hasText: 'Cups must be a whole number from 0 to 15.' }).waitFor()
    assert.equal(await page.getByText('0 mL', { exact: true }).count(), 0)
  }
  await cups.fill('2')
  await page.getByText('300 mL', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Electrolytes', exact: true }).click()
  const hours = page.getByLabel(/^How many hours have you been fasting/)
  assert.equal(await hours.inputValue(), '', 'fasting time starts unknown')
  await noEstimate.waitFor()
  await page.getByText(/not intake targets or supplement doses/).waitFor()
  await hours.fill('16')
  for (const amount of ['960mg', '720mg', '128mg']) await page.getByText(amount, { exact: true }).waitFor()
  await hours.fill('')
  await noEstimate.waitFor()
  for (const amount of ['960mg', '720mg', '128mg']) assert.equal(await page.getByText(amount, { exact: true }).count(), 0)
  await hours.fill('0')
  await page.getByText('0mg', { exact: true }).first().waitFor()
  assert.equal(await page.getByText('0mg', { exact: true }).count(), 3)
  await hours.fill('72.01')
  await noEstimate.waitFor()
  await page.getByRole('alert').filter({ hasText: 'Fasting hours must be between 0 and 72.' }).waitFor()
  assert.equal(await page.getByText('0mg', { exact: true }).count(), 0)
  await hours.fill('72')
  for (const amount of ['3000mg', '2500mg', '350mg']) await page.getByText(amount, { exact: true }).waitFor()
  assert.deepEqual(errors, [], 'no browser runtime errors')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  assert.ok(overflow <= 1, `mobile horizontal overflow: ${overflow}px`)
  const evidence = { ok: true, viewport: { width: 390, height: 844 }, initiallyMissing: true, coffeeMl: 300, explicitZeroAccepted: true, clearedValueDenied: true, wrongRangesDenied: true, recovery: true, horizontalOverflowPx: overflow, synthetic: true, clinicallyReviewed: false }
  await writeFile(`${output}/evidence.json`, JSON.stringify(evidence, null, 2))
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true })
  console.log(JSON.stringify(evidence))
} finally {
  await browser.close()
}
