import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

// Bukti di peramban sungguhan untuk gambar yang dibagikan dari kartu debrief.
//
// Tiga hal yang dilaporkan pengguna dari gambar hasil share, dan harus tetap
// tertutup: hurufnya jatuh ke serif bawaan, cip tombol share ikut tercetak di
// dalam gambarnya sendiri, dan stempel "Panaceamed.id" menimpa baris teks
// terakhir.
//
// Skrip ini TIDAK mengganti tata letak produksi dan tidak menyuntikkan HTML
// pengganti. Ia menekan tombol share yang sebenarnya pada halaman yang
// sebenarnya, lalu membaca kanvas yang benar-benar diekspor dengan membungkus
// toBlob -- jalur produksi yang sama, hanya diamati.

const url = process.env.SHARE_QA_URL || 'http://127.0.0.1:4188/#/latihan?t=pelatih'
const shotPath = process.env.SHARE_QA_SCREENSHOT || 'artifacts/share-card-export-390x844.png'
await mkdir('artifacts', { recursive: true })

const mulai = new Date(Date.now() - 20 * 3600_000)
const hr = []
for (let t = 0; t <= 2400; t += 30) hr.push({ t, bpm: 150 + Math.round(25 * Math.sin(t / 240)) })
const sesi = {
  id: 'share-qa-1',
  nama: 'Running',
  mulai: mulai.toISOString(),
  selesai: new Date(mulai.getTime() + 2400_000).toISOString(),
  durasi: 2400,
  jarakKm: 5.12,
  kcal: 430,
  avgHr: 157,
  maxHr: 177,
  minHr: 96,
  paceSec: 471,
  hr,
  pemulihan: [{ t: 0, bpm: 165 }, { t: 60, bpm: 144 }],
  hrr1: 21,
}
const tema = process.env.SHARE_QA_THEME || 'light'

const browser = await chromium.launch({ headless: true, executablePath: process.env.SHARE_QA_CHROME || undefined })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await context.addInitScript((payload) => {
  const account = { email: 'share-qa@localhost.test', name: 'Share QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1995-01-01' }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('pmd_workouts_v1', JSON.stringify([payload]))
  // Tema diuji pada dua sisi: kartu ini memakai warna teks terang, jadi latar
  // yang diukur harus ikut gelap -- kalau tidak, gambar keluar abu-abu di atas
  // putih dan nyaris tak terbaca.
  localStorage.setItem('pmd-theme', payload.__tema || 'light')
  // Bungkus toBlob supaya kanvas yang BENAR-BENAR diekspor bisa dibaca dari
  // Node. Tidak ada perilaku produksi yang diubah: hasilnya diteruskan apa
  // adanya ke pemanggil aslinya.
  // html2canvas menempelkan iframe klon ke dokumen selama merender. Isi iframe
  // itu adalah apa yang benar-benar dipotret, jadi ia diperiksa langsung --
  // jauh lebih tegas daripada menebak wilayah piksel. Pemeriksaan piksel yang
  // dipakai lebih dulu terbukti lulus JUGA ketika cip share masih ikut
  // tercetak, artinya ia tidak memeriksa apa pun.
  const pasangPengamat = () => { new MutationObserver((rekaman) => {
    for (const r of rekaman) for (const n of r.addedNodes) {
      if (!(n instanceof HTMLIFrameElement)) continue
      const baca = () => {
        const d = n.contentDocument
        const kartu = d && d.querySelector('.pmd-share-export')
        if (!kartu) return false
        const judul = kartu.querySelector('h2')
        // Gaya terhitung hanya tersedia selama iframe klon masih terpasang.
        // Begitu html2canvas melepasnya, defaultView menjadi null dan
        // getComputedStyle melempar -- galatnya harus terlihat, bukan hilang
        // di dalam callback interval.
        const tampilan = n.contentWindow && n.contentWindow.getComputedStyle
        if (!tampilan) { window.__cloneError = 'iframe klon sudah terlepas sebelum gaya terbaca'; return false }
        const gs = (el) => n.contentWindow.getComputedStyle(el)
        window.__cloneProbe = {
          adaTombolShare: Boolean(d.querySelector('[title="Share this card"], [aria-label="Share this card"]')),
          hurufBadan: gs(kartu).fontFamily,
          hurufJudul: judul ? gs(judul).fontFamily : null,
          judulKapital: judul ? gs(judul).textTransform : null,
          pitaBawah: gs(kartu).paddingBottom,
          latar: gs(kartu).backgroundColor,
          warnaJudul: judul ? gs(judul).color : null,
        }
        return true
      }
      const bacaAman = () => { try { return baca() } catch (e) { window.__cloneError = String(e && e.message || e); return false } }

      // Jajak pendapat berkala TIDAK cukup di sini: html2canvas melepas iframe
      // klonnya segera setelah merender, sehingga ada celah di mana kelas kulit
      // sudah terpasang tetapi contentWindow sudah hilang. Terukur: pemeriksaan
      // yang sama lulus atau gagal hanya karena pekerjaan lain di sekitarnya
      // menggeser waktu beberapa milidetik.
      //
      // Maka perubahan di dalam dokumen klon diamati langsung, jadi pembacaan
      // terjadi pada mutasi yang memasang kelas itu -- selagi iframe-nya masih
      // terpasang.
      const pasangDalam = () => {
        const d = n.contentDocument
        if (!d || !d.documentElement) return false
        new MutationObserver(() => { bacaAman() })
          .observe(d.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
        bacaAman()
        return true
      }
      if (!pasangDalam()) n.addEventListener('load', pasangDalam)
      // Cadangan, kalau mutasinya terjadi sebelum pengamat terpasang.
      const jam = setInterval(() => { if (bacaAman()) clearInterval(jam) }, 4)
      setTimeout(() => clearInterval(jam), 8000)
    }
  }).observe(document.documentElement, { childList: true, subtree: true }) }
  // addInitScript berjalan sebelum documentElement ada.
  if (document.documentElement) pasangPengamat()
  else document.addEventListener('readystatechange', function sekali() { if (document.documentElement) { pasangPengamat(); document.removeEventListener('readystatechange', sekali) } })

  const asli = HTMLCanvasElement.prototype.toBlob
  HTMLCanvasElement.prototype.toBlob = function (cb, ...rest) {
    window.__shareExport = { width: this.width, height: this.height, dataUrl: this.toDataURL('image/png') }
    return asli.call(this, cb, ...rest)
  }
}, { ...sesi, __tema: tema })

const page = await context.newPage()
const pageErrors = []
const consoleErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
// Permintaan huruf yang GAGAL di jaringan. Dipakai untuk membedakan "lembar
// gayanya tidak pernah sampai" dari "hurufnya ada tetapi tidak dipakai".
const hurufGagal = []
page.on('requestfailed', (r) => {
  if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) hurufGagal.push(r.url().slice(0, 80))
})

