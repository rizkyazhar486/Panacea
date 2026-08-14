import { chromium } from 'playwright'

const B = 'http://localhost:5199/#/tubuh'
const b = await chromium.launch()
const p = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }).then(c => c.newPage())

await p.goto('http://localhost:5199/', { waitUntil: 'domcontentloaded' })
await p.evaluate(() => {
  localStorage.setItem('pmd_vitals_v1', JSON.stringify({
    restingHr: 58, hrvMs: 42, spo2Pct: 96, systolic: 118, diastolic: 76, sex: 'M',
  }))
})
await p.goto(B, { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)

const teks = await p.evaluate(() => document.body.innerText)
const wajib = [
  'Dari mana angka-angka ini',
  'Denyut istirahat', 'HRV', 'Saturasi oksigen', 'Tekanan darah',
]
for (const w of wajib) console.log((teks.includes(w) ? 'OK  ' : 'GAGAL ') + w)

// buka semua panel audit
const tombol = await p.$$('button')
let dibuka = 0
for (const t of tombol) {
  const s = ((await t.innerText()) || '').toLowerCase()
  if (s.includes('dari mana') || s.includes('rincian') || s.includes('audit') || s.includes('angka ini')) { await t.click(); dibuka++ }
}
await p.waitForTimeout(400)
const teks2 = await p.evaluate(() => document.body.innerText)
console.log('panel audit dibuka:', dibuka)
for (const w of ['kulit', 'Tidak dipengaruhi', 'Yang benar-benar']) {
  console.log((teks2.includes(w) ? 'OK  ' : 'catatan: tak tampak — ') + w)
}

const lapor = await p.evaluate(() => {
  const out = { scrollX: document.documentElement.scrollWidth, lebar: 0, kecilFont: [], kecilTarget: [], meluber: [] }
  out.lebar = window.innerWidth
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const cs = getComputedStyle(el)
    if (r.right > window.innerWidth + 1 || r.left < -1) {
      if (el.children.length === 0 || r.width > window.innerWidth)
        out.meluber.push(el.tagName + '.' + (el.className || '').toString().slice(0, 60) + ' @' + Math.round(r.left) + '..' + Math.round(r.right))
    }
    const fs = parseFloat(cs.fontSize)
    if (fs < 10 && (el.textContent || '').trim()) out.kecilFont.push(fs + ' ' + (el.textContent || '').trim().slice(0, 30))
    if ((el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') && el.children.length === 0) {
      if (r.height < 40 || r.width < 40) out.kecilTarget.push(Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + (el.textContent || '').trim().slice(0, 30))
    }
  }
  out.meluber = [...new Set(out.meluber)].slice(0, 10)
  out.kecilFont = [...new Set(out.kecilFont)].slice(0, 10)
  out.kecilTarget = [...new Set(out.kecilTarget)].slice(0, 10)
  return out
})
console.log(JSON.stringify(lapor, null, 1))
await p.screenshot({ path: '/tmp/tubuh.png', fullPage: false })
await b.close()
