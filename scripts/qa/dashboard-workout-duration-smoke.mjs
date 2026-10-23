// Real LifeOSWidgets; synthetic workout/vitals storage boundaries only.
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'panacea-dashboard-duration-'))
const out=process.env.OUT||path.join(temp,'evidence');await fs.mkdir(out,{recursive:true})
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import{LifeOSWidgets}from'${path.resolve('src/components/dashboard/LifeOSWidgets.tsx')}';window.fixtureWorkouts=[];window.setWorkouts=items=>{window.fixtureWorkouts=items;window.dispatchEvent(new Event('focus'))};createRoot(document.getElementById('root')).render(<BrowserRouter><LifeOSWidgets/></BrowserRouter>)`,loader:'tsx',resolveDir:process.cwd()},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(temp,'app.js'),plugins:[{name:'synthetic-storage-boundaries',setup(b){
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
  const card=page.locator('a[href="/latihan"]');await card.waitFor()
  assert.ok((await card.innerText()).includes('Run · strength · mobility · recovery'))
  const fixture={id:'synthetic',nama:'Synthetic run',mulai:new Date().toISOString(),durasi:1800,durationSource:'source_field'}
  const set=async extra=>{await page.evaluate(w=>window.setWorkouts([w]),{...fixture,...extra});await page.waitForTimeout(100)}
  await set({durationSource:'unknown'});assert.ok((await card.innerText()).includes('—'));assert.ok(!(await card.innerText()).includes('30 min'))
  await set({durasi:0});assert.ok((await card.innerText()).includes('0 min'))
  await set({});assert.ok((await card.innerText()).includes('30 min'))
  await set({durationSource:'timestamps',selesai:fixture.mulai});assert.ok((await card.innerText()).includes('—'))
  await card.focus();assert.equal(await card.evaluate(el=>el===document.activeElement),true)
  assert.equal(await card.getAttribute('href'),'/latihan')
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  assert.deepEqual(errors,[])
  await page.screenshot({path:path.join(out,`dashboard-${width}.png`),fullPage:true})
  results.push({width,height,unknownUnavailable:true,explicitZero:'0 min',known:'30 min',timestampMismatchUnavailable:true,emptyPreserved:true,keyboardLink:true,overflow:false,errors})
  await context.close()
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({scope:'actual LifeOSWidgets with synthetic storage/vitals boundaries; not full Home route or production',viewports:results},null,2))
 console.log('Life OS duration: both viewports, unknown/known/zero/empty/timestamp rejection and keyboard passed')
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
