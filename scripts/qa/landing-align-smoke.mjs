// alignWhenScrollStops (src/pages/landing/components/alignWhenScrollStops.ts) in a real browser. The landing defers
// blocks below the hero with content-visibility and a height estimate; a smooth in-page jump aims at where its target
// was before the blocks it passes rendered, so it can land far off (measured: 1,674 px past "roles" at 1440 px). The
// fixture reproduces that drift with estimates three times the real height, then pins the re-alignment.
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { build } from 'esbuild'
const pw = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const chromium = pw.chromium ?? pw.default.chromium

const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'ts', contents: `
import { alignWhenScrollStops } from ${JSON.stringify(resolve('src/pages/landing/components/alignWhenScrollStops.ts'))}
window.alignWhenScrollStops = alignWhenScrollStops
` }, bundle: true, write: false, format: 'iife', platform: 'browser' })
const code = bundle.outputFiles[0].text
// Ten deferred blocks, each 600 px tall but estimated at 1800 px, then the target.
const page = `<!doctype html><html><body style="margin:0">
${Array.from({ length: 10 }, (_, i) => `<div style="content-visibility:auto;contain-intrinsic-size:auto 1800px"><section style="height:600px;background:hsl(${i * 30} 40% 85%)">block ${i}</section></div>`).join('')}
<section id="target" style="height:900px;background:#cfc">target</section><div style="height:3000px"></div></body></html>`

const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
async function open() {
  const p = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.setContent(page)
  await p.addScriptTag({ content: code })
  return { p, errors }
}
async function settle(p) {
  let last = -1, still = 0
  for (let i = 0; i < 120 && still < 6; i++) { await p.waitForTimeout(100); const y = await p.evaluate(() => scrollY); still = y === last ? still + 1 : 0; last = y }
}
const targetTop = (p) => p.evaluate(() => Math.round(document.getElementById('target').getBoundingClientRect().top))

let failures = 0
async function check(name, fn) {
  try { await fn(); console.log(`ok - ${name}`) } catch (error) { failures += 1; console.log(`not ok - ${name}\n  ${String(error.message).split('\n').join('\n  ')}`) }
}

try {
  await check('realigns_the_target_after_the_smooth_scroll_stops', async () => {
    // Twin first: the smooth scroll alone lands off target in this fixture.
    const plain = await open()
    await plain.p.evaluate(() => document.getElementById('target').scrollIntoView({ behavior: 'smooth' }))
    await settle(plain.p)
    assert.ok(Math.abs(await targetTop(plain.p)) > 200, 'the fixture must reproduce the drift')
    await plain.p.close()
    const { p, errors } = await open()
    await p.evaluate(() => { const t = document.getElementById('target'); t.scrollIntoView({ behavior: 'smooth' }); window.alignWhenScrollStops(t) })
    await settle(p)
    assert.ok(Math.abs(await targetTop(p)) <= 1, `target top ${await targetTop(p)} px`)
    assert.deepEqual(errors, [])
    await p.close()
  })

  await check('a_reader_taking_over_cancels_the_realignment', async () => {
    const { p } = await open()
    await p.evaluate(() => { const t = document.getElementById('target'); t.scrollIntoView({ behavior: 'smooth' }); window.alignWhenScrollStops(t)
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 10 })) })
    await settle(p)
    assert.ok(Math.abs(await targetTop(p)) > 200, 'no jump after the reader took over')
    await p.close()
  })

  await check('without_scrollend_it_realigns_once_the_position_holds', async () => {
    // The window below never delivers scrollend, so only the position watch can realign.
    const { p } = await open()
    await p.evaluate(() => {
      // A window without the scrollend event: same scrolling, events and timers.
      const w = { addEventListener: (n, f, o) => (n === 'scrollend' ? undefined : window.addEventListener(n, f, o)), removeEventListener: window.removeEventListener.bind(window),
        setInterval: window.setInterval.bind(window), clearInterval: window.clearInterval.bind(window),
        setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window), get scrollY() { return window.scrollY } }
      const t = document.getElementById('target'); t.scrollIntoView({ behavior: 'smooth' }); window.alignWhenScrollStops(t, w)
    })
    await settle(p); await p.waitForTimeout(400)
    assert.ok(Math.abs(await targetTop(p)) <= 1, `target top ${await targetTop(p)} px`)
    await p.close()
  })

  await check('stops_listening_when_nothing_scrolls', async () => {
    // The target is already in place: nothing scrolls within 300 ms, so the realignment is dropped.
    const { p } = await open()
    const moved = await p.evaluate(async () => {
      const t = document.getElementById('target')
      let calls = 0; const original = t.scrollIntoView.bind(t); t.scrollIntoView = (...a) => { calls += 1; return original(...a) }
      window.alignWhenScrollStops(t, window, 150, 300)
      await new Promise((r) => setTimeout(r, 450))
      window.dispatchEvent(new Event('scrollend'))
      await new Promise((r) => setTimeout(r, 100))
      return calls
    })
    assert.equal(moved, 0, 'a late scrollend after giving up must not move the page')
    await p.close()
  })
} finally {
  await browser.close()
}

if (failures) { console.error(`landing align smoke: ${failures} failing`); process.exit(1) }
console.log('landing align smoke: in-page jumps re-align once the scroll stops (with or without scrollend), never after the reader takes over, and stop listening when nothing scrolls')
