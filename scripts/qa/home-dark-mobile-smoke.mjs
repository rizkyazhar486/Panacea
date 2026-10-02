import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.HOME_DARK_QA_URL || 'http://127.0.0.1:4173/#/'
const screenshotPath = process.env.HOME_DARK_QA_SCREENSHOT || 'artifacts/home-dark-mobile-390x844.png'
const metricsPath = process.env.HOME_DARK_QA_METRICS || 'artifacts/home-dark-mobile-metrics.json'

await mkdir('artifacts', { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  colorScheme: 'dark',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
})

await context.addInitScript(() => {
  const account = {
    email: 'home-dark-qa@localhost.test',
    name: 'Home Dark QA',
    role: 'pasien',
    isSubscriber: false,
    loggedAt: new Date().toISOString(),
    sex: 'L',
    dob: '1990-01-01',
  }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('pmd-theme', 'dark')

  // Give the aerobic widget a real, recent HR series so the Zone 2 card remains
  // eligible in a clean QA account. The values are deliberately mundane and
  // exist only in this browser context; production data and formulas are never
  // touched by this smoke test.
  const start = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const finish = new Date(start.getTime() + 30 * 60 * 1000)
  const hr = Array.from({ length: 31 }, (_, minute) => ({ t: minute * 60, bpm: 120 }))
  localStorage.setItem('pmd_workouts_v1', JSON.stringify([{
    id: 'home-dark-qa-zone2',
    nama: 'QA aerobic walk',
    mulai: start.toISOString(),
    selesai: finish.toISOString(),
    durasi: 30 * 60,
    hr,
    pemulihan: [],
    avgHr: 120,
    maxHr: 124,
    minHr: 116,
  }]))
})

const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

async function dismissIfVisible(locator) {
  if (await locator.isVisible().catch(() => false)) await locator.click()
}

