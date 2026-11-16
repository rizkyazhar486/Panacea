// The sign-in screen (src/pages/landing/Login.tsx + login.css) is opened by a click, so Shell loads it on demand and it stays
// out of the initial download that the F2 bundle budget measures. This smoke runs against the served production build and
// pins the behaviour: the landing never fetches the sign-in code, a click fetches it and opens the form, a slow fetch shows a
// loading status instead of a blank screen, the reference atlas opens the same screen, and a failed fetch recovers to the
// landing instead of leaving the visitor on a loading status.
//   LOGIN_QA_ORIGIN=http://127.0.0.1:4173 node scripts/qa/login-on-demand-smoke.mjs
import assert from 'node:assert/strict'
const pw = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const chromium = pw.chromium ?? pw.default.chromium

const ORIGIN = (process.env.LOGIN_QA_ORIGIN || 'http://127.0.0.1:4173').replace(/\/$/, '')
// Vite names the lazy chunk after the module (Login.tsx -> assets/Login-<hash>.js, login.css -> assets/Login-<hash>.css).
const SIGN_IN_JS = /\/assets\/Login-[\w-]+\.js(?:[?#]|$)/
const SIGN_IN_ANY = /\/assets\/Login-[\w-]+\.(?:js|css)(?:[?#]|$)/
const ENTRY_JS = /\/assets\/index-[\w-]+\.js(?:[?#]|$)/

const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })

async function open(path) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const requests = []
  page.on('request', (r) => requests.push(r.url()))
  await page.goto(`${ORIGIN}/${path}`, { waitUntil: 'load', timeout: 120000 })
  return { context, page, requests }
}
const signInButton = (page) => page.getByRole('button', { name: /^Masuk( \/ Daftar Gratis)?$/ }).first()
const emailField = (page) => page.getByPlaceholder('nama@email.com')
const loadingStatus = (page) => page.getByRole('status').filter({ hasText: 'Opening sign-in' })

let failures = 0
async function check(name, fn) {
  try { await fn(); console.log(`ok - ${name}`) } catch (error) { failures += 1; console.log(`not ok - ${name}\n  ${String(error.message).split('\n').join('\n  ')}`) }
}

try {
  await check('landing_loads_without_the_sign_in_code', async () => {
    const { context, page, requests } = await open('#/')
    await signInButton(page).waitFor({ timeout: 60000 })
    await page.waitForTimeout(1500)
    // Paired control: the listener does see the entry chunk, so an empty match below is a real absence.
    assert.ok(requests.some((u) => ENTRY_JS.test(u)), 'the request listener must see the entry chunk')
    assert.deepEqual(requests.filter((u) => SIGN_IN_ANY.test(u)), [], 'the landing must not fetch the sign-in code or styles')
    await context.close()
  })

  await check('sign_in_code_arrives_on_click_and_the_form_opens', async () => {
    const { context, page, requests } = await open('#/')
    await signInButton(page).waitFor({ timeout: 60000 })
    const before = requests.filter((u) => SIGN_IN_JS.test(u)).length
    await signInButton(page).click()
    await emailField(page).waitFor({ timeout: 30000 })
    assert.equal(before, 0, 'no sign-in code before the click')
    assert.equal(requests.filter((u) => SIGN_IN_JS.test(u)).length, 1, 'the click fetches the sign-in code once, as its own chunk')
    await context.close()
  })

  await check('slow_sign_in_code_shows_a_loading_status_then_the_form', async () => {
    const { context, page } = await open('#/')
    let release
    const released = new Promise((r) => { release = r })
    await page.route(SIGN_IN_JS, async (route) => { await released; await route.continue() })
    await signInButton(page).click()
    await loadingStatus(page).waitFor({ timeout: 15000 })
    assert.equal(await emailField(page).count(), 0, 'the form cannot appear before its code has arrived')
    release()
    await emailField(page).waitFor({ timeout: 30000 })
    await loadingStatus(page).waitFor({ state: 'detached', timeout: 15000 })
    await context.close()
  })

  await check('reference_atlas_opens_the_same_sign_in_screen', async () => {
    const { context, page, requests } = await open('#/body-explorer')
    const atlasButton = page.getByRole('button', { name: 'Masuk / Sign In' })
    await atlasButton.waitFor({ timeout: 60000 })
    assert.equal(requests.filter((u) => SIGN_IN_JS.test(u)).length, 0, 'the atlas must not fetch the sign-in code before the click')
    await atlasButton.click()
    await emailField(page).waitFor({ timeout: 30000 })
    await context.close()
  })

  await check('failed_sign_in_code_recovers_to_the_landing_instead_of_a_loading_status', async () => {
    const { context, page } = await open('#/')
    await page.route(SIGN_IN_JS, (route) => route.abort('failed'))
    await signInButton(page).click()
    // index.html's preload recovery reloads once with a fresh-asset marker while online; the visitor lands on the landing.
    await page.waitForURL(/_pmd_asset_refresh=\d+/, { timeout: 30000 })
    await signInButton(page).waitFor({ timeout: 60000 })
    assert.equal(await loadingStatus(page).count(), 0, 'no loading status may be left behind')
    await page.unroute(SIGN_IN_JS)
    await signInButton(page).click()
    await emailField(page).waitFor({ timeout: 30000 })
    await context.close()
  })
} finally {
  await browser.close()
}

if (failures) { console.error(`login-on-demand-smoke: ${failures} check(s) failed`); process.exit(1) }
console.log('login-on-demand-smoke: all checks passed')
