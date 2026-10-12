import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.BMI_QA_ORIGIN || 'http://127.0.0.1:4173'
const output = process.env.BMI_QA_OUTPUT || 'artifacts/bmi-availability'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const results = []
  for (const fixture of [{ name: 'missing-height', weightKg: 70, heightCm: 0 }, { name: 'rounding-overflow', weightKg: 1e308, heightCm: 100 }, { name: 'derived-underflow', weightKg: 70, heightCm: 1e308 }, { name: 'normal', weightKg: 70, heightCm: 175 }]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.addInitScript(f => {
      localStorage.clear()
      const patient = { id: 'bmi-synthetic', name: 'Synthetic BMI fixture', mrn: 'SYNTHETIC', sex: 'L', dob: '1990-01-01', weightKg: f.weightKg, heightCm: f.heightCm, allergies: [], chronicConditions: [], riskFlags: [], avatarColor: '#00BF63' }
      localStorage.setItem('panaceamed.state.v3', JSON.stringify({ patients: [patient], activePatientId: patient.id }))
      localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: { id: 'bmi-doctor-qa', patientId: patient.id, email: 'bmi-qa@localhost.test', name: 'Synthetic UI account', role: 'dokter', isSubscriber: false, loggedAt: new Date().toISOString() }, loginAt: Date.now() }))
      localStorage.setItem('panacea_onboarded_v1', '1')
      localStorage.setItem('panacea_assessment_prompt_v1', '1')
    }, fixture)
    await page.goto(`${origin}/#/clinical`, { waitUntil: 'domcontentloaded' })
    const adult = page.getByText('Adult BMI', { exact: true }).locator('..')
    await adult.waitFor()
    const value = await adult.innerText()
    if (fixture.name === 'normal') {
      assert.ok(value.includes('22.9') && value.includes('kg/m²'))
      await page.getByRole('img', { name: 'BMI 22.9 kg/m²', exact: true }).waitFor()
      await page.getByRole('img', { name: 'Adult BMI 22.9 kg/m²', exact: true }).waitFor()
    } else {
      assert.ok(value.includes('—') && !value.includes('kg/m²'), 'unavailable adult BMI must not be displayed as 0 kg/m² or Infinity')
      const gauge = page.getByRole('img', { name: 'BMI calculation unavailable', exact: true })
      await gauge.waitFor()
      assert.equal(await gauge.locator('[style*="left: calc"]').count(), 0, 'no patient marker for an unavailable BMI')
      const chart = page.getByRole('img', { name: 'Adult BMI calculation unavailable', exact: true })
      assert.equal(await chart.locator('[style*="left: calc"]').count(), 0)
    }
    assert.deepEqual(errors, [])
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    assert.ok(overflow <= 1, `mobile overflow: ${overflow}`)
    results.push({ name: fixture.name, unavailable: fixture.name !== 'normal', horizontalOverflowPx: overflow })
    await context.close()
  }
  const evidence = { ok: true, synthetic: true, clientOnly: true, originalFormulaPreserved: true, unavailableMarkersHidden: true, results, clinicallyReviewed: false }
  await mkdir(output, { recursive: true })
  await writeFile(`${output}/evidence.json`, JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify(evidence))
} finally { await browser.close() }
