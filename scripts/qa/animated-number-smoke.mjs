import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const component = process.env.ANIMATION_QA_COMPONENT || resolve('src/components/ui/AnimatedNumber.tsx')
const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: `
import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatedNumber } from ${JSON.stringify(component)}
function Fixture(){const [value,setValue]=useState(100);const [identity,setIdentity]=useState('a');return <>
<output id="value"><AnimatedNumber key={identity} v={value}/></output>
<button onClick={()=>setValue(200)}>200</button><button onClick={()=>setValue(0)}>zero</button>
<button onClick={()=>setValue(NaN)}>unknown</button><button onClick={()=>setValue(Infinity)}>infinity</button><button onClick={()=>setValue(300)}>300</button>
<button onClick={()=>{setIdentity('b');setValue(50)}}>switch subject</button>
</>};createRoot(document.getElementById('root')).render(<Fixture/>);
` }, bundle: true, write: false, jsx: 'automatic', format: 'iife', platform: 'browser', nodePaths: [resolve('node_modules')], define: { 'process.env.NODE_ENV': '"production"' } })
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const page = await browser.newPage({ reducedMotion: 'no-preference' })
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.setContent('<div id="root"></div>')
  await page.addScriptTag({ content: bundle.outputFiles[0].text })
  await page.getByRole('button', { name: '200', exact: true }).waitFor()
  assert.equal(await page.locator('#value').innerText(), '100')
  await page.evaluate(() => {
    window.samples = []
    new MutationObserver(() => window.samples.push(document.getElementById('value').textContent)).observe(document.getElementById('value'), { childList: true, characterData: true, subtree: true })
  })
  await page.getByRole('button', { name: '200', exact: true }).click()
  await page.waitForFunction(() => document.getElementById('value').textContent === '200')
  const samples = await page.evaluate(() => window.samples)
  assert.ok(samples.some(s => Number(s) > 100 && Number(s) < 200), 'real numeric intermediate frames must survive React target rendering')
  assert.ok(samples.every(s => Number(s) >= 100 && Number(s) <= 200))
  await page.getByRole('button', { name: 'unknown', exact: true }).click()
  assert.equal(await page.locator('#value').innerText(), '—', 'nonfinite input is unavailable, never NaN or inferred zero')
  await page.getByRole('button', { name: 'infinity', exact: true }).click()
  assert.equal(await page.locator('#value').innerText(), '—')
  await page.getByRole('button', { name: 'zero', exact: true }).click()
  assert.equal(await page.locator('#value').innerText(), '0', 'explicit zero is valid without a fabricated start value')
  await page.getByRole('button', { name: '300', exact: true }).click()
  await page.getByRole('button', { name: 'switch subject', exact: true }).click()
  assert.equal(await page.locator('#value').innerText(), '50', 'keyed subject change cannot animate through previous subject values')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: '200', exact: true }).click()
  assert.equal(await page.locator('#value').innerText(), '200', 'reduced motion settles immediately')
  assert.deepEqual(errors, [])
  const evidence = { ok: true, componentOnly: true, synthetic: true, actualComponentBundled: true, intermediateFrames: true, unknownNotZero: true, explicitZero: true, subjectReset: true, reducedMotion: true, clinicallyReviewed: false }
  const output = process.env.ANIMATION_QA_OUTPUT || 'artifacts/animated-number'
  await mkdir(output, { recursive: true })
  await writeFile(`${output}/evidence.json`, JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify(evidence))
} finally { await browser.close() }
