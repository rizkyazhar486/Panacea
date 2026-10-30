import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.LOGGED_CALORIE_QA_ORIGIN || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Jakarta', reducedMotion: 'reduce' })
  const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message))
  const consoleErrors = []; page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)) })
  const output = process.env.LOGGED_CALORIE_QA_OUTPUT || 'artifacts/logged-calories'
  // Intermittent CI timeout on the first Widgets fold wait (never reproduced locally in 48 throttled/parallel/software-GL/fake-clock runs).
  // The wait and its 30 s limit are unchanged and still fail the job; on failure we now keep evidence so the next occurrence is diagnosable.
  const keepFailureEvidence = async (error) => {
    try {
      await mkdir(output, { recursive: true })
      const snap = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0]
        return {
          url: location.href, readyState: document.readyState, folds: document.querySelectorAll('details.fold').length,
          hasWidgetsText: /Widgets/.test(document.body?.innerText ?? ''), bodyTextHead: (document.body?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 300),
          storageKeys: Object.keys(localStorage).sort().map(k => [k, (localStorage.getItem(k) ?? '').length]),
          navigation: nav ? { domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd), loadMs: Math.round(nav.loadEventEnd) } : null,
          hardwareConcurrency: navigator.hardwareConcurrency,
        }
      }).catch(e => ({ evaluateFailed: String(e.message).slice(0, 200) }))
      await page.screenshot({ path: `${output}/failure-fold.png` }).catch(() => {})
      await writeFile(`${output}/failure-diagnostics.json`, JSON.stringify({ at: new Date().toISOString(), error: String(error.message).split('\n')[0], snap, pageErrors: errors.slice(0, 10), consoleErrors: consoleErrors.slice(0, 10), syntheticData: true }, null, 2))
    } catch { /* evidence is best effort; the original error is still thrown */ }
  }
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  const open = async (foodValues, workoutValues) => {
    await page.evaluate(({ foodValues, workoutValues }) => {
      localStorage.clear()
      const id = 'calorie-test', subject = 'self-calorie-test', now = new Date()
      const day = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
      const account = { id, patientId: subject, email: 'calorie@localhost.test', name: 'Synthetic Calories', role: 'pasien' }
      localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
      localStorage.setItem('panaceamed.state.v3', JSON.stringify({ foods: foodValues.map((kcal, i) => ({ id: `food-${i}`, date: day, name: 'Synthetic food', grams: 100, kcal, carbs: 0, protein: 0, fat: 0 })) }))
      localStorage.setItem(`pmd_workouts_v1:scope_v1:${encodeURIComponent(JSON.stringify([id,subject]))}`, JSON.stringify({ version: 1, ownerAccountId: id, subjectId: subject, items: workoutValues.map((kcal,i) => ({ id:`workout-${i}`, nama:'Synthetic workout', mulai:now.toISOString(), selesai:now.toISOString(), durasi:0, kcal, hr:[], pemulihan:[] })) }))
      localStorage.setItem('panacea_onboarded_v1','1'); localStorage.setItem('panacea_assessment_prompt_v1','1')
      localStorage.setItem('pmd-home-widgets', JSON.stringify(['kaloriBanding']))
    }, { foodValues, workoutValues })
    await page.goto(`${origin}/#/`, { waitUntil: 'domcontentloaded' }); await page.reload({ waitUntil: 'domcontentloaded' })
    const fold = page.locator('details.fold', { has: page.getByText('Widgets', { exact: true }) }).first()
    try { await fold.waitFor({ timeout: Number(process.env.LOGGED_CALORIE_QA_FOLD_TIMEOUT_MS) || 30000 }) } catch (error) { await keepFailureEvidence(error); throw error }
    if (await fold.getAttribute('open') === null) await fold.locator('summary').click()
  }
  const food = page.locator('[data-logged-calories="Food logged"]')
  const training = page.locator('[data-logged-calories="Training calories"]')
  await open([0], [null])
  await page.getByText('Logged today', { exact: true }).waitFor({ timeout: 10000 })
  await food.waitFor({ timeout: 10000 }); assert.match(await food.innerText(), /0 kkal/)
  assert.match(await training.innerText(), /Calories unavailable/); assert.doesNotMatch(await training.innerText(), /0 kkal/)
  assert.equal(await training.locator('[aria-hidden]').count(), 0, 'an unknown total has no quantitative bar')
  await open([], [0]); await training.waitFor(); assert.match(await training.innerText(), /0 kkal/); assert.match(await food.innerText(), /Not logged/)
  await open([100, null], [50, null]); await food.waitFor()
  assert.match(await food.innerText(), /100 kkal/); assert.match(await training.innerText(), /50 kkal/)
  for (const row of [food, training]) assert.match(await row.innerText(), /Partial logged subtotal.*1 record\(s\) without usable calories\./s)
  await open([Number.MAX_VALUE, Number.MAX_VALUE], []); await food.waitFor()
  assert.match(await food.innerText(), /Total unavailable/); assert.doesNotMatch(await food.innerText(), /Infinity|NaN/)
  assert.equal(await food.locator('[aria-hidden]').count(), 0)
  assert.deepEqual(errors, [])
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert.ok(overflow <= 1)
  const evidence = { ok: true, synthetic: true, explicitZero: true, missingNotZero: true, partialSubtotalsLabelled: true, localCalendar: 'Asia/Jakarta', horizontalOverflowPx: overflow, clinicallyReviewed: false }
  await mkdir(output,{recursive:true}); await writeFile(`${output}/evidence.json`,JSON.stringify(evidence,null,2)); console.log(JSON.stringify(evidence))
} finally { await browser.close() }
