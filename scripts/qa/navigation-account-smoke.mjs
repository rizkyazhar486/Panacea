import assert from 'node:assert/strict'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.NAVIGATION_QA_ORIGIN || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })

try {
  for (const [width, height, role] of [[390, 844, 'pasien'], [320, 568, 'dokter'], [844, 390, 'owner'], [1440, 900, 'admin']]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', ...(width < 900 ? { isMobile: true, hasTouch: true } : {}) })
    await context.addInitScript(role => {
      localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: {
        email: 'navigation-qa@localhost.test', name: 'Navigation QA', role, isOwner: role === 'owner',
        isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01',
      }, loginAt: Date.now() }))
      localStorage.setItem('panacea_onboarded_v1', '1')
      localStorage.setItem('panacea_assessment_prompt_v1', '1')
    }, role)
    const page = await context.newPage()
    page.setDefaultTimeout(45_000)
    console.log(`Checking ${width}×${height}, ${role}`)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${origin}/#/settings`, { waitUntil: 'domcontentloaded' })
    const account = page.getByRole('button', { name: 'Account and log out', exact: true })
    const panel = page.getByRole('region', { name: 'Account', exact: true })
    const spaces = page.getByRole('button', { name: 'Open Panacea spaces', exact: true })

    // Skip content must preserve HashRouter's route, not navigate to an anchor route.
    await page.getByRole('link', { name: 'Skip to content' }).focus()
    await page.keyboard.press('Enter')
    assert.equal(await page.evaluate(() => document.activeElement.id), 'panacea-main')
    assert.equal(await page.evaluate(() => location.hash), '#/settings')

    await account.click()
    await panel.waitFor({ state: 'visible' })
    assert.equal(await account.getAttribute('aria-expanded'), 'true')
    assert.equal(await panel.getByRole('link', { name: 'Profile & Medical Records' }).evaluate(el => el === document.activeElement), true)
    // A visible DOM node is insufficient: prove the logout action receives pointer hits.
    const logout = panel.getByRole('button', { name: 'Log out', exact: true })
    await logout.scrollIntoViewIfNeeded()
    const hit = await logout.evaluate(el => {
      const r = el.getBoundingClientRect()
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return { reachable: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && el.contains(top),
        rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom }, covering: top?.outerHTML.slice(0, 300) }
    })
    if (!hit.reachable) await page.screenshot({ path: '/tmp/panacea-account-unreachable.png' })
    assert.equal(hit.reachable, true, `Logout clipped or covered at ${width}×${height}: ${JSON.stringify(hit)}`)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await page.keyboard.press('Escape')
    await panel.waitFor({ state: 'hidden' })
    assert.equal(await account.evaluate(el => el === document.activeElement), true)

    await account.click()
    await page.locator('#panacea-main').click({ position: { x: 5, y: 5 } })
    await panel.waitFor({ state: 'hidden' })
    await account.click()
    await account.focus()
    await page.keyboard.press('Shift+Tab')
    await panel.waitFor({ state: 'hidden' })

    // Shift+Tab may land on the skip link; leave its intentional focus overlay.
    await spaces.focus()
    await spaces.click()
    const navigation = page.getByRole('navigation', { name: 'Panacea spaces' })
    await navigation.waitFor({ state: 'visible' })
    assert.equal(await navigation.getByRole('link', { name: 'Home', exact: true }).evaluate(el => el === document.activeElement), true)
    await page.keyboard.press('Escape')
    await navigation.waitFor({ state: 'hidden' })
    assert.equal(await spaces.evaluate(el => el === document.activeElement), true)
    await spaces.click()
    const destination = navigation.getByRole('link', { name: 'Records', exact: true })
    const destinationHash = (await destination.getAttribute('href')).slice(1)
    await destination.click()
    await page.waitForFunction(hash => location.hash === `#${hash}`, destinationHash)
    await navigation.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: 'Account and log out', exact: true }).click()
    await panel.getByRole('link', { name: 'Account Settings' }).click()
    await page.waitForFunction(() => location.hash === '#/settings')
    await panel.waitFor({ state: 'hidden' })

    // Logout clears the remembered account and returns to the public entry.
    await account.click()
    await panel.getByRole('button', { name: 'Log out', exact: true }).click()
    await account.waitFor({ state: 'hidden' })
    assert.equal(await page.evaluate(() => localStorage.getItem('panaceamed.session.v1')), null)
    assert.equal(await page.evaluate(() => location.hash), '#/')
    assert.deepEqual(errors, [])
    await context.close()
    console.log(`Account/navigation passed: ${width}×${height}, ${role}`)
  }

  const guest = await browser.newPage()
  await guest.goto(`${origin}/#/settings`, { waitUntil: 'domcontentloaded' })
  await guest.getByRole('button', { name: /masuk/i }).first().waitFor()
  assert.equal(await guest.getByRole('button', { name: 'Account and log out', exact: true }).count(), 0)
  await guest.close()
  console.log('Signed-out entry does not expose account controls')
} finally {
  await browser.close()
}
