// Apakah tur hepatobilier benar-benar menggambar dan bergerak?
//
// Panel ini memakai AtlasViewer3D bersama, jadi ia bisa lolos tsc, build dan uji
// unit sambil menggambar nol piksel atau macet di stop pertama. Yang diperiksa:
// kanvas panel ini hidup (WebGL), tur punya cukup stop, tombol Next/Previous
// benar-benar memindahkan stop, memilih struktur mengubah pilihan, dan halaman
// tidak meluber di 390px atau melempar galat.
import { chromium } from '@playwright/test'

const url = process.env.HEPATOBILIARY3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
const CHROME = process.env.HEPATOBILIARY3D_QA_CHROME || undefined

// Diturunkan dari TOUR di HepatobiliaryPancreasTour3D.tsx (enam stop terdaftar).
// Kalau daftar stop berubah, gerbang inilah yang harus diperbarui secara sadar.
const STOP_MINIMUM = 5

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
  // loginAt harus BARU: store.tsx membuang sesi yang lebih tua dari tujuh hari.
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(60_000)
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

let gagal = null
let ringkasan = ''
try {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Abdominal regions' }).first().click()

  const canvas = page.locator('canvas[data-hepatobiliary3d="true"]')
  await canvas.waitFor({ state: 'attached' })

  const sehat = await canvas.evaluate((n) => {
    const gl = n.getContext('webgl2') || n.getContext('webgl')
    return { webgl: Boolean(gl), lost: gl ? gl.isContextLost() : true }
  })
  if (!sehat.webgl || sehat.lost) throw new Error(`WebGL tidak sehat: ${JSON.stringify(sehat)}`)

  const penghitung = page.getByText(/^Stop \d+ of \d+$/)
  await penghitung.first().waitFor({ state: 'attached' })
  const baca = async () => {
    const t = (await penghitung.first().textContent()) || ''
    const m = /Stop (\d+) of (\d+)/.exec(t)
    if (!m) throw new Error(`Penghitung stop tidak terbaca: "${t}"`)
    return { sekarang: Number(m[1]), total: Number(m[2]) }
  }

  const awal = await baca()
  if (awal.sekarang !== 1) throw new Error(`Tur harus mulai di stop 1, dapat ${awal.sekarang}`)
  if (awal.total < STOP_MINIMUM) throw new Error(`Tur harus punya >= ${STOP_MINIMUM} stop, dapat ${awal.total}`)

  const sebelumnya = page.getByRole('button', { name: /Previous/ })
  const berikutnya = page.getByRole('button', { name: /Next/ })
  if (!(await sebelumnya.isDisabled())) throw new Error('Previous harus nonaktif di stop pertama')

  await berikutnya.click()
  await page.waitForTimeout(300)
  const kedua = await baca()
  if (kedua.sekarang !== 2) throw new Error(`Next harus memindah ke stop 2, dapat ${kedua.sekarang}`)
  await sebelumnya.click()
  await page.waitForTimeout(300)
  if ((await baca()).sekarang !== 1) throw new Error('Previous harus kembali ke stop 1')

  // Sampai stop terakhir: Next harus nonaktif di sana, bukan berputar diam-diam.
  for (let i = 1; i < awal.total; i += 1) { await berikutnya.click(); await page.waitForTimeout(150) }
  const akhir = await baca()
  if (akhir.sekarang !== awal.total) throw new Error(`Harus berhenti di stop ${awal.total}, dapat ${akhir.sekarang}`)
  if (!(await berikutnya.isDisabled())) throw new Error('Next harus nonaktif di stop terakhir')

  // Memilih struktur harus benar-benar mengubah pilihan.
  const struktur = page.locator('[data-hepatobiliary-tour3d] button[aria-pressed]').filter({ hasNotText: /tour/i })
  const jumlahStruktur = await struktur.count()
  if (jumlahStruktur < 1) throw new Error('Stop terakhir tidak menampilkan struktur yang bisa dipilih')
  await struktur.last().click()
  await page.waitForTimeout(300)
  if ((await struktur.last().getAttribute('aria-pressed')) !== 'true') throw new Error('Memilih struktur tidak menandainya terpilih')

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth)
  if (lebar > 390) throw new Error(`Halaman meluber mendatar: ${lebar}px`)
  if (pageErrors.length) throw new Error(`Galat halaman: ${pageErrors.join(' | ')}`)

  ringkasan =
    `Hepatobilier 3D lulus: WebGL hidup, ${awal.total} stop, Next/Previous memindah stop dan berhenti di ujung, ` +
    `memilih struktur menandainya terpilih, dan scrollWidth = ${lebar}px.`
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`Hepatobilier 3D GAGAL: ${gagal.message}`)
  process.exit(1)
}
console.log(ringkasan)
