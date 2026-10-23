import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.WORKOUT_DURATION_QA_ORIGIN || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  const open = async rows => {
    await page.evaluate(rows => {
      localStorage.clear()
      const id = 'duration-test', subject = 'self-duration-test', now = Date.now() - 60000
      localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: { id, patientId: subject, email: 'duration@localhost.test', role: 'pasien', name: 'Synthetic Duration' }, loginAt: Date.now() }))
      const items = rows.map((row,i) => {
        const start = now - (row.daysAgo || 0) * 864e5
        return { id: `workout-${i}`, nama: 'Synthetic workout', mulai: new Date(start).toISOString(), selesai: new Date(start).toISOString(), kcal: 300, hr: [], pemulihan: [], ...row }
      })
      localStorage.setItem(`pmd_workouts_v1:scope_v1:${encodeURIComponent(JSON.stringify([id,subject]))}`, JSON.stringify({ version: 1, ownerAccountId: id, subjectId: subject, items }))
      localStorage.setItem('pmd-home-widgets', JSON.stringify(['muatanPekan']))
      localStorage.setItem('panacea_onboarded_v1','1'); localStorage.setItem('panacea_assessment_prompt_v1','1')
    }, rows)
    await page.goto(`${origin}/#/`, { waitUntil: 'domcontentloaded' }); await page.reload({ waitUntil: 'domcontentloaded' })
    const fold = page.locator('details.fold', { has: page.getByText('Widgets', { exact: true }) }).first()
    await fold.waitFor(); if (await fold.getAttribute('open') === null) await fold.locator('summary').click()
  }
  const card = page.getByText('Training minutes per week', { exact: true }).locator('..').locator('..')
  await open([{ durasi: 0, durationSource: 'unknown' }, { durasi: 1800, daysAgo: 8 }])
  await page.getByText('Duration unavailable for this week.', { exact: true }).waitFor({ timeout: 10000 })
  assert.doesNotMatch(await card.innerText(), /\b0\s+minutes this week/)
  await open([{ durasi: 0, durationSource: 'source_field' }]); await card.waitFor()
  assert.match(await card.innerText(), /\b0\s+minutes this week/); assert.doesNotMatch(await card.innerText(), /Duration unavailable/)
  await open([{ durasi: 1800, durationSource: 'source_field' }, { durasi: 0, durationSource: 'unknown' }, { durasi: 0 }]); await card.waitFor()
  assert.match(await card.innerText(), /\b30\s+minutes this week/); assert.match(await card.innerText(), /Partial logged subtotal.*2 session\(s\)/s)
  await page.goto(`${origin}/#/fitness-hub?view=ranked`, { waitUntil: 'domcontentloaded' })
  await page.getByText('2 workouts without a known positive duration are not ranked.', { exact: true }).waitFor()
  assert.match(await page.locator('body').innerText(), /\/1 calorie-recorded efforts/)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert.ok(overflow <= 1)
  assert.deepEqual(errors, [])
  const evidence = { ok: true, synthetic: true, unknownNeverZero: true, explicitZeroPreserved: true, partialDurationLabelled: true, unknownExcludedFromLeague: true, horizontalOverflowPx: overflow, clinicallyReviewed: false }
  const output = process.env.WORKOUT_DURATION_QA_OUTPUT || 'artifacts/workout-duration'; await mkdir(output,{recursive:true}); await writeFile(`${output}/evidence.json`,JSON.stringify(evidence,null,2)); console.log(JSON.stringify(evidence))
} finally { await browser.close() }
