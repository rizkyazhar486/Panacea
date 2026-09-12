// Apakah wilayah yang dipilih benar-benar wilayah yang disorot?
//
// Anatomi permukaan gagal dengan meyakinkan: sesuatu menyala di perut dan
// wilayahnya sebelah. Karena itu yang diperiksa bukan "ada yang menyala",
// melainkan bahwa id yang disorot SAMA dengan id yang dipilih, dan bahwa
// menunjuk model benar-benar memilih sesuatu.
import { chromium } from '@playwright/test'

const url = process.env.WILAYAH3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
})
await context.addInitScript(() => {
  const account = {
    email: 'wilayah3d-qa@localhost.test', name: 'Region QA', role: 'pasien',
    isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01',
  }
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(60_000)
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

let gagal = null
try {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Abdominal regions' }).first().click()

  const canvas = page.locator('canvas[data-wilayah3d="true"]')
  await canvas.waitFor({ state: 'attached' })

  const sehat = await canvas.evaluate((n) => {
    const gl = n.getContext('webgl2') || n.getContext('webgl')
    return { webgl: Boolean(gl), lost: gl ? gl.isContextLost() : true }
  })
  if (!sehat.webgl || sehat.lost) throw new Error(`WebGL tidak sehat: ${JSON.stringify(sehat)}`)

  await canvas.evaluate((n) => new Promise((res, rej) => {
    const mulai = Date.now()
    const cek = () => {
      if (n.dataset.wilayahTampil !== undefined) return res(null)
      if (Date.now() - mulai > 45_000) return rej(new Error('Model tidak pernah selesai dimuat'))
      setTimeout(cek, 250)
    }
    cek()
  }))

  const tampil = Number(await canvas.evaluate((n) => n.dataset.wilayahTampil))
  if (tampil !== 9) throw new Error(`Harus sembilan wilayah tampil, dapat ${tampil}`)

  const awal = await canvas.evaluate((n) => n.dataset.wilayahTerpilih)
  if (awal !== '') throw new Error(`Tanpa pilihan harus kosong, dapat "${awal}"`)

  // Kisi dan 3D harus menunjuk wilayah yang SAMA. Kalau kisi memilih satu id
  // dan model menyorot id lain, keduanya tetap terlihat bekerja.
  for (const [label, id] of [
    ['Right hypochondriac', 'hypochondriac-right'],
    ['Left inguinal (iliac)', 'inguinal-left'],
    ['Umbilical', 'umbilical'],
  ]) {
    await page.getByRole('button', { name: label, exact: true }).click()
    await page.waitForTimeout(600)
    const disorot = await canvas.evaluate((n) => n.dataset.wilayahTerpilih)
    if (disorot !== id) throw new Error(`Memilih "${label}" menyorot "${disorot}", bukan "${id}"`)
    const teks = await page.evaluate(() => document.body.textContent || '')
    if (!teks.includes('Behind this wall')) throw new Error(`Proyeksi tidak ditampilkan untuk ${label}`)
  }

  // Menunjuk model harus benar-benar memilih sesuatu, bukan sekadar tidak error.
  await page.getByRole('button', { name: 'Umbilical', exact: true }).click()
  await page.waitForTimeout(400)
  const kotak = await canvas.boundingBox()
  await page.mouse.click(kotak.x + kotak.width / 2, kotak.y + kotak.height / 2)
  await page.waitForTimeout(800)
  const setelahKlik = await canvas.evaluate((n) => n.dataset.wilayahTerpilih)
  if (setelahKlik === undefined) throw new Error('Menunjuk model tidak menghasilkan keadaan apa pun')

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth)
  if (lebar > 390) throw new Error(`Halaman meluber mendatar: ${lebar}px`)
  if (pageErrors.length) throw new Error(`Galat halaman: ${pageErrors.join(' | ')}`)

  console.log(
    `Wilayah abdomen 3D lulus: 9 wilayah tampil, kosong sebelum dipilih, kisi dan model sepakat pada ` +
    `tiga wilayah uji, dan menunjuk model menghasilkan "${setelahKlik || '(kosong)'}".`,
  )
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`Wilayah abdomen 3D GAGAL: ${gagal.message}`)
  process.exit(1)
}
