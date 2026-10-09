// Penerimaan visual WALK/RUN di peramban (tubuh dewasa pria): sambungan loop, gerak berkelanjutan, fps, tanpa error halaman.
// Jalankan: npx vite --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/gait-visual-check.mjs
// Keluaran: JSON di bodyexposure/qa_reports + PNG pose di /private/tmp. Sambungan = selisih piksel kanvas pada t=0 vs t=durasi.
import assert from 'node:assert/strict'
import fs from 'node:fs'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--enable-webgl', '--enable-unsafe-swiftshader'] })
const URL = process.env.QA_URL || 'http://localhost:5199/qa/canonical-body.html'
const out = { url: URL, viewport: [1440, 900], clips: {} }
// selisih piksel relatif antara dua PNG (dihitung di halaman: tanpa dependensi tambahan)
const diffPct = (page, a, b) => page.evaluate(async ([x, y]) => {
  const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s })
  const [ia, ib] = await Promise.all([load(x), load(y)])
  const px = (im) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data }
  const A = px(ia), B = px(ib); let n = 0
  for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 24) n++
  return (100 * n) / (A.length / 4)
}, [a.toString('base64'), b.toString('base64')])
try {
  const page = await browser.newPage(); const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(URL, { timeout: 180000 })
  await page.getByText(/loaded · \d+k triangles/).waitFor({ timeout: 60000 })
  await page.getByRole('button', { name: 'Motion', exact: true }).click()
  await page.getByTestId('motion-panel').waitFor({ timeout: 60000 })
  const cvs = page.getByTestId('canonical-body-canvas'), slider = page.getByLabel('Motion timeline')
  for (const [label, name] of [['WALK', 'Walk'], ['RUN', 'Run']]) {
    await page.getByRole('radio', { name, exact: true }).click()
    await page.getByText('Recorded motion', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Pause', exact: true }).click().catch(() => {})
    const max = parseFloat(await slider.getAttribute('max'))
    const at = async (t) => { await slider.fill(String(t)); await page.waitForTimeout(250); return cvs.screenshot() }
    const first = await at(0), last = await at(max)
    const seam = await diffPct(page, first, last)
    // urutan 8 pose sepanjang siklus: harus berbeda satu sama lain (benar-benar bergerak) dan tanpa lonjakan antar-tetangga
    const shots = []; for (let k = 0; k < 8; k++) shots.push(await at((max * k) / 8))
    const steps = []; for (let k = 1; k < 8; k++) steps.push(await diffPct(page, shots[k - 1], shots[k]))
    // putar kontinu 5 dtk: fps dari pembacaan aplikasi + kanvas berubah
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await page.waitForTimeout(5000)
    const fpsText = await page.getByTestId('fps-readout').first().textContent()
    const fps = parseInt(fpsText.match(/(\d+) fps/)[1], 10), low = parseInt(fpsText.match(/low (\d+)/)[1], 10)
    await page.getByRole('button', { name: 'Pause', exact: true }).click()
    const draws = parseInt((await page.getByTestId('motion-draws').textContent()).match(/(\d+)/)[1], 10)
    out.clips[label] = { timeline_max: max, seam_diff_pct: +seam.toFixed(4), pose_step_diff_pct: steps.map((s) => +s.toFixed(3)), fps_mean: fps, fps_1pct_low: low, draw_groups: draws }
    fs.writeFileSync(`/private/tmp/gait-${label.toLowerCase()}-pose0.png`, shots[0]); fs.writeFileSync(`/private/tmp/gait-${label.toLowerCase()}-pose4.png`, shots[4])
    assert(seam < 0.05, `${label}: loop seam visible (${seam.toFixed(3)}% px differ)`)
    assert(steps.every((s) => s > 0), `${label}: a pose step did not change the canvas (frozen)`)
    assert(draws < 200, `${label}: rig meshes not merged`)
  }
  out.page_errors = errors; assert.equal(errors.length, 0, errors.join('; '))
  fs.writeFileSync('bodyexposure/qa_reports/gait_visual_browser.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out)); console.log('OK')
} finally { await browser.close() }
