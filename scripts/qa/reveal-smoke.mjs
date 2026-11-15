// Reveal (src/components/ui/Reveal.tsx) in a real browser: the landing renders dozens of these, and each used to call
// getBoundingClientRect() on mount, forcing style and layout of the whole document inside React's commit. This smoke
// pins the replacement: no layout read on mount, the same visibility outcome from the IntersectionObserver's reports,
// the 1.5 s fallback, and content shown at once under reduced motion or without an observer.
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { build } from 'esbuild'
const pw = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const chromium = pw.chromium ?? pw.default.chromium

const component = resolve('src/components/ui/Reveal.tsx')
// Viewport 390x844. A at the top; B starts 100 px above the fold and is 2000 px tall (5% visible: under the 12% rule, but
// on screen at mount); C starts at 3000 px; D at 9000 px and is never scrolled to.
const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: `
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Reveal } from ${JSON.stringify(component)}
const box = (h) => ({ height: h, background: '#ddd' })
function Fixture(){return <div style={{ position: 'relative', height: 12000 }}>
  <div style={{ position: 'absolute', top: 0, width: '100%' }}><Reveal className="A"><div style={box(200)}>A</div></Reveal></div>
  <div style={{ position: 'absolute', top: 744, width: '100%' }}><Reveal className="B"><div style={box(2000)}>B</div></Reveal></div>
  <div style={{ position: 'absolute', top: 3000, width: '100%' }}><Reveal className="C"><div style={box(1000)}>C</div></Reveal></div>
  <div style={{ position: 'absolute', top: 9000, width: '100%' }}><Reveal className="D"><div style={box(400)}>D</div></Reveal></div>
</div>}
window.__mount = () => createRoot(document.getElementById('root')).render(<Fixture/>)
` }, bundle: true, write: false, jsx: 'automatic', format: 'iife', platform: 'browser', nodePaths: [resolve('node_modules')], define: { 'process.env.NODE_ENV': '"production"' } })
const code = bundle.outputFiles[0].text

const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
const state = (page, cls) => page.locator(`.reveal.${cls}`).getAttribute('data-motion-state')
const frames = (page, n = 3) => page.evaluate((n) => new Promise((r) => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f) }), n)

async function open({ reducedMotion = 'no-preference', withoutObserver = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.setContent('<!doctype html><html><body style="margin:0"><div id="root"></div></body></html>')
  await page.evaluate((withoutObserver) => {
    window.__rects = 0
    const original = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = function (...args) { window.__rects += 1; return original.apply(this, args) }
    if (withoutObserver) delete window.IntersectionObserver
  }, withoutObserver)
  await page.addScriptTag({ content: code })
  await page.evaluate(() => window.__mount())
  return { page, errors }
}

let failures = 0
async function check(name, fn) {
  try { await fn(); console.log(`ok - ${name}`) } catch (error) { failures += 1; console.log(`not ok - ${name}\n  ${String(error.message).split('\n').join('\n  ')}`) }
}

try {
  await check('mount_reads_no_layout_and_shows_what_is_on_screen', async () => {
    const { page, errors } = await open()
    await page.waitForSelector('.reveal.A[data-motion-state="shown"]', { timeout: 3000 })
    await frames(page)
    assert.equal(await page.evaluate(() => window.__rects), 0, 'Reveal must not call getBoundingClientRect on mount')
    assert.equal(await state(page, 'B'), 'shown', 'an element on screen at mount shows even when under 12% of it is visible')
    assert.equal(await state(page, 'C'), 'hidden')
    assert.equal(await state(page, 'D'), 'hidden')
    assert.deepEqual(errors, [])
    await page.close()
  })

  await check('off_screen_shows_once_twelve_percent_enters', async () => {
    const { page } = await open()
    await page.waitForSelector('.reveal.A[data-motion-state="shown"]', { timeout: 3000 })
    // C (3000-4000 px) with 80 px inside the viewport minus its 40 px bottom margin: 8% of C, under the rule.
    await page.evaluate(() => window.scrollTo(0, 3000 - 844 + 40 + 80))
    await frames(page, 4)
    assert.equal(await state(page, 'C'), 'hidden', '8% visible is not enough after mount')
    // 200 px inside: 20% of C.
    await page.evaluate(() => window.scrollTo(0, 3000 - 844 + 40 + 200))
    await page.waitForSelector('.reveal.C[data-motion-state="shown"]', { timeout: 3000 })
    assert.equal(await state(page, 'D'), 'hidden')
    await page.close()
  })

  await check('fallback_shows_everything_after_1500_ms', async () => {
    const { page } = await open()
    await page.waitForTimeout(400)
    assert.equal(await state(page, 'D'), 'hidden')
    await page.waitForSelector('.reveal.D[data-motion-state="shown"]', { timeout: 3000 })
    await page.close()
  })

  await check('reduced_motion_shows_everything_at_once', async () => {
    const { page } = await open({ reducedMotion: 'reduce' })
    await page.waitForSelector('.reveal.D[data-motion-state="shown"]', { timeout: 1000 })
    assert.equal(await state(page, 'C'), 'shown')
    await page.close()
  })

  await check('no_intersection_observer_shows_everything_without_error', async () => {
    const { page, errors } = await open({ withoutObserver: true })
    await page.waitForSelector('.reveal.D[data-motion-state="shown"]', { timeout: 1000 })
    assert.deepEqual(errors, [], 'a browser without IntersectionObserver must not crash the page')
    await page.close()
  })
} finally {
  await browser.close()
}

if (failures) { console.error(`reveal smoke: ${failures} failing`); process.exit(1) }
console.log('reveal smoke: no layout read on mount; on-screen content shows at once, off-screen at 12%, fallback at 1.5 s; reduced motion and missing observer show everything')
