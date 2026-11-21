// Health Data analyzer must show what an import just brought, without a reload. Real app in a real browser (390x844):
// the card starts on its empty sentence, an Apple Watch (Health Auto Export) file is imported through the page's own file
// input, and the card then shows the steps chip with the latest day's value and a chart. The empty sentence must be gone.
// Regression: the analyzer read history through a function whose identity never changed, so it kept the empty state it
// rendered first until the page was reloaded.
import assert from 'node:assert/strict'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.HEALTH_ANALYZER_QA_ORIGIN || 'http://127.0.0.1:4173'
const gagal = async (nama, f) => { try { await f() } catch (e) { throw new Error(`[${nama}] ${e.message}`) } }

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const samples = (qty) => Array.from({ length: 20 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - i)
  return { date: `${iso(d)} 08:00:00 +0700`, qty: qty(i) }
})
const file = {
  name: 'export.json', mimeType: 'application/json',
  // Latest day (i = 0) is exactly 9000 steps and 55 bpm; older days vary so there is a usual range to compare with.
  buffer: Buffer.from(JSON.stringify({ data: { metrics: [
    { name: 'step_count', units: 'count', data: samples((i) => (i === 0 ? 9000 : 6000 + (i % 5) * 400)) },
    { name: 'resting_heart_rate', units: 'count/min', data: samples((i) => (i === 0 ? 55 : 58 + (i % 3))) },
  ] } })),
}

const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await ctx.addInitScript(() => {
    const account = { email: 'analyzer-qa@localhost.test', name: 'QA', role: 'pasien', loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01' }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
  })
  const page = await ctx.newPage()
  await page.goto(`${origin}/#/fitness-hub?view=health-data`, { waitUntil: 'load', timeout: 60_000 })
  const card = page.locator('.ha')

  await gagal('kartu_kosong_sebelum_impor', async () => {
    await card.scrollIntoViewIfNeeded({ timeout: 30_000 })
    await page.locator('.ha-empty').waitFor({ state: 'visible', timeout: 30_000 })
    assert.equal(await page.locator('.ha-chip:not([disabled])').count(), 0, 'no chip is enabled before any reading')
  })

  await gagal('kartu_terisi_setelah_impor_tanpa_muat_ulang', async () => {
    await page.evaluate(() => document.querySelectorAll('#hd-import details').forEach((d) => { d.open = true }))
    await page.locator('input[type=file]').first().setInputFiles(file)
    await page.locator('.ha-empty').waitFor({ state: 'detached', timeout: 15_000 })
    const steps = page.locator('.ha-chip', { hasText: 'Steps' })
    await steps.waitFor({ state: 'visible', timeout: 15_000 })
    assert.match((await steps.innerText()).replace(/\s+/g, ' '), /9[,.]?000/, 'steps chip shows the latest day')
    assert.equal(await steps.isDisabled(), false, 'steps chip is enabled')
    assert.ok(await page.locator('.ha-deep svg').count() > 0, 'a chart is drawn')
  })

  await gagal('memilih_sinyal_tidak_mencuri_fokus', async () => {
    // Picking another signal remounts the detail view. It must leave focus on the chip that was pressed (keyboard users
    // keep their place) and must not leave a focus ring on the large reading.
    const hr = page.locator('.ha-chip', { hasText: 'Resting HR' })
    await hr.focus(); await hr.press('Enter')
    await page.locator('.ha-deep').getByText('bpm', { exact: false }).first().waitFor({ state: 'visible', timeout: 15_000 })
    const where = await page.evaluate(() => {
      const a = document.activeElement
      return { onChip: !!a?.classList?.contains('ha-chip'), label: a?.textContent?.trim().slice(0, 24) ?? '', insideDetail: !!a?.closest?.('.ha-deep') }
    })
    assert.equal(where.insideDetail, false, `focus moved into the detail view (${where.label})`)
    assert.equal(where.onChip, true, `focus left the chip (now on: ${where.label || 'body'})`)
  })

  await gagal('tanpa_luapan_horizontal', async () => {
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    assert.equal(over, 0, `horizontal overflow ${over}px`)
  })
} finally { await browser.close() }
console.log('health-analyzer-import-smoke: empty before import, filled right after it (steps chip, chart), no overflow at 390x844')
