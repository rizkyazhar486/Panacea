// Real ActivityAchievementWidget; synthetic workout storage boundary only.
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'panacea-achievement-duration-'))
const out=process.env.OUT||path.join(temp,'evidence');await fs.mkdir(out,{recursive:true})
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import{ActivityAchievementWidget}from'${path.resolve('src/components/dashboard/ActivityAchievementWidget.tsx')}';window.fixtureWorkouts=JSON.parse(localStorage.getItem('qa.workouts')||'[]');createRoot(document.getElementById('root')).render(<BrowserRouter><ActivityAchievementWidget/></BrowserRouter>)`,loader:'tsx',resolveDir:process.cwd()},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(temp,'app.js'),plugins:[{name:'synthetic-storage-boundaries',setup(b){
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
  const card=page.locator('[title="One session reaches 60 minutes"]')
  await card.waitFor();assert.match(await card.innerText(),/0\/60 min/)
  const fixture={id:'synthetic',nama:'Synthetic run',mulai:new Date().toISOString(),durasi:3600,durationSource:'source_field'}
  const set=async extra=>{await page.evaluate(w=>localStorage.setItem('qa.workouts',JSON.stringify([w])),{...fixture,...extra});await page.reload({waitUntil:'load'});await card.waitFor()}
  await set({durationSource:'unknown',durasi:30000});assert.match(await card.innerText(),/0\/60 min/)
  await set({});assert.match(await card.innerText(),/Unlocked/)
  await set({durasi:1800});assert.match(await card.innerText(),/30\/60 min/)
  await set({durasi:0});assert.match(await card.innerText(),/0\/60 min/)
  await set({durationSource:'timestamps',selesai:fixture.mulai});assert.match(await card.innerText(),/0\/60 min/)
  const link=page.getByRole('link',{name:'Open workouts →',exact:true})
  await link.focus();assert.equal(await link.evaluate(el=>el===document.activeElement),true)
  assert.equal(await link.getAttribute('href'),'/workout')
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  assert.deepEqual(errors,[])
  await page.screenshot({path:path.join(out,`achievement-${width}.png`),fullPage:true})
  results.push({width,height,unknownCannotUnlock:true,knownUnlocksAt60Minutes:true,partialProgress:30,zeroEarnsNoTime:true,timestampMismatchCannotUnlock:true,emptyProgress:0,keyboardLink:true,overflow:false,errors})
  await context.close()
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({scope:'actual ActivityAchievementWidget mounted per synthetic storage scenario; not full Home route, refresh or production',viewports:results},null,2))
 console.log('Achievement duration: both viewports, unknown/known/zero/empty/timestamp rejection and keyboard passed')
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
