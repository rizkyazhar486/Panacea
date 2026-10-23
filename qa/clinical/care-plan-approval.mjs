// Actual component + actual HTTP/file-backed API; synthetic identities only.
// Component fixture does not certify production route wiring or the complete F1 journey.
import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { build } from 'esbuild'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises'
import { startIsolatedServer } from '../../server/uji/support/isolatedServer.ts'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const port = await new Promise((resolve, reject) => { const s = createServer(); s.on('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)) }) })
const web = `http://127.0.0.1:${port}`
const previousCors = process.env.CORS_ORIGINS
process.env.CORS_ORIGINS = web
const server = await startIsolatedServer('care-plan-browser', 'care-browser-owner@localhost.test')
let vite; let browser; const results = []
const out = process.env.CARE_APPROVAL_QA_OUTPUT || 'artifacts/care-plan-approval'
try {
  const { call } = server
  const login = async (email, role) => (await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })).body
  const owner = await login('care-browser-owner@localhost.test', 'pasien')
  const rawDoctor = await login('care-browser-doctor@localhost.test', 'dokter')
  assert.equal((await call('POST', `/api/doctors/${rawDoctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const doctor = await login('care-browser-doctor@localhost.test', 'dokter')
  const entry = (await readFile('qa/clinical/care-plan.tsx', 'utf8')).replace("import '../../src/index.css'", '')
  const compile = () => build({ stdin: { contents: entry, loader: 'tsx', resolveDir: resolve('qa/clinical') }, bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': JSON.stringify({ DEV: true, VITE_API_URL: server.origin }) } })
  let built = await compile()
  const cssFiles = (await readdir('dist/assets')).filter(n => /^index-.*\.css$/.test(n))
  assert.equal(cssFiles.length, 1, 'one CSS artifact from the application build is required')
  const css = await readFile(`dist/assets/${cssFiles[0]}`)
  vite = createHttpServer((req, res) => {
    const path = new URL(req.url, web).pathname
    if (path === '/bundle.js') { res.setHeader('content-type', 'text/javascript'); res.end(built.outputFiles[0].contents) }
    else if (path === '/style.css') { res.setHeader('content-type', 'text/css'); res.end(css) }
    else { res.setHeader('content-type', 'text/html'); res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>') }
  })
  await new Promise((resolve, reject) => { vite.once('error', reject); vite.listen(port, '127.0.0.1', resolve) })
  for (let i = 0; i < 120; i++) { try { if ((await fetch(web)).ok) break } catch {} if (i === 119) throw new Error('Vite did not become ready'); await new Promise(r => setTimeout(r, 250)) }
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
  await mkdir(out, { recursive: true })
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const patient = await login(`care-browser-patient-${viewport.width}@localhost.test`, 'pasien')
    const share = (await call('POST', '/api/lab-log/shares', patient.token, { dokterEmail: doctor.user.email, hari: 7 })).body
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
    const page = await context.newPage(); page.setDefaultTimeout(60000); const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await context.addInitScript(({ user, token }) => {
      localStorage.setItem('pmd-token', token)
      localStorage.setItem('panaceamed.session.v1', JSON.stringify({ loginAt: Date.now(), account: { ...user, role: 'dokter', loggedAt: new Date().toISOString() } }))
    }, doctor)
    let releaseLoad
    const heldLoad = new Promise(resolve => { releaseLoad = resolve })
    await page.route('**/care', async route => { await heldLoad; await route.continue() })
    await page.goto(`${web}/qa/clinical/care-plan.html?share=${share.id}`, { timeout: 120000, waitUntil: 'domcontentloaded' })
    await page.getByText('Loading…', { exact: true }).waitFor()
    releaseLoad()
    await page.getByLabel('Diagnosis being followed').waitFor()
    await page.unroute('**/care')
    console.log('care-plan browser loaded', viewport.width)
    await page.getByLabel('Diagnosis being followed').fill('Synthetic browser diagnosis')
    await page.getByLabel('Question 1', { exact: true }).fill('Synthetic browser question?')
    // Inject a refused intent into a real API request; no mock success/error response.
    await page.route('**/care-plan', route => { const body = route.request().postDataJSON(); return route.continue({ postData: JSON.stringify({ ...body, signIntent: false }) }) })
    await page.getByRole('button', { name: 'Sign & start daily check-in', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: 'explicit clinician signature required' }).waitFor()
    assert.deepEqual((await call('GET', '/api/care/plans', patient.token)).body.plans, [])
    await page.unroute('**/care-plan')
    const sign = page.getByRole('button', { name: 'Sign & start daily check-in', exact: true })
    assert.ok((await sign.boundingBox()).height >= 44)
    await sign.focus(); await page.keyboard.press('Enter')
    await page.getByText(/Signed by/).waitFor()
    const active = (await call('GET', '/api/care/plans', patient.token)).body.plans
    assert.equal(active.length, 1); assert.equal(active[0].plan.signature.actorId, doctor.user.id)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.screenshot({ path: `${out}/signed-${viewport.width}.png`, fullPage: true })
    await page.reload({ timeout: 120000, waitUntil: 'domcontentloaded' }); await page.getByText(/Signed by/).waitFor()
    // A legacy plan remains inactive and reviewable; approve its exact stored content.
    await server.restart(data => { for (const p of data.carePlans) if (p.rencana.id === active[0].plan.id) delete p.rencana.signature })
    assert.deepEqual((await call('GET', '/api/care/plans', patient.token)).body.plans, [])
    built = await compile()
    await page.reload({ timeout: 120000, waitUntil: 'domcontentloaded' })
    await page.getByText('Review saved plan', { exact: true }).waitFor()
    await page.getByText('This saved plan is inactive until you review and sign its exact content below.', { exact: true }).waitFor()
    const approveSaved = page.getByRole('button', { name: 'Sign & activate saved plan', exact: true })
    assert.ok((await approveSaved.boundingBox()).height >= 44)
    await approveSaved.focus(); await page.keyboard.press('Enter')
    await page.getByText(/Signed by/).waitFor()
    const resumed = (await call('GET', '/api/care/plans', patient.token)).body.plans[0].plan
    assert.equal(resumed.id, active[0].plan.id)
    assert.deepEqual(resumed.questions, active[0].plan.questions)
    await page.screenshot({ path: `${out}/resigned-${viewport.width}.png`, fullPage: true })
    await page.goto(`${web}/qa/clinical/care-plan.html?share=missing-share`, { timeout: 120000, waitUntil: 'domcontentloaded' })
    const retry = page.getByRole('button', { name: 'Retry', exact: true }); await retry.waitFor(); await retry.click(); await retry.waitFor()
    assert.deepEqual(errors, [])
    results.push({ viewport, realHttp: true, rejectedUnsignedIntent: true, signedActivation: true, legacyContentReapproved: true, loading: true, keyboard: true, errorRetry: true, overflow: false, pageErrors: errors, reducedMotion: true, routeIntegrationVerified: false, clinicallyReviewed: false })
    await context.close()
  }
  await writeFile(`${out}/evidence.json`, JSON.stringify(results, null, 2))
  console.log('care-plan-approval browser: real HTTP refusal/recovery, signed activation, keyboard, reload, error/retry, 390x844 and 1440x900 passed')
} finally { await browser?.close(); if (vite) await new Promise(resolve => vite.close(resolve)); await server.stop(); if (previousCors === undefined) delete process.env.CORS_ORIGINS; else process.env.CORS_ORIGINS = previousCors }
