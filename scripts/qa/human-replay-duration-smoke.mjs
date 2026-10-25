// Synthetic histories through the actual component/engine/poster. No device or route/auth proof.
import assert from 'node:assert/strict'
import { captureReplayMetricPanel } from './human-replay-capture.mjs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
const out = process.env.REPLAY_DURATION_QA_OUTPUT || 'artifacts/replay-duration'
await mkdir(out, { recursive: true })
await build({ stdin: { contents: `import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{HumanReplay}from'./src/components/digital-twin/HumanReplay.tsx';
const base={id:'known',nama:'Synthetic run',mulai:'2026-01-02T12:00:00Z',selesai:'2026-01-02T12:30:00Z',durasi:1800,durationSource:'source_field',jarakKm:3,kcal:100,hr:[],pemulihan:[]};
const histories={Unknown:[{...base,durationSource:'unknown',jarakKm:undefined}],Known:[base],Zero:[{...base,durasi:0,jarakKm:0}],Invalid:[{...base,durationSource:'timestamps',selesai:'2026-01-02T12:31:00Z'}],Mixed:[base,{...base,id:'missing',mulai:'2026-02-02T12:00:00Z',durationSource:'unknown',jarakKm:undefined},{...base,id:'later',mulai:'2026-03-02T12:00:00Z',durasi:900}],Empty:[]};
function Fixture(){const[key,setKey]=useState('Unknown');return <><nav aria-label="Synthetic history cases">{Object.keys(histories).map(k=><button key={k} onClick={()=>setKey(k)} style={{minHeight:44,padding:8}}>{k} history</button>)}</nav><HumanReplay workouts={histories[key]} hrMax={190}/></>};createRoot(document.getElementById('root')).render(<Fixture/>);`, resolveDir:process.cwd(), sourcefile:'replay-duration-fixture.tsx', loader:'tsx' }, bundle:true, format:'esm', jsx:'automatic', define:{'import.meta.env':JSON.stringify({BASE_URL:'/',DEV:false,PROD:true})}, outfile:'dist/replay-duration-fixture.js' })
const index=await readFile('dist/index.html','utf8'), styles=[...index.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map(x=>x[0]).join('')
await writeFile('dist/replay-duration-fixture.html',`<!doctype html><html lang="en"><head><link rel="icon" href="data:,"/><meta name="viewport" content="width=device-width,initial-scale=1">${styles}</head><body><div id="root"></div><script type="module" src="/replay-duration-fixture.js"></script></body></html>`)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.REPLAY_DURATION_QA_ORIGIN || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH}:{}), args:['--enable-unsafe-swiftshader','--use-angle=swiftshader'] })
const evidence=[]
try {
  for (const viewport of [{width:390,height:844},{width:1440,height:900}]) {
    const context=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],consoleErrors=[],failedResponses=[]
    // External font delivery is outside this deterministic fixture; exercise the system-font fallback.
    await context.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:'/* system-font fallback for isolated QA */'}))
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push({text:m.text(),location:m.location()})})
    page.on('response',r=>{if(r.status()>=400)failedResponses.push({url:r.url(),status:r.status()})})
    await page.addInitScript(()=>{window.__replayPosterText=[];window.__replayExportTelemetry={toBlobStarted:false,toBlobFinished:false,blobBytes:null,downloadClicked:false};const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(this.canvas.width===1080&&this.canvas.height===1350)window.__replayPosterText.push(text);return original.call(this,text,...args)};const encode=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback,...args){if(this.width===1080&&this.height===1350){window.__replayExportTelemetry.toBlobStarted=true;const started=performance.now();return encode.call(this,(blob)=>{window.__replayExportTelemetry.toBlobFinished=true;window.__replayExportTelemetry.blobBytes=blob?.size??null;window.__replayExportTelemetry.toBlobElapsedMs=Math.round(performance.now()-started);callback(blob)},...args)}return encode.call(this,callback,...args)};const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(...args){if(this.download==='panacea-human-replay.png')window.__replayExportTelemetry.downloadClicked=true;return click.apply(this,args)};Object.defineProperty(navigator,'share',{value:undefined,configurable:true})})
    await page.goto(`${origin}/replay-duration-fixture.html`,{waitUntil:'domcontentloaded',timeout:120000})
    await page.waitForLoadState('networkidle',{timeout:120000})
    const active=page.getByText('active min',{exact:true}).locator('..')
    const select=async name=>{await page.getByRole('button',{name:`${name} history`,exact:true}).click()}
    const distance=page.getByText('km',{exact:true}).locator('..')
    await active.waitFor()
    const canvasBox=await page.locator('section canvas').first().boundingBox(), metricBox=await active.boundingBox()
    const overlapWidth=Math.min(canvasBox.x+canvasBox.width,metricBox.x+metricBox.width)-Math.max(canvasBox.x,metricBox.x)
    const overlapHeight=Math.min(canvasBox.y+canvasBox.height,metricBox.y+metricBox.height)-Math.max(canvasBox.y,metricBox.y)
    assert.ok(overlapWidth<=1||overlapHeight<=1,'reference canvas must not cover the metric cards in either responsive layout')
    assert.match(await active.innerText(),/Unknown/);assert.match(await distance.innerText(),/Unknown/)
    await page.getByRole('note').filter({hasText:'Duration unavailable in one or more sessions.'}).waitFor()
    const poster=async expected=>{
      await page.evaluate(()=>{window.__replayPosterText=[]})
      let file
      try {
        ;[file]=await Promise.all([
          page.waitForEvent('download', { timeout: 120000 }),
          page.getByRole('button',{name:'Share this chapter',exact:true}).click({ timeout: 120000, noWaitAfter: true }),
        ])
      } catch (error) {
        const diagnostic={viewport,expected,errors,consoleErrors,failedResponses,
          posterText:await page.evaluate(()=>window.__replayPosterText),
          exportTelemetry:await page.evaluate(()=>window.__replayExportTelemetry),
          shareStatus:await page.locator('section').first().getByText(/Human Replay (?:export unavailable|poster exported|shared)/).allTextContents(),
          bodyText:await page.locator('body').innerText()}
        await writeFile(`${out}/poster-failure-${viewport.width}.json`,JSON.stringify(diagnostic,null,2))
        await page.screenshot({path:`${out}/poster-failure-${viewport.width}.png`,fullPage:true}).catch(screenshotError=>{diagnostic.screenshotError=String(screenshotError)})
        console.error(JSON.stringify(diagnostic))
        throw error
      }
      assert.ok((await page.evaluate(()=>window.__replayExportTelemetry)).blobBytes>0,'actual poster PNG Blob must contain bytes');
      await file.saveAs(`${out}/poster-${expected}-${viewport.width}.png`)
      const texts=await page.evaluate(()=>window.__replayPosterText)
      assert.ok(texts.includes(expected));assert.ok(texts.includes('ACTIVE MINUTES'))
      if(expected==='Unknown'){assert.ok(!texts.includes('30'),'unknown provenance must not become30 minutes in a share image');assert.ok(texts.filter(t=>t==='Unknown').length>=2,'missing distance also stays unknown in the poster')}
    }
    // Body 3D Render Acceptance separately verifies WebGL visual output.
    // Capture the actual metric panel: full-page WebGL screenshots stalled for
    // 90 seconds on two exact-main runs after fonts loaded. The assertions for
    // poster bytes/text, canvas-versus-metrics geometry, responsive layouts,
    // missingness, keyboard navigation and horizontal overflow remain intact.
    const metricPanel = page.locator('section > div.grid > div').last()
    assert.equal(await metricPanel.count(), 1, 'actual Human Replay metric panel must exist')
    await metricPanel.getByText('active min', { exact: true }).waitFor()
    await poster('Unknown');await captureReplayMetricPanel(page, metricPanel, `${out}/unknown-${viewport.width}.png`)
    await select('Known');assert.match(await active.innerText(),/^30\s/);assert.match(await distance.innerText(),/^3[.,]0\s/)
    await select('Zero');assert.match(await active.innerText(),/^0\s/);assert.match(await distance.innerText(),/^0[.,]0\s/);await poster('0')
    await select('Invalid');assert.match(await active.innerText(),/Unknown/)
    await select('Mixed');await page.getByText(/Cumulative: 3 sessions · Unknown active minutes/).waitFor()
    assert.match(await active.innerText(),/^15\s/)
    const comparison=page.getByText('active time',{exact:true}).locator('..');assert.match(await comparison.innerText(),/Unknown/)
    const scrubber=page.getByRole('slider',{name:'Human Replay month'});await scrubber.focus();await scrubber.press('Home')
    await page.getByText(/Cumulative: 1 sessions · 30 active minutes/).waitFor();assert.match(await active.innerText(),/^30\s/)
    await scrubber.focus();await scrubber.press('ArrowRight');await page.getByText(/Cumulative: 2 sessions · Unknown active minutes/).waitFor();assert.match(await active.innerText(),/Unknown/)
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=1)
    await captureReplayMetricPanel(page, metricPanel, `${out}/mixed-${viewport.width}.png`)
    await select('Empty');await page.getByRole('slider',{name:'Human Replay month'}).waitFor({state:'hidden'})
    if(errors.length||consoleErrors.length||failedResponses.length) {
      const failure={viewport,errors,consoleErrors,failedResponses};await writeFile(`${out}/failure-${viewport.width}.json`,JSON.stringify(failure,null,2));console.error(JSON.stringify(failure))
    }
    assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(failedResponses,[])
    evidence.push({viewport,synthetic:true,actualComponentAndEngine:true,actualPoster:true,externalFontCSSStubbed:true,referenceBodyComponentUnchanged:true,webglAcceptanceVerified:false,routeAuthOrDeviceConnectivityVerified:false,unknownAndInvalidUnavailable:true,explicitZeroPreserved:true,cumulativeAndDeltaUnknown:true,keyboardMonthNavigation:true,canvasDoesNotCoverMetrics:true,overflow,pageErrors:errors,consoleErrors,failedResponses})
    await context.close()
  }
  await writeFile(`${out}/evidence.json`,JSON.stringify(evidence,null,2));console.log('Human Replay actual component/poster: unknown/zero/mixed/cumulative/delta, keyboard, mobile/desktop passed')
} finally {await browser.close()}
