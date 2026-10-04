import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

/** Exercise the real respiratory workspace; teaching controls must not write patient state. */
export async function verifyAlveolarGasBudget(page, url) {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.context().addInitScript(() => {
    const account = { email: 'body3d-qa@localhost.test', name: 'Body3D QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01' }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
    // Suppress the independent daily reminder's delayed seen-date write.
    const today = new Date()
    localStorage.setItem('pmd-quote-seen-date', `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`)
  })
  await page.goto(url)
  await page.locator('[data-unified-human-simulation-projector]').waitFor({ timeout: 45_000 })
  await page.getByRole('tab', { name: 'Respiratory', exact: true }).click()
  await page.locator('[data-body-exposure-mode-rail]').getByRole('button', { name: 'Physiology', exact: true }).click()
  const lab = page.locator('[data-alveolar-gas-budget="v1"]')
  await lab.waitFor()
  await lab.locator('summary').first().click()
  const metric = async label => lab.locator('dl > div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd').innerText()
  assert.match(await metric('Alveolar ventilation'), /^4\.20 L\/min BTPS/)
  assert.match(await metric('Alveolar CO₂'), /^41\.10 mmHg/)
  assert.match(await metric('Alveolar O₂'), /^100\.52 mmHg/)
  const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])))
  const frequency = lab.getByRole('slider', { name: 'Gas budget: Breathing frequency', exact: true })
  await frequency.focus()
  await frequency.press('ArrowRight')
  await page.waitForFunction(() => document.querySelector('[data-alveolar-gas-budget] input[aria-label="Gas budget: Breathing frequency"]')?.value === '13')
  assert.match(await metric('Alveolar ventilation'), /^4\.55 L\/min BTPS/)
  assert.match(await metric('Alveolar CO₂'), /^37\.93 mmHg/)
  assert.match(await metric('Alveolar O₂'), /^104\.30 mmHg/)
  const deadSpace = lab.getByRole('slider', { name: 'Gas budget: Physiological dead space', exact: true })
  await deadSpace.focus()
  await deadSpace.press('End')
  await lab.locator('p[role="status"]').waitFor()
  assert.match(await lab.locator('p[role="status"]').innerText(), /Unsupported scenario/)
  assert.equal(await lab.locator('dl').count(), 0, 'unsupported physiology must not retain apparently valid numeric outputs')
  await lab.getByRole('button', { name: 'Reset teaching scenario', exact: true }).click()
  assert.match(await metric('Alveolar CO₂'), /^41\.10 mmHg/)
  assert.equal(await lab.locator('p[role="status"]').count(), 0)
  await lab.getByText('Equations, provenance & limits', { exact: true }).click()
  assert.match(await lab.innerText(), /not Panacea validation/)
  assert.ok(await lab.locator('a[href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6269087/"]').count() > 0)
  const after = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])))
  const changedKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => before[key] !== after[key])
  assert.deepEqual(changedKeys, [], 'independent teaching scenarios must not change persisted patient state')
  const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }))
  assert.ok(width.document <= width.viewport + 1, `mobile overflow: ${JSON.stringify(width)}`)
  assert.deepEqual(errors, [], 'respiratory workspace runtime errors')
  return { viewport: width.viewport, defaultCo2MmHg: 41.10, interactions: ['frequency', 'unsupported dead space', 'reset', 'provenance'], persistedStateUnchanged: true }
}

if (process.argv[1]?.endsWith('alveolar-gas-budget-smoke.mjs')) {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader'] })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const metrics = await verifyAlveolarGasBudget(page, process.env.ALVEOLAR_QA_URL || 'http://127.0.0.1:4173/#/fitness-hub?view=body-exposure')
    await mkdir('artifacts', { recursive: true })
    await writeFile('artifacts/body3d-alveolar-gas-budget.json', JSON.stringify(metrics, null, 2))
    await page.locator('[data-alveolar-gas-budget]').screenshot({ path: 'artifacts/body3d-alveolar-gas-budget.png' })
    console.log(JSON.stringify(metrics))
  } finally { await browser.close() }
}
