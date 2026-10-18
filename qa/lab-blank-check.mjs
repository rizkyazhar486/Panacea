// Pemeriksaan peramban C2: kartu Performance Lab dengan kolom kosong menampilkan "—", bukan hasil dari 0.
// Jalankan: npx vite build && npx vite preview --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/lab-blank-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const BASE = process.env.QA_URL || 'http://localhost:5199/'
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await ctx.addInitScript(() => {
    const account = { id: 'qa-patient', email: 'lab-qa@localhost.test', name: 'QA Patient', role: 'pasien', patientId: 'qa-self', isSubscriber: false, loggedAt: new Date().toISOString() }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
    const t = new Date(); localStorage.setItem('pmd-quote-seen-date', `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`)
  })
  const page = await ctx.newPage()
  await page.goto(`${BASE}#/latihan?t=lab`, { timeout: 180000 })
  const card = page.locator('div.rounded-2xl', { hasText: 'MLSS (Max Lactate Steady State)' }).last()
  await card.waitFor({ timeout: 60000 })
  const valor = async () => (await card.locator('.text-xl').innerText()).trim()
  const ftp = card.locator('input[type="number"]').first()
  assert.match(await valor(), /^190(\D|$)/, 'nilai bawaan dihitung (200 × 0,95)')
  await ftp.fill('')
  assert.match(await valor(), /^—/, 'kolom kosong: tidak ada hasil'); assert.doesNotMatch(await valor(), /^0(\D|$)/, 'bukan "0"')
  await ftp.fill('0')
  assert.match(await valor(), /^0(\D|$)/, 'nol yang diketik dihitung sebagai nol sungguhan')
  assert.equal(await ftp.inputValue(), '0', 'nol yang diketik tetap tampil')
  await ftp.fill('')
  await page.reload(); await card.waitFor({ timeout: 60000 })
  assert.match(await valor(), /^—/, 'kosong bertahan setelah muat ulang (tidak kembali ke 0)')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'tidak ada overflow horizontal')
  await page.screenshot({ path: '/private/tmp/lab-blank-390.png' })
  console.log('lab-blank-check: ok')
} finally { await browser.close() }
