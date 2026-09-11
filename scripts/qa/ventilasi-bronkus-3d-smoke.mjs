// Apakah bronkus segmental benar-benar BERWARNA dan benar-benar BERGERAK?
//
// Render 3D gagal dengan sunyi. Semua kegagalan di bawah ini sudah terjadi
// sekali saat membangun panel ini, dan tidak satu pun melempar pengecualian:
//
//   * visceral.glb dikirim terkompresi meshopt; tanpa setMeshoptDecoder,
//     GLTFLoader menolak berkasnya dan kanvas tetap kosong.
//   * Aturan sanitasi nama GLTFLoader berbeda antar versi three. Mencocokkan
//     dengan aturan yang salah memberi nol bronkus terikat, tanpa galat.
//
// Karena itu yang diperiksa bukan "kanvas ada", melainkan: delapan belas
// segmen terikat ke mesh, dan pengisian rata-ratanya NAIK dari waktu ke waktu.
import { chromium } from '@playwright/test'

const url = process.env.VENT3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
})
await context.addInitScript(() => {
  const account = {
    email: 'vent3d-qa@localhost.test', name: 'Ventilation QA', role: 'pasien',
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
  await page.getByRole('button', { name: 'Segmental ventilation' }).first().click()

  const canvas = page.locator('canvas[data-ventilasi3d="true"]')
  await canvas.waitFor({ state: 'attached' })

  const sehat = await canvas.evaluate((n) => {
    const gl = n.getContext('webgl2') || n.getContext('webgl')
    return { webgl: Boolean(gl), lost: gl ? gl.isContextLost() : true }
  })
  if (!sehat.webgl || sehat.lost) throw new Error(`WebGL tidak sehat: ${JSON.stringify(sehat)}`)

  await canvas.evaluate((n) => new Promise((res, rej) => {
    const mulai = Date.now()
    const cek = () => {
      if (n.dataset.segmenTerikat !== undefined) return res(null)
      if (Date.now() - mulai > 45_000) return rej(new Error('Model tidak pernah selesai dimuat'))
      setTimeout(cek, 250)
    }
    cek()
  }))

  const terikat = Number(await canvas.evaluate((n) => n.dataset.segmenTerikat))
  if (terikat !== 18) throw new Error(`Harus 18 segmen terikat ke mesh, dapat ${terikat}`)

  // Pengisian harus NAIK. Angka yang beku berarti model berjalan di kepala
  // sendiri sementara gambarnya tidak pernah ikut.
  const sampel = []
  for (let i = 0; i < 5; i += 1) {
    sampel.push(Number(await canvas.evaluate((n) => n.dataset.isiRerata ?? 'NaN')))
    await page.waitForTimeout(900)
  }
  if (sampel.some((v) => !Number.isFinite(v))) throw new Error(`Pengisian tidak terbaca: ${sampel}`)
  if (!(Math.max(...sampel) > Math.min(...sampel) + 0.02)) {
    throw new Error(`Pengisian tidak bergerak: ${sampel.join(', ')}`)
  }

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth)
  if (lebar > 390) throw new Error(`Halaman meluber mendatar: ${lebar}px`)
  if (pageErrors.length) throw new Error(`Galat halaman: ${pageErrors.join(' | ')}`)

  console.log(
    `Ventilasi bronkus 3D lulus: 18 segmen terikat ke mesh, pengisian bergerak ` +
    `${Math.min(...sampel).toFixed(3)} -> ${Math.max(...sampel).toFixed(3)}, tanpa galat, tanpa luberan.`,
  )
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`Ventilasi bronkus 3D GAGAL: ${gagal.message}`)
  process.exit(1)
}
