// Benarkah setiap fitur dapat dicapai dalam DUA ketukan dari layar mana pun?
//
// scripts/uji/jangkauan-dua-ketukan.mts membuktikan katalognya lengkap dengan
// membaca source. Itu perlu, tapi tidak cukup: katalog yang lengkap tidak ada
// gunanya kalau kotak pencariannya sendiri tidak terbuka oleh satu ketukan, atau
// hasilnya tidak benar-benar memindahkan halaman. Yang satu memeriksa daftar;
// yang ini memeriksa jari.
//
// Jadi berkas ini benar-benar MENGETUK, di layar 390x844 dengan sentuhan:
//   ketukan 1 -> tombol cari di bilah atas
//   ketikan   -> nama fitur
//   ketukan 2 -> hasil pertama
// lalu memastikan URL-nya benar-benar berpindah ke rute yang dijanjikan.
//
// Tujuan ujinya dipilih dari yang DULU yatim: sebelum perbaikan ini ketiganya
// tidak ada di katalog mana pun, sehingga tidak ada jalur dua ketukan sama
// sekali dan satu-satunya cara membukanya adalah mengetik URL sendiri.
import { chromium } from '@playwright/test'

const url = process.env.DUA_KETUKAN_QA_URL || 'http://127.0.0.1:4173/#/'

// [yang diketik, rute yang harus tercapai]
const SASARAN = [
  ['Nutrition Centre', '/gizi'],
  ['Medical Translator', '/translator'],
  ['Overview', '/ikhtisar'],
]

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, reducedMotion: 'reduce',
})
await context.addInitScript(() => {
  const account = {
    email: 'dua-ketukan-qa@localhost.test', name: 'Two tap QA', role: 'pasien',
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

const gagal = []
try {
  for (const [ketikan, ruteHarapan] of SASARAN) {
    await page.goto(url, { waitUntil: 'networkidle' })
    // Router berbasis hash tidak memuat ulang halaman, sehingga posisi gulir
    // dari sasaran sebelumnya ikut terbawa — dan bilah atas yang memang
    // menyingkir saat digulir akan tampak "hilang" karena alasan yang tidak ada
    // hubungannya dengan yang sedang diuji. Dikembalikan ke puncak dulu.
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForSelector('header.kaca', { state: 'visible' })
    await page.waitForTimeout(600)

    const sebelum = page.url()

    // KETUKAN 1 — tombol cari, yang harus ada di bilah atas setiap halaman.
    const tombolCari = page.locator('header button[aria-label*="Search" i]').first()
    if (await tombolCari.count() === 0) {
      gagal.push(`${ketikan}: tombol cari tidak ada di bilah atas — jalur dua ketukan tidak punya ketukan pertama`)
      continue
    }
    await tombolCari.tap()

    // Kotaknya diambil DARI DALAM dialog. Halaman di belakang modal punya
    // input ber-placeholder juga, dan `input[placeholder]` global akan
    // mengetik ke sana — uji lalu gagal seolah pencariannya rusak padahal yang
    // salah hanya sasaran ketikannya.
    const dialog = page.locator('[role="dialog"][aria-label="Search"]')
    const kotak = dialog.locator('input').first()
    await kotak.waitFor({ state: 'visible', timeout: 10_000 })
    await page.waitForTimeout(300)
    await kotak.fill(ketikan)
    await page.waitForTimeout(900)

    // KETUKAN 2 — hasil berlabel persis, DI DALAM dialog. Dibatasi ke dialog
    // dengan sengaja: halaman di belakangnya punya tautannya sendiri, dan
    // mengetuk salah satunya akan meloloskan uji ini tanpa kotak pencarian
    // pernah benar-benar dipakai.
    // Tiap hasil adalah <button> berisi DUA span (label + grup), jadi teks
    // tombolnya "Nutrition CentreHealth" dan pencocokan persis pada tombol
    // tidak akan pernah kena. Yang dicocokkan persis adalah span labelnya,
    // lalu naik ke tombol yang memuatnya.
    const hasil = dialog
      .locator('span', { hasText: new RegExp(`^${ketikan}$`, 'i') })
      .locator('xpath=ancestor::button[1]')
      .first()
    if (await hasil.count() === 0) {
      gagal.push(`${ketikan}: mengetik namanya tidak memunculkan hasil apa pun di kotak pencarian`)
      continue
    }
    await hasil.tap()
    await page.waitForTimeout(1200)

    const sesudah = page.url()
    if (!sesudah.includes(ruteHarapan)) {
      gagal.push(`${ketikan}: dua ketukan berakhir di ${sesudah}, bukan ${ruteHarapan} (sebelumnya ${sebelum})`)
      continue
    }
    console.log(`  ✓ ${ketikan.padEnd(20)} dua ketukan -> ${ruteHarapan}`)
  }
} finally {
  await browser.close()
}

if (galat.length) gagal.push(`galat halaman: ${galat.slice(0, 3).join(' | ')}`)

if (gagal.length) {
  console.error('dua-ketukan-smoke GAGAL:')
  for (const g of gagal) console.error('  - ' + g)
  process.exit(1)
}
console.log(`dua-ketukan-smoke: ${SASARAN.length}/${SASARAN.length} fitur tercapai dalam dua ketukan di 390x844`)
