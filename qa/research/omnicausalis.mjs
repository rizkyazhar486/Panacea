import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.OMNICAUSALIS_ORIGIN || 'http://127.0.0.1:4173'
const output = process.env.OMNICAUSALIS_OUTPUT || 'artifacts/omnicausalis'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
const evidence = []
let activePage
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const mobile = viewport.width < 1024
    const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: mobile ? 'reduce' : 'no-preference' })
    activePage = page
    page.setDefaultTimeout(30_000)
    const errors = [], writes = []
    page.on('pageerror', error => errors.push(error.message))
    // Sesi UI sintetis membuka shell aplikasi; ini bukan bukti autentikasi backend.
    await page.addInitScript(() => {
      localStorage.clear()
      localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: {
        email: ['omnicausalis-qa', 'example.test'].join('@'), name: 'Synthetic research visitor', role: 'pasien', isSubscriber: false,
        loggedAt: new Date().toISOString(),
      }, loginAt: Date.now() }))
      localStorage.setItem('panacea_onboarded_v1', '1')
      localStorage.setItem('panacea_assessment_prompt_v1', '1')
    })
    // Batas jaringan ditutup; upaya tulis tetap direkam dan harus nihil.
    await page.route('**/api/**', route => {
      const request = route.request()
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push({ method: request.method(), path: new URL(request.url()).pathname })
      return route.abort()
    })
    await page.goto(`${origin}/#/frontier-health?workspace=omnicausalis`)
    const workbench = page.getByTestId('omnicausalis')
    await workbench.getByRole('heading', { name: 'Panacea Omnicausalis', exact: true }).waitFor()
    await workbench.getByText('Research demonstration · Not clinically reviewed.', { exact: false }).waitFor()
    const inspector = workbench.getByTestId('evidence-inspector')
    assert.equal(await inspector.getByRole('link', { name: /Chouchani/ }).getAttribute('href'), 'https://pubmed.ncbi.nlm.nih.gov/25383517/')
    const relationship = workbench.getByLabel('Inspect relationship', { exact: true })
    await relationship.selectOption('inflammation-organ')
    await inspector.getByText('UNKNOWN · translation gap', { exact: true }).waitFor()
    assert.equal(await inspector.getByRole('link', { name: /Kim et al/ }).getAttribute('href'), 'https://pubmed.ncbi.nlm.nih.gov/17592640/')
    await relationship.selectOption('organ-clinical')
    await inspector.getByText('No validated source mapping is connected for this link.', { exact: true }).waitFor()
    const search = workbench.getByRole('searchbox', { name: 'Find a component' })
    await search.fill('unsupported quantum prediction')
    await workbench.getByText(/UNKNOWN — no curated relationship found/).waitFor()
    await search.fill('')
    const component = workbench.getByRole('button', { name: /Succinate metabolism/ })
    await component.focus()
    await page.keyboard.press('Enter')
    assert.equal(await relationship.inputValue(), 'succinate-redox', 'keyboard selects the same evidence as the diagram')

    const delivery = workbench.getByLabel('Toy delivery parameter (0–1)', { exact: true })
    const gain = workbench.getByLabel('Toy response gain (0–1)', { exact: true })
    const execute = workbench.getByRole('button', { name: 'Run comparison', exact: true })
    const result = workbench.getByTestId('simulation-output')
    const original = await result.innerText()
    await delivery.fill('')
    await execute.click()
    await workbench.getByRole('alert').filter({ hasText: 'Missing is not zero' }).waitFor()
    assert.equal(await result.innerText(), original, 'missing input does not replace the existing run')
    await delivery.fill('-0.1')
    await execute.click()
    await workbench.getByRole('alert').filter({ hasText: 'finite numbers between 0 and 1' }).waitFor()
    assert.equal(await result.innerText(), original, 'invalid input does not produce a new run')
    await delivery.fill('1')
    await execute.click()
    assert.match(await result.innerText(), /Reserve 1\.000 · Stress 0\.000 · Response 0\.000/)
    await delivery.fill('0.2')
    await gain.fill('0.4')
    await execute.click()
    assert.equal(await result.innerText(), original, 'same inputs reproduce the same result')
    await workbench.getByLabel('Disturbance protocol', { exact: true }).selectOption('ongoing')
    await execute.click()
    assert.notEqual(await result.innerText(), original, 'a different protocol changes the calculated scenario')
    const replay = workbench.getByRole('button', { name: 'Play replay', exact: true })
    if (mobile) assert.equal(await replay.isDisabled(), true, 'reduced motion disables automatic replay')
    else {
      await replay.click()
      await workbench.getByRole('button', { name: 'Pause replay', exact: true }).waitFor()
      await page.waitForFunction(() => !document.querySelector('[data-testid="simulation-output"]').textContent.includes('Model time 0.0'), null, { timeout: 5000 })
      await workbench.getByRole('button', { name: 'Pause replay', exact: true }).click()
    }
    await workbench.getByLabel('Inspect model time', { exact: true }).focus()
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowRight')
    assert.match(await result.innerText(), /Model time 0\.1/)
    await workbench.getByText('Equations, assumptions and reproducible data', { exact: true }).click()
    const href = await workbench.getByRole('link', { name: 'Download reproducible run', exact: true }).getAttribute('href')
    const exported = JSON.parse(decodeURIComponent(href.split(',').slice(1).join(',')))
    assert.equal(exported.clinically_reviewed, false)
    assert.equal(exported.mode, 'illustrative')
    assert.equal(exported.parameters.reperfusion, false)
    assert.equal(exported.timeUnit, 'model-time')
    assert.equal(exported.points.length, 241)
    assert.match(exported.assumptions.parameterSource, /no physiological calibration/)
    assert.equal(await workbench.getByRole('link', { name: 'Open Body Exposure', exact: true }).getAttribute('href'), '#/body-explorer')
    const geometry = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth }))
    assert.ok(geometry.documentWidth <= geometry.width, `unintentional horizontal overflow: ${JSON.stringify(geometry)}`)
    const contrast = await workbench.evaluate(root => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const luminance = rgb => rgb.slice(0, 3).map(v => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
      return [...root.querySelectorAll('p, span, a, button:not(:disabled), input, select, output')].filter(e => e.getClientRects().length > 0 && !e.closest(':disabled')).map(e => {
        const ancestors = []; for (let n = e; n; n = n.parentElement) ancestors.unshift(n)
        ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1, 1)
        for (const n of ancestors) { ctx.fillStyle = getComputedStyle(n).backgroundColor; ctx.fillRect(0, 0, 1, 1) }
        const background = luminance([...ctx.getImageData(0, 0, 1, 1).data])
        ctx.fillStyle = getComputedStyle(e).color; ctx.fillRect(0, 0, 1, 1)
        const foreground = luminance([...ctx.getImageData(0, 0, 1, 1).data])
        return { text: (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 55), ratio: (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05) }
      })
    })
    assert.deepEqual(contrast.filter(c => c.ratio < 4.5), [], 'research text must retain 4.5:1 contrast in the actual shell')
    const safety = workbench.getByRole('complementary', { name: 'Research safety boundary' })
    assert.equal(await safety.locator('[data-pmd-has-context="true"]').count(), 0, 'safety boundary must not be hidden behind automatic prose disclosure')
    assert.ok(await safety.locator('p').evaluate(e => e.scrollHeight <= e.clientHeight + 1), 'complete safety boundary remains visible')
    assert.deepEqual(errors, [], 'actual route has no uncaught browser errors')
    assert.deepEqual(writes, [], 'research controls must not attempt backend writes')
    await page.screenshot({ path: `${output}/${viewport.width}.png`, fullPage: true })
    await workbench.getByRole('link', { name: 'Return to Discovery', exact: true }).click()
    const open = page.getByRole('link', { name: 'Open Omnicausalis · mechanism and simulation workspace', exact: true })
    await open.waitFor()
    await open.click()
    await page.getByTestId('omnicausalis').waitFor()
    assert.deepEqual(errors, [], 'return navigation preserves the original Discovery workbench')
    evidence.push({ viewport, reducedMotion: mobile, actualRoute: '/#/frontier-health?workspace=omnicausalis', sourceInspection: true, unknownRemainsUnknown: true, negativeInputsRejected: true, reproducibleComparison: true, exportClinicallyReviewed: false, backendWrites: writes.length, minimumTextContrast: Math.min(...contrast.map(c => c.ratio)), safetyBoundaryUnclamped: true, geometry, errors })
    await page.close()
  }
  await writeFile(`${output}/evidence.json`, JSON.stringify({ evidence, syntheticIllustration: true, clinicallyReviewed: false, clinicalValidation: 'NOT_PERFORMED' }, null, 2))
  console.log(JSON.stringify({ ok: true, route: 'omnicausalis', viewports: evidence.map(e => e.viewport), backendWrites: 0, clinicallyReviewed: false }))
} catch (error) {
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {})
  throw error
} finally { await browser.close() }
