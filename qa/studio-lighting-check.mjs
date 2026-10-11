// Real source assets and identified WebGL renderer; no hardware FPS claims.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import path from 'node:path'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
// Reuse the PNG decoder already bundled with the QA browser dependency.
const playwrightRequire = createRequire(import.meta.resolve(process.env.PLAYWRIGHT_MODULE || 'playwright'))
const { PNG } = playwrightRequire(path.join(path.dirname(playwrightRequire.resolve('playwright-core/package.json')), 'lib/utilsBundle.js'))
const out = process.env.QA_OUT || '/tmp/panacea-web-studio'
const url = process.env.QA_URL || 'http://127.0.0.1:5207/qa/canonical-body.html'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--enable-webgl', '--enable-unsafe-swiftshader'] })
const reports = []
try {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 })
      const errors = [], assets = []
      page.on('pageerror', e => errors.push(e.message))
      page.on('request', r => { if (r.url().endsWith('.glb')) assets.push(r.url()) })
      const started = performance.now()
      console.log(`Opening ${width} ${theme}`)
      await page.goto(url, { timeout: 180000 })
      console.log('Fixture opened; waiting for source anatomy')
      await page.evaluate(t => document.documentElement.classList.toggle('dark', t === 'dark'), theme)
      const stats = page.getByText(/loaded · \d+k triangles/)
      await stats.waitFor({ timeout: 120000 })
      await page.getByText('Loading anatomy…', { exact: true }).waitFor({ state: 'detached', timeout: 120000 })
      const loadedMs = performance.now() - started
      const beforeStats = await stats.textContent(), requests = assets.length
      assert.ok(requests > 0, 'must load actual source meshes')
      assert.ok(Number(beforeStats.match(/(\d+)k triangles/)[1]) <= 80)
      const canvas = page.getByTestId('canonical-body-canvas')
      const toolbarBox = await page.getByTestId('canonical-body-tools').boundingBox()
      const canvasBox = await canvas.boundingBox()
      assert.ok(toolbarBox.y + toolbarBox.height <= canvasBox.y, 'tools must not obscure anatomy')
      const capture = async name => {
        // Same document scroll offset for every capture: fractional CSS-to-device
        // alignment otherwise changes canvas interpolation, not renderer state.
        await canvas.evaluate(el => window.scrollTo(0, Math.round(el.getBoundingClientRect().top + scrollY) - 100))
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        const file = `${width}-${theme}-${name}.png`, bytes = await canvas.screenshot()
        await writeFile(path.join(out, file), bytes)
        // Compare decoded scene pixels, not compressed PNG bytes or CSS footer.
        // The footer's fractional scrolling/compositing differs by 1–2 channels
        // even on an unchanged render. Keep the full unmodified PNG as evidence.
        const decoded = PNG.sync.read(bytes)
        const height = decoded.height - 80 // contexts above have screenshot DPR 2
        const scenePixels = { height, sha256: createHash('sha256')
          .update(decoded.data.subarray(0, decoded.width * height * 4)).digest('hex') }
        return { file, sha256: createHash('sha256').update(bytes).digest('hex'),
          width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), scenePixels }
      }
      const before = await capture('standard')
      const lighting = page.getByRole('radiogroup', { name: 'Anatomical lighting' })
      await lighting.getByRole('radio', { name: 'Studio', exact: true }).click()
      await page.waitForTimeout(300)
      const after = await capture('studio')
      assert.notEqual(before.scenePixels.sha256, after.scenePixels.sha256, 'studio must change actual rendered pixels')
      const exposure = page.getByRole('slider', { name: 'Lighting exposure' })
      await exposure.focus(); await exposure.press('ArrowRight')
      assert.equal(await exposure.inputValue(), '0.25')
      await page.waitForTimeout(300)
      const adjusted = await capture('exposure')
      assert.notEqual(after.scenePixels.sha256, adjusted.scenePixels.sha256, 'exposure must change rendered pixels')
      await exposure.press('End'); assert.equal(await exposure.inputValue(), '2')
      await exposure.press('Home'); assert.equal(await exposure.inputValue(), '-2')
      // Back to studio +0.25; quality selection must not reset the lighting.
      await page.getByRole('button', { name: 'Reset lighting' }).click()
      assert.equal(await exposure.inputValue(), '0')
      assert.equal(await lighting.getByRole('radio', { name: 'Standard', exact: true }).getAttribute('aria-checked'), 'true')
      const reset = await capture('reset')
      assert.equal(reset.scenePixels.sha256, before.scenePixels.sha256, 'default reset must restore baseline scene pixels')
      await lighting.getByRole('radio', { name: 'Studio', exact: true }).click()
      await exposure.focus(); await exposure.press('ArrowRight')
      await page.getByRole('radiogroup', { name: 'Graphics quality' }).getByRole('radio', { name: 'performance', exact: true }).click()
      assert.equal(await exposure.inputValue(), '0.25')
      assert.equal(await lighting.getByRole('radio', { name: 'Studio', exact: true }).getAttribute('aria-checked'), 'true')
      await page.waitForTimeout(300)
      const performanceCapture = await capture('performance')
      const measured = await page.locator('[data-testid="canonical-body-canvas"] canvas').evaluate(c => {
        const gl = c.getContext('webgl2'), ext = gl.getExtension('WEBGL_debug_renderer_info')
        return { drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
          cssSize: [c.clientWidth, c.clientHeight], renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unavailable',
          jsHeapUsedBytes: performance.memory?.usedJSHeapSize ?? null }
      })
      assert.equal(measured.drawingBuffer[0], measured.cssSize[0], 'performance DPR must be 1')
      // Import milliseconds are timing telemetry, not a geometry invariant.
      // Exact structure/triangle counters AND request counts must stay unchanged.
      const geometryCounts = text => text.match(/^[\d,]+ loaded · \d+k triangles/)[0]
      assert.equal(geometryCounts(await stats.textContent()), geometryCounts(beforeStats), 'lighting must preserve geometry counters')
      assert.equal(assets.length, requests, 'lighting must not request GLB again')
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'horizontal overflow')
      await page.getByRole('group', { name: 'Anatomical view' }).getByRole('button', { name: 'Left lateral', exact: true }).click()
      await page.waitForTimeout(1200)
      const lateral = await capture('studio-lateral')
      assert.notEqual(lateral.scenePixels.sha256, performanceCapture.scenePixels.sha256, 'anatomical view must change while studio is active')
      assert.equal(await lighting.getByRole('radio', { name: 'Studio', exact: true }).getAttribute('aria-checked'), 'true')
      await page.getByRole('group', { name: 'Anatomical view' }).getByRole('button', { name: 'Anterior', exact: true }).click()
      await page.waitForTimeout(1200)
      // Review/provenance panel remains reachable with studio settings applied.
      await page.getByLabel('Find a structure').fill('femur')
      await page.getByRole('button', { name: /^femur/i }).first().click()
      await page.getByText(/Source: Z-Anatomy/).waitFor()
      await page.getByText(/not clinically reviewed/i).first().waitFor()
      await page.getByLabel('Find a structure').fill('')
      await page.screenshot({ path: path.join(out, `${width}-${theme}-page.png`), fullPage: true })
      assert.deepEqual(errors, [], 'page errors')
      reports.push({ width, height, theme, loadedMs, stats: beforeStats, glbRequests: requests,
        measured, captures: [before, after, adjusted, reset, performanceCapture, lateral], errors })
      console.log(`Verified ${width} ${theme}`)
      await page.close()
    }
  }
  // Loading actual GLBs: lighting edits survive completion, with no second load.
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    let release
    const gate = new Promise(resolve => { release = resolve })
    await page.route('**/*.glb', async r => { await gate; await r.continue() })
    await page.goto(url, { timeout: 180000 })
    await page.getByText('Loading anatomy…', { exact: true }).waitFor({ timeout: 120000 })
    await page.getByRole('radiogroup', { name: 'Anatomical lighting' }).getByRole('radio', { name: 'Studio', exact: true }).click()
    release()
    await page.getByText('Loading anatomy…', { exact: true }).waitFor({ state: 'detached', timeout: 120000 })
    await page.getByText(/loaded · \d+k triangles/).waitFor()
    assert.equal(await page.getByRole('radio', { name: 'Studio', exact: true }).getAttribute('aria-checked'), 'true')
    reports.push({ state: 'loading-settings-preserved' }); await page.close()
  }
  // Empty/error indexes: controls remain usable, never invent source anatomy.
  for (const state of ['empty', 'error']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.route('**/body_matrix.json', r => r.fulfill({ status: state === 'error' ? 503 : 200,
      contentType: 'application/json', body: JSON.stringify({ bodies: [], files: [] }) }))
    await page.goto(url, { timeout: 180000 })
    await page.getByRole('radiogroup', { name: 'Anatomical lighting' }).getByRole('radio', { name: 'Studio', exact: true }).click()
    await page.getByRole('button', { name: 'Reset lighting' }).click()
    if (state === 'error') await page.getByText(/Body index could not be loaded/).waitFor()
    assert.equal(await page.getByRole('tab').count(), 0)
    assert.deepEqual(errors, [])
    reports.push({ state, errors }); await page.close()
  }
  await writeFile(path.join(out, 'report.json'), JSON.stringify({ scope: 'reference-only web lighting; renderer identified per viewport; not hardware FPS, physical-phone or GPU memory validation', reports }, null, 2))
  console.log(JSON.stringify(reports.map(({ width, theme, state, measured }) => ({ width, theme, state, measured })), null, 2))
} finally { await browser.close() }
