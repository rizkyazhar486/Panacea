// Apakah stasiun yang dipilih benar-benar stasiun yang disorot?
//
// Panel ini bisa gagal dengan sangat meyakinkan: daftarnya penuh, kanvasnya
// ada, WebGL-nya hidup, dan tidak satu pun mesh terikat -- atau yang menyala
// stasiun tetangga. Karena itu yang diperiksa BUKAN "ada kanvas", melainkan:
// berapa stasiun benar-benar terikat ke geometri, bahwa tidak ada yang menyala
// sebelum dipilih, dan bahwa id yang disorot SAMA dengan id yang dipilih.
import { chromium } from '@playwright/test'

const url = process.env.LIMFE3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const CHROME = process.env.LIMFE3D_QA_CHROME || undefined

// Angka ini diturunkan dari katalog, bukan ditebak. Kalau katalog berubah,
// gerbang inilah yang harus diperbarui secara sadar.
const STASIUN_DIHARAPKAN = 65
const MESH_DIHARAPKAN = 159

const browser = await chromium.launch({
  headless: true,
  ...(CHROME ? { executablePath: CHROME } : {}),
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
  // loginAt harus BARU: store.tsx membuang sesi yang lebih tua dari tujuh hari
  // dan mengembalikan pengguna ke halaman masuk, sehingga panelnya tidak pernah
  // muncul dan gerbang ini gagal karena alasan yang salah.
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(60_000)
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

let gagal = null
let catatan = ''
try {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Lymphoid system', exact: true }).first().click()

  const canvas = page.locator('canvas[data-limfe3d="true"]')
  await canvas.waitFor({ state: 'attached' })

  const sehat = await canvas.evaluate((n) => {
    const gl = n.getContext('webgl2') || n.getContext('webgl')
    return { webgl: Boolean(gl), lost: gl ? gl.isContextLost() : true }
  })
  if (!sehat.webgl || sehat.lost) throw new Error(`WebGL tidak sehat: ${JSON.stringify(sehat)}`)

  await canvas.evaluate((n) => new Promise((res, rej) => {
    const mulai = Date.now()
    const cek = () => {
      if (n.dataset.limfeStasiun !== undefined) return res(null)
      if (Date.now() - mulai > 45_000) return rej(new Error('Model tidak pernah selesai dimuat'))
      setTimeout(cek, 250)
    }
    cek()
  }))

  // Inti gerbang: mesh benar-benar TERIKAT. Nama yang tidak cocok dengan apa
  // pun tidak melempar galat, jadi angkanya yang harus dihitung.
  const stasiun = Number(await canvas.evaluate((n) => n.dataset.limfeStasiun))
  if (stasiun !== STASIUN_DIHARAPKAN) {
    throw new Error(`Harus ${STASIUN_DIHARAPKAN} stasiun terikat ke geometri, dapat ${stasiun}`)
  }
  const mesh = Number(await canvas.evaluate((n) => n.dataset.limfeMesh))
  if (mesh !== MESH_DIHARAPKAN) throw new Error(`Harus ${MESH_DIHARAPKAN} mesh terikat, dapat ${mesh}`)

  const awal = await canvas.evaluate((n) => n.dataset.limfeTerpilih)
  if (awal !== '') throw new Error(`Tanpa pilihan harus kosong, dapat "${awal}"`)

  // Daftar dan model harus menunjuk stasiun yang SAMA. Kalau daftar memilih
  // satu id dan model menyorot id lain, keduanya tetap terlihat bekerja.
  const kasus = [
    ['Head and neck', 'Jugulodigastric node', 'jugulodigastric', 'Palatine tonsil'],
    ['Abdomen', 'Coeliac nodes', 'coeliac', 'Stomach'],
    ['Lower limb', 'Popliteal nodes', 'popliteal', 'Knee joint'],
    ['Lymphoid organs', 'Thymus', 'thymus', 'T lymphocytes'],
  ]
  for (const [wilayah, label, id, buktiTeks] of kasus) {
    await page.getByRole('button', { name: wilayah, exact: true }).click()
    await page.getByRole('button', { name: label, exact: true }).click()
    await page.waitForTimeout(500)
    const disorot = await canvas.evaluate((n) => n.dataset.limfeTerpilih)
    if (disorot !== id) throw new Error(`Memilih "${label}" menyorot "${disorot}", bukan "${id}"`)
    const teks = await page.evaluate(() => document.body.textContent || '')
    if (!teks.includes('Drains from')) throw new Error(`Kartu aliran tidak muncul untuk ${label}`)
    if (!teks.includes(buktiTeks)) throw new Error(`Wilayah yang dialirkan tidak disebut untuk ${label}`)
  }

  // Memilih ulang stasiun yang sama harus melepas pilihan, dan model harus
  // kembali kosong -- bukan tetap menyala pada stasiun yang sudah tidak dipilih.
  await page.getByRole('button', { name: 'Thymus', exact: true }).click()
  await page.waitForTimeout(500)
  const setelahLepas = await canvas.evaluate((n) => n.dataset.limfeTerpilih)
  if (setelahLepas !== '') throw new Error(`Melepas pilihan meninggalkan "${setelahLepas}"`)

  // Batas berkas harus dinyatakan, bukan ditutupi dengan geometri pinjaman.
  const teksAkhir = await page.evaluate(() => document.body.textContent || '')
  for (const frasa of ['no thoracic duct', 'cisterna chyli']) {
    if (!teksAkhir.includes(frasa)) throw new Error(`Panel tidak menyatakan batas berkas: "${frasa}"`)
  }

  // Menunjuk model harus benar-benar memilih sesuatu.
  await page.getByRole('button', { name: 'Lymphoid organs', exact: true }).click()
  await page.getByRole('button', { name: 'Spleen', exact: true }).click()
  await page.waitForTimeout(1200)
  const kotak = await canvas.boundingBox()
  await page.mouse.click(kotak.x + kotak.width / 2, kotak.y + kotak.height / 2)
  await page.waitForTimeout(800)
  const setelahKlik = await canvas.evaluate((n) => n.dataset.limfeTerpilih)
  if (!setelahKlik) throw new Error('Menunjuk model tidak memilih stasiun apa pun')
  catatan = setelahKlik

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth)
  if (lebar > 390) throw new Error(`Halaman meluber mendatar: ${lebar}px`)
  if (pageErrors.length) throw new Error(`Galat halaman: ${pageErrors.join(' | ')}`)

  console.log(
    `Limfe 3D lulus: ${stasiun} stasiun / ${mesh} mesh terikat ke geometri, kosong sebelum dipilih, ` +
    `daftar dan model sepakat pada empat stasiun uji di empat wilayah, melepas pilihan mengosongkan ` +
    `sorotan, batas "tidak ada pembuluh limfe" dinyatakan di panel, menunjuk model memilih ` +
    `"${catatan}", dan scrollWidth = ${lebar}px.`,
  )
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`Limfe 3D GAGAL: ${gagal.message}`)
  process.exit(1)
}
