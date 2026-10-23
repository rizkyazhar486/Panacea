// Pemeriksaan peramban C2: indeks gesekan layanan tidak turun diam-diam ke 0 saat kolom dikosongkan.
// Jalankan: npx vite build && npx vite preview --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/friction-blank-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const BASE = process.env.QA_URL || 'http://localhost:5199/'
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await ctx.addInitScript(() => {
    const account = { id: 'qa-patient', email: 'friction-qa@localhost.test', name: 'QA Patient', role: 'pasien', patientId: 'qa-self', isSubscriber: false, loggedAt: new Date().toISOString() }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
    const t = new Date(); localStorage.setItem('pmd-quote-seen-date', `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`)
  })
  const page = await ctx.newPage()
  await page.goto(`${BASE}#/learn`, { timeout: 180000 })
  await page.getByRole('tab', { name: /Gap Navigator/ }).click()
  const panel = page.locator('div', { hasText: 'Care friction index' }).last()
  await page.getByText('Care friction index').waitFor({ timeout: 60000 })
  const kartu = page.locator('div.rounded-2xl', { hasText: 'Care friction index' }).last()
  const skor = async () => (await kartu.locator('.text-2xl').first().innerText()).trim()
  assert.match(await skor(), /^\d+$/, 'nilai bawaan menghasilkan indeks')
  const waiting = kartu.locator('input[type="number"]').first()
  await waiting.fill('')
  assert.equal(await skor(), '—', 'kolom kosong: tidak ada indeks (bukan skor dari 0)')
  assert.match(await kartu.innerText(), /enter all fields/i)
  await waiting.fill('0')
  assert.match(await skor(), /^\d+$/, 'nol yang diketik adalah nol sungguhan')
  const budget = kartu.locator('input[type="number"]').nth(3)
  await budget.fill('')
  assert.equal(await skor(), '—', 'anggaran kosong: tidak ada indeks')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'tidak ada overflow horizontal')
  await page.screenshot({ path: '/private/tmp/friction-blank-390.png' })
  console.log('friction-blank-check: ok')
} finally { await browser.close() }
