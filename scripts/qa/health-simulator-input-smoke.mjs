import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.HEALTH_SIMULATOR_QA_ORIGIN || 'http://127.0.0.1:4173'
const output = process.env.HEALTH_SIMULATOR_QA_OUTPUT || 'artifacts/health-simulator-inputs'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: {
      email: 'framingham-qa@localhost.test', name: 'Framingham synthetic UI QA', role: 'pasien', isSubscriber: false,
      loggedAt: new Date().toISOString(),
    }, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
  })
  await page.goto(`${origin}/#/health-simulator`)
  const fields = {
    age: page.getByLabel(/^Age \(years/),
    totChol: page.getByLabel(/^Total cholesterol/),
    hdl: page.getByLabel(/^HDL \(mg/),
    sbp: page.getByLabel(/^Systolic BP/),
  }
  await fields.age.waitFor()
  for (const [field, locator] of Object.entries(fields)) {
    assert.equal(await locator.inputValue(), '', `${field}: no invented baseline value`)
  }
  const noEstimate = page.getByText(/^No estimate yet/)
  await noEstimate.waitFor()
  const riskCard = page.getByText('10-year cardiovascular risk', { exact: true }).locator('..')
  assert.equal(await riskCard.getByText(/\d+\.\d+%/).count(), 0, 'missing values must not display risk')
  for (const [field, value] of Object.entries({ age: '50', totChol: '200', hdl: '50', sbp: '130' })) {
    await fields[field].fill(value)
  }
  await riskCard.getByText('8.4%', { exact: true }).first().waitFor()
  assert.equal(await riskCard.getByText('8.4%', { exact: true }).count(), 2, 'unchanged male baseline and no-intervention estimate')
  await fields.hdl.fill('')
  await noEstimate.waitFor()
  assert.equal(await riskCard.getByText('8.4%', { exact: true }).count(), 0, 'clearing HDL removes previous risk')
  await page.getByRole('alert').filter({ hasText: 'HDL is required' }).waitFor()
  await fields.hdl.fill('50')
  await fields.age.fill('29')
  await noEstimate.waitFor()
  await page.getByRole('alert').filter({ hasText: 'age must be 30–74 years' }).waitFor()
  await fields.age.fill('50')
  await page.getByLabel(/^Sex/).selectOption('F')
  await riskCard.getByText('5.0%', { exact: true }).first().waitFor()
  assert.equal(await riskCard.getByText('5.0%', { exact: true }).count(), 2, 'unchanged female baseline and no-intervention estimate')
  assert.deepEqual(errors, [], 'no browser runtime errors')
  const evidence = { ok: true, viewport: { width: 390, height: 844 }, initiallyMissing: true, malePercent: 8.4, femalePercent: 5.0, clearedValueDenied: true, outOfRangeDenied: true, synthetic: true, clinicallyReviewed: false }
  await writeFile(`${output}/evidence.json`, JSON.stringify(evidence, null, 2))
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true })
  console.log(JSON.stringify(evidence))
} finally {
  await browser.close()
}
