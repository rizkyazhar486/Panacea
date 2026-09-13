// Apakah ada lapisan mengambang yang menimpa bilah atas?
//
// Spanduk kutipan harian dipasang `fixed top-4 z-[60]`, sementara bilah atas
// hanya z-10 dan tingginya 66px di layar 390px. Hasilnya: SELURUH baris
// navigasi -- menu, kembali, judul halaman, pencarian, notifikasi, profil dan
// keluar -- tertutup pengingat harian, dan karena spanduknya menerima
// penunjuk, tombol di bawahnya juga tidak bisa ditekan sampai spanduk ditutup.
//
// Tidak ada uji unit yang bisa menangkap ini: markupnya benar, komponennya
// benar, dan keduanya lolos tsc. Yang salah hanya letaknya di layar, dan itu
// hanya terlihat kalau benar-benar dilihat.
import { chromium } from '@playwright/test'

const url = process.env.BILAH_QA_URL || 'http://127.0.0.1:4173/#/latihan?t=pelatih'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, reducedMotion: 'reduce',
})
await context.addInitScript(() => {
  const account = {
    email: 'bilah-qa@localhost.test', name: 'Top bar QA', role: 'pasien',
    isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01',
  }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(45_000)
const galat = []
page.on('pageerror', (e) => galat.push(e.message))

let gagal = null
try {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('header.kaca')
  await page.waitForTimeout(1500)

  // 1. Spanduk harian harus benar-benar TAMPIL -- kalau tidak, pemeriksaan ini
  //    lulus tanpa menguji apa pun, persis cara gerbang kehilangan artinya.
  const adaSpanduk = await page.evaluate(() => [...document.querySelectorAll('div')]
    .some((d) => /TODAY.S REMINDER/i.test(d.textContent || '') && getComputedStyle(d).position === 'fixed'))
  if (!adaSpanduk) throw new Error('spanduk harian tidak tampil, jadi tumpang-tindihnya tidak teruji sama sekali')

  // 2. Tidak boleh ada apa pun yang MENUTUPI bilah atas.
  //
  // Diuji dengan menembak titik, bukan dengan membandingkan persegi panjang.
  // Versi pertama membandingkan perpotongan kotak dan langsung menuduh lapisan
  // latar dekoratif `fixed inset-0 z-0` -- yang memang memotong bilah, tetapi
  // berada DI BAWAHNYA. Menebak urutan tumpukan dari z-index tidak dapat
  // diandalkan begitu ada konteks penumpukan baru; menanyakan "apa yang
  // teratas di titik ini" menjawab pertanyaan yang sebenarnya.
  //
  // Batas yang diakui: lapisan yang menutupi secara VISUAL tetapi memakai
  // pointer-events:none tidak akan terlihat oleh elementFromPoint. Yang
  // dijaga di sini adalah tertutupnya navigasi, dan itu selalu melibatkan
  // lapisan yang menerima penunjuk.
  const titikTertutup = await page.evaluate(() => {
    const bilah = document.querySelector('header.kaca')
    const b = bilah.getBoundingClientRect()
    const keluar = []
    for (let fx = 0.05; fx <= 0.95; fx += 0.1) {
      for (let fy = 0.25; fy <= 0.75; fy += 0.25) {
        const x = b.left + b.width * fx
        const y = b.top + b.height * fy
        const e = document.elementFromPoint(x, y)
        if (!e) continue
        if (e.closest('header.kaca')) continue
        keluar.push(`(${Math.round(x)},${Math.round(y)}) tertutup ${e.tagName}.${String(e.className).slice(0, 50)}`)
      }
    }
    return keluar
  })
  if (titikTertutup.length) {
    throw new Error(`bilah atas tertutup lapisan lain di ${titikTertutup.length} titik: ${titikTertutup.slice(0, 3).join(' | ')}`)
  }

  // 3. Tombol bilah atas harus benar-benar bisa ditekan, bukan sekadar terlihat.
  //    Terlihat tetapi tertutup lapisan transparan adalah kegagalan yang sama.
  const nama = ['Search', 'Notifications', 'Open menu']
  const tertutup = []
  for (const n of nama) {
    const tombol = page.getByRole('button', { name: new RegExp(n, 'i') }).first()
    if (!(await tombol.count())) continue
    const kotak = await tombol.boundingBox()
    if (!kotak) { tertutup.push(`${n}: tidak punya kotak`); continue }
    const atas = await page.evaluate(([x, y]) => {
      const e = document.elementFromPoint(x, y)
      return e && e.closest('header.kaca') ? 'bilah' : `${e?.tagName}.${String(e?.className).slice(0, 40)}`
    }, [kotak.x + kotak.width / 2, kotak.y + kotak.height / 2])
    if (atas !== 'bilah') tertutup.push(`${n}: yang teratas di titik itu adalah ${atas}`)
  }
  if (tertutup.length) throw new Error(`tombol bilah atas tertutup: ${tertutup.join(' | ')}`)

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth)
  if (lebar > 390) throw new Error(`Halaman meluber mendatar: ${lebar}px`)
  if (galat.length) throw new Error(`Galat halaman: ${galat.join(' | ')}`)

  console.log(
    `Bilah atas lulus: spanduk harian tampil dan TIDAK menimpa bilah, ${nama.length} tombol navigasi ` +
    'benar-benar teratas di titiknya, lebar halaman 390px, nol galat halaman.',
  )
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`Bilah atas GAGAL: ${gagal.message}`)
  process.exit(1)
}
