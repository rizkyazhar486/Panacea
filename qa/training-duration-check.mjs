// Pemeriksaan peramban C2: ubin "Training, 7 days" tidak mengarang menit atau pace dari durasi yang tidak diketahui.
// Jalankan: npx vite build && npx vite preview --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/training-duration-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const BASE = process.env.QA_URL || 'http://localhost:5199/'
const sesi = (id, hari, extra) => {
  const mulai = new Date(Date.now() - hari * 864e5).toISOString()
  return { id, nama: 'Run', mulai, selesai: new Date(Date.parse(mulai) + 1800e3).toISOString(), durasi: 1800, durationSource: 'source_field', jarakKm: 5, hr: [], pemulihan: [], ...extra }
}
const jalankan = async (daftar) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await ctx.addInitScript((w) => {
    const account = { id: 'qa-patient', email: 'training-qa@localhost.test', name: 'QA Patient', role: 'pasien', patientId: 'qa-self', isSubscriber: false, loggedAt: new Date().toISOString() }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
    const t = new Date(); localStorage.setItem('pmd-quote-seen-date', `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`)
    localStorage.setItem('pmd_workouts_v1:scope_v1:' + encodeURIComponent(JSON.stringify([account.id, account.patientId])), JSON.stringify({ version: 1, ownerAccountId: account.id, subjectId: account.patientId, items: w })); localStorage.setItem('pmd-home-widgets', JSON.stringify(['latihanRingkas']))
  }, daftar)
  const page = await ctx.newPage()
  await page.goto(`${BASE}#/?folds=open`, { timeout: 180000 })
  const tile = page.locator('a', { hasText: 'Training, 7 days' }).first()
  await tile.waitFor({ timeout: 60000 })
  const out = { teks: await tile.innerText(), tidakDiketahui: await tile.locator('[data-durasi-tidak-diketahui]').count(), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) }
  await page.screenshot({ path: `/private/tmp/training-duration-390-${daftar.length}.png` }); await ctx.close(); return out
}
try {
  const ok = await jalankan([sesi('a', 1), sesi('b', 2)])
  assert.match(ok.teks, /2\s*sessions · 60 min/); assert.match(ok.teks, /\/km/); assert.equal(ok.tidakDiketahui, 0)
  const tak = await jalankan([sesi('a', 1), sesi('b', 2, { durasi: 0, durationSource: 'unknown' })])
  assert.doesNotMatch(tak.teks, /min\b/, 'tidak ada menit karangan'); assert.doesNotMatch(tak.teks, /\/km/, 'tidak ada pace karangan')
  assert.match(tak.teks, /2\s*sessions/); assert.equal(tak.tidakDiketahui, 1, 'hari berdurasi tak diketahui digambar berbeda')
  assert.equal(ok.overflow || tak.overflow, false, 'tidak ada overflow horizontal')
  console.log('training-duration-check: ok')
} finally { await browser.close() }
