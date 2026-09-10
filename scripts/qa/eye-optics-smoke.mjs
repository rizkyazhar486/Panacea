import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { expect } from '@playwright/test'

// Reuse the authenticated mobile Body smoke browser and production build.
// This exercises the shipped UI, not a stand-alone component fixture.
export async function verifyEyeOptics(page) {
  let timer
  try {
    return await Promise.race([
      runEyeOptics(page),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Eye optics smoke exceeded 120 seconds')), 120_000) }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

async function step(name, action) {
  const startedAt = Date.now()
  console.log(`eye-optics:start:${name}`)
  const result = await action()
  console.log(`eye-optics:done:${name}:${Date.now() - startedAt}ms`)
  return result
}

async function activateWithKeyboard(button) {
  await button.scrollIntoViewIfNeeded()
  await button.focus()
  await expect(button).toBeFocused()
  await button.press('Enter')
}

async function runEyeOptics(page) {
  const dismissReminder = page.getByRole('button', { name: 'Dismiss', exact: true })
  if (await dismissReminder.isVisible().catch(() => false)) {
    await step('dismiss-reminder', () => dismissReminder.click())
    await expect(dismissReminder).toHaveCount(0)
  }

  const specialty = page.getByRole('button', { name: 'Specialty labs', exact: true })
  await step('open-specialty', () => specialty.click())

  const neuro = page.getByRole('button', { name: 'Neuro & senses', exact: true })
  await step('wait-neuro', () => neuro.waitFor({ state: 'visible', timeout: 20_000 }))
  await step('activate-neuro', () => activateWithKeyboard(neuro))

  const eye = page.getByRole('button', { name: 'Eye & orbit', exact: true })
  await step('wait-eye', () => eye.waitFor({ state: 'visible', timeout: 20_000 }))
  await step('activate-eye', () => activateWithKeyboard(eye))

  const opener = page.getByRole('button', { name: 'Explore pupil & accommodation', exact: true })
  const svg = page.locator('svg[aria-label="Educational ocular optics schematic"]')
  await expect(opener).toHaveAttribute('aria-expanded', 'false')
  await expect(svg).toHaveCount(0)
  await step('open-optics', () => activateWithKeyboard(opener))
  await step('wait-optics-svg', () => expect(svg).toBeVisible())
  await expect(page.getByRole('button', { name: 'Close optics lesson', exact: true })).toHaveAttribute('aria-expanded', 'true')

  const pupil = page.getByRole('slider', { name: /Pupil aperture/ })
  const distance = page.getByRole('slider', { name: /Target distance/ })
  const lens = svg.locator('ellipse[cx="405"]')
  const gap = () => svg.locator('line[x1="365"]').evaluateAll((lines) =>
    Number(lines[1].getAttribute('y1')) - Number(lines[0].getAttribute('y2')),
  )

  await pupil.focus()
  await pupil.press('Home')
  await expect(pupil).toHaveValue('2')
  const smallGap = await gap()
  await pupil.press('End')
  await expect(pupil).toHaveValue('8')
  await expect.poll(gap).toBeGreaterThan(smallGap)
  const largeGap = await gap()

  await distance.focus()
  await distance.press('End')
  await expect(distance).toHaveValue('6')
  const farRx = Number(await lens.getAttribute('rx'))
  await distance.press('Home')
  await expect(distance).toHaveValue('0.25')
  await expect(svg).toContainText('4.00 D')
  await expect.poll(async () => Number(await lens.getAttribute('rx'))).toBeGreaterThan(farRx)
  const nearRx = Number(await lens.getAttribute('rx'))

  const phase = page.getByRole('button', { name: /03.*Accommodation/ })
  await step('activate-accommodation-phase', () => activateWithKeyboard(phase))
  await expect(phase).toHaveAttribute('aria-pressed', 'true')
  const lesson = svg.locator('xpath=ancestor::section[1]')
  await expect(lesson).toContainText('Phase 3/7')
  await expect(lesson).toContainText('Schematic dimensions are illustrative, not measured')
  const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }))
  assert.ok(width.document <= width.viewport + 2, `Eye lesson overflows: ${JSON.stringify(width)}`)
  await lesson.scrollIntoViewIfNeeded()
  // Capture only the verified Eye lesson instead of compositing the entire page,
  // which also includes the live WebGL canvas and can exceed Playwright's
  // screenshot timeout on constrained CI runners. All interaction, geometry,
  // overflow, and content assertions above remain unchanged.
  const lessonMarkup = await lesson.evaluate((element) => {
    const properties = [
      'display', 'position', 'box-sizing', 'width', 'height', 'min-width', 'max-width',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'gap',
      'grid-template-columns', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink',
      'align-items', 'justify-content', 'overflow', 'overflow-x', 'overflow-y',
      'border-width', 'border-style', 'border-color', 'border-radius',
      'background-color', 'color', 'font-family', 'font-size', 'font-weight',
      'line-height', 'letter-spacing', 'text-align', 'text-transform', 'opacity', 'transform',
    ]
    const clone = element.cloneNode(true)
    const originals = [element, ...element.querySelectorAll('*')]
    const clones = [clone, ...clone.querySelectorAll('*')]
    originals.forEach((source, index) => {
      const target = clones[index]
      const computed = getComputedStyle(source)
      for (const property of properties) target.style.setProperty(property, computed.getPropertyValue(property))
      if (source instanceof HTMLInputElement) target.setAttribute('value', source.value)
    })
    return clone.outerHTML
  })
  const capturePage = await page.context().newPage()
  try {
    await capturePage.setViewportSize({ width: 390, height: 844 })
    await capturePage.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0">${lessonMarkup}</body></html>`)
    const captureLesson = capturePage.locator('section').first()
    await expect(captureLesson).toBeVisible()
    const captureBox = await captureLesson.boundingBox()
    assert.ok(captureBox && captureBox.width > 0 && captureBox.height > 0, 'Eye lesson needs a visible capture box')
    await capturePage.evaluate(() => document.fonts.ready)
    const cdp = await capturePage.context().newCDPSession(capturePage)
    try {
      const screenshot = await step('capture-eye-screenshot', () => Promise.race([
        cdp.send('Page.captureScreenshot', {
          format: 'png',
          fromSurface: true,
          captureBeyondViewport: true,
          clip: { x: captureBox.x, y: captureBox.y, width: captureBox.width, height: captureBox.height, scale: 1 },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Eye optics screenshot exceeded 20 seconds')), 20_000)),
      ]))
      await writeFile('artifacts/body3d-mobile-eye-optics.png', Buffer.from(screenshot.data, 'base64'))
    } finally {
      await cdp.detach()
    }
  } finally {
    await capturePage.close()
  }

  const close = page.getByRole('button', { name: 'Close optics lesson', exact: true })
  await step('close-optics', () => activateWithKeyboard(close))
  await expect(svg).toHaveCount(0)
  await step('reopen-optics', () => activateWithKeyboard(opener))
  await expect(distance).toHaveValue('6')
  await expect(pupil).toHaveValue('4')
  await step('final-close-optics', () => activateWithKeyboard(page.getByRole('button', { name: 'Close optics lesson', exact: true })))

  return { reachable: true, keyboardControls: true, closeAndReopen: true, smallGap, largeGap, farRx, nearRx, width }
}
