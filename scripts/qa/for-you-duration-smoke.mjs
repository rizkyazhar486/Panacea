// Actual source RankCard + hook, synthetic workout storage boundary; not a live account/device test.
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const source=await fs.readFile('src/components/foryou/ForYouOmniFeed.tsx','utf8')
const hooks=source.slice(source.indexOf('function readHealth'),source.indexOf('function matchesMode'))
const card=source.slice(source.indexOf('function RankCard()'),source.indexOf('function CommunityCard()'))
assert.ok(hooks.includes('rankedWorkoutsFromStored') && card.includes('useSeasonRank()'))
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'panacea-for-you-rank-'))
const out=process.env.OUT || path.join(temp,'evidence');await fs.mkdir(out,{recursive:true})
const entry=`import React,{useState,useMemo,useEffect} from 'react';
import {createRoot} from 'react-dom/client';import {BrowserRouter,Link} from 'react-router-dom';
import {calculateSeasonalRank} from '${path.resolve('src/lib/seasonalHealthSportRank.ts')}';
import {rankedWorkoutsFromStored} from '${path.resolve('src/domains/personal-health/index.ts')}';
let workouts=[];const getWorkouts=()=>workouts;const recordAffectEvent=()=>{};
${hooks}\n${card}
window.setWorkouts=items=>{workouts=items;window.dispatchEvent(new Event('storage'))};
createRoot(document.getElementById('root')).render(<BrowserRouter><RankCard/></BrowserRouter>);`
await build({stdin:{contents:entry,loader:'tsx',resolveDir:process.cwd()},bundle:true,format:'esm',outfile:path.join(temp,'card.js'),jsx:'automatic'})
const cssDir=path.resolve(process.env.BUILD_DIR||'dist','assets')
const cssFiles=(await fs.readdir(cssDir)).filter(n=>n.endsWith('.css'))
assert.ok(cssFiles.length,'build CSS must exist')
const css=(await Promise.all(cssFiles.map(n=>fs.readFile(path.join(cssDir,n),'utf8')))).join('\n')
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="background:#000;margin:0"><main id="root" style="max-width:420px;margin:auto"></main><script type="module" src="/card.js"></script></body></html>'
const server=http.createServer(async(req,res)=>{
 try {
  if(req.url==='/card.js'){res.setHeader('Content-Type','text/javascript');res.end(await fs.readFile(path.join(temp,'card.js')))}
  else if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css)}
  else{res.setHeader('Content-Type','text/html');res.end(html)}
 }catch{res.statusCode=500;res.end('fixture error')}
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const base=`http://127.0.0.1:${server.address().port}`
const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,headless:true,args:['--no-sandbox','--disable-gpu']})
const results=[]
try{
 for(const [width,height] of [[390,844],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(base,{waitUntil:'load'})
  await page.getByText('Ranked Season',{exact:true}).waitFor()
  const stars=()=>page.locator('a').getByText(/^★ \d+\.\d+$/).textContent()
  const fixture={id:'synthetic',mulai:new Date().toISOString(),durasi:1800,durationSource:'source_field',kcal:280}
  const set=async items=>{await page.evaluate(items=>window.setWorkouts(items),items);await page.waitForTimeout(100)}
  assert.equal((await stars()).trim(),'★ 0.00')
  await set([fixture]);const known=(await stars()).trim();assert.notEqual(known,'★ 0.00')
  for(const extra of [{durationSource:'unknown'},{durasi:0},{durationSource:'timestamps',selesai:fixture.mulai}]){
   await set([{...fixture,...extra}]);assert.equal((await stars()).trim(),'★ 0.00')
  }
  await set([fixture,{...fixture,id:'unknown',durationSource:'unknown'}]);assert.equal((await stars()).trim(),known)
  await page.evaluate(()=>localStorage.setItem('pmd_health_profile','{invalid'))
  await set([]);assert.equal((await stars()).trim(),'★ 0.00')
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.tagName),'A')
  assert.equal(await page.locator('a').getAttribute('href'),'/fitness-hub?view=ranked')
  assert.deepEqual(errors,[])
  await page.screenshot({path:path.join(out,`rank-${width}.png`),fullPage:true})
  results.push({width,height,knownStars:known,emptyUnknownZeroInconsistent:0,mixedMatchesKnown:true,overflow:false,keyboardLink:true,errors})
  await context.close()
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({scope:'actual extracted RankCard/hooks, synthetic storage only; not full app route or device proof',viewports:results},null,2))
 console.log('For You duration provenance: actual RankCard passes both viewports, data/empty/invalid/mixed cases and keyboard link')
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
