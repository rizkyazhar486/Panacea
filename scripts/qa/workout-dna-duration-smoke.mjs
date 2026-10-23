import assert from 'node:assert/strict'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {build} from 'esbuild'
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{WorkoutDNA}from'./src/components/digital-twin/WorkoutDNA.tsx';const rows=JSON.parse(localStorage.getItem('qa.workoutDNA')||'[]');createRoot(document.getElementById('root')).render(<WorkoutDNA workouts={rows} hrMax={190}/>);`,resolveDir:process.cwd(),sourcefile:'dna-fixture.tsx',loader:'tsx'},bundle:true,format:'esm',jsx:'automatic',outfile:'dist/dna-duration-fixture.js'})
const index=await readFile('dist/index.html','utf8'),styles=[...index.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map(x=>x[0]).join('')
await writeFile('dist/dna-duration-fixture.html',`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles}</head><body><div id="root"></div><script type="module" src="/dna-duration-fixture.js"></script></body></html>`)
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'@playwright/test')
const origin=process.env.DNA_DURATION_QA_ORIGIN||'http://127.0.0.1:4173'
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>{window.__dnaCanvasTexts=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__dnaCanvasTexts.push(text);return original.call(this,text,...args)};Object.defineProperty(navigator,'share',{value:undefined,configurable:true})})
 await page.goto(`${origin}/dna-duration-fixture.html`,{waitUntil:'domcontentloaded'})
 await page.evaluate(()=>{const now=new Date().toISOString(),base={mulai:now,selesai:now,hr:[],pemulihan:[]};localStorage.setItem('qa.workoutDNA',JSON.stringify([{...base,id:'unknown',nama:'Unknown duration',durasi:1800,durationSource:'unknown'},{...base,id:'zero',nama:'Recorded zero',durasi:0,durationSource:'source_field'}]))})
 await page.reload({waitUntil:'domcontentloaded'})
 const unknown=page.locator('aside button').filter({has:page.getByText('Unknown duration',{exact:true})})
 await unknown.click();assert.match(await unknown.innerText(),/Duration unavailable/);assert.doesNotMatch(await unknown.innerText(),/30 min/)
 const endurance=page.locator('article').filter({has:page.getByText('Endurance',{exact:true})})
 assert.match(await endurance.innerText(),/—/);assert.match(await endurance.innerText(),/unavailable/i)
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Share Workout DNA',exact:true}).click();await download
 const texts=await page.evaluate(()=>window.__dnaCanvasTexts);assert.ok(texts.some(x=>x.includes('Duration unavailable')));assert.ok(!texts.some(x=>x.includes('30 min')))
 const zero=page.locator('aside button').filter({has:page.getByText('Recorded zero',{exact:true})});await zero.click();assert.match(await zero.innerText(),/0 min/)
 assert.match(await endurance.innerText(),/measured-derived/i);assert.doesNotMatch(await endurance.innerText(),/unavailable/i)
 assert.deepEqual(errors,[]);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=1)
 const evidence={ok:true,synthetic:true,actualComponentFixture:true,routeIntegrationVerified:false,unknownDurationUnavailable:true,posterDurationUnavailable:true,explicitZeroPreserved:true,horizontalOverflowPx:overflow,clinicallyReviewed:false}
 const output=process.env.DNA_DURATION_QA_OUTPUT||'artifacts/dna-duration';await mkdir(output,{recursive:true});await writeFile(`${output}/evidence.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
}finally{await browser.close()}
