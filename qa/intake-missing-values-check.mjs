// Pemeriksaan peramban C2: ubin "Today's intake" tidak menampilkan total dari nilai kalori yang hilang (bukan nol).
// Jalankan: npx vite build && npx vite preview --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/intake-missing-values-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const BASE = process.env.QA_URL || 'http://localhost:5199/'
const seed = () => {
  const account = { id: 'qa-patient', email: 'intake-qa@localhost.test', name: 'QA Patient', role: 'pasien', patientId: 'qa-self', isSubscriber: false, loggedAt: new Date().toISOString() }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
  const t = new Date(); localStorage.setItem('pmd-quote-seen-date', `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`)
}
try {
  const errors = []
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await ctx.addInitScript(seed)
  const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${BASE}#/?folds=open`, { timeout: 180000 })
  await page.waitForFunction(() => Boolean(localStorage.getItem('panaceamed.state.v3')), null, { timeout: 60000 })
  const setFoods = async (foods) => {
    await page.evaluate((f) => {
      const t = new Date(), day = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
      const state = JSON.parse(localStorage.getItem('panaceamed.state.v3')); state.foods = f.map((x, i) => ({ id: `qa-${i}`, date: day, name: `Food ${i}`, grams: 100, ...x })); localStorage.setItem('panaceamed.state.v3', JSON.stringify(state))
    }, foods)
    await page.reload()
  }
  const tile = () => page.locator('section', { has: page.getByText("Today's intake", { exact: true }) }).last()
  const noOverflow = async (w) => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow ${w}`)

  // 1. One of two entries has no calories: no total, and the tile says why. (It used to show 300 kkal, silently dropping the second entry.)
  await setFoods([{ kcal: 300, carbs: 40, protein: 20, fat: 10 }, { carbs: 20, protein: 10, fat: 5 }])
  await tile().waitFor({ timeout: 60000 }); await tile().scrollIntoViewIfNeeded()
  const t1 = await tile().innerText()
  assert.doesNotMatch(t1, /\b300\b/, 'a partial calorie total is not shown'); assert.match(t1, /some entries have no calories/); assert.equal(await tile().locator('[data-intake-incomplete="true"]').count(), 1)
  await noOverflow('incomplete intake at 390'); await page.screenshot({ path: '/private/tmp/intake-incomplete-390.png', fullPage: true })

  // 2. Every entry complete: the real total and macros appear.
  await setFoods([{ kcal: 300, carbs: 40, protein: 20, fat: 10 }, { kcal: 200, carbs: 20, protein: 10, fat: 5 }])
  await tile().waitFor({ timeout: 60000 }); const t2 = await tile().innerText()
  assert.match(t2, /\b500\b/); assert.match(t2, /Carbs/); assert.doesNotMatch(t2, /no calories|missing/); assert.equal(await tile().locator('[data-intake-incomplete="true"]').count(), 0)
  // 2b. Calories complete but a nutrient missing: the calories show, the macro split is withheld with a reason.
  await setFoods([{ kcal: 300, carbs: 40, protein: 20 }, { kcal: 200, carbs: 20, protein: 10, fat: 5 }])
  await tile().waitFor({ timeout: 60000 }); const t2b = await tile().innerText()
  assert.match(t2b, /\b500\b/); assert.match(t2b, /missing nutrients, so no macro split/); assert.doesNotMatch(t2b, /Carbs/)
  // 3. An explicit 0 kcal entry (water) is a real zero, not a gap.
  await setFoods([{ kcal: 0, carbs: 0, protein: 0, fat: 0 }, { kcal: 150, carbs: 20, protein: 5, fat: 3 }])
  await tile().waitFor({ timeout: 60000 }); assert.match(await tile().innerText(), /\b150\b/, 'an explicit zero does not block the total'); await noOverflow('complete intake at 390')
  assert.deepEqual(errors, [], `no page errors: ${errors.join(' | ')}`)
  console.log('intake-missing-values-check: ok')
} finally { await browser.close() }
