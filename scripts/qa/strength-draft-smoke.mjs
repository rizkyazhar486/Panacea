import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.STRENGTH_QA_ORIGIN || 'http://127.0.0.1:4173'
const KEY = 'pmd_beban_v1:scope_v1:' + encodeURIComponent(JSON.stringify(['strength-test', 'self-strength-test']))
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const errors=[];page.on('pageerror', e=>errors.push(e.message))
  await page.goto(origin,{waitUntil:'domcontentloaded'})
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('panaceamed.session.v1',JSON.stringify({account:{id:'strength-test',patientId:'self-strength-test',email:'strength@localhost.test',name:'Synthetic Strength',role:'pasien',isSubscriber:false},loginAt:Date.now()}));localStorage.setItem('panacea_onboarded_v1','1');localStorage.setItem('panacea_assessment_prompt_v1','1')})
  await page.goto(`${origin}/#/latihan?t=beban`,{waitUntil:'domcontentloaded'});await page.reload({waitUntil:'domcontentloaded'})
  const reps=page.getByLabel('Reps for set 1',{exact:true});const kg=page.getByLabel('Weight for set 1 in kilograms',{exact:true});const save=page.getByRole('button',{name:'Save session',exact:true})
  await reps.waitFor();assert.equal(await reps.inputValue(),'');assert.equal(await kg.inputValue(),'')
  await page.getByLabel('Movement',{exact:true}).fill('Synthetic Squat')
  await reps.fill('0');assert.equal(await reps.inputValue(),'0','an explicit zero stays visible and is rejected by the existing positive-reps rule')
  assert.ok(await save.isDisabled())
  await reps.fill('5');await kg.fill('100')
  assert.ok(await save.isEnabled())
  await page.getByText('Volume 500 kg',{exact:true}).waitFor()
  const second=page.getByLabel('Weight for set 2 in kilograms',{exact:true})
  await second.fill('40');assert.ok(await save.isDisabled(),'a started incomplete set cannot be silently omitted')
  assert.equal(await page.getByText('Volume 500 kg',{exact:true}).count(),0)
  await second.fill('')
  for(const value of ['2.5','101']){await reps.fill(value);assert.ok(await save.isDisabled())}
  await reps.fill('5')
  for(const value of ['0','-1','1000.1','1e309']){await kg.fill(value);assert.ok(await save.isDisabled())}
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),null)
  await kg.fill('100');await save.click()
  await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)||'[]').length===1,KEY)
  const rows=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)
  assert.deepEqual(rows[0].set,[{ulangan:5,kg:100}])
  assert.equal(await reps.inputValue(),'')
  assert.deepEqual(errors,[])
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=1)
  const evidence={ok:true,synthetic:true,clientOnly:true,rawZeroVisible:true,missingNeverZero:true,partialSetRefused:true,existingBoundsPreserved:true,validVolumeKg:500,horizontalOverflowPx:overflow,clinicallyReviewed:false}
  const output=process.env.STRENGTH_QA_OUTPUT||'artifacts/strength-drafts';await mkdir(output,{recursive:true});await writeFile(`${output}/evidence.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
} finally {await browser.close()}
