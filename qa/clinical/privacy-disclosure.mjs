// Actual production-built public route; no synthetic account or authentication stub.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.PRIVACY_QA_ORIGIN || 'http://127.0.0.1:4173'
const out = process.env.PRIVACY_QA_OUTPUT || 'artifacts/privacy-disclosure'
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const evidence = []
try {
  await mkdir(out, { recursive: true })
  for (const colorScheme of ['light', 'dark']) for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const context = await browser.newContext({ viewport, colorScheme, reducedMotion: 'reduce' })
    await context.addInitScript(() => {
      localStorage.setItem('panacea_onboarded_v1', '1')
      localStorage.setItem('panacea_assessment_prompt_v1', '1')
    })
    const page = await context.newPage(); const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${origin}/#/legal`, { timeout: 120000, waitUntil: 'domcontentloaded' })
    const heading = page.getByRole('heading', { name: 'Privacy & Data Protection Policy', exact: true })
    await heading.waitFor({ timeout: 60000 })
    await page.locator('#pmd-splash').waitFor({ state: 'hidden' })
    const text = await page.locator('main').innerText()
    const clipped = await page.locator('main p, main li').evaluateAll(nodes => nodes.filter(el => el.scrollHeight > el.clientHeight + 1).map(el => el.textContent))
    assert.deepEqual(clipped, [], 'the full policy must be readable without hidden context or clipped prose')
    assert.match(text, /In-app Support does not submit or retain data-rights requests/ )
    assert.match(text, /This app does not confirm receipt or completion/ )
    assert.doesNotMatch(text, /Use Support to request/ )
    assert.match(text, /Reset Saved App State resets the app state saved on this device; it does not erase other local caches or server-held records/)
    assert.match(text, /revoking a lab-sharing permission ends access through that permission/i)
    assert.match(text, /does not verify those settings/)
    assert.match(text, /not evidence of a configured live connection/)
    assert.match(text, /Last updated: 2026-10-15/)
    assert.doesNotMatch(text, /Stored in Indonesia & encrypted|always verified by licensed clinicians|delete your data at any time|verified STR\/SIP license/)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.keyboard.press('Tab')
    assert.notEqual(await page.evaluate(() => document.activeElement?.tagName), 'BODY')
    assert.deepEqual(errors, [])
    await page.screenshot({ path: `${out}/${colorScheme}-${viewport.width}.png`, fullPage: true })
    await page.getByRole('link', { name: 'Back to Panaceamed', exact: true }).click()
    await page.getByRole('button', { name: /^Masuk/ }).first().click()
    const consent = page.getByRole('checkbox')
    await consent.waitFor()
    assert.equal(await consent.isChecked(), false)
    const opener = page.getByRole('button', { name: 'Syarat Layanan & Kebijakan Privasi', exact: true })
    await opener.click()
    const dialog = page.getByRole('dialog', { name: 'Clinical Consent, Privacy & Terms', exact: true })
    await dialog.waitFor()
    assert.match(await dialog.innerText(), /In-app Support does not submit or retain data-rights requests/)
    assert.match(await dialog.innerText(), /This app does not confirm receipt or completion/)
    assert.match(await dialog.innerText(), /does not erase other local caches or server-held records/)
    assert.doesNotMatch(await dialog.innerText(), /disimpan terenkripsi|menghapus riwayat data Anda kapan saja/)
    assert.equal(await page.evaluate(() => !!document.activeElement?.closest('dialog')), true)
    const titleContrast = await dialog.locator('h3').evaluate(el => {
      const resolve = color => {
        // Canvas resolves CSS color spaces (including Tailwind oklch) to sRGB.
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
        const context = canvas.getContext('2d'); context.fillStyle = color; context.fillRect(0, 0, 1, 1)
        return [...context.getImageData(0, 0, 1, 1).data]
      }
      const luminance = rgb => {
        const linear = rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
        return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2]
      }
      const foreground = resolve(getComputedStyle(el).color)
      const background = resolve(getComputedStyle(el.closest('dialog')).backgroundColor)
      const alpha = background[3] / 255, textAlpha = foreground[3] / 255
      // Bound translucent surfaces against both black and white backdrops;
      // retain the worse contrast rather than assuming favorable underlying content.
      return Math.min(...[0, 255].map(base => {
        const surface = background.slice(0, 3).map(v => v * alpha + base * (1 - alpha))
        const value = luminance(surface)
        const ink = luminance(foreground.slice(0, 3).map((v, i) => v * textAlpha + surface[i] * (1 - textAlpha)))
        return (Math.max(ink, value) + .05) / (Math.min(ink, value) + .05)
      }))
    })
    assert.ok(titleContrast >= 4.5, `dialog heading contrast ${titleContrast} must meet 4.5:1`)
    const titleVisible = await dialog.locator('h3').evaluate(el => {
      const title = el.getBoundingClientRect(), box = el.closest('dialog').getBoundingClientRect()
      return title.top >= box.top && title.bottom <= box.bottom
    })
    assert.equal(titleVisible, true, 'the dialog must open at its heading rather than its last link')
    await page.screenshot({ path: `${out}/modal-${colorScheme}-${viewport.width}.png` })
    await page.keyboard.press('Shift+Tab')
    assert.equal(await page.evaluate(() => !!document.activeElement?.closest('dialog')), true)
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => !!document.activeElement?.closest('dialog')), true)
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(await consent.isChecked(), false, 'reading or closing the summary must not grant consent')
    assert.equal(await opener.evaluate(el => el === document.activeElement), true)
    await opener.click()
    const close = dialog.getByRole('button', { name: 'Close policy summary', exact: true })
    assert.ok((await close.boundingBox()).height >= 44)
    assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), true)
    await close.click()
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(await consent.isChecked(), false)
    assert.equal(await opener.evaluate(el => el === document.activeElement), true)
    await opener.click()
    await page.getByRole('link', { name: 'Read full policy and control details', exact: true }).click()
    await heading.waitFor()
    assert.equal(page.url().includes('#/legal'), true)
    assert.deepEqual(errors, [])
    evidence.push({ viewport, colorScheme, actualPublicRoute: '/legal', guestModalPolicyLink: true, modalFocusAndEscape: true, titleContrastMinimum: titleContrast, consentUnchanged: true, unverifiedGuaranteesAbsent: true, localAndServerDeletionDistinct: true, integrationClaimBounded: true, overflow: false, pageErrors: errors, reducedMotion: true, legallyApprovedRetention: false })
    await context.close()
  }
  await writeFile(`${out}/evidence.json`, JSON.stringify(evidence, null, 2))
  console.log('Privacy disclosure: actual /legal route, guest/light/dark, 390x844 and 1440x900, truthful control bounds, keyboard and no overflow/page errors passed')
} finally { await browser.close() }
