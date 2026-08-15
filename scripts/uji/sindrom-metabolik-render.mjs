import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const c = await b.newContext({ viewport: { width: 390, height: 844 } })
await c.addInitScript(() => {
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: { email: 'u@x.id', name: 'R', role: 'pasien', isSubscriber: true, loggedAt: new Date().toISOString() }, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
})
const p = await c.newPage()
await p.goto('http://localhost:5199/#/med-study', { waitUntil: 'networkidle' })
await p.waitForTimeout(1800)
// Masuk ke bagian "Daftar Penyakit SKDI" lebih dahulu — direktori penyakitnya
// tidak dirender sampai bagian itu dipilih.
await p.evaluate(() => {
  for (const el of document.querySelectorAll('button,a')) {
    if (/Daftar Penyakit SKDI/i.test(el.textContent || '')) { el.click(); return }
  }
})
await p.waitForTimeout(1800)
const kotak = await p.$('input')
if (kotak) { await kotak.fill('Sindrom metabolik'); await p.waitForTimeout(1000) }
const t = await p.evaluate(() => document.body.innerText)
console.log('halaman memuat "sindrom metabolik":', /sindrom metabolik/i.test(t))
// buka entri pertama yang cocok
const dibuka = await p.evaluate(() => {
  for (const el of document.querySelectorAll('a,button,li,div[role="button"]')) {
    if (/sindrom metabolik/i.test((el.textContent || '').trim()) && el.getBoundingClientRect().height > 0) { el.click(); return (el.textContent||'').trim().slice(0,50) }
  }
  return null
})
await p.waitForTimeout(1500)
// Cabang dibuka SATU PER SATU, dan isinya dipungut sesudah tiap bukaan.
//
// Mindmap.tsx menampilkan tiga butir pertama sebagai pratinjau, dan cabangnya
// berperilaku sebagai akordeon: membuka satu MENUTUP yang lain. Dua percobaan
// pertama membuka kedelapan cabang berturut-turut, sehingga yang tersisa
// terbuka hanya cabang terakhir — lalu melaporkan "penisilin belum ada",
// padahal yang belum terjadi adalah bukaannya. Catatannya sendiri utuh.
let t2 = await p.evaluate(() => document.body.innerText)
for (let n = 0; n < 8; n++) {
  const ada = await p.evaluate((n) => {
    const b = [...document.querySelectorAll('[aria-expanded]')]
    if (n >= b.length) return false
    b[n].click()
    return true
  }, n)
  if (!ada) break
  await p.waitForTimeout(350)
  t2 += '\n' + await p.evaluate(() => document.body.innerText)
}

console.log('diklik:', dibuka)
for (const w of ['90 cm', 'AKANTOSIS NIGRIKANS', 'metformin', 'atorvastatin', 'ramipril', '5 SAMPAI 10 PERSEN', 'PERTENGAHAN ANTARA TEPI BAWAH IGA'])
  console.log((new RegExp(w, 'i').test(t2) ? 'OK    ' : 'belum ') + w.split('|')[0])
await b.close()
