// Apakah tombol dengan sub-teks panjang tetap menjadi SATU target tekan?
//
// panacea-visual-first-v43.js mengubah setiap p/li/dd/figcaption/span/div di
// dalam main yang teksnya >=48 karakter menjadi target tekan tersendiri yang
// membuka dialog "Interpretation" -- kecuali elemen itu SENDIRI sebuah
// button/a/label/summary/[role=button]/[role=tab]. Pengecualiannya memeriksa
// apakah elemennya SENDIRI sebuah kendali, tapi tidak pernah memeriksa apakah
// elemennya adalah KETURUNAN sebuah kendali.
//
// Pola yang sangat umum di repositori ini -- <button><div>Judul</div>
// <div>Sub-teks panjang</div></button> -- karena itu berubah menjadi DUA
// target tekan yang bertumpuk: tombolnya sendiri, dan div sub-teksnya. Kasus
// nyata: "Case 1" pada panel lokalisasi lesi (LokalisasiLesiPanel.tsx) punya
// sub-teks 82 karakter ("Weakness and vibration loss on the right, pain and
// temperature loss on the left."). Menekan tombol itu membuka dialog
// interpretasi PADA SAAT YANG SAMA dengan menjalankan kasusnya -- dan karena
// dialognya modal, semua tekanan sesudahnya diblokir sampai dialognya
// ditutup manual. qa:lesi-3d menangkap ini sebagai timeout 60 detik menekan
// "Case 2": <dialog> milik Case 1 masih terbuka menutupi layar.
//
// Gerbang ini menguji ATURANNYA sendiri, bukan satu kasus lesi tertentu:
// dibuat cepat (tanpa WebGL/3D) supaya bisa dijalankan setiap kali, dan
// memuat panacea-visual-first-v43.js YANG SEBENARNYA dari server preview,
// bukan salinan yang ditulis ulang di sini.
import { chromium } from '@playwright/test'

const url = process.env.KENDALI_TB_QA_URL || 'http://127.0.0.1:4173/#/'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
page.setDefaultTimeout(20_000)
const galat = []
page.on('pageerror', (e) => galat.push(e.message))

let gagal = null
try {
  // Navigasi dulu supaya asalnya (origin) benar, lalu ganti isi <body>
  // dengan perlengkapan minimal -- skripnya sendiri tetap dimuat dari
  // berkas nyata di server yang sama.
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.setContent(`<!doctype html><html><body>
    <main>
      <button id="tombol-kasus" type="button" onclick="window.__ditekan = (window.__ditekan || 0) + 1">
        <div>Case 1 - Two sides at once</div>
        <div>Weakness and vibration loss on the right, pain and temperature loss on the left.</div>
      </button>
    </main>
  </body></html>`)
  await page.addScriptTag({ url: '/panacea-visual-first-v43.js' })
  await page.waitForTimeout(700) // requestIdleCallback + setTimeout(scan, 40) di dalam skrip

  const subTeks = page.locator('#tombol-kasus div').nth(1)
  const sebelum = await subTeks.evaluate((n) => ({
    dekorasi: n.dataset.pmdHasContext ?? null,
    tabIndex: n.tabIndex,
    role: n.getAttribute('role'),
  }))
  if (sebelum.dekorasi === 'true') {
    throw new Error(
      `the long sub-line inside the button was decorated as its own context target ` +
      `(tabIndex=${sebelum.tabIndex}, role=${sebelum.role}) -- a descendant of an interactive ` +
      `control must never become a second, competing click target`,
    )
  }

  await page.locator('#tombol-kasus').click()
  await page.waitForTimeout(300)

  const ditekan = await page.evaluate(() => window.__ditekan ?? 0)
  if (ditekan !== 1) throw new Error(`the button's own click handler fired ${ditekan} times, expected exactly 1`)

  const dialogTerbuka = await page.evaluate(() => {
    const d = document.getElementById('pmd-context-dialog')
    return Boolean(d && d.hasAttribute('open'))
  })
  if (dialogTerbuka) {
    throw new Error(
      'clicking the button also opened the global interpretation dialog. Because that dialog is modal, ' +
      'every click after it -- including the next real button on the page -- gets silently swallowed until ' +
      'a user manually dismisses a dialog they never asked to open.',
    )
  }

  if (galat.length) throw new Error(`Galat halaman: ${galat.join(' | ')}`)

  console.log(
    'kendali-tak-terbajak: ok (a long sub-line inside a button is not decorated, the button fires once, ' +
    'and no dialog opens behind its back)',
  )
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`kendali-tak-terbajak GAGAL: ${gagal.message}`)
  process.exit(1)
}
