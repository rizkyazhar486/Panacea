// Pemeriksaan peramban halaman tinjauan struktur dokter.
// Jalankan: npx vite --port 5199 & lalu  PLAYWRIGHT_MODULE=<path ke playwright> node qa/doctor-body-review-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const URL_ = process.env.QA_URL || 'http://localhost:5199/qa/doctor-body-review.html'
const session = (role) => JSON.stringify({ loginAt: Date.now(), account: { email: 'qa@example.invalid', name: 'QA', role, isSubscriber: false, loggedAt: new Date().toISOString() } })
try {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    // 1) bukan dokter: ditolak, tidak ada daftar
    const guest = await browser.newPage({ viewport: { width, height } })
    await guest.addInitScript((s) => localStorage.setItem('panaceamed.session.v1', s), session('pasien'))
    await guest.goto(URL_, { timeout: 120000 })
    await guest.getByText('This workspace is reserved for the doctor team.').waitFor({ timeout: 60000 })
    assert.equal(await guest.getByLabel('Find a structure').count(), 0, 'non-doctor must not see the review list')
    await guest.close()

    // 2) dokter: memilih struktur, mengisi, membuat catatan
    const page = await browser.newPage({ viewport: { width, height } }); const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.addInitScript((s) => localStorage.setItem('panaceamed.session.v1', s), session('dokter'))
    await page.goto(URL_, { timeout: 120000 })
    await page.getByText('Structure review checklist').waitFor({ timeout: 60000 })
    await page.getByLabel('Find a structure').waitFor()
    assert.equal(await page.getByTestId('reviewed-count').textContent(), '0', 'no structure may count as reviewed without a ledger record')
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow at ${width}px`)
    await page.getByRole('combobox').first().selectOption({ label: 'VHF_DENVER_CT.ADULT.FEMALE · Visible Human skeleton (Denver + CT)' })
    await page.locator('select[aria-label="Status"]').selectOption('model')
    await page.getByLabel('Find a structure').fill('rib 5')
    await page.getByRole('button', { name: /^rib 5/i }).first().click()
    await page.getByText(/Machine segmentation: accuracy is unmeasured/).waitFor()
    await page.getByText(/^0 of 8 required checks done\.$/).waitFor()  // metode model: butir method_check ikut wajib
    // keputusan "confirmed" tanpa butir lengkap ditolak
    await page.getByRole('radio', { name: /Anatomy confirmed/ }).click()
    await page.getByPlaceholder('Reviewer ID').fill('dr-test')
    await page.getByRole('button', { name: 'Create review record' }).click()
    await page.getByRole('alert').getByText(/a confirmed review needs every required check/).waitFor()
    // lengkapi semua butir
    for (const box of await page.getByRole('checkbox').all()) await box.check()
    await page.getByRole('button', { name: 'Create review record' }).click()
    const out = await page.getByRole('status').or(page.locator('output')).first().textContent()
    assert(/would NOT mark the structure as reviewed: reviewer is not on the authorised list/.test(out), `unexpected preview: ${out}`)
    await page.locator('pre').getByText(/"decision": "confirmed"/).waitFor()
    assert.equal(await page.getByTestId('reviewed-count').textContent(), '0', 'creating a record must not change the reviewed count')
    await page.screenshot({ path: `/private/tmp/doctor-body-review-${width}.png`, fullPage: true })
    assert.equal(errors.length, 0, errors.join('; '))
    await page.close()
  }
  console.log('OK')
} finally { await browser.close() }
