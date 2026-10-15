// Real TrainingAnalyticsPanel; synthetic workout storage boundary only.
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'panacea-rpe-coverage-'))
const out=process.env.OUT||path.join(temp,'evidence');await fs.mkdir(out,{recursive:true})
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import{TrainingAnalyticsPanel}from'${path.resolve('src/components/fitness/TrainingAnalyticsPanel.tsx')}';window.fixtureWorkouts=[];function Fixture(){const[version,setVersion]=React.useState(0);window.setWorkouts=items=>{window.fixtureWorkouts=items;setVersion(v=>v+1)};return <TrainingAnalyticsPanel untukKemarin={false} versi={version}/>};createRoot(document.getElementById('root')).render(<BrowserRouter><Fixture/></BrowserRouter>)`,loader:'tsx',resolveDir:process.cwd()},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(temp,'app.js'),plugins:[{name:'synthetic-storage-boundaries',setup(b){
 b.onResolve({filter:/\/lib\/(workoutStore|healthVitals)$/},args=>({path:args.path,namespace:'fixture'}))
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path.endsWith('workoutStore')?'export const getWorkouts=()=>window.fixtureWorkouts':'export const getVitals=()=>({});export const vitalsAge=()=>null',loader:'js'}))
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
  const rpe=page.locator('[aria-label^="RPE:"]'),duration=page.locator('[aria-label^="Duration:"]')
  await page.waitForFunction(()=>typeof window.setWorkouts==='function')
  assert.equal(await rpe.count(),0)
  const fixture={id:'known',nama:'Synthetic run',mulai:new Date().toISOString(),durasi:1800,durationSource:'source_field',rpe:5,hr:[],pemulihan:[]}
  const set=async rows=>{await page.evaluate(w=>window.setWorkouts(w),rows);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[])}
  await set([fixture,{...fixture,id:'unknown',durationSource:'unknown'}])
  assert.match(await rpe.innerText(),/2\/2/);assert.match(await duration.innerText(),/1\/2/)
  await page.screenshot({path:path.join(out,`mixed-rpe-${width}.png`),fullPage:true})
  await set([{...fixture,durationSource:'unknown'}])
  assert.match(await rpe.innerText(),/1\/1/);assert.match(await duration.innerText(),/0\/1/)
  await set([{...fixture,durasi:0}])
  assert.match(await rpe.innerText(),/1\/1/);assert.match(await duration.innerText(),/1\/1/)
  for(const value of [undefined,0,11]){await set([{...fixture,rpe:value}]);assert.match(await rpe.innerText(),/0\/1/)}
  await set([]);assert.equal(await rpe.count(),0)
  results.push({width,height,reportedRpeIndependentOfDuration:true,mixedRpe:'2/2',mixedDuration:'1/2',unknownDuration:'0/1',zeroDuration:'1/1',invalidRpeExcluded:true,emptyPreserved:true,overflow:false,errors})
  await context.close()
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({scope:'actual TrainingAnalyticsPanel with synthetic workout storage and parent-version refresh; not full route, source measurement accuracy or production',viewports:results},null,2))
 console.log('Reported RPE: both viewports, independent duration coverage, explicit zero, invalid and empty states passed')
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
