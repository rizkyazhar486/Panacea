// Apakah tempat lesi yang disimpulkan benar-benar MENYALA di modelnya --
// dan benar-benar TIDAK menyala ketika geometrinya tidak ada?
//
// Yang kedua sama pentingnya. Menyorot struktur terdekat ketika tingkat itu
// tidak dikirim akan terlihat persis seperti berhasil, dan akan menunjukkan
// tempat lesi yang keliru pada model anatomi.
import { chromium } from '@playwright/test'

const url = process.env.LESI3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
})
await context.addInitScript(() => {
  const account = {
    email: 'lesi3d-qa@localhost.test', name: 'Lesion QA', role: 'pasien',
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
  await page.getByRole('button', { name: 'Localise a lesion' }).first().click()

  const canvas = page.locator('canvas[data-lesi3d="true"]')
  await canvas.waitFor({ state: 'attached' })

  const sehat = await canvas.evaluate((n) => {
    const gl = n.getContext('webgl2') || n.getContext('webgl')
    return { webgl: Boolean(gl), lost: gl ? gl.isContextLost() : true }
  })
  if (!sehat.webgl || sehat.lost) throw new Error(`WebGL tidak sehat: ${JSON.stringify(sehat)}`)

  await canvas.evaluate((n) => new Promise((res, rej) => {
    const mulai = Date.now()
    const cek = () => {
      if (n.dataset.strukturTampil !== undefined) return res(null)
      if (Date.now() - mulai > 45_000) return rej(new Error('Model tidak pernah selesai dimuat'))
      setTimeout(cek, 250)
    }
    cek()
  }))

  const tampil = Number(await canvas.evaluate((n) => n.dataset.strukturTampil))
  if (!(tampil > 0)) throw new Error(`Tidak ada struktur yang tampil: ${tampil}`)

  // Tanpa temuan, tidak boleh ada yang disorot.
  const awal = await canvas.evaluate((n) => n.dataset.mesSorot)
  if (awal !== '0') throw new Error(`Tanpa temuan harus nol sorotan, dapat ${awal}`)

  // Kasus terpandu menjalankan model penalarannya sampai ke sebuah tempat.
  const kasus = page.getByRole('button', { name: /^Case \d/ })
  const jumlahKasus = await kasus.count()
  if (jumlahKasus === 0) throw new Error('Tidak ada kasus terpandu untuk dijalankan')

  let pernahMenyala = false
  for (let i = 0; i < jumlahKasus; i += 1) {
    await kasus.nth(i).click()
    await page.waitForTimeout(1200)
    const sorot = Number(await canvas.evaluate((n) => n.dataset.mesSorot ?? '-1'))
    if (sorot < 0) throw new Error('Sorotan tidak terbaca')
    if (sorot > 0) pernahMenyala = true
    if (sorot === 0) {
      // Nol sorotan hanya boleh terjadi bersama penjelasan yang terlihat.
      const teks = await page.evaluate(() => document.body.textContent || '')
      if (!teks.includes('is not highlighted')) {
        throw new Error('Tidak ada yang disorot dan tidak ada penjelasan yang ditampilkan')
      }
    }
  }
  if (!pernahMenyala) throw new Error('Tidak ada satu pun kasus yang menyalakan struktur')

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth)
  if (lebar > 390) throw new Error(`Halaman meluber mendatar: ${lebar}px`)
  if (pageErrors.length) throw new Error(`Galat halaman: ${pageErrors.join(' | ')}`)

  console.log(
    `Lesi neuro 3D lulus: ${tampil} struktur tampil, nol sorotan tanpa temuan, ` +
    `${jumlahKasus} kasus dijalankan dan setiap nol-sorotan disertai penjelasan.`,
  )
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`Lesi neuro 3D GAGAL: ${gagal.message}`)
  process.exit(1)
}
