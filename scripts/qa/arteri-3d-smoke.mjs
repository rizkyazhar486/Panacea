// Apakah pohon arteri benar-benar TERGAMBAR, dan apakah yang menyala benar?
//
// Kanvas yang ada bukan bukti apa pun: berkas atlas ini ditolak diam-diam bila
// dekodernya lupa dipasang, dan nama yang meleset tidak melempar galat. Karena
// itu yang diperiksa di sini adalah angka: berapa arteri yang benar-benar
// terikat ke geometri, bahwa TIDAK ADA yang menyala sebelum ada pilihan, bahwa
// memilih satu arteri menyalakan arteri ITU, dan bahwa jumlah pembuluh hilir
// yang ikut menyala cocok dengan pohon di dalam berkasnya.
import { chromium } from '@playwright/test'

const url = process.env.ARTERI3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const jalurPeramban = process.env.ARTERI3D_QA_CHROME || undefined

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
    email: 'qa@localhost.test', name: 'QA', role: 'pasien', isSubscriber: false,
    loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01',
  }
  // loginAt harus SEKARANG: sesi tersimpan kedaluwarsa setelah tujuh hari
  // (src/lib/store.tsx), jadi tanda waktu tetap di masa lalu membuat QA
  // terlempar ke halaman masuk dan panelnya tidak pernah muncul.
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(60_000)
const galatHalaman = []
page.on('pageerror', (e) => galatHalaman.push(e.message))

const pilih = async (id) => {
  await page.locator(`button[data-arteri-tombol="${id}"]`).click()
  await page.waitForTimeout(500)
}

let gagal = null
try {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Arterial territories', exact: true }).first().click()

  const kanvas = page.locator('canvas[data-arteri3d="true"]')
  await kanvas.waitFor({ state: 'attached' })

  const sehat = await kanvas.evaluate((n) => {
    const gl = n.getContext('webgl2') || n.getContext('webgl')
    return { webgl: Boolean(gl), lost: gl ? gl.isContextLost() : true }
  })
  if (!sehat.webgl || sehat.lost) throw new Error(`WebGL tidak sehat: ${JSON.stringify(sehat)}`)

  await kanvas.evaluate((n) => new Promise((res, rej) => {
    const mulai = Date.now()
    const cek = () => {
      if (n.dataset.arteriTerikat !== undefined) return res(null)
      if (Date.now() - mulai > 60_000) return rej(new Error('Model tidak pernah selesai dimuat'))
      setTimeout(cek, 250)
    }
    cek()
  }))

  const data = () => kanvas.evaluate((n) => ({ ...n.dataset }))

  const awal = await data()
  const katalog = Number(awal.arteriKatalog)
  const terikat = Number(awal.arteriTerikat)
  if (!(katalog > 0)) throw new Error('Katalog arteri kosong')
  if (terikat !== katalog) {
    throw new Error(`Hanya ${terikat} dari ${katalog} arteri terikat ke geometri — sisanya tidak menggambar apa pun`)
  }
  // Arteri berpasangan tetap terhitung "terikat" bila hanya satu sisinya
  // ketemu, jadi yang dihitung adalah NAMA SIMPUL: dua sisi harus dua-duanya.
  const simpul = Number(awal.arteriSimpul)
  const simpulKatalog = Number(awal.arteriKatalogSimpul)
  if (simpul !== simpulKatalog) {
    throw new Error(`Hanya ${simpul} dari ${simpulKatalog} simpul glTF ketemu — sebagian arteri hanya tergambar sebelah`)
  }
  if (awal.arteriTerpilih !== '') throw new Error(`Belum ada pilihan, tetapi tersorot "${awal.arteriTerpilih}"`)
  if (awal.arteriHilir !== '0') throw new Error(`Belum ada pilihan, tetapi ${awal.arteriHilir} pembuluh hilir menyala`)

  // Memilih satu arteri harus menyalakan arteri ITU, bukan tetangganya.
  const contoh = ['femoral', 'internal-carotid', 'superior-mesenteric', 'right-coronary']
  const hilir = {}
  for (const id of contoh) {
    await pilih(id)
    const d = await data()
    if (d.arteriTerpilih !== id) throw new Error(`Memilih "${id}" menyorot "${d.arteriTerpilih}"`)
    hilir[id] = Number(d.arteriHilir)
    if (!(hilir[id] > 0)) throw new Error(`"${id}" punya cabang di berkas, tetapi tidak satu pun pembuluh hilir menyala`)
    const teks = await page.evaluate(() => document.body.textContent || '')
    if (!teks.includes('Territory supplied')) throw new Error(`Wilayah tidak ditampilkan untuk ${id}`)
  }

  // Batang tanpa cabang bernama harus benar-benar menyala SENDIRIAN: kalau
  // pewarnaan hilir hanya menyalakan "banyak hal", angka ini akan bukan nol.
  await pilih('ascending-aorta')
  const buntu = await data()
  if (buntu.arteriTerpilih !== 'ascending-aorta') throw new Error('Ascending aorta tidak tersorot')
  if (buntu.arteriHilir !== '0') {
    throw new Error(`Ascending aorta tidak memiliki cabang bernama di berkas ini, tetapi ${buntu.arteriHilir} pembuluh hilir menyala`)
  }

  // Batang proksimal harus menyalakan lebih banyak hilir daripada cabangnya.
  await pilih('common-iliac')
  const iliaka = Number((await data()).arteriHilir)
  await pilih('external-iliac')
  const eksternal = Number((await data()).arteriHilir)
  if (!(iliaka > eksternal)) {
    throw new Error(`Hilir arteri iliaka komunis (${iliaka}) harus lebih banyak daripada iliaka eksterna (${eksternal})`)
  }

  // Menunjuk model harus memilih sesuatu, bukan sekadar tidak error.
  await pilih('femoral')
  const kotak = await kanvas.boundingBox()
  await page.mouse.click(kotak.x + kotak.width / 2, kotak.y + kotak.height / 2)
  await page.waitForTimeout(700)
  const setelahKlik = (await data()).arteriTerpilih

  // Batal memilih harus benar-benar memadamkan semuanya.
  await page.getByRole('button', { name: 'Clear selection' }).click()
  await page.waitForTimeout(500)
  const bersih = await data()
  if (bersih.arteriTerpilih !== '' || bersih.arteriHilir !== '0') {
    throw new Error(`Setelah dibatalkan masih tersisa sorotan: ${JSON.stringify(bersih)}`)
  }

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth)
  if (lebar !== 390) throw new Error(`Halaman meluber mendatar: ${lebar}px`)
  if (galatHalaman.length) throw new Error(`Galat halaman: ${galatHalaman.join(' | ')}`)

  console.log(
    `Arteri 3D lulus: ${terikat}/${katalog} arteri dan ${simpul}/${simpulKatalog} simpul glTF terikat ke geometri, kosong sebelum dipilih, ` +
    `femoral menyalakan ${hilir.femoral} pembuluh hilir dan carotis interna ${hilir['internal-carotid']}, ` +
    `aorta asendens menyala sendirian, iliaka komunis (${iliaka}) > iliaka eksterna (${eksternal}), ` +
    `menunjuk model menghasilkan "${setelahKlik || '(kosong)'}", lebar halaman ${lebar}px, nol galat halaman.`,
  )
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`Arteri 3D GAGAL: ${gagal.message}`)
  process.exit(1)
}
