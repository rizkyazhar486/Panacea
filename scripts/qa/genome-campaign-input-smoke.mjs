import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.GENOME_CAMPAIGN_QA_ORIGIN || 'http://127.0.0.1:4173'
const output = process.env.GENOME_CAMPAIGN_QA_OUTPUT || 'artifacts/genome-campaign-inputs'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: { id: 'genome-qa', patientId: 'self-genome-qa', email: 'genome-qa@localhost.test', name: 'Synthetic aggregate QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString() }, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
  })
  await page.goto(`${origin}/#/genome-lab`, { waitUntil: 'domcontentloaded' })
  const labels = ['Designed', 'Assembled', 'Viable', 'Off-target tested', 'Off-target growth']
  const inputs = labels.map(label => page.getByLabel(label, { exact: true }))
  for (const input of inputs) assert.equal(await input.inputValue(), '', 'counts start unknown, not an unlabelled experiment')
  const rate = label => page.getByText(label, { exact: true }).locator('..')
  assert.equal(await page.getByText('No-growth screen', { exact: true }).count(), 0)
  await page.getByRole('button', { name: 'Load illustrative campaign example', exact: true }).click()
  assert.match(await rate('Viable / assembled').innerText(), /5\.6%/)
  assert.match(await rate('No-growth screen').innerText(), /100\.0%/)
  await inputs[4].fill('')
  assert.equal(await page.getByText('No-growth screen', { exact: true }).count(), 0, 'missing growth cannot prove no growth')
  assert.equal(await inputs[4].inputValue(), '')
  await inputs[4].fill('0')
  assert.match(await rate('No-growth screen').innerText(), /100\.0%/)
  for (const value of ['-1', '1.5', '9007199254740992', '1e309']) {
    await inputs[2].fill(value)
    assert.equal(await inputs[2].inputValue(), value === '1e309' ? '' : value, 'browser-rejected nonfinite input stays unknown; other invalid inputs are not rounded or replaced with zero')
    assert.equal(await page.getByText('Overall yield', { exact: true }).count(), 0)
  }
  await inputs[2].fill('286')
  assert.equal(await page.getByText('Overall yield', { exact: true }).count(), 0, 'viable cannot exceed assembled')
  await inputs[2].fill('0')
  assert.match(await rate('Viable / assembled').innerText(), /0\.0%/)
  for (const input of inputs) await input.fill('0')
  for (const label of ['Assembly rate', 'Viable / assembled', 'Overall yield', 'No-growth screen']) {
    const text = await rate(label).innerText()
    assert.ok(text.includes('—') && !text.includes('%'), 'zero observations do not establish a measured rate')
  }
  await page.getByText('No viability interval: no assembled observations.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Load illustrative campaign example', exact: true }).click()
  assert.match(await rate('Viable / assembled').innerText(), /5\.6%/)
  await page.getByText('Research-safe boundary', { exact: true }).waitFor()
  assert.deepEqual(errors, [])
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  assert.ok(overflow <= 1)
  const evidence = { ok: true, synthetic: true, clientOnly: true, fiveCountsInitiallyUnknown: true, missingGrowthNotZero: true, explicitZeroAccepted: true, fractionsNotRounded: true, unsafePrecisionRejected: true, nonfiniteRejected: true, relationshipsChecked: true, denominatorAbsenceShown: true, labelledExampleRecovery: true, horizontalOverflowPx: overflow, clinicallyReviewed: false, executable: false }
  await mkdir(output, { recursive: true })
  await writeFile(`${output}/evidence.json`, JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify(evidence))
} finally { await browser.close() }
