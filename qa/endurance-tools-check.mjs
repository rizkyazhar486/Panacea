// Pemeriksaan peramban untuk Alat Endurance: kolom kosong/tak sah menampilkan alasan, bukan rencana dari angka karangan.
// Jalankan: npx vite --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/endurance-tools-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const URL = process.env.QA_URL || 'http://localhost:5199/qa/endurance-tools.html'
try {
  const errors = []
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    for (const theme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width, height } })
      const page = await ctx.newPage()
      page.on('pageerror', (e) => errors.push(e.message))
      await page.goto(URL, { timeout: 180000 })
      await page.evaluate((t) => document.documentElement.classList.toggle('dark', t === 'dark'), theme)
      const alert = (re) => page.getByRole('alert').filter({ hasText: re })
      const noOverflow = async (where) => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow ${where} at ${width}`)

      // Fuelling: plan only from valid inputs, never from invented ones.
      await page.getByRole('button', { name: 'Moderate', exact: true }).waitFor()
      await page.getByText('Total carbohydrate').waitFor()
      assert.equal(await page.getByLabel('Body weight (kg)', { exact: true }).inputValue() !== '', true, 'body weight is a visible, prefilled field')
      await page.getByLabel('Duration (min)', { exact: true }).fill('')
      await alert(/Enter the session duration/).waitFor()
      assert.equal(await page.getByText('Total carbohydrate').count(), 0, 'no plan without a duration')
      await page.getByLabel('Duration (min)', { exact: true }).fill('0')
      await alert(/session duration must be above 0/i).waitFor()
      await page.getByLabel('Duration (min)', { exact: true }).fill('180')
      await page.getByText('Total carbohydrate').waitFor()
      const weight = await page.getByLabel('Body weight (kg)', { exact: true }).inputValue()
      await page.getByLabel('Body weight (kg)', { exact: true }).fill('')
      await alert(/Enter your body weight/).waitFor()
      assert.equal(await page.getByText('Total carbohydrate').count(), 0, 'no plan without a body weight')
      await page.getByLabel('Body weight (kg)', { exact: true }).fill(weight)
      await page.getByLabel('Temperature (°C, optional)', { exact: true }).fill('abc')
      await alert(/temperature must be a number/i).waitFor()
      await page.getByLabel('Temperature (°C, optional)', { exact: true }).fill('')
      await page.getByText('Total carbohydrate').waitFor()   // blank temperature = unknown, plan still works
      await noOverflow('fuelling')
      // Sweat test: every field required, and a half-filled form says what is missing.
      await page.getByLabel('Weight before (kg)', { exact: true }).fill('70')
      await alert(/Enter the weight after/).waitFor()
      await page.getByLabel('Weight after (kg)', { exact: true }).fill('68.8')
      await page.getByText('Your sweat rate').waitFor()
      await page.getByLabel('Total drunk (mL)', { exact: true }).fill('')
      await alert(/Enter the total drunk/).waitFor()
      assert.equal(await page.getByText('Your sweat rate').count(), 0, 'blank drunk must not be read as 0 mL')
      await page.getByLabel('Total drunk (mL)', { exact: true }).fill('0')
      await page.getByText('Your sweat rate').waitFor()
      if (theme === 'light') await page.screenshot({ path: `/private/tmp/endurance-fuel-${width}.png`, fullPage: true })

      // Route power guide.
      await page.getByRole('button', { name: /Route Power Guide/ }).click()
      await page.getByText(/% FTP/).first().waitFor()
      await page.getByLabel('Distance (km)', { exact: true }).first().fill('')
      await alert(/Enter the distance of segment 1/).waitFor()
      assert.equal(await page.getByText(/% FTP/).count(), 0, 'no target watts with an empty segment')
      await page.getByLabel('Distance (km)', { exact: true }).first().fill('20')
      await page.getByLabel('Gradient (%)', { exact: true }).nth(1).fill('99')
      await alert(/gradient of segment 2 must be from -40 to 40/i).waitFor()
      await page.getByLabel('Gradient (%)', { exact: true }).nth(1).fill('7')
      await page.getByLabel('FTP (W)', { exact: true }).fill('')
      await alert(/Enter your FTP/).waitFor()
      await page.getByLabel('FTP (W)', { exact: true }).fill('238')
      await page.getByLabel('Estimated hours', { exact: true }).fill('0')
      await alert(/estimated hours must be above 0/i).waitFor()
      await page.getByLabel('Estimated hours', { exact: true }).fill('2')
      await page.getByText(/% FTP/).first().waitFor()
      const addSegment = page.getByRole('button', { name: '+ Add segment' })
      await addSegment.scrollIntoViewIfNeeded()
      await addSegment.click()
      assert.equal(await page.getByLabel('Distance (km)', { exact: true }).count(), 5)
      await noOverflow('power guide')

      // Heat and altitude: invalid input is never logged as 0.
      await page.getByRole('button', { name: /Heat & Altitude/ }).click()
      await page.getByLabel('Temperature (°C)', { exact: true }).fill('')
      await alert(/Enter the temperature/).waitFor()
      assert(await page.getByRole('button', { name: 'Log today' }).first().isDisabled(), 'heat log disabled for blank temperature')
      await page.getByLabel('Temperature (°C)', { exact: true }).fill('32')
      await page.getByLabel('Altitude (m)', { exact: true }).fill('')
      await alert(/Enter the altitude/).waitFor()
      assert.equal(await page.getByText(/Aerobic capacity loss at/).count(), 0, 'no altitude penalty for a blank altitude')
      assert(await page.getByRole('button', { name: 'Log today' }).nth(1).isDisabled(), 'altitude log disabled for blank altitude')
      await page.getByLabel('Altitude (m)', { exact: true }).fill('2500')
      await page.getByText(/Aerobic capacity loss at 2500 m/).waitFor()
      await page.getByRole('button', { name: 'Log today' }).nth(1).click()
      await page.getByText(/^1 exposure logged\. Below 1500 m/).waitFor()
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pmd_paparan_ketinggian_v1') || '[]'))
      assert.deepEqual(stored.map((x) => [x.meter, x.jam]), [[2500, 14]], 'exactly the entered exposure was stored')
      await noOverflow('acclimatisation')
      if (theme === 'light') await page.screenshot({ path: `/private/tmp/endurance-accl-${width}.png`, fullPage: true })
      await ctx.close()
    }
  }
  assert.deepEqual(errors, [], 'page errors: ' + errors.join(' | '))
  console.log('endurance tools: blank and invalid inputs show reasons and produce no plan or log entry, valid inputs work, no overflow, at 390x844 and 1440x900, light and dark')
} finally { await browser.close() }
