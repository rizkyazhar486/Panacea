import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.WORKOUT_LABEL_QA_ORIGIN || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.clear()
    const id = 'duration-label-test', subject = 'self-duration-label-test', now = new Date().toISOString()
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: { id, patientId: subject, email: 'labels@localhost.test', name: 'Synthetic Labels', role: 'pasien' }, loginAt: Date.now() }))
    localStorage.setItem(`pmd_workouts_v1:scope_v1:${encodeURIComponent(JSON.stringify([id,subject]))}`, JSON.stringify({ version: 1, ownerAccountId: id, subjectId: subject, items: [
      { id: 'unknown', nama: 'Unknown duration detail', mulai: now, selesai: now, durasi: 0, durationSource: 'unknown', hr: [], pemulihan: [] },
      { id: 'zero', nama: 'Recorded zero detail', mulai: now, selesai: now, durasi: 0, durationSource: 'source_field', hr: [], pemulihan: [] },
    ] }))
    localStorage.setItem('panacea_onboarded_v1','1'); localStorage.setItem('panacea_assessment_prompt_v1','1')
  })
  await page.goto(`${origin}/#/fitness-hub?view=workout`, { waitUntil: 'domcontentloaded' }); await page.reload({ waitUntil: 'domcontentloaded' })
  const unknown = page.getByRole('button', { name: /Unknown duration detail/ })
  await unknown.waitFor()
  await unknown.getByText('—', { exact: true }).waitFor({ timeout: 10000 })
  assert.doesNotMatch(await unknown.innerText(), /0 menit/)
  await page.getByRole('button', { name: /Recorded zero detail/ }).getByText('0 menit', { exact: true }).waitFor()
  assert.deepEqual(errors, [])
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert.ok(overflow <= 1)
  const evidence = { ok: true, synthetic: true, unknownNotZero: true, explicitZeroPreserved: true, horizontalOverflowPx: overflow, clinicallyReviewed: false }
  const output = process.env.WORKOUT_LABEL_QA_OUTPUT || 'artifacts/workout-duration-labels'; await mkdir(output,{recursive:true}); await writeFile(`${output}/evidence.json`,JSON.stringify(evidence,null,2)); console.log(JSON.stringify(evidence))
} finally { await browser.close() }
