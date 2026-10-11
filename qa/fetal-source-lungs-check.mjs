// Production preview: QA_URL=http://127.0.0.1:5217/#/body-exposure/canonical
// Isolated Vite harness: QA_URL=http://127.0.0.1:5217/qa/canonical-body.html
// PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node qa/fetal-source-lungs-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--enable-webgl', '--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage()
  // Local preview uses the repository's synthetic session fixture; never seed a remote host.
  await page.addInitScript(() => {
    if (!['127.0.0.1', 'localhost'].includes(location.hostname)) return
    const account = { id: 'qa-fetal-local', email: 'qa-fetal@localhost.test', name: 'Fetal atlas QA', role: 'pasien', patientId: 'qa-fetal-local', isSubscriber: false, loggedAt: new Date().toISOString() }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  })
  const errors = []; const failedAssets = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('response', r => { if (r.url().includes('/bodyexposure/fetus.') && !r.ok()) failedAssets.push(`${r.status()} ${r.url()}`) })
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:5217/qa/canonical-body.html', { timeout: 180000 })
    await page.getByRole('tab', { name: /^Fetus/ }).click()
    await page.getByText(/^14 structures$/).waitFor({ timeout: 60000 })
    await page.getByText(/loaded · \d+k triangles/).waitFor({ timeout: 60000 })
    for (const side of ['L', 'R']) {
      await page.getByLabel('Find a structure').fill('lung')
      const button = page.getByRole('button', { name: /^lung/i }).filter({ hasText: side === 'L' ? /left/i : /right/i })
      await button.first().click()
      await page.getByText(new RegExp(`^FETUS\\.RESPIRATORY\\.LUNG\\.${side}$`)).waitFor({ timeout: 60000 })
      await page.getByText(/source labels \[/).waitFor()
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow')
    assert.ok(await page.locator('canvas').count() > 0, '3D canvas mounted')
    console.log(`Fetal ${viewport.width}: both selections and provenance passed`)
    await page.screenshot({ path: `/tmp/codex-fetal-source-${viewport.width}.png`, fullPage: true })
  }
  assert.deepEqual(errors, []); assert.deepEqual(failedAssets, [])
  console.log('FETAL_SOURCE_LUNGS_BROWSER PASS: mobile/desktop, both selections, source metadata, no asset/page errors')
} finally { await browser.close() }
