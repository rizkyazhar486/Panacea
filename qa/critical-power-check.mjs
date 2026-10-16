// Pemeriksaan peramban C2: Critical Power (2-point) tanpa jawaban tampil "—", bukan "0 W".
// Jalankan: npx vite build && npx vite preview --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/critical-power-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const BASE = process.env.QA_URL || 'http://localhost:5199/'
const jalankan = async (vals) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await ctx.addInitScript((v) => {
    const account = { id: 'qa-patient', email: 'cp-qa@localhost.test', name: 'QA Patient', role: 'pasien', patientId: 'qa-self', isSubscriber: false, loggedAt: new Date().toISOString() }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
    const t = new Date(); localStorage.setItem('pmd-quote-seen-date', `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`)
    localStorage.setItem('pm_lab_cp', JSON.stringify(v))
  }, vals)
  const page = await ctx.newPage()
  await page.goto(`${BASE}#/latihan?t=lab`, { timeout: 180000 })
  const card = page.locator('div.rounded-2xl', { hasText: 'Critical Power (2-point)' }).last()
  await card.waitFor({ timeout: 60000 })
  const valueText = await card.locator('.text-xl').innerText()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  await page.screenshot({ path: '/private/tmp/critical-power-390.png' }); await ctx.close()
  return { valueText, overflow }
}
try {
  const ok = await jalankan({ p1: 320, t1: 180, p2: 250, t2: 720 })
  assert.match(ok.valueText, /^226\.7\s*W/, 'nilai bawaan tetap dihitung')
  const sama = await jalankan({ p1: 320, t1: 180, p2: 250, t2: 180 })
  assert.match(sama.valueText, /^—/, 'waktu sama: tidak ada jawaban'); assert.doesNotMatch(sama.valueText, /^0\s*W/, 'bukan "0 W"')
  assert.equal(ok.overflow || sama.overflow, false, 'tidak ada overflow horizontal')
  console.log('critical-power-check: ok')
} finally { await browser.close() }
