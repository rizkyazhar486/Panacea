// Pemeriksaan peramban C2: bunga dan cicilan minimum yang kosong bukan 0; 0 yang diketik tetap 0 (Keuangan).
// Jalankan: npx vite build && npx vite preview --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/moneyhub-blank-fields-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const BASE = process.env.QA_URL || 'http://localhost:5199/'
const seed = () => {
  const account = { id: 'qa-patient', email: 'moneyhub-qa@localhost.test', name: 'QA Patient', role: 'pasien', patientId: 'qa-self', isSubscriber: false, loggedAt: new Date().toISOString() }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
  const t = new Date(); localStorage.setItem('pmd-quote-seen-date', `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`)
}
try {
  const errors = []
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await ctx.addInitScript(seed)
  const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${BASE}#/keuangan`, { timeout: 180000 })
  const text = () => page.locator('body').innerText()
  const noOverflow = async (w) => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow ${w}`)
  await page.getByRole('button', { name: 'Debt', exact: true }).first().waitFor({ timeout: 60000 })
  await page.getByRole('button', { name: 'Debt', exact: true }).first().click()

  // 1. Debt: a blank rate or minimum payment is not 0.
  await page.getByPlaceholder('Credit card A').fill('Card A'); await page.getByPlaceholder('8000000').fill('8000000')
  await page.getByRole('button', { name: 'Add debt' }).click()
  assert.match(await text(), /Enter the yearly interest rate/, 'a blank rate is refused, not read as 0 %'); assert.doesNotMatch(await text(), /Highest interest first/, 'no debt was added')
  await page.getByPlaceholder('24').fill('0'); await page.getByRole('button', { name: 'Add debt' }).click()
  assert.match(await text(), /Enter the minimum payment/, 'a blank minimum payment is refused, not read as 0'); assert.doesNotMatch(await text(), /Highest interest first/)
  await page.getByPlaceholder('500000').fill('0'); await page.getByRole('button', { name: 'Add debt' }).click()
  await page.getByText('Highest interest first').waitFor({ timeout: 10000 })
  assert.doesNotMatch(await text(), /Enter the (yearly interest rate|minimum payment)/, 'typed zeros are accepted as real zeros')
  await noOverflow('debt tab'); await page.screenshot({ path: '/private/tmp/moneyhub-debt-390.png', fullPage: true })

  // 2. Emergency fund: blank savings shows nothing; a typed 0 is a real "no buffer".
  await page.getByRole('button', { name: 'Emergency Fund', exact: true }).first().click()
  const savings = page.getByPlaceholder('10000000'); await savings.fill('')
  assert.doesNotMatch(await text(), /Lasts roughly/, 'blank savings gives no verdict')
  await savings.fill('0'); await page.getByPlaceholder('5000000').fill('5000000')
  assert.match(await text(), /Lasts roughly/); assert.match(await text(), /No buffer yet/, 'an entered 0 in savings is a real zero buffer')
  await noOverflow('emergency tab')
  assert.deepEqual(errors, [], `no page errors: ${errors.join(' | ')}`)
  console.log('moneyhub-blank-fields-check: ok')
} finally { await browser.close() }
