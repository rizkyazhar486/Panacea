// Pemeriksaan peramban untuk Body Composition: tidak ada hasil dari angka karangan, tidak ada angka karangan di penyimpanan bersama.
// Jalankan: npx vite build && npx vite preview --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/body-composition-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const BASE = process.env.QA_URL || 'http://localhost:5199/'
const seedSession = () => {
  const account = { id: 'qa-patient', email: 'bodycomp-qa@localhost.test', name: 'QA Patient', role: 'pasien', patientId: 'qa-self', isSubscriber: false, loggedAt: new Date().toISOString() }
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
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`${BASE}#/body`, { timeout: 180000 })
    await page.getByText('COMPOSITION SCORE', { exact: false }).first().waitFor({ timeout: 60000 })
    return { ctx, page }
  }
  const store = (page, key) => page.evaluate((k) => localStorage.getItem(k), key)
  const noOverflow = async (page, where) => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow ${where}`)
  const fold = async (page, name) => { const d = page.locator('details.fold', { has: page.getByText(name, { exact: true }) }).first(); if (!(await d.getAttribute('open') !== null)) await d.locator('summary').click() }
  const field = (page, label) => page.getByLabel(label, { exact: true })

  // 1. A brand-new user sees no score, no body type, and nothing invented is stored or shared.
  {
    const { ctx, page } = await open(390)
    const text = await page.locator('body').innerText()
    assert.doesNotMatch(text, /Athletic|Needs improvement|Average/, 'no body-type or score label for a user who entered nothing')
    assert.match(text, /Enter your weight, height, age, sex, waist, neck to see your score/)
    assert.equal(await store(page, 'pm_bodycomp_v1'), null, 'nothing is stored before the user enters something')
    for (const key of ['pmd_health_profile', 'pmd_profile']) {
      const v = JSON.parse((await store(page, key)) || '{}')
      for (const invented of ['weightKg', 'restingHr', 'sleepH']) assert.equal(v[invented], undefined, `${key}.${invented} is not invented`)
    }
    await noOverflow(page, 'new user at 390')

    // 2. Entering the measurements produces the score; only those fields are stored, and only weight is shared.
    await fold(page, 'Measurements')
    for (const [label, value] of [['Weight (kg)', '80'], ['Height (cm)', '180'], ['Age', '40'], ['Waist (cm)', '90'], ['Neck (cm)', '40']]) await field(page, label).fill(value)
    assert.match(await page.locator('body').innerText(), /Enter your sex to see your score/, 'sex is still required')
    await page.getByRole('combobox').first().selectOption('M')
    await page.waitForFunction(() => !/to see your score/.test(document.body.innerText))
    const scored = await page.locator('body').innerText()
    assert.match(scored, /COMPOSITION SCORE\s*\n?\s*\d+\s*\/100/, 'a numeric score appears once the inputs exist')
    const stored = JSON.parse(await store(page, 'pm_bodycomp_v1'))
    assert.deepEqual(Object.keys(stored).sort(), ['_v', 'age', 'g', 'h', 'neck', 'w', 'waist'], 'only the fields the user filled are stored')
    const shared = JSON.parse((await store(page, 'pmd_health_profile')) || '{}')
    assert.equal(shared.weightKg, 80); assert.equal(shared.restingHr, undefined); assert.equal(shared.sleepH, undefined)

    // 3. Clearing a required field takes the score away again.
    await field(page, 'Weight (kg)').fill('')
    await page.waitForFunction(() => /Enter your weight to see your score/.test(document.body.innerText))

    // 4. Daily markers: nothing is computed from defaults; the mental screen assumes nothing.
    await fold(page, 'Markers')
    for (const id of ['readiness', 'battery', 'cardio', 'restingHr', 'restorative', 'aging', 'lifeExpectancy', 'effort', 'noise']) {
      const tile = page.locator(`[data-marker="${id}"]`)
      assert.equal(await tile.getAttribute('data-needs-input'), 'true', `${id} waits for its inputs`)
      assert.match(await tile.innerText(), /—[\s\S]*Enter /, `${id} shows a dash and what is missing`)
    }
    assert.doesNotMatch(await page.locator('body').innerText(), /Mental condition looks good/, 'no reassurance from assumed mood and stress')
    // The high-risk branch still fires on real input.
    await field(page, 'Stress (0-10)').fill('9'); await field(page, 'Anxiety (0-10)').fill('2'); await field(page, 'Mood (0-10)').fill('6')
    await page.getByText(/High anxiety\/stress score or low mood/).waitFor()
    await field(page, 'Stress (0-10)').fill('2')
    await page.getByText(/Mental condition looks good/).waitFor()
    await noOverflow(page, 'filled form at 390')
    await page.screenshot({ path: '/private/tmp/body-composition-390.png', fullPage: true })
    await ctx.close()
  }

  // 5. Legacy storage (every field saved, mostly defaults) keeps only values that differ from the defaults.
  {
    const legacy = () => localStorage.setItem('pm_bodycomp_v1', JSON.stringify({ w: 82, h: 170, age: 30, g: 'M', waist: 85, hip: 98, neck: 38, smm: 0, bfm: 0, rhr: 65, hrv: 0, sleepH: 7, remH: 1.5, deepH: 1.2, stress: 4, anxiety: 3, mood: 7, mets: 6, caffeineCutoff: '14:00', noiseDb: 45, vo2: 0, bmd: 0 }))
    const { ctx, page } = await open(1440, legacy)
    await fold(page, 'Measurements')
    assert.equal(await field(page, 'Weight (kg)').inputValue(), '82', 'a real legacy value is kept')
    assert.equal(await field(page, 'Height (cm)').inputValue(), '', 'a legacy default is not shown as if it were entered')
    assert.match(await page.locator('body').innerText(), /to see your score/)
    await ctx.close()
  }
  assert.deepEqual(errors, [], `no page errors: ${errors.join(' | ')}`)
  console.log('body-composition-check: ok')
} finally { await browser.close() }
