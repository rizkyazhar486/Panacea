// Smoke browser: Body3D harus tampil sama setelah konteks WebGL dijatuhkan lalu dipulihkan browser.
//
// Cacat yang dijaga: isi render target PMREM (lingkungan IBL) tidak ikut pulih, jadi anatomi tampak
// lebih gelap/datar sampai halaman dimuat ulang — tanpa galat apa pun (rata-rata luminans turun ±15%,
// proporsi piksel terang turun ±54% pada build sebelum perbaikan).
//
// Jalankan: QA_ORIGIN=http://127.0.0.1:4173 node scripts/qa/body3d-context-restore-smoke.mjs
import assert from 'node:assert/strict'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4173'
const url = process.env.BODY3D_QA_URL || `${origin}/#/body-explorer`
const RESTORE_TIMEOUT_MS = Number(process.env.QA_RESTORE_TIMEOUT_MS || 45_000)

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

try {
  const context = await browser.newContext({ viewport: { width: 1000, height: 900 } })
  await context.addInitScript(() => {
    const account = { email: 'body3d-ctx-qa@localhost.test', name: 'Body3D QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01' }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
  })
  const page = await context.newPage()
  page.setDefaultTimeout(30_000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(url, { waitUntil: 'load' })
  const canvas = page.locator('canvas').first()
  await canvas.waitFor({ state: 'attached' })
  // Tunggu hingga model terpasang (kamera dibingkai, ada piksel anatomi), bukan sekadar waktu tetap.
  const stats = async () => {
    const png = (await canvas.screenshot()).toString('base64')
    return page.evaluate(async (base64) => {
      const image = new Image()
      image.src = `data:image/png;base64,${base64}`
      await image.decode()
      const surface = document.createElement('canvas')
      surface.width = image.width
      surface.height = image.height
      const context2d = surface.getContext('2d')
      context2d.drawImage(image, 0, 0)
      const data = context2d.getImageData(0, 0, surface.width, surface.height).data
      let sum = 0
      let bright = 0
      let count = 0
      for (let i = 0; i < data.length; i += 16) {
        const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
        sum += luminance
        count++
        if (luminance > 90) bright++
      }
      return { mean: sum / count, brightFraction: bright / count }
    }, png)
  }
  await canvas.scrollIntoViewIfNeeded()
  await page.waitForFunction(async () => {
    const el = document.querySelector('canvas')
    return Boolean(el && el.dataset.environmentGeneration === '1')
  }, null, { timeout: 30_000 })
  // Model GLB dimuat progresif; tunggu sampai ada cukup piksel terang (anatomi) lalu ambil acuan.
  const modelDeadline = Date.now() + 60_000
  let before = await stats()
  while (before.brightFraction <= 0.005) {
    assert.ok(Date.now() < modelDeadline, `model anatomi tidak muncul (bright=${before.brightFraction})`)
    await page.waitForTimeout(1000)
    before = await stats()
  }
  assert.equal(await page.evaluate(() => document.querySelector('canvas').dataset.environmentGeneration), '1', 'lingkungan IBL awal dibangun tepat sekali')

  // Jatuhkan lalu pulihkan konteks, sebagaimana browser lakukan saat tab di latar belakang / memori menipis.
  await page.evaluate(() => {
    const el = document.querySelector('canvas')
    const gl = el.getContext('webgl2') || el.getContext('webgl')
    window.__loseContext = gl.getExtension('WEBGL_lose_context')
    window.__loseContext.loseContext()
  })
  const banner = page.getByText(/The browser dropped the 3D context/i).first()
  await banner.waitFor({ state: 'visible', timeout: 15_000 })
  await page.evaluate(() => window.__loseContext.restoreContext())
  // Polling hingga banner hilang: waktu pemulihan bergantung beban mesin, jadi bukan jeda tetap.
  await banner.waitFor({ state: 'hidden', timeout: RESTORE_TIMEOUT_MS })
  await page.waitForFunction(() => document.querySelector('canvas').dataset.environmentGeneration === '2', null, { timeout: 15_000 })

  // Dorong kamera agar satu frame pasti tergambar, lalu bandingkan dengan acuan.
  const box = await canvas.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 2, box.y + box.height / 2, { steps: 2 })
  await page.mouse.up()
  await page.waitForTimeout(1500)
  const after = await stats()

  assert.ok(after.mean >= before.mean * 0.95,
    `luminans rata-rata turun setelah pemulihan konteks: ${before.mean.toFixed(2)} -> ${after.mean.toFixed(2)} (lingkungan IBL tidak dibangun ulang?)`)
  assert.ok(after.brightFraction >= before.brightFraction * 0.85,
    `proporsi piksel terang turun setelah pemulihan: ${before.brightFraction.toFixed(4)} -> ${after.brightFraction.toFixed(4)}`)
  assert.equal(await page.evaluate(() => {
    const el = document.querySelector('canvas')
    return (el.getContext('webgl2') || el.getContext('webgl')).isContextLost()
  }), false, 'konteks harus hidup kembali')
  assert.deepEqual(errors, [], `galat halaman: ${errors.join(' | ')}`)
  console.log(`body3d-context-restore-smoke: tampilan pulih setelah konteks dipulihkan (luminans ${before.mean.toFixed(2)} -> ${after.mean.toFixed(2)}, piksel terang ${before.brightFraction.toFixed(4)} -> ${after.brightFraction.toFixed(4)}, generasi lingkungan 2)`)
} finally {
  await browser.close()
}