const hasil = { tema, kontras: null, fontsLoaded: null, cardFont: null, chipRect: null, cardRect: null, exportSize: null, clone: null, pageErrors, consoleErrors }
try {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  if (res && !res.ok()) throw new Error(`Training returned HTTP ${res.status()}`)

  // Beberapa dialog onboarding menumpuk pada muat pertama (panduan pengguna
  // baru, ajakan asesmen awal). Ditutup satu per satu sampai tidak ada lagi.
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

  const tombol = page.getByRole('button', { name: /Share this card/i }).first()
  await tombol.waitFor({ state: 'visible', timeout: 30_000 })
  await tombol.scrollIntoViewIfNeeded()

  // Huruf ekspor harus benar-benar tersedia. Kalau Oxanium tidak termuat,
  // kulit ekspor diam-diam jatuh ke huruf berikutnya dan "futuristik" hilang
  // tanpa satu pun galat.
  //
  // TIDAK memakai document.fonts.check(). Fungsi itu menjawab "bisakah teks ini
  // digambar", bukan "apakah hurufnya termuat" -- dan untuk keluarga yang TIDAK
  // punya @font-face sama sekali ia mengembalikan TRUE, karena tidak ada yang
  // tertunda dan peramban akan memakai huruf pengganti. Akibatnya terbalik:
  // ketika seluruh lembar gaya Google Fonts gagal diambil, document.fonts
  // kosong (0 entri) dan gerbang ini justru mencetak "huruf termuat" -- lulus
  // paling meyakinkan tepat pada keadaan yang paling rusak. Terverifikasi:
  // 0 FontFace, dua permintaan huruf gagal, ketiga check() mengembalikan true.
  //
  // Yang ditanyakan sekarang: adakah @font-face yang COCOK, dan apakah ia
  // benar-benar berstatus 'loaded' setelah diminta memuat.
  hasil.fontsLoaded = await page.evaluate(async () => {
    await document.fonts.ready
    const periksa = async (spek, keluarga) => {
      let cocok = []
      try { cocok = await document.fonts.load(spek) } catch { cocok = [] }
      const nama = keluarga.toLowerCase()
      const semua = []
      document.fonts.forEach((f) => {
        if (f.family.replace(/["']/g, '').toLowerCase() === nama) semua.push(f.status)
      })
      return {
        dideklarasikan: semua.length > 0,
        termuat: cocok.length > 0 && cocok.every((f) => f.status === 'loaded'),
        status: semua,
      }
    }
    return {
      total: document.fonts.size,
      inter: await periksa('400 16px Inter', 'Inter'),
      oxanium: await periksa('800 20px Oxanium', 'Oxanium'),
      mono: await periksa('400 14px "JetBrains Mono"', 'JetBrains Mono'),
    }
  })
  hasil.hurufGagal = hurufGagal

  const kartu = tombol.locator('xpath=ancestor::div[@class][1]/ancestor::div[1]')
  hasil.cardFont = await kartu.evaluate((el) => getComputedStyle(el).fontFamily)
  hasil.chipRect = await tombol.boundingBox()
  hasil.cardRect = await page.evaluate(() => {
    const b = document.querySelector('[title="Share this card"], [aria-label="Share this card"]')
    if (!b) return null
    // Simpul yang dipotret adalah pembungkus ber-ref, yaitu leluhur terdekat
    // yang juga memuat judul kartu.
    let n = b.parentElement
    while (n && !n.querySelector('h2')) n = n.parentElement
    const r = (n?.parentElement ?? n).getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })

  await tombol.click()
  await page.waitForFunction(() => Boolean(window.__shareExport), null, { timeout: 60_000 })
  hasil.exportSize = await page.evaluate(() => ({ width: window.__shareExport.width, height: window.__shareExport.height }))

  // Cip tombol share tidak boleh ada di dalam gambar. Ikonnya putih terang di
  // atas cakram gelap, jadi keberadaannya terbaca sebagai piksel mendekati
  // putih di sudut kanan atas kartu ekspor. Wilayah itu disampel langsung.
  hasil.clone = await page.evaluate(() => window.__cloneProbe || null)

  // Kontras gambar ekspor, diukur dari pikselnya sendiri.
  //
  // Dua kali gagal di sini selama pengembangan: sekali hitam-di-atas-hitam
  // (kulit ekspor memaksakan gradien gelap pada halaman bermode terang), sekali
  // putih-di-atas-putih (permukaan diambil dari <body> yang tetap putih walau
  // temanya gelap). Keduanya lulus setiap pemeriksaan struktur. Hanya piksel
  // yang bisa menangkapnya.
  hasil.kontras = await page.evaluate(() => {
    const { dataUrl, width, height } = window.__shareExport
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = width; c.height = height
        const g = c.getContext('2d')
        g.drawImage(img, 0, 0)
        const d = g.getImageData(0, 0, width, Math.floor(height * 0.75)).data
        // Luma yang paling sering muncul adalah latar kartu: teks dan emoji
        // hanya menutupi sebagian kecil bidang. Rentang min-maks TIDAK bisa
        // dipakai di sini -- emoji merah dan jingga membuatnya lebar walaupun
        // seluruh teksnya sewarna dengan latar.
        const ember = new Array(32).fill(0)
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 40) continue
          const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
          ember[Math.min(31, Math.floor(l / 8))] += 1
        }
        let puncak = 0
        for (let i = 1; i < ember.length; i++) if (ember[i] > ember[puncak]) puncak = i
        const lumaLatar = puncak * 8 + 4
        resolve({ lumaLatar })
      }
      img.src = dataUrl
    })
  })

  await writeFile(shotPath.replace(/\.png$/, `-${tema}-export.png`),
    Buffer.from((await page.evaluate(() => window.__shareExport.dataUrl)).split(',')[1], 'base64'))
  await page.screenshot({ path: shotPath, animations: 'disabled', scale: 'css', timeout: 45_000 })
} finally {
  await browser.close()
}

