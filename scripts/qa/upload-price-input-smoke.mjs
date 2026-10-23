import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.UPLOAD_PRICE_QA_ORIGIN || 'http://127.0.0.1:4173'
const output = process.env.UPLOAD_PRICE_QA_OUTPUT || 'artifacts/upload-price-inputs'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: {
      email: 'upload-price-qa@localhost.test', name: 'Synthetic upload price QA', role: 'pasien', isSubscriber: true,
      loggedAt: new Date().toISOString(),
    }, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
  })
  // Isolate client input guards: no real publication, payment or AI provider.
  let aiRequests = 0
  await page.route('**/api/**', async route => {
    if (new URL(route.request().url()).pathname.includes('/ai/')) aiRequests++
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'synthetic-client-fixture-no-external-provider' }) })
  })
  const invalid = ['', '-1', '2.5', '9007199254740992']
  const problem = 'Price must be a safe whole number of 0 PNC or more'
  const records = async title => page.evaluate(title => {
    const state = JSON.parse(localStorage.getItem('panaceamed.state.v3') || '{}')
    return (state.materials || []).filter(m => m.title === title)
  }, title)
  await page.goto(`${origin}/#/editor`)
  const editorTitle = 'Synthetic editor price guard fixture'
  await page.getByLabel(/^Title/).fill(editorTitle)
  await page.getByPlaceholder(/^Write your notes/).fill('Synthetic input fixture only. No medical content, publication or review.')
  const editorPrice = page.getByLabel(/^Price \(PNC/)
  const editorSubmit = page.getByRole('button', { name: 'Upload to Verifier', exact: true })
  assert.equal(await editorSubmit.isEnabled(), true, 'all non-price requirements are filled')
  for (const value of invalid) {
    await editorPrice.fill(value)
    await editorSubmit.click()
    await page.getByRole('alert').filter({ hasText: problem }).waitFor()
    assert.equal((await records(editorTitle)).length, 0, 'invalid price must not create a local material')
  }
  await editorPrice.fill('0')
  assert.equal(await editorPrice.inputValue(), '0', 'explicit free is representable; acceptance covered by the pure-engine test')
  await page.goto(`${origin}/#/marketplace`)
  const marketplaceTitle = 'Synthetic marketplace price guard fixture'
  await page.getByLabel(/^Title/).fill(marketplaceTitle)
  // Only the selected filename is needed before the guard. The fixture is never uploaded.
  await page.locator('input[type="file"]').setInputFiles({ name: 'synthetic-price-input.pdf', mimeType: 'application/pdf', buffer: Buffer.from('Synthetic input fixture; never uploaded.') })
  const marketPrice = page.getByLabel(/^Unit purchase price/)
  const marketSubmit = page.getByRole('button', { name: 'Upload & Verify', exact: true })
  assert.equal(await marketSubmit.isEnabled(), true, 'all non-price requirements are filled')
  for (const value of invalid) {
    await marketPrice.fill(value)
    await marketSubmit.click()
    await page.getByRole('alert').filter({ hasText: problem }).waitFor()
    assert.equal((await records(marketplaceTitle)).length, 0, 'invalid price must not create a local material')
  }
  await marketPrice.fill('0')
  assert.equal(await marketPrice.inputValue(), '0')
  assert.equal(aiRequests, 0, 'invalid values return before any AI request')
  assert.deepEqual(errors, [], 'no browser runtime errors')
  const evidence = { ok: true, viewport: { width: 390, height: 844 }, forms: ['editor', 'marketplace'], invalidPrices: invalid, invalidMaterialsCreated: 0, aiRequests: 0, explicitFreeField: true, positivePricesCoveredByUnitTests: true, clientOnly: true, realPublication: false, realPayment: false, clinicalReviewPerformed: false }
  await writeFile(`${output}/evidence.json`, JSON.stringify(evidence, null, 2))
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true })
  console.log(JSON.stringify(evidence))
} finally {
  await browser.close()
}
