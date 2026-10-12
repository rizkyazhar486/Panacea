// Pemeriksaan peramban untuk Longevity Center: skor dan usia biologis hanya dari isian nyata, bukan dari angka bawaan.
// Jalankan: npx vite build && npx vite preview --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/longevity-check.mjs
import assert from 'node:assert/strict'
import { mkdir, mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const BASE = process.env.QA_URL || 'http://localhost:5199/'
const ARTIFACTS = process.env.QA_ARTIFACT_DIR || await mkdtemp(join(tmpdir(), 'panacea-longevity-'))
await mkdir(ARTIFACTS, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
  args: process.env.QA_SOFTWARE_RENDERING === '1' ? ['--disable-gpu'] : [] })
const seedSession = () => {
  const account = { id: 'qa-patient', email: 'longevity-qa@localhost.test', name: 'QA Patient', role: 'pasien', patientId: 'qa-self', isSubscriber: false, loggedAt: new Date().toISOString() }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
  const t = new Date(); localStorage.setItem('pmd-quote-seen-date', `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`)
}
try {
  const errors = []
  const open = async (width, preseed) => {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 500, hasTouch: width < 500 })
    await ctx.addInitScript(seedSession)
    if (preseed) await ctx.addInitScript(preseed)
    const page = await ctx.newPage()
    page.on('pageerror', (e) => { errors.push(e.message); console.error('pageerror:', e.message) })
    page.on('crash', () => console.error('Longevity browser renderer crashed'))
    console.log(`Opening Longevity at ${width}px`)
    await page.goto(`${BASE}#/longevity`, { timeout: 180000 })
    await page.getByText('LONGEVITY SCORE', { exact: false }).first().waitFor({ timeout: 60000 })
    return { ctx, page }
  }
  const store = (page, key) => page.evaluate((k) => localStorage.getItem(k), key)
  const text = (page) => page.locator('body').innerText()
  const noOverflow = async (page, where) => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow ${where}`)
  const fold = async (page, name) => { const d = page.locator('details.fold', { has: page.getByText(name, { exact: true }) }).first(); if ((await d.getAttribute('open')) === null) await d.locator('summary').click() }
  const field = (page, label) => page.getByLabel(label, { exact: true })
  const bioAge = async (page) => (await text(page)).match(/BIOLOGICAL AGE \(EST\.\)\s*\n?\s*([\d.—]+)\s*yrs/)?.[1]

  {
    const { ctx, page } = await open(390)
    // 1. A new user: no score, no biological age, no chronological age printed from a default, nothing invented shared.
    assert.equal(await bioAge(page), '—', 'no biological age for a user who entered nothing')
    const fresh = await text(page)
    assert.match(fresh, /vs chronological age —/, 'the default age 30 is not printed as the user\'s age')
    assert.match(fresh, /Fill in at least 4 pillars below and enter your age and sex/)
    assert.equal(await field(page, 'Age').inputValue(), '', 'age starts blank')
    assert.equal(await page.getByRole('combobox').first().inputValue(), '', 'sex starts unselected')
    const shared = JSON.parse((await store(page, 'pmd_health_profile')) || '{}')
    assert.equal(shared.sleepH, undefined, 'the default 7 h sleep is not shared with the Health Profile')
    await noOverflow(page, 'new user at 390')

    // 2. The reproduced defect: two real pillars used to produce score 82 and "27.5 yrs, 2.5 yrs younger" from an invented age of 30.
    await fold(page, 'Pillars')
    await field(page, 'VO₂max (ml/kg/min)').fill('45'); console.log('VO2 entered')
    await field(page, 'Resting HR (bpm)').fill('58'); console.log('Resting HR entered')
    assert.equal(await bioAge(page), '—', 'two real pillars give no biological age')
    assert.doesNotMatch(await text(page), /yrs younger|yrs older/, 'no younger/older verdict from defaults')

    // 3. Age, sex and two more real pillars activate it; the age shown is the typed one.
    await field(page, 'Age').fill('41')
    await page.getByRole('combobox').first().selectOption('F')
    assert.equal(await bioAge(page), '—', 'age and sex alone, with two pillars, still give nothing')
    await field(page, 'Best grip (kg)').fill('28'); await field(page, 'Chair-stand 30 sec (x)').fill('18')
    await page.waitForFunction(() => /BIOLOGICAL AGE \(EST\.\)\s*\n?\s*\d/.test(document.body.innerText))
    const scored = await text(page)
    assert.match(scored, /vs chronological age 41/, 'the typed age is shown')
    assert.match(scored, /LONGEVITY SCORE/)
    const saved = JSON.parse(await store(page, 'pmd_longevity_v1'))
    assert.deepEqual(Object.keys(saved.isi).sort(), ['age', 'g'], 'only age and sex are recorded as typed besides the measurements')

    // 4. Clearing the age takes the result away again.
    await field(page, 'Age').fill('')
    await page.waitForFunction(() => /BIOLOGICAL AGE \(EST\.\)\s*\n?\s*—/.test(document.body.innerText))
    await noOverflow(page, 'filled form at 390')
    await page.screenshot({ path: join(ARTIFACTS, 'longevity-390.png'), fullPage: true })
    await ctx.close()
  }

  // 5. Typed sleep and answered lifestyle count as pillars (age-independent): four real ones plus age and sex give a result.
  {
    const { ctx, page } = await open(1440)
    await fold(page, 'Pillars')
    await field(page, 'Age').fill('50'); await page.getByRole('combobox').first().selectOption('M')
    await field(page, 'Resting HR (bpm)').fill('60'); await field(page, 'One-leg balance (sec)').fill('25'); await field(page, 'Average sleep (hrs)').fill('7.5')
    assert.equal(await bioAge(page), '—', 'three real pillars: not enough')
    await page.getByLabel('Smoking').selectOption('never'); await page.getByLabel('Alcohol').selectOption('0')
    await page.waitForFunction(() => /BIOLOGICAL AGE \(EST\.\)\s*\n?\s*\d/.test(document.body.innerText))
    await field(page, 'Average sleep (hrs)').fill('0')
    await field(page, 'Resting HR (bpm)').focus()
    assert.equal(await field(page, 'Average sleep (hrs)').inputValue(), '0', 'explicit zero sleep remains visible after blur')
    const zero = JSON.parse(await store(page, 'pmd_longevity_v1'))
    assert.equal(zero.sleepH, 0)
    assert.equal(zero.isi.sleepH, true, 'zero is stored as answered, not missing')
    await page.reload()
    await page.getByText('LONGEVITY SCORE').first().waitFor()
    await fold(page, 'Pillars')
    assert.equal(await field(page, 'Average sleep (hrs)').inputValue(), '0', 'a previous positive cache value does not replace zero on reload')
    await page.getByRole('button', { name: /Sync devices/ }).click()
    assert.equal(await field(page, 'Average sleep (hrs)').inputValue(), '7.5', 'explicit device sync can replace the answered zero')
    await ctx.close()
  }

  // 6. Legacy storage: every field saved with defaults; only values that differ are treated as entered.
  {
    const legacy = () => localStorage.setItem('pmd_longevity_v1', JSON.stringify({ age: 30, g: 'M', vo2: 44, grip: 0, chair30: 0, balance: 0, whr: 0, rhr: 0, sleepH: 7, smoke: 'never', alcohol: 0, protein: false, social: false, purpose: false, hba1c: 0, ldl: 0, crp: 0, sbp: 0, tests: {} }))
    const { ctx, page } = await open(1440, legacy)
    assert.equal(await field(page, 'Age').inputValue(), '', 'a legacy default age is not shown as typed')
    assert.equal(await bioAge(page), '—')
    await fold(page, 'Pillars')
    assert.equal(await field(page, 'VO₂max (ml/kg/min)').inputValue(), '44', 'a real legacy measurement is kept')
    await ctx.close()
  }
  assert.deepEqual(errors, [], `no page errors: ${errors.join(' | ')}`)
  console.log('longevity-check: ok')
} finally { await browser.close() }
