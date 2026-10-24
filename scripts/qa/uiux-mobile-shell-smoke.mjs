import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const origin = process.env.UIUX_MOBILE_QA_ORIGIN || 'http://127.0.0.1:4173'
const viewportWidth = Number(process.env.UIUX_MOBILE_QA_WIDTH || 390)
const viewportHeight = Number(process.env.UIUX_MOBILE_QA_HEIGHT || 844)
if (!Number.isInteger(viewportWidth) || viewportWidth < 280 || viewportWidth > 1024) {
  throw new Error(`invalid UIUX_MOBILE_QA_WIDTH: ${process.env.UIUX_MOBILE_QA_WIDTH ?? ''}`)
}
if (!Number.isInteger(viewportHeight) || viewportHeight < 320 || viewportHeight > 1600) {
  throw new Error(`invalid UIUX_MOBILE_QA_HEIGHT: ${process.env.UIUX_MOBILE_QA_HEIGHT ?? ''}`)
}
const outDir = process.env.UIUX_MOBILE_QA_DIR || `artifacts/uiux-mobile-${viewportWidth}x${viewportHeight}`
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: viewportWidth, height: viewportHeight },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
})

await context.addInitScript(() => {
  const account = {
    email: 'uiux-mobile-qa@localhost.test',
    name: 'UIUX Mobile QA',
    role: 'dokter',
    isSubscriber: false,
    loggedAt: new Date().toISOString(),
    sex: 'L',
    dob: '1990-01-01',
  }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(30_000)
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

const surfaces = [
  { id: 'home', hash: '#/', marker: '.panacea-liquid-home' },
  { id: 'clinical', hash: '#/clinical-hub', marker: 'main[aria-label="Clinical command surface"]' },
  { id: 'body-exposure', hash: '#/fitness-hub?view=body-exposure', marker: '[data-pmd-body-exposure="true"]' },
]

const report = []

for (const surface of surfaces) {
  pageErrors.length = 0
  const response = await page.goto(`${origin}/${surface.hash}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (response && !response.ok()) throw new Error(`${surface.id}: HTTP ${response.status()}`)

  await page.waitForSelector('header[data-panacea-command-bar]', { state: 'visible' })
  await page.waitForSelector('nav[aria-label="Panacea super pages"]', { state: 'visible' })
  await page.waitForSelector(surface.marker, { state: 'visible', timeout: 45_000 })

  if (surface.id === 'home') {
    const actions = page.locator(`${surface.marker} .panacea-intent-action`)
    const count = await actions.count()
    if (count < 2) {
      throw new Error(`home: expected active Home actions, found ${count}`)
    }
    for (let index = 0; index < count; index += 1) {
      const box = await actions.nth(index).boundingBox()
      if (!box) throw new Error(`home: action ${index} is not measurable`)
      if (box.width < 44 || box.height < 44) {
        throw new Error(`home: action ${index} below 44px touch floor: ${JSON.stringify(box)}`)
      }
    }

    const firstAction = actions.first()
    // preventScroll: a scrolling focus() would hide the auto-hiding command bar
    // and fail the next surface's visibility wait.
    const focusStyle = await firstAction.evaluate((node) => {
      node.focus({ preventScroll: true })
      const style = getComputedStyle(node)
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth) || 0,
      }
    })
    if (focusStyle.outlineStyle === 'none' || focusStyle.outlineWidth < 2) {
      throw new Error(`home: active action lacks a visible focus ring: ${JSON.stringify(focusStyle)}`)
    }
  }

  const metrics = await page.evaluate(({ id, marker }) => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const root = document.documentElement
    const header = document.querySelector('header[data-panacea-command-bar]')
    const zoneNav = document.querySelector('nav[aria-label="Panacea super pages"]')
    const surfaceRoot = document.querySelector(marker)

    const box = (node) => {
      const r = node?.getBoundingClientRect()
      return r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height } : null
    }

    const actionable = [...document.querySelectorAll(
      'header[data-panacea-command-bar] button, nav[aria-label="Panacea super pages"] a, nav[aria-label="Panacea super pages"] button'
    )].filter((node) => {
      const r = node.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }).map((node) => {
      const r = node.getBoundingClientRect()
      return {
        label: node.getAttribute('aria-label') || node.textContent?.trim().slice(0, 60) || node.tagName,
        width: r.width,
        height: r.height,
      }
    })

    const undersized = actionable.filter((item) => item.width < 40 || item.height < 40)
    const assistiveVisible = Boolean(document.querySelector('[data-pmd-assistive="true"]'))

    return {
      id,
      viewport: { width: viewportWidth, height: viewportHeight },
      documentScrollWidth: root.scrollWidth,
      overflowPx: root.scrollWidth - viewportWidth,
      header: box(header),
      zoneNav: box(zoneNav),
      surface: box(surfaceRoot),
      undersized,
      assistiveVisible,
    }
  }, surface)

  // Capture the exact rendered state before assertions so a failing surface
  // still leaves visual evidence in the always-uploaded workflow artifact.
  await page.screenshot({ path: `${outDir}/${surface.id}.png`, fullPage: false })

  if (metrics.viewport.width !== viewportWidth || metrics.viewport.height !== viewportHeight) {
    throw new Error(`${surface.id}: unexpected viewport ${metrics.viewport.width}x${metrics.viewport.height}`)
  }
  if (metrics.overflowPx > 2) {
    throw new Error(`${surface.id}: horizontal overflow ${metrics.overflowPx}px`)
  }
  for (const [name, rect] of [['header', metrics.header], ['zoneNav', metrics.zoneNav], ['surface', metrics.surface]]) {
    if (!rect) throw new Error(`${surface.id}: missing ${name}`)
    if (rect.left < -1 || rect.right > viewportWidth + 1) {
      throw new Error(`${surface.id}: ${name} escapes viewport: ${JSON.stringify(rect)}`)
    }
  }
  if (metrics.undersized.length) {
    throw new Error(`${surface.id}: touch targets below 40px: ${JSON.stringify(metrics.undersized.slice(0, 5))}`)
  }
  if (surface.id === 'body-exposure' && metrics.assistiveVisible) {
    throw new Error('body-exposure: floating assistive control obstructs the spatial surface')
  }
  if (pageErrors.length) {
    throw new Error(`${surface.id}: page errors: ${pageErrors.join(' | ')}`)
  }

  report.push(metrics)
}

// The spaces menu hangs from the header. A stylesheet that forced it back into flow once squeezed it to ~176px, collapsed the page title
// to 0px and let the page text show through it, so it is measured on the real page rather than assumed.
{
  pageErrors.length = 0
  await page.goto(`${origin}/#/`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForSelector('header[data-panacea-command-bar]', { state: 'visible' })
  await page.getByRole('button', { name: 'Open Panacea spaces' }).click()
  const panel = page.locator('.pmd-command-spaces')
  await panel.waitFor({ state: 'visible' })
  const menu = await page.evaluate(() => {
    const header = document.querySelector('header[data-panacea-command-bar]')
    const panelNode = document.querySelector('.pmd-command-spaces')
    const title = header.querySelector('h1')
    const hr = header.getBoundingClientRect()
    const pr = panelNode.getBoundingClientRect()
    const style = getComputedStyle(panelNode)
    const alpha = (css) => { const m = /rgba?\(([^)]+)\)/.exec(css); if (!m) return 0; const p = m[1].split(',').map((x) => Number.parseFloat(x)); return p.length > 3 ? p[3] : 1 }
    // Items below the fold are reachable only if the panel scrolls: bring each into view inside the panel before the hit test.
    const links = [...panelNode.querySelectorAll('a, button')].map((node) => {
      node.scrollIntoView({ block: 'nearest' })
      const r = node.getBoundingClientRect()
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return { label: node.textContent?.trim().slice(0, 24), top: r.top, bottom: r.bottom, covered: !(hit && panelNode.contains(hit)) }
    })
    return {
      position: style.position,
      headerBottom: hr.bottom,
      panel: { left: pr.left, right: pr.right, top: pr.top, bottom: pr.bottom, width: pr.width },
      viewportHeight: window.innerHeight,
      titleWidth: title.getBoundingClientRect().width,
      backgroundAlpha: alpha(style.backgroundColor),
      backdropFilter: style.backdropFilter,
      links,
    }
  })
  await page.screenshot({ path: `${outDir}/spaces-menu.png`, fullPage: false })
  if (menu.position !== 'absolute') throw new Error(`spaces menu: position is ${menu.position}, it must hang from the header out of flow`)
  if (menu.panel.top < menu.headerBottom - 1) throw new Error(`spaces menu: opens over the header (top ${menu.panel.top} < header bottom ${menu.headerBottom})`)
  if (menu.panel.left < -1 || menu.panel.right > viewportWidth + 1) throw new Error(`spaces menu escapes the viewport: ${JSON.stringify(menu.panel)}`)
  if (menu.panel.width < Math.min(300, viewportWidth - 24)) throw new Error(`spaces menu squeezed to ${menu.panel.width}px`)
  if (menu.panel.bottom > menu.viewportHeight + 1) throw new Error(`spaces menu runs off the screen: bottom ${menu.panel.bottom} > viewport ${menu.viewportHeight}`)
  if (menu.titleWidth < 20) throw new Error(`spaces menu: page title collapsed to ${menu.titleWidth}px`)
  if (menu.backgroundAlpha < 0.99) throw new Error(`spaces menu: background is ${menu.backgroundAlpha} opaque, page text shows through it`)
  const covered = menu.links.filter((l) => l.covered)
  if (menu.links.length < 8 || covered.length) throw new Error(`spaces menu: ${menu.links.length} items, covered or unreachable: ${JSON.stringify(covered)}`)
  if (pageErrors.length) throw new Error(`spaces menu: page errors: ${pageErrors.join(' | ')}`)
  report.push({ id: 'spaces-menu', ...menu, links: menu.links.length })
}

console.log(JSON.stringify({ ok: true, surfaces: report }, null, 2))
await browser.close()
