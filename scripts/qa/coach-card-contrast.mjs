import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

// Kartu pelatih di halaman Training ditulis hanya untuk permukaan gelap: nol
// varian `dark:`, sehingga warna seperti text-slate-300 dipakai apa adanya di
// kedua mode. Di mode terang itu berarti abu-abu muda di atas putih -- terlihat
// pada tangkapan layar QA: badan kartunya praktis hilang.
//
// Kontras diukur, bukan dilihat sekilas. Setiap simpul teks di dalam kartu
// dibandingkan dengan permukaan buram terdekat memakai rumus WCAG 2.1.

const url = process.env.COACH_QA_URL || 'http://127.0.0.1:4188/#/latihan?t=pelatih'
const tema = process.env.COACH_QA_THEME || 'light'
// AA untuk teks normal. Teks besar boleh 3.0, tetapi kartu ini hampir seluruhnya
// teks kecil, jadi ambangnya tidak diturunkan.
const AMBANG = Number(process.env.COACH_QA_MIN || 4.5)
await mkdir('artifacts', { recursive: true })

const mulai = new Date(Date.now() - 20 * 3600_000)
const hr = []
for (let t = 0; t <= 2400; t += 30) hr.push({ t, bpm: 150 + Math.round(25 * Math.sin(t / 240)) })
const sesi = {
  id: 'coach-qa-1', nama: 'Running', mulai: mulai.toISOString(),
  selesai: new Date(mulai.getTime() + 2400_000).toISOString(), durasi: 2400,
  jarakKm: 5.12, kcal: 430, avgHr: 157, maxHr: 177, minHr: 96, paceSec: 471,
  hr, pemulihan: [{ t: 0, bpm: 165 }, { t: 60, bpm: 144 }], hrr1: 21,
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.COACH_QA_CHROME || undefined })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await context.addInitScript((p) => {
  const account = { email: 'coach-qa@localhost.test', name: 'Coach QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1995-01-01' }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('pmd_workouts_v1', JSON.stringify([p.sesi]))
  localStorage.setItem('pmd-theme', p.tema)
}, { sesi, tema })

const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

