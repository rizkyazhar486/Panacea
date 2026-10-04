import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

/** Synthetic local records exercise the real Visit OS route; no clinical server writes. */
export async function verifyPoliPatientTemporalScope(page, url) {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.context().addInitScript(() => {
    const account = { id: 'qa-doctor', email: 'poli-qa@localhost.test', name: 'QA Doctor', role: 'dokter', patientId: 'qa-self', isSubscriber: false, loggedAt: new Date().toISOString() }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
    const today = new Date()
    localStorage.setItem('pmd-quote-seen-date', `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`)
  })
  await page.goto(url)
  await page.locator('[data-poli-patient-flow]').waitFor({ timeout: 45_000 })
  await page.waitForFunction(() => Boolean(localStorage.getItem('panaceamed.state.v3')))
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('panaceamed.state.v3'))
    const now = new Date(Date.now() - 60_000).toISOString()
    const future = new Date(Date.now() + 86_400_000).toISOString()
    const patients = [['qa-empty', 'QA No observations'], ['qa-current', 'QA Current observations'], ['qa-flag', 'QA Future critical flag'], ['qa-self', 'QA Own wearable']].map(([id, name]) => ({ id, name, sex: 'L', dob: '1990-01-01', mrn: id, heightCm: 170, weightKg: 70, allergies: [], chronicConditions: [], riskFlags: [], avatarColor: '#00BF63' }))
    state.patients = patients; state.activePatientId = 'qa-empty'
    state.records = Object.fromEntries(patients.map(patient => [patient.id, { id: 'r-' + patient.id, patientId: patient.id, createdAt: now, updatedAt: now, physicalExam: { verifiedById: 'qa-doctor' }, signedById: 'qa-doctor', plan: [], problems: [], references: [] }]))
    const vital = (id, takenAt, heartRate) => ({ id, takenAt, heartRate, systolic: 120, diastolic: 80, respRate: 16, tempC: 36.7, spo2: 98 })
    state.vitals = { 'qa-empty': [vital('future-only', future, 199)], 'qa-current': [vital('current', now, 71), vital('future', future, 199)] }
    state.supportive = { 'qa-flag': [{ id: 'qa-flag', takenAt: future, category: 'Lab', name: 'Synthetic future flag', value: 'QA', flag: 'critical' }] }
    localStorage.setItem('panaceamed.state.v3', JSON.stringify(state))
    localStorage.setItem('pmd_vitals_v1', JSON.stringify({ heartRate: 173, source: 'QA own wearable', measuredAt: now, syncedAt: now }))
  })
  await page.reload()
  const board = page.locator('[data-poli-patient-flow]')
  const center = page.locator('[data-visit-command-center]')
  await board.waitFor()
  const row = name => board.locator('article').filter({ has: page.getByRole('button', { name, exact: true }) })
  const heartRate = () => center.getByRole('complementary', { name: 'Visit vitals' }).locator(':scope > div').filter({ has: page.getByText('Heart rate', { exact: true }) }).innerText()
  await center.getByText('QA No observations', { exact: true }).waitFor()
  assert.match(await row('QA No observations').innerText(), /data-gap/i)
  assert.match(await heartRate(), /—/)
  assert.doesNotMatch(await heartRate(), /199|173/)
  await row('QA Current observations').getByRole('button', { name: 'QA Current observations', exact: true }).click()
  await center.getByText('QA Current observations', { exact: true }).waitFor()
  assert.match(await heartRate(), /71/)
  assert.doesNotMatch(await heartRate(), /199|173/)
  assert.match(await row('QA Future critical flag').innerText(), /Review critical flag and reconcile timestamp\/provenance/)
  await row('QA Own wearable').getByRole('button', { name: 'QA Own wearable', exact: true }).click()
  await center.getByText('QA Own wearable', { exact: true }).waitFor()
  assert.match(await heartRate(), /173/)
  await center.getByRole('button', { name: 'Confirm consent', exact: true }).click()
  await center.getByRole('button', { name: 'Start visit', exact: true }).waitFor()
  await row('QA Current observations').getByRole('button', { name: 'QA Current observations', exact: true }).click()
  await center.getByText('QA Current observations', { exact: true }).waitFor()
  await center.getByRole('button', { name: 'Confirm consent', exact: true }).waitFor()
  assert.match(await heartRate(), /71/)
  assert.doesNotMatch(await heartRate(), /173/)
  const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }))
  assert.ok(width.document <= width.viewport + 1, `mobile overflow: ${JSON.stringify(width)}`)
  assert.deepEqual(errors, [], 'Visit OS runtime errors')
  return { viewport: width.viewport, futureVitalsExcluded: true, accountWearableScoped: true, validOwnWearablePreserved: true, criticalFlagReviewPreserved: true, consentResetsOnPatientChange: true }
}

if (process.argv[1]?.endsWith('poli-patient-temporal-smoke.mjs')) {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader'] })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const metrics = await verifyPoliPatientTemporalScope(page, process.env.POLI_QA_URL || 'http://127.0.0.1:4173/#/visit-os')
    await mkdir('artifacts/uiux-mobile-390x844', { recursive: true })
    await writeFile('artifacts/uiux-mobile-390x844/poli-temporal.json', JSON.stringify(metrics, null, 2))
    await page.locator('[data-poli-patient-flow]').screenshot({ path: 'artifacts/uiux-mobile-390x844/poli-temporal.png' })
    console.log(JSON.stringify(metrics))
  } finally { await browser.close() }
}
