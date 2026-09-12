// Apakah kerangkanya benar-benar tergambar, dan apakah yang menyala benar?
//
// Kanvas yang ada tetapi kosong adalah kegagalan khas berkas ini: tanpa
// MeshoptDecoder, GLTFLoader menolak skeletal.glb tanpa galat apa pun dan yang
// tersisa hanya kotak abu-abu yang meyakinkan. Karena itu yang diperiksa di
// sini bukan "ada kanvas", melainkan: berapa kelompok yang benar-benar terikat
// ke mesh, bahwa TIDAK ADA yang menyala sebelum ada pilihan, dan bahwa memilih
// satu kelompok menyalakan kelompok ITU — bukan tetangganya.
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const url = process.env.KERANGKA3D_QA_URL || 'http://127.0.0.1:4198/#/body-explorer'
const jalurPeramban = process.env.KERANGKA3D_QA_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

// Jumlah kelompok yang diharapkan dibaca dari katalognya sendiri, supaya
// menambah kelompok tanpa mengikatnya ke mesh tetap ketahuan di sini.
const katalog = await import('../../src/lib/anatomy/rangkaKerangka.ts').catch(() => null)
const DIHARAPKAN = katalog?.KELOMPOK_TULANG?.length ?? hitungDariSumber()

// Node tidak selalu bisa mengimpor .ts langsung. Kalau begitu jumlahnya dihitung
// dari sumbernya — bukan dari angka tetap yang diam-diam menjadi basi.
function hitungDariSumber() {
  const src = readFileSync(new URL('../../src/lib/anatomy/rangkaKerangka.ts', import.meta.url), 'utf8')
  const blok = src.slice(src.indexOf('KELOMPOK_TULANG:'), src.indexOf('export interface TidakDibawa'))
  const n = (blok.match(/^\s{4}id: '/gm) || []).length
  if (!n) throw new Error('Tidak bisa menghitung jumlah kelompok dari rangkaKerangka.ts')
  return n
}

const browser = await chromium.launch({
  headless: true,
  executablePath: jalurPeramban,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
})
await context.addInitScript(() => {
  const account = {
    email: 'qa@localhost.test', name: 'QA', role: 'pasien',
    isSubscriber: false, loggedAt: '2026-09-12T00:00:00Z', sex: 'L', dob: '1990-01-01',
  }
  // loginAt HARUS sekarang: store.tsx membuang sesi yang lebih tua dari
  // SESSION_TTL, dan `loginAt: 1` (1970) membuat peramban mendarat di halaman
  // masuk — kanvas tidak pernah ada dan ujinya menguji halaman yang salah.
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(60_000)
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

let gagal = null
let ringkas = ''
try {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Skeleton', exact: true }).first().click()

  const canvas = page.locator('canvas[data-kerangka3d="true"]')
  await canvas.waitFor({ state: 'attached' })

  const sehat = await canvas.evaluate((n) => {
    const gl = n.getContext('webgl2') || n.getContext('webgl')
    return { webgl: Boolean(gl), lost: gl ? gl.isContextLost() : true }
  })
  if (!sehat.webgl || sehat.lost) throw new Error(`WebGL tidak sehat: ${JSON.stringify(sehat)}`)

  await canvas.evaluate((n) => new Promise((res, rej) => {
    const mulai = Date.now()
    const cek = () => {
      if (n.dataset.kerangkaTerikat !== undefined) return res(null)
      if (Date.now() - mulai > 45_000) return rej(new Error('Model tidak pernah selesai dimuat'))
      setTimeout(cek, 250)
    }
    cek()
  }))

  // Terikat ke mesh yang NYATA, bukan sekadar ada di katalog.
  const terikat = Number(await canvas.evaluate((n) => n.dataset.kerangkaTerikat))
  if (terikat !== DIHARAPKAN) {
    throw new Error(`Harus ${DIHARAPKAN} kelompok terikat ke mesh, dapat ${terikat} — ada kelompok yang tidak pernah menyala`)
  }
  const jumlahMesh = Number(await canvas.evaluate((n) => n.dataset.kerangkaMesh))
  if (!(jumlahMesh > 250)) throw new Error(`Hanya ${jumlahMesh} mesh tulang termuat — berkasnya tidak terbaca utuh`)

  // Sebelum ada pilihan, tidak boleh ada yang menyala.
  const awal = await canvas.evaluate((n) => n.dataset.kerangkaTerpilih)
  if (awal !== '') throw new Error(`Tanpa pilihan harus kosong, dapat "${awal}"`)

  // Daftar dan model harus menunjuk kelompok yang SAMA. Kalau daftar memilih
  // satu id dan model menyorot id lain, keduanya tetap terlihat bekerja.
  for (const [label, id] of [
    ['Forearm (radius and ulna)', 'forearm'],
    ['Cervical spine (C1–C7)', 'cervical-spine'],
    ['Tarsus (ankle and hindfoot)', 'tarsus'],
    ['Cranial vault and base', 'cranial-vault'],
  ]) {
    await page.getByRole('button', { name: label, exact: true }).click()
    await page.waitForTimeout(500)
    const disorot = await canvas.evaluate((n) => n.dataset.kerangkaTerpilih)
    if (disorot !== id) throw new Error(`Memilih "${label}" menyorot "${disorot}", bukan "${id}"`)
    const teks = await page.evaluate(() => document.body.textContent || '')
    if (!teks.includes('Articulations')) throw new Error(`Artikulasi tidak ditampilkan untuk ${label}`)
  }

  // Memilih ulang harus melepas pilihan, bukan mengunci kerangka menyala.
  await page.getByRole('button', { name: 'Cranial vault and base', exact: true }).click()
  await page.waitForTimeout(400)
  const setelahLepas = await canvas.evaluate((n) => n.dataset.kerangkaTerpilih)
  if (setelahLepas !== '') throw new Error(`Melepas pilihan meninggalkan "${setelahLepas}"`)

  // Menunjuk model harus benar-benar memilih sesuatu yang ada di katalog.
  await page.getByRole('button', { name: 'Thigh (femur and patella)', exact: true }).click()
  await page.waitForTimeout(400)
  const kotak = await canvas.boundingBox()
  await page.mouse.click(kotak.x + kotak.width / 2, kotak.y + kotak.height / 2)
  await page.waitForTimeout(700)
  const setelahKlik = await canvas.evaluate((n) => n.dataset.kerangkaTerpilih)
  if (!setelahKlik) throw new Error('Menunjuk model tidak memilih kelompok apa pun')

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth)
  if (lebar !== 390) throw new Error(`Lebar halaman harus 390px, dapat ${lebar}px`)
  if (pageErrors.length) throw new Error(`Galat halaman: ${pageErrors.join(' | ')}`)

  ringkas =
    `Kerangka 3D lulus: ${terikat} kelompok terikat ke ${jumlahMesh} mesh tulang, kosong sebelum dipilih, ` +
    `daftar dan model sepakat pada empat kelompok uji, melepas pilihan bersih, menunjuk model memilih ` +
    `"${setelahKlik}", scrollWidth ${lebar}px, 0 galat halaman.`
  console.log(ringkas)
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`Kerangka 3D GAGAL: ${gagal.message}`)
  process.exit(1)
}
