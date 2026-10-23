// F2: exercise every rotating quote in the real app, rather than checking a CSS class.
// Date is an injected browser input; timers, rendering, dismissal and the API stay real.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { KUTIPAN_HIDUP } from '../../src/lib/lifeQuotes.ts'

const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const chromium = pw.chromium ?? pw.default.chromium
const API = process.env.QA_API || 'http://127.0.0.1:18790'
const APP = process.env.QA_URL || 'http://localhost:5190/'
const response = await fetch(API + '/api/auth/dev-login', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'quote-layout@example.com', role: 'pasien', name: 'Quote Layout' }),
})
assert.equal(response.status, 200, 'synthetic patient login must succeed')
const login = await response.json()
assert.equal(typeof login.token, 'string')
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
const measurements = []
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: 'reduce', timezoneId: 'UTC' })
    try {
      await ctx.addInitScript(({ token, theme }) => {
        localStorage.setItem('panaceamed.session.v1', JSON.stringify({ loginAt: Date.now(), account: { email: 'quote-layout@example.com', name: 'Quote Layout', role: 'pasien', isOwner: false, isSubscriber: false, loggedAt: new Date().toISOString() } }))
        localStorage.setItem('pmd-token', token)
        localStorage.setItem('panacea_onboarded_v1', '1')
        localStorage.setItem('panacea_assessment_prompt_v1', '1')
        localStorage.setItem('pmd-theme', theme)
        localStorage.removeItem('pmd-quote-seen-date')
      }, { token: login.token, theme })
      const page = await ctx.newPage()
      let firstHeight
      for (let index = 0; index < KUTIPAN_HIDUP.length; index++) {
        console.log(`daily-quote-layout: ${viewport.width}/${theme}/quote-${index}`)
        await page.clock.setFixedTime(new Date(Date.UTC(2026, 0, index + 1, 12)))
        // Repeating goto on the same hash can be a same-document navigation;
        // reload to remount the once-per-day banner after its previous dismissal.
        if (index === 0) await page.goto(APP + '#/', { waitUntil: 'domcontentloaded', timeout: 120000 })
        else await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
        const reminder = page.locator('[data-daily-reminder]')
        await reminder.waitFor({ state: 'visible', timeout: 60000 })
        await page.locator('main h1').first().waitFor({ state: 'visible', timeout: 60000 })
        assert.ok((await reminder.innerText()).includes(KUTIPAN_HIDUP[index].quote), 'the requested date must render its actual quote')
        const measured = await reminder.evaluate((element) => {
          const box = element.getBoundingClientRect()
          const heading = document.querySelector('main h1')?.getBoundingClientRect()
          if (!heading || heading.width <= 0 || heading.height <= 0) throw new Error('Home heading must be visible before overlap measurement')
          return { height: box.height, overflow: document.documentElement.scrollWidth - innerWidth,
            overlapsHeading: Math.min(box.right, heading.right) > Math.max(box.left, heading.left) && Math.min(box.bottom, heading.bottom) > Math.max(box.top, heading.top) }
        })
        firstHeight ??= measured.height
        assert.ok(measured.height > 0 && Math.abs(measured.height - firstHeight) <= 1, `${viewport.width}/${theme}/quote-${index}: rotating content must not move the Home layout`)
        assert.ok(measured.overflow <= 1, 'quote must not create horizontal overflow')
        assert.equal(measured.overlapsHeading, false, 'quote must not cover the Home heading')
        await reminder.getByRole('button', { name: 'Dismiss', exact: true }).click()
        await reminder.waitFor({ state: 'hidden' })
        measurements.push({ width: viewport.width, theme, index, ...measured })
      }
    } finally { await ctx.close() }
  }
} finally {
  await browser.close()
  if (process.env.QA_OUT) writeFileSync(process.env.QA_OUT, JSON.stringify({ expected: KUTIPAN_HIDUP.length * 4, measurements }, null, 2))
}
console.log(`daily-quote-layout: ${measurements.length} real-app date/viewport/theme cases; stable layout, no overlap/overflow, dismissal passed`)
