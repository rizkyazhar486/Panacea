// Apakah kendali panel benar-benar MENGUBAH sesuatu?
//
// Tujuh panel dibangun dalam satu sesi kerja, dan tiap satu diperiksa di
// peramban SATU KALI, dengan tangan. Tidak satu pun dijaga sesudahnya. Kalau
// besok sebuah penggeser berhenti mengubah gambarnya, tsc lulus, build lulus,
// seluruh uji satuan lulus, dan tidak ada yang tahu -- karena uji satuan
// menguji pustakanya, bukan panelnya.
//
// Gerbang ini menutup selisih antara "pernah diperiksa" dan "dijaga".
//
// PANELNYA DITEMUKAN DARI SUMBER, bukan didaftar tangan. Daftar tangan akan
// basi pada panel berikutnya yang ditambahkan -- dan panel berikutnya itu
// justru yang paling mungkin belum diperiksa siapa pun.
//
// YANG DITUNTUT SENGAJA LONGGAR: setiap penggeser harus mengubah SESUATU, entah
// gambarnya atau angkanya. Menuntut tiap penggeser menggerakkan sebuah kurva
// akan salah menuduh: massa tubuh pada panel neraca panas hanya mengubah
// laju °C/jam, dan tidak ada sumbu untuk itu; jumlah sumber pada panel desibel
// juga begitu. Keduanya benar. Yang TIDAK pernah benar adalah kendali yang
// tidak mengubah apa pun sama sekali.
import { chromium } from '@playwright/test'
import { pilihAktivitasBodyExposure } from './body-exposure-activity-helper.mjs'
import { readFileSync, existsSync } from 'node:fs'

const url = process.env.KENDALI_QA_URL || 'http://127.0.0.1:4173/#/body-explorer'

// ── Temukan panel SVG bertuas dari sumbernya ─────────────────────────────
function temukanPanel() {
  const src = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')
  const awal = src.indexOf('const PANEL_TABS')
  const blok = src.slice(awal, src.indexOf('\n]', awal))
  const tabs = [...blok.matchAll(/key: '([^']+)', label: '([^']+)'/g)].map((m) => ({ key: m[1], label: m[2] }))
  const lazy = [...src.matchAll(/const (\w+) = lazy\(\(\) => import\('\.\/bodyhub\/(\w+)'/g)]
  const berkasKomponen = new Map(lazy.map((m) => [m[1], m[2]]))
  const keluar = []
  for (const t of tabs) {
    const m = new RegExp(`panelTab === '${t.key}'[\\s\\S]{0,300}?<(\\w+)\\s*/>`).exec(src)
    if (!m) continue
    const berkas = berkasKomponen.get(m[1])
    if (!berkas) continue
    const p = `src/pages/bodyhub/${berkas}.tsx`
    if (!existsSync(p)) continue
    const isi = readFileSync(p, 'utf8')
    // Hanya panel SVG: panel 3D punya gerbangnya sendiri dan jauh lebih lambat.
    if (!/type="range"/.test(isi) || !/role="img"/.test(isi)) continue
    if (/<canvas|WebGLRenderer|useRef<HTMLCanvasElement/.test(isi)) continue
    keluar.push({ ...t, berkas })
  }
  return keluar
}

const PANEL = temukanPanel()
if (PANEL.length < 4) {
  throw new Error(`Hanya ${PANEL.length} panel ditemukan dari sumber; penemuannya kemungkinan rusak`)
}

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
// reducedMotion: perilakunya menjadi pasti, bukan diperlombakan dengan animasi.
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, reducedMotion: 'reduce',
})
await context.addInitScript(() => {
  const account = {
    email: 'kendali-qa@localhost.test', name: 'Control QA', role: 'pasien',
    isSubscriber: false, loggedAt: new Date().toISOString(), sex: 'L', dob: '1990-01-01',
  }
  // Sesi yang lebih tua dari tujuh hari dibuang store.tsx, dan pemeriksaan ini
  // akan "lulus" di halaman masuk tanpa menguji apa pun.
  localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account, loginAt: Date.now() }))
  localStorage.setItem('panacea_onboarded_v1', '1')
  localStorage.setItem('panacea_assessment_prompt_v1', '1')
})

const page = await context.newPage()
page.setDefaultTimeout(45_000)
const galat = []
page.on('pageerror', (e) => galat.push(e.message))

/**
 * Menulis nilai lewat SETTER ASLI, bukan lewat `el.value`.
 *
 * React melacak nilai input lewat descriptor properti. Menulis `el.value`
 * langsung melewati pelacak itu, sehingga onChange dianggap "tidak berubah" dan
 * diabaikan DIAM-DIAM. Versi pertama pemeriksaan ini melakukan persis itu dan
 * melaporkan penggeser yang sehat sebagai mati -- dua kali. Hasil peramban yang
 * negatif tidak berarti apa-apa sampai probenya terbukti menyentuh yang diukur.
 */
async function setel(slider, nilai) {
  await slider.evaluate((el, val) => {
    const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    d.set.call(el, String(val))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, nilai)
  await page.waitForTimeout(320)
}

const potret = async () => ({
  svg: await page.$$eval('svg[role="img"]', (n) => n.map((x) => x.outerHTML)),
  angka: await page.$$eval('.font-\\[var\\(--font-angka\\)\\]', (n) => n.map((x) => x.textContent.trim())),
})

await page.goto(url, { waitUntil: 'networkidle' })

const ringkas = []
for (const p of PANEL) {
  await pilihAktivitasBodyExposure(page, p.label)
  await page.waitForSelector('svg[role="img"]', { timeout: 45_000 })

  const sliders = await page.$$('input[type=range]')
  if (sliders.length === 0) throw new Error(`${p.label}: panel bertuas tetapi tidak ada penggeser yang dirender`)

  const mati = []
  for (const s of sliders) {
    const nama = await s.getAttribute('aria-label')
    const min = Number(await s.getAttribute('min'))
    const maks = Number(await s.getAttribute('max'))
    const kini = Number(await s.evaluate((el) => el.value))
    // Geser ke ujung yang JAUH dari nilai sekarang, supaya perubahannya besar.
    const tujuan = kini > (min + maks) / 2 ? min + (maks - min) * 0.1 : min + (maks - min) * 0.9

    const sebelum = await potret()
    await setel(s, tujuan)
    const sesudah = await potret()

    const gambarBerubah = sesudah.svg.some((h, i) => h !== sebelum.svg[i])
    const angkaBerubah = sesudah.angka.some((x, i) => x !== sebelum.angka[i])
    if (!gambarBerubah && !angkaBerubah) mati.push(nama ?? '(tanpa label)')
  }

  if (mati.length > 0) {
    throw new Error(
      `${p.label} (${p.berkas}): kendali ini tidak mengubah apa pun -- tidak gambarnya, tidak angkanya: ` +
      `${mati.join(', ')}. Sebuah kendali yang tidak mengubah apa pun tidak melaporkan galat apa pun.`,
    )
  }
  ringkas.push(`${p.label}: ${sliders.length}`)
}

const luber = await page.evaluate(() => document.documentElement.scrollWidth)
if (luber > 390) throw new Error(`Halaman meluber ke samping: scrollWidth ${luber} pada lebar 390`)
if (galat.length > 0) throw new Error(`Galat halaman saat menggerakkan kendali: ${galat.join(' | ')}`)

console.log(`Kendali panel lulus: ${PANEL.length} panel, tiap penggeser mengubah sesuatu (${ringkas.join(', ')}); scrollWidth ${luber}, tanpa galat halaman.`)

await browser.close()
