// Real PerformanceVisualizationDeck; synthetic workout/vitals storage boundaries only.
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'panacea-performance-duration-'))
const out=process.env.OUT||path.join(temp,'evidence');await fs.mkdir(out,{recursive:true})
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import{PerformanceVisualizationDeck}from'${path.resolve('src/components/dashboard/PerformanceVisualizationDeck.tsx')}';window.fixtureWorkouts=[];window.setWorkouts=items=>{window.fixtureWorkouts=items;window.dispatchEvent(new Event('focus'))};createRoot(document.getElementById('root')).render(<BrowserRouter><PerformanceVisualizationDeck/></BrowserRouter>)`,loader:'tsx',resolveDir:process.cwd()},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(temp,'app.js'),plugins:[{name:'synthetic-storage-boundaries',setup(b){
 b.onResolve({filter:/\/lib\/(workoutStore|healthVitals|riwayatVitals|store)$/},args=>({path:args.path,namespace:'fixture'}))
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path.endsWith('workoutStore')?'export const getWorkouts=()=>window.fixtureWorkouts':args.path.endsWith('store')?'export const useStore=()=>({state:{gpsActivities:[]}})':args.path.endsWith('riwayatVitals')?'export const deretMetrik=()=>[]':'export const getVitals=()=>({})',loader:'js'}))
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
  const card=page.locator('article').filter({hasText:'7-day volume'});await card.waitFor()
  assert.match(await card.innerText(),/0\s*min/)
  const fixture={id:'synthetic',nama:'Synthetic run',mulai:new Date().toISOString(),durasi:1800,durationSource:'source_field',hr:[],pemulihan:[]}
  const set=async rows=>{await page.evaluate(w=>window.setWorkouts(w),rows);await page.waitForTimeout(150)}
  await set([{...fixture,durationSource:'unknown'}])
  assert.match(await card.innerText(),/—\s*known min/)
  assert.match(await card.innerText(),/Duration unavailable for 1 session/)
  const heat=page.locator('article').filter({hasText:'28-day activity heatmap'})
  assert.match(await heat.innerText(),/— known min \/ 28d/)
  const unavailable=page.locator('[title*="duration unavailable for 1 session"]')
  assert.ok(await unavailable.count()>=2)
  await set([{...fixture,durasi:0}]);assert.match(await card.innerText(),/0\s*min/)
  assert.doesNotMatch(await card.innerText(),/Duration unavailable/)
  await set([fixture]);assert.match(await card.innerText(),/30\s*min/)
  await set([{...fixture,durationSource:'timestamps',selesai:fixture.mulai}]);assert.match(await card.innerText(),/—/)
  await set([fixture,{...fixture,id:'unknown',durationSource:'unknown'}])
  assert.match(await card.innerText(),/30\s*known min/)
  assert.match(await heat.innerText(),/30 known min \/ 28d/)
  assert.match(await heat.innerText(),/1 active days/)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  assert.deepEqual(errors,[])
  await page.screenshot({path:path.join(out,`performance-${width}.png`),fullPage:true})
  results.push({width,height,unknownUnavailable:true,explicitZero:true,knownMinutes:30,partialCoverageVisible:true,timestampMismatchUnavailable:true,emptyPreserved:true,overflow:false,errors})
  await context.close()
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({scope:'actual PerformanceVisualizationDeck with synthetic storage/vitals/history boundaries; not full route or production',viewports:results},null,2))
 console.log('Performance duration: both viewports, unknown/known/zero/empty and partial coverage passed')
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
