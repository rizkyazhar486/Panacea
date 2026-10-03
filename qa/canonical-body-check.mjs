// Pemeriksaan peramban untuk halaman tubuh kanonik (Body Exposure).
// Jalankan: npx vite --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/canonical-body-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--enable-webgl', '--enable-unsafe-swiftshader'] })
const URL = process.env.QA_URL || 'http://localhost:5199/qa/canonical-body.html'
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height })
      await page.goto(URL)
      await page.evaluate((t) => document.documentElement.classList.toggle('dark', t === 'dark'), theme)
      const stats = page.getByText(/structures · \d+k triangles/)
      await stats.waitFor({ timeout: 60000 })
      assert.match(await stats.textContent(), /^3,876 structures/, 'male structure count')
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'horizontal overflow')
      // tubuh yang belum punya data sumber tidak bisa dipilih
      assert(await page.getByRole('tab', { name: /Neonate/ }).isDisabled(), 'placeholder body must be disabled')
      // pencarian → pilih → panel provenans
      await page.getByLabel('Find a structure').fill('femur')
      await page.getByRole('button', { name: /^femur/i }).first().click()
      await page.getByText(/^ADULT\.MALE\.SKELETAL\.FEMUR\.[LR]$/).waitFor()
      await page.getByText(/Source: Z-Anatomy/).waitFor()
      await page.getByText('Os femoris').waitFor()  // nama Latin TA2
      await page.getByText(/Landmarks on this structure \(\d+\)/).waitFor()
      // ketuk di kanvas tidak boleh melempar galat; mode isolate
      await page.getByRole('button', { name: 'isolate' }).click()
      await page.screenshot({ path: `/private/tmp/canonical-${width}-${theme}.png`, fullPage: true })
      // tubuh perempuan
      await page.getByRole('tab', { name: /Adult female/ }).click()
      await page.getByText(/^8\d\d structures · /).waitFor({ timeout: 60000 })
      console.log(JSON.stringify({ width, theme, male: 3876, female: (await page.getByText(/structures · \d+k/).textContent()) }))
    }
  }
  assert.deepEqual(errors, [])
  console.log('OK')
} finally { await browser.close() }
