import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

// Bukti bahwa frame diam benar-benar digambar pada resolusi lebih tinggi.
//
// Yang diukur adalah UKURAN BUFFER GAMBAR kanvas (canvas.width/height), bukan
// ukuran CSS-nya. Keduanya sering tertukar: kanvas 390 px CSS pada telepon
// ber-DPR 3 seharusnya punya buffer 1170 px. Dengan cap interaktif 1.5x ia
// hanya 585 px -- setengah resolusi linear, dan itulah yang terlihat lunak.
//
// Halaman produksi yang sebenarnya dipakai; tidak ada kanvas pengganti.

const url = process.env.BODY3D_REFINE_URL || 'http://127.0.0.1:4188/#/body-explorer'
const dpr = Number(process.env.BODY3D_REFINE_DPR || 3)
await mkdir('artifacts', { recursive: true })

const browser = await chromium.launch({ headless: true, executablePath: process.env.BODY3D_REFINE_CHROME || undefined })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true })
await context.addInitScript(() => {
  const account = { email: 'refine-qa@localhost.test', name: 'Refine QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1995-01-01' }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
})

const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

const hasil = { dpr, cssLebar: null, interaktif: null, halus: null, pageErrors }
try {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  if (res && !res.ok()) throw new Error(`Body Explorer returned HTTP ${res.status()}`)

  for (let putaran = 0; putaran < 6; putaran++) {
    const dialog = page.getByRole('dialog').first()
    if (!(await dialog.isVisible().catch(() => false))) break
    let tertutup = false
    for (const label of [/Maybe later/i, /Not now/i, /Skip/i, /Close/i, /Got it/i, /Dismiss/i, /Get Started/i]) {
      const b = dialog.getByRole('button', { name: label }).first()
      if (await b.isVisible().catch(() => false)) { await b.click({ force: true, noWaitAfter: true }); tertutup = true; break }
    }
    if (!tertutup) await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }

  // Halaman ini memuat lebih dari satu kanvas; querySelector('canvas') memungut
  // yang pertama, yang bukan viewer -- pengukuran pertama karena itu melaporkan
  // 3x di kedua keadaan dan tidak menguji apa pun. Viewer dikenali lewat
  // pembungkusnya, sama seperti body3d-mobile-smoke.mjs.
  const viewer = page.locator('div.h-full.w-full.touch-none').first()
  const kanvas = viewer.locator('> canvas').first()
  await kanvas.waitFor({ state: 'visible', timeout: 60_000 })
  await kanvas.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' }))
  await kanvas.evaluate((node) => new Promise((r) => {
    const cek = () => (node.width > 2 && node.height > 2) ? r() : requestAnimationFrame(cek)
    cek()
  }))
  await page.waitForTimeout(2500)

  const baca = () => kanvas.evaluate((c) => {
    const r = c.getBoundingClientRect()
    return { buffer: c.width, css: Math.round(r.width), rasio: c.width / Math.max(1, r.width) }
  })

  // Kedua keadaan tidak bisa diambil pada dua saat tebakan: frame halus
  // dijadwalkan 180 ms setelah diam, jadi satu pembacaan "saat interaktif" yang
  // terlambat sedikit sudah memotret keadaan halus. Pengukuran pertama di sini
  // melaporkan 3x untuk KEDUANYA justru karena itu.
  //
  // Maka ukuran buffer dicuplik terus-menerus selama sesi, dan yang diambil
  // adalah nilai terkecil dan terbesar yang benar-benar terjadi.
  await kanvas.evaluate((c) => {
    window.__cuplik = []
    const putar = () => {
      window.__cuplik.push(c.width)
      window.__cuplikRaf = requestAnimationFrame(putar)
    }
    putar()
  })

  const kotak = await kanvas.boundingBox()
  const tengahX = kotak.x + kotak.width / 2
  const tengahY = kotak.y + kotak.height / 2
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(tengahX, tengahY)
    await page.mouse.down()
    for (let j = 1; j <= 8; j++) {
      await page.mouse.move(tengahX + j * 9, tengahY + j * 3)
      await page.waitForTimeout(30)
    }
    await page.mouse.up()
    await page.waitForTimeout(120)
  }

  // Diamkan cukup lama supaya frame halus sempat digambar.
  await page.waitForTimeout(2000)

  const cuplik = await kanvas.evaluate((c) => {
    cancelAnimationFrame(window.__cuplikRaf)
    const r = c.getBoundingClientRect()
    const nilai = window.__cuplik.filter((x) => x > 2)
    return { css: Math.round(r.width), min: Math.min(...nilai), max: Math.max(...nilai), akhir: c.width, jumlah: nilai.length }
  })
  hasil.cssLebar = cuplik.css
  hasil.interaktif = { buffer: cuplik.min, css: cuplik.css, rasio: cuplik.min / Math.max(1, cuplik.css) }
  hasil.halus = { buffer: cuplik.max, css: cuplik.css, rasio: cuplik.max / Math.max(1, cuplik.css) }
  hasil.akhirHalus = cuplik.akhir === cuplik.max
  hasil.cuplikan = cuplik.jumlah

  await page.screenshot({ path: 'artifacts/body3d-refine-390x844.png', animations: 'disabled', scale: 'css', timeout: 45_000 })
} finally {
  await browser.close()
}

console.log(JSON.stringify(hasil, null, 2))
const gagal = []
if (pageErrors.length) gagal.push(`Galat halaman: ${pageErrors.join(' | ')}`)
if (!hasil.interaktif || !hasil.halus) gagal.push('Ukuran buffer kanvas tidak terbaca.')
else {
  if (hasil.halus.buffer <= hasil.interaktif.buffer) {
    gagal.push(`Frame diam tidak lebih tajam: buffer ${hasil.interaktif.buffer} -> ${hasil.halus.buffer}.`)
  }
  if (hasil.halus.rasio < dpr - 0.05) {
    gagal.push(`Frame diam hanya mencapai ${hasil.halus.rasio.toFixed(2)}x dari ${dpr}x yang tersedia di layar.`)
  }
  if (!hasil.akhirHalus) {
    gagal.push('Keadaan akhir setelah diam bukan frame halus; penghalusan tidak bertahan.')
  }
  if (hasil.interaktif.rasio > 1.6) {
    gagal.push(`Frame interaktif memakai ${hasil.interaktif.rasio.toFixed(2)}x; cap hemat 1.5x hilang dan fill-rate saat memutar tidak lagi terlindungi.`)
  }
}
if (gagal.length) { console.error('\nGAGAL:\n- ' + gagal.join('\n- ')); process.exit(1) }
console.log(`\nBody3D refine lulus: interaktif ${hasil.interaktif.rasio.toFixed(2)}x, diam ${hasil.halus.rasio.toFixed(2)}x pada layar ${dpr}x.`)
