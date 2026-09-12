// Apakah kelenjar yang dipilih benar-benar kelenjar yang disorot?
//
// Panel ini memuat DUA berkas atlas, dan di situlah ia akan patah: berkas kedua
// bisa gagal, tiba terlambat, atau tiba di luar kotak batas kamera -- dan tidak
// satu pun dari itu melempar galat. Karena itu yang diperiksa bukan "ada kanvas"
// melainkan: jumlah struktur yang benar-benar terikat, tidak ada yang menyala
// sebelum dipilih, dan memilih sebuah struktur menyorot ID STRUKTUR ITU --
// termasuk satu struktur dari MASING-MASING berkas sumber.
import { chromium } from '@playwright/test'

const url = process.env.KELENJAR3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const DIHARAPKAN = 13

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
})
await context.addInitScript(() => {
  const account = {
    email: 'qa@localhost.test', name: 'QA', role: 'pasien',
    isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01',
  }
  // loginAt HARUS sekarang: store.tsx membuang sesi yang lebih tua dari 7 hari,
  // dan stempel tetap seperti "1" akan memulangkan halaman pendaratan tanpa
  // satu pun galat -- gerbangnya lalu gagal di tempat yang menyesatkan.
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(90_000)
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

let gagal = null
try {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Glands & urinary tract' }).first().click()

  const canvas = page.locator('canvas[data-kelenjar3d="true"]')
  await canvas.waitFor({ state: 'attached' })

  const sehat = await canvas.evaluate((n) => {
    const gl = n.getContext('webgl2') || n.getContext('webgl')
    return { webgl: Boolean(gl), lost: gl ? gl.isContextLost() : true }
  })
  if (!sehat.webgl || sehat.lost) throw new Error(`WebGL tidak sehat: ${JSON.stringify(sehat)}`)

  // Kedua berkas harus SELESAI. Atribut ini baru dipasang setelah keduanya tiba.
  await canvas.evaluate((n) => new Promise((res, rej) => {
    const mulai = Date.now()
    const cek = () => {
      if (n.dataset.kelenjarTampil !== undefined) return res(null)
      if (Date.now() - mulai > 75_000) return rej(new Error('Model tidak pernah selesai dimuat'))
      setTimeout(cek, 250)
    }
    cek()
  }))

  const tampil = Number(await canvas.evaluate((n) => n.dataset.kelenjarTampil))
  if (tampil !== DIHARAPKAN) {
    throw new Error(`Harus ${DIHARAPKAN} struktur terikat pada geometri, dapat ${tampil}` +
      ' — nama yang tidak cocok dengan apa pun tidak melempar galat, ia hanya tidak menggambar')
  }

  const awal = await canvas.evaluate((n) => n.dataset.kelenjarTerpilih)
  if (awal !== '') throw new Error(`Tanpa pilihan harus kosong, dapat "${awal}"`)

  // Satu struktur dari MASING-MASING berkas: hipotalamus hanya dikirim
  // nervous.glb, sisanya visceral.glb. Kalau berkas kedua diam-diam tidak
  // terpasang, hanya uji inilah yang akan melihatnya.
  for (const [label, id, catatan] of [
    ['Hypothalamus', 'hypothalamus', 'nervous.glb'],
    ['Thyroid gland', 'thyroid', 'visceral.glb'],
    ['4. Urinary bladder', 'bladder', 'visceral.glb'],
    ['Adrenal (suprarenal) glands', 'suprarenal', 'visceral.glb — berpasangan'],
  ]) {
    await page.getByRole('button', { name: label, exact: true }).click()
    await page.waitForTimeout(500)
    const disorot = await canvas.evaluate((n) => n.dataset.kelenjarTerpilih)
    if (disorot !== id) throw new Error(`Memilih "${label}" (${catatan}) menyorot "${disorot}", bukan "${id}"`)
  }

  // Teks harus ikut berubah, bukan hanya warnanya.
  const teks = await page.evaluate(() => document.body.textContent || '')
  if (!/Principal secretions|Role on the urinary path/.test(teks)) {
    throw new Error('Panel tidak menampilkan sekresi atau peran struktur yang dipilih')
  }
  if (!teks.includes('Not in this atlas')) throw new Error('Ketiadaan tidak dinyatakan di panel')

  // Menunjuk model harus benar-benar memilih sesuatu.
  const kotak = await canvas.boundingBox()
  await page.mouse.click(kotak.x + kotak.width / 2, kotak.y + kotak.height / 2)
  await page.waitForTimeout(700)
  const setelahKlik = await canvas.evaluate((n) => n.dataset.kelenjarTerpilih)
  if (!setelahKlik) throw new Error('Menunjuk model tidak menghasilkan pilihan apa pun')

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth)
  if (lebar > 390) throw new Error(`Halaman meluber mendatar: ${lebar}px`)
  if (pageErrors.length) throw new Error(`Galat halaman: ${pageErrors.join(' | ')}`)

  console.log(
    `Kelenjar & saluran kemih 3D lulus: ${tampil} struktur terikat dari dua berkas, kosong sebelum dipilih, ` +
    `daftar dan model sepakat pada empat struktur uji (termasuk satu dari nervous.glb), menunjuk model ` +
    `menghasilkan "${setelahKlik}", lebar halaman ${lebar}px, nol galat halaman.`,
  )
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`Kelenjar & saluran kemih 3D GAGAL: ${gagal.message}`)
  process.exit(1)
}