function parseRgb(value) {
  const match = value.match(/rgba?\((\d+(?:\.\d+)?)[, ]+\s*(\d+(?:\.\d+)?)[, ]+\s*(\d+(?:\.\d+)?)/i)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

function luminance(rgb) {
  if (!rgb) return null
  const channels = rgb.map((value) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

const metrics = {
  viewport: null,
  darkResolved: false,
  lowMemoryResolved: false,
  instrumentsChecked: 0,
  transitionsChecked: 0,
  zone2Found: false,
  zone2Index: null,
  maxStageHeight: 0,
  maxShellLuminance: 0,
  maxFallbackLuminance: 0,
  pageErrors,
}

async function inspectInstrument(instrument, label) {
  const result = await instrument.evaluate((node) => {
    const shell = node.querySelector('.widget-instrument-shell-v5')
    const scroll = node.querySelector('.widget-instrument-scroll-v5')
    const active = node.querySelector('.widget-instrument-slide-v5[aria-hidden="false"]')
    const loading = active?.querySelector('.widget-instrument-loading-v29') ?? null
    const shellStyle = shell ? getComputedStyle(shell) : null
    const activeStyle = active ? getComputedStyle(active) : null
    const loadingStyle = loading ? getComputedStyle(loading) : null
    const scrollRect = scroll?.getBoundingClientRect() ?? null
    const activeRect = active?.getBoundingClientRect() ?? null
    const loadingRect = loading?.getBoundingClientRect() ?? null
    return {
      shellBackground: shellStyle?.backgroundColor ?? '',
      activeBackground: activeStyle?.backgroundColor ?? '',
      loadingBackground: loadingStyle?.backgroundColor ?? '',
      stageHeight: scrollRect?.height ?? 0,
      activeHeight: activeRect?.height ?? 0,
      loadingHeight: loadingRect?.height ?? 0,
      activeWidget: active?.getAttribute('data-widget') ?? null,
      activeEmpty: Boolean(active && !active.firstElementChild),
      activeText: active?.textContent?.trim().slice(0, 160) ?? '',
    }
  })

  const shellLum = luminance(parseRgb(result.shellBackground))
  const activeLum = luminance(parseRgb(result.activeBackground))
  const loadingLum = luminance(parseRgb(result.loadingBackground))

  metrics.maxStageHeight = Math.max(metrics.maxStageHeight, result.stageHeight)
  if (shellLum != null) metrics.maxShellLuminance = Math.max(metrics.maxShellLuminance, shellLum)
  if (loadingLum != null) metrics.maxFallbackLuminance = Math.max(metrics.maxFallbackLuminance, loadingLum)
  metrics.transitionsChecked += 1

  // The screenshot regression was a ~350px light-gray slab inside a Dark Home.
  // In Dark Mode the outer instrument shell must always remain genuinely dark.
  if (shellLum != null && shellLum > 0.12) {
    throw new Error(`${label}: Living Instrument shell is too bright in Dark Mode (${result.shellBackground}, L=${shellLum.toFixed(3)})`)
  }

  // A transient active slide is allowed while its child mounts, but it must be
  // compact and dark; it must never inherit a tall previous widget canvas.
  if (result.stageHeight > 390.5) {
    throw new Error(`${label}: active widget stage grew to ${result.stageHeight}px on low-memory mobile`)
  }
  if (result.activeEmpty && activeLum != null && activeLum > 0.12) {
    throw new Error(`${label}: empty active slide is bright (${result.activeBackground}, L=${activeLum.toFixed(3)})`)
  }
  if (result.activeEmpty && result.activeHeight > 184.5) {
    throw new Error(`${label}: empty active slide retained ${result.activeHeight}px instead of compact fallback height`)
  }
  if (result.loadingBackground && loadingLum != null && loadingLum > 0.12) {
    throw new Error(`${label}: Suspense fallback is bright (${result.loadingBackground}, L=${loadingLum.toFixed(3)})`)
  }
  if (result.loadingHeight > 184.5) {
    throw new Error(`${label}: Suspense fallback is too tall at ${result.loadingHeight}px`)
  }

  return result
}

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`Home returned HTTP ${response.status()}`)

  await dismissIfVisible(page.getByRole('button', { name: /Get Started/i }).first())
  await dismissIfVisible(page.getByRole('button', { name: /Maybe later/i }).first())

  const home = page.locator('.panacea-home').first()
  await home.waitFor({ state: 'visible', timeout: 30_000 })

  const resolved = await page.evaluate(() => ({
    dark: document.documentElement.classList.contains('dark'),
    scheme: document.documentElement.style.colorScheme || getComputedStyle(document.documentElement).colorScheme,
    lowMemory: document.documentElement.classList.contains('pmd-low-memory'),
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    overflow: document.documentElement.scrollWidth - innerWidth,
  }))
  metrics.viewport = resolved.viewport
  metrics.darkResolved = resolved.dark && resolved.scheme.includes('dark')
  metrics.lowMemoryResolved = resolved.lowMemory

  if (!metrics.darkResolved) throw new Error(`Dark appearance did not resolve: ${JSON.stringify(resolved)}`)
  if (!metrics.lowMemoryResolved) throw new Error('iPhone QA context did not enter pmd-low-memory mode')
  if (resolved.viewport.width !== 390 || resolved.viewport.height !== 844) throw new Error(`Unexpected viewport ${resolved.viewport.width}x${resolved.viewport.height}`)
  if (resolved.overflow > 2) throw new Error(`Home overflows mobile viewport by ${resolved.overflow}px`)

  const instruments = page.locator('.widget-instrument-v5')
  await instruments.first().waitFor({ state: 'visible', timeout: 30_000 })
  const instrumentCount = await instruments.count()
  if (!instrumentCount) throw new Error('No Living Instrument widget carousel rendered on Home')

  for (let instrumentIndex = 0; instrumentIndex < instrumentCount && !metrics.zone2Found; instrumentIndex += 1) {
    const instrument = instruments.nth(instrumentIndex)
    if (!await instrument.isVisible().catch(() => false)) continue
    metrics.instrumentsChecked += 1
    await instrument.scrollIntoViewIfNeeded()

    for (let step = 0; step < 24; step += 1) {
      const titleLocator = instrument.locator('.widget-instrument-title-v5')
      await titleLocator.waitFor({ state: 'visible', timeout: 5_000 })
      const title = (await titleLocator.innerText()).trim()
      const current = await inspectInstrument(instrument, `instrument ${instrumentIndex + 1} / ${title}`)

      if (/Zone 2 minutes/i.test(title)) {
        metrics.zone2Found = true
        metrics.zone2Index = current.activeWidget
        // Let the lazy/render path settle and verify the final surface too.
        await page.waitForTimeout(250)
        const settled = await inspectInstrument(instrument, 'settled Zone 2')
        if (settled.activeEmpty) throw new Error('Zone 2 active slide remained empty after settling')
        break
      }

      const next = instrument.getByRole('button', { name: 'Next widget', exact: true })
      if (!await next.isVisible().catch(() => false) || await next.isDisabled().catch(() => true)) break
      await next.click()
      // Inspect the immediate post-navigation state; this is where the original
      // Safari/PWA regression exposed the blank gray inherited-height slab.
      await page.waitForTimeout(35)
      await inspectInstrument(instrument, `instrument ${instrumentIndex + 1} transition ${step + 1}`)
    }
  }

  if (!metrics.zone2Found) throw new Error('Zone 2 widget was not reachable in the Home carousel QA fixture')
  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`)

  await page.screenshot({ path: screenshotPath, fullPage: false })
  await writeFile(metricsPath, JSON.stringify(metrics, null, 2))
} catch (error) {
  await writeFile(metricsPath, JSON.stringify({ ...metrics, failure: String(error?.stack || error) }, null, 2))
  await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => undefined)
  throw error
} finally {
  await browser.close()
}
