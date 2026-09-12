// Apakah model organ benar-benar TERGAMBAR, bukan sekadar terunduh?
//
// Gerbang ini ada karena kegagalan yang sangat spesifik dan sangat sunyi:
// sembilan berkas di public/organs terkompresi meshopt, dan OrganModel3D
// memuatnya tanpa dekoder. Berkasnya terunduh dengan status 200 setiap kali --
// jaringan terlihat sempurna -- lalu GLTFLoader menolaknya, dan penampil organ
// gagal untuk SELURUH sembilan organ tanpa satu pun galat konsol.
//
// Karena itu yang diperiksa bukan "berkasnya sampai", melainkan berapa mesh
// yang benar-benar masuk ke adegan.
import { chromium } from '@playwright/test'

const url = process.env.ORGAN3D_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'
// Satu organ per berkas sumber yang berbeda; semuanya terkompresi meshopt.
const ORGAN = ['Heart', 'Liver', 'Kidneys']

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
})
await context.addInitScript(() => {
  const account = {
    email: 'organ3d-qa@localhost.test', name: 'Organ QA', role: 'pasien',
    isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01',
  }
  // loginAt HARUS waktu sekarang: store.tsx membuang sesi yang lebih tua dari
  // tujuh hari, dan sesi kedaluwarsa mendaratkan pemeriksaan ini di halaman
  // masuk -- tempat semuanya "lulus" karena tidak ada yang diperiksa.
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(60_000)
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))
const unduhan = []
page.on('response', (r) => { if (/\/organs\/.*\.glb/.test(r.url())) unduhan.push([r.url().split('/').pop(), r.status()]) })

let gagal = null
try {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Organs', exact: true }).first().click()
  await page.waitForTimeout(1500)

  for (const organ of ORGAN) {
    await page.getByRole('button', { name: organ, exact: true }).first().click()

    const canvas = page.locator('canvas[data-organ-model3d="true"]')
    await canvas.waitFor({ state: 'attached' })

    const sehat = await canvas.evaluate((n) => {
      const gl = n.getContext('webgl2') || n.getContext('webgl')
      return { webgl: Boolean(gl), lost: gl ? gl.isContextLost() : true }
    })
    if (!sehat.webgl || sehat.lost) throw new Error(`${organ}: WebGL tidak sehat ${JSON.stringify(sehat)}`)

    // Menunggu SALAH SATU dari dua hasil, bukan hanya yang berhasil. Sebuah
    // pemuatan yang ditolak tidak pernah memanggil onLoad, jadi menunggu jumlah
    // mesh saja berakhir sebagai batas waktu 40 detik yang tidak menjelaskan
    // apa pun. Pesan gagal panel muncul seketika, dan itu yang ingin dibaca.
    const hasil = await Promise.race([
      canvas.evaluate((n) => new Promise((res) => {
        const cek = () => {
          if (n.dataset.organMesh !== undefined) return res({ mesh: Number(n.dataset.organMesh) })
          setTimeout(cek, 200)
        }
        cek()
      })),
      page.waitForFunction(
        () => (document.body.textContent || '').includes('Could not load this organ model.'),
        null, { timeout: 40_000 },
      ).then(() => ({ ditolak: true })).catch(() => new Promise(() => {})),
      new Promise((res) => setTimeout(() => res({ habisWaktu: true }), 45_000)),
    ])

    if (hasil.ditolak) {
      throw new Error(
        `${organ}: berkasnya terunduh tetapi penampil menolaknya. Ini yang terjadi ketika sebuah ` +
        'berkas terkompresi meshopt dimuat tanpa setMeshoptDecoder.',
      )
    }
    if (hasil.habisWaktu) throw new Error(`${organ}: model tidak pernah selesai dimuat dan tidak melapor gagal`)
    const jumlah = hasil.mesh

    // Inti gerbang ini. Nol mesh adalah tampilan persis dari berkas yang
    // terunduh sempurna lalu ditolak pemuat.
    if (!(jumlah > 0)) throw new Error(`${organ}: berkas terunduh tetapi NOL mesh masuk ke adegan`)

    const teks = await page.evaluate(() => document.body.textContent || '')
    if (teks.includes('Could not load this organ model.')) {
      throw new Error(`${organ}: penampil melaporkan gagal memuat`)
    }
  }

  const gagalUnduh = unduhan.filter(([, s]) => s >= 400)
  if (gagalUnduh.length) throw new Error(`Berkas organ gagal diunduh: ${JSON.stringify(gagalUnduh)}`)

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth)
  if (lebar > 390) throw new Error(`Halaman meluber mendatar: ${lebar}px`)
  if (pageErrors.length) throw new Error(`Galat halaman: ${pageErrors.join(' | ')}`)

  console.log(
    `Model organ 3D lulus: ${ORGAN.length} organ terkompresi meshopt masing-masing menggambar mesh ` +
    `(${unduhan.map(([n, s]) => `${n}:${s}`).join(', ')}), lebar halaman 390px, nol galat halaman.`,
  )
} catch (e) {
  gagal = e
} finally {
  await browser.close()
}
if (gagal) {
  console.error(`Model organ 3D GAGAL: ${gagal.message}`)
  process.exit(1)
}