let hasil
try {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (res && !res.ok()) throw new Error(`Training returned HTTP ${res.status()}`)

  for (let putaran = 0; putaran < 6; putaran++) {
    const dialog = page.getByRole('dialog').first()
    if (!(await dialog.isVisible().catch(() => false))) break
    let tertutup = false
    for (const label of [/Maybe later/i, /Not now/i, /Skip/i, /Close/i, /Got it/i, /Dismiss/i, /Get Started/i]) {
      const b = dialog.getByRole('button', { name: label }).first()
      if (await b.isVisible().catch(() => false)) { await b.click({ force: true }); tertutup = true; break }
    }
    if (!tertutup) await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }

  await page.getByRole('button', { name: /Share this card/i }).first().waitFor({ state: 'visible', timeout: 30_000 })

  hasil = await page.evaluate((AMBANG) => {
    // Tailwind v4 menulis paletnya sebagai oklch(), dan getComputedStyle
    // mengembalikannya apa adanya. Pengurai rgb() sederhana mengembalikan null
    // untuk warna-warna itu, dan versi pertama pemeriksaan ini karena itu
    // MELEWATI persis simpul yang rusak -- ia melaporkan 8 simpul teks dari
    // sebuah kartu yang punya 14, lalu menyatakan lulus. Warna karena itu
    // dikonversi oleh peramban sendiri lewat kanvas 1x1.
    const _k = document.createElement('canvas')
    _k.width = _k.height = 1
    const _g = _k.getContext('2d', { willReadFrequently: true })
    const urai = (w) => {
      if (!w || w === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
      const m = /^rgba?\(([^)]+)\)$/.exec(w)
      if (m) {
        const p = m[1].split(',').map(Number)
        if (p.every((x) => !Number.isNaN(x))) return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
      }
      try {
        _g.clearRect(0, 0, 1, 1)
        _g.fillStyle = '#000'
        _g.fillStyle = w
        if (_g.fillStyle === '#000000' && !/^#0{3,8}$|black/i.test(w)) return null
        _g.clearRect(0, 0, 1, 1)
        _g.fillRect(0, 0, 1, 1)
        const d = _g.getImageData(0, 0, 1, 1).data
        return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }
      } catch { return null }
    }
    const kanal = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4) }
    const relL = (c) => 0.2126 * kanal(c.r) + 0.7152 * kanal(c.g) + 0.0722 * kanal(c.b)
    // Lapisan semi-transparan harus dikomposit dulu; membandingkan warna teks
    // dengan rgba(255,255,255,0.05) begitu saja memberi angka yang salah.
    const campur = (atas, bawah) => ({
      r: atas.r * atas.a + bawah.r * (1 - atas.a),
      g: atas.g * atas.a + bawah.g * (1 - atas.a),
      b: atas.b * atas.a + bawah.b * (1 - atas.a),
      a: 1,
    })
    const latarEfektif = (el) => {
      const tumpukan = []
      for (let n = el; n; n = n.parentElement) {
        const c = urai(getComputedStyle(n).backgroundColor)
        if (c && c.a > 0) { tumpukan.push(c); if (c.a >= 0.999) break }
      }
      let dasar = { r: 255, g: 255, b: 255, a: 1 }
      for (let i = tumpukan.length - 1; i >= 0; i--) dasar = campur(tumpukan[i], dasar)
      return dasar
    }
    const rasio = (a, b) => { const l1 = relL(a), l2 = relL(b); const [t, r] = l1 > l2 ? [l1, l2] : [l2, l1]; return (t + 0.05) / (r + 0.05) }

    const tombol = document.querySelector('[aria-label="Share this card"], [title="Share this card"]')
    let kartu = tombol.parentElement
    while (kartu && !kartu.querySelector('h2')) kartu = kartu.parentElement
    kartu = kartu.parentElement || kartu

    const buruk = []
    const semua = []
    let takTerbaca = 0
    for (const el of kartu.querySelectorAll('*')) {
      const teks = Array.from(el.childNodes).filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ')
      if (!teks) continue
      const g = getComputedStyle(el)
      if (g.visibility === 'hidden' || g.display === 'none' || parseFloat(g.opacity) < 0.1) continue
      const warna = urai(g.color)
      if (!warna) { takTerbaca++; continue }
      const depan = warna.a < 0.999 ? campur(warna, latarEfektif(el)) : warna
      const r = rasio(depan, latarEfektif(el))
      const catatan = { teks: teks.slice(0, 58), warna: g.color, ukuran: g.fontSize, rasio: Math.round(r * 100) / 100 }
      semua.push(catatan)
      if (r < AMBANG) buruk.push(catatan)
    }
    return { jumlahTeks: semua.length, takTerbaca, buruk, terburuk: semua.sort((a, b) => a.rasio - b.rasio).slice(0, 5) }
  }, AMBANG)

  await page.screenshot({ path: `artifacts/coach-card-${tema}-390x844.png`, animations: 'disabled', scale: 'css', timeout: 45_000 })
} finally {
  await browser.close()
}

console.log(JSON.stringify({ tema, ambang: AMBANG, ...hasil, pageErrors }, null, 2))
if (pageErrors.length) { console.error(`\nGAGAL: galat halaman: ${pageErrors.join(' | ')}`); process.exit(1) }
if (!hasil.jumlahTeks) { console.error('\nGAGAL: tidak ada simpul teks yang terukur; kartunya tidak ditemukan.'); process.exit(1) }
// Pemeriksaan yang diam-diam melewati simpul tidak bisa dibedakan dari
// pemeriksaan yang lulus. Kartu debrief selalu punya judul, tanggal, lencana,
// ringkasan, dan lima baris metrik.
if (hasil.jumlahTeks < 12) {
  console.error(`\nGAGAL: hanya ${hasil.jumlahTeks} simpul teks yang terukur; sebagian warna tidak terbaca dan pemeriksaan ini akan lulus secara palsu.`)
  process.exit(1)
}
if (hasil.takTerbaca) {
  console.error(`\nGAGAL: ${hasil.takTerbaca} warna tidak bisa diuraikan; kontrasnya tidak diketahui, bukan aman.`)
  process.exit(1)
}
if (hasil.buruk.length) {
  console.error(`\nGAGAL: ${hasil.buruk.length} dari ${hasil.jumlahTeks} simpul teks di bawah kontras ${AMBANG}:1 pada mode ${tema}.`)
  for (const b of hasil.buruk) console.error(`  ${b.rasio}:1  ${b.warna}  "${b.teks}"`)
  process.exit(1)
}
console.log(`\nKontras kartu pelatih lulus pada mode ${tema}: ${hasil.jumlahTeks} simpul teks, semua >= ${AMBANG}:1.`)
