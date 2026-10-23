import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.JETLAG_QA_ORIGIN || 'http://127.0.0.1:4173'
const output = process.env.JETLAG_QA_OUTPUT || 'artifacts/jetlag-inputs'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
const session = id => ({ account: { id, patientId: `self-${id}`, email: `${id}@localhost.test`, name: id, role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString() }, loginAt: Date.now() })
const key = id => `pmd_jetlag_v1:scope_v1:${encodeURIComponent(JSON.stringify([id, `self-${id}`]))}`
try {
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'})
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto(origin,{waitUntil:'domcontentloaded'})
 await page.evaluate(({s,k})=>{localStorage.clear();localStorage.setItem('panaceamed.session.v1',JSON.stringify(s));localStorage.setItem('pmd-home-widgets',JSON.stringify(['jetlag']));localStorage.setItem('panacea_onboarded_v1','1');localStorage.setItem('panacea_assessment_prompt_v1','1');localStorage.setItem('pmd_jetlag_v1',JSON.stringify({selisih:'Infinity',tanggal:'2026-02-31'}));localStorage.setItem(k,JSON.stringify({selisih:'Infinity',tanggal:'2026-02-31'}))},{s:session('jetlag-a'),k:key('jetlag-a')})
 await page.goto(`${origin}/#/`,{waitUntil:'domcontentloaded'});await page.reload({waitUntil:'domcontentloaded'})
 const hours=page.getByLabel('Destination hour difference',{exact:true});const date=page.getByLabel('Departure date',{exact:true})
 async function openWidget(){await hours.waitFor({state:'attached'});const closed=hours.locator('xpath=ancestor::details[not(@open)]');if(await closed.count())await closed.first().locator('summary').first().click();await hours.waitFor()}
 await openWidget()
 const widget=hours.locator('xpath=ancestor::section[1]')
 assert.equal(await hours.inputValue(),'','invalid saved hours must remain unknown')
 assert.equal(await date.inputValue(),'','impossible saved calendar date rejected')
 assert.equal(await widget.getByText(/Infinity|NaN/).count(),0)
 await hours.selectOption('0');assert.equal(await hours.inputValue(),'0')
 await hours.selectOption('8');await widget.getByText('8',{exact:true}).waitFor()
 await page.evaluate(s=>localStorage.setItem('panaceamed.session.v1',JSON.stringify(s)),session('jetlag-b'))
 await page.reload({waitUntil:'domcontentloaded'});await openWidget();assert.equal(await hours.inputValue(),'','B must not see A plan')
 const other=await context.newPage();await other.goto(origin,{waitUntil:'domcontentloaded'});await other.evaluate(s=>localStorage.setItem('panaceamed.session.v1',JSON.stringify(s)),session('jetlag-a'))
 await page.getByText('Session changed. Reopen this page after signing in.',{exact:true}).waitFor()
 await page.reload({waitUntil:'domcontentloaded'});await openWidget();assert.equal(await hours.inputValue(),'8')
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pmd_jetlag_v1')).selisih),'Infinity','legacy bytes retained without adoption')
 assert.deepEqual(errors,[])
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=1)
 const evidence={ok:true,synthetic:true,clientOnly:true,invalidCacheUnknown:true,calendarChecked:true,explicitZero:true,accountIsolation:true,crossTabMismatchBlocked:true,legacyPreserved:true,horizontalOverflowPx:overflow,clinicallyReviewed:false}
 await mkdir(output,{recursive:true});await writeFile(`${output}/evidence.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
} finally {await browser.close()}
