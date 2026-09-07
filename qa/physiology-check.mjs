import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--enable-webgl', '--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const url = process.env.QA_URL || 'http://127.0.0.1:5177/qa/physiology.html'
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await page.goto(url)
    await page.locator('.phys-canvas canvas').waitFor()
    await page.locator('.phys-canvas').scrollIntoViewIfNeeded()
    const pixels = await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => {
      const canvas = document.querySelector('.phys-canvas canvas')
      const gl = canvas.getContext('webgl2')
      const data = new Uint8Array(canvas.width * canvas.height * 4)
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, data)
      const colors = new Set()
      for (let i = 0; i < data.length; i += 16) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`)
      resolve(colors.size)
    })))
    assert(pixels > 30, `Blank canvas: ${pixels} colors`)
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflows viewport')
    await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
    await page.waitForFunction(() => Number(document.querySelector('[aria-label="Mechanism progress"]').value) > .15)
    await page.getByRole('button', { name: 'Pause sequence', exact: true }).click()
    const before = await page.locator('.phys-canvas canvas').screenshot()
    await page.waitForTimeout(250)
    const after = await page.locator('.phys-canvas canvas').screenshot()
    assert(before.equals(after), 'Paused scene changed')
    await page.getByRole('button', { name: 'Reveal explanation', exact: true }).click()
    assert(await page.getByRole('status').isVisible())
    await page.screenshot({ path: `/private/tmp/panacea-physiology-${viewport.width}.png`, fullPage: true })
    console.log(JSON.stringify({ viewport, colors: pixels, pauseStable: true, screenshot: `/private/tmp/panacea-physiology-${viewport.width}.png` }))
  }
  const buttons = page.getByRole('navigation', { name: 'Physiology topics' }).getByRole('button')
  for (let i = 0; i < await buttons.count(); i++) {
    await buttons.nth(i).click()
    assert.equal(await page.locator('.phys-steps li').count(), 4)
    assert.equal(await page.locator('.phys-canvas canvas').count(), 1)
  }
  await buttons.filter({ hasText: 'Spirometry' }).click()
  await page.getByRole('heading', { name: 'Synthetic volume-time trace' }).waitFor()
  assert.equal(await page.locator('.phys-results dd').count(), 4)
  await buttons.filter({ hasText: 'Heart, flow' }).click()
  await page.getByRole('heading', { name: 'Explore the relationships' }).waitFor()
  assert.equal(await page.locator('.phys-results dd').count(), 5)
  await page.getByLabel('Find a physiology topic').fill('no matching term')
  assert.equal(await buttons.count(), 0)
  assert.deepEqual(errors, [])
  console.log('All 23 topics, search, quantitative panels and browser error checks passed.')
} finally { await browser.close() }
