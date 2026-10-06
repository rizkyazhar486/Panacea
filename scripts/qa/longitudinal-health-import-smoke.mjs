import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH}: {})})
try {
  const page=await browser.newPage({viewport:{width:390,height:844}})
  const errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{
    localStorage.clear()
    localStorage.setItem('panaceamed.session.v1',JSON.stringify({account:{id:'qa-A',patientId:'qa-A',email:'a@localhost.test',name:'Fixture A',role:'pasien',isSubscriber:false,loggedAt:new Date().toISOString()},loginAt:Date.now()}))
    window.originalFileText=File.prototype.text
    File.prototype.text=function(){
      if(window.finishFile)return window.originalFileText.call(this)
      return new Promise(resolve=>{window.finishFile=resolve})
    }
  })
  await page.goto(`${process.env.LONGITUDINAL_QA_ORIGIN || 'http://127.0.0.1:5180'}/scripts/qa/longitudinal-health-import-fixture.html`)
  await page.getByText('My Health Data',{exact:true}).waitFor()
  const openImport=async()=>{
    const detail=page.locator('details').filter({has:page.getByText('Import',{exact:true})})
    if(!await detail.evaluate(el=>el.open))await page.getByText('Import',{exact:true}).click()
  }
  await openImport()
  const payload=JSON.stringify({data:{metrics:[{name:'resting_heart_rate',units:'bpm',data:[{qty:61,date:'2026-10-05 10:00:00 +0000'}]}],workouts:[{name:'Running',start:'2026-10-05T10:00:00Z',end:'2026-10-05T10:10:00Z',duration:600}]}})
  await page.locator('input[type=file]').first().setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(payload)})
  await page.waitForFunction(()=>typeof window.finishFile==='function')
  await page.getByText('Replace owner',{exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('[data-owner]').textContent==='qa-B')
  await page.getByText('Toggle form',{exact:true}).click()
  await page.getByText('Toggle form',{exact:true}).click()
  await page.getByText('My Health Data',{exact:true}).waitFor()
  await page.evaluate(async text=>{window.finishFile(text);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))},payload)
  assert.equal(await page.getByText(/now shared across the app/).count(),0,'old file must not update replacement form')
  assert.deepEqual(await page.evaluate(async()=> (await import('/src/lib/workoutStore.ts')).getWorkouts()),[],'old file must not write B history')
  assert.equal(await page.evaluate(async()=> (await import('/src/lib/healthVitals.ts')).getVitals().restingHr),undefined,'old file must not write B vitals')
  await page.evaluate(()=>{File.prototype.text=window.originalFileText})
  await openImport()
  await page.locator('input[type=file]').first().setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(payload)})
  await page.getByText(/now shared across the app/).waitFor()
  assert.equal((await page.evaluate(async()=> (await import('/src/lib/workoutStore.ts')).getWorkouts())).length,1,'fresh B import remains functional')
  const beforeRenewal=await page.evaluate(async()=> (await import('/src/lib/workoutStore.ts')).getWorkouts())
  await page.evaluate(()=>{
    window.finishFile=null
    File.prototype.text=function(){
      if(window.finishFile)return window.originalFileText.call(this)
      return new Promise(resolve=>{window.finishFile=resolve})
    }
  })
  await page.locator('input[type=file]').first().setInputFiles({name:'renewal.json',mimeType:'application/json',buffer:Buffer.from(payload.replace('Running','Cycling'))})
  await page.waitForFunction(()=>typeof window.finishFile==='function')
  await page.evaluate(async text=>{
    const session=JSON.parse(localStorage.getItem('panaceamed.session.v1'))
    session.loginAt-=1
    localStorage.setItem('panaceamed.session.v1',JSON.stringify(session))
    window.finishFile(text)
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))
  },payload.replace('Running','Cycling'))
  assert.deepEqual(await page.evaluate(async()=> (await import('/src/lib/workoutStore.ts')).getWorkouts()),beforeRenewal,'same-owner renewal must reject late file without unmounting')
  await page.evaluate(()=>{File.prototype.text=window.originalFileText})
  await page.evaluate(async()=>{
    window.visionCalls=0
    const {api}=await import('/src/lib/api.ts')
    api.aiVision=async()=>{window.visionCalls++;return {text:'Fixture image'}}
    FileReader.prototype.readAsDataURL=function(){window.delayedImage=this}
  })
  await page.locator('input[type=file]').first().setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from('fixture')})
  await page.waitForFunction(()=>!!window.delayedImage)
  await page.evaluate(async()=>{
    localStorage.setItem('pmd-token','fixture-renewed-token')
    Object.defineProperty(window.delayedImage,'result',{value:'data:image/png;base64,Zml4dHVyZQ=='})
    window.delayedImage.onload(new Event('load'))
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))
  })
  assert.equal(await page.evaluate(()=>window.visionCalls),0,'delayed image must not initiate replacement-session AI upload')
  assert.deepEqual(errors,[])
  console.log('Real HealthProfile: delayed cross-owner file/unmount rejected, current file imported, delayed image upload blocked')
} finally {await browser.close()}
