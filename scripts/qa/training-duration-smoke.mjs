import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
await build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {TrainingAnalyticsPanel} from './src/components/fitness/TrainingAnalyticsPanel.tsx';createRoot(document.getElementById('root')).render(<TrainingAnalyticsPanel untukKemarin={false} versi={0}/>);`, resolveDir: process.cwd(), sourcefile:'training-duration-fixture.tsx', loader:'tsx' }, bundle:true,format:'esm',jsx:'automatic',outfile:'dist/training-duration-fixture.js' })
const index=await readFile('dist/index.html','utf8')
const styles=[...index.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map(x=>x[0]).join('')
await writeFile('dist/training-duration-fixture.html',`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles}</head><body><div id="root"></div><script type="module" src="/training-duration-fixture.js"></script></body></html>`)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.TRAINING_DURATION_QA_ORIGIN || 'http://127.0.0.1:4173'
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
      if (known === 'zero') items.splice(0,1,{ id:'zero', nama:'Zero duration', mulai:now, selesai:now, durasi:0, durationSource:'source_field', hr:[], pemulihan:[] })
      if (known === true) items.push({ id:'known', nama:'Known summary', mulai:now, selesai:now, durasi:1800, durationSource:'source_field', jarakKm:3, hr:[], pemulihan:[] })
      localStorage.setItem(`pmd_workouts_v1:scope_v1:${encodeURIComponent(JSON.stringify([id,subject]))}`,JSON.stringify({version:1,ownerAccountId:id,subjectId:subject,items}))
      localStorage.setItem('panacea_onboarded_v1','1');localStorage.setItem('panacea_assessment_prompt_v1','1')
    },known)
    await page.goto(`${origin}/training-duration-fixture.html`,{waitUntil:'domcontentloaded'});await page.reload({waitUntil:'domcontentloaded'})
  }
  const panel = page.getByLabel('Automatic seven-day training summary ending today', { exact:true })
  const reveal = async () => { await panel.waitFor();await panel.scrollIntoViewIfNeeded() }
  const total = panel.getByText('Logged time',{exact:true}).locator('..')
  await open(false);await reveal()
  assert.match(await total.innerText(),/—/);assert.doesNotMatch(await total.innerText(),/30 min/)
  await panel.getByText('1 sessions missing duration',{exact:true}).waitFor()
  await open(true);await reveal();assert.match(await total.innerText(),/30 min/)
  await panel.getByText('1 sessions missing duration · partial total',{exact:true}).waitFor()
  await open('zero');await reveal();assert.match(await total.innerText(),/0 min/)
  assert.equal(await panel.getByText(/missing duration/).count(),0)
  assert.deepEqual(errors,[]);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=1)
  const evidence={ok:true,synthetic:true,actualComponentFixture:true,homeRouteIntegrationVerified:false,unknownTotalNotZero:true,partialTimeLabelled:true,explicitZeroPreserved:true,horizontalOverflowPx:overflow,clinicallyReviewed:false}
  const output=process.env.TRAINING_DURATION_QA_OUTPUT||'artifacts/training-duration';await mkdir(output,{recursive:true});await writeFile(`${output}/evidence.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
} finally {await browser.close()}
