import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Titik penunjuk gambar di Home harus punya area tekan >= 24px (WCAG 2.2 target size) tanpa mengubah tampilan titik 7px.
// Diukur di browser 390x844 sebelum perbaikan: lebar tombol 7px (aktif 20px). Uji ini menjaga aturan CSS-nya.
const css = readFileSync(new URL('../../src/styles/superpage-convergence.css', import.meta.url), 'utf8')

function blok(selektor) {
  const awal = css.indexOf(`${selektor} {`)
  assert.ok(awal >= 0, `aturan "${selektor}" tidak ditemukan`)
  const akhir = css.indexOf('}', awal)
  return css.slice(awal, akhir)
}
const px = (b, prop) => {
  const m = b.match(new RegExp(`(?:^|[;{\\s])${prop}:\\s*(\\d+(?:\\.\\d+)?)px`))
  assert.ok(m, `properti ${prop} tidak ada`)
  return Number(m[1])
}

test('area_tekan_titik_slider_minimal_24px', () => {
  const tombol = blok('.pmd-slider-dots button')
  assert.ok(px(tombol, 'width') >= 24, 'lebar area tekan < 24px')
  assert.ok(px(tombol, 'height') >= 24, 'tinggi area tekan < 24px')
})

test('tombol_titik_transparan_dan_titik_visual_tetap_7px_aktif_20px', () => {
  // Pasangan: area tekan membesar, tetapi tampilan titik tidak boleh ikut membesar.
  assert.match(blok('.pmd-slider-dots button'), /background:\s*transparent/)
  const titik = blok('.pmd-slider-dots button::before')
  assert.equal(px(titik, 'width'), 7)
  assert.equal(px(titik, 'height'), 7)
  const aktif = blok('.pmd-slider-dots button[aria-current]::before')
  assert.equal(px(aktif, 'width'), 20)
  assert.match(aktif, /background:\s*#22d3ee/)
})

test('aturan_lama_tombol_7px_tidak_kembali', () => {
  const tombol = blok('.pmd-slider-dots button')
  assert.equal(px(tombol, 'width') === 7 || px(tombol, 'height') === 7, false)
  assert.doesNotMatch(css, /\.pmd-slider-dots button\[aria-current\] \{ width: 20px/)
})

test('kontrol_pengurai_menolak_aturan_yang_tidak_ada', () => {
  assert.throws(() => blok('.pmd-slider-dots-tidak-ada button'), /tidak ditemukan/)
})
