// F2 — gerbang pengukur kontras: menjalankan `ukur` pada halaman fixture dengan latar/teks di berbagai ruang warna (rgb, oklch, color(), hex)
// dan memastikan rasio dinilai benar. Cacat yang dijaga: latar oklch() dibaca transparan -> jatuh ke latar halaman -> positif/negatif palsu.
//   node scripts/qa/kontras-ukur.fixture.mjs      (PLAYWRIGHT_MODULE / CHROME opsional, sama dengan kontras-wcag.mjs)
import { ukur } from './kontras-ukur.mjs'
const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const chromium = pw.chromium ?? pw.default.chromium
// Tiap kasus: id (muncul di pesan gagal), latar, warna teks, dan hasil yang diharapkan (true = harus GAGAL AA). Ambang AA teks normal 4.5:1.
const KASUS = [
  { id: 'krem-oklch-cokelat-lulus', bg: 'oklch(0.987 0.022 95.277)', fg: 'rgb(146,64,14)', gagal: false, ruang: true },
  { id: 'gelap-color-teal-gagal', bg: 'color(srgb 0.008 0.012 0.024)', fg: 'rgb(21,94,117)', gagal: true, ruang: true },
  { id: 'putih-767676-lulus-batas', bg: '#ffffff', fg: '#767676', gagal: false },
  { id: 'putih-777777-gagal-batas', bg: '#ffffff', fg: '#777777', gagal: true, ruang: false },
  { id: 'putih-oklch03-lulus', bg: 'rgb(255,255,255)', fg: 'oklch(0.3 0 0)', gagal: false },
  { id: 'putih-oklch085-gagal', bg: 'rgb(255,255,255)', fg: 'oklch(0.85 0 0)', gagal: true, ruang: true },
  { id: 'gelap-rgb-terang-lulus', bg: 'rgb(2,3,6)', fg: 'rgb(220,230,240)', gagal: false },
  { id: 'ukuran0-teks-pudar-diabaikan', bg: 'rgb(255,255,255)', fg: '#aaaaaa', gagal: false, fs: '0px', takTerukur: true },
  { id: 'ukuran9-teks-pudar-gagal', bg: 'rgb(255,255,255)', fg: '#aaaaaa', gagal: true, ruang: false, fs: '9px' },
]
// `ukur` memotong teks ke 30 karakter; id lebih panjang tidak akan pernah cocok dan membuat kasus 'lulus' vacuous.
for (const k of KASUS) if (k.id.length > 30) throw new Error(`id fixture > 30 karakter: ${k.id}`)
const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:rgb(2,4,7)">${KASUS.map((k, i) => `<div style="background:${k.bg};padding:8px"><span id="k${i}" style="color:${k.fg};font:${k.fs ? k.fs + '/1.4 sans-serif;display:inline-block;width:12px;height:12px;overflow:hidden' : '16px/1.4 sans-serif'}">${k.id}</span></div>`).join('')}${[0, 280].map((offset, i) => `<div data-one-shape="explicit" style="position:relative;width:420px;height:48px;background:rgb(67,69,72)"><span class="pmd-one-shape" style="position:absolute;left:${offset}px;top:0;width:180px;height:46px;background:white;opacity:1"></span><a data-one-shape-active="true" style="position:relative;z-index:1;display:inline-block;margin:8px;color:black;font:16px sans-serif">${i ? 'shape-uncovered-gagal' : 'shape-covered-lulus'}</a></div>`).join('')}</body>`
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
let hasil
try {
  const page = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage()
  await page.setContent(html)
  hasil = await page.evaluate(ukur)
} finally { await browser.close() }
const masalah = []
for (const k of KASUS) {
  const gagal = hasil.gagal.some((g) => g.teks === k.id)
  const g = hasil.gagal.find((x) => x.teks === k.id)
  if (g && g.ruang !== k.ruang) masalah.push(`${k.id}: penanda ruang-warna ${g.ruang}, seharusnya ${k.ruang}`)
  if (gagal !== k.gagal) masalah.push(`${k.id}: ${k.gagal ? 'seharusnya GAGAL tetapi lulus' : 'seharusnya LULUS tetapi gagal'}`)
}
// Sibling backing must be measured only when it genuinely covers the text.
for (const [id, expectedFail] of [['shape-covered-lulus', false], ['shape-uncovered-gagal', true]]) {
  const failed = hasil.gagal.some(x => x.teks === id)
  if (failed !== expectedFail) masalah.push(`${id}: ${expectedFail ? 'must fail without coverage' : 'must pass with measured white coverage'}`)
}
// latar yang tak terselesaikan tidak boleh diam-diam menjadi lulus: tidak ada kasus fixture yang boleh jatuh ke penghitung terpisah
if ((hasil.latarTakTerselesaikan || 0) !== 0 || hasil.tidakDapatDiukur !== 0) masalah.push(`kasus fixture jatuh ke penghitung tak-terukur (latarTakTerselesaikan=${hasil.latarTakTerselesaikan || 0}, tidakDapatDiukur=${hasil.tidakDapatDiukur})`)
const diharap = KASUS.filter((k) => !k.takTerukur).length + 2
if (hasil.teksDiukur !== diharap) masalah.push(`teksDiukur ${hasil.teksDiukur} != ${diharap}`)
if (masalah.length) { console.error('kontras-ukur.fixture GAGAL:\n - ' + masalah.join('\n - ')); process.exit(1) }
console.log(`kontras-ukur.fixture: ${KASUS.length} kasus (lulus dan gagal berpasangan, batas 4.54/4.48, ruang warna oklch/color/hex/rgb) sesuai harapan`)
