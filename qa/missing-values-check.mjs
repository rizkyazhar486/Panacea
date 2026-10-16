// Pemeriksaan peramban C2: nilai yang belum diisi bukan nol. Tes kebugaran, rekor keseimbangan dan waktu reaksi.
// Jalankan: npx vite build && npx vite preview --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/missing-values-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const BASE = process.env.QA_URL || 'http://localhost:5199/'
const seedSession = () => {
  const account = { id: 'qa-patient', email: 'missing-values-qa@localhost.test', name: 'QA Patient', role: 'pasien', patientId: 'qa-self', isSubscriber: false, loggedAt: new Date().toISOString() }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
  const t = new Date(); localStorage.setItem('pmd-quote-seen-date', `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`)
}
try {
  const errors = []
  const open = async (hash, ready, width = 390, preseed) => {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 500, hasTouch: width < 500 })
    await ctx.addInitScript(seedSession)
    if (preseed) await ctx.addInitScript({ content: preseed })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`${BASE}#${hash}`, { timeout: 180000 })
    await page.getByText(ready, { exact: false }).first().waitFor({ timeout: 60000 })
    return { ctx, page }
  }
  const text = (page) => page.locator('body').innerText()
  const noOverflow = async (page, where) => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow ${where}`)

  // 1. Fitness test: nothing entered is not "0/100 — Needs Improvement".
  {
    const { ctx, page } = await open('/latihan?t=tes', 'Fitness Test Score')
    const panel = page.locator('[data-total-ready]')
    const inputs = page.locator('input[type="number"]')
    const t = await text(page)
    assert.doesNotMatch(t, /Needs Improvement|Meets Requirements/, 'no pass/fail verdict before anything is entered (was "0/100 — Needs Improvement")')
    assert.match(t, /Enter all four results to see your total/)
    assert.equal(await panel.getAttribute('data-total-ready'), 'false', 'no total before anything is entered')
    assert.doesNotMatch(await panel.innerText(), /\/100/, 'no score out of 100')
    await noOverflow(page, 'fitness test, nothing entered')
    for (let i = 0; i < 3; i++) await inputs.nth(i).fill(['43', '41', '18'][i])
    assert.equal(await panel.getAttribute('data-total-ready'), 'false', 'three of four items: still no total (the untested item no longer drags it to zero)')
    await inputs.nth(3).fill('2800')
    assert.equal(await panel.getAttribute('data-total-ready'), 'true'); assert.match(await panel.innerText(), /100\s*\/100/); assert.match(await panel.innerText(), /Meets Requirements/)
    // A typed 0 is a real zero.
    for (let i = 0; i < 4; i++) await inputs.nth(i).fill('0')
    assert.match(await panel.innerText(), /0\s*\/100/); assert.match(await panel.innerText(), /Needs Improvement/, 'entered zeros are real failing results')
    // Clearing one item withdraws the verdict again.
    await inputs.nth(2).fill('')
    assert.equal(await panel.getAttribute('data-total-ready'), 'false')
    // Implausible values are not accepted as results.
    await inputs.nth(2).fill('99999')
    assert.equal(await panel.getAttribute('data-total-ready'), 'false', 'an implausible value is treated as not entered')
    await noOverflow(page, 'fitness test, entered'); await page.screenshot({ path: '/private/tmp/missing-values-fitness-390.png', fullPage: true }); await ctx.close()
  }

  // 2. Balance test personal best: unrecorded is "—", never "0s".
  for (const [stored, expected] of [[null, /Best: —/], ['12', /Best: 12s/], ['abc', /Best: —/], ['-5', /Best: —/], ['0', /Best: —/], ['Infinity', /Best: —/]]) {
    const pre = stored === null ? undefined : `localStorage.setItem('pmd_balance_test_v1', ${JSON.stringify(stored)})`
    const { ctx, page } = await open('/latihan?t=gerak', 'Balance Test', 390, pre)
    await page.getByRole('button', { name: 'Balance Test', exact: true }).click().catch(async () => { await page.getByText('Balance Test', { exact: true }).first().click() })
    await page.getByText(/Best:/).first().waitFor({ timeout: 30000 })
    const t = await text(page); assert.match(t, expected, `balance best with stored ${JSON.stringify(stored)}`); assert.doesNotMatch(t, /Best: 0s/, 'an unrecorded best is never "0s"')
    await ctx.close()
  }

  // 3. Reaction time best.
  for (const [stored, expected] of [[null, /Best: —/], ['250', /Best: 250ms/], ['abc', /Best: —/], ['0', /Best: —/]]) {
    const pre = stored === null ? undefined : `localStorage.setItem('pmd_reaction_best_v1', ${JSON.stringify(stored)})`
    const { ctx, page } = await open('/jiwa?t=alat', 'Reaction Time', 390, pre)
    await page.getByRole('button', { name: 'Reaction Time', exact: true }).click().catch(async () => { await page.getByText('Reaction Time', { exact: true }).first().click() })
    await page.getByText(/Best:/).first().waitFor({ timeout: 30000 })
    assert.match(await text(page), expected, `reaction best with stored ${JSON.stringify(stored)}`)
    await ctx.close()
  }
  assert.deepEqual(errors, [], `no page errors: ${errors.join(' | ')}`)
  console.log('missing-values-check: ok')
} finally { await browser.close() }
