// Home's daily quote (src/components/dashboard/DailyQuoteBanner.tsx) sits in Home's content flow, so it must never move Home
// under the reader: it is decided on the first render (a card inserted ~1 s later pushed the page 116 px down), and the reading
// timer only records the day as seen (removing the card ~13 s later jumped the page 116 px up). Each was CLS 0.127 at 390x844.
// Runs against the served production build with a synthetic local patient session; Playwright's clock moves time past the
// reading window; shifts come from the browser's Layout Instability API.
//   QUOTE_QA_ORIGIN=http://127.0.0.1:4173 node scripts/qa/daily-quote-shift-smoke.mjs
import assert from 'node:assert/strict'
import { BACA_MAKS_MS } from '../../src/lib/lifeQuotes.ts'
const pw = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const chromium = pw.chromium ?? pw.default.chromium

const ORIGIN = (process.env.QUOTE_QA_ORIGIN || 'http://127.0.0.1:4173').replace(/\/$/, '')
const START = new Date('2026-03-10T09:00:00')
const SHIFTS = `window.__shifts = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__shifts.push({
  value: e.value, input: e.hadRecentInput,
  sources: (e.sources || []).map((s) => s.node && s.node.nodeType === 1 ? s.node.tagName.toLowerCase() + '.' + String(s.node.className).trim().split(/\\s+/)[0] : 'text') })))
  .observe({ type: 'layout-shift', buffered: true })`

const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })

// seen: null (never), 'today' or 'yesterday', resolved against the page's own (fake) clock.
async function open(seen = null) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  await page.clock.install({ time: START })
  await context.addInitScript({ content: SHIFTS })
  await context.addInitScript((seen) => {
    // Seed once per tab: init scripts also run on reload, which must keep what the app itself stored.
    if (sessionStorage.getItem('qa-quote-seeded')) return
    sessionStorage.setItem('qa-quote-seeded', '1')
    const account = { id: 'qa-quote', email: 'quote-qa@localhost.test', name: 'QA Quote', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString() }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
    const d = new Date(); if (seen === 'yesterday') d.setDate(d.getDate() - 1)
    if (seen) localStorage.setItem('pmd-quote-seen-date', `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)
    else localStorage.removeItem('pmd-quote-seen-date')
  }, seen)
  await page.goto(`${ORIGIN}/#/`, { waitUntil: 'load', timeout: 120000 })
  await page.locator('main h1').first().waitFor({ timeout: 60000 })
  return { context, page }
}
const card = (page) => page.locator('[data-daily-reminder]')
const unexpected = (page) => page.evaluate(() => window.__shifts.filter((s) => !s.input))
const shiftTotal = (list) => list.reduce((a, s) => a + s.value, 0)
const todayKey = (page) => page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` })
const seenKey = (page) => page.evaluate(() => localStorage.getItem('pmd-quote-seen-date'))

let failures = 0
async function check(name, fn) {
  try { await fn(); console.log(`ok - ${name}`) } catch (error) { failures += 1; console.log(`not ok - ${name}\n  ${String(error.message).split('\n').join('\n  ')}`) }
}

try {
  await check('quote_is_in_the_first_layout_and_does_not_push_home', async () => {
    const { context, page } = await open()
    await card(page).waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(2000) // past the old 500 ms reveal and Home's own first data
    const shifts = await unexpected(page)
    assert.ok(shifts.every((s) => !s.sources.includes('main.pmd-page-stage')), `Home's main moved: ${JSON.stringify(shifts)}`)
    assert.ok(shiftTotal(shifts) < 0.01, `unexpected layout shift ${shiftTotal(shifts).toFixed(4)}: ${JSON.stringify(shifts)}`)
    // Paired control: the observer does record shifts here. Dismissing removes the card after an input, which the API flags.
    await card(page).getByRole('button', { name: 'Dismiss', exact: true }).click()
    await card(page).waitFor({ state: 'detached', timeout: 15000 })
    await page.waitForTimeout(300)
    const all = await page.evaluate(() => window.__shifts)
    assert.ok(all.some((s) => s.input && s.value > 0.05), `the dismissal shift was not observed: ${JSON.stringify(all)}`)
    await context.close()
  })

  await check('reading_time_records_the_day_without_moving_home', async () => {
    const { context, page } = await open()
    await card(page).waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(1000)
    const before = (await unexpected(page)).length
    assert.equal(await seenKey(page), null, 'the day is not recorded before the reading time')
    await page.clock.fastForward(BACA_MAKS_MS + 1000)
    await page.waitForTimeout(500)
    assert.equal(await seenKey(page), await todayKey(page), 'after the reading time the day is recorded as seen')
    assert.equal(await card(page).isVisible(), true, 'the card stays in place for the reader')
    const after = await unexpected(page)
    assert.equal(after.length, before, `the reading timer moved Home: ${JSON.stringify(after.slice(before))}`)
    await context.close()
  })

  await check('dismissed_quote_stays_away_today', async () => {
    const { context, page } = await open()
    await card(page).getByRole('button', { name: 'Dismiss', exact: true }).click()
    await card(page).waitFor({ state: 'detached', timeout: 15000 })
    assert.equal(await seenKey(page), await todayKey(page), 'dismissal records the day')
    await page.reload({ waitUntil: 'load' })
    await page.locator('main h1').first().waitFor({ timeout: 60000 })
    await page.waitForTimeout(1500)
    assert.equal(await card(page).count(), 0, 'a dismissed quote must not return the same day')
    await context.close()
  })

  await check('seen_today_shows_nothing_and_seen_yesterday_shows_the_quote', async () => {
    const today = await open('today')
    await today.page.waitForTimeout(1500)
    assert.equal(await card(today.page).count(), 0, 'seen today: no card')
    assert.ok(shiftTotal(await unexpected(today.page)) < 0.01, 'seen today: Home does not move either')
    await today.context.close()
    const yesterday = await open('yesterday')
    await card(yesterday.page).waitFor({ state: 'visible', timeout: 15000 })
    await yesterday.context.close()
  })
} finally {
  await browser.close()
}

if (failures) { console.error(`daily-quote-shift-smoke: ${failures} check(s) failed`); process.exit(1) }
console.log('daily-quote-shift-smoke: all checks passed')
