#!/usr/bin/env node
/**
 * Real-Stranger Multi-User & Mobile Hardening Playwright E2E Verification.
 *
 * Verifies against freshly built `dist/` via `vite preview`:
 * - Context A (Mobile iOS Safari sim: no navigator.bluetooth, denied getUserMedia):
 *   1) 15s Beta Onboarding ("Alya Beta", Patient) -> isolated beta_* profile_key
 *   2) Zero SKDI/OSCE heavy corpus chunks loaded on initial /#/ visits
 *   3) /#/scan handles denied camera gracefully with "Camera blocked" recovery + Guided Demo
 *   4) /#/sync hides dead BLE button, saves manual entry, runs JSON Export + Copy/Share fallback
 *   5) /#/profile displays Alya Beta (zero founder bleed) & submits 1-tap Beta Feedback
 *   6) 0px horizontal overflow at 360x800, 390x844, 430x932 across /, /#/body, /#/scan, /#/sync, /#/profile, /#/settings
 * - Context B (Desktop 1440x900):
 *   1) 15s Beta Onboarding ("Budi Doctor", Doctor) -> distinct beta_* profile_key, role=dokter
 *   2) Zero data bleed from User A or Founder
 *   3) 0px horizontal overflow and 0 pageerrors across desktop routes
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const PREVIEW_PORT = 4179
const BASE_URL = `http://127.0.0.1:${PREVIEW_PORT}`
const ROUTES = ['/', '/#/body', '/#/scan', '/#/sync', '/#/profile', '/#/settings']
const MOBILE_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]

function resolvePlaywrightPath() {
  if (process.env.PLAYWRIGHT_MODULE && existsSync(process.env.PLAYWRIGHT_MODULE)) {
    return process.env.PLAYWRIGHT_MODULE
  }
  const npxDir = join(process.env.HOME || '', '.npm', '_npx')
  if (existsSync(npxDir)) {
    for (const sub of readdirSync(npxDir)) {
      const candidate = join(npxDir, sub, 'node_modules', 'playwright', 'index.mjs')
      if (existsSync(candidate)) return candidate
    }
  }
  return 'playwright'
}

function resolveChromePath() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (existsSync(macChrome)) return macChrome
  return undefined
}

async function waitForServer(url, timeoutMs = 15_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* wait */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Preview server at ${url} did not respond within ${timeoutMs}ms`)
}

async function assertZeroOverflow(page, route, vp) {
  await page.setViewportSize(vp)
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(350)
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  assert.ok(
    metrics.scrollWidth <= metrics.innerWidth,
    `Horizontal overflow at ${route} (${vp.width}x${vp.height}): scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`,
  )
}

async function main() {
  const pwMod = resolvePlaywrightPath()
  const pw = await import(pwMod)
  const chromium = pw.chromium ?? pw.default?.chromium
  assert.ok(chromium, 'Could not load Playwright chromium')

  const previewProc = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort', '--host', '127.0.0.1'],
    { stdio: 'pipe', env: process.env },
  )

  let browser
  try {
    await waitForServer(BASE_URL)
    const executablePath = resolveChromePath()
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: ['--no-sandbox', '--disable-gpu'],
    })

    // ── Context A: iOS Safari Mobile Stranger (390x844, no BLE, denied camera) ──
    const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 } })
    await ctxA.addInitScript(() => {
      try {
        // Simulate iOS Safari missing Web Bluetooth GATT
        Object.defineProperty(Navigator.prototype, 'bluetooth', {
          configurable: true,
          get() {
            return undefined
          },
        })
      } catch {
        /* ignore */
      }
      try {
        const denied = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError'))
        Object.defineProperty(navigator, 'mediaDevices', {
          configurable: true,
          value: { getUserMedia: denied },
        })
      } catch {
        /* ignore */
      }
    })

    const pageA = await ctxA.newPage()
    const errorsA = []
    const heavyRequestsA = []
    pageA.on('pageerror', (err) => errorsA.push(String(err)))
    pageA.on('request', (req) => {
      const url = req.url()
      if (/skdiDiseaseNotes|osceStationNote/i.test(url)) {
        heavyRequestsA.push(url)
      }
    })

    await pageA.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await pageA.waitForSelector('[data-testid="beta-name-input"]', { timeout: 10_000 })
    await pageA.fill('[data-testid="beta-name-input"]', 'Alya Beta')
    await pageA.click('[data-testid="beta-role-patient"]')
    await pageA.click('[data-testid="beta-submit-btn"]')

    await pageA.waitForSelector('[data-testid="first-run-mission-bar"]', { timeout: 10_000 })
    const sessRawA = await pageA.evaluate(() => localStorage.getItem('panaceamed.session.v1'))
    assert.ok(sessRawA, 'User A session must be persisted')
    const sessA = JSON.parse(sessRawA)
    assert.match(sessA.account.id, /^beta:beta_/)
    assert.equal(sessA.account.name, 'Alya Beta')
    assert.equal(sessA.account.role, 'pasien')
    const profileKeyA = sessA.account.id.slice(5)

    // /#/scan denied camera recovery card
    await pageA.goto(`${BASE_URL}/#/scan`, { waitUntil: 'domcontentloaded' })
    await pageA.waitForSelector('button:has-text("Start Camera")', { timeout: 10_000 })
    await pageA.click('button:has-text("Start Camera")')
    await pageA.waitForSelector('[data-testid="camera-blocked-recovery"]', { timeout: 5_000 })
    const recoveryText = await pageA.textContent('[data-testid="camera-blocked-recovery"]')
    assert.match(recoveryText || '', /Camera blocked/i)
    await pageA.click('[data-testid="scan-guided-demo-btn"]')

    // /#/sync no BLE button + Quick Manual Entry + Copy/Share Export
    await pageA.goto(`${BASE_URL}/#/sync`, { waitUntil: 'domcontentloaded' })
    await pageA.waitForSelector('[data-testid="sync-manual-save-btn"]', { timeout: 10_000 })
    const bleCount = await pageA.locator('button:has-text("Bluetooth HR / EEG")').count()
    assert.equal(bleCount, 0, 'Web Bluetooth button must be hidden on iOS Safari simulation')
    await pageA.fill('[data-testid="sync-manual-weight"]', '59.4')
    await pageA.fill('[data-testid="sync-manual-hr"]', '58')
    await pageA.fill('[data-testid="sync-manual-sleep"]', '7.6')
    await pageA.click('[data-testid="sync-manual-save-btn"]')
    await pageA.waitForSelector('text=Saved 3 manual reading', { timeout: 5_000 })
    await pageA.click('button:has-text("Export JSON")')

    // /#/profile User A identity check + 1-tap Beta Feedback submission
    await pageA.goto(`${BASE_URL}/#/profile`, { waitUntil: 'domcontentloaded' })
    await pageA.waitForSelector('[data-testid="feedback-note-input"]', { timeout: 10_000 })
    const profileBodyA = await pageA.textContent('main')
    assert.ok(profileBodyA?.includes('Alya Beta'), 'Profile must display Alya Beta')
    assert.ok(!profileBodyA?.includes('dr. Rizky Muhammad Azrissal'), 'Beta user must not leak founder profile name')
    await pageA.click('[data-testid="feedback-rate-5"]')
    await pageA.click('[data-testid="feedback-tag-love"]')
    await pageA.fill('[data-testid="feedback-note-input"]', 'Works smoothly on 390px Safari without BLE.')
    await pageA.click('[data-testid="feedback-submit-btn"]')
    await pageA.waitForSelector('[data-testid="feedback-status-msg"]', { timeout: 5_000 })

    // 0px horizontal overflow across 360x800, 390x844, 430x932
    for (const vp of MOBILE_VIEWPORTS) {
      for (const route of ROUTES) {
        await assertZeroOverflow(pageA, route, vp)
      }
    }

    assert.equal(heavyRequestsA.length, 0, `Heavy corpus chunk loaded unexpectedly: ${heavyRequestsA.join(',')}`)
    assert.equal(errorsA.length, 0, `Mobile Context A pageerrors: ${errorsA.join(' | ')}`)
    await ctxA.close()

    // ── Context B: Desktop Fresh Stranger (1440x900) ──
    const ctxB = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const pageB = await ctxB.newPage()
    const errorsB = []
    pageB.on('pageerror', (err) => errorsB.push(String(err)))

    await pageB.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await pageB.waitForSelector('[data-testid="beta-name-input"]', { timeout: 10_000 })
    await pageB.fill('[data-testid="beta-name-input"]', 'Budi Doctor')
    await pageB.click('[data-testid="beta-role-doctor"]')
    await pageB.click('[data-testid="beta-submit-btn"]')

    await pageB.waitForSelector('[data-testid="first-run-mission-bar"]', { timeout: 10_000 })
    const sessRawB = await pageB.evaluate(() => localStorage.getItem('panaceamed.session.v1'))
    assert.ok(sessRawB, 'User B session must be persisted')
    const sessB = JSON.parse(sessRawB)
    assert.match(sessB.account.id, /^beta:beta_/)
    assert.equal(sessB.account.name, 'Budi Doctor')
    assert.equal(sessB.account.role, 'dokter')
    const profileKeyB = sessB.account.id.slice(5)
    assert.notEqual(profileKeyB, profileKeyA, 'Two fresh strangers must receive distinct profile_keys')

    await pageB.goto(`${BASE_URL}/#/profile`, { waitUntil: 'domcontentloaded' })
    await pageB.waitForSelector('[data-testid="feedback-note-input"]', { timeout: 10_000 })
    const profileBodyB = await pageB.textContent('main')
    assert.ok(profileBodyB?.includes('Budi Doctor'), `Desktop Context B must show Budi Doctor; got: ${profileBodyB?.slice(0, 200)}`)
    assert.ok(!profileBodyB?.includes('Alya Beta'), 'Zero data bleed from User A')
    assert.ok(!profileBodyB?.includes('dr. Rizky Muhammad Azrissal'), 'Zero founder data bleed for Beta User B')

    for (const route of ROUTES) {
      await assertZeroOverflow(pageB, route, { width: 1440, height: 900 })
    }

    assert.equal(errorsB.length, 0, `Desktop Context B pageerrors: ${errorsB.join(' | ')}`)
    await ctxB.close()

    console.log(
      JSON.stringify({
        status: 'PLAYWRIGHT_STRANGER_E2E_PASS',
        profileKeyA,
        profileKeyB,
        mobileViewportsChecked: MOBILE_VIEWPORTS.map((v) => `${v.width}x${v.height}`),
        routesChecked: ROUTES.length,
        heavyCorpusRequestsOnInitialVisit: heavyRequestsA.length,
        pageErrors: 0,
      }),
    )
  } finally {
    if (browser) await browser.close().catch(() => {})
    previewProc.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error('beta-50-stranger-e2e FAILED:', err)
  process.exit(1)
})
