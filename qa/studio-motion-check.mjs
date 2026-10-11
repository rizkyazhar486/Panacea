// Compatibility with Claude's neutral-centred female rig; not clinical motion validation.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const out = process.env.QA_OUT || '/tmp/panacea-studio-motion'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--enable-webgl', '--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto(process.env.QA_URL || 'http://127.0.0.1:5207/qa/canonical-body.html', { timeout: 180000 })
  await page.getByText(/loaded · \d+k triangles/).waitFor({ timeout: 120000 })
  await page.getByRole('radio', { name: 'Studio', exact: true }).click()
  await page.getByRole('radiogroup', { name: 'Graphics quality' }).getByRole('radio', { name: 'performance', exact: true }).click()
  await page.getByRole('tab', { name: /Adult female/ }).click()
  await page.getByRole('radio', { name: 'Visible Human skeleton (Denver + CT)', exact: true }).click()
  await page.getByText(/^184 structures$/).waitFor({ timeout: 120000 })
  await page.getByRole('button', { name: 'Motion', exact: true }).click()
  await page.getByTestId('motion-panel').waitFor({ timeout: 120000 })
  await page.getByTestId('motion-draws').waitFor()
  await page.getByText(/pelvis, legs and feet only/).waitFor()
  const captures = []
  for (const clip of ['Walk', 'Run']) {
    await page.getByRole('radio', { name: clip, exact: true }).click()
    await page.getByText('Recorded motion', { exact: true }).waitFor()
    const a = await page.getByTestId('canonical-body-canvas').screenshot()
    await page.waitForTimeout(1200)
    const b = await page.getByTestId('canonical-body-canvas').screenshot()
    assert.ok(!a.equals(b), `${clip} must change actual rig pixels`)
    assert.equal(await page.getByRole('radio', { name: 'Studio', exact: true }).getAttribute('aria-checked'), 'true')
    for (const [frame, bytes] of [['a', a], ['b', b]]) {
      const file = `${clip.toLowerCase()}-${frame}.png`
      await writeFile(path.join(out, file), bytes)
      captures.push({ clip, file, sha256: createHash('sha256').update(bytes).digest('hex') })
    }
  }
  await page.getByRole('button', { name: 'Stop motion', exact: true }).click()
  await page.getByTestId('motion-panel').waitFor({ state: 'detached' })
  assert.deepEqual(errors, [])
  await writeFile(path.join(out, 'report.json'), JSON.stringify({ source: 'upstream #2338, base 1dda7e71',
    scope: 'studio lighting compatibility with reference rig, not patient-specific gait or clinical validation',
    viewport: [390, 844], captures, errors }, null, 2))
  console.log('Female Walk/Run under Studio: 4 actual frames, no page errors, motion exit passed')
} finally { await browser.close() }
