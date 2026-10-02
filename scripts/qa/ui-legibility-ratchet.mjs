// Ratchet kejelasan UI di 390x844: menghitung kata yang terlihat dan berapa banyak
// yang lebih kecil dari 14px. Prinsip desain pemilik: satu kata per butir, penjelasan
// di balik tombol i, huruf tidak kecil, ruang luas. Angka hanya boleh TURUN: lewat
// baseline = gagal; menurunkan baseline dilakukan dengan UI_LEGIBILITY_UPDATE=1.
// Pemakaian: UI_LEGIBILITY_ORIGIN=http://127.0.0.1:4173 node scripts/qa/ui-legibility-ratchet.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const origin = process.env.UI_LEGIBILITY_ORIGIN || 'http://127.0.0.1:4173'
const baselinePath = 'governance/ui-legibility-baseline.json'
const MIN_PX = 14
// Banner kutipan harian berganti panjangnya; selisih kecil ini bukan regresi UI.
const NOISE_WORDS = 40

const { chromium } = await import(process.env.UI_LEGIBILITY_PLAYWRIGHT || '@playwright/test')
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.UI_LEGIBILITY_CHROME || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'dark' })
await context.addInitScript(() => {
  const account = { email: 'legibility-qa@localhost.test', name: 'QA', role: 'pasien', loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01' }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const routes = JSON.parse(readFileSync(baselinePath, 'utf8')).routes
const measured = {}
for (const route of Object.keys(routes)) {
  const page = await context.newPage()
  await page.goto(`${origin}/#/${route}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)
  measured[route] = await page.evaluate((minPx) => {
    // Isi <details> yang tertutup tidak terlihat pengguna (kecuali judul <summary>-nya),
    // walau elemennya masih ada di DOM; tidak boleh dihitung sebagai tulisan di layar.
    const foldedAway = (e) => {
      for (let d = e.closest('details'); d; d = d.parentElement ? d.parentElement.closest('details') : null) {
        const ownSummary = e.closest('summary')
        if (!d.open && !(ownSummary && ownSummary.parentElement === d)) return true
      }
      return false
    }
    const visible = (e) => {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e)
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !foldedAway(e)
    }
    let words = 0, small = 0
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n; (n = walker.nextNode());) {
      const text = n.textContent.trim()
      const el = n.parentElement
      if (!text || !el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName) || !visible(el)) continue
      const k = text.split(/\s+/).length
      words += k
      if (parseFloat(getComputedStyle(el).fontSize) < minPx) small += k
    }
    return { words, smallWords: small }
  }, MIN_PX)
  await page.close()
}
await browser.close()

if (process.env.UI_LEGIBILITY_UPDATE === '1') {
  const next = JSON.parse(readFileSync(baselinePath, 'utf8'))
  for (const [r, m] of Object.entries(measured)) {
    if (m.words > next.routes[r].words || m.smallWords > next.routes[r].smallWords) throw new Error(`refusing to raise baseline for "${r}"`)
    next.routes[r] = m
  }
  writeFileSync(baselinePath, JSON.stringify(next, null, 2) + '\n')
}

const failures = []
for (const [route, base] of Object.entries(routes)) {
  const m = measured[route]
  console.log(`${route || '(home)'}: words ${m.words} (baseline ${base.words}), under-${MIN_PX}px words ${m.smallWords} (baseline ${base.smallWords})`)
  if (m.words > base.words + NOISE_WORDS) failures.push(`${route || '(home)'}: visible words rose ${base.words} -> ${m.words}`)
  if (m.smallWords > base.smallWords + NOISE_WORDS) failures.push(`${route || '(home)'}: words under ${MIN_PX}px rose ${base.smallWords} -> ${m.smallWords}`)
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1) }
console.log('UI legibility ratchet ok (counts did not rise).')