const gagal = []
const dilewati = []

// Tiga keadaan yang berbeda, dan hanya dua di antaranya menyalahkan kodenya.
{
  const f = hasil.fontsLoaded
  // Aturannya presisi: kalau ADA permintaan huruf yang gagal di jaringan, apa
  // pun yang hilang sesudahnya adalah akibat jaringan, bukan akibat kode. Kalau
  // TIDAK ada permintaan yang gagal dan hurufnya tetap tidak ada, itu memang
  // cacat di repositori ini -- nama keluarga salah, tautan terhapus, atau
  // @font-face yang tidak pernah dideklarasikan.
  const takTerjangkau = (hasil.hurufGagal?.length ?? 0) > 0
  if (takTerjangkau) {
    // Lembar gaya hurufnya tidak pernah sampai. Itu pernyataan tentang jaringan
    // mesin ini, bukan tentang kartu ekspornya -- dan dicetak apa adanya alih-alih
    // menjadi "huruf termuat", yang dulu terjadi persis pada keadaan ini.
    // DILEWATI, bukan digagalkan. Menggagalkan di sini berarti gerbang ini
    // memerahkan setiap PR karena mesinnya tidak bisa menghubungi penyedia
    // huruf pihak ketiga -- dan gerbang yang merah karena alasan yang bukan
    // urusan repositori ini mengajari orang mengabaikan warna merah. Seluruh
    // pemeriksaan lain di berkas ini tetap berjalan dan tetap menggagalkan
    // cacat sungguhan.
    dilewati.push(
      `Pemeriksaan huruf dilewati: ${hasil.hurufGagal.length} permintaan ke penyedia huruf gagal ` +
      `(${hasil.fontsLoaded?.total ?? 0} @font-face terdaftar). Ini pernyataan tentang jaringan mesin ` +
      'yang menjalankan gerbang ini, BUKAN bukti bahwa kartu ekspornya rusak. Huruf tetap ' +
      'diperiksa penuh di mana pun permintaannya berhasil.',
    )
  } else {
    for (const [kunci, nama, akibat] of [
      ['inter', 'Inter', 'badan kartu ekspor akan memakai huruf pengganti'],
      ['oxanium', 'Oxanium', 'judul ekspor kehilangan huruf hero-nya'],
      ['mono', 'JetBrains Mono', 'kolom metrik ekspor tidak lagi lebar-tetap'],
    ]) {
      const k = f?.[kunci]
      if (!k?.dideklarasikan) {
        gagal.push(`${nama} tidak punya @font-face sama sekali; ${akibat}, dan tidak ada yang pernah mencoba memuatnya.`)
      } else if (!k.termuat) {
        gagal.push(`${nama} dideklarasikan tetapi tidak termuat (status ${k.status.join(', ')}); ${akibat}.`)
      }
    }
  }
}
if (!hasil.exportSize || hasil.exportSize.width < 100) gagal.push('Tidak ada kanvas yang diekspor: penangkapan gagal sebelum toBlob.')
if (/serif/i.test(hasil.cardFont || '') && !/sans-serif/i.test(hasil.cardFont || '')) gagal.push(`Kartu hidup memakai serif: ${hasil.cardFont}`)
const k = hasil.clone
if (!k) gagal.push('Klon penangkapan tidak terbaca: kulit ekspor .pmd-share-export tidak pernah terpasang.')
else {
  if (k.adaTombolShare) gagal.push('Tombol share masih ada di dalam klon; ia akan ikut tercetak di gambarnya sendiri.')
  if (!/Inter/.test(k.hurufBadan)) gagal.push(`Badan klon memakai ${k.hurufBadan}, bukan Inter -- inilah kegagalan serif itu.`)
  if (/^\s*(serif|Times)/i.test(k.hurufBadan)) gagal.push(`Klon jatuh ke serif bawaan: ${k.hurufBadan}`)
  if (k.hurufJudul && !/Oxanium/.test(k.hurufJudul)) gagal.push(`Judul klon memakai ${k.hurufJudul}, bukan Oxanium.`)
  if (k.judulKapital !== 'uppercase') gagal.push(`Judul ekspor tidak dikapitalkan (${k.judulKapital}).`)
  if (parseFloat(k.pitaBawah) < 60) gagal.push(`Pita watermark hanya ${k.pitaBawah}; stempel akan menimpa baris teks terakhir.`)
}
// Warna judul diambil dari klon, latar dari piksel gambar jadinya. Selisih
// keduanya adalah pemeriksaan yang benar-benar menangkap hitam-di-atas-hitam
// maupun putih-di-atas-putih.
const lumaJudul = (() => {
  const m = /rgba?\(([^)]+)\)/.exec(hasil.clone?.warnaJudul || '')
  if (!m) return null
  const [r, g, b] = m[1].split(',').map((x) => parseFloat(x))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
})()
hasil.kontrasJudul = lumaJudul === null || !hasil.kontras ? null : Math.round(Math.abs(lumaJudul - hasil.kontras.lumaLatar))
if (hasil.kontrasJudul === null) gagal.push('Kontras judul terhadap latar tidak terukur.')
else if (hasil.kontrasJudul < 80) {
  gagal.push(`Judul hampir sewarna dengan latar gambar ekspor (selisih luma ${hasil.kontrasJudul}); gambarnya tidak terbaca.`)
}
if (pageErrors.length) gagal.push(`Galat halaman: ${pageErrors.join(' | ')}`)

console.log(JSON.stringify(hasil, null, 2))
if (dilewati.length) console.warn('\nDILEWATI:\n- ' + dilewati.join('\n- '))
if (gagal.length) { console.error('\nGAGAL:\n- ' + gagal.join('\n- ')); process.exit(1) }
console.log(
  '\nShare card export smoke lulus: ' +
  (dilewati.length ? 'huruf TIDAK diperiksa (lihat DILEWATI di atas)' : 'huruf benar-benar termuat') +
  ', kanvas terekspor, cip share tidak ikut tercetak.',
)
