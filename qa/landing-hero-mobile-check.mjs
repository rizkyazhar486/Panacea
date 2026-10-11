// Penerimaan mobile landing: judul hero tidak boleh melewati tepi layar (kolom grid tidak boleh melebar karena konten nowrap kartu kanan).
// Jalankan: npx vite --port 5250 & lalu  PLAYWRIGHT_MODULE=<path> QA_URL=http://localhost:5250/ node qa/landing-hero-mobile-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
try {
  for (const w of [360, 390, 430, 768]) {
    const page = await browser.newPage({ viewport: { width: w, height: 844 } })
    await page.goto(process.env.QA_URL || 'http://localhost:5250/', { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.locator('h1').first().waitFor({ timeout: 60000 })
    await page.waitForTimeout(2500)
    const m = await page.evaluate(() => { const r = document.querySelector('h1').getBoundingClientRect(); return { right: r.right, left: r.left, vw: innerWidth } })
    assert(m.left >= 0 && m.right <= m.vw, `hero headline leaves the ${w}px viewport: left ${m.left}, right ${m.right}`)
    await page.close()
  }
  console.log('OK')
} finally { await browser.close() }
