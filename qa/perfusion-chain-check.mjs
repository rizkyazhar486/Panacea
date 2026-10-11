// Pemeriksaan peramban untuk panel perfusi jantung-otak (Body Exposure).
// Jalankan: npx vite --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/perfusion-chain-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const URL = process.env.QA_URL || 'http://localhost:5199/qa/perfusion-chain.html'
const values = { 'Heart rate': '80', 'End-diastolic volume': '120', 'End-systolic volume': '50', 'Systemic vascular resistance': '1200', 'Central venous pressure': '6', 'Intracranial pressure': '10' }
try {
  const errors = []
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    for (const theme of ['light', 'dark']) {
      for (const reducedMotion of ['no-preference', 'reduce']) {
        const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion })
        const page = await ctx.newPage()
        page.on('pageerror', (e) => errors.push(e.message))
        await page.goto(URL, { timeout: 180000 })
        await page.evaluate((t) => document.documentElement.classList.toggle('dark', t === 'dark'), theme)
        const panel = page.getByTestId('perfusion-chain-panel')
        await panel.locator('summary').click()
        // label riset terlihat dan semua kolom mulai kosong; tidak ada hasil sebelum diisi
        await panel.getByText(/Research and education only/).waitFor()
        for (const name of Object.keys(values)) assert.equal(await page.getByLabel(name, { exact: true }).inputValue(), '', `${name} must start blank`)
        await panel.getByText(/Enter all six values/).waitFor()
        assert.equal(await panel.locator('svg').count(), 0, 'no diagram before the inputs are complete')
        // mengisi satu per satu: pesan menyusut, tidak ada angka sebelum lengkap
        const names = Object.keys(values)
        for (const name of names.slice(0, -1)) await page.getByLabel(name, { exact: true }).fill(values[name])
        await panel.getByText(/Still missing: intracranial pressure/).waitFor()
        await page.getByLabel('Intracranial pressure', { exact: true }).fill(values['Intracranial pressure'])
        await panel.getByText('5.60 L/min').waitFor()
        await panel.getByText('90.0 mmHg', { exact: true }).waitFor()
        await panel.getByText('80.0 mmHg', { exact: true }).waitFor()
        await panel.getByText(/not cerebral blood flow/).waitFor()
        const anim = await panel.locator('svg animate').count()
        assert(reducedMotion === 'reduce' ? anim === 0 : anim > 0, `animation count ${anim} with reducedMotion=${reducedMotion}`)
        // input mustahil memberi peringatan, bukan angka; ICP = MAP tidak punya gradien positif
        await page.getByLabel('End-systolic volume', { exact: true }).fill('200')
        await panel.getByRole('alert').getByText(/End-systolic volume must be between/).waitFor()
        assert.equal(await panel.locator('svg').count(), 0, 'no diagram for invalid input')
        await page.getByLabel('End-systolic volume', { exact: true }).fill('50')
        await page.getByLabel('Intracranial pressure', { exact: true }).fill('90')
        await panel.getByText(/no positive driving gradient/).waitFor()
        await page.getByLabel('Intracranial pressure', { exact: true }).fill('10')
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow at ${width}`)
        // semua kontrol cukup besar untuk sentuhan
        for (const name of names) { const box = await page.getByLabel(name, { exact: true }).boundingBox(); assert(box.height >= 44, `${name} touch target ${box.height}px`) }
        if (reducedMotion === 'no-preference') await page.screenshot({ path: `/private/tmp/perfusion-${width}-${theme}.png`, fullPage: true })
        await ctx.close()
      }
    }
  }
  assert.deepEqual(errors, [], 'page errors: ' + errors.join(' | '))
  console.log('perfusion chain panel: blank start, research label, chain values, invalid-input alert, reduced motion, no overflow, 44px targets at 390x844 and 1440x900, light and dark')
} finally { await browser.close() }
