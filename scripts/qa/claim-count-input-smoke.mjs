import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.CLAIM_COUNT_QA_ORIGIN || 'http://127.0.0.1:4173'
const output = process.env.CLAIM_COUNT_QA_OUTPUT || 'artifacts/claim-count-inputs'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: {
      email: 'claim-count-qa@localhost.test', name: 'Synthetic claim input QA', role: 'dokter', isSubscriber: true,
      loggedAt: new Date().toISOString(),
    }, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
  })
  // Deliberately client-only synthetic API fixture: observes attempted payloads,
  // never writes a real clinical ledger or implies human review occurred.
  const protocol = { id: 'synthetic-claims-ui', judul: 'Synthetic input regression', versi: 'fixture-v1' }
  const caseFixture = { id: 'synthetic-case', sudahSaya: false, versiSistem: 'synthetic-no-human-validation',
    masukan: { tes: 'ldl', satuan: 'mg/dL', rentangPopulasi: [0, 130], seri: [{ tanggal: '2026-10-01', nilai: 100 }, { tanggal: '2026-10-02', nilai: 105 }] },
    keluaran: { status: 'normal', alasan: 'Synthetic UI input fixture, not clinical evidence.' },
  }
  const attempted = []
  await page.route('**/api/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    let result = {}
    if (path === '/api/validation/studies') result = { studies: [{ protokol: protocol, jumlahKasus: 1, sudahSaya: 0 }] }
    else if (path === `/api/validation/${protocol.id}/cases`) result = { protokol: protocol, cases: [caseFixture] }
    else if (path === `/api/validation/${protocol.id}/assessments` && request.method() === 'POST') {
      attempted.push(request.postDataJSON())
      result = { ok: true, urutan: attempted.length, sidik: 'synthetic-not-a-signature' }
    } else if (path.endsWith('/disagreements')) result = { cases: [] }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) })
  })
  await page.goto(`${origin}/#/clinical-hub`)
  const studies = page.getByRole('region', { name: 'Clinical validation studies', exact: true })
  await studies.getByRole('button', { name: 'Review cases', exact: true }).click()
  const count = studies.getByLabel('Unsupported claims', { exact: true })
  await count.waitFor()
  assert.equal(await count.inputValue(), '', 'no prefilled claim that the output is clean')
  await studies.getByRole('button', { name: 'Output is correct', exact: true }).click()
  const submit = studies.getByRole('button', { name: 'Submit assessment', exact: true })
  const alert = studies.getByRole('alert')
  for (const [value, reason] of [
    ['', 'Enter the number of unsupported claims (0 if none).'],
    ['abc', 'Unsupported claims must be a whole number.'],
    ['-1', 'Unsupported claims must be a whole number.'],
    ['2.5', 'Unsupported claims must be a whole number.'],
    ['1e2', 'Unsupported claims must be a whole number.'],
    ['101', 'Unsupported claims cannot exceed 100.'],
  ]) {
    await count.fill(value)
    await submit.click()
    await alert.filter({ hasText: reason }).waitFor()
    assert.equal(attempted.length, 0, `${JSON.stringify(value)} must not make a submission request`)
  }
  for (const value of ['0', '3']) {
    await count.fill(value)
    const response = page.waitForResponse(r => new URL(r.url()).pathname.endsWith('/assessments') && r.request().method() === 'POST')
    await submit.click()
    await response
    assert.equal(attempted.at(-1).klaimTakDidukung, Number(value), 'entered count survives in payload')
    await submit.waitFor({ state: 'visible' })
  }
  assert.equal(attempted.length, 2)
  assert.deepEqual(errors, [], 'no browser runtime errors')
  const evidence = { ok: true, viewport: { width: 390, height: 844 }, initiallyMissing: true, invalidSubmissionRequests: 0, explicitCounts: [0, 3], synthetic: true, clientOnly: true, realLedgerWritten: false, clinicalReviewPerformed: false }
  await writeFile(`${output}/evidence.json`, JSON.stringify(evidence, null, 2))
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true })
  console.log(JSON.stringify(evidence))
} finally {
  await browser.close()
}
