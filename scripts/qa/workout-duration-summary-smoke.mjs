import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.WORKOUT_SUMMARY_QA_ORIGIN || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }), errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  const open = async known => {
    await page.evaluate(known => {
      localStorage.clear()
      const id = 'summary-test', subject = 'self-summary-test', now = new Date().toISOString()
      localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: { id, patientId: subject, email: 'summary@localhost.test', role: 'pasien', name: 'Synthetic Summary' }, loginAt: Date.now() }))
      const items = [{ id:'unknown', nama:'Unknown summary', mulai:now, selesai:now, durasi:1800, durationSource:'unknown', jarakKm:3, hr:[], pemulihan:[] }]
      if (known) items.push({ id:'known', nama:'Known summary', mulai:now, selesai:now, durasi:1800, durationSource:'source_field', jarakKm:3, hr:[], pemulihan:[] })
      localStorage.setItem(`pmd_workouts_v1:scope_v1:${encodeURIComponent(JSON.stringify([id,subject]))}`,JSON.stringify({version:1,ownerAccountId:id,subjectId:subject,items}))
      localStorage.setItem('panacea_onboarded_v1','1');localStorage.setItem('panacea_assessment_prompt_v1','1')
    },known)
    await page.goto(`${origin}/#/fitness-hub?view=workout`,{waitUntil:'domcontentloaded'});await page.reload({waitUntil:'domcontentloaded'})
  }
  await open(false)
  const total = page.getByText('Logged time',{exact:true}).locator('..')
  await total.waitFor(); assert.match(await total.innerText(),/—/);assert.doesNotMatch(await total.innerText(),/30 menit/)
  await page.getByText('1 session(s) without known duration.',{exact:true}).waitFor()
  await open(true);await total.waitFor();assert.match(await total.innerText(),/30 menit/)
  await page.getByText('Partial logged time. 1 session(s) without known duration.',{exact:true}).waitFor()
  assert.deepEqual(errors,[]);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=1)
  const evidence={ok:true,synthetic:true,unknownTotalNotZero:true,partialTimeLabelled:true,horizontalOverflowPx:overflow,clinicallyReviewed:false}
  const output=process.env.WORKOUT_SUMMARY_QA_OUTPUT||'artifacts/workout-duration-summary';await mkdir(output,{recursive:true});await writeFile(`${output}/evidence.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
} finally {await browser.close()}
