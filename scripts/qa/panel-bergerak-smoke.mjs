// Apakah panel yang MENGAKU berjalan benar-benar berjalan?
//
// Panel farmakodinamik melangkahkan kolam senesennya dengan
// requestAnimationFrame dan hanya menjalankan SATU bingkai. Ia lolos tsc, lolos
// build, lolos seluruh uji unit, dan terlihat benar -- karena nilai awalnya
// sudah berada di kesetimbangan, sehingga loop yang mati dan loop yang bekerja
// menampilkan angka yang sama persis.
//
// Itulah sebabnya gerbang ini MENGGANGGU dulu, baru menuntut gerakan. Menguji
// panel pada keadaan diamnya adalah cara paling mudah membuktikan tidak ada
// apa-apa.
import { chromium } from '@playwright/test'

const url = process.env.BERGERAK_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
})
await context.addInitScript(() => {
  const account = {
    email: 'gerak-qa@localhost.test', name: 'Motion QA', role: 'pasien',
    isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01',
  }
  // Waktu sekarang: sesi yang lebih tua dari tujuh hari dibuang store.tsx, dan
  // pemeriksaan ini akan "lulus" di halaman masuk tanpa menguji apa pun.
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(45_000)
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

/**
 * Potret geometri gambar panel.
 *
 * Dipilih lewat role="img" -- gambar panel memberi label aksesibel pada
 * SVG-nya, ikon tidak. Versi pertama gerbang ini memakai `document.querySelector('svg')`
 * dan mendapat ikon 62 karakter di bilah atas, lalu melaporkan panel ventilasi
 * "beku". Panelnya baik-baik saja; probenya yang salah sasaran. Sebuah hasil
 * negatif tidak berarti apa pun sampai terbukti ia mengukur benda yang dimaksud.
 */
const potretSvg = () => page.evaluate(() => {
  const svg = [...document.querySelectorAll('svg[role="img"]')]
    .sort((a, b) => b.innerHTML.length - a.innerHTML.length)[0]
  if (!svg) return ''
  return svg.innerHTML.length + ':' + (svg.innerHTML.match(/[\d.]+/g) || []).slice(0, 200).join(',')
})

/** Nilai satu ubin angka, dicari lewat labelnya. */
const ubin = (label) => page.evaluate((l) => {
  const el = [...document.querySelectorAll('div')]
    .find((d) => d.children.length === 0 && d.textContent.trim().toUpperCase() === l.toUpperCase())
  return el?.previousElementSibling?.textContent?.trim() ?? null
}, label)

// Panel ventilasi sengaja TIDAK ada di sini. Gerakannya adalah kanvas 3D, dan
// qa:ventilasi-3d sudah membuktikan pengisiannya naik. Menyertakannya berarti
// menguji hal yang sama dua kali sambil menyeret adegan WebGL ke dalam
// pemeriksaan yang seharusnya murni DOM -- dan di SwiftShader itulah yang
// membuat gerbang ini goyah, bukan cacat pada panelnya.
const PANEL = [
  {
    tab: 'Glomerular filtration',
    ganggu: async () => {},
    ukur: potretSvg,
    catatan: 'filtrate drops travel',
  },
  {
    tab: 'Oxygen delivery',
    ganggu: async () => {},
    ukur: potretSvg,
    catatan: 'the pressure-volume marker cycles',
  },
  {
    tab: 'Dose–response',
    // Kolam senesen DIAM di kesetimbangan sampai pembersihan dinaikkan. Menguji
    // tanpa gangguan ini persis kesalahan yang menyembunyikan loop mati itu.
    ganggu: async () => {
      const s = page.getByRole('slider', { name: 'Added clearance' })
      await s.fill('0.3')
      await s.dispatchEvent('change')
    },
    ukur: () => ubin('Burden now'),
    catatan: 'the senescent pool falls once clearance is raised',
  },
]

let gagal = null
try {
  await page.goto(url, { waitUntil: 'networkidle' })

  for (const p of PANEL) {
    await page.getByRole('button', { name: p.tab, exact: true }).first().click()
    await page.waitForTimeout(1200)
    await p.ganggu()
    await page.waitForTimeout(400)

    // Tunggu panelnya benar-benar ADA dulu. Bacaan pertama sering null karena
    // panel dimuat malas, dan membandingkan null dengan null adalah cara mudah
    // melaporkan "beku" untuk panel yang belum sempat muncul.
    let a = null
    for (let i = 0; i < 40 && (a === null || a === ''); i += 1) {
      a = await p.ukur()
      if (a === null || a === '') await page.waitForTimeout(250)
    }
    if (a === null || a === '') throw new Error(`${p.tab}: tidak menemukan apa pun untuk diukur`)

    // Diperiksa dengan MENJAJAKI, bukan dengan satu jeda tetap.
    //
    // Versi pertama menunggu 2,2 detik dan menyatakan panel ventilasi beku.
    // Panelnya tidak beku: jamnya maju 0,0 -> 0,5 detik selama enam detik,
    // karena ia berbagi CPU dengan adegan WebGL yang sedang memuat model 3,6 MB
    // di bawah SwiftShader. Ambang waktu yang terlalu ketat menuduh kode yang
    // benar, dan tuduhan palsu dari sebuah gerbang jauh lebih mahal daripada
    // gerbang yang lambat.
    //
    // Menjajaki membuatnya cepat ketika memang cepat, dan sabar ketika mesinnya
    // sibuk -- sambil tetap menangkap loop yang benar-benar mati, karena loop
    // mati tidak pernah berubah berapa lama pun ditunggu.
    let b = a
    const batasMs = 12_000
    const mulai = Date.now()
    while (b === a && Date.now() - mulai < batasMs) {
      await page.waitForTimeout(250)
      b = await p.ukur()
    }

    if (a === b) {
      throw new Error(
        `${p.tab}: tidak bergerak sama sekali dalam ${batasMs / 1000} detik (${p.catatan}). ` +
        `Nilai tetap "${String(a).slice(0, 40)}". Panel yang menjanjikan simulasi berjalan ` +
        'sementara loop-nya mati terlihat persis seperti panel yang bekerja.',
      )
    }
  }

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth)
  if (lebar > 390) throw new Error(`Halaman meluber mendatar: ${lebar}px`)
  if (pageErrors.length) throw new Error(`Galat halaman: ${pageErrors.join(' | ')}`)

  console.log(
    `Panel bergerak lulus: ${PANEL.length} panel yang mengaku berjalan benar-benar berubah dalam 2,2 detik, ` +
    'termasuk satu yang hanya bergerak setelah diganggu, lebar halaman 390px, nol galat halaman.',
  )
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`Panel bergerak GAGAL: ${gagal.message}`)
  process.exit(1)
}
