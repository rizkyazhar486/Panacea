import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

/** Exercise the real respiratory workspace: blank is not zero, impossible inputs are refused, nothing is persisted. */
export async function verifyGasExchangeIdentities(page, url) {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.context().addInitScript(() => {
    const account = { email: 'body3d-qa@localhost.test', name: 'Body3D QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01' }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
    const today = new Date()
    localStorage.setItem('pmd-quote-seen-date', `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`)
  })
  await page.goto(url)
  await page.locator('[data-unified-human-simulation-projector]').waitFor({ timeout: 45_000 })
  await page.getByRole('tab', { name: 'Respiratory', exact: true }).click()
  await page.locator('[data-body-exposure-mode-rail]').getByRole('button', { name: 'Physiology', exact: true }).click()
  const lab = page.locator('[data-gas-exchange-identities="v1"]')
  await lab.waitFor()
  await lab.locator('summary').first().click()
  const dead = lab.locator('section[aria-label="Dead-space fraction"]')
  const shunt = lab.locator('section[aria-label="Shunt fraction"]')
  const state = section => section.locator('[data-identity-state]').getAttribute('data-identity-state')
  const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])))

  // 1. nothing prefilled; empty is "missing", never a computed number
  assert.equal(await dead.getByRole('textbox').first().inputValue(), '')
  assert.equal(await state(dead), 'incomplete')
  assert.equal(await state(shunt), 'incomplete')
  assert.match(await dead.innerText(), /never as zero/)

  // 2. a valid pair computes the exact identity and shows both shares
  await dead.getByRole('textbox', { name: 'Gas identity: PaCO₂', exact: true }).fill('40')
  assert.equal(await state(dead), 'incomplete', 'one field filled is still incomplete')
  await dead.getByRole('textbox', { name: 'Gas identity: Mixed expired PCO₂', exact: true }).fill('28')
  assert.equal(await state(dead), 'ok')
  assert.match(await dead.innerText(), /0\.300/)
  assert.match(await dead.innerText(), /Dead space \(VD\): 30\.0%/)
  assert.match(await dead.innerText(), /Alveolar share \(VT − VD\): 70\.0%/)
  const bar = await dead.locator('[role="img"]').getAttribute('aria-label')
  assert.match(bar, /30\.0 percent.*70\.0 percent/)
  const widths = await dead.locator('[data-share]').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width))
  assert.ok(Math.abs(widths[0] / (widths[0] + widths[1]) - 0.3) < 0.01, `bar proportion ${JSON.stringify(widths)}`)
  assert.match(await dead.innerText(), /derived from your entered values/)
  assert.ok(await dead.locator('a[href="https://pubmed.ncbi.nlm.nih.gov/28223465/"]').count() === 1)

  // 3. comma decimal accepted; a typed 0 is a value (PēCO₂ = 0 → fraction 1), not "missing"
  await dead.getByRole('textbox', { name: 'Gas identity: PaCO₂', exact: true }).fill('5,3')
  await dead.getByRole('textbox', { name: 'Gas identity: Mixed expired PCO₂', exact: true }).fill('0')
  assert.equal(await state(dead), 'ok')
  assert.match(await dead.innerText(), /1\.000/)

  // 4. impossible combination is refused without clamping; invalid text names the field
  await dead.getByRole('textbox', { name: 'Gas identity: Mixed expired PCO₂', exact: true }).fill('9')
  assert.equal(await state(dead), 'rejected')
  assert.equal(await dead.locator('[data-share]').count(), 0, 'a refused input must not leave a bar')
  assert.match(await dead.innerText(), /not clamped/)
  await dead.getByRole('textbox', { name: 'Gas identity: Mixed expired PCO₂', exact: true }).fill('abc')
  assert.equal(await state(dead), 'invalid-field')
  assert.match(await dead.innerText(), /Mixed expired PCO₂ must be a plain number/)

  // 5. shunt: exact value, boundary, and the venous-admixture limit stays visible
  await shunt.getByRole('textbox', { name: 'Gas identity: CcO₂', exact: true }).fill('20')
  await shunt.getByRole('textbox', { name: 'Gas identity: CaO₂', exact: true }).fill('18')
  await shunt.getByRole('textbox', { name: 'Gas identity: CvO₂', exact: true }).fill('14')
  assert.equal(await state(shunt), 'ok')
  assert.match(await shunt.innerText(), /0\.333/)
  assert.match(await shunt.innerText(), /venous admixture, not pure shunt/)
  assert.match(await shunt.innerText(), /not printed in any abstract/)
  await shunt.getByRole('textbox', { name: 'Gas identity: CaO₂', exact: true }).fill('21')
  assert.equal(await state(shunt), 'rejected')

  // 6. clear returns every field to empty
  await lab.getByRole('button', { name: 'Clear entered values', exact: true }).click()
  assert.equal(await dead.getByRole('textbox').first().inputValue(), '')
  assert.equal(await state(dead), 'incomplete')
  assert.equal(await state(shunt), 'incomplete')

  // 7. entering values must not write anything to persisted state
  await dead.getByRole('textbox').first().fill('40')
  const after = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])))
  const changedKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => before[key] !== after[key])
  assert.deepEqual(changedKeys, [], 'typed measurements must not be persisted')

  const touch = await lab.getByRole('textbox').evaluateAll(nodes => nodes.map(node => Math.round(node.getBoundingClientRect().height)))
  assert.ok(touch.every(height => height >= 44), `touch targets ${JSON.stringify(touch)}`)
  const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }))
  assert.ok(width.document <= width.viewport + 1, `mobile overflow: ${JSON.stringify(width)}`)
  assert.deepEqual(errors, [], 'respiratory workspace runtime errors')
  return { viewport: width.viewport, deadSpaceExample: 0.3, shuntExample: 1 / 3, minTouchTargetPx: Math.min(...touch), persistedStateUnchanged: true }
}

if (process.argv[1]?.endsWith('gas-exchange-identities-smoke.mjs')) {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader'] })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const metrics = await verifyGasExchangeIdentities(page, process.env.GAS_IDENTITY_QA_URL || 'http://127.0.0.1:4173/#/fitness-hub?view=body-exposure')
    await mkdir('artifacts', { recursive: true })
    await writeFile('artifacts/body3d-gas-exchange-identities.json', JSON.stringify(metrics, null, 2))
    await page.locator('[data-gas-exchange-identities]').screenshot({ path: 'artifacts/body3d-gas-exchange-identities.png' })
    console.log(JSON.stringify(metrics))
  } finally { await browser.close() }
}
