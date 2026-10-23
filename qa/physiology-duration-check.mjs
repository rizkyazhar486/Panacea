// Pemeriksaan peramban C2: halaman Training Physiology tidak menghitung beban dari sesi berdurasi tidak diketahui (bukan 0 detik).
// Jalankan: npx vite build && npx vite preview --port 5199 & lalu
//   PLAYWRIGHT_MODULE=<path ke playwright> node qa/physiology-duration-check.mjs
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
    const account = { id: 'qa-patient', email: 'physiology-qa@localhost.test', name: 'QA Patient', role: 'pasien', patientId: 'qa-self', isSubscriber: false, loggedAt: new Date().toISOString() }
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
    localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
    const t = new Date(); localStorage.setItem('pmd-quote-seen-date', `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`)
    localStorage.setItem('pmd_workouts_v1:scope_v1:' + encodeURIComponent(JSON.stringify([account.id, account.patientId])), JSON.stringify({ version: 1, ownerAccountId: account.id, subjectId: account.patientId, items: w }))
  }, daftar)
  const page = await ctx.newPage()
  await page.goto(`${BASE}#/latihan?t=fisiologi`, { timeout: 180000 })
  await page.getByText(/\d+ sessions/).first().waitFor({ timeout: 60000 })
  const out = { teks: await page.locator('body').innerText(), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) }
  await page.screenshot({ path: `/private/tmp/physiology-duration-390-${daftar.length}.png` }); await ctx.close(); return out
}
try {
  const ok = await jalankan([sesi('a', 1), sesi('b', 2)])
  assert.match(ok.teks, /2 sessions/); assert.doesNotMatch(ok.teks, /excluded: duration unknown/)
  const tak = await jalankan([sesi('a', 1), sesi('b', 2, { durasi: 0, durationSource: 'unknown' })])
  assert.match(tak.teks, /1 sessions \(1 excluded: duration unknown\)/, 'sesi berdurasi tak diketahui dikecualikan dan dilaporkan')
  assert.equal(ok.overflow || tak.overflow, false, 'tidak ada overflow horizontal')
  console.log('physiology-duration-check: ok')
} finally { await browser.close() }
