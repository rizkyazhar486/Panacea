// Real TrainingSessionCockpit; synthetic workout/vitals storage boundaries only.
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'panacea-session-duration-'))
const out=process.env.OUT||path.join(temp,'evidence');await fs.mkdir(out,{recursive:true})
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{TrainingSessionCockpit}from'${path.resolve('src/components/fitness/TrainingSessionCockpit.tsx')}';const root=createRoot(document.getElementById('root'));window.setWorkout=workout=>root.render(<TrainingSessionCockpit workout={workout} nextTitle="Synthetic next session" nextWhen="Fixture only" nextColor="#00BF63"/>);window.setWorkout({mulai:new Date().toISOString(),nama:'Synthetic session',durasi:0,durationSource:'unknown',pemulihan:[]})`,loader:'tsx',resolveDir:process.cwd()},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(temp,'app.js'),plugins:[{name:'synthetic-sync-boundary',setup(b){
 b.onResolve({filter:/\/lib\/autoIsi$/},args=>({path:args.path,namespace:'fixture'}))
 b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:"export const getAutoSyncStatus=()=>({state:'offline'})",loader:'js'}))
}}]})
const assets=path.resolve(process.env.BUILD_DIR||'dist','assets')
const styles=(await fs.readdir(assets)).filter(n=>n.endsWith('.css'));assert.ok(styles.length)
const css=(await Promise.all(styles.map(n=>fs.readFile(path.join(assets,n),'utf8')))).join('\n')
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="margin:0;background:#000"><main id="root" style="max-width:1100px;margin:auto"></main><script type="module" src="/app.js"></script></body></html>'
const server=http.createServer(async(req,res)=>{
 try {if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(await fs.readFile(path.join(temp,'app.js')))}else if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css)}else{res.setHeader('Content-Type','text/html');res.end(html)}}
 catch{res.statusCode=500;res.end('fixture failure')}
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,headless:true,args:['--no-sandbox','--disable-gpu']})
const results=[]
try {
 for(const [width,height]of [[390,844],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'load'})
  const section=page.getByRole('region',{name:'Synchronized training session cockpit'});await section.waitFor()
  const recorded=section.locator('div.relative.overflow-hidden.rounded-2xl').filter({hasText:'Recorded'})
  const fixture={id:'synthetic',nama:'Synthetic session',mulai:new Date().toISOString(),durasi:1800,durationSource:'source_field',pemulihan:[]}
  const set=async extra=>{await page.evaluate(w=>window.setWorkout(w),{...fixture,...extra});await page.waitForTimeout(100)}
  await set({durationSource:'unknown'})
  assert.match(await recorded.innerText(),/No signal/);assert.match(await recorded.innerText(),/Duration unavailable/)
  assert.doesNotMatch(await recorded.innerText(),/30 min/)
  await set({durasi:0});assert.match(await recorded.innerText(),/0 min/)
  await set({});assert.match(await recorded.innerText(),/30 min/)
  await set({durationSource:'timestamps',selesai:fixture.mulai});assert.match(await recorded.innerText(),/Duration unavailable/)
  await set({durationSource:'unknown',avgHr:125,maxHr:160,rpe:5,paceSec:360,jarakKm:3})
  assert.match(await recorded.innerText(),/125 bpm/);assert.match(await recorded.innerText(),/Duration unavailable/)
  assert.match(await section.innerText(),/RPE 5\/10/);assert.match(await section.innerText(),/6:00\/km/)
  assert.match(await section.innerText(),/Offline · local data/)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  assert.deepEqual(errors,[])
  await page.screenshot({path:path.join(out,`session-${width}.png`),fullPage:true})
  results.push({width,height,unknownUnavailable:true,explicitZero:true,knownMinutes:30,timestampMismatchUnavailable:true,independentSignalsPreserved:true,overflow:false,errors})
  await context.close()
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({scope:'actual TrainingSessionCockpit with synthetic workout prop and sync boundary; not authenticated route or production',viewports:results},null,2))
 console.log('Session duration: both viewports, unknown/known/zero and independent signals passed')
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
