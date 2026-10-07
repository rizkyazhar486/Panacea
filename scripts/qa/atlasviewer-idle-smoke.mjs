import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader'],
})
const output = process.env.ATLAS_QA_OUTPUT || '/tmp/panacea-atlas-qa/screenshots'
await mkdir(output, { recursive: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.setDefaultTimeout(30000)
  // Penghitung hanya di browser QA; tidak ada instrumentasi per-draw di produksi.
  await page.addInitScript(() => {
    window.__atlasDraws = 0
    for (const method of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const original = WebGL2RenderingContext.prototype[method]
      WebGL2RenderingContext.prototype[method] = function (...args) {
        if (this.canvas.dataset.atlasViewer3d) window.__atlasDraws++
        return original.apply(this, args)
      }
    }
    window.__atlasFrames = new Set()
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window)
    window.requestAnimationFrame = callback => {
      let id
      id = request(time => { window.__atlasFrames.delete(id); callback(time) })
      window.__atlasFrames.add(id)
      return id
    }
    window.cancelAnimationFrame = id => { window.__atlasFrames.delete(id); cancel(id) }
  })
  const canvas = page.locator('canvas[data-atlas-viewer3d]')
  const draws = () => page.evaluate(() => window.__atlasDraws)
  async function stable() {
    const initialDraws = await draws()
    // Jeda antargambar bukan bukti idle pada SwiftShader yang lambat.
    // Tunggu pekerjaan RAF habis; polling timer tidak menambah RAF tes sendiri.
    try {
      await page.waitForFunction(() => window.__atlasFrames.size === 0, null, { polling: 50, timeout: 30000 })
    } catch {
      const pending = await page.evaluate(() => window.__atlasFrames.size)
      throw new Error(`Atlas did not become idle (${await draws() - initialDraws} GPU draws, ${pending} pending RAF callbacks)`)
    }
  }
  async function idle(label, duration = 750) {
    await stable()
    const before = await draws()
    await page.waitForTimeout(duration)
    assert.equal(await draws(), before, `${label}: GPU draws while idle`)
  }
  async function active(label) {
    // Buktikan gambar berlanjut, tanpa mensyaratkan FPS GPU runner.
    for (let sample = 0; sample < 2; sample++) {
      const before = await draws()
      try {
        await page.waitForFunction(n => window.__atlasDraws > n, before, { polling: 50, timeout: 30000 })
      } catch {
        assert.fail(`${label}: animation stopped at ${before} GPU draws`)
      }
    }
  }
  async function pixels(path) {
    const png = await canvas.screenshot({ path })
    return page.evaluate(async data => {
      const image = new Image()
      image.src = `data:image/png;base64,${data}`
      await image.decode()
      const decoded = document.createElement('canvas')
      decoded.width = image.width; decoded.height = image.height
      const ctx = decoded.getContext('2d')
      ctx.drawImage(image, 0, 0)
      const rgba = ctx.getImageData(0, 0, image.width, image.height).data
      const colors = new Set()
      for (let i = 0; i < rgba.length; i += 16) colors.add(`${rgba[i]},${rgba[i + 1]},${rgba[i + 2]}`)
      return colors.size
    }, png.toString('base64'))
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    // The acceptance target is the renderer, not unrelated late page-load resources.
    // DOM readiness is followed by explicit canvas, GLB, draw, idle and recovery assertions below.
    await page.goto(process.env.ATLAS_QA_URL || 'http://127.0.0.1:5180/scripts/qa/atlasviewer-fixture.html', { waitUntil: 'domcontentloaded' })
    await canvas.waitFor()
    for (const module of ['mata', 'nefrologi', 'jantung-ruang']) {
      const beforeLoad = await draws()
      await page.getByLabel('Atlas module').selectOption(module)
      await page.getByText('Loading anatomy', { exact: false }).waitFor({ state: 'hidden' })
      await page.waitForFunction(before => window.__atlasDraws > before, beforeLoad)
      const idleWindowMs = width === 390 && module === 'mata' ? 6000 : 750
      await idle(`${width}/${module}`, idleWindowMs)
      const colors = await pixels(`${output}/${module}-${width}.png`)
      assert(colors > 100, `${module}: blank or flat canvas (${colors} colors)`)
      const before = await draws()
      await page.getByLabel('Structure', { exact: true }).selectOption({ index: 1 })
      await page.waitForFunction(n => window.__atlasDraws > n, before)
      await idle('Selection')
      const box = await canvas.boundingBox()
      await page.mouse.move(box.x + box.width * .4, box.y + box.height * .5)
      await page.mouse.down()
      const beforeOrbit = await draws()
      await page.mouse.move(box.x + box.width * .6, box.y + box.height * .6, { steps: 12 })
      await page.mouse.up()
      await page.waitForFunction(n => window.__atlasDraws > n, beforeOrbit, { polling: 50 })
      await idle('Orbit damping')
      console.log(JSON.stringify({ width, module, colors, idleDraws: 0, idleWindowMs, selectionAndOrbit: 'pass' }))
    }
    await page.getByLabel('Lesion', { exact: true }).check()
    await active('Lesion pulse')
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight))
    await idle('Offscreen lesion')
    await page.evaluate(() => scrollTo(0, 0))
    await active('Visible lesion resumes')
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
    await idle('Hidden tab')
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
    await active('Visible tab resumes')
    await page.getByLabel('Lesion', { exact: true }).uncheck()
    await idle('Lesion removed')
    await page.getByLabel('Atlas module').selectOption('nefrologi')
    await page.getByLabel('Flow', { exact: true }).check()
    await active('Renal flow')
    await page.getByLabel('Flow', { exact: true }).uncheck()
    await idle('Flow removed')
    const beforeResize = await draws()
    await canvas.evaluate(n => { n.parentElement.style.width = '85%' })
    await page.waitForFunction(n => window.__atlasDraws > n, beforeResize)
    await idle('Resize')
    await canvas.evaluate(n => { n.parentElement.style.width = '100%' })
    await canvas.evaluate(n => { window.__atlasContextExtension = n.getContext('webgl2').getExtension('WEBGL_lose_context'); window.__atlasContextExtension.loseContext() })
    await page.getByText('The browser dropped', { exact: false }).waitFor()
    await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('resize')) })
    await idle('Lost context must not restart')
    const beforeRestore = await draws()
    await page.evaluate(() => window.__atlasContextExtension.restoreContext())
    await page.getByText('The browser dropped', { exact: false }).waitFor({ state: 'hidden' })
    await page.waitForFunction(n => window.__atlasDraws > n, beforeRestore)
    await idle('Restored context')
    await page.getByLabel('Mounted', { exact: true }).uncheck()
    assert.equal(await canvas.count(), 0)
    await idle('Unmounted')
    assert.equal(await page.evaluate(() => window.__atlasFrames.size), 0, 'No RAF survives unmount')
  }
  assert.deepEqual(errors, [])
  console.log('Atlas idle GPU, live flow, visibility, context recovery and cleanup: passed')
} finally {
  await browser.close()
}
